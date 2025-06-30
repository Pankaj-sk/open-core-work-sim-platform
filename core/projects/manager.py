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
        """Add a message to an existing conversation and generate AI responses in testing mode"""
        
        conversations = self._test_conversations.get(project_id, [])
        for conv in conversations:
            if conv["id"] == conversation_id:
                if "messages" not in conv or conv["messages"] is None:
                    conv["messages"] = []
                # Add user message
                conv["messages"].append({
                    "id": str(uuid.uuid4()),
                    "sender_id": sender_id,
                    "sender_name": "You" if sender_id == "user" else sender_id,
                    "content": message,
                    "timestamp": datetime.utcnow().isoformat(),
                    "message_type": message_type
                })
                # Generate simple AI responses for each agent participant
                participants = conv.get("participants", [])
                for participant in participants:
                    if participant != "user" and participant.lower() != "you":
                        ai_message = {
                            "id": str(uuid.uuid4()),
                            "sender_id": participant,
                            "sender_name": participant,
                            "content": f"[{participant}]: I have received your message and will respond soon.",
                            "timestamp": datetime.utcnow().isoformat(),
                            "message_type": "text"
                        }
                        conv["messages"].append(ai_message)
                return {"message": "Message added"}
        print(f"[DEBUG] add_message_to_conversation: project_id={project_id}, conversation_id={conversation_id}")
        print(f"[DEBUG] Available conversations for project: {[c['id'] for c in conversations]}")
        raise ValueError(f"Conversation {conversation_id} not found")
    
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
        """Generate a response from a specific agent"""
        
        # Find the agent in project members
        agent_member = next((m for m in project.members if m.agent_id == agent_id), None)
        if not agent_member:
            return None
        
        # Build prompt with context
        prompt = self._build_agent_prompt(agent_member, context, conversation, user_message)
        
        # Generate response (simplified for now)
        response_content = f"[{agent_member.name}]: I understand. Let me think about that..."
        
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
            "qa_001": "Maria Rodriguez",
            "designer_001": "David Kim",
            "analyst_001": "Lisa Thompson",
            "tech_lead_001": "Michael Brown"
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

    def create_conversation(self, conversation: dict):
        # In testing mode, store the conversation in memory
        project_id = conversation.get("project_id")
        if project_id not in self._test_conversations:
            self._test_conversations[project_id] = []
        self._test_conversations[project_id].append(conversation)
        print(f"[DEBUG] Conversation created for project {project_id}: {conversation}")
        print(f"[DEBUG] All conversations for project {project_id}: {self._test_conversations[project_id]}")
        return conversation

    def get_project_conversations(self, project_id: str):
        # In testing mode, return conversations from memory
        print(f"[DEBUG] get_project_conversations for project {project_id}: {self._test_conversations.get(project_id, [])}")
        return self._test_conversations.get(project_id, [])

    def get_conversation(self, conversation_id: str):
        # In testing mode, search all projects for the conversation
        for project_id, conversations in self._test_conversations.items():
            for conv in conversations:
                if conv["id"] == conversation_id:
                    return conv
        return None

    def update_conversation(self, conversation_id: str, updated: dict):
        # In testing mode, update the conversation in memory in-place
        for project_id, conversations in self._test_conversations.items():
            for idx, conv in enumerate(conversations):
                if conv["id"] == conversation_id:
                    conv.update(updated)
                    print(f"[DEBUG] Conversation updated for project {project_id}: {conv}")
                    print(f"[DEBUG] All conversations for project {project_id}: {self._test_conversations[project_id]}")
                    return conv
        print(f"[DEBUG] update_conversation: Conversation {conversation_id} not found in memory.")
        return None
