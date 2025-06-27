"""
Core package for the Work Simulation Platform
"""

from .api import app
from .config import settings

__version__ = "1.0.0"
__all__ = ["app", "settings"]
