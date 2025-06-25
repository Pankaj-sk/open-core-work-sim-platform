import pytest
from fastapi.testclient import TestClient
from core.api import app

client = TestClient(app)


def test_chat_with_agent_fallback():
    """Test chatting with an agent using fallback responses (no custom model)"""
    response = client.post(
        "/api/v1/agents/manager_001/chat",
        json={"message": "Hello, I need help with my project"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert "agent_id" in data
    assert data["agent_id"] == "manager_001"
    assert len(data["response"]) > 0
    print(f"Manager response: {data['response']}")


def test_chat_with_developer_agent():
    """Test chatting with developer agent"""
    response = client.post(
        "/api/v1/agents/developer_001/chat",
        json={"message": "What do you think about the architecture?"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert data["agent_id"] == "developer_001"
    print(f"Developer response: {data['response']}")


def test_chat_with_client_agent():
    """Test chatting with client agent"""
    response = client.post(
        "/api/v1/agents/client_001/chat",
        json={"message": "How much will this cost?"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert data["agent_id"] == "client_001"
    print(f"Client response: {data['response']}")


def test_chat_history():
    """Test getting chat history"""
    # First send a message
    client.post(
        "/api/v1/agents/manager_001/chat",
        json={"message": "Test message for history"}
    )
    
    # Then get history
    response = client.get("/api/v1/agents/manager_001/history")
    assert response.status_code == 200
    data = response.json()
    assert "history" in data
    assert len(data["history"]) >= 2  # At least user message and agent response
    print(f"Chat history entries: {len(data['history'])}")


def test_simulation_start():
    """Test starting a new simulation"""
    response = client.post(
        "/api/v1/simulations/start",
        json={
            "scenario_id": "team_meeting",
            "participants": ["manager", "developer"],
            "duration_minutes": 30
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "simulation_id" in data
    assert "status" in data
    assert data["status"] == "started"
    
    simulation_id = data["simulation_id"]
    print(f"Started simulation: {simulation_id}")
    
    # Test getting simulation details
    response = client.get(f"/api/v1/simulations/{simulation_id}")
    assert response.status_code == 200
    sim_data = response.json()
    assert "simulation" in sim_data
    print(f"Simulation status: {sim_data['simulation']['status']}")
    
    return simulation_id


def test_generate_artifact():
    """Test generating an artifact"""
    response = client.post(
        "/api/v1/artifacts/generate",
        json={
            "template_id": "meeting_minutes",
            "data": {
                "participants": ["John Doe", "Jane Smith"],
                "agenda": ["Project update", "Budget review"],
                "decisions": ["Approved additional budget"],
                "action_items": ["John: Update timeline", "Jane: Review costs"]
            }
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "artifact" in data
    artifact = data["artifact"]
    assert artifact["name"] == "Meeting Minutes"
    print(f"Generated artifact: {artifact['id']}")
    
    # Test getting the artifact
    artifact_id = artifact["id"]
    response = client.get(f"/api/v1/artifacts/{artifact_id}")
    assert response.status_code == 200
    artifact_data = response.json()
    assert "artifact" in artifact_data


def test_invalid_agent():
    """Test chatting with non-existent agent"""
    response = client.post(
        "/api/v1/agents/invalid_agent/chat",
        json={"message": "Hello"}
    )
    assert response.status_code == 404


def test_invalid_simulation():
    """Test getting non-existent simulation"""
    response = client.get("/api/v1/simulations/invalid_simulation_id")
    assert response.status_code == 404


if __name__ == "__main__":
    # Run individual tests for manual testing
    print("🧪 Testing Work Simulation Platform...")
    
    print("\n1. Testing chat functionality...")
    test_chat_with_agent_fallback()
    test_chat_with_developer_agent() 
    test_chat_with_client_agent()
    
    print("\n2. Testing simulation functionality...")
    simulation_id = test_simulation_start()
    
    print("\n3. Testing artifact generation...")
    test_generate_artifact()
    
    print("\n4. Testing chat history...")
    test_chat_history()
    
    print("\n✅ All tests completed successfully!")
