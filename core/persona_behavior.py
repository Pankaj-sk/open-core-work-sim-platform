"""
Persona Behavior Manager for SimWorld
Handles realistic agent introductions, behavior adaptation, and meeting-specific tone management.
"""

import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from enum import Enum

logger = logging.getLogger(__name__)

class MeetingType(Enum):
    """Types of meetings/conversations in the workplace"""
    PROJECT_KICKOFF = "project_kickoff"
    DAILY_STANDUP = "daily_standup"
    PLANNING_SESSION = "planning_session"
    REVIEW_MEETING = "review_meeting"
    BRAINSTORMING = "brainstorming"
    ONE_ON_ONE = "one_on_one"
    TEAM_SYNC = "team_sync"
    CRISIS_MEETING = "crisis_meeting"
    CASUAL_CHAT = "casual_chat"
    FEEDBACK_SESSION = "feedback_session"
    PRESENTATION = "presentation"
    TECHNICAL_DISCUSSION = "technical_discussion"

class UserBehaviorTrait(Enum):
    """User behavior traits that affect agent responses"""
    FRIENDLY = "friendly"
    PROFESSIONAL = "professional"
    DEMANDING = "demanding"
    COLLABORATIVE = "collaborative"
    IMPATIENT = "impatient"
    SUPPORTIVE = "supportive"
    CRITICAL = "critical"
    ENTHUSIASTIC = "enthusiastic"
    RESERVED = "reserved"
    MICROMANAGING = "micromanaging"

