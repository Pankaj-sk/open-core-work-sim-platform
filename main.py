#!/usr/bin/env python3
"""
Main entry point for the Work Simulation Platform API
"""

import uvicorn
from core.api import app

if __name__ == "__main__":
    # Try running with the app object directly instead of string reference
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
        reload=False,  # Disable reload to avoid potential issues
        log_level="info"
    )
