#!/usr/bin/env python3
"""
Office Politics and Interpersonal Dynamics Module
Adds realistic workplace tensions, alliances, and personality conflicts
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
import random
from enum import Enum

class RelationshipType(Enum):
    MENTOR_MENTEE = "mentor_mentee"
    ALLIES = "allies"
    RIVALS = "rivals"
    NEUTRAL = "neutral"
    TENSE = "tense"
    COLLABORATIVE = "collaborative"

class PersonalityTrait(Enum):
    PERFECTIONIST = "perfectionist"
    DEADLINE_STRESSED = "deadline_stressed"
    SOCIAL_BUTTERFLY = "social_butterfly"
    QUIET_FOCUSED = "quiet_focused"
    DIPLOMATIC = "diplomatic"
    DIRECT_BLUNT = "direct_blunt"
    OPTIMISTIC = "optimistic"
    REALISTIC_CAUTIOUS = "realistic_cautious"

class OfficePoliticsManager:
    """Manages realistic office dynamics and interpersonal relationships"""
    
    def __init__(self):
        self.agent_relationships: Dict[str, Dict[str, RelationshipType]] = {}
        self.agent_personality_traits: Dict[str, List[PersonalityTrait]] = {}
        self.current_office_mood: str = "normal"
        self.recent_conflicts: List[Dict] = []
        self.alliance_groups: List[List[str]] = []
        
    def initialize_agent_dynamics(self):
        """Initialize realistic interpersonal dynamics between agents"""
        
        # Sarah (Manager) relationships
        self.agent_relationships["manager_001"] = {
            "developer_001": RelationshipType.MENTOR_MENTEE,  # Sarah mentors Alex
            "qa_001": RelationshipType.ALLIES,  # Sarah and David work well together
            "designer_001": RelationshipType.COLLABORATIVE,  # Good working relationship
            "analyst_001": RelationshipType.NEUTRAL  # Professional but not close
        }
        
        # Alex (Senior Dev) relationships  
        self.agent_relationships["developer_001"] = {
            "manager_001": RelationshipType.MENTOR_MENTEE,  # Alex respects Sarah
            "qa_001": RelationshipType.TENSE,  # Alex sometimes frustrated with QA processes
            "designer_001": RelationshipType.ALLIES,  # Alex and Emma collaborate well
            "analyst_001": RelationshipType.COLLABORATIVE  # Good technical discussions
        }
        
        # David (QA) relationships
        self.agent_relationships["qa_001"] = {
            "manager_001": RelationshipType.ALLIES,  # David appreciates Sarah's support
            "developer_001": RelationshipType.TENSE,  # Tension over bug reports
            "designer_001": RelationshipType.NEUTRAL,  # Limited interaction
            "analyst_001": RelationshipType.RIVALS  # Compete over process improvements
        }
        
        # Emma (Designer) relationships
        self.agent_relationships["designer_001"] = {
            "manager_001": RelationshipType.COLLABORATIVE,  # Good project alignment
            "developer_001": RelationshipType.ALLIES,  # Strong design-dev partnership
            "qa_001": RelationshipType.NEUTRAL,  # Occasional UX testing discussions
            "analyst_001": RelationshipType.COLLABORATIVE  # Work together on user requirements
        }
        
        # Lisa (Analyst) relationships
        self.agent_relationships["analyst_001"] = {
            "manager_001": RelationshipType.NEUTRAL,  # Professional relationship
            "developer_001": RelationshipType.COLLABORATIVE,  # Technical requirement discussions
            "qa_001": RelationshipType.RIVALS,  # Compete over process ownership
            "designer_001": RelationshipType.COLLABORATIVE  # User experience focus
        }
        
        # Assign personality traits
        self.agent_personality_traits = {
            "manager_001": [PersonalityTrait.DIPLOMATIC, PersonalityTrait.DEADLINE_STRESSED],
            "developer_001": [PersonalityTrait.PERFECTIONIST, PersonalityTrait.DIRECT_BLUNT],
            "qa_001": [PersonalityTrait.PERFECTIONIST, PersonalityTrait.REALISTIC_CAUTIOUS],
            "designer_001": [PersonalityTrait.OPTIMISTIC, PersonalityTrait.SOCIAL_BUTTERFLY],
            "analyst_001": [PersonalityTrait.DIPLOMATIC, PersonalityTrait.QUIET_FOCUSED]
        }
        
        # Form alliance groups
        self.alliance_groups = [
            ["manager_001", "qa_001"],  # Management-QA alliance
            ["developer_001", "designer_001"],  # Dev-Design partnership
        ]
    
    def get_relationship_context(self, agent1_id: str, agent2_id: str) -> str:
        """Get relationship context between two agents"""
        if agent1_id not in self.agent_relationships:
            return ""
            
        relationship = self.agent_relationships[agent1_id].get(agent2_id, RelationshipType.NEUTRAL)
        
        contexts = {
            RelationshipType.MENTOR_MENTEE: "Remember, you have a mentoring relationship with this person. Be supportive but also guide them professionally.",
            RelationshipType.ALLIES: "You work very well with this person and trust their judgment. Feel free to be more informal and collaborative.",
            RelationshipType.RIVALS: "You have some professional tension with this person. Be polite but slightly guarded. You may disagree on approaches.",
            RelationshipType.TENSE: "There's some underlying tension here. Be professional but you might show slight frustration or defensiveness.",
            RelationshipType.COLLABORATIVE: "You have a good working relationship. Be warm and professional.",
            RelationshipType.NEUTRAL: "Professional relationship with no particular history or tension."
        }
        
        return contexts.get(relationship, "")
    
    def get_relationship_context(self, agent_id: str) -> str:
        """Get relationship context for an agent with all other agents"""
        if agent_id not in self.agent_relationships:
            return "New team member still building relationships."
        
        relationships = self.agent_relationships[agent_id]
        context_lines = []
        
        for other_agent_id, relationship_type in relationships.items():
            other_agent_name = self._get_agent_name(other_agent_id)
            
            if relationship_type == RelationshipType.MENTOR_MENTEE:
                context_lines.append(f"Has a mentoring relationship with {other_agent_name}")
            elif relationship_type == RelationshipType.ALLIES:
                context_lines.append(f"Works closely with {other_agent_name} as trusted allies")
            elif relationship_type == RelationshipType.RIVALS:
                context_lines.append(f"Has some professional rivalry with {other_agent_name}")
            elif relationship_type == RelationshipType.TENSE:
                context_lines.append(f"Experiences workplace tension with {other_agent_name}")
            elif relationship_type == RelationshipType.COLLABORATIVE:
                context_lines.append(f"Collaborates effectively with {other_agent_name}")
            elif relationship_type == RelationshipType.NEUTRAL:
                context_lines.append(f"Maintains professional relationship with {other_agent_name}")
        
        return "; ".join(context_lines) if context_lines else "Building relationships with the team."
    
    def get_personality_context(self, agent_id: str, situation: str = "normal") -> str:
        """Get personality-based context for responses"""
        traits = self.agent_personality_traits.get(agent_id, [])
        context_parts = []
        
        for trait in traits:
            if trait == PersonalityTrait.PERFECTIONIST:
                context_parts.append("You tend to focus on details and quality. You might point out potential issues or suggest improvements.")
            elif trait == PersonalityTrait.DEADLINE_STRESSED and situation == "urgent":
                context_parts.append("You're feeling pressure from deadlines. You might be slightly more direct or show concern about timelines.")
            elif trait == PersonalityTrait.SOCIAL_BUTTERFLY:
                context_parts.append("You enjoy connecting with people. You might ask about their weekend or make friendly small talk.")
            elif trait == PersonalityTrait.DIRECT_BLUNT:
                context_parts.append("You communicate directly and honestly. You might be more straightforward than diplomatic.")
            elif trait == PersonalityTrait.DIPLOMATIC:
                context_parts.append("You're skilled at handling sensitive situations tactfully. You choose your words carefully.")
            elif trait == PersonalityTrait.REALISTIC_CAUTIOUS:
                context_parts.append("You tend to think through potential problems. You might raise concerns or suggest being careful.")
        
        return " ".join(context_parts)
    
    def get_personality_traits(self, agent_id: str) -> str:
        """Get personality traits description for an agent"""
        if agent_id not in self.agent_personality_traits:
            return "Still developing workplace personality."
        
        traits = self.agent_personality_traits[agent_id]
        trait_descriptions = []
        
        for trait in traits:
            if trait == PersonalityTrait.PERFECTIONIST:
                trait_descriptions.append("Perfectionist - pays attention to details")
            elif trait == PersonalityTrait.DEADLINE_STRESSED:
                trait_descriptions.append("Gets stressed under tight deadlines")
            elif trait == PersonalityTrait.SOCIAL_BUTTERFLY:
                trait_descriptions.append("Social butterfly - enjoys team interactions")
            elif trait == PersonalityTrait.QUIET_FOCUSED:
                trait_descriptions.append("Quiet and focused - prefers deep work")
            elif trait == PersonalityTrait.DIPLOMATIC:
                trait_descriptions.append("Diplomatic - skilled at managing conflicts")
            elif trait == PersonalityTrait.DIRECT_BLUNT:
                trait_descriptions.append("Direct and honest - speaks plainly")
            elif trait == PersonalityTrait.OPTIMISTIC:
                trait_descriptions.append("Optimistic - maintains positive outlook")
            elif trait == PersonalityTrait.REALISTIC_CAUTIOUS:
                trait_descriptions.append("Realistic and cautious - considers risks")
        
        return "; ".join(trait_descriptions)
    
    def apply_personality_traits(self):
        """Apply personality traits to agent behavior"""
        # This method sets up the personality traits mapping
        # Already done in initialize_agent_dynamics
        pass
    
    def simulate_office_event(self, event_type: str) -> Dict[str, Any]:
        """Simulate office events that affect dynamics"""
        events = {
            "deadline_pressure": {
                "description": "Major deadline approaching",
                "mood_change": "stressed",
                "affected_relationships": ["developer_001", "qa_001"],  # More tension
                "duration_days": 3
            },
            "successful_launch": {
                "description": "Project launched successfully",
                "mood_change": "celebratory",
                "affected_relationships": "all_positive",
                "duration_days": 2
            },
            "budget_cuts": {
                "description": "Company announced budget reductions",
                "mood_change": "anxious",
                "affected_relationships": ["manager_001"],  # Sarah more stressed
                "duration_days": 7
            },
            "new_hire": {
                "description": "New team member joining",
                "mood_change": "curious",
                "affected_relationships": "social_agents",  # Emma more excited
                "duration_days": 5
            }
        }
        
        return events.get(event_type, {})
    
    def get_conflict_scenario(self) -> Dict[str, Any]:
        """Generate realistic workplace conflict scenarios"""
        scenarios = [
            {
                "type": "process_disagreement",
                "agents": ["developer_001", "qa_001"],
                "trigger": "Bug report that Alex thinks is a feature request",
                "context": "Alex feels David is being too picky about edge cases. David feels Alex isn't taking quality seriously.",
                "resolution_needed": True
            },
            {
                "type": "resource_competition",
                "agents": ["qa_001", "analyst_001"],
                "trigger": "Both want to lead the new process improvement initiative",
                "context": "David and Lisa both see this as their area of expertise. Some ego involved.",
                "resolution_needed": True
            },
            {
                "type": "communication_style_clash",
                "agents": ["developer_001", "manager_001"],
                "trigger": "Alex's direct feedback style vs Sarah's diplomatic approach",
                "context": "Alex gave blunt feedback in a meeting that Sarah felt was too harsh for the client.",
                "resolution_needed": False
            }
        ]
        
        return random.choice(scenarios)
    
    def add_personal_context(self, agent_id: str) -> str:
        """Add personal context that affects workplace behavior"""
        personal_contexts = {
            "manager_001": [
                "You mentioned your daughter's soccer game last week",
                "You're trying to balance work and family time",
                "You had a great weekend hiking with your family"
            ],
            "developer_001": [
                "You're excited about the new programming language you're learning",
                "You're training for a marathon and sometimes mention running",
                "You had trouble sleeping last night due to debugging a complex issue"
            ],
            "qa_001": [
                "You're passionate about process improvement and quality",
                "You recently got a certification in test automation",
                "You're frustrated with the technical debt in the current system"
            ],
            "designer_001": [
                "You went to an inspiring design conference last month",
                "You're excited about the new design system project",
                "You've been experimenting with new prototyping tools"
            ],
            "analyst_001": [
                "You're working on an MBA in the evenings",
                "You're interested in data-driven decision making",
                "You recently read an article about workflow optimization"
            ]
        }
        
        contexts = personal_contexts.get(agent_id, [])
        return random.choice(contexts) if contexts else ""
    
    def _get_agent_name(self, agent_id: str) -> str:
        """Get human-readable name for agent ID"""
        name_mapping = {
            "manager_001": "Sarah",
            "developer_001": "Alex", 
            "qa_001": "David",
            "designer_001": "Emma",
            "analyst_001": "Lisa"
        }
        return name_mapping.get(agent_id, "Unknown Team Member")

# Usage example
def enhance_agent_response_with_dynamics(agent_id: str, message: str, context: str, 
                                       politics_manager: OfficePoliticsManager) -> str:
    """Enhance agent response with office dynamics"""
    
    # Get personality context
    personality_context = politics_manager.get_personality_context(agent_id)
    
    # Get personal context
    personal_context = politics_manager.add_personal_context(agent_id)
    
    # Combine contexts
    enhanced_context = f"""
{context}

INTERPERSONAL DYNAMICS:
{personality_context}

PERSONAL CONTEXT:
{personal_context}

RESPONSE STYLE:
- Show your personality traits naturally
- Reference personal interests occasionally 
- React authentically to workplace situations
- Don't be artificially perfect or always agreeable
"""
    
    return enhanced_context