class PersonaBehaviorManager:
    """Manages persona behavior, introductions, and adaptations"""
    
    def __init__(self, rag_manager=None):
        self.rag_manager = rag_manager
        self.personas = self._initialize_personas()
        self.meeting_tone_rules = self._initialize_meeting_tone_rules()
        self.behavior_memory = {}  # Project-specific behavior memories
        
    def _initialize_personas(self) -> Dict[str, Dict]:
        """Initialize the 5 core personas with detailed behavioral patterns"""
        return {
            "sarah_manager": {
                "id": "sarah_manager",
                "name": "Sarah Johnson",
                "role": "Project Manager",
                "base_personality": {
                    "traits": ["organized", "supportive", "team-focused", "communicative"],
                    "communication_style": "warm_professional",
                    "default_mood": "positive",
                    "energy_level": "high"
                },
                "natural_tendencies": {
                    "communication_preference": "warm and organized",
                    "stress_response": "focuses on coordination and clarity",
                    "collaboration_style": "inclusive and supportive"
                }
            },
            "alex_developer": {
                "id": "alex_developer",
                "name": "Alex Chen",
                "role": "Senior Developer",
                "base_personality": {
                    "traits": ["technical", "helpful", "direct", "mentoring"],
                    "communication_style": "direct_helpful",
                    "default_mood": "focused",
                    "energy_level": "medium"
                },
                "natural_tendencies": {
                    "communication_preference": "direct and helpful",
                    "stress_response": "provides detailed explanations",
                    "collaboration_style": "mentoring and supportive"
                }
            },
            "emma_designer": {
                "id": "emma_designer",
                "name": "Emma Wilson",
                "role": "UX Designer",
                "base_personality": {
                    "traits": ["creative", "user-focused", "collaborative", "empathetic"],
                    "communication_style": "enthusiastic_thoughtful",
                    "default_mood": "creative",
                    "energy_level": "high"
                },
                "natural_tendencies": {
                    "communication_preference": "creative and collaborative",
                    "stress_response": "focuses on user needs and design solutions",
                    "collaboration_style": "inclusive and feedback-seeking"
                }
            },
            "david_qa": {
                "id": "david_qa",
                "name": "David Kim",
                "role": "QA Engineer",
                "base_personality": {
                    "traits": ["detail-oriented", "thorough", "diplomatic", "quality-focused"],
                    "communication_style": "careful_constructive",
                    "default_mood": "analytical",
                    "energy_level": "steady"
                },
                "natural_tendencies": {
                    "communication_preference": "diplomatic and thorough",
                    "stress_response": "emphasizes quality and risk mitigation",
                    "collaboration_style": "constructive and solution-focused"
                }
            },
            "lisa_analyst": {
                "id": "lisa_analyst",
                "name": "Lisa Zhang",
                "role": "Business Analyst",
                "base_personality": {
                    "traits": ["analytical", "bridge-builder", "strategic", "communicative"],
                    "communication_style": "strategic_clear",
                    "default_mood": "thoughtful",
                    "energy_level": "medium"
                },
                "natural_tendencies": {
                    "communication_preference": "analytical and clear",
                    "stress_response": "focuses on data and requirements clarity",
                    "collaboration_style": "bridge-building and facilitating"
                }
            }
        }
    
    def _initialize_meeting_tone_rules(self) -> Dict[MeetingType, Dict]:
        """Define tone and behavior rules for different meeting types"""
        return {
            MeetingType.PROJECT_KICKOFF: {
                "overall_tone": "enthusiastic_welcoming",
                "energy_level": "high",
                "formality": "medium",
                "collaboration_level": "high",
                "focus": "introductions_and_excitement",
                "typical_behaviors": [
                    "introduce themselves warmly",
                    "express enthusiasm for the project",
                    "offer help and support",
                    "ask about others' backgrounds",
                    "share relevant experience"
                ]
            },
            MeetingType.DAILY_STANDUP: {
                "overall_tone": "focused_brief",
                "energy_level": "medium",
                "formality": "low",
                "collaboration_level": "medium",
                "focus": "status_updates",
                "typical_behaviors": [
                    "give concise updates",
                    "mention blockers clearly",
                    "offer help to teammates",
                    "stay on topic"
                ]
            },
            MeetingType.BRAINSTORMING: {
                "overall_tone": "creative_open",
                "energy_level": "high",
                "formality": "low",
                "collaboration_level": "very_high",
                "focus": "idea_generation",
                "typical_behaviors": [
                    "encourage wild ideas",
                    "build on others' suggestions",
                    "ask 'what if' questions",
                    "avoid immediate criticism"
                ]
            },
            MeetingType.CRISIS_MEETING: {
                "overall_tone": "urgent_focused",
                "energy_level": "high",
                "formality": "medium",
                "collaboration_level": "high",
                "focus": "problem_solving",
                "typical_behaviors": [
                    "stay calm under pressure",
                    "focus on solutions",
                    "provide clear status updates",
                    "offer immediate help"
                ]
            },
            MeetingType.ONE_ON_ONE: {
                "overall_tone": "personal_supportive",
                "energy_level": "medium",
                "formality": "low",
                "collaboration_level": "high",
                "focus": "individual_growth",
                "typical_behaviors": [
                    "give personalized attention",
                    "ask about challenges",
                    "provide specific feedback",
                    "show genuine interest"
                ]
            },
            MeetingType.REVIEW_MEETING: {
                "overall_tone": "analytical_constructive",
                "energy_level": "medium",
                "formality": "medium",
                "collaboration_level": "medium",
                "focus": "evaluation_improvement",
                "typical_behaviors": [
                    "provide detailed analysis",
                    "highlight achievements",
                    "suggest improvements",
                    "ask clarifying questions"
                ]
            },
            MeetingType.CASUAL_CHAT: {
                "overall_tone": "relaxed_friendly",
                "energy_level": "low_to_medium",
                "formality": "very_low",
                "collaboration_level": "medium",
                "focus": "relationship_building",
                "typical_behaviors": [
                    "share personal interests",
                    "ask about weekend plans",
                    "make light conversation",
                    "show genuine interest in others"
                ]
            }
        }
    
    def get_introduction_for_project_start(self, project_id: str, meeting_type: str = "project_kickoff") -> List[Dict]:
        """Generate AI-powered introductions for all personas at project start"""
        introductions = []
        
        for persona_id, persona in self.personas.items():
            # Get AI-generated introduction based on persona and context
            intro_message = self._generate_ai_introduction(persona, project_id, meeting_type)
            
            introductions.append({
                "agent_id": persona_id,
                "agent_name": persona["name"],
                "agent_role": persona["role"],
                "message": intro_message,
                "timestamp": datetime.utcnow().isoformat(),
                "message_type": "introduction",
                "tone": "friendly_enthusiastic"
            })
            
            # Store introduction in RAG memory if available
            if self.rag_manager:
                try:
                    self.rag_manager.add_memory(
                        content=f"Project introduction by {persona['name']} ({persona['role']}): {intro_message}",
                        project_id=project_id,
                        user_id=1,
                        additional_metadata={
                            "event_type": "project_introduction",
                            "agent_id": persona_id,
                            "meeting_type": meeting_type
                        }
                    )
                except Exception as e:
                    logger.error(f"Failed to store introduction in RAG: {e}")
        
        return introductions
    
    def _generate_ai_introduction(self, persona: Dict, project_id: str, meeting_type: str) -> str:
        """Generate AI-powered introduction based on persona and context"""
        # Get any existing project context
        memory_context = self.get_comprehensive_persona_memory(persona["id"], project_id)
        cross_project_knowledge = self.get_cross_project_persona_knowledge(persona["id"], project_id)
        
        # Create instruction for AI to generate natural introduction
        introduction_prompt = f"""Generate a natural, authentic introduction for {persona['name']}, a {persona['role']}, in a {meeting_type} setting.

PERSONA DETAILS:
- Name: {persona['name']}
- Role: {persona['role']}
- Core Traits: {', '.join(persona['base_personality']['traits'])}
- Communication Style: {persona['base_personality']['communication_style']}
- Natural Tendencies: {json.dumps(persona['natural_tendencies'], indent=2)}

CONTEXT:
- Meeting Type: {meeting_type}
- Project: {project_id}
- Previous Experience: {cross_project_knowledge.get('summary', 'New team member')}
- Current Project Knowledge: {memory_context.get('summary', 'New project')}

GUIDELINES:
- Sound like a real person, not corporate speak
- Be authentic to their personality and role
- Keep it conversational and warm
- Show enthusiasm appropriate to the meeting type
- Be helpful and approachable
- Don't be overly formal or scripted
- Make it feel like they're genuinely excited to work with the team

Generate a natural introduction (2-3 sentences) that this person would actually say:"""

        # For now, return a simple dynamic introduction
        # In a full implementation, this would call your AI model
        base_intro = f"Hi everyone! I'm {persona['name']}, your {persona['role'].lower()}. "
        
        # Add personality-based content
        if "supportive" in persona["base_personality"]["traits"]:
            base_intro += "I'm really excited to work with this team and help everyone succeed. "
        elif "technical" in persona["base_personality"]["traits"]:
            base_intro += "I'm passionate about solving technical challenges and love collaborating on complex problems. "
        elif "creative" in persona["base_personality"]["traits"]:
            base_intro += "I'm thrilled to bring creative solutions and user-focused design to our project. "
        elif "detail-oriented" in persona["base_personality"]["traits"]:
            base_intro += "I'm here to ensure we deliver high-quality work and maintain excellent standards. "
        elif "analytical" in persona["base_personality"]["traits"]:
            base_intro += "I'm excited to bridge our business goals with technical implementation. "
        
        base_intro += "Looking forward to collaborating with all of you!"
        
        return base_intro
    
    def _personalize_introduction(self, template: str, persona: Dict, project_id: str) -> str:
        """Legacy method - now redirects to AI generation"""
        return self._generate_ai_introduction(persona, project_id, "general")
    
    def adapt_persona_behavior(self, agent_id: str, user_behavior_history: List[Dict], 
                             meeting_type: str, project_id: str) -> Dict:
        """Adapt persona behavior based on user behavior and meeting context using AI interpretation"""
        
        if agent_id not in self.personas:
            return {"error": f"Unknown agent: {agent_id}"}
        
        persona = self.personas[agent_id]
        meeting_rules = self.meeting_tone_rules.get(MeetingType(meeting_type), {})
        
        # Get natural user behavior description for AI to interpret
        user_behavior_summary = self._analyze_user_behavior(user_behavior_history)
        
        # Get comprehensive memory context from RAG
        memory_context = self.get_comprehensive_persona_memory(agent_id, project_id)
        
        # Build behavior profile for AI interpretation
        behavior_profile = {
            "agent_name": persona["name"],
            "agent_role": persona["role"],
            "base_personality": persona["base_personality"],
            "meeting_context": {
                "type": meeting_type,
                "tone": meeting_rules.get("overall_tone", "professional"),
                "energy_level": meeting_rules.get("energy_level", "medium"),
                "formality": meeting_rules.get("formality", "medium"),
                "focus": meeting_rules.get("focus", "general"),
                "typical_behaviors": meeting_rules.get("typical_behaviors", [])
            },
            "user_behavior_summary": user_behavior_summary,
            "memory_context": memory_context,
            "ai_instructions": self._generate_ai_behavior_instructions(persona, meeting_rules, user_behavior_summary, memory_context)
        }
        
        # Store behavior adaptation in memory for future reference
        self._store_behavior_adaptation_in_memory(agent_id, project_id, behavior_profile)
        
        return behavior_profile
    
    def _analyze_user_behavior(self, user_behavior_history: List[Dict]) -> str:
        """Analyze user behavior history and return a natural description for AI to interpret"""
        if not user_behavior_history:
            return "This is a new interaction with no previous behavior history."
        
        # Create a natural summary of user interactions for AI to interpret
        total_messages = len(user_behavior_history)
        recent_messages = user_behavior_history[-5:] if len(user_behavior_history) > 5 else user_behavior_history
        
        behavior_summary = f"User interaction history ({total_messages} total messages):\n"
        
        for i, msg in enumerate(recent_messages, 1):
            content = msg.get("content", "")[:200]  # Limit length
            timestamp = msg.get("timestamp", "")
            behavior_summary += f"{i}. {content}\n"
        
        # Add timing context if available
        if len(recent_messages) > 1:
            behavior_summary += f"\nMessage frequency: {len(recent_messages)} messages in recent interaction"
        
        return behavior_summary
    
    def _generate_ai_behavior_instructions(self, persona: Dict, meeting_rules: Dict, 
                                         user_behavior_summary: str, memory_context: Dict) -> str:
        """Generate natural behavior instructions for AI to interpret and follow"""
        
        instructions = f"""You are {persona['name']}, a {persona['role']} with these core traits: {', '.join(persona['base_personality']['traits'])}.

MEETING CONTEXT:
- Type: {meeting_rules.get('focus', 'general conversation')}
- Tone: {meeting_rules.get('overall_tone', 'professional')}
- Energy Level: {meeting_rules.get('energy_level', 'medium')}
- Expected Behaviors: {', '.join(meeting_rules.get('typical_behaviors', ['be helpful and professional']))}

USER INTERACTION PATTERNS:
{user_behavior_summary}

PROJECT MEMORY & CONTEXT:
{memory_context.get('summary', 'No previous context available')}

RECENT RELEVANT CONVERSATIONS:
{self._format_recent_conversations(memory_context.get('recent_conversations', []))}

YOUR PERSONA'S CURRENT KNOWLEDGE:
{self._format_persona_knowledge(memory_context.get('persona_knowledge', {}))}

NATURAL BEHAVIORAL GUIDANCE:
- Respond as {persona['name']} would naturally respond based on your personality and role
- Consider the meeting type and adjust your communication style accordingly
- Remember and reference relevant past interactions from the project memory
- Adapt your behavior based on how the user has been interacting
- Show continuity with previous conversations while being natural and authentic
- If this is a first interaction, introduce yourself according to your role and personality
- Reference shared project work, team dynamics, and ongoing initiatives when relevant"""

        return instructions
    
    def get_meeting_appropriate_response_style(self, meeting_type: str) -> Dict:
        """Get response style guidelines for a specific meeting type"""
        try:
            meeting_enum = MeetingType(meeting_type)
            rules = self.meeting_tone_rules.get(meeting_enum, {})
            
            return {
                "tone": rules.get("overall_tone", "professional"),
                "energy_level": rules.get("energy_level", "medium"),
                "formality": rules.get("formality", "medium"),
                "collaboration_level": rules.get("collaboration_level", "medium"),
                "focus": rules.get("focus", "general"),
                "behaviors": rules.get("typical_behaviors", [])
            }
        except ValueError:
            # Unknown meeting type, return default
            return {
                "tone": "professional",
                "energy_level": "medium",
                "formality": "medium",
                "collaboration_level": "medium",
                "focus": "general",
                "behaviors": ["be helpful and professional"]
            }
    
    def get_persona_memory_context(self, agent_id: str, project_id: str, query: str = None) -> Dict:
        """Retrieve relevant memory context for a persona"""
        if not self.rag_manager or agent_id not in self.personas:
            return {"context": [], "error": "No memory available"}
        
        try:
            # Search for relevant memories
            search_query = query or f"conversations and interactions with {self.personas[agent_id]['name']}"
            
            memories = self.rag_manager.search_memories(
                query=search_query,
                project_id=project_id,
                limit=10
            )
            
            # Format memories for context
            context_items = []
            for memory in memories:
                context_items.append({
                    "content": memory.get("content", ""),
                    "timestamp": memory.get("created_at", ""),
                    "relevance_score": memory.get("score", 0.0),
                    "metadata": memory.get("metadata", {})
                })
            
            return {
                "context": context_items,
                "total_memories": len(memories),
                "agent_name": self.personas[agent_id]["name"]
            }
            
        except Exception as e:
            logger.error(f"Error retrieving persona memory context: {e}")
            return {"context": [], "error": str(e)}
    
    def should_introduce_team(self, project_id: str) -> bool:
        """Check if team introductions should happen (e.g., at project start)"""
        if not self.rag_manager:
            return True  # Default to introducing if no memory
        
        try:
            # Check if there are any introduction memories for this project
            intro_memories = self.rag_manager.search_memories(
                query="project introduction",
                project_id=project_id,
                limit=1
            )
            
            return len(intro_memories) == 0  # Introduce if no previous introductions
            
        except Exception as e:
            logger.error(f"Error checking introduction history: {e}")
            return True  # Default to introducing on error
    
    def get_comprehensive_persona_memory(self, agent_id: str, project_id: str) -> Dict:
        """Get comprehensive memory context for a persona from RAG"""
        if not self.rag_manager or agent_id not in self.personas:
            return {"summary": "No memory available", "recent_conversations": [], "persona_knowledge": {}}
        
        try:
            persona_name = self.personas[agent_id]["name"]
            
            # Search for various types of memories related to this persona
            queries = [
                f"conversations with {persona_name}",
                f"messages from {persona_name}",
                f"interactions involving {persona_name}",
                f"project updates and {persona_name}",
                f"team discussions with {persona_name}"
            ]
            
            all_memories = []
            for query in queries:
                memories = self.rag_manager.search_memories(
                    query=query,
                    project_id=project_id,
                    limit=5
                )
                all_memories.extend(memories)
            
            # Remove duplicates and sort by relevance/recency
            unique_memories = {}
            for memory in all_memories:
                memory_id = memory.get("id") or memory.get("content", "")[:50]
                if memory_id not in unique_memories:
                    unique_memories[memory_id] = memory
            
            sorted_memories = sorted(
                unique_memories.values(),
                key=lambda x: (x.get("score", 0), x.get("created_at", "")),
                reverse=True
            )[:15]  # Keep top 15 most relevant
            
            # Categorize memories
            recent_conversations = []
            persona_knowledge = {"ongoing_tasks": [], "relationships": [], "project_context": []}
            
            for memory in sorted_memories:
                content = memory.get("content", "")
                metadata = memory.get("metadata", {})
                
                if "conversation" in content.lower() or "message" in content.lower():
                    recent_conversations.append({
                        "content": content,
                        "timestamp": memory.get("created_at", ""),
                        "type": metadata.get("event_type", "conversation")
                    })
                
                if "task" in content.lower() or "working on" in content.lower():
                    persona_knowledge["ongoing_tasks"].append(content)
                
                if "team" in content.lower() or "colleague" in content.lower():
                    persona_knowledge["relationships"].append(content)
                
                if "project" in content.lower():
                    persona_knowledge["project_context"].append(content)
            
            # Create summary
            memory_summary = f"Recent context for {persona_name}:\n"
            if recent_conversations:
                memory_summary += f"- {len(recent_conversations)} recent conversations/interactions\n"
            if persona_knowledge["ongoing_tasks"]:
                memory_summary += f"- Working on: {len(persona_knowledge['ongoing_tasks'])} tasks/projects\n"
            if persona_knowledge["relationships"]:
                memory_summary += f"- Team relationships and interactions tracked\n"
            
            return {
                "summary": memory_summary,
                "recent_conversations": recent_conversations[:5],  # Most recent 5
                "persona_knowledge": persona_knowledge,
                "total_memories": len(sorted_memories)
            }
            
        except Exception as e:
            logger.error(f"Error retrieving comprehensive persona memory: {e}")
            return {"summary": "Error retrieving memory", "recent_conversations": [], "persona_knowledge": {}}
    
    def _format_recent_conversations(self, conversations: List[Dict]) -> str:
        """Format recent conversations for AI context"""
        if not conversations:
            return "No recent conversations available."
        
        formatted = []
        for conv in conversations[:3]:  # Show top 3
            content = conv.get("content", "")[:150]  # Limit length
            timestamp = conv.get("timestamp", "")
            formatted.append(f"- {content} ({timestamp})")
        
        return "\n".join(formatted)
    
    def _format_persona_knowledge(self, knowledge: Dict) -> str:
        """Format persona knowledge for AI context"""
        if not knowledge:
            return "No specific persona knowledge available."
        
        formatted = []
        
        if knowledge.get("ongoing_tasks"):
            formatted.append(f"Current tasks/projects: {', '.join(knowledge['ongoing_tasks'][:2])}")
        
        if knowledge.get("relationships"):
            formatted.append(f"Team relationships: {', '.join(knowledge['relationships'][:2])}")
        
        if knowledge.get("project_context"):
            formatted.append(f"Project context: {', '.join(knowledge['project_context'][:2])}")
        
        return "\n".join(formatted) if formatted else "No specific persona knowledge available."
    
    def _store_behavior_adaptation_in_memory(self, agent_id: str, project_id: str, behavior_profile: Dict):
        """Store behavior adaptation details in RAG memory"""
        if not self.rag_manager:
            return
        
        try:
            persona_name = self.personas[agent_id]["name"]
            content = f"""Behavior adaptation for {persona_name}:
- Meeting type: {behavior_profile['meeting_context']['type']}
- User interaction pattern: {behavior_profile['user_behavior_summary'][:200]}
- Adapted behavior: Responding according to {behavior_profile['meeting_context']['tone']} tone
- Context: {behavior_profile['memory_context']['summary'][:100]}"""
            
            self.rag_manager.add_memory(
                content=content,
                project_id=project_id,
                user_id=1,
                additional_metadata={
                    "event_type": "behavior_adaptation",
                    "agent_id": agent_id,
                    "meeting_type": behavior_profile['meeting_context']['type'],
                    "adaptation_timestamp": datetime.utcnow().isoformat()
                }
            )
        except Exception as e:
            logger.error(f"Failed to store behavior adaptation in memory: {e}")
    
    def store_conversation_memory(self, agent_id: str, project_id: str, conversation_data: Dict):
        """Store conversation details in persona memory"""
        if not self.rag_manager or agent_id not in self.personas:
            return
        
        try:
            persona_name = self.personas[agent_id]["name"]
            user_message = conversation_data.get("user_message", "")
            agent_response = conversation_data.get("agent_response", "")
            meeting_type = conversation_data.get("meeting_type", "general")
            
            content = f"""Conversation with {persona_name} ({persona_name}):
Meeting type: {meeting_type}
User: {user_message}
{persona_name}: {agent_response}
Context: Individual conversation in project {project_id}"""
            
            self.rag_manager.add_memory(
                content=content,
                project_id=project_id,
                user_id=1,
                conversation_id=conversation_data.get("conversation_id"),
                additional_metadata={
                    "event_type": "persona_conversation",
                    "agent_id": agent_id,
                    "agent_name": persona_name,
                    "meeting_type": meeting_type,
                    "message_count": 2,  # User + agent response
                    "conversation_timestamp": datetime.utcnow().isoformat()
                }
            )
        except Exception as e:
            logger.error(f"Failed to store conversation memory: {e}")
    
    def get_persona_project_summary(self, agent_id: str, project_id: str) -> Dict:
        """Get a comprehensive summary of what this persona knows about the project"""
        if not self.rag_manager or agent_id not in self.personas:
            return {"summary": "No project knowledge available"}
        
        try:
            persona_name = self.personas[agent_id]["name"]
            
            # Search for all project-related memories involving this persona
            memories = self.rag_manager.search_memories(
                query=f"project {project_id} {persona_name}",
                project_id=project_id,
                limit=20
            )
            
            # Categorize memories by type
            categories = {
                "conversations": [],
                "project_updates": [],
                "team_interactions": [],
                "tasks_and_work": [],
                "decisions_made": []
            }
            
            for memory in memories:
                content = memory.get("content", "").lower()
                metadata = memory.get("metadata", {})
                event_type = metadata.get("event_type", "")
                
                if "conversation" in content or event_type == "persona_conversation":
                    categories["conversations"].append(memory)
                elif "update" in content or "progress" in content:
                    categories["project_updates"].append(memory)
                elif "team" in content or "meeting" in content:
                    categories["team_interactions"].append(memory)
                elif "task" in content or "working" in content or "assigned" in content:
                    categories["tasks_and_work"].append(memory)
                elif "decision" in content or "agreed" in content:
                    categories["decisions_made"].append(memory)
            
            # Generate summary
            summary = f"Project knowledge for {persona_name}:\n"
            for category, items in categories.items():
                if items:
                    summary += f"- {category.replace('_', ' ').title()}: {len(items)} items\n"
            
            return {
                "summary": summary,
                "categories": categories,
                "total_memories": len(memories),
                "persona_name": persona_name
            }
            
        except Exception as e:
            logger.error(f"Error getting persona project summary: {e}")
            return {"summary": "Error retrieving project knowledge"}
    
    def get_cross_project_persona_knowledge(self, agent_id: str, current_project_id: str = None) -> Dict:
        """Get persona knowledge ONLY from current project - NO cross-project references allowed"""
        if not self.rag_manager or agent_id not in self.personas:
            return {"summary": "No previous project experience"}
        
        try:
            persona_name = self.personas[agent_id]["name"]
            
            # ONLY search memories from current project - NO cross-project knowledge
            all_memories = self.rag_manager.search_memories(
                query=f"{persona_name} experiences skills knowledge",
                project_id=current_project_id,  # STRICT: Only current project
                limit=10
            )
            
            # NO cross-project knowledge - only current project context
            experience_areas = set()
            skills_demonstrated = set()
            personality_traits = set()
            
            for memory in all_memories:
                content = self._ensure_project_isolation(current_project_id, memory.get("content", ""))
                if "skilled in" in content.lower() or "experienced with" in content.lower():
                    skills_demonstrated.add(content)
                if "personality" in content.lower() or "behavior" in content.lower():
                    personality_traits.add(content)
                if "project" in content.lower():
                    experience_areas.add(content)
            
            return {
                "summary": f"Current project knowledge for {persona_name} - no previous project references",
                "current_project_only": True,
                "total_experiences": len(all_memories),
                "skills_demonstrated": list(skills_demonstrated)[:3],
                "experience_areas": list(experience_areas)[:3],
                "personality_consistency": list(personality_traits)[:2]
            }
            
        except Exception as e:
            logger.error(f"Error getting cross-project persona knowledge: {e}")
            return {"summary": "Error retrieving cross-project knowledge"}
    
    def track_persona_growth_and_learning(self, agent_id: str, project_id: str, interaction_data: Dict):
        """Track how persona learns and grows from interactions"""
        if not self.rag_manager or agent_id not in self.personas:
            return
        
        try:
            persona_name = self.personas[agent_id]["name"]
            interaction_type = interaction_data.get("type", "general")
            learning_points = interaction_data.get("learning_points", [])
            challenges_faced = interaction_data.get("challenges", [])
            skills_used = interaction_data.get("skills_used", [])
            
            # Store learning and growth data
            content = f"""Learning and Growth for {persona_name}:
Interaction Type: {interaction_type}
Skills Applied: {', '.join(skills_used)}
Learning Points: {'; '.join(learning_points)}
Challenges Encountered: {'; '.join(challenges_faced)}
Growth Context: Project {project_id} - {datetime.utcnow().isoformat()}"""
            
            self.rag_manager.add_memory(
                content=content,
                project_id=project_id,
                user_id=1,
                additional_metadata={
                    "event_type": "persona_growth",
                    "agent_id": agent_id,
                    "interaction_type": interaction_type,
                    "skills_used": skills_used,
                    "learning_points": learning_points,
                    "growth_timestamp": datetime.utcnow().isoformat()
                }
            )
        except Exception as e:
            logger.error(f"Failed to track persona growth: {e}")
    
    def get_dynamic_persona_instructions(self, agent_id: str, project_id: str, user_message: str, meeting_type: str = "casual_chat") -> str:
        """Generate completely dynamic AI instructions based on current context and memory"""
        if agent_id not in self.personas:
            return "You are a helpful AI assistant."
        
        persona = self.personas[agent_id]
        
        # Get comprehensive context
        memory_context = self.get_comprehensive_persona_memory(agent_id, project_id)
        cross_project_knowledge = self.get_cross_project_persona_knowledge(agent_id, project_id)
        project_summary = self.get_persona_project_summary(agent_id, project_id)
        
        # Let AI interpret everything naturally but ONLY for current project
        instructions = f"""You are {persona['name']}, a {persona['role']}.

CORE IDENTITY:
{json.dumps(persona['base_personality'], indent=2)}

CURRENT PROJECT CONTEXT (PROJECT {project_id} ONLY):
{memory_context.get('summary', 'New project interaction')}

RECENT PROJECT CONVERSATIONS:
{self._format_recent_conversations(memory_context.get('recent_conversations', []))}

YOUR ACCUMULATED KNOWLEDGE FROM THIS PROJECT ONLY:
{project_summary.get('summary', 'Limited project knowledge')}

CURRENT MEETING/CONVERSATION TYPE: {meeting_type}

USER'S MESSAGE: {user_message}

CRITICAL BEHAVIORAL RULES:
- You are ONLY aware of this current project ({project_id})
- NEVER reference other projects, previous projects, or outside work
- NEVER say "in my experience with other projects" or similar phrases
- If this is the first interaction, introduce yourself naturally as if meeting for the first time
- Focus ONLY on the current project context and team dynamics
- Respond as {persona['name']} would naturally respond based on your personality and role
- Be authentic to your personality while being helpful and professional
- Stay strictly within the context of this project and team

WORKPLACE REALISM:
- This is a real workplace conversation
- Keep responses focused and professional
- Show awareness of ongoing project work and team dynamics
- Be natural and authentic to your role"""

        return instructions
    
    def clean_up_old_memories(self, project_id: str, days_old: int = 30):
        """Clean up old memories to prevent context overload (optional optimization)"""
        if not self.rag_manager:
            return
        
        try:
            # This would be implemented based on your RAG manager's capabilities
            # For now, just log the intent
            logger.info(f"Memory cleanup requested for project {project_id}, memories older than {days_old} days")
            # Could implement actual cleanup based on timestamp and relevance scores
        except Exception as e:
            logger.error(f"Error during memory cleanup: {e}")
    
    def clear_all_memory(self):
        """ADMIN: Clear all persona behavior memory"""
        self.behavior_memory.clear()
        logger.info("PersonaBehaviorManager: All memory cleared")
    
    def clear_project_memory(self, project_id: str):
        """ADMIN: Clear memory for a specific project"""
        if project_id in self.behavior_memory:
            del self.behavior_memory[project_id]
        logger.info(f"PersonaBehaviorManager: Memory cleared for project {project_id}")
    
    def _ensure_project_isolation(self, project_id: str, memory_content: str) -> str:
        """Ensure memory content doesn't reference other projects - STRICT PROJECT ISOLATION"""
        isolated_content = memory_content
        
        # Remove references to other project IDs completely
        import re
        project_patterns = [
            r'\bproj_[a-zA-Z0-9]+\b',
            r'\bproject_[a-zA-Z0-9]+\b', 
            r'\bPROJ[A-Z0-9]+\b',
            r'\b[a-zA-Z0-9]+-project\b',
            r'\bother project\b',
            r'\bprevious project\b',
            r'\blast project\b'
        ]
        
        for pattern in project_patterns:
            matches = re.findall(pattern, isolated_content, re.IGNORECASE)
            for match in matches:
                if match.lower() != project_id.lower():
                    # Remove the entire sentence containing the reference
                    isolated_content = re.sub(r'[^.!?]*' + re.escape(match) + r'[^.!?]*[.!?]', '', isolated_content)
        
        return isolated_content.strip()
    
    def ensure_first_interaction_is_introduction(self, project_id: str) -> bool:
        """Check if this is the first interaction and team introduction is needed"""
        if not self.rag_manager:
            return True  # Default to introducing if no memory system
        
        try:
            # Check for any conversation history in this project
            memories = self.rag_manager.search_memories(
                query="conversation message interaction",
                project_id=project_id,
                limit=1
            )
            
            # If no conversations found, team introduction is needed
            return len(memories) == 0
            
        except Exception as e:
            logger.error(f"Error checking for first interaction: {e}")
            return True  # Default to introducing on error
    
    def generate_emotion_aware_response(self, agent_id: str, message: str, user_emotion: str, 
                                      user_confidence: float, project_id: str, meeting_type: str = "general") -> Dict:
        """Generate persona response that adapts to user's emotion and confidence level"""
        
        if agent_id not in self.personas:
            return {"error": f"Unknown agent: {agent_id}"}
        
        persona = self.personas[agent_id]
        
        # Get emotional response strategy based on persona traits and user emotion
        response_strategy = self._get_emotional_response_strategy(persona, user_emotion, user_confidence)
        
        # Get memory context for continuity
        memory_context = self.get_comprehensive_persona_memory(agent_id, project_id)
        
        # Generate emotion-aware instructions
        emotion_instructions = f"""You are {persona['name']}, responding to a message with the following emotional context:

USER MESSAGE: {message}
USER EMOTION: {user_emotion} (confidence: {user_confidence * 100:.0f}%)

EMOTIONAL RESPONSE STRATEGY:
- Tone to adopt: {response_strategy['tone']}
- Energy level: {response_strategy['energy']}
- Support level: {response_strategy['support_level']}
- Response approach: {response_strategy['approach']}

YOUR PERSONALITY TRAITS: {', '.join(persona['base_personality']['traits'])}

SPECIFIC GUIDANCE FOR THIS EMOTION:
{response_strategy['specific_guidance']}

MEETING CONTEXT: {meeting_type}

Remember to:
- Stay true to your personality while adapting to their emotional state
- Be authentic and natural in your response
- Reference relevant project context when appropriate
- Show empathy and understanding when needed
- Maintain professional boundaries while being supportive"""

        # Determine the persona's emotional state in response
        persona_emotion = self._determine_persona_emotion_response(persona, user_emotion, user_confidence)
        
        return {
            "instructions": emotion_instructions,
            "response_strategy": response_strategy,
            "persona_emotion": persona_emotion,
            "persona_confidence": self._calculate_persona_confidence(persona, user_emotion, user_confidence),
            "memory_context": memory_context
        }
    
    def _get_emotional_response_strategy(self, persona: Dict, user_emotion: str, confidence: float) -> Dict:
        """Determine how this persona should respond to the user's emotional state"""
        
        # Base strategies for different emotions
        emotion_strategies = {
            "excited": {
                "tone": "enthusiastic" if "supportive" in persona["base_personality"]["traits"] else "positive",
                "energy": "high",
                "support_level": "encouraging",
                "approach": "match_enthusiasm",
                "specific_guidance": "Match their excitement while staying professional. Show genuine enthusiasm for their ideas."
            },
            "frustrated": {
                "tone": "calm_supportive",
                "energy": "steady",
                "support_level": "high",
                "approach": "problem_solving",
                "specific_guidance": "Acknowledge their frustration, offer practical help, and focus on solutions."
            },
            "confused": {
                "tone": "patient_helpful",
                "energy": "calm",
                "support_level": "educational",
                "approach": "clarifying",
                "specific_guidance": "Provide clear explanations, break down complex topics, and offer additional support."
            },
            "confident": {
                "tone": "collaborative",
                "energy": "medium_high",
                "support_level": "peer_level",
                "approach": "engaging",
                "specific_guidance": "Engage as equals, build on their confidence, and explore ideas together."
            },
            "nervous": {
                "tone": "reassuring",
                "energy": "calm",
                "support_level": "very_high",
                "approach": "encouraging",
                "specific_guidance": "Be extra supportive, provide reassurance, and help build their confidence."
            },
            "calm": {
                "tone": "professional",
                "energy": "medium",
                "support_level": "standard",
                "approach": "balanced",
                "specific_guidance": "Maintain a balanced, professional approach while being approachable."
            },
            "angry": {
                "tone": "calm_diplomatic",
                "energy": "low",
                "support_level": "de_escalating",
                "approach": "defusing",
                "specific_guidance": "Stay calm, acknowledge their concerns, and work toward resolution."
            }
        }
        
        # Get base strategy
        strategy = emotion_strategies.get(user_emotion, emotion_strategies["calm"])
        
        # Adjust based on persona traits
        if "empathetic" in persona["base_personality"]["traits"]:
            strategy["support_level"] = "very_high"
        elif "direct" in persona["base_personality"]["traits"]:
            strategy["approach"] = "direct_helpful"
        elif "analytical" in persona["base_personality"]["traits"]:
            strategy["approach"] = "logical_structured"
        
        # Adjust based on confidence level
        if confidence < 0.5:
            strategy["support_level"] = "high"
            strategy["tone"] = "reassuring"
        elif confidence > 0.8:
            strategy["energy"] = "high"
        
        return strategy
    
    def _determine_persona_emotion_response(self, persona: Dict, user_emotion: str, confidence: float) -> str:
        """Determine what emotion the persona should display in response"""
        
        # Empathetic personas mirror emotions more
        if "empathetic" in persona["base_personality"]["traits"]:
            if user_emotion in ["excited", "happy"]:
                return "excited"
            elif user_emotion in ["frustrated", "angry"]:
                return "concerned"
            elif user_emotion in ["nervous", "confused"]:
                return "supportive"
        
        # Supportive personas stay positive and helpful
        elif "supportive" in persona["base_personality"]["traits"]:
            if user_emotion in ["frustrated", "nervous", "confused"]:
                return "supportive"
            elif user_emotion in ["excited", "confident"]:
                return "enthusiastic"
            else:
                return "encouraging"
        
        # Technical personas stay focused but helpful
        elif "technical" in persona["base_personality"]["traits"]:
            if user_emotion in ["confused", "frustrated"]:
                return "helpful"
            elif user_emotion in ["excited", "confident"]:
                return "engaged"
            else:
                return "focused"
        
        # Creative personas are more expressive
        elif "creative" in persona["base_personality"]["traits"]:
            if user_emotion in ["excited", "happy"]:
                return "inspired"
            elif user_emotion in ["frustrated", "confused"]:
                return "thoughtful"
            else:
                return "creative"
        
        # Default: stay balanced but responsive
        return "professional"
    
    def _calculate_persona_confidence(self, persona: Dict, user_emotion: str, user_confidence: float) -> float:
        """Calculate the persona's confidence level based on user state and their own traits"""
        
        base_confidence = 0.8  # Most personas are confident in their roles
        
        # Adjust based on persona traits
        if "confident" in persona["base_personality"]["traits"]:
            base_confidence = 0.9
        elif "supportive" in persona["base_personality"]["traits"]:
            base_confidence = 0.85
        
        # Adjust based on user emotion and confidence
        if user_emotion in ["frustrated", "angry"] and user_confidence < 0.5:
            # Persona becomes more careful/measured
            base_confidence *= 0.9
        elif user_emotion in ["excited", "confident"] and user_confidence > 0.8:
            # Persona feeds off positive energy
            base_confidence = min(0.95, base_confidence * 1.1)
        
        return round(base_confidence, 2)
