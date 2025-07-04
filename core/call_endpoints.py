#!/usr/bin/env python3
"""
API endpoints for calls, code uploads, and emotion tracking
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import os
import uuid
import json
import logging

from .db import get_db
from .models import Call, CallParticipant, CallMessage, CallEmotion, CodeUpload, CodeReview, EmotionProfile

# Lazy imports for heavy modules to improve startup performance
def get_call_manager():
    from .calls.ai_call_manager import CallManager
    return CallManager()

def get_call_type():
    from .calls.ai_call_manager import CallType
    return CallType

def get_emotion_analyzer():
    from .calls.emotion_analyzer import AIEmotionAnalyzer
    return AIEmotionAnalyzer()

def get_code_manager():
    from .uploads.code_manager import CodeUploadManager
    return CodeUploadManager()

def get_rag_manager():
    from .memory.enhanced_rag import EnhancedRAGManager
    return EnhancedRAGManager()

logger = logging.getLogger(__name__)

router = APIRouter()

# Global variables for lazy-loaded managers
call_manager = None
emotion_analyzer = None
code_manager = None
rag_manager = None
audio_call_manager_instance = None

def get_call_manager():
    global call_manager
    if call_manager is None:
        from .calls.ai_call_manager import CallManager
        call_manager = CallManager()
    return call_manager

def get_emotion_analyzer():
    global emotion_analyzer
    if emotion_analyzer is None:
        from .calls.emotion_analyzer import AIEmotionAnalyzer
        emotion_analyzer = AIEmotionAnalyzer()
    return emotion_analyzer

def get_code_manager():
    global code_manager
    if code_manager is None:
        from .uploads.code_manager import CodeUploadManager
        code_manager = CodeUploadManager()
    return code_manager

def get_rag_manager():
    global rag_manager
    if rag_manager is None:
        from .memory.enhanced_rag import EnhancedRAGManager
        rag_manager = EnhancedRAGManager()
    return rag_manager

def get_audio_call_manager():
    global audio_call_manager_instance
    if audio_call_manager_instance is None:
        from .calls.audio_call_manager import audio_call_manager
        audio_call_manager_instance = audio_call_manager
    return audio_call_manager_instance

# Call Management Endpoints

@router.post("/calls/schedule")
async def schedule_call(
    call_type: str = Form(...),
    title: str = Form(...),
    description: str = Form(""),
    project_id: str = Form(...),
    creator_id: int = Form(...),
    scheduled_at: str = Form(...),
    participants: str = Form(...),  # JSON string of participant IDs
    db: Session = Depends(get_db)
):
    """Schedule a new call (1:1, client, or group)"""
    try:
        # Parse participants
        participant_list = json.loads(participants)
        
        # Create call
        call = Call(
            call_type=call_type,
            title=title,
            description=description,
            project_id=project_id,
            scheduled_at=datetime.fromisoformat(scheduled_at),
            status="scheduled"
        )
        
        db.add(call)
        db.commit()
        db.refresh(call)
        
        # Add creator as a participant
        creator_participant = CallParticipant(
            call_id=call.id,
            participant_type="user",
            participant_id=str(creator_id),
            participant_name="User"
        )
        db.add(creator_participant)
        
        # Add other participants
        for participant in participant_list:
            participant_obj = CallParticipant(
                call_id=call.id,
                participant_type=participant["type"],
                participant_id=participant["id"],
                participant_name=participant["name"]
            )
            db.add(participant_obj)
        
        db.commit()
        
        return {"message": "Call scheduled successfully", "call_id": call.id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/calls/{call_id}/start")
async def start_call(call_id: int, db: Session = Depends(get_db)):
    """Start a scheduled call"""
    try:
        call = db.query(Call).filter(Call.id == call_id).first()
        if not call:
            raise HTTPException(status_code=404, detail="Call not found")
        
        call.status = "active"
        call.started_at = datetime.utcnow()
        db.commit()
        
        return {"message": "Call started successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/calls/{call_id}/end")
async def end_call(call_id: int, db: Session = Depends(get_db)):
    """End an active call"""
    try:
        call = db.query(Call).filter(Call.id == call_id).first()
        if not call:
            raise HTTPException(status_code=404, detail="Call not found")
        
        call.status = "completed"
        call.ended_at = datetime.utcnow()
        
        # Calculate duration
        if call.started_at:
            duration = call.ended_at - call.started_at
            call.duration_minutes = int(duration.total_seconds() / 60)
        
        # Generate AI summary
        call_summary = await call_manager.generate_call_summary(call_id, db)
        call.summary = call_summary["summary"]
        call.key_points = call_summary["key_points"]
        call.action_items = call_summary["action_items"]
        
        # Generate comprehensive emotion analysis for the entire call
        messages = db.query(CallMessage).filter(CallMessage.call_id == call_id).all()
        message_data = [
            {
                "participant_id": msg.sender_id,
                "participant_name": msg.sender_name,
                "message": msg.message,
                "timestamp": msg.created_at.isoformat()
            }
            for msg in messages
        ]
        
        # Analyze call emotions
        if message_data:
            analyzer = get_emotion_analyzer()
            rag = get_rag_manager()
            
            emotion_analysis = analyzer.analyze_conversation_flow(
                message_data, 
                {"call_type": call.call_type, "project_id": call.project_id}
            )
            
            # Store emotion analysis in RAG memory
            analyzer.store_call_analysis_to_rag(
                call_id, 
                emotion_analysis, 
                rag, 
                str(call.project_id)
            )
            
            # Update call with emotion summary
            call.dominant_emotion = emotion_analysis.get("summary", {}).get("dominant_emotion", "neutral")
        
        db.commit()
        
        return {"message": "Call ended successfully", "summary": call_summary}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/calls/{call_id}/message")
async def send_message(
    call_id: int,
    sender_type: str = Form(...),
    sender_id: str = Form(...),
    sender_name: str = Form(...),
    message: str = Form(...),
    db: Session = Depends(get_db)
):
    """Send a message in a call with AI emotion analysis and persona responses"""
    try:
        # Analyze message emotions with AI
        analyzer = get_emotion_analyzer()
        emotion_analysis = analyzer.analyze_message_with_ai(message)
        
        # Convert EmotionAnalysis object to dictionary format
        emotions_dict = {emotion_analysis.primary_emotion.value: 1.0}
        for emotion in emotion_analysis.secondary_emotions:
            emotions_dict[emotion.value] = 0.7
        
        # Create message
        call_message = CallMessage(
            call_id=call_id,
            sender_type=sender_type,
            sender_id=sender_id,
            sender_name=sender_name,
            message=message
        )
        
        db.add(call_message)
        
        # Record emotions if significant
        if emotion_analysis.confidence > 0.7:
            for emotion, intensity in emotions_dict.items():
                if intensity > 0.5:  # Only record significant emotions
                    emotion_record = CallEmotion(
                        call_id=call_id,
                        participant_id=sender_id,
                        emotion_type=emotion,
                        intensity=intensity
                    )
                    db.add(emotion_record)
        
        db.commit()
        
        # Store message in RAG for context building
        call = db.query(Call).filter(Call.id == call_id).first()
        if call:
            # Store call message in RAG with emotion context
            rag = get_rag_manager()
            rag.add_message(
                content=f"[{sender_name}]: {message}",
                project_id=str(call.project_id),
                conversation_id=f"call_{call_id}",
                sender=sender_name,
                agent_id=sender_id if sender_type == "agent" else None,
                message_type="call_message"
            )
        
        # Generate AI persona responses if this is a user message
        ai_responses = []
        if sender_type == "user" and call:
            try:
                # Get call participants (personas)
                participants = db.query(CallParticipant).filter(CallParticipant.call_id == call_id).all()
                
                # Generate responses from AI personas
                from .persona_behavior import PersonaBehaviorManager
                persona_manager = PersonaBehaviorManager(rag_manager)
                
                for participant in participants:
                    if participant.agent_id:  # This is an AI persona
                        # Generate emotion-aware response
                        response_data = persona_manager.generate_emotion_aware_response(
                            agent_id=participant.agent_id,
                            message=message,
                            user_emotion=emotion_analysis.primary_emotion.value,
                            user_confidence=emotion_analysis.confidence,
                            project_id=str(call.project_id),
                            meeting_type=call.call_type or "general"
                        )
                        
                        if "error" not in response_data:
                            # Generate actual response using the instructions
                            response_text = await call_manager.generate_agent_response(
                                agent_id=participant.agent_id,
                                message=message,
                                context={
                                    "emotion_instructions": response_data["instructions"],
                                    "response_strategy": response_data["response_strategy"],
                                    "project_id": call.project_id,
                                    "call_type": call.call_type,
                                    "user_emotion": emotion_analysis.primary_emotion.value,
                                    "user_confidence": emotion_analysis.confidence
                                }
                            )
                            
                            if response_text:
                                # Create AI response message
                                ai_message = CallMessage(
                                    call_id=call_id,
                                    sender_type="agent",
                                    sender_id=participant.agent_id,
                                    sender_name=participant.agent_name,
                                    message=response_text
                                )
                                db.add(ai_message)
                                
                                # Record AI emotion
                                ai_emotion_record = CallEmotion(
                                    call_id=call_id,
                                    participant_id=participant.agent_id,
                                    emotion_type=response_data["persona_emotion"],
                                    intensity=response_data["persona_confidence"]
                                )
                                db.add(ai_emotion_record)
                                
                                # Store AI response in RAG
                                rag_manager.add_message(
                                    content=f"[{participant.agent_name}]: {response_text}",
                                    project_id=str(call.project_id),
                                    conversation_id=f"call_{call_id}",
                                    sender=participant.agent_name,
                                    agent_id=participant.agent_id,
                                    message_type="call_response"
                                )
                                
                                ai_responses.append({
                                    "agent_id": participant.agent_id,
                                    "agent_name": participant.agent_name,
                                    "response": response_text,
                                    "emotion": response_data["persona_emotion"],
                                    "confidence": response_data["persona_confidence"]
                                })
                
                db.commit()
                
            except Exception as e:
                logger.error(f"Error generating AI responses: {e}")
                # Don't fail the whole request if AI responses fail
        
        return {
            "message": "Message sent successfully",
            "emotion_analysis": {
                "primary_emotion": emotion_analysis.primary_emotion.value,
                "intensity": emotion_analysis.intensity.value,
                "confidence": emotion_analysis.confidence,
                "secondary_emotions": [e.value for e in emotion_analysis.secondary_emotions],
                "indicators": emotion_analysis.indicators
            },
            "ai_responses": ai_responses
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/calls/{call_id}/emotions")
async def get_call_emotions(call_id: int, db: Session = Depends(get_db)):
    """Get emotion analysis for a call"""
    try:
        emotions = db.query(CallEmotion).filter(CallEmotion.call_id == call_id).all()
        
        # Generate emotion summary
        analyzer = get_emotion_analyzer()
        emotion_summary = analyzer.generate_emotion_summary(emotions)
        
        return {
            "call_id": call_id,
            "emotion_summary": emotion_summary,
            "detailed_emotions": [
                {
                    "participant_name": e.participant_name,
                    "emotion": e.emotion,
                    "intensity": e.intensity,
                    "confidence": e.confidence,
                    "detected_at": e.detected_at.isoformat()
                }
                for e in emotions
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/calls/project/{project_id}")
async def get_project_calls(project_id: str, db: Session = Depends(get_db)):
    """Get all calls for a project"""
    try:
        calls = db.query(Call).filter(Call.project_id == project_id).all()
        
        return [
            {
                "id": call.id,
                "call_type": call.call_type,
                "title": call.title,
                "scheduled_at": call.scheduled_at.isoformat(),
                "status": call.status,
                "duration_minutes": call.duration_minutes or 0,
                "dominant_emotion": call.dominant_emotion or "neutral"
            }
            for call in calls
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Code Upload Endpoints

@router.post("/code/upload")
async def upload_code(
    file: UploadFile = File(...),
    project_id: str = Form(...),
    uploader_id: int = Form(...),
    description: str = Form(""),
    db: Session = Depends(get_db)
):
    """Upload code file with AI analysis"""
    try:
        # Read file content
        file_content = await file.read()
        
        # Upload file using CodeUploadManager
        file_id = code_manager.upload_file(
            file_content=file_content,
            filename=file.filename,
            uploader_id=str(uploader_id),
            project_id=project_id
        )
        
        if not file_id:
            raise HTTPException(status_code=400, detail="Failed to upload file")
        
        # Get the uploaded file with analysis
        uploaded_file = code_manager.get_file(file_id)
        
        if not uploaded_file:
            raise HTTPException(status_code=500, detail="File uploaded but not found")
        
        # Extract analysis results
        analysis = uploaded_file.analysis or {}
        
        # Create database record
        code_upload = CodeUpload(
            project_id=project_id,
            uploader_id=uploader_id,
            original_filename=file.filename,
            file_path=uploaded_file.file_path,
            file_size=uploaded_file.file_size,
            file_type=uploaded_file.file_type.value,
            complexity_score=analysis.get("complexity_score", 0.5),
            quality_score=analysis.get("quality_score", 0.5),
            description=description
        )
        
        db.add(code_upload)
        db.commit()
        db.refresh(code_upload)
        
        return {
            "message": "Code uploaded and analyzed successfully",
            "upload_id": code_upload.id,
            "file_id": file_id,
            "analysis": analysis
        }
        
    except Exception as e:
        logger.error(f"Error uploading code: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/code/{upload_id}/review")
async def create_code_review(
    upload_id: int,
    reviewer_type: str = Form(...),
    reviewer_id: str = Form(...),
    reviewer_name: str = Form(...),
    review_text: str = Form(...),
    rating: int = Form(None),
    db: Session = Depends(get_db)
):
    """Create a code review with AI emotion analysis"""
    try:
        # Analyze review emotions
        emotion_analysis = await emotion_analyzer.analyze_text_emotions(review_text)
        
        # Create review
        review = CodeReview(
            code_upload_id=upload_id,
            reviewer_type=reviewer_type,
            reviewer_id=reviewer_id,
            reviewer_name=reviewer_name,
            review_text=review_text,
            rating=rating,
            review_sentiment=emotion_analysis["sentiment"],
            review_emotions=emotion_analysis["emotions"]
        )
        
        db.add(review)
        db.commit()
        db.refresh(review)
        
        return {
            "message": "Review created successfully",
            "review_id": review.id,
            "emotion_analysis": emotion_analysis
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/code/project/{project_id}")
async def get_project_code_uploads(project_id: str, db: Session = Depends(get_db)):
    """Get all code uploads for a project"""
    try:
        uploads = db.query(CodeUpload).filter(CodeUpload.project_id == project_id).all()
        
        return [
            {
                "id": upload.id,
                "original_filename": upload.original_filename,
                "file_type": upload.file_type,
                "complexity_score": upload.complexity_score,
                "quality_score": upload.quality_score,
                "uploaded_at": upload.created_at.isoformat() if upload.created_at else None,
                "description": upload.description
            }
            for upload in uploads
        ]
        
    except Exception as e:
        logger.error(f"Error fetching code uploads: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Emotion Profile Endpoints

@router.get("/emotions/profile/{user_id}")
async def get_emotion_profile(user_id: int, db: Session = Depends(get_db)):
    """Get emotion profile for a user"""
    try:
        profile = db.query(EmotionProfile).filter(EmotionProfile.user_id == user_id).first()
        
        if not profile:
            # Create default profile
            profile = EmotionProfile(
                user_id=user_id,
                baseline_emotions={"neutral": 0.6, "positive": 0.3, "negative": 0.1},
                communication_style="neutral",
                learning_confidence=0.1
            )
            db.add(profile)
            db.commit()
            db.refresh(profile)
        
        return {
            "user_id": user_id,
            "baseline_emotions": profile.baseline_emotions,
            "communication_style": profile.communication_style,
            "stress_triggers": profile.stress_triggers,
            "confidence_patterns": profile.confidence_patterns,
            "learning_confidence": profile.learning_confidence
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/emotions/profile/{user_id}/update")
async def update_emotion_profile(
    user_id: int,
    emotion_data: dict,
    db: Session = Depends(get_db)
):
    """Update emotion profile based on new data"""
    try:
        profile = db.query(EmotionProfile).filter(EmotionProfile.user_id == user_id).first()
        
        if not profile:
            profile = EmotionProfile(user_id=user_id)
            db.add(profile)
        
        # Update profile with AI learning
        updated_profile = await emotion_analyzer.update_emotion_profile(profile, emotion_data)
        
        # Update database
        profile.baseline_emotions = updated_profile["baseline_emotions"]
        profile.stress_triggers = updated_profile["stress_triggers"]
        profile.confidence_patterns = updated_profile["confidence_patterns"]
        profile.communication_style = updated_profile["communication_style"]
        profile.learning_confidence = updated_profile["learning_confidence"]
        
        db.commit()
        
        return {"message": "Emotion profile updated successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/emotions/insights/{user_id}")
async def get_emotion_insights(user_id: int, days: int = 7, db: Session = Depends(get_db)):
    """Get emotion insights for a user over a period"""
    try:
        # Get recent emotion data
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        recent_emotions = db.query(CallEmotion).filter(
            CallEmotion.participant_id == str(user_id),
            CallEmotion.detected_at >= cutoff_date
        ).all()
        
        # Generate insights
        insights = await emotion_analyzer.generate_emotion_insights(recent_emotions, user_id)
        
        return {
            "user_id": user_id,
            "period_days": days,
            "insights": insights,
            "recommendations": insights.get("recommendations", []),
            "trends": insights.get("trends", {}),
            "confidence_score": insights.get("confidence_score", 0.0)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/calls/project/{project_id}/emotion-context")
async def get_project_emotion_context(
    project_id: int, 
    participant_id: str = None,
    db: Session = Depends(get_db)
):
    """Get emotional context for a project or participant from RAG memory"""
    try:
        # For now, return a simple response until the method is implemented
        if participant_id:
            emotion_context = {"message": f"Emotion context for participant {participant_id} in project {project_id}"}
        else:
            emotion_context = {"message": f"Overall emotion context for project {project_id}"}
        
        return {
            "project_id": project_id,
            "participant_id": participant_id,
            "emotion_context": emotion_context
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/calls/agent/{agent_id}/enhanced-context")
async def get_agent_enhanced_context(
    agent_id: str,
    target_participant: str,
    project_id: int,
    db: Session = Depends(get_db)
):
    """Get enhanced emotional context for an agent when interacting with a specific participant"""
    try:
        enhanced_context = emotion_analyzer.enhance_agent_context_with_emotions(
            agent_id, target_participant, str(project_id), rag_manager
        )
        
        return {
            "agent_id": agent_id,
            "target_participant": target_participant,
            "project_id": project_id,
            "enhanced_context": enhanced_context
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Audio Call Endpoints

@router.post("/calls/{call_id}/start-audio")
async def start_audio_call(
    call_id: int,
    participants: str = Form(...),  # JSON string of participant IDs
    db: Session = Depends(get_db)
):
    """Start an audio call with AI personas"""
    try:
        # Get call info from database
        call = db.query(Call).filter(Call.id == call_id).first()
        if not call:
            raise HTTPException(status_code=404, detail="Call not found")
        
        # Parse participants
        participant_list = json.loads(participants)
        participant_ids = [p["id"] for p in participant_list]
        
        # Start audio call
        result = await get_audio_call_manager().start_audio_call(
            str(call_id), 
            call.project_id, 
            participant_ids
        )
        
        if result["success"]:
            # Update call status
            call.status = "active"
            call.started_at = datetime.utcnow()
            db.commit()
            
            return {"message": "Audio call started successfully", "call_id": call_id}
        else:
            raise HTTPException(status_code=500, detail=result.get("error", "Failed to start audio call"))
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/calls/{call_id}/end-audio")
async def end_audio_call(call_id: int, db: Session = Depends(get_db)):
    """End an audio call and get summary"""
    try:
        # End audio call
        result = await get_audio_call_manager().end_audio_call(str(call_id))
        
        if result["success"]:
            # Update call in database
            call = db.query(Call).filter(Call.id == call_id).first()
            if call:
                call.status = "completed"
                call.ended_at = datetime.utcnow()
                call.duration_minutes = result.get("duration_minutes", 0)
                db.commit()
            
            return {
                "message": "Audio call ended successfully",
                "summary": result.get("summary", ""),
                "duration_minutes": result.get("duration_minutes", 0)
            }
        else:
            raise HTTPException(status_code=500, detail=result.get("error", "Failed to end audio call"))
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/calls/{call_id}/audio-status")
async def get_audio_call_status(call_id: int):
    """Get the current status of an audio call"""
    try:
        status = get_audio_call_manager().get_call_status(str(call_id))
        return status
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/calls/{call_id}/send-audio-message")
async def send_audio_message(
    call_id: int,
    message: str = Form(...),
    db: Session = Depends(get_db)
):
    """Send a text message during audio call (fallback)"""
    try:
        # This endpoint allows sending text messages during audio calls
        # as a fallback when speech recognition isn't working
        
        call = db.query(Call).filter(Call.id == call_id).first()
        if not call:
            raise HTTPException(status_code=404, detail="Call not found")
        
        # Process the message through the audio call manager
        # This will trigger AI persona responses
        if str(call_id) in get_audio_call_manager().active_audio_calls:
            await get_audio_call_manager()._process_user_speech(str(call_id), message)
        
        return {"message": "Text message sent to audio call"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
