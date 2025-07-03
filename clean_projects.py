#!/usr/bin/env python3
"""
Remove all current projects from SimWorld database
Clean up all project data, conversations, and memory
"""

import sqlite3
import os
import sys
import shutil

def remove_all_projects():
    """Remove all projects from the database"""
    
    print("🧹 Removing all current projects from SimWorld...")
    
    # Database file path
    db_path = "simulation.db"
    
    if os.path.exists(db_path):
        try:
            # Connect to database
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Get all table names
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            print(f"Found tables: {[table[0] for table in tables]}")
            
            # Check if projects table exists
            table_names = [table[0] for table in tables]
            
            if 'projects' in table_names:
                # Get current projects
                cursor.execute("SELECT * FROM projects;")
                projects = cursor.fetchall()
                print(f"Found {len(projects)} projects to remove")
                
                # Delete all projects
                cursor.execute("DELETE FROM projects;")
                print("✅ Removed all projects")
            else:
                print("ℹ️ No projects table found")
            
            # Clean up related data
            tables_to_clean = [
                'conversations',
                'messages', 
                'agent_memories',
                'conversation_summaries',
                'project_agents',
                'project_files',
                'artifacts'
            ]
            
            for table in tables_to_clean:
                if table in table_names:
                    cursor.execute(f"DELETE FROM {table};")
                    print(f"✅ Cleaned {table} table")
            
            # Commit changes
            conn.commit()
            print("✅ Database changes committed")
            
        except sqlite3.Error as e:
            print(f"❌ Database error: {e}")
        finally:
            conn.close()
    else:
        print("ℹ️ No database file found")
    
    # Remove vector database files
    vector_db_paths = [
        "chroma_db",
        "vector_store", 
        "embeddings_cache",
        "memory_store"
    ]
    
    for path in vector_db_paths:
        if os.path.exists(path):
            try:
                if os.path.isfile(path):
                    os.remove(path)
                    print(f"✅ Removed {path} file")
                elif os.path.isdir(path):
                    shutil.rmtree(path)
                    print(f"✅ Removed {path} directory")
            except Exception as e:
                print(f"❌ Error removing {path}: {e}")
    
    # Remove conversation history files
    temp_files = [
        "conversation_history.json",
        "agent_memories.json",
        "project_data.json"
    ]
    
    for file in temp_files:
        if os.path.exists(file):
            try:
                os.remove(file)
                print(f"✅ Removed {file}")
            except Exception as e:
                print(f"❌ Error removing {file}: {e}")

def clean_memory_cache():
    """Clean up memory cache and temporary files"""
    
    print("\n🧠 Cleaning memory cache...")
    
    # Remove Python cache files
    cache_dirs = []
    for root, dirs, files in os.walk("."):
        for dir in dirs:
            if dir == "__pycache__":
                cache_dirs.append(os.path.join(root, dir))
    
    for cache_dir in cache_dirs:
        try:
            shutil.rmtree(cache_dir)
            print(f"✅ Removed {cache_dir}")
        except Exception as e:
            print(f"❌ Error removing {cache_dir}: {e}")
    
    # Remove .pyc files
    pyc_files = []
    for root, dirs, files in os.walk("."):
        for file in files:
            if file.endswith(".pyc"):
                pyc_files.append(os.path.join(root, file))
    
    for pyc_file in pyc_files:
        try:
            os.remove(pyc_file)
            print(f"✅ Removed {pyc_file}")
        except Exception as e:
            print(f"❌ Error removing {pyc_file}: {e}")

def reset_database():
    """Reset the database to initial state"""
    
    print("\n🔄 Resetting database to initial state...")
    
    # Remove existing database
    if os.path.exists("simulation.db"):
        try:
            os.remove("simulation.db")
            print("✅ Removed existing database")
        except Exception as e:
            print(f"❌ Error removing database: {e}")
    
    # Initialize fresh database
    try:
        from core.models import Base
        from core.db import engine
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ Created fresh database tables")
        
    except Exception as e:
        print(f"❌ Error creating fresh database: {e}")

if __name__ == "__main__":
    try:
        print("🚀 Starting SimWorld project cleanup...")
        
        # Step 1: Remove all projects
        remove_all_projects()
        
        # Step 2: Clean memory cache
        clean_memory_cache()
        
        # Step 3: Reset database (optional)
        response = input("\nWould you like to reset the database completely? (y/n): ")
        if response.lower() == 'y':
            reset_database()
        
        print("\n🎉 SimWorld cleanup completed!")
        print("All projects, conversations, and memory have been removed.")
        print("The system is now ready for fresh projects.")
        
    except Exception as e:
        print(f"❌ Cleanup failed: {e}")
        import traceback
        traceback.print_exc()
