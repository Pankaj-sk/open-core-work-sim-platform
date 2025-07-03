#!/usr/bin/env python3
"""
Stress and Mood Modeling System
Adds realistic stress responses, mood variations, and emotional context to agents
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from enum import Enum
import random

class MoodState(Enum):
    ENERGETIC = "energetic"
    FOCUSED = "focused" 
    STRESSED = "stressed"
    FRUSTRATED = "frustrated"
    TIRED = "tired"
    EXCITED = "excited"
    WORRIED = "worried"
    CALM = "calm"
    RUSHED = "rushed"
    CONFIDENT = "confident"

class StressLevel(Enum):
    LOW = 1
    MODERATE = 2
    HIGH = 3
    CRITICAL = 4

class StressTrigger(Enum):
    TIGHT_DEADLINE = "tight_deadline"
    COMPLEX_PROBLEM = "complex_problem"
    TEAM_CONFLICT = "team_conflict"
    TECHNICAL_ISSUE = "technical_issue"
    CLIENT_PRESSURE = "client_pressure"
    WORKLOAD_INCREASE = "workload_increase"
    UNCLEAR_REQUIREMENTS = "unclear_requirements"

class MoodAndStressManager:
    """Manages agent mood states and stress levels"""
    
    def __init__(self):
        self.agent_moods: Dict[str, MoodState] = {}
        self.agent_stress_levels: Dict[str, StressLevel] = {}
        self.stress_history: Dict[str, List[Dict]] = {}
        self.mood_triggers: Dict[str, List[Dict]] = {}
        self.baseline_personalities: Dict[str, Dict] = {}
        
    def initialize_agent_baselines(self):
        """Initialize baseline stress tolerance and mood patterns"""
        self.baseline_personalities = {
            "manager_001": {
                "stress_tolerance": "high",
                "default_mood": MoodState.FOCUSED,
                "stress_triggers": [StressTrigger.TEAM_CONFLICT, StressTrigger.CLIENT_PRESSURE],
                "mood_recovery_time": "fast",  # Recovers quickly from stress
                "stress_indicators": ["becomes more directive", "checks in more frequently", "focuses on priorities"]
            },
            "developer_001": {
                "stress_tolerance": "moderate",
                "default_mood": MoodState.FOCUSED,
                "stress_triggers": [StressTrigger.COMPLEX_PROBLEM, StressTrigger.TIGHT_DEADLINE],
                "mood_recovery_time": "moderate",
                "stress_indicators": ["becomes more direct", "focuses intensely", "may skip social chatter"]
            },
            "qa_001": {
                "stress_tolerance": "low",  # More sensitive to chaos
                "default_mood": MoodState.CALM,
                "stress_triggers": [StressTrigger.UNCLEAR_REQUIREMENTS, StressTrigger.WORKLOAD_INCREASE],
                "mood_recovery_time": "slow",
                "stress_indicators": ["asks more clarifying questions", "becomes more methodical", "expresses concerns"]
            },
            "designer_001": {
                "stress_tolerance": "moderate",
                "default_mood": MoodState.ENERGETIC,
                "stress_triggers": [StressTrigger.UNCLEAR_REQUIREMENTS, StressTrigger.TIGHT_DEADLINE],
                "mood_recovery_time": "fast",
                "stress_indicators": ["seeks inspiration", "suggests creative solutions", "may seem scattered"]
            },
            "analyst_001": {
                "stress_tolerance": "high",
                "default_mood": MoodState.CALM,
                "stress_triggers": [StressTrigger.UNCLEAR_REQUIREMENTS, StressTrigger.CLIENT_PRESSURE],
                "mood_recovery_time": "moderate",
                "stress_indicators": ["requests more data", "becomes more analytical", "focuses on facts"]
            }
        }
        
        # Initialize current states to baseline
        for agent_id, baseline in self.baseline_personalities.items():
            self.agent_moods[agent_id] = baseline["default_mood"]
            self.agent_stress_levels[agent_id] = StressLevel.LOW
            self.stress_history[agent_id] = []
            self.mood_triggers[agent_id] = []
    
    def apply_stress_trigger(self, agent_id: str, trigger: StressTrigger, intensity: int = 2) -> Dict[str, Any]:
        """Apply a stress trigger to an agent and update their state"""
        if agent_id not in self.baseline_personalities:
            return {}
        
        baseline = self.baseline_personalities[agent_id]
        current_stress = self.agent_stress_levels[agent_id].value
        
        # Calculate stress impact based on agent's sensitivity to this trigger
        stress_impact = 1
        if trigger in baseline["stress_triggers"]:
            stress_impact = 2  # Double impact for personal triggers
        
        # Apply stress based on tolerance
        tolerance_modifier = {
            "high": 0.5,
            "moderate": 1.0,
            "low": 1.5
        }
        
        final_impact = int(stress_impact * intensity * tolerance_modifier[baseline["stress_tolerance"]])
        new_stress_level = min(4, current_stress + final_impact)
        
        self.agent_stress_levels[agent_id] = StressLevel(new_stress_level)
        
        # Update mood based on stress level
        self._update_mood_from_stress(agent_id, new_stress_level)
        
        # Record stress event
        stress_event = {
            "timestamp": datetime.now(),
            "trigger": trigger,
            "old_stress": current_stress,
            "new_stress": new_stress_level,
            "impact": final_impact
        }
        self.stress_history[agent_id].append(stress_event)
        
        return stress_event
    
    def _update_mood_from_stress(self, agent_id: str, stress_level: int):
        """Update agent mood based on stress level"""
        baseline = self.baseline_personalities[agent_id]
        
        if stress_level == 1:  # Low stress
            self.agent_moods[agent_id] = baseline["default_mood"]
        elif stress_level == 2:  # Moderate stress
            stress_moods = [MoodState.FOCUSED, MoodState.RUSHED]
            self.agent_moods[agent_id] = random.choice(stress_moods)
        elif stress_level == 3:  # High stress
            stress_moods = [MoodState.STRESSED, MoodState.WORRIED, MoodState.FRUSTRATED]
            self.agent_moods[agent_id] = random.choice(stress_moods)
        elif stress_level == 4:  # Critical stress
            self.agent_moods[agent_id] = MoodState.FRUSTRATED
    
    def reduce_stress_over_time(self, agent_id: str, time_passed_hours: int = 1):
        """Naturally reduce stress over time"""
        if agent_id not in self.agent_stress_levels:
            return
        
        baseline = self.baseline_personalities[agent_id]
        recovery_rate = {
            "fast": 1,
            "moderate": 0.5,
            "slow": 0.25
        }
        
        stress_reduction = time_passed_hours * recovery_rate[baseline["mood_recovery_time"]]
        current_stress = self.agent_stress_levels[agent_id].value
        new_stress = max(1, current_stress - stress_reduction)
        
        self.agent_stress_levels[agent_id] = StressLevel(int(new_stress))
        self._update_mood_from_stress(agent_id, int(new_stress))
    
    def get_mood_context(self, agent_id: str) -> str:
        """Get context string for agent's current mood and stress"""
        if agent_id not in self.agent_moods:
            return ""
        
        mood = self.agent_moods[agent_id]
        stress = self.agent_stress_levels[agent_id]
        baseline = self.baseline_personalities[agent_id]
        
        mood_contexts = {
            MoodState.ENERGETIC: "You're feeling energetic and enthusiastic today. You're more likely to suggest new ideas and be optimistic.",
            MoodState.FOCUSED: "You're in a focused, productive mindset. You're clear and direct in your communication.",
            MoodState.STRESSED: "You're feeling stressed and under pressure. You might be more brief in responses and focused on priorities.",
            MoodState.FRUSTRATED: "You're feeling frustrated with current challenges. You might show slight impatience or concern.",
            MoodState.TIRED: "You're feeling a bit tired today. You might be less enthusiastic and more practical in your responses.",
            MoodState.EXCITED: "You're feeling excited about current projects. You're more animated and positive.",
            MoodState.WORRIED: "You have some concerns on your mind. You might ask more questions or express caution.",
            MoodState.CALM: "You're feeling calm and collected. You provide balanced, thoughtful responses.",
            MoodState.RUSHED: "You're feeling time pressure. You're more direct and action-oriented.",
            MoodState.CONFIDENT: "You're feeling confident and sure of yourself. You're more decisive and assertive."
        }
        
        context = mood_contexts.get(mood, "")
        
        # Add stress-specific indicators
        if stress.value >= 3:  # High stress
            stress_behaviors = baseline["stress_indicators"]
            context += f" Due to current stress, you tend to: {', '.join(stress_behaviors)}."
        
        return context
    
    def simulate_daily_mood_changes(self, agent_id: str, time_of_day: str) -> MoodState:
        """Simulate natural mood changes throughout the day"""
        time_mood_patterns = {
            "morning": [MoodState.ENERGETIC, MoodState.FOCUSED, MoodState.CALM],
            "midday": [MoodState.FOCUSED, MoodState.RUSHED, MoodState.CONFIDENT],
            "afternoon": [MoodState.TIRED, MoodState.FOCUSED, MoodState.STRESSED],
            "evening": [MoodState.TIRED, MoodState.CALM, MoodState.WORRIED]
        }
        
        possible_moods = time_mood_patterns.get(time_of_day, [MoodState.CALM])
        
        # Stress level influences mood selection
        stress_level = self.agent_stress_levels.get(agent_id, StressLevel.LOW).value
        if stress_level >= 3:
            # High stress overrides natural patterns
            possible_moods = [MoodState.STRESSED, MoodState.FRUSTRATED, MoodState.WORRIED]
        
        new_mood = random.choice(possible_moods)
        self.agent_moods[agent_id] = new_mood
        return new_mood
    
    def get_stress_level_description(self, agent_id: str) -> str:
        """Get human-readable stress level description"""
        stress = self.agent_stress_levels.get(agent_id, StressLevel.LOW)
        
        descriptions = {
            StressLevel.LOW: "relaxed and comfortable",
            StressLevel.MODERATE: "slightly pressured but managing well",
            StressLevel.HIGH: "noticeably stressed and concerned",
            StressLevel.CRITICAL: "overwhelmed and struggling to cope"
        }
        
        return descriptions[stress]
    
    def create_workplace_scenario(self, scenario_type: str) -> Dict[str, Any]:
        """Create scenarios that naturally trigger stress and mood changes"""
        scenarios = {
            "deadline_crunch": {
                "description": "Major client deadline moved up by a week",
                "affected_agents": ["manager_001", "developer_001", "qa_001"],
                "stress_triggers": {
                    "manager_001": (StressTrigger.CLIENT_PRESSURE, 3),
                    "developer_001": (StressTrigger.TIGHT_DEADLINE, 2),
                    "qa_001": (StressTrigger.WORKLOAD_INCREASE, 3)
                },
                "duration_hours": 72
            },
            "production_bug": {
                "description": "Critical bug found in production system",
                "affected_agents": ["developer_001", "qa_001", "manager_001"],
                "stress_triggers": {
                    "developer_001": (StressTrigger.TECHNICAL_ISSUE, 3),
                    "qa_001": (StressTrigger.COMPLEX_PROBLEM, 2),
                    "manager_001": (StressTrigger.CLIENT_PRESSURE, 2)
                },
                "duration_hours": 24
            },
            "requirements_change": {
                "description": "Client wants major changes to project scope",
                "affected_agents": ["analyst_001", "designer_001", "manager_001"],
                "stress_triggers": {
                    "analyst_001": (StressTrigger.UNCLEAR_REQUIREMENTS, 2),
                    "designer_001": (StressTrigger.UNCLEAR_REQUIREMENTS, 3),
                    "manager_001": (StressTrigger.CLIENT_PRESSURE, 2)
                },
                "duration_hours": 48
            }
        }
        
        return scenarios.get(scenario_type, {})

# Integration example
def get_enhanced_agent_context(agent_id: str, mood_manager: MoodAndStressManager) -> str:
    """Get enhanced context including mood and stress for agent responses"""
    
    mood_context = mood_manager.get_mood_context(agent_id)
    stress_description = mood_manager.get_stress_level_description(agent_id)
    
    return f"""
CURRENT EMOTIONAL STATE:
You are currently {stress_description}.

MOOD AND BEHAVIOR:
{mood_context}

IMPORTANT: Let your current mood subtly influence your response style, but remain professional. 
Don't explicitly mention your stress level, but let it show through your communication patterns.
"""
