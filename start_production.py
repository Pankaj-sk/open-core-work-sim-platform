#!/usr/bin/env python3
"""
Production startup script for SimWorld platform
"""

import os
import sys
import subprocess
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def check_environment():
    """Check if production environment is properly configured"""
    required_env_vars = [
        'SECRET_KEY',
        'DATABASE_URL',
        'CORS_ORIGINS'
    ]
    
    missing_vars = []
    for var in required_env_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        logger.error(f"Missing required environment variables: {', '.join(missing_vars)}")
        logger.error("Please create a .env file or set these environment variables")
        return False
    
    # Check if SECRET_KEY is not the default
    if os.getenv('SECRET_KEY') == 'your-secret-key-change-in-production':
        logger.error("SECRET_KEY is still set to default value. Please change it!")
        return False
    
    return True

def run_migrations():
    """Run database migrations"""
    try:
        logger.info("Running database migrations...")
        subprocess.run([
            sys.executable, '-m', 'alembic', 'upgrade', 'head'
        ], check=True)
        logger.info("Database migrations completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Database migration failed: {e}")
        return False

def start_production_server():
    """Start the production server using Gunicorn"""
    try:
        logger.info("Starting production server with Gunicorn...")
        
        # Gunicorn configuration
        cmd = [
            'gunicorn',
            'core.api:app',
            '--worker-class', 'uvicorn.workers.UvicornWorker',
            '--workers', '4',
            '--bind', '0.0.0.0:8000',
            '--access-logfile', '-',
            '--error-logfile', '-',
            '--log-level', 'info',
            '--preload',
            '--max-requests', '1000',
            '--max-requests-jitter', '100',
            '--timeout', '30',
            '--keep-alive', '5'
        ]
        
        subprocess.run(cmd)
        
    except KeyboardInterrupt:
        logger.info("Server shutdown requested")
    except Exception as e:
        logger.error(f"Server startup failed: {e}")
        return False

def main():
    """Main startup function"""
    logger.info("Starting SimWorld production server...")
    
    # Check environment
    if not check_environment():
        sys.exit(1)
    
    # Run migrations
    if not run_migrations():
        logger.error("Failed to run migrations. Exiting.")
        sys.exit(1)
    
    # Start server
    start_production_server()

if __name__ == "__main__":
    main()
