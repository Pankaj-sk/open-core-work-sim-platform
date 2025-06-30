from typing import Dict, Optional
from datetime import datetime, timedelta
import hashlib
import secrets
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import and_

from .models import User, UserSession, LoginRequest, RegisterRequest, LoginResponse, UserProfile, AuthResponse
from ..models import User as DBUser, UserSession as DBUserSession


class AuthManager:
    """Manages user authentication and sessions with database integration"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def _hash_password(self, password: str) -> str:
        """Hash password using SHA-256 (use bcrypt in production)"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def _verify_password(self, password: str, hashed: str) -> bool:
        """Verify password against hash"""
        return self._hash_password(password) == hashed
    
    def register_user(self, request: RegisterRequest) -> AuthResponse:
        """Register a new user"""
        try:
            # Check if username or email already exists
            existing_user = self.db.query(DBUser).filter(
                (DBUser.username == request.username) | (DBUser.email == request.email)
            ).first()
            
            if existing_user:
                if existing_user.username == request.username:
                    return AuthResponse(success=False, message=f"Username '{request.username}' already exists")
                else:
                    return AuthResponse(success=False, message=f"Email '{request.email}' already exists")
            
            # Create new user
            hashed_password = self._hash_password(request.password)
            user = DBUser(
                username=request.username,
                email=request.email,
                full_name=request.full_name,
                password=hashed_password,
                role="user",
                is_active=True,
                created_at=datetime.utcnow(),
                preferences={}
            )
            
            # Store user
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
            
            return AuthResponse(
                success=True,
                message="User registered successfully",
                data={"user_id": user.id, "username": user.username}
            )
            
        except Exception as e:
            self.db.rollback()
            return AuthResponse(success=False, message=f"Registration failed: {str(e)}")
    
    def authenticate_user(self, request: LoginRequest) -> Optional[DBUser]:
        """Authenticate user by username and password"""
        user = self.db.query(DBUser).filter(DBUser.username == request.username).first()
        
        if not user or not user.is_active:
            return None
        
        if not self._verify_password(request.password, user.password):
            return None
        
        # Update last login
        user.last_login = datetime.utcnow()
        self.db.commit()
        
        return user
    
    def create_session(self, user: DBUser) -> DBUserSession:
        """Create a new user session"""
        # Clean up expired sessions first
        self._cleanup_expired_sessions()
        
        session_id = str(uuid.uuid4())
        expires_at = datetime.utcnow() + timedelta(hours=24)  # 24 hour sessions
        
        session = DBUserSession(
            id=str(uuid.uuid4()),
            user_id=user.id,
            session_id=session_id,
            is_active=True,
            created_at=datetime.utcnow(),
            expires_at=expires_at
        )
        
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        
        return session
    
    def get_session(self, session_id: str) -> Optional[DBUserSession]:
        """Get session by ID"""
        session = self.db.query(DBUserSession).filter(
            and_(
                DBUserSession.session_id == session_id,
                DBUserSession.is_active == True,
                DBUserSession.expires_at > datetime.utcnow()
            )
        ).first()
        
        return session
    
    def get_user_by_session(self, session_id: str) -> Optional[DBUser]:
        """Get user by session ID"""
        session = self.get_session(session_id)
        if session:
            return self.db.query(DBUser).filter(DBUser.id == session.user_id).first()
        return None
    
    def logout(self, session_id: str) -> bool:
        """Logout user by invalidating session"""
        session = self.db.query(DBUserSession).filter(DBUserSession.session_id == session_id).first()
        if session:
            session.is_active = False
            self.db.commit()
            return True
        return False
    
    def get_user_profile(self, user_id: int) -> Optional[UserProfile]:
        """Get user profile"""
        user = self.db.query(DBUser).filter(DBUser.id == user_id).first()
        if user:
            return UserProfile(
                id=user.id,
                username=user.username,
                email=user.email,
                full_name=user.full_name,
                role=user.role,
                created_at=user.created_at,
                last_login=user.last_login,
                preferences=user.preferences or {}
            )
        return None
    
    def update_user_preferences(self, user_id: int, preferences: Dict) -> bool:
        """Update user preferences"""
        user = self.db.query(DBUser).filter(DBUser.id == user_id).first()
        if user:
            if not user.preferences:
                user.preferences = {}
            user.preferences.update(preferences)
            self.db.commit()
            return True
        return False
    
    def _cleanup_expired_sessions(self):
        """Remove expired sessions"""
        expired_sessions = self.db.query(DBUserSession).filter(
            DBUserSession.expires_at <= datetime.utcnow()
        ).all()
        
        for session in expired_sessions:
            session.is_active = False
        
        self.db.commit()
    
    def login(self, request: LoginRequest) -> AuthResponse:
        """Complete login flow"""
        try:
            user = self.authenticate_user(request)
            if not user:
                return AuthResponse(success=False, message="Invalid username or password")
            
            session = self.create_session(user)
            
            return AuthResponse(
                success=True,
                message="Login successful",
                data={
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "full_name": user.full_name,
                        "role": user.role
                    },
                    "session_id": session.session_id,
                    "expires_at": session.expires_at.isoformat()
                }
            )
            
        except Exception as e:
            return AuthResponse(success=False, message=f"Login failed: {str(e)}")
    
    def validate_session(self, session_id: str) -> AuthResponse:
        """Validate a session and return user info"""
        session = self.get_session(session_id)
        if not session:
            return AuthResponse(success=False, message="Invalid or expired session")
        
        user = self.db.query(DBUser).filter(DBUser.id == session.user_id).first()
        if not user:
            return AuthResponse(success=False, message="User not found")
        
        return AuthResponse(
            success=True,
            message="Session valid",
            data={
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "full_name": user.full_name,
                    "role": user.role
                }
            }
        )
