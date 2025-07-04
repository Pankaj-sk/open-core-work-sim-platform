#!/usr/bin/env python3
"""
Clear all call schedules, conversations, and code u        # Clear emotion profiles
        print("😊 Clearing emotion profiles...")
        deleted_emotion_profiles = session.query(EmotionProfile).delete()
        print(f"   ✅ Deleted {deleted_emotion_profiles} emotion profiles")
        
        # Clear additional data
        print("📊 Clearing additional data...")
        
        # Delete tasks
        deleted_tasks = session.query(Task).delete()
        print(f"   ✅ Deleted {deleted_tasks} tasks")
        
        # Delete project memory
        deleted_memory = session.query(ProjectMemory).delete()
        print(f"   ✅ Deleted {deleted_memory} project memory entries")
        
        # Delete RAG indices
        deleted_rag = session.query(RAGIndex).delete()
        print(f"   ✅ Deleted {deleted_rag} RAG indices")e database
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.config import settings
from core.models import (
    Call, CallParticipant, CallMessage, CallEmotion, 
    CodeUpload, CodeReview, Conversation, Message,
    EmotionProfile, ConversationParticipant, Task,
    ProjectMemory, ScheduledConversation, RAGIndex
)
from core.db import get_db, engine

def clear_all_data():
    """Clear all call schedules, conversations, and code uploads"""
    print("🧹 Starting data cleanup...")
    
    # Create a session
    Session = sessionmaker(bind=engine)
    session = Session()
    
    # Initialize counters
    deleted_emotions = deleted_messages = deleted_participants = deleted_calls = 0
    deleted_conversations = deleted_conv_participants = deleted_scheduled = 0
    deleted_uploads = deleted_reviews = deleted_emotion_profiles = 0
    deleted_tasks = deleted_memory = deleted_rag = 0
    
    try:
        # Clear call-related data
        print("📞 Clearing call data...")
        
        # Delete call emotions
        deleted_emotions = session.query(CallEmotion).delete()
        print(f"   ✅ Deleted {deleted_emotions} call emotions")
        
        # Delete call messages
        deleted_messages = session.query(CallMessage).delete()
        print(f"   ✅ Deleted {deleted_messages} call messages")
        
        # Delete call participants
        deleted_participants = session.query(CallParticipant).delete()
        print(f"   ✅ Deleted {deleted_participants} call participants")
        
        # Delete calls
        deleted_calls = session.query(Call).delete()
        print(f"   ✅ Deleted {deleted_calls} calls")
        
        # Clear conversation data
        print("💬 Clearing conversation data...")
        
        # Delete conversation participants
        deleted_conv_participants = session.query(ConversationParticipant).delete()
        print(f"   ✅ Deleted {deleted_conv_participants} conversation participants")
        
        # Delete messages
        deleted_messages = session.query(Message).delete()
        print(f"   ✅ Deleted {deleted_messages} messages")
        
        # Delete conversations
        deleted_conversations = session.query(Conversation).delete()
        print(f"   ✅ Deleted {deleted_conversations} conversations")
        
        # Delete scheduled conversations
        deleted_scheduled = session.query(ScheduledConversation).delete()
        print(f"   ✅ Deleted {deleted_scheduled} scheduled conversations")
        
        # Clear code upload data
        print("📄 Clearing code upload data...")
        
        # Delete code reviews
        deleted_reviews = session.query(CodeReview).delete()
        print(f"   ✅ Deleted {deleted_reviews} code reviews")
        
        # Delete code uploads
        deleted_uploads = session.query(CodeUpload).delete()
        print(f"   ✅ Deleted {deleted_uploads} code uploads")
        
        # Clear additional data
        print("� Clearing additional data...")
        
        # Delete tasks
        deleted_tasks = session.query(Task).delete()
        print(f"   ✅ Deleted {deleted_tasks} tasks")
        
        # Delete project memory
        deleted_memory = session.query(ProjectMemory).delete()
        print(f"   ✅ Deleted {deleted_memory} project memory entries")
        
        # Delete RAG indices
        deleted_rag = session.query(RAGIndex).delete()
        print(f"   ✅ Deleted {deleted_rag} RAG indices")
        
        # Commit all changes
        session.commit()
        print("✅ All changes committed to database")
        
        # Clear uploads directory
        print("📁 Clearing uploads directory...")
        uploads_dir = "uploads"
        if os.path.exists(uploads_dir):
            import shutil
            for filename in os.listdir(uploads_dir):
                file_path = os.path.join(uploads_dir, filename)
                try:
                    if os.path.isfile(file_path) or os.path.islink(file_path):
                        os.unlink(file_path)
                    elif os.path.isdir(file_path):
                        shutil.rmtree(file_path)
                except Exception as e:
                    print(f"   ⚠️  Failed to delete {file_path}: {e}")
            print(f"   ✅ Cleared uploads directory")
        else:
            print(f"   ℹ️  Uploads directory doesn't exist")
        
        print("\n🎉 Data cleanup completed successfully!")
        print("\n📊 Summary:")
        print(f"   • Calls: {deleted_calls}")
        print(f"   • Call Participants: {deleted_participants}")
        print(f"   • Call Messages: {deleted_messages}")
        print(f"   • Call Emotions: {deleted_emotions}")
        print(f"   • Conversations: {deleted_conversations}")
        print(f"   • Conversation Participants: {deleted_conv_participants}")
        print(f"   • Messages: {deleted_messages}")
        print(f"   • Scheduled Conversations: {deleted_scheduled}")
        print(f"   • Code Uploads: {deleted_uploads}")
        print(f"   • Code Reviews: {deleted_reviews}")
        print(f"   • Emotion Profiles: {deleted_emotion_profiles}")
        print(f"   • Tasks: {deleted_tasks}")
        print(f"   • Project Memory: {deleted_memory}")
        print(f"   • RAG Indices: {deleted_rag}")
        
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")
        session.rollback()
        raise
    finally:
        session.close()

def clear_agent_memory():
    """Clear agent conversation memory from the AgentManager"""
    print("\n🧠 Clearing agent memory...")
    
    try:
        from core.agents.manager import AgentManager
        agent_manager = AgentManager()
        agent_manager.clear_all_memory()
        print("   ✅ Agent conversation history cleared")
    except Exception as e:
        print(f"   ⚠️  Could not clear agent memory: {e}")

def clear_rag_memory():
    """Clear RAG/vector database if it exists"""
    print("\n🔍 Clearing RAG memory...")
    
    try:
        # Try to clear FAISS indices if they exist
        import glob
        faiss_files = glob.glob("*.faiss") + glob.glob("*.index")
        for file in faiss_files:
            try:
                os.remove(file)
                print(f"   ✅ Removed FAISS index: {file}")
            except Exception as e:
                print(f"   ⚠️  Could not remove {file}: {e}")
        
        # Clear any conversation cache
        cache_files = glob.glob("conversation_cache.*")
        for file in cache_files:
            try:
                os.remove(file)
                print(f"   ✅ Removed cache file: {file}")
            except Exception as e:
                print(f"   ⚠️  Could not remove {file}: {e}")
                
        if not faiss_files and not cache_files:
            print("   ℹ️  No RAG memory files found")
            
    except Exception as e:
        print(f"   ⚠️  Error clearing RAG memory: {e}")

def main():
    """Main cleanup function"""
    print("🗑️  SimWorld Data Cleanup Tool")
    print("=" * 50)
    
    confirm = input("\n⚠️  This will permanently delete ALL:\n"
                   "   • Call schedules and history\n"
                   "   • Conversations and messages\n"
                   "   • Code uploads and reviews\n"
                   "   • Emotion data and profiles\n"
                   "   • Agent memory\n"
                   "   • RAG/vector indices\n\n"
                   "Are you sure you want to continue? (yes/no): ")
    
    if confirm.lower() not in ['yes', 'y']:
        print("❌ Cleanup cancelled")
        return
    
    try:
        # Clear database data
        clear_all_data()
        
        # Clear agent memory
        clear_agent_memory()
        
        # Clear RAG memory
        clear_rag_memory()
        
        print("\n🎉 Complete system cleanup finished!")
        print("🚀 Your system is now clean and ready for fresh data!")
        
    except Exception as e:
        print(f"\n❌ Cleanup failed: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
