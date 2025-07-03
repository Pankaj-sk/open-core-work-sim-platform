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

from .db import get_db
from .models import Call, CallParticipant, CallMessage, CallEmotion, CodeUpload, CodeReview, EmotionProfile
from .calls.ai_call_manager import CallManager, CallType
from .calls.emotion_analyzer import AIEmotionAnalyzer
from .uploads.code_manager import CodeUploadManager
from .memory.enhanced_rag import EnhancedRAGManager

router = APIRouter()

# Initialize managers
call_manager = CallManager()
emotion_analyzer = AIEmotionAnalyzer()
code_manager = CodeUploadManager()
rag_manager = EnhancedRAGManager()  # Add RAG manager

# Call Management Endpoints

@router.post("/calls/schedule")
async def schedule_call(
    call_type: str = Form(...),
    title: str = Form(...),
    description: str = Form(""),
    project_id: int = Form(...),
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
            creator_id=creator_id,
            scheduled_at=datetime.fromisoformat(scheduled_at),
            status="scheduled"
        )
        
        db.add(call)
        db.commit()
        db.refresh(call)
        
        # Add participants
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
            emotion_analysis = emotion_analyzer.analyze_conversation_flow(
                message_data, 
                {"call_type": call.call_type, "project_id": call.project_id}
            )
            
            # Store emotion analysis in RAG memory
            emotion_analyzer.store_call_analysis_to_rag(
                call_id, 
                emotion_analysis, 
                rag_manager, 
                str(call.project_id)
            )
            
            # Update call with emotion summary
            call.overall_sentiment = emotion_analysis.get("summary", {}).get("overall_mood", "neutral")
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
    """Send a message in a call with AI emotion analysis"""
    try:
        # Analyze message emotions with AI
        emotion_analysis = await emotion_analyzer.analyze_text_emotions(message)
        
        # Create message
        call_message = CallMessage(
            call_id=call_id,
            sender_type=sender_type,
            sender_id=sender_id,
            sender_name=sender_name,
            message=message,
            sentiment=emotion_analysis["sentiment"],
            emotions=emotion_analysis["emotions"],
            confidence_score=emotion_analysis["confidence"]
        )
        
        db.add(call_message)
        
        # Record emotions if significant
        if emotion_analysis["confidence"] > 0.7:
            for emotion, intensity in emotion_analysis["emotions"].items():
                if intensity > 0.5:  # Only record significant emotions
                    emotion_record = CallEmotion(
                        call_id=call_id,
                        participant_id=sender_id,
                        participant_name=sender_name,
                        emotion=emotion,
                        intensity=intensity,
                        confidence=emotion_analysis["confidence"],
                        trigger_message=message
                    )
                    db.add(emotion_record)
        
        db.commit()
        
        # Store message in RAG for context building
        call = db.query(Call).filter(Call.id == call_id).first()
        if call:
            # Store call message in RAG with emotion context
            rag_manager.add_message(
                content=f"[{sender_name}]: {message}",
                project_id=str(call.project_id),
                conversation_id=f"call_{call_id}",
                sender=sender_name,
                agent_id=sender_id if sender_type == "agent" else None,
                message_type="call_message"
            )
        
        return {
            "message": "Message sent successfully",
            "emotion_analysis": emotion_analysis
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/calls/{call_id}/emotions")
async def get_call_emotions(call_id: int, db: Session = Depends(get_db)):
    """Get emotion analysis for a call"""
    try:
        emotions = db.query(CallEmotion).filter(CallEmotion.call_id == call_id).all()
        
        # Generate emotion summary
        emotion_summary = emotion_analyzer.generate_emotion_summary(emotions)
        
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
async def get_project_calls(project_id: int, db: Session = Depends(get_db)):
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
                "duration_minutes": call.duration_minutes,
                "overall_sentiment": call.overall_sentiment,
                "dominant_emotion": call.dominant_emotion
            }
            for call in calls
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Code Upload Endpoints

@router.post("/code/upload")
async def upload_code(
    file: UploadFile = File(...),
    project_id: int = Form(...),
    uploader_id: int = Form(...),
    description: str = Form(""),
    db: Session = Depends(get_db)
):
    """Upload code file with AI analysis"""
    try:
        # Save file
        file_path = await code_manager.save_uploaded_file(file, project_id)
        
        # Analyze code with AI
        analysis_results = await code_manager.analyze_code(file_path, file.filename)
        
        # Create database record
        code_upload = CodeUpload(
            project_id=project_id,
            uploader_id=uploader_id,
            filename=f"{uuid.uuid4()}_{file.filename}",
            original_filename=file.filename,
            file_path=file_path,
            file_size=file.size,
            file_type=analysis_results["language_detected"],
            language_detected=analysis_results["language_detected"],
            complexity_score=analysis_results["complexity_score"],
            quality_score=analysis_results["quality_score"],
            analysis_results=analysis_results["detailed_analysis"],
            suggestions=analysis_results["suggestions"],
            potential_issues=analysis_results["issues"],
            description=description,
            analyzed_at=datetime.utcnow()
        )
        
        db.add(code_upload)
        db.commit()
        db.refresh(code_upload)
        
        return {
            "message": "Code uploaded and analyzed successfully",
            "upload_id": code_upload.id,
            "analysis": analysis_results
        }
        
    except Exception as e:
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
async def get_project_code_uploads(project_id: int, db: Session = Depends(get_db)):
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
                "uploaded_at": upload.uploaded_at.isoformat(),
                "description": upload.description
            }
            for upload in uploads
        ]
        
    except Exception as e:
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
        if participant_id:
            # Get specific participant's emotional context
            emotion_context = emotion_analyzer.get_emotion_context_from_rag(
                participant_id, str(project_id), rag_manager
            )
        else:
            # Get overall project call history
            emotion_context = emotion_analyzer.get_call_history_context_from_rag(
                str(project_id), rag_manager
            )
        
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
