from sqlalchemy import (
    Column, Integer, String, DateTime, Text, ForeignKey, Float, Date, JSON, Boolean
)
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime, date
from enum import Enum

Base = declarative_base()

# --- Enumerations for Roles, Phases, and Conversation Types ---

class ProjectRole(str, Enum):
    """Available project roles for users and AI personas"""
    JUNIOR_DEVELOPER = "junior_developer"
    SENIOR_DEVELOPER = "senior_developer"
    TECH_LEAD = "tech_lead"
    PROJECT_MANAGER = "project_manager"
    PRODUCT_MANAGER = "product_manager"
    QA_ENGINEER = "qa_engineer"
    DESIGNER = "designer"
    BUSINESS_ANALYST = "business_analyst"
    INTERN = "intern"
    SCRUM_MASTER = "scrum_master"

class ProjectPhase(str, Enum):
    """Project lifecycle phases"""
    PLANNING = "planning"
    DEVELOPMENT = "development"
    TESTING = "testing"
    DEPLOYMENT = "deployment"
    MAINTENANCE = "maintenance"
    COMPLETED = "completed"

class ConversationType(str, Enum):
    """Types of conversations that can happen"""
    DAILY_STANDUP = "daily_standup"
    CODE_REVIEW = "code_review"
    PROJECT_UPDATE = "project_update"
    PERFORMANCE_REVIEW = "performance_review"
    TEAM_MEETING = "team_meeting"
    CLIENT_MEETING = "client_meeting"
    EMERGENCY = "emergency"
    CASUAL_CHAT = "casual_chat"
    TASK_ASSIGNMENT = "task_assignment"
    FEEDBACK_SESSION = "feedback_session"
    ONE_ON_ONE = "one_on_one"
    STATUS_UPDATE = "status_update"

class ConversationStatus(str, Enum):
    """Status of conversations"""
    ACTIVE = "active"
    ENDED = "ended"
    SCHEDULED = "scheduled"
    PENDING = "pending"

# --- SQLAlchemy Database Models ---

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(200), unique=True, nullable=False, index=True)
    password = Column(String(200), nullable=False) # Hashed password
    full_name = Column(String(200), nullable=False)
    role = Column(String(50), default="user")  # user, admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    preferences = Column(JSON, default=dict)

    projects = relationship('ProjectMember', back_populates='user')
    sessions = relationship('UserSession', back_populates='user')

