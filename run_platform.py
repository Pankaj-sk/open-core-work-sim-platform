#!/usr/bin/env python3
"""
Workplace Simulation Platform Runner
This script sets up and runs the complete platform with all components.
"""

import os
import sys
import subprocess
import time
import webbrowser
from pathlib import Path

def check_dependencies():
    """Check if required dependencies are installed"""
    print("🔍 Checking dependencies...")
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ is required")
        return False
    
    # Check if requirements are installed
    try:
        import fastapi
        import sqlalchemy
        import uvicorn
        print("✅ Python dependencies are installed")
    except ImportError as e:
        print(f"❌ Missing Python dependency: {e}")
        print("Run: pip install -r requirements.txt")
        return False
    
    # Check Node.js
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Node.js is installed: {result.stdout.strip()}")
        else:
            print("❌ Node.js is not installed")
            return False
    except FileNotFoundError:
        print("❌ Node.js is not installed")
        return False
    
    return True

def setup_database():
    """Set up the database"""
    print("🗄️ Setting up database...")
    
    try:
        from core.db import engine
        from core.models import Base
        
        # Create tables
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")
        return True
    except Exception as e:
        print(f"❌ Database setup failed: {e}")
        return False

def start_backend():
    """Start the backend server"""
    print("🚀 Starting backend server...")
    
    try:
        # Start the backend
        subprocess.Popen([
            sys.executable, 'main.py'
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Wait for server to start
        time.sleep(3)
        print("✅ Backend server started on http://localhost:8000")
        return True
    except Exception as e:
        print(f"❌ Backend startup failed: {e}")
        return False

def start_frontend():
    """Start the frontend development server"""
    print("🎨 Starting frontend server...")
    
    frontend_dir = Path("frontend")
    if not frontend_dir.exists():
        print("❌ Frontend directory not found")
        return False
    
    try:
        # Check if node_modules exists
        if not (frontend_dir / "node_modules").exists():
            print("📦 Installing frontend dependencies...")
            subprocess.run(['npm', 'install'], cwd=frontend_dir, check=True)
        
        # Start the frontend
        subprocess.Popen([
            'npm', 'start'
        ], cwd=frontend_dir, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Wait for server to start
        time.sleep(5)
        print("✅ Frontend server started on http://localhost:3000")
        return True
    except Exception as e:
        print(f"❌ Frontend startup failed: {e}")
        return False

def open_browser():
    """Open the application in the browser"""
    print("🌐 Opening application in browser...")
    
    try:
        webbrowser.open('http://localhost:3000')
        print("✅ Browser opened successfully")
    except Exception as e:
        print(f"⚠️ Could not open browser automatically: {e}")
        print("Please manually open: http://localhost:3000")

def main():
    """Main function to run the platform"""
    print("🎯 Workplace Simulation Platform")
    print("=" * 50)
    
    # Check dependencies
    if not check_dependencies():
        print("\n❌ Dependency check failed. Please install missing dependencies.")
        return
    
    # Setup database
    if not setup_database():
        print("\n❌ Database setup failed.")
        return
    
    # Start backend
    if not start_backend():
        print("\n❌ Backend startup failed.")
        return
    
    # Start frontend
    if not start_frontend():
        print("\n❌ Frontend startup failed.")
        return
    
    # Open browser
    open_browser()
    
    print("\n🎉 Platform is running!")
    print("=" * 50)
    print("📱 Frontend: http://localhost:3000")
    print("🔧 Backend API: http://localhost:8000")
    print("📚 API Docs: http://localhost:8000/docs")
    print("\n💡 To stop the platform, press Ctrl+C")
    
    try:
        # Keep the script running
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Shutting down platform...")
        print("✅ Platform stopped")

if __name__ == "__main__":
    main() 