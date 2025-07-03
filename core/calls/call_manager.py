#!/usr/bin/env python3
"""
Call Manager for SimWorld
Handles scheduling, managing, and logging calls between users and agents
"""

import uuid
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from enum import Enum
import json
import asyncio
from dataclasses import dataclass

class CallType(Enum):
    ONE_ON_ONE = "one_on_one"
    CLIENT_CALL = "client_call"
    GROUP_CALL = "group_call"
    TEAM_MEETING = "team_meeting"
    STANDUP = "standup"
    RETROSPECTIVE = "retrospective"

class CallStatus(Enum):
    SCHEDULED = "scheduled"
    STARTING = "starting"
    IN_PROGRESS = "in_progress"
    ENDED = "ended"
    CANCELLED = "cancelled"

@dataclass
class CallParticipant:
    id: str
    name: str
    role: str
    is_agent: bool = False
    is_user: bool = False
    joined_at: Optional[datetime] = None
    left_at: Optional[datetime] = None
    speaking_time: int = 0  # seconds
    message_count: int = 0

class CallManager:
    """Manages calls and meetings in SimWorld"""
    
    def __init__(self):
        self.active_calls: Dict[str, 'Call'] = {}
        self.call_history: List['Call'] = []
        self.scheduled_calls: Dict[str, 'Call'] = {}
        
    def schedule_call(self, 
                     call_type: CallType,
                     participants: List[str],
                     scheduled_time: datetime,
                     duration_minutes: int = 30,
                     title: str = "",
                     description: str = "",
                     project_id: str = "",
                     organizer_id: str = "") -> str:
        """Schedule a new call"""
        
        call_id = str(uuid.uuid4())
        
        call = Call(
            call_id=call_id,
            call_type=call_type,
            title=title or f"{call_type.value.replace('_', ' ').title()}",
            description=description,
            project_id=project_id,
            organizer_id=organizer_id,
            scheduled_time=scheduled_time,
            duration_minutes=duration_minutes,
            participant_ids=participants
        )
        
        self.scheduled_calls[call_id] = call
        
        return call_id
    
    def start_call(self, call_id: str) -> bool:
        """Start a scheduled call"""
        
        if call_id in self.scheduled_calls:
            call = self.scheduled_calls[call_id]
            call.status = CallStatus.STARTING
            call.actual_start_time = datetime.now()
            
            # Move to active calls
            self.active_calls[call_id] = call
            del self.scheduled_calls[call_id]
            
            return True
        
        return False
    
    def join_call(self, call_id: str, participant_id: str, 
                  participant_name: str, role: str,
                  is_agent: bool = False, is_user: bool = False) -> bool:
        """Join an active call"""
        
        if call_id not in self.active_calls:
            return False
        
        call = self.active_calls[call_id]
        
        # Check if already joined
        if participant_id in call.participants:
            return False
        
        participant = CallParticipant(
            id=participant_id,
            name=participant_name,
            role=role,
            is_agent=is_agent,
            is_user=is_user,
            joined_at=datetime.now()
        )
        
        call.participants[participant_id] = participant
        call.status = CallStatus.IN_PROGRESS
        
        # Log join event
        call.add_event("join", participant_id, f"{participant_name} joined the call")
        
        return True
    
    def leave_call(self, call_id: str, participant_id: str) -> bool:
        """Leave an active call"""
        
        if call_id not in self.active_calls:
            return False
        
        call = self.active_calls[call_id]
        
        if participant_id not in call.participants:
            return False
        
        participant = call.participants[participant_id]
        participant.left_at = datetime.now()
        
        # Log leave event
        call.add_event("leave", participant_id, f"{participant.name} left the call")
        
        # Check if call should end
        active_participants = [p for p in call.participants.values() if p.left_at is None]
        if len(active_participants) == 0:
            self.end_call(call_id)
        
        return True
    
    def add_message(self, call_id: str, participant_id: str, 
                   message: str, message_type: str = "text") -> bool:
        """Add a message to the call"""
        
        if call_id not in self.active_calls:
            return False
        
        call = self.active_calls[call_id]
        
        if participant_id not in call.participants:
            return False
        
        participant = call.participants[participant_id]
        participant.message_count += 1
        
        # Add message to call transcript
        call.add_message(participant_id, message, message_type)
        
        return True
    
    def end_call(self, call_id: str) -> bool:
        """End an active call"""
        
        if call_id not in self.active_calls:
            return False
        
        call = self.active_calls[call_id]
        call.status = CallStatus.ENDED
        call.actual_end_time = datetime.now()
        
        # Move to history
        self.call_history.append(call)
        del self.active_calls[call_id]
        
        # Log end event
        call.add_event("end", "", "Call ended")
        
        return True
    
    def get_call_info(self, call_id: str) -> Optional[Dict[str, Any]]:
        """Get information about a call"""
        
        call = None
        if call_id in self.active_calls:
            call = self.active_calls[call_id]
        elif call_id in self.scheduled_calls:
            call = self.scheduled_calls[call_id]
        else:
            # Search in history
            for historical_call in self.call_history:
                if historical_call.call_id == call_id:
                    call = historical_call
                    break
        
        if not call:
            return None
        
        return call.to_dict()
    
    def get_active_calls(self) -> List[Dict[str, Any]]:
        """Get all active calls"""
        return [call.to_dict() for call in self.active_calls.values()]
    
    def get_scheduled_calls(self) -> List[Dict[str, Any]]:
        """Get all scheduled calls"""
        return [call.to_dict() for call in self.scheduled_calls.values()]
    
    def get_call_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get call history"""
        return [call.to_dict() for call in self.call_history[-limit:]]

class Call:
    """Represents a call/meeting in SimWorld"""
    
    def __init__(self, call_id: str, call_type: CallType, title: str,
                 description: str, project_id: str, organizer_id: str,
                 scheduled_time: datetime, duration_minutes: int,
                 participant_ids: List[str]):
        
        self.call_id = call_id
        self.call_type = call_type
        self.title = title
        self.description = description
        self.project_id = project_id
        self.organizer_id = organizer_id
        
        self.scheduled_time = scheduled_time
        self.duration_minutes = duration_minutes
        self.actual_start_time: Optional[datetime] = None
        self.actual_end_time: Optional[datetime] = None
        
        self.status = CallStatus.SCHEDULED
        self.participant_ids = participant_ids
        self.participants: Dict[str, CallParticipant] = {}
        
        self.messages: List[Dict[str, Any]] = []
        self.events: List[Dict[str, Any]] = []
        
        self.recording_enabled = False
        self.transcript = ""
        
    def add_message(self, participant_id: str, message: str, 
                   message_type: str = "text"):
        """Add a message to the call"""
        
        message_data = {
            "timestamp": datetime.now().isoformat(),
            "participant_id": participant_id,
            "participant_name": self.participants[participant_id].name,
            "message": message,
            "message_type": message_type
        }
        
        self.messages.append(message_data)
        
        # Update transcript
        participant_name = self.participants[participant_id].name
        self.transcript += f"[{datetime.now().strftime('%H:%M:%S')}] {participant_name}: {message}\n"
    
    def add_event(self, event_type: str, participant_id: str, description: str):
        """Add an event to the call"""
        
        event_data = {
            "timestamp": datetime.now().isoformat(),
            "event_type": event_type,
            "participant_id": participant_id,
            "description": description
        }
        
        self.events.append(event_data)
    
    def get_duration_minutes(self) -> int:
        """Get actual call duration in minutes"""
        if self.actual_start_time and self.actual_end_time:
            delta = self.actual_end_time - self.actual_start_time
            return int(delta.total_seconds() / 60)
        return 0
    
    def get_participant_stats(self) -> Dict[str, Any]:
        """Get statistics about participants"""
        stats = {
            "total_participants": len(self.participants),
            "agents": sum(1 for p in self.participants.values() if p.is_agent),
            "users": sum(1 for p in self.participants.values() if p.is_user),
            "total_messages": len(self.messages),
            "participant_details": {}
        }
        
        for participant_id, participant in self.participants.items():
            stats["participant_details"][participant_id] = {
                "name": participant.name,
                "role": participant.role,
                "message_count": participant.message_count,
                "speaking_time": participant.speaking_time,
                "joined_at": participant.joined_at.isoformat() if participant.joined_at else None,
                "left_at": participant.left_at.isoformat() if participant.left_at else None
            }
        
        return stats
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert call to dictionary"""
        return {
            "call_id": self.call_id,
            "call_type": self.call_type.value,
            "title": self.title,
            "description": self.description,
            "project_id": self.project_id,
            "organizer_id": self.organizer_id,
            "status": self.status.value,
            "scheduled_time": self.scheduled_time.isoformat(),
            "duration_minutes": self.duration_minutes,
            "actual_start_time": self.actual_start_time.isoformat() if self.actual_start_time else None,
            "actual_end_time": self.actual_end_time.isoformat() if self.actual_end_time else None,
            "actual_duration": self.get_duration_minutes(),
            "participant_ids": self.participant_ids,
            "participants": {pid: {
                "name": p.name,
                "role": p.role,
                "is_agent": p.is_agent,
                "is_user": p.is_user,
                "joined_at": p.joined_at.isoformat() if p.joined_at else None,
                "left_at": p.left_at.isoformat() if p.left_at else None,
                "message_count": p.message_count
            } for pid, p in self.participants.items()},
            "message_count": len(self.messages),
            "event_count": len(self.events),
            "recording_enabled": self.recording_enabled,
            "transcript_length": len(self.transcript)
        }
