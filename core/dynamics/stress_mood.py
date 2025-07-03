#!/usr/bin/env python3
"""
Stress and Mood Management Module
Adds realistic stress responses, mood variations, and emotional context to agent behavior
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from enum import Enum
import random

class MoodState(Enum):
    ENERGETIC = "energetic"
    CALM = "calm"
    STRESSED = "stressed"
    FRUSTRATED = "frustrated"
    EXCITED = "excited"
    TIRED = "tired"
    FOCUSED = "focused"
    OVERWHELMED = "overwhelmed"

class StressLevel(Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"

class StressTrigger(Enum):
    TIGHT_DEADLINE = "tight_deadline"
    COMPLEX_PROBLEM = "complex_problem"
    TEAM_CONFLICT = "team_conflict"
    HEAVY_WORKLOAD = "heavy_workload"
    CLIENT_PRESSURE = "client_pressure"
    TECHNICAL_ISSUES = "technical_issues"
    UNCLEAR_REQUIREMENTS = "unclear_requirements"

class StressMoodManager:
    """Manages realistic stress and mood variations for agents"""
    
    def __init__(self):
        self.agent_stress_levels: Dict[str, StressLevel] = {}
        self.agent_moods: Dict[str, MoodState] = {}
        self.stress_history: Dict[str, List[Dict]] = {}
        self.mood_patterns: Dict[str, Dict] = {}
        self.workload_tracking: Dict[str, int] = {}
        
    def initialize_agent_stress_mood(self):
        """Initialize baseline stress and mood for each agent"""
        
        # Set baseline stress levels based on role responsibilities
        self.agent_stress_levels = {
            "manager_001": StressLevel.MODERATE,  # Sarah - managing team pressure
            "developer_001": StressLevel.MODERATE,  # Alex - technical challenges
            "qa_001": StressLevel.LOW,  # David - methodical work style
            "designer_001": StressLevel.LOW,  # Emma - creative work
            "analyst_001": StressLevel.MODERATE  # Lisa - data pressure
        }
        
        # Set baseline moods based on personality
        self.agent_moods = {
            "manager_001": MoodState.FOCUSED,  # Sarah - leadership mode
            "developer_001": MoodState.CALM,  # Alex - experienced confidence
            "qa_001": MoodState.FOCUSED,  # David - detail-oriented
            "designer_001": MoodState.ENERGETIC,  # Emma - creative energy
            "analyst_001": MoodState.CALM  # Lisa - analytical mindset
        }
        
        # Initialize stress history tracking
        for agent_id in self.agent_stress_levels.keys():
            self.stress_history[agent_id] = []
            self.workload_tracking[agent_id] = 5  # Normal workload (1-10 scale)
    
    def update_stress_level(self, agent_id: str, trigger: StressTrigger, intensity: int = 1):
        """Update agent stress based on workplace triggers"""
        if agent_id not in self.agent_stress_levels:
            return
        
        current_stress = self.agent_stress_levels[agent_id]
        
        # Calculate stress increase based on trigger and agent personality
        stress_increases = {
            StressTrigger.TIGHT_DEADLINE: {"manager_001": 2, "developer_001": 1, "qa_001": 1, "designer_001": 1, "analyst_001": 2},
            StressTrigger.COMPLEX_PROBLEM: {"manager_001": 1, "developer_001": 1, "qa_001": 2, "designer_001": 1, "analyst_001": 2},
            StressTrigger.TEAM_CONFLICT: {"manager_001": 3, "developer_001": 1, "qa_001": 1, "designer_001": 2, "analyst_001": 1},
            StressTrigger.HEAVY_WORKLOAD: {"manager_001": 2, "developer_001": 2, "qa_001": 1, "designer_001": 2, "analyst_001": 2},
            StressTrigger.CLIENT_PRESSURE: {"manager_001": 3, "developer_001": 1, "qa_001": 1, "designer_001": 2, "analyst_001": 2}
        }
        
        increase = stress_increases.get(trigger, {}).get(agent_id, 1) * intensity
        
        # Convert current stress to numeric for calculation
        stress_values = {StressLevel.LOW: 1, StressLevel.MODERATE: 2, StressLevel.HIGH: 3, StressLevel.CRITICAL: 4}
        stress_names = {1: StressLevel.LOW, 2: StressLevel.MODERATE, 3: StressLevel.HIGH, 4: StressLevel.CRITICAL}
        
        current_value = stress_values[current_stress]
        new_value = min(4, current_value + increase)
        
        self.agent_stress_levels[agent_id] = stress_names[new_value]
        
        # Log stress change
        self.stress_history[agent_id].append({
            "timestamp": datetime.now(),
            "trigger": trigger.value,
            "old_level": current_stress.value,
            "new_level": self.agent_stress_levels[agent_id].value,
            "intensity": intensity
        })
        
        # Update mood based on new stress level
        self._update_mood_from_stress(agent_id)
    
    def _update_mood_from_stress(self, agent_id: str):
        """Update mood based on current stress level"""
        stress_level = self.agent_stress_levels[agent_id]
        
        if stress_level == StressLevel.CRITICAL:
            possible_moods = [MoodState.OVERWHELMED, MoodState.FRUSTRATED, MoodState.STRESSED]
        elif stress_level == StressLevel.HIGH:
            possible_moods = [MoodState.STRESSED, MoodState.FRUSTRATED, MoodState.FOCUSED]
        elif stress_level == StressLevel.MODERATE:
            possible_moods = [MoodState.FOCUSED, MoodState.CALM, MoodState.ENERGETIC]
        else:  # LOW stress
            possible_moods = [MoodState.CALM, MoodState.ENERGETIC, MoodState.EXCITED]
        
        # Add personality-based mood preferences
        personality_preferences = {
            "manager_001": [MoodState.FOCUSED, MoodState.CALM],  # Sarah prefers control
            "developer_001": [MoodState.FOCUSED, MoodState.CALM],  # Alex likes concentration
            "qa_001": [MoodState.FOCUSED, MoodState.CALM],  # David methodical
            "designer_001": [MoodState.ENERGETIC, MoodState.EXCITED],  # Emma creative energy
            "analyst_001": [MoodState.CALM, MoodState.FOCUSED]  # Lisa analytical
        }
        
        # Prefer personality-based moods if stress allows
        if stress_level in [StressLevel.LOW, StressLevel.MODERATE]:
            preferred_moods = personality_preferences.get(agent_id, [])
            possible_moods.extend(preferred_moods)
        
        self.agent_moods[agent_id] = random.choice(possible_moods)
    
    def _get_recent_stress_events(self, agent_id: str, days: int = 3) -> List[str]:
        """Return a list of recent stress triggers for the agent (for context only, not for dictating emotion)"""
        now = datetime.now()
        events = [
            event["trigger"] for event in self.stress_history.get(agent_id, [])
            if (now - event["timestamp"]).days < days
        ]
        return events

    def get_stress_context(self, agent_id: str) -> str:
        """Get stress-related context for agent responses - factual only, not prescriptive"""
        if agent_id not in self.agent_stress_levels:
            return ""
        stress_level = self.agent_stress_levels[agent_id]
        workload = self.workload_tracking.get(agent_id, 5)
        context_parts = [f"Stress level: {stress_level.value}"]
        context_parts.append(f"Workload: {workload}/10")
        recent_events = self._get_recent_stress_events(agent_id)
        if recent_events:
            context_parts.append(f"Recent stress triggers: {', '.join(recent_events)}")
        return "; ".join(context_parts)

    def get_mood_context(self, agent_id: str) -> str:
        """Get mood-related context for agent responses - factual only, not prescriptive"""
        if agent_id not in self.agent_moods:
            return ""
        mood = self.agent_moods[agent_id]
        context_parts = [f"Mood: {mood.value}"]
        if agent_id in self.mood_patterns:
            patterns = self.mood_patterns[agent_id]
            if patterns.get("recent_successes"):
                context_parts.append("Recent work successes")
            if patterns.get("recent_challenges"):
                context_parts.append("Recent challenges")
        return "; ".join(context_parts)

    def generate_mood_context(self, agent_id: str) -> str:
        """Generate comprehensive mood and stress context for system prompt (factual only)"""
        mood_context = self.get_mood_context(agent_id)
        stress_context = self.get_stress_context(agent_id)
        context_lines = []
        context_lines.append(f"Emotional state: {self.get_current_mood(agent_id)}")
        context_lines.append(f"Stress level: {self.get_stress_level(agent_id)}")
        if mood_context:
            context_lines.append(mood_context)
        if stress_context:
            context_lines.append(stress_context)
        recent_events = self._get_recent_stress_events(agent_id)
        if recent_events:
            context_lines.append(f"Recent factors: {', '.join(recent_events)}")
        return "\n".join(context_lines)
    
    def initialize_agent_baselines(self):
        """Initialize baseline stress and mood for all agents"""
        self.initialize_agent_stress_mood()
    
    def set_initial_moods(self):
        """Set initial mood states for all agents"""
        # This method is already handled in initialize_agent_stress_mood
        pass

    def reset_agent_stress(self, agent_id: str):
        """Reset agent stress to baseline levels"""
        if agent_id in self.agent_stress_levels:
            self.agent_stress_levels[agent_id] = StressLevel.LOW
            self.agent_moods[agent_id] = MoodState.CALM
            self.workload_tracking[agent_id] = 0
            
            # Clear stress history
            if agent_id in self.stress_history:
                self.stress_history[agent_id] = []
    
    def simulate_daily_stress_changes(self):
        """Simulate natural stress level changes throughout the day"""
        for agent_id in self.agent_stress_levels.keys():
            # Random chance of stress events
            if random.random() < 0.3:  # 30% chance of stress change
                triggers = list(StressTrigger)
                trigger = random.choice(triggers)
                self.update_stress_level(agent_id, trigger, intensity=1)
            
            # Gradual stress recovery
            elif random.random() < 0.4:  # 40% chance of stress relief
                self._reduce_stress(agent_id)
    
    def _reduce_stress(self, agent_id: str):
        """Gradually reduce stress levels"""
        if agent_id not in self.agent_stress_levels:
            return
        
        current_stress = self.agent_stress_levels[agent_id]
        stress_values = {StressLevel.LOW: 1, StressLevel.MODERATE: 2, StressLevel.HIGH: 3, StressLevel.CRITICAL: 4}
        stress_names = {1: StressLevel.LOW, 2: StressLevel.MODERATE, 3: StressLevel.HIGH, 4: StressLevel.CRITICAL}
        
        current_value = stress_values[current_stress]
        if current_value > 1:
            new_value = current_value - 1
            self.agent_stress_levels[agent_id] = stress_names[new_value]
            self._update_mood_from_stress(agent_id)
    
    def get_combined_context(self, agent_id: str, situation: str = "normal") -> str:
        """Get combined stress and mood context - informational only"""
        stress_context = self.get_stress_context(agent_id)
        mood_context = self.get_mood_context(agent_id)
        
        context_parts = []
        
        if stress_context:
            context_parts.append(f"Stress: {stress_context}")
        if mood_context:
            context_parts.append(f"Mood: {mood_context}")
        
        # Add situational context without prescriptive instructions
        if situation == "deadline":
            context_parts.append("Situation: Deadline pressure affecting the team")
        elif situation == "meeting":
            context_parts.append("Situation: In a collaborative meeting environment")
        elif situation == "crisis":
            context_parts.append("Situation: Urgent issue requiring attention")
        
        return "; ".join(context_parts)
    
    def get_agent_status(self, agent_id: str) -> Dict[str, Any]:
        """Get current status overview for an agent"""
        if agent_id not in self.agent_stress_levels:
            return {}
        
        return {
            "stress_level": self.agent_stress_levels[agent_id].value,
            "mood": self.agent_moods[agent_id].value,
            "workload": self.workload_tracking.get(agent_id, 5),
            "recent_stress_events": len([
                event for event in self.stress_history.get(agent_id, [])
                if (datetime.now() - event["timestamp"]).days < 7
            ])
        }
    
    def get_current_mood(self, agent_id: str) -> str:
        """Get current mood state for an agent"""
        if agent_id not in self.agent_moods:
            return "calm"
        return self.agent_moods[agent_id].value
    
    def get_stress_level(self, agent_id: str) -> str:
        """Get current stress level for an agent"""
        if agent_id not in self.agent_stress_levels:
            return "low"
        return self.agent_stress_levels[agent_id].value
    
    # Emotional memory is handled by RAG system - no need for duplicate tracking
    
    def update_mood_from_conversation(self, agent_id: str, conversation_outcome: str):
        """Update agent mood based on conversation outcome - RAG handles memory"""
        if agent_id not in self.agent_moods:
            return
        
        # Simple mood updates - RAG system handles the conversation memory
        if conversation_outcome == "positive":
            self._shift_mood_positive(agent_id)
        elif conversation_outcome == "negative":
            self._shift_mood_negative(agent_id)
        elif conversation_outcome == "stressful":
            self.update_stress_level(agent_id, StressTrigger.TEAM_CONFLICT, intensity=1)
        elif conversation_outcome == "successful":
            self._shift_mood_positive(agent_id)
            if agent_id in self.mood_patterns:
                self.mood_patterns[agent_id]["recent_successes"] = True
    
    def _shift_mood_positive(self, agent_id: str):
        """Shift mood in positive direction"""
        if agent_id not in self.agent_moods:
            return
        
        current_mood = self.agent_moods[agent_id]
        
        positive_shifts = {
            MoodState.OVERWHELMED: MoodState.STRESSED,
            MoodState.FRUSTRATED: MoodState.CALM,
            MoodState.STRESSED: MoodState.FOCUSED,
            MoodState.TIRED: MoodState.CALM,
            MoodState.CALM: MoodState.ENERGETIC,
            MoodState.FOCUSED: MoodState.ENERGETIC,
            MoodState.ENERGETIC: MoodState.EXCITED,
            MoodState.EXCITED: MoodState.EXCITED  # Already positive
        }
        
        self.agent_moods[agent_id] = positive_shifts.get(current_mood, current_mood)
    
    def _shift_mood_negative(self, agent_id: str):
        """Shift mood in negative direction"""
        if agent_id not in self.agent_moods:
            return
        
        current_mood = self.agent_moods[agent_id]
        
        negative_shifts = {
            MoodState.EXCITED: MoodState.ENERGETIC,
            MoodState.ENERGETIC: MoodState.FOCUSED,
            MoodState.FOCUSED: MoodState.CALM,
            MoodState.CALM: MoodState.TIRED,
            MoodState.TIRED: MoodState.STRESSED,
            MoodState.STRESSED: MoodState.FRUSTRATED,
            MoodState.FRUSTRATED: MoodState.OVERWHELMED,
            MoodState.OVERWHELMED: MoodState.OVERWHELMED  # Already negative
        }
        
        self.agent_moods[agent_id] = negative_shifts.get(current_mood, current_mood)