class UserSession(Base):
    __tablename__ = 'user_sessions'
    id = Column(String(64), primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    session_id = Column(String(200), unique=True, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    
    user = relationship('User', back_populates='sessions')

class Project(Base):
    __tablename__ = 'projects'
    id = Column(String(64), primary_key=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    created_by = Column(Integer, ForeignKey('users.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    start_date = Column(Date, default=date.today)
    end_date = Column(Date, nullable=True)
    current_phase = Column(String(50), default=ProjectPhase.PLANNING)
    is_active = Column(Boolean, default=True)
    settings = Column(JSON, default=dict)  # Project-specific settings

    members = relationship('ProjectMember', back_populates='project', cascade="all, delete-orphan")
    conversations = relationship('Conversation', back_populates='project', cascade="all, delete-orphan")
    tasks = relationship('Task', back_populates='project', cascade="all, delete-orphan")
    memories = relationship('ProjectMemory', back_populates='project', cascade="all, delete-orphan")

class ProjectMember(Base):
    __tablename__ = 'project_members'
    id = Column(Integer, primary_key=True)
    project_id = Column(String(64), ForeignKey('projects.id'), index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True, index=True) # Nullable for AI agents
    agent_id = Column(String(100), nullable=True) # For AI personas
    
    name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False)
    is_user = Column(Boolean, default=False)
    experience_level = Column(String(50))
    skills = Column(JSON)
    personality_traits = Column(JSON)
    reporting_to = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    joined_at = Column(DateTime, default=datetime.utcnow)

    project = relationship('Project', back_populates='members')
    user = relationship('User', back_populates='projects')

class Conversation(Base):
    __tablename__ = 'conversations'
    id = Column(String(64), primary_key=True)
    project_id = Column(String(64), ForeignKey('projects.id'), index=True)
    conversation_type = Column(String(50))
    status = Column(String(50), default=ConversationStatus.ACTIVE)
    initiated_by = Column(String(100)) # Can be a user_id or agent_id
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    scheduled_time = Column(DateTime, nullable=True)
    title = Column(String(200), nullable=True)
    summary = Column(Text, nullable=True)
    
    project = relationship('Project', back_populates='conversations')
    messages = relationship('Message', back_populates='conversation', cascade="all, delete-orphan")
    participants = relationship('ConversationParticipant', back_populates='conversation', cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = 'messages'
    id = Column(String(64), primary_key=True)
    conversation_id = Column(String(64), ForeignKey('conversations.id'), index=True)
    sender_id = Column(String(100)) # user_id or agent_id
    sender_name = Column(String(100), nullable=False)
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    message_type = Column(String(50), default="text")  # text, system, action
    message_metadata = Column(JSON, default=dict)
    
    conversation = relationship('Conversation', back_populates='messages')

class ConversationParticipant(Base):
    __tablename__ = 'conversation_participants'
    id = Column(Integer, primary_key=True)
    conversation_id = Column(String(64), ForeignKey('conversations.id'), index=True)
    participant_id = Column(String(100)) # user_id or agent_id
    participant_name = Column(String(100), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)
    left_at = Column(DateTime, nullable=True)

    conversation = relationship('Conversation', back_populates='participants')

class Task(Base):
    __tablename__ = 'tasks'
    id = Column(String(64), primary_key=True)
    project_id = Column(String(64), ForeignKey('projects.id'), index=True)
    assigned_to = Column(String(100)) # user_id or agent_id
    assigned_by = Column(String(100)) # user_id or agent_id
    title = Column(String(200), nullable=False)
    description = Column(Text)
    status = Column(String(50), default="pending")  # pending, in_progress, completed, blocked
    priority = Column(String(50), default="medium")  # low, medium, high, urgent
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    task_metadata = Column(JSON, default=dict)
    
    project = relationship('Project', back_populates='tasks')

class ProjectMemory(Base):
    __tablename__ = 'project_memories'
    id = Column(String(64), primary_key=True)
    project_id = Column(String(64), ForeignKey('projects.id'), index=True)
    content_type = Column(String(50)) # conversation, task, event, observation
    content = Column(Text, nullable=False)
    source_id = Column(String(100)) # conversation_id, task_id, etc.
    source_type = Column(String(50)) # conversation, task, etc.
    agent_id = Column(String(100), nullable=True) # Which agent observed this
    user_id = Column(Integer, nullable=True) # Which user was involved
    embedding = Column(JSON) # Vector embedding for RAG
    timestamp = Column(DateTime, default=datetime.utcnow)
    memory_metadata = Column(JSON, default=dict)
    
    project = relationship('Project', back_populates='memories')

class ScheduledConversation(Base):
    __tablename__ = 'scheduled_conversations'
    id = Column(String(64), primary_key=True)
    project_id = Column(String(64), ForeignKey('projects.id'), index=True)
    conversation_type = Column(String(50), nullable=False)
    initiating_agent_id = Column(String(100), nullable=False)
    target_participants = Column(JSON) # List of participant IDs
    scheduled_time = Column(DateTime, nullable=False)
    message = Column(Text, nullable=True)
    urgency = Column(String(50), default="normal")  # low, normal, high, urgent
    recurring = Column(Boolean, default=False)
    recurring_pattern = Column(String(50), nullable=True)  # daily, weekly, monthly
    status = Column(String(50), default="scheduled")  # scheduled, triggered, cancelled
    created_at = Column(DateTime, default=datetime.utcnow)
    triggered_at = Column(DateTime, nullable=True)

class RAGIndex(Base):
    __tablename__ = 'rag_index'
    id = Column(String(64), primary_key=True)
    project_id = Column(String(64), ForeignKey('projects.id'), index=True)
    content_type = Column(String(50)) # e.g., 'message', 'task', 'goal'
    content = Column(Text)
    embedding = Column(JSON) # Placeholder for vector embedding
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    project = relationship('Project')
