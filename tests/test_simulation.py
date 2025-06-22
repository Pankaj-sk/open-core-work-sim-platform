import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_ping_endpoint():
    """Test the ping endpoint for health check"""
    response = client.get("/ping")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "message": "pong"}


def test_simulation_ping():
    """Test the simulation ping endpoint"""
    response = client.get("/api/simulation/ping")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "message": "Simulation service is running"}


def test_get_scenarios():
    """Test getting available scenarios"""
    response = client.get("/api/simulation/scenarios")
    assert response.status_code == 200
    data = response.json()
    assert "scenarios" in data
    assert len(data["scenarios"]) > 0


def test_get_agents():
    """Test getting available agents"""
    response = client.get("/api/agents/")
    assert response.status_code == 200
    data = response.json()
    assert "agents" in data
    assert len(data["agents"]) > 0


def test_get_agent_roles():
    """Test getting available agent roles"""
    response = client.get("/api/agents/roles")
    assert response.status_code == 200
    data = response.json()
    assert "roles" in data
    assert len(data["roles"]) > 0 