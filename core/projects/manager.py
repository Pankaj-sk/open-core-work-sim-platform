from typing import Dict, List, Optional, Any, Tuple
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
import uuid
import json
import asyncio
import random
from pathlib import Path

from ..models import (
    Project, Message, ConversationParticipant, Conversation, ConversationType, 
    ProjectRole, ProjectPhase, ConversationStatus, Task, ProjectMemory, 
    ScheduledConversation, User
)
from ..models import ProjectMember
from ..memory.optimized_storage import optimized_storage
from .rag_manager import RAGManager
from ..agents.manager import AgentManager

ROLE_HIERARCHY = {
    ProjectRole.INTERN: [ProjectRole.JUNIOR_DEVELOPER, ProjectRole.SENIOR_DEVELOPER],
    ProjectRole.JUNIOR_DEVELOPER: [ProjectRole.SENIOR_DEVELOPER, ProjectRole.TECH_LEAD],
    ProjectRole.SENIOR_DEVELOPER: [ProjectRole.TECH_LEAD, ProjectRole.PROJECT_MANAGER],
    ProjectRole.QA_ENGINEER: [ProjectRole.TECH_LEAD, ProjectRole.PROJECT_MANAGER],
    ProjectRole.DESIGNER: [ProjectRole.PROJECT_MANAGER, ProjectRole.PRODUCT_MANAGER],
    ProjectRole.BUSINESS_ANALYST: [ProjectRole.PROJECT_MANAGER, ProjectRole.PRODUCT_MANAGER],
    ProjectRole.TECH_LEAD: [ProjectRole.PROJECT_MANAGER],
    ProjectRole.SCRUM_MASTER: [ProjectRole.PROJECT_MANAGER],
    ProjectRole.PROJECT_MANAGER: [ProjectRole.PRODUCT_MANAGER],
    ProjectRole.PRODUCT_MANAGER: []  # Top level
}

ROLE_INITIATED_CONVERSATIONS = {
    ProjectRole.PRODUCT_MANAGER: [
        (ConversationType.PROJECT_UPDATE, 0.3),
        (ConversationType.CLIENT_MEETING, 0.2),
        (ConversationType.TEAM_MEETING, 0.2),
        (ConversationType.ONE_ON_ONE, 0.15),
        (ConversationType.STATUS_UPDATE, 0.15)
    ],
    ProjectRole.PROJECT_MANAGER: [
        (ConversationType.DAILY_STANDUP, 0.25),
        (ConversationType.TEAM_MEETING, 0.2),
        (ConversationType.TASK_ASSIGNMENT, 0.2),
        (ConversationType.ONE_ON_ONE, 0.15),
        (ConversationType.STATUS_UPDATE, 0.2)
    ],
    ProjectRole.TECH_LEAD: [
        (ConversationType.CODE_REVIEW, 0.3),
        (ConversationType.TASK_ASSIGNMENT, 0.25),
        (ConversationType.ONE_ON_ONE, 0.2),
        (ConversationType.STATUS_UPDATE, 0.25)
    ],
    ProjectRole.SENIOR_DEVELOPER: [
        (ConversationType.CODE_REVIEW, 0.25),
        (ConversationType.CASUAL_CHAT, 0.2),
        (ConversationType.STATUS_UPDATE, 0.3),
        (ConversationType.TASK_ASSIGNMENT, 0.25)
    ],
    ProjectRole.JUNIOR_DEVELOPER: [
        (ConversationType.CODE_REVIEW, 0.3),
        (ConversationType.CASUAL_CHAT, 0.25),
        (ConversationType.STATUS_UPDATE, 0.25),
        (ConversationType.ONE_ON_ONE, 0.2)
    ]
}


