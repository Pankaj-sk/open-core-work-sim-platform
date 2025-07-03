#!/usr/bin/env python3
"""
Call Manager Module for SimWorld
Handles scheduling, conducting, and analyzing calls with emotion detection
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from enum import Enum
import json
import uuid
from dataclasses import dataclass, asdict
from .emotion_analyzer import AIEmotionAnalyzer
import logging

logger = logging.getLogger(__name__)

class CallType(Enum):
    ONE_ON_ONE = "one_on_one"
    CLIENT_CALL = "client_call"
    TEAM_MEETING = "team_meeting"
    GROUP_CALL = "group_call"
    STANDUP = "standup"
    CODE_REVIEW = "code_review"
    BRAINSTORMING = "brainstorming"
    CRISIS_MEETING = "crisis_meeting"

class CallStatus(Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

@dataclass
class CallParticipant:
    participant_id: str
    participant_name: str
    participant_type: str  # 'agent', 'user', 'client'
    role: str
    joined_at: Optional[datetime] = None
    left_at: Optional[datetime] = None
    speaking_time: float = 0.0
    message_count: int = 0

@dataclass
class CallMessage:
    message_id: str
    participant_id: str
    participant_name: str
    message: str
    timestamp: datetime
    emotion_analysis: Optional[Dict] = None
    message_type: str = "text"  # 'text', 'audio', 'screen_share'

@dataclass
class Call:
    call_id: str
    call_type: CallType
    title: str
    description: str
    scheduled_start: datetime
    scheduled_end: datetime
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    status: CallStatus = CallStatus.SCHEDULED
    participants: List[CallParticipant] = None
    messages: List[CallMessage] = None
    emotion_analysis: Optional[Dict] = None
    call_summary: Optional[str] = None
    project_id: Optional[str] = None
    
    def __post_init__(self):
        if self.participants is None:
            self.participants = []
        if self.messages is None:
            self.messages = []

class CallManager:
    """Manages all aspects of calls including scheduling, execution, and analysis"""
    
    def __init__(self):
        self.active_calls: Dict[str, Call] = {}
        self.call_history: List[Call] = []
        self.emotion_analyzer = AIEmotionAnalyzer()
        
    def schedule_call(self, call_type: CallType, title: str, description: str,
                     scheduled_start: datetime, scheduled_end: datetime,
                     participants: List[Dict[str, str]], project_id: str = None) -> str:
        """Schedule a new call"""
        
        call_id = str(uuid.uuid4())
        
        # Create participant objects
        call_participants = []
        for p in participants:
            participant = CallParticipant(
                participant_id=p['id'],
                participant_name=p['name'],
                participant_type=p.get('type', 'agent'),
                role=p.get('role', 'participant')
            )
            call_participants.append(participant)
        
        # Create call
        call = Call(
            call_id=call_id,
            call_type=call_type,
            title=title,
            description=description,
            scheduled_start=scheduled_start,
            scheduled_end=scheduled_end,
            participants=call_participants,
            project_id=project_id
        )
        
        self.active_calls[call_id] = call
        
        logger.info(f"Scheduled {call_type.value} call: {title} with {len(participants)} participants")
        
        return call_id
    
    def start_call(self, call_id: str) -> bool:
        """Start a scheduled call"""
        
        if call_id not in self.active_calls:
            logger.error(f"Call {call_id} not found")
            return False
        
        call = self.active_calls[call_id]
        
        if call.status != CallStatus.SCHEDULED:
            logger.error(f"Call {call_id} is not in scheduled status")
            return False
        
        # Start the call
        call.actual_start = datetime.now()
        call.status = CallStatus.IN_PROGRESS
        
        # Mark participants as joined
        for participant in call.participants:
            participant.joined_at = datetime.now()
        
        logger.info(f"Started call: {call.title}")
        
        return True
    
    def add_message_to_call(self, call_id: str, participant_id: str, message: str,
                           message_type: str = "text") -> bool:
        """Add a message to an ongoing call with emotion analysis"""
        
        if call_id not in self.active_calls:
            logger.error(f"Call {call_id} not found")
            return False
        
        call = self.active_calls[call_id]
        
        if call.status != CallStatus.IN_PROGRESS:
            logger.error(f"Call {call_id} is not in progress")
            return False
        
        # Find participant
        participant = None
        for p in call.participants:
            if p.participant_id == participant_id:
                participant = p
                break
        
        if not participant:
            logger.error(f"Participant {participant_id} not found in call {call_id}")
            return False
        
        # Create message
        message_id = str(uuid.uuid4())
        call_message = CallMessage(
            message_id=message_id,
            participant_id=participant_id,
            participant_name=participant.participant_name,
            message=message,
            timestamp=datetime.now(),
            message_type=message_type
        )
        
        # Analyze emotion
        try:
            context = {
                'call_type': call.call_type.value,
                'participants': len(call.participants),
                'call_duration': (datetime.now() - call.actual_start).total_seconds() / 60 if call.actual_start else 0
            }
            
            emotion_analysis = self.emotion_analyzer.analyze_message_with_ai(message, context)
            call_message.emotion_analysis = {
                'primary_emotion': emotion_analysis.primary_emotion.value,
                'intensity': emotion_analysis.intensity.value,
                'confidence': emotion_analysis.confidence,
                'secondary_emotions': [e.value for e in emotion_analysis.secondary_emotions],
                'indicators': emotion_analysis.indicators
            }
            
        except Exception as e:
            logger.error(f"Error analyzing emotion for message: {e}")
            call_message.emotion_analysis = None
        
        # Add message to call
        call.messages.append(call_message)
        
        # Update participant stats
        participant.message_count += 1
        
        logger.debug(f"Added message to call {call_id} from {participant.participant_name}")
        
        return True
    
    def end_call(self, call_id: str) -> bool:
        """End an ongoing call and perform final analysis"""
        
        if call_id not in self.active_calls:
            logger.error(f"Call {call_id} not found")
            return False
        
        call = self.active_calls[call_id]
        
        if call.status != CallStatus.IN_PROGRESS:
            logger.error(f"Call {call_id} is not in progress")
            return False
        
        # End the call
        call.actual_end = datetime.now()
        call.status = CallStatus.COMPLETED
        
        # Mark participants as left
        for participant in call.participants:
            if participant.left_at is None:
                participant.left_at = datetime.now()
        
        # Perform final emotion analysis
        try:
            call.emotion_analysis = self._analyze_call_emotions(call)
            call.call_summary = self._generate_call_summary(call)
        except Exception as e:
            logger.error(f"Error analyzing call emotions: {e}")
        
        # Move to history
        self.call_history.append(call)
        del self.active_calls[call_id]
        
        logger.info(f"Ended call: {call.title}")
        
        return True
    
    def _analyze_call_emotions(self, call: Call) -> Dict[str, Any]:
        """Analyze emotions throughout the entire call"""
        
        if not call.messages:
            return {}
        
        # Prepare messages for analysis
        messages_for_analysis = []
        for msg in call.messages:
            messages_for_analysis.append({
                'participant_id': msg.participant_id,
                'participant_name': msg.participant_name,
                'message': msg.message,
                'timestamp': msg.timestamp.isoformat()
            })
        
        # Analyze conversation flow
        context = {
            'call_type': call.call_type.value,
            'duration': (call.actual_end - call.actual_start).total_seconds() / 60 if call.actual_start and call.actual_end else 0,
            'participants': len(call.participants)
        }
        
        analysis = self.emotion_analyzer.analyze_conversation_flow(messages_for_analysis, context)
        
        return analysis
    
    def _generate_call_summary(self, call: Call) -> str:
        """Generate a summary of the call"""
        
        if not call.emotion_analysis:
            return "Call completed without detailed analysis"
        
        summary_parts = []
        
        # Basic info
        duration = (call.actual_end - call.actual_start).total_seconds() / 60 if call.actual_start and call.actual_end else 0
        summary_parts.append(f"Call Duration: {duration:.1f} minutes")
        summary_parts.append(f"Participants: {len(call.participants)}")
        summary_parts.append(f"Messages: {len(call.messages)}")
        
        # Emotion summary
        emotion_summary = call.emotion_analysis.get('summary', {})
        if emotion_summary:
            dominant_emotion = emotion_summary.get('dominant_emotion', 'neutral')
            overall_mood = emotion_summary.get('overall_mood', 'neutral')
            summary_parts.append(f"Overall Mood: {overall_mood}")
            summary_parts.append(f"Dominant Emotion: {dominant_emotion}")
        
        # AI insights
        ai_insights = call.emotion_analysis.get('ai_insights', [])
        if ai_insights:
            summary_parts.append("Key Insights:")
            for insight in ai_insights[:3]:  # Top 3 insights
                summary_parts.append(f"- {insight}")
        
        return "\n".join(summary_parts)
    
    def get_call_insights_for_agent(self, call_id: str, agent_id: str) -> str:
        """Get emotion insights for a specific agent about the call"""
        
        call = None
        
        # Check active calls
        if call_id in self.active_calls:
            call = self.active_calls[call_id]
        else:
            # Check history
            for historical_call in self.call_history:
                if historical_call.call_id == call_id:
                    call = historical_call
                    break
        
        if not call or not call.emotion_analysis:
            return "No emotional insights available for this call"
        
        # Find other participants (excluding the agent)
        other_participants = [p for p in call.participants if p.participant_id != agent_id]
        
        insights = []
        
        for participant in other_participants:
            participant_context = self.emotion_analyzer.get_ai_agent_emotion_context(
                call.emotion_analysis, participant.participant_id
            )
            
            if participant_context:
                insights.append(f"{participant.participant_name}: {participant_context}")
        
        return "\n".join(insights) if insights else "No specific insights about other participants"
    
    def get_active_calls(self) -> List[Dict[str, Any]]:
        """Get list of active calls"""
        
        return [
            {
                'call_id': call.call_id,
                'title': call.title,
                'call_type': call.call_type.value,
                'status': call.status.value,
                'participants': len(call.participants),
                'scheduled_start': call.scheduled_start.isoformat(),
                'actual_start': call.actual_start.isoformat() if call.actual_start else None
            }
            for call in self.active_calls.values()
        ]
    
    def get_call_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get call history"""
        
        return [
            {
                'call_id': call.call_id,
                'title': call.title,
                'call_type': call.call_type.value,
                'status': call.status.value,
                'participants': len(call.participants),
                'scheduled_start': call.scheduled_start.isoformat(),
                'actual_start': call.actual_start.isoformat() if call.actual_start else None,
                'actual_end': call.actual_end.isoformat() if call.actual_end else None,
                'call_summary': call.call_summary
            }
            for call in self.call_history[-limit:]
        ]
    
    def cancel_call(self, call_id: str) -> bool:
        """Cancel a scheduled call"""
        
        if call_id not in self.active_calls:
            return False
        
        call = self.active_calls[call_id]
        
        if call.status == CallStatus.IN_PROGRESS:
            logger.error(f"Cannot cancel call {call_id} that is in progress")
            return False
        
        call.status = CallStatus.CANCELLED
        
        # Move to history
        self.call_history.append(call)
        del self.active_calls[call_id]
        
        logger.info(f"Cancelled call: {call.title}")
        
        return True
