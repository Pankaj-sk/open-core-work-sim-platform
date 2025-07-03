"""
Custom exceptions for the SimWorld platform
"""

class SimWorldException(Exception):
    """Base exception for SimWorld platform"""
    pass

class ProjectNotFoundException(SimWorldException):
    """Raised when a project is not found"""
    pass

class ConversationNotFoundException(SimWorldException):
    """Raised when a conversation is not found"""
    pass

class AgentNotFoundException(SimWorldException):
    """Raised when an agent is not found"""
    pass

class InvalidInputException(SimWorldException):
    """Raised when input validation fails"""
    pass

class AuthenticationException(SimWorldException):
    """Raised when authentication fails"""
    pass

class AuthorizationException(SimWorldException):
    """Raised when authorization fails"""
    pass

class AIServiceException(SimWorldException):
    """Raised when AI service calls fail"""
    pass

class DatabaseException(SimWorldException):
    """Raised when database operations fail"""
    pass

class MemoryException(SimWorldException):
    """Raised when memory operations fail"""
    pass