class ProjectManager:
    """Main project management system with agent-initiated conversations and memory management"""
    
    def __init__(self, db: Session):
        self.db = db
        self.rag_manager = RAGManager()
        self.agent_manager = None  # Will be injected
        self._conversation_schedules: Dict[str, List[Dict]] = {}  # project_id -> scheduled conversations
        self._scheduled_tasks: Dict[str, Dict] = {}  # task_id -> scheduled task info
        self._agent_initiated_conversations: Dict[str, List[Dict]] = {}  # project_id -> pending conversations
        self._test_conversations: Dict[str, list] = {}  # project_id -> list of conversations (testing mode)
        
        # Try to load existing conversations from a simple file cache
        self._load_conversations_from_cache()
        
    def set_agent_manager(self, agent_manager: AgentManager):
        """Inject agent manager dependency"""
        self.agent_manager = agent_manager
    
    async def create_project(self, 
                           user_id: int, 
                           name: str, 
                           description: str,
                           user_role: ProjectRole,
                           team_size: int = 5,
                           project_type: str = "web_development") -> Project:
        """Create a new project with generated team"""
        
        project = Project(
            id=str(uuid.uuid4()),
            name=name,
            description=description,
            created_by=user_id,
            settings={
                "project_type": project_type,
                "team_size": team_size,
                "user_role": user_role.value
            }
        )
        
        # Generate team members based on role and project type
        team_members = await self._generate_team_members(project.id, user_role, team_size, project_type)
        project.members = team_members
        
        # Set up reporting structure
        self._setup_reporting_structure(project)
        
        # Initialize RAG for this project
        await self.rag_manager.initialize_project(project.id, project.name, description)
        
        # Schedule initial conversations
        await self._schedule_initial_conversations(project)
        
        # Store project
        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)
        
        return project
    
    async def _generate_team_members(self,
                                   project_id: str,
                                   user_role: ProjectRole,
                                   team_size: int,
                                   project_type: str) -> List[ProjectMember]:
        """Generate AI team members based on user role and project needs"""
        
        team_members = []
        
        # Always include the user
        user_member = ProjectMember(
            project_id=project_id,
            agent_id="user",
            name="You",
            role=user_role.value,
            is_user=True,
            experience_level=self._get_experience_level_for_role(user_role)
        )
        team_members.append(user_member)
        
        # Define team templates based on project type
        team_templates = {
            "web_development": [
                {"role": ProjectRole.PROJECT_MANAGER, "agent_id": "manager_001", "name": "Sarah Johnson"},
                {"role": ProjectRole.SENIOR_DEVELOPER, "agent_id": "developer_001", "name": "Alex Chen"},
                {"role": ProjectRole.QA_ENGINEER, "agent_id": "qa_001", "name": "Maria Rodriguez"},
                {"role": ProjectRole.DESIGNER, "agent_id": "designer_001", "name": "David Kim"},
                {"role": ProjectRole.BUSINESS_ANALYST, "agent_id": "analyst_001", "name": "Lisa Thompson"}
            ],
            "mobile_app": [
                {"role": ProjectRole.PROJECT_MANAGER, "agent_id": "manager_001", "name": "Sarah Johnson"},
                {"role": ProjectRole.TECH_LEAD, "agent_id": "tech_lead_001", "name": "Michael Brown"},
                {"role": ProjectRole.SENIOR_DEVELOPER, "agent_id": "developer_001", "name": "Alex Chen"},
                {"role": ProjectRole.QA_ENGINEER, "agent_id": "qa_001", "name": "Maria Rodriguez"},
                {"role": ProjectRole.DESIGNER, "agent_id": "designer_001", "name": "David Kim"}
            ]
        }
        
        template = team_templates.get(project_type, team_templates["web_development"])
        
        # Filter out user's role if it already exists in template
        template = [t for t in template if t["role"] != user_role]
        
        # Add team members based on template
        for i, member_template in enumerate(template[:team_size-1]):  # -1 for user
            member = ProjectMember(
                project_id=project_id,
                agent_id=member_template["agent_id"],
                name=member_template["name"],
                role=member_template["role"].value,
                is_user=False,
                experience_level="senior" if "senior" in member_template["role"].value else "mid",
                skills=self._get_skills_for_role(member_template["role"]),
                personality_traits=self._get_personality_for_agent(member_template["agent_id"])
            )
            team_members.append(member)
        
        # If user is not a manager and no manager exists, add one
        if not any(m.role in [ProjectRole.PROJECT_MANAGER.value, ProjectRole.PRODUCT_MANAGER.value] for m in team_members):
            manager = ProjectMember(
                project_id=project_id,
                agent_id="manager_001",
                name="Sarah Johnson",
                role=ProjectRole.PROJECT_MANAGER.value,
                is_user=False,
                experience_level="senior",
                skills=["Leadership", "Project Management", "Team Development"],
                personality_traits={"style": "supportive", "communication": "direct"}
            )
            team_members.append(manager)
        
        return team_members
    
    def _setup_reporting_structure(self, project: Project):
        """Set up manager-report relationships"""
        members = project.members
        
        # Find managers
        managers = [m for m in members if m.role in [ProjectRole.PROJECT_MANAGER.value, ProjectRole.PRODUCT_MANAGER.value]]
        
        if not managers:
            return
        
        primary_manager = managers[0]
        
        # Set up reporting relationships
        for member in members:
            if member.agent_id == primary_manager.agent_id:
                continue
                
            # Determine who this person reports to
            possible_managers = ROLE_HIERARCHY.get(ProjectRole(member.role), [])
            found_manager = False
            for manager_role in possible_managers:
                manager = next((m for m in members if m.role == manager_role.value), None)
                if manager:
                    member.reporting_to = manager.agent_id
                    found_manager = True
                    break
            
            if not found_manager:
                # Default to primary manager
                member.reporting_to = primary_manager.agent_id
    
    async def start_conversation(self,
                               project_id: str,
                               request: dict,
                               user_id: int) -> Conversation:
        """Start a new conversation in the project"""
        
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError(f"Project {project_id} not found")

        # Create conversation record
        conversation = Conversation(
            id=str(uuid.uuid4()),
            conversation_type=request.get("conversation_type"),
            project_id=project_id,
            initiated_by=str(user_id),
            status=ConversationStatus.ACTIVE,
            title=request.get("title", "New Conversation"),
            start_time=datetime.utcnow()
        )
        
        # Add participants
        participants = request.get("participants", [])
        for participant_id in participants:
            participant = ConversationParticipant(
                conversation_id=conversation.id,
                participant_id=participant_id,
                participant_name=self._get_participant_name(project, participant_id)
            )
            conversation.participants.append(participant)
        
        # Store conversation
        self.db.add(conversation)
        self.db.commit()
        self.db.refresh(conversation)
        
        # Add to memory
        await self._add_conversation_to_memory(conversation, "Conversation started")
        
        return conversation
    
    async def add_message_to_conversation(self,
                                        project_id: str,
                                        conversation_id: str,
                                        sender_id: str,
                                        message: str,
                                        message_type: str = "text") -> Dict[str, Any]:
        """Add a message to an existing conversation and generate AI responses with WhatsApp-like smoothness"""
        
        conversations = self._test_conversations.get(project_id, [])
        for conv in conversations:
            if conv["id"] == conversation_id:
                if "messages" not in conv or conv["messages"] is None:
                    conv["messages"] = []
                
                # Add user message with WhatsApp-like metadata
                user_message = {
                    "id": str(uuid.uuid4()),
                    "sender_id": sender_id,
                    "sender_name": "You" if sender_id == "user" else self._get_agent_name(sender_id),
                    "content": message,
                    "timestamp": datetime.utcnow().isoformat(),
                    "message_type": message_type,
                    "status": "sent",  # WhatsApp-like status: sent, delivered, read
                    "read_by": [],  # Track who has read the message
                    "reactions": {},  # For future emoji reactions
                    "reply_to": None  # For replying to specific messages
                }
                conv["messages"].append(user_message)
                
                # Update conversation metadata for WhatsApp-like experience
                conv["last_message"] = {
                    "content": message[:100] + ("..." if len(message) > 100 else ""),
                    "timestamp": user_message["timestamp"],
                    "sender": user_message["sender_name"]
                }
                conv["unread_count"] = conv.get("unread_count", 0)
                conv["last_activity"] = user_message["timestamp"]
                
                # Save user message immediately for instant UI feedback
                self._save_conversations_to_cache()
                
                # Cache conversation in optimized storage for faster access
                optimized_storage.cache_conversation(conversation_id, conv)
                
                # Add to RAG memory with batch processing
                memory_data = {
                    "content": f"User message: {message}",
                    "project_id": project_id,
                    "conversation_id": conversation_id,
                    "user_id": 1,  # Default user ID in testing mode
                    "conversation_type": conv.get('conversation_type', 'chat'),
                    "additional_metadata": {
                        "sender_name": user_message["sender_name"],
                        "message_type": message_type,
                        "timestamp": user_message["timestamp"]
                    }
                }
                
                if hasattr(self, 'rag_manager') and self.rag_manager:
                    # Use batch processing for better performance
                    optimized_storage.batch_add_memory([memory_data])
                    try:
                        self.rag_manager.add_memory(**memory_data)
                    except Exception as e:
                        print(f"[DEBUG] Failed to save user message to memory: {e}")
                else:
                    # If no RAG manager, still batch the memory for later processing
                    optimized_storage.batch_add_memory([memory_data])
                
                # Generate immediate AI responses (no delays)
                participants = conv.get("participants", [])
                ai_responses = []
                
                for i, participant in enumerate(participants):
                    if participant != "user" and participant.lower() != "you":
                        # Generate contextual response immediately
                        ai_response = self._generate_contextual_response(participant, message, conv.get('conversation_type', 'chat'))
                        
                        # Use current timestamp (immediate response)
                        current_time = datetime.utcnow()
                        
                        ai_message = {
                            "id": str(uuid.uuid4()),
                            "sender_id": participant,
                            "sender_name": self._get_agent_name(participant),  # Always include sender name
                            "content": ai_response,
                            "timestamp": current_time.isoformat(),
                            "message_type": "text",
                            "status": "sent",
                            "read_by": [],
                            "reactions": {},
                            "reply_to": user_message["id"] if random.random() < 0.3 else None,  # 30% chance of replying
                            "is_ai_response": True
                        }
                        
                        ai_responses.append(ai_message)
                        conv["messages"].append(ai_message)
                        
                        # Save AI message to memory
                        if hasattr(self, 'rag_manager') and self.rag_manager:
                            try:
                                self.rag_manager.add_memory(
                                    content=f"AI response from {self._get_agent_name(participant)}: {ai_response}",
                                    project_id=project_id,
                                    conversation_id=conversation_id,
                                    agent_id=participant,
                                    conversation_type=conv.get('conversation_type', 'chat'),
                                    additional_metadata={
                                        "sender_name": self._get_agent_name(participant),
                                        "message_type": "text",
                                        "timestamp": ai_message["timestamp"],
                                        "in_response_to": message[:100],
                                        "immediate_response": True
                                    }
                                )
                            except Exception as e:
                                print(f"[DEBUG] Failed to save AI message to memory: {e}")
                
                # Update last message to the most recent AI response
                if ai_responses:
                    last_ai_message = max(ai_responses, key=lambda x: x["timestamp"])
                    conv["last_message"] = {
                        "content": last_ai_message["content"][:100] + ("..." if len(last_ai_message["content"]) > 100 else ""),
                        "timestamp": last_ai_message["timestamp"],
                        "sender": last_ai_message["sender_name"]
                    }
                
                # Final save with all AI responses
                self._save_conversations_to_cache()
                
                return {
                    "message": "Message added successfully",
                    "conversation": conv,
                    "user_message": user_message,
                    "ai_responses": ai_responses,
                    "typing_indicators": [
                        {
                            "agent_id": resp["sender_id"],
                            "agent_name": resp["sender_name"],
                            "typing_duration": resp["typing_duration"]
                        } for resp in ai_responses
                    ]
                }
        
        print(f"[DEBUG] add_message_to_conversation: project_id={project_id}, conversation_id={conversation_id}")
        print(f"[DEBUG] Available conversations for project: {[c['id'] for c in conversations]}")
        raise ValueError(f"Conversation {conversation_id} not found")
    
    def _generate_contextual_response(self, agent_name: str, user_message: str, conversation_type: str) -> str:
        """Generate contextual AI responses using actual AI APIs instead of hardcoded responses"""
        
        if not self.agent_manager:
            # Fallback to basic response if agent manager not available
            return f"Thanks for your message. Let me think about that and get back to you."
        
        # Map agent names to agent IDs for the AgentManager
        agent_id_map = {
            "sarah johnson": "manager_001",
            "alex chen": "developer_001", 
            "michael rodriguez": "client_001",
            "jennifer williams": "hr_001",
            "jamie taylor": "intern_001",
            "david kim": "qa_001",
            "maria rodriguez": "qa_001",
            "michael brown": "developer_001",  # Map tech lead to developer
            "lisa thompson": "developer_001",  # Map analyst to developer
            "technical_lead": "developer_001",  # Fix the missing technical_lead
            "tech_lead": "developer_001",
            "tech_lead_001": "developer_001",
            "analyst": "developer_001",
            "analyst_001": "developer_001",
            "designer": "developer_001",
            "designer_001": "developer_001",
            "qa_engineer": "qa_001",
            "senior_developer": "developer_001"
        }
        
        # Find the correct agent ID
        agent_id = None
        agent_name_lower = agent_name.lower()
        for name, id in agent_id_map.items():
            if name in agent_name_lower:
                agent_id = id
                break
        
        # If no specific agent found, try by role keywords
        if not agent_id:
            if "manager" in agent_name_lower or "lead" in agent_name_lower:
                agent_id = "manager_001"
            elif "developer" in agent_name_lower or "dev" in agent_name_lower or "tech" in agent_name_lower:
                agent_id = "developer_001"
            elif "qa" in agent_name_lower or "quality" in agent_name_lower or "test" in agent_name_lower:
                agent_id = "qa_001"
            elif "designer" in agent_name_lower or "design" in agent_name_lower:
                agent_id = "developer_001"  # Map to developer as we don't have a dedicated designer
            elif "hr" in agent_name_lower or "human" in agent_name_lower:
                agent_id = "hr_001"
            elif "client" in agent_name_lower or "customer" in agent_name_lower:
                agent_id = "client_001"
            elif "intern" in agent_name_lower or "junior" in agent_name_lower:
                agent_id = "intern_001"
            else:
                agent_id = "developer_001"  # Default fallback
        
        try:
            # Use the agent manager to generate a proper AI response
            response = self.agent_manager.chat_with_agent(agent_id, user_message)
            return response
            
        except Exception as e:
            print(f"Error generating AI response for {agent_name}: {e}")
            # More specific fallback message based on error type
            if "Agent" in str(e) and "not found" in str(e):
                return f"I'm currently unavailable. Please try speaking with a different team member."
            elif "API" in str(e) or "connectivity" in str(e):
                return f"I'm having trouble connecting right now. Please try again in a moment."
            else:
                return f"Let me get back to you on that. I'm reviewing your message now."
    
    async def _add_conversation_to_memory(self, conversation: Conversation, context: str):
        """Add conversation to RAG memory"""
        memory_content = f"Conversation: {conversation.title or conversation.conversation_type}\nContext: {context}\nProject: {conversation.project.name}"
        
        self.rag_manager.add_memory(
            content=memory_content,
            project_id=conversation.project_id,
            conversation_id=conversation.id,
            user_id=conversation.initiated_by,
            conversation_type=conversation.conversation_type,
            additional_metadata={
                "conversation_title": conversation.title,
                "participant_count": len(conversation.participants)
            }
        )
    
    async def _add_message_to_memory(self, conversation: Conversation, message: Message):
        """Add message to RAG memory"""
        memory_content = f"Message from {message.sender_name}: {message.content}"
        
        self.rag_manager.add_memory(
            content=memory_content,
            project_id=conversation.project_id,
            conversation_id=conversation.id,
            user_id=message.sender_id if message.sender_id.isdigit() else None,
            agent_id=message.sender_id if not message.sender_id.isdigit() else None,
            conversation_type=conversation.conversation_type,
            additional_metadata={
                "sender_name": message.sender_name,
                "message_type": message.message_type
            }
        )
    
    async def _generate_ai_responses(self, conversation: Conversation, user_message: Message) -> List[Dict]:
        """Generate AI responses to user messages"""
        if not self.agent_manager:
            return []
        
        responses = []
        project = conversation.project
        
        # Get context for each AI participant
        for participant in conversation.participants:
            if participant.participant_id == "user" or participant.participant_id == user_message.sender_id:
                continue
            
            # Get agent context
            context = self.rag_manager.get_enhanced_context_for_agent(
                participant.participant_id,
                project.id,
                user_message.content,
                conversation.id
            )
            
            # Generate response
            try:
                response = await self._generate_agent_response(
                    project, conversation, participant.participant_id, user_message.content, context
                )
                if response:
                    responses.append(response)
            except Exception as e:
                print(f"Error generating response for {participant.participant_id}: {e}")
        
        return responses
    
    async def _generate_agent_response(self, 
                                     project: Project,
                                     conversation: Conversation,
                                     agent_id: str,
                                     user_message: str,
                                     context: str) -> Optional[Dict]:
        """Generate a response from a specific agent using actual AI APIs"""
        
        # Find the agent in project members
        agent_member = next((m for m in project.members if m.agent_id == agent_id), None)
        if not agent_member:
            return None
        
        # Map project agent IDs to actual agent manager IDs
        agent_id_map = {
            "Sarah Johnson": "manager_001",
            "Alex Chen": "developer_001", 
            "Michael Rodriguez": "client_001",
            "Jennifer Williams": "hr_001",
            "Jamie Taylor": "intern_001",
            "David Kim": "qa_001",
            "Maria Rodriguez": "qa_001",
            "Michael Brown": "developer_001",  # Map tech lead to developer
            "Lisa Thompson": "developer_001",  # Map analyst to developer
            "technical_lead": "developer_001",  # Fix the missing technical_lead
            "tech_lead_001": "developer_001",
            "designer_001": "developer_001",
            "analyst_001": "developer_001",
            "qa_engineer": "qa_001",
            "senior_developer": "developer_001"
        }
        
        # Get the actual agent manager ID
        actual_agent_id = agent_id_map.get(agent_member.name, "developer_001")
        
        try:
            if self.agent_manager:
                # Use the agent manager to generate a proper AI response
                response_content = self.agent_manager.chat_with_agent(actual_agent_id, user_message)
            else:
                # Fallback if agent manager not available
                response_content = f"Thanks for your message. I'll review this and get back to you."
        except Exception as e:
            print(f"Error generating AI response for {agent_member.name}: {e}")
            # More specific error handling
            if "Agent" in str(e) and "not found" in str(e):
                response_content = f"I'm currently unavailable. Please try speaking with another team member."
            elif "API" in str(e) or "connectivity" in str(e):
                response_content = f"I'm having trouble connecting right now. Let me try to respond later."
            else:
                response_content = f"I'm reviewing your message and will get back to you shortly."
        
        # Create message
        response_message = Message(
            id=str(uuid.uuid4()),
            conversation_id=conversation.id,
            sender_id=agent_id,
            sender_name=agent_member.name,
            content=response_content,
            message_type="text",
            timestamp=datetime.utcnow()
        )
        
        conversation.messages.append(response_message)
        self.db.commit()
        self.db.refresh(response_message)
        
        # Add to memory
        await self._add_message_to_memory(conversation, response_message)
        
        return {
            "agent_id": agent_id,
            "agent_name": agent_member.name,
            "message": response_content,
            "message_id": response_message.id
        }
    
    def _build_agent_prompt(self, 
                           agent_member: ProjectMember,
                           context: str,
                           conversation: Conversation,
                           user_message: str) -> str:
        """Build a prompt for agent response generation"""
        
        prompt = f"""
        You are {agent_member.name}, a {agent_member.role} in the project "{conversation.project.name}".
        
        Your personality traits: {agent_member.personality_traits or {}}
        Your skills: {agent_member.skills or []}
        
        Context from previous interactions:
        {context}
        
        Current conversation: {conversation.title or conversation.conversation_type}
        
        User message: {user_message}
        
        Respond as {agent_member.name} would in a professional workplace setting, considering your role and the context.
        Keep your response natural and appropriate for the conversation type.
        """
        
        return prompt
    
    async def end_conversation(self, project_id: str, conversation_id: str, user_id: int) -> Dict[str, Any]:
        """End a conversation"""
        
        conversation = self.db.query(Conversation).filter(
            Conversation.id == conversation_id,
            Conversation.project_id == project_id
        ).first()
        
        if not conversation:
            raise ValueError(f"Conversation {conversation_id} not found")
        
        conversation.status = ConversationStatus.ENDED
        conversation.end_time = datetime.utcnow()
        
        # Generate summary
        summary = await self._generate_conversation_summary(conversation)
        conversation.summary = summary
        
        self.db.commit()
        self.db.refresh(conversation)
        
        # Add to memory
        await self._add_conversation_to_memory(conversation, f"Conversation ended. Summary: {summary}")
        
        return {
            "conversation_id": conversation_id,
            "status": "ended",
            "summary": summary,
            "duration": (conversation.end_time - conversation.start_time).total_seconds() / 60
        }
    
    async def _generate_conversation_summary(self, conversation: Conversation) -> str:
        """Generate a summary of the conversation"""
        messages = conversation.messages
        if not messages:
            return "Empty conversation"
        
        # Simple summary based on message count and participants
        participant_names = [p.participant_name for p in conversation.participants]
        message_count = len(messages)
        
        summary = f"Conversation between {', '.join(participant_names)} with {message_count} messages"
        
        # Add key topics if available
        if message_count > 0:
            # Extract key words from messages (simplified)
            all_content = " ".join([m.content for m in messages])
            summary += f". Key topics discussed: {all_content[:100]}..."
        
        return summary
    
    async def get_daily_conversations(self, project_id: str, day: Optional[date] = None) -> List[Conversation]:
        """Get conversations for a specific day"""
        if not day:
            day = date.today()
        
        start_of_day = datetime.combine(day, datetime.min.time())
        end_of_day = datetime.combine(day, datetime.max.time())
        
        conversations = self.db.query(Conversation).filter(
            Conversation.project_id == project_id,
            Conversation.start_time >= start_of_day,
            Conversation.start_time <= end_of_day
        ).order_by(Conversation.start_time).all()
        
        return conversations
    
    async def get_project_memory(self, project_id: str, query: Optional[str] = None, limit: int = 20) -> Dict[str, Any]:
        """Get project memory using RAG"""
        if query:
            memories = self.rag_manager.search_memories(
                query=query,
                project_id=project_id,
                limit=limit
            )
        else:
            memories = self.rag_manager.get_project_context(project_id, limit=limit)
        
        # Convert to serializable format
        memory_data = []
        for memory in memories:
            memory_data.append({
                "id": memory.id,
                "content": memory.content,
                "timestamp": memory.timestamp.isoformat(),
                "metadata": memory.metadata
            })
        
        return {
            "project_id": project_id,
            "memories": memory_data,
            "total_count": len(memory_data)
        }
    
    async def schedule_agent_conversation(self,
                                        project_id: str,
                                        initiating_agent_id: str,
                                        target_participants: List[str],
                                        conversation_type: ConversationType,
                                        scheduled_time: datetime,
                                        message: str = None,
                                        urgency: str = "normal") -> str:
        """Schedule an agent-initiated conversation"""
        
        scheduled_conversation = ScheduledConversation(
            id=str(uuid.uuid4()),
            project_id=project_id,
            conversation_type=conversation_type.value,
            initiating_agent_id=initiating_agent_id,
            target_participants=target_participants,
            scheduled_time=scheduled_time,
            message=message,
            urgency=urgency,
            status="scheduled"
        )
        
        self.db.add(scheduled_conversation)
        self.db.commit()
        self.db.refresh(scheduled_conversation)
        
        return scheduled_conversation.id
    
    async def process_scheduled_conversations(self):
        """Process and trigger scheduled conversations"""
        now = datetime.utcnow()
        
        # Get due conversations
        due_conversations = self.db.query(ScheduledConversation).filter(
            ScheduledConversation.status == "scheduled",
            ScheduledConversation.scheduled_time <= now
        ).all()
        
        for scheduled in due_conversations:
            try:
                # Create actual conversation
                conversation = await self.start_conversation(
                    project_id=scheduled.project_id,
                    request={
                        "conversation_type": scheduled.conversation_type,
                        "title": f"Scheduled: {scheduled.conversation_type}",
                        "participants": scheduled.target_participants
                    },
                    user_id=0  # System initiated
                )
                
                # Add initial message from initiating agent
                if scheduled.message:
                    await self.add_message_to_conversation(
                        project_id=scheduled.project_id,
                        conversation_id=conversation.id,
                        sender_id=scheduled.initiating_agent_id,
                        message=scheduled.message
                    )
                
                # Mark as triggered
                scheduled.status = "triggered"
                scheduled.triggered_at = now
                
                self.db.commit()
                
            except Exception as e:
                print(f"Error processing scheduled conversation {scheduled.id}: {e}")
    
    def _get_participant_name(self, project: Project, participant_id: str) -> str:
        """Get participant name from project members"""
        if participant_id == "user":
            return "You"
        
        member = next((m for m in project.members if m.agent_id == participant_id), None)
        if member:
            return member.name
        
        return f"Unknown ({participant_id})"
    
    def _get_agent_name(self, agent_id: str) -> str:
        """Get agent name by ID"""
        agent_names = {
            "manager_001": "Sarah Johnson",
            "developer_001": "Alex Chen", 
            "qa_001": "David Kim",
            "client_001": "Michael Rodriguez",
            "hr_001": "Jennifer Williams",
            "intern_001": "Jamie Taylor",
            "tech_lead_001": "Alex Chen",  # Map to existing developer
            "designer_001": "David Kim",   # Map to existing QA
            "analyst_001": "Alex Chen",    # Map to existing developer
            "technical_lead": "Alex Chen", # Fix the missing technical_lead
            "tech_lead": "Alex Chen"
        }
        return agent_names.get(agent_id, f"Agent {agent_id}")
    
    def _get_experience_level_for_role(self, role: ProjectRole) -> str:
        """Get experience level for a role"""
        experience_map = {
            ProjectRole.INTERN: "entry",
            ProjectRole.JUNIOR_DEVELOPER: "junior",
            ProjectRole.SENIOR_DEVELOPER: "senior",
            ProjectRole.TECH_LEAD: "senior",
            ProjectRole.PROJECT_MANAGER: "senior",
            ProjectRole.PRODUCT_MANAGER: "senior",
            ProjectRole.QA_ENGINEER: "mid",
            ProjectRole.DESIGNER: "mid",
            ProjectRole.BUSINESS_ANALYST: "mid",
            ProjectRole.SCRUM_MASTER: "senior"
        }
        return experience_map.get(role, "mid")
    
    def _get_skills_for_role(self, role: ProjectRole) -> List[str]:
        """Get skills for a role"""
        skills_map = {
            ProjectRole.INTERN: ["Programming", "Learning", "Communication"],
            ProjectRole.JUNIOR_DEVELOPER: ["Programming", "Problem Solving", "Teamwork"],
            ProjectRole.SENIOR_DEVELOPER: ["Advanced Programming", "Architecture", "Mentoring"],
            ProjectRole.TECH_LEAD: ["Technical Leadership", "Architecture", "Team Management"],
            ProjectRole.PROJECT_MANAGER: ["Project Management", "Leadership", "Communication"],
            ProjectRole.PRODUCT_MANAGER: ["Product Strategy", "Market Analysis", "Leadership"],
            ProjectRole.QA_ENGINEER: ["Testing", "Quality Assurance", "Automation"],
            ProjectRole.DESIGNER: ["UI/UX Design", "Creativity", "User Research"],
            ProjectRole.BUSINESS_ANALYST: ["Requirements Analysis", "Process Improvement", "Documentation"],
            ProjectRole.SCRUM_MASTER: ["Agile Methodology", "Facilitation", "Team Coaching"]
        }
        return skills_map.get(role, ["General Skills"])
    
    def _get_personality_for_agent(self, agent_id: str) -> Dict[str, str]:
        """Get personality traits for an agent"""
        personalities = {
            "manager_001": {"style": "supportive", "communication": "direct", "approach": "collaborative"},
            "developer_001": {"style": "analytical", "communication": "technical", "approach": "problem-solving"},
            "qa_001": {"style": "detail-oriented", "communication": "thorough", "approach": "quality-focused"},
            "designer_001": {"style": "creative", "communication": "visual", "approach": "user-centered"},
            "analyst_001": {"style": "logical", "communication": "structured", "approach": "data-driven"},
            "tech_lead_001": {"style": "mentoring", "communication": "technical", "approach": "leadership"}
        }
        return personalities.get(agent_id, {"style": "professional", "communication": "clear", "approach": "collaborative"})
    
    async def _schedule_initial_conversations(self, project: Project):
        """Schedule initial conversations for the project"""
        # Schedule daily standup
        tomorrow = datetime.now() + timedelta(days=1)
        tomorrow_9am = tomorrow.replace(hour=9, minute=0, second=0, microsecond=0)
        
        # Find project manager
        pm = next((m for m in project.members if m.role == ProjectRole.PROJECT_MANAGER.value), None)
        if pm:
            await self.schedule_agent_conversation(
                project_id=project.id,
                initiating_agent_id=pm.agent_id,
                target_participants=[m.agent_id for m in project.members if m.is_active],
                conversation_type=ConversationType.DAILY_STANDUP,
                scheduled_time=tomorrow_9am,
                message="Good morning team! Let's have our daily standup to discuss progress and blockers.",
                urgency="normal"
            )
    
    def get_user_projects(self, user_id: int) -> List[Project]:
        """Get all projects for a user"""
        return self.db.query(Project).filter(
            Project.created_by == user_id,
            Project.is_active == True
        ).all()
    
    def get_project(self, project_id: str) -> Optional[Project]:
        """Get a specific project"""
        return self.db.query(Project).filter(Project.id == project_id).first()

    def get_project_conversations(self, project_id: str):
        # In testing mode, return conversations from memory
        print(f"[DEBUG] get_project_conversations for project {project_id}: {self._test_conversations.get(project_id, [])}")
        return self._test_conversations.get(project_id, [])

    def get_conversation(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Get a conversation by ID from all projects"""
        for project_id, conversations in self._test_conversations.items():
            for conv in conversations:
                if conv["id"] == conversation_id:
                    return conv
        return None
    
    def update_conversation(self, conversation_id: str, updated_conversation: Dict[str, Any]) -> bool:
        """Update a conversation in memory"""
        print(f"[DEBUG] update_conversation called with ID: {conversation_id}")
        print(f"[DEBUG] Current conversations in memory: {list(self._test_conversations.keys())}")
        
        for project_id, conversations in self._test_conversations.items():
            print(f"[DEBUG] Checking project {project_id} with {len(conversations)} conversations")
            for i, conv in enumerate(conversations):
                if conv["id"] == conversation_id:
                    print(f"[DEBUG] Found conversation at index {i}, updating...")
                    self._test_conversations[project_id][i] = updated_conversation
                    self._save_conversations_to_cache()  # Save after updating
                    print(f"[DEBUG] Successfully updated conversation {conversation_id}")
                    return True
        
        print(f"[DEBUG] Conversation {conversation_id} not found for update")
        return False
    
    def create_conversation(self, conversation: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new conversation"""
        project_id = conversation.get("project_id")
        if project_id not in self._test_conversations:
            self._test_conversations[project_id] = []
        
        self._test_conversations[project_id].append(conversation)
        self._save_conversations_to_cache()  # Save after creating
        print(f"[DEBUG] Conversation created for project {project_id}: {conversation}")
        print(f"[DEBUG] All conversations for project {project_id}: {self._test_conversations[project_id]}")
        return conversation
    
    def get_daily_conversations(self, project_id: str, day: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get conversations for a project, optionally filtered by day"""
        conversations = self._test_conversations.get(project_id, [])
        
        # If no day specified, return all conversations
        if not day:
            return conversations
        
        # Filter by day (this is a simple implementation - in production, use proper date filtering)
        filtered = []
        for conv in conversations:
            try:
                conv_date = datetime.fromisoformat(conv.get("start_time", "")).date()
                filter_date = datetime.fromisoformat(day).date()
                if conv_date == filter_date:
                    filtered.append(conv)
            except (ValueError, TypeError):
                continue
        
        return filtered
    
    def _load_conversations_from_cache(self):
        """Load conversations from a simple file cache"""
        try:
            cache_file = Path("conversation_cache.json")
            if cache_file.exists():
                with open(cache_file, 'r') as f:
                    self._test_conversations = json.load(f)
                print(f"[DEBUG] Loaded {sum(len(convs) for convs in self._test_conversations.values())} conversations from cache")
        except Exception as e:
            print(f"[DEBUG] Failed to load conversation cache: {e}")
            
    def _save_conversations_to_cache(self):
        """Save conversations to a simple file cache with size optimization"""
        try:
            # Limit cache size to prevent memory bloat
            total_conversations = sum(len(convs) for convs in self._test_conversations.values())
            if total_conversations > 500:  # Limit total conversations
                self._cleanup_old_conversations()
            
            cache_file = Path("conversation_cache.json")
            with open(cache_file, 'w') as f:
                json.dump(self._test_conversations, f, indent=2)
            print(f"[DEBUG] Saved {total_conversations} conversations to cache")
        except Exception as e:
            print(f"[DEBUG] Failed to save conversation cache: {e}")
    
    def _cleanup_old_conversations(self):
        """Remove old conversations to prevent memory bloat"""
        try:
            for project_id, conversations in self._test_conversations.items():
                if len(conversations) > 50:  # Keep only last 50 conversations per project
                    # Sort by timestamp and keep the most recent
                    sorted_convs = sorted(conversations, 
                                        key=lambda x: x.get('start_time', ''), 
                                        reverse=True)
                    self._test_conversations[project_id] = sorted_convs[:50]
                    print(f"[DEBUG] Cleaned up conversations for project {project_id}")
        except Exception as e:
            print(f"[DEBUG] Failed to cleanup conversations: {e}")
    
    def mark_messages_as_read(self, project_id: str, conversation_id: str, reader_id: str) -> bool:
        """Mark messages as read by a participant (WhatsApp-like read receipts)"""
        conversations = self._test_conversations.get(project_id, [])
        for conv in conversations:
            if conv["id"] == conversation_id:
                messages = conv.get("messages", [])
                for message in messages:
                    if message["sender_id"] != reader_id:  # Don't mark own messages as read
                        if reader_id not in message.get("read_by", []):
                            message.setdefault("read_by", []).append({
                                "user_id": reader_id,
                                "timestamp": datetime.utcnow().isoformat()
                            })
                
                # Reset unread count for this user
                conv["unread_count"] = 0
                self._save_conversations_to_cache()
                return True
        return False
    
    def add_typing_indicator(self, project_id: str, conversation_id: str, agent_id: str, duration: int = 3) -> Dict[str, Any]:
        """Add typing indicator for smooth WhatsApp-like experience"""
        return {
            "conversation_id": conversation_id,
            "agent_id": agent_id,
            "agent_name": self._get_agent_name(agent_id),
            "typing": True,
            "duration": duration,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def get_conversation_preview(self, conversation: Dict[str, Any]) -> Dict[str, Any]:
        """Get WhatsApp-like conversation preview for the conversation list"""
        last_message = conversation.get("last_message", {})
        messages = conversation.get("messages", [])
        
        # Calculate unread count
        unread_count = 0
        for message in messages:
            if message.get("sender_id") != "user" and not message.get("read_by"):
                unread_count += 1
        
        # Get participant names (excluding user)
        participants = [p for p in conversation.get("participants", []) if p != "user"]
        participant_names = [self._get_agent_name(p) for p in participants]
        
        return {
            "id": conversation["id"],
            "title": conversation.get("title", "Group Chat"),
            "participants": participant_names,
            "participant_count": len(participants) + 1,  # +1 for user
            "last_message": {
                "content": last_message.get("content", "No messages yet"),
                "sender": last_message.get("sender", ""),
                "timestamp": last_message.get("timestamp", conversation.get("start_time", "")),
                "is_user": last_message.get("sender") == "You"
            },
            "unread_count": unread_count,
            "status": conversation.get("status", "active"),
            "conversation_type": conversation.get("conversation_type", "chat"),
            "last_activity": conversation.get("last_activity", conversation.get("start_time", "")),
            "is_group": len(participants) > 1,
            "avatar": self._get_conversation_avatar(conversation)
        }
    
    def _get_conversation_avatar(self, conversation: Dict[str, Any]) -> Dict[str, Any]:
        """Generate avatar info for conversation (group or individual)"""
        participants = [p for p in conversation.get("participants", []) if p != "user"]
        
        if len(participants) == 1:
            # Individual chat
            agent_id = participants[0]
            return {
                "type": "individual",
                "agent_id": agent_id,
                "name": self._get_agent_name(agent_id),
                "initials": self._get_agent_initials(agent_id),
                "color": self._get_agent_color(agent_id)
            }
        else:
            # Group chat
            return {
                "type": "group",
                "participant_count": len(participants) + 1,
                "initials": "GC",  # Group Chat
                "color": "#4CAF50"  # Green for group chats
            }
    
    def _get_agent_initials(self, agent_id: str) -> str:
        """Get agent initials for avatar"""
        name = self._get_agent_name(agent_id)
        parts = name.split()
        if len(parts) >= 2:
            return f"{parts[0][0]}{parts[1][0]}".upper()
        elif len(parts) == 1:
            return parts[0][:2].upper()
        return "AI"
    
    def _get_agent_color(self, agent_id: str) -> str:
        """Get consistent color for agent avatar"""
        colors = {
            "manager_001": "#2196F3",    # Blue for managers
            "developer_001": "#4CAF50",  # Green for developers  
            "qa_001": "#FF9800",         # Orange for QA
            "designer_001": "#9C27B0",   # Purple for designers
            "analyst_001": "#F44336",    # Red for analysts
            "tech_lead_001": "#00BCD4"   # Cyan for tech leads
        }
        return colors.get(agent_id, "#757575")  # Gray as default
    
    def update_conversation_activity(self, project_id: str, conversation_id: str) -> bool:
        """Update last activity timestamp for conversation sorting"""
        conversations = self._test_conversations.get(project_id, [])
        for conv in conversations:
            if conv["id"] == conversation_id:
                conv["last_activity"] = datetime.utcnow().isoformat()
                self._save_conversations_to_cache()
                return True
        return False
    
    async def generate_dashboard_content(self, project_id: str) -> Dict[str, Any]:
        """Generate AI-powered dashboard content with tasks, feedback, and suggestions"""
        project = self.get_project(project_id)
        if not project:
            raise ValueError(f"Project {project_id} not found")
        if not self.agent_manager:
            return {
                "tasks": [],
                "feedback": "Please configure AI API keys to get personalized feedback.",
                "suggestions": [],
                "deadlines": [],
                "responsibilities": []
            }
        try:
            dashboard_prompt = f"""Generate dashboard content for project: {project.name}
Description: {project.description}
Provide:
1. Current high-priority tasks (3-5 items)
2. Project feedback and status insights
3. Actionable suggestions for improvement
4. Important deadlines to track
5. Key responsibilities by role
Format as detailed, specific workplace insights."""
            ai_response = self.agent_manager.chat_with_agent("manager_001", dashboard_prompt)
            dashboard_data = self._parse_dashboard_response(ai_response, project)
            return dashboard_data
        except Exception as e:
            print(f"Error generating dashboard content: {e}")
            return {
                "tasks": ["Review project status", "Update team on progress", "Plan next sprint"],
                "feedback": "AI dashboard generation encountered an error. Please check your API configuration.",
                "suggestions": ["Configure AI API keys for personalized insights"],
                "deadlines": [],
                "responsibilities": []
            }

    async def generate_role_tasks(self, project_id: str, role: str) -> list:
        """Generate AI-powered role-specific tasks"""
        project = self.get_project(project_id)
        if not project:
            raise ValueError(f"Project {project_id} not found")
        if not self.agent_manager:
            return [{"title": "Configure AI API", "description": "Add API keys to enable AI-generated tasks", "priority": "high"}]
        try:
            agent_id = "developer_001"
            if "manager" in role.lower():
                agent_id = "manager_001"
            elif "qa" in role.lower():
                agent_id = "qa_001"
            elif "designer" in role.lower():
                agent_id = "designer_001"
            role_prompt = f"""Generate specific tasks for a {role} working on project: {project.name}
Description: {project.description}
Provide 4-6 realistic, actionable tasks with:
- Clear titles
- Detailed descriptions
- Priority levels (high/medium/low)
- Estimated time/effort
Make tasks specific to {role} responsibilities in a real workplace."""
            ai_response = self.agent_manager.chat_with_agent(agent_id, role_prompt)
            tasks = self._parse_tasks_response(ai_response, role)
            return tasks
        except Exception as e:
            print(f"Error generating role tasks: {e}")
            return [
                {
                    "title": f"Review {role} responsibilities",
                    "description": "AI task generation encountered an error. Please check API configuration.",
                    "priority": "medium",
                    "estimated_time": "30 minutes"
                }
            ]

    def _parse_dashboard_response(self, ai_response: str, project: Project) -> Dict[str, Any]:
        """Parse AI response into structured dashboard data"""
        lines = ai_response.split('\n')
        tasks = []
        suggestions = []
        deadlines = []
        responsibilities = []
        feedback = ai_response[:200] + "..." if len(ai_response) > 200 else ai_response
        current_section = None
        for line in lines:
            line = line.strip()
            if not line:
                continue
            if "task" in line.lower() and (":" in line or line.endswith("s")):
                current_section = "tasks"
                continue
            elif "suggestion" in line.lower() or "recommend" in line.lower():
                current_section = "suggestions"
                continue
            elif "deadline" in line.lower() or "due" in line.lower():
                current_section = "deadlines"
                continue
            elif "responsib" in line.lower() or "role" in line.lower():
                current_section = "responsibilities"
                continue
            if line.startswith(('-', '•', '*', '1.', '2.', '3.', '4.', '5.')):
                item = line.lstrip('-•*0123456789. ')
                if current_section == "tasks" and item:
                    tasks.append({"title": item, "priority": "medium", "status": "pending"})
                elif current_section == "suggestions" and item:
                    suggestions.append(item)
                elif current_section == "deadlines" and item:
                    deadlines.append({"title": item, "date": (datetime.now() + timedelta(days=random.randint(1, 30))).strftime("%Y-%m-%d")})
                elif current_section == "responsibilities" and item:
                    responsibilities.append(item)
        return {
            "tasks": tasks[:5],
            "feedback": feedback,
            "suggestions": suggestions[:3],
            "deadlines": deadlines[:5],
            "responsibilities": responsibilities[:5]
        }

    def _parse_tasks_response(self, ai_response: str, role: str) -> list:
        """Parse AI response into structured task list"""
        lines = ai_response.split('\n')
        tasks = []
        current_task = {}
        for line in lines:
            line = line.strip()
            if not line:
                continue
            if line.startswith(('-', '•', '*')) or any(line.startswith(f"{i}.") for i in range(1, 10)):
                if current_task.get('title'):
                    tasks.append(current_task)
                title = line.lstrip('-•*0123456789. ')
                current_task = {
                    "title": title,
                    "description": "",
                    "priority": "medium",
                    "estimated_time": "2-4 hours",
                    "role": role
                }
            elif current_task and line:
                if current_task.get('description'):
                    current_task['description'] += " " + line
                else:
                    current_task['description'] = line
                if "high" in line.lower() and "priority" in line.lower():
                    current_task['priority'] = "high"
                elif "low" in line.lower() and "priority" in line.lower():
                    current_task['priority'] = "low"
        if current_task.get('title'):
            tasks.append(current_task)
        if not tasks:
            tasks = [
                {
                    "title": f"Review current {role} workload",
                    "description": "Assess current responsibilities and prioritize upcoming work",
                    "priority": "medium",
                    "estimated_time": "1 hour",
                    "role": role
                }
            ]
        return tasks[:6]

    def clear_all_memory(self):
        """ADMIN: Clear all project manager memory"""
        self._test_conversations.clear()
        self._conversation_schedules.clear()
        self._scheduled_tasks.clear()
        self._agent_initiated_conversations.clear()
        if hasattr(self, 'rag_manager') and self.rag_manager:
            try:
                self.rag_manager.clear_all_memories()
            except Exception as e:
                print(f"Could not clear RAG memory: {e}")
        logger.info("ProjectManager: All memory cleared")
    
    def clear_project_memory(self, project_id: str):
        """ADMIN: Clear memory for a specific project"""
        if project_id in self._test_conversations:
            del self._test_conversations[project_id]
        if project_id in self._conversation_schedules:
            del self._conversation_schedules[project_id]
        if project_id in self._agent_initiated_conversations:
            del self._agent_initiated_conversations[project_id]
        if hasattr(self, 'rag_manager') and self.rag_manager:
            try:
                self.rag_manager.clear_project_memories(project_id)
            except Exception as e:
                print(f"Could not clear RAG memory for project {project_id}: {e}")
        logger.info(f"ProjectManager: Memory cleared for project {project_id}")
