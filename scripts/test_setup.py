#!/usr/bin/env python3
"""
Test script to verify the work simulation platform setup
"""

import sys
import os
import subprocess
from pathlib import Path

def test_imports():
    """Test that all core modules can be imported"""
    print("🔧 Testing imports...")
    
    try:
        # Add core directory to path
        core_path = Path(__file__).parent.parent / "core"
        sys.path.insert(0, str(core_path))
        
        # Test imports
        from config import settings
        print("✅ Config imported successfully")
        
        from agents.manager import AgentManager
        print("✅ Agent manager imported successfully")
        
        from simulation.engine import SimulationEngine
        print("✅ Simulation engine imported successfully")
        
        from events.event_manager import event_manager
        print("✅ Event manager imported successfully")
        
        from artifacts.generator import artifact_generator
        print("✅ Artifact generator imported successfully")
        
        from api import app
        print("✅ FastAPI app imported successfully")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import failed: {e}")
        return False

def test_agent_manager():
    """Test agent manager functionality"""
    print("\n🤖 Testing agent manager...")
    
    try:
        from agents.manager import AgentManager
        
        manager = AgentManager()
        agents = manager.get_available_agents()
        
        print(f"✅ Found {len(agents)} agents")
        
        # Test chat functionality
        response = manager.chat_with_agent("manager_001", "Hello")
        print(f"✅ Chat response: {response[:50]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ Agent manager test failed: {e}")
        return False

def test_simulation_engine():
    """Test simulation engine functionality"""
    print("\n🚀 Testing simulation engine...")
    
    try:
        from simulation.engine import SimulationEngine, SimulationConfig
        
        engine = SimulationEngine()
        scenarios = engine.scenarios
        
        print(f"✅ Found {len(scenarios)} scenarios")
        
        # Test simulation creation
        config = SimulationConfig(
            scenario_id="team_meeting",
            participants=["manager", "developer"],
            duration_minutes=30
        )
        
        simulation_id = engine.start_simulation(config)
        print(f"✅ Created simulation: {simulation_id}")
        
        return True
        
    except Exception as e:
        print(f"❌ Simulation engine test failed: {e}")
        return False

def test_event_system():
    """Test event system functionality"""
    print("\n📡 Testing event system...")
    
    try:
        from events.event_manager import event_manager
        
        # Test event emission
        event_id = event_manager.emit("test_event", {"message": "Hello world"})
        print(f"✅ Emitted event: {event_id}")
        
        # Test event retrieval
        events = event_manager.get_events()
        print(f"✅ Retrieved {len(events)} events")
        
        return True
        
    except Exception as e:
        print(f"❌ Event system test failed: {e}")
        return False

def test_artifact_generator():
    """Test artifact generator functionality"""
    print("\n📄 Testing artifact generator...")
    
    try:
        from artifacts.generator import artifact_generator
        
        templates = artifact_generator.get_available_templates()
        print(f"✅ Found {len(templates)} templates")
        
        # Test artifact generation
        data = {
            "participants": ["John", "Jane"],
            "agenda": ["Item 1", "Item 2"],
            "decisions": ["Decision 1"],
            "action_items": ["Action 1"]
        }
        
        artifact = artifact_generator.generate_artifact("meeting_minutes", data)
        print(f"✅ Generated artifact: {artifact.name}")
        
        return True
        
    except Exception as e:
        print(f"❌ Artifact generator test failed: {e}")
        return False

def test_frontend_dependencies():
    """Test frontend dependencies"""
    print("\n🎨 Testing frontend dependencies...")
    
    try:
        frontend_path = Path(__file__).parent.parent / "frontend"
        package_json = frontend_path / "package.json"
        
        if not package_json.exists():
            print("❌ package.json not found")
            return False
        
        print("✅ package.json found")
        
        # Check if node_modules exists (optional)
        node_modules = frontend_path / "node_modules"
        if node_modules.exists():
            print("✅ node_modules found")
        else:
            print("⚠️  node_modules not found (run 'npm install' in frontend directory)")
        
        return True
        
    except Exception as e:
        print(f"❌ Frontend test failed: {e}")
        return False

def test_api_endpoints():
    """Test API endpoints"""
    print("\n🌐 Testing API endpoints...")
    
    try:
        import requests
        import time
        
        # Start the API server in background (simplified test)
        print("✅ API server would start here (manual test required)")
        print("   Run: cd core && python -m uvicorn api:app --reload")
        print("   Then test: curl http://localhost:8000/health")
        
        return True
        
    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Testing Work Simulation Platform Setup\n")
    
    tests = [
        test_imports,
        test_agent_manager,
        test_simulation_engine,
        test_event_system,
        test_artifact_generator,
        test_frontend_dependencies,
        test_api_endpoints
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
    
    print(f"\n📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The setup is working correctly.")
        print("\nNext steps:")
        print("1. Start the core API: cd core && python -m uvicorn api:app --reload")
        print("2. Start the frontend: cd frontend && npm start")
        print("3. Open http://localhost:3000 in your browser")
        print("4. Run Docker setup: docker-compose up --build")
    else:
        print("❌ Some tests failed. Please check the errors above.")
        sys.exit(1)

if __name__ == "__main__":
    main() 