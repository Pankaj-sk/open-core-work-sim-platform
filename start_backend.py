#!/usr/bin/env python3
"""
Development startup script for SimWorld backend
"""

import os
import subprocess
import sys
from pathlib import Path

def main():
    """Start the backend server with uvicorn"""
    print("🚀 Starting SimWorld Backend Server...")
    print("=" * 50)
    
    # Check if .env file exists
    if not os.path.exists('.env'):
        print("⚠️  Warning: .env file not found!")
        print("   Please copy .env.example to .env and configure your settings")
        print("   Continuing with default settings...")
    
    # Check if virtual environment is activated
    if not hasattr(sys, 'real_prefix') and not (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("⚠️  Warning: Virtual environment not detected!")
        print("   It's recommended to use a virtual environment")
        print("   Run: python -m venv venv && venv\\Scripts\\activate (Windows) or source venv/bin/activate (Linux/Mac)")
        print()
    
    # Start uvicorn server
    cmd = [
        sys.executable, '-m', 'uvicorn',
        'core.api:app',
        '--host', '0.0.0.0',
        '--port', '8000',
        '--reload',
        '--reload-dir', 'core',
        '--log-level', 'info'
    ]
    
    print("📡 Backend Server Configuration:")
    print(f"   • Host: 0.0.0.0:8000")
    print(f"   • API Docs: http://localhost:8000/docs")
    print(f"   • Health Check: http://localhost:8000/health")
    print(f"   • Auto-reload: Enabled")
    print()
    print("💡 To stop the server, press Ctrl+C")
    print("=" * 50)
    
    try:
        subprocess.run(cmd)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
