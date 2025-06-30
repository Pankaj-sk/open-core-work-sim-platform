#!/usr/bin/env python3
"""
Main entry point for the Work Simulation Platform API
"""

import uvicorn
from core.api import app
from core.db import engine
from core.models import Base

# Create database tables
Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    # Try running with the app object directly instead of string reference
    uvicorn.run("core.api:app", host="0.0.0.0", port=8000, reload=True)
