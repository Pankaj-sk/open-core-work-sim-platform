from typing import Dict, List, Optional, Callable
from datetime import datetime
import uuid
from pydantic import BaseModel


class Event(BaseModel):
    id: str
    type: str
    timestamp: datetime
    data: Dict
    source: str
    priority: str = "normal"  # low, normal, high, critical


class EventManager:
    def __init__(self):
        self.events: List[Event] = []
        self.handlers: Dict[str, List[Callable]] = {}
        self.filters: Dict[str, Callable] = {}
    
    def emit(self, event_type: str, data: Dict, source: str = "system", priority: str = "normal") -> str:
        """Emit a new event"""
        event = Event(
            id=str(uuid.uuid4()),
            type=event_type,
            timestamp=datetime.now(),
            data=data,
            source=source,
            priority=priority
        )
        
        self.events.append(event)
        self._notify_handlers(event)
        return event.id
    
    def subscribe(self, event_type: str, handler: Callable):
        """Subscribe to events of a specific type"""
        if event_type not in self.handlers:
            self.handlers[event_type] = []
        self.handlers[event_type].append(handler)
    
    def unsubscribe(self, event_type: str, handler: Callable):
        """Unsubscribe from events"""
        if event_type in self.handlers:
            self.handlers[event_type] = [h for h in self.handlers[event_type] if h != handler]
    
    def _notify_handlers(self, event: Event):
        """Notify all handlers for an event"""
        if event.type in self.handlers:
            for handler in self.handlers[event.type]:
                try:
                    handler(event)
                except Exception as e:
                    print(f"Error in event handler: {e}")
    
    def get_events(self, event_type: Optional[str] = None, limit: int = 100) -> List[Event]:
        """Get events with optional filtering"""
        events = self.events
        
        if event_type:
            events = [e for e in events if e.type == event_type]
        
        return sorted(events, key=lambda x: x.timestamp, reverse=True)[:limit]
    
    def clear_events(self, before_date: Optional[datetime] = None):
        """Clear old events"""
        if before_date:
            self.events = [e for e in self.events if e.timestamp >= before_date]
        else:
            self.events = []


# Global event manager instance
event_manager = EventManager() 