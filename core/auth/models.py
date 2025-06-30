from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from enum import Enum
import uuid


class UserRole(str, Enum):
    """User system roles (different from project roles)"""
    USER = "user"
    ADMIN = "admin"


class User(BaseModel):
    """User model for authentication and profile"""
    id: int
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]
    preferences: Dict[str, Any]


class UserSession(BaseModel):
    """User session model"""
    id: str
    user_id: int
    session_id: str
    is_active: bool
    created_at: datetime
    expires_at: datetime


class LoginRequest(BaseModel):
    """Login request model"""
    username: str
    password: str


class RegisterRequest(BaseModel):
    """Registration request model"""
    username: str
    email: EmailStr
    password: str
    full_name: str


class LoginResponse(BaseModel):
    """Login response model"""
    user: Dict[str, Any]
    session_id: str
    expires_at: datetime


class UserProfile(BaseModel):
    """User profile for frontend display"""
    id: int
    username: str
    email: str
    full_name: str
    role: str
    created_at: datetime
    last_login: Optional[datetime]
    preferences: Dict[str, Any]


class AuthResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
