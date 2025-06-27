import pytest
from fastapi.testclient import TestClient
from core.api import app

client = TestClient(app)


def test_health_endpoint():
    """Test the health endpoint for health check"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "components" in data


def test_root_endpoint():
    """Test the root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data


def test_get_scenarios():
    """Test getting available scenarios"""
    response = client.get("/api/v1/simulations/scenarios")
    assert response.status_code == 200
    data = response.json()
    assert "scenarios" in data
    assert len(data["scenarios"]) > 0


def test_get_agents():
    """Test getting available agents"""
    response = client.get("/api/v1/agents")
    assert response.status_code == 200
    data = response.json()
    assert "agents" in data
    assert len(data["agents"]) > 0


def test_get_specific_agent():
    """Test getting a specific agent"""
    response = client.get("/api/v1/agents/manager_001")
    assert response.status_code == 200
    data = response.json()
    assert "agent" in data
    assert data["agent"]["name"] == "Sarah Johnson"


def test_artifact_templates():
    """Test getting artifact templates"""
    response = client.get("/api/v1/artifacts/templates")
    assert response.status_code == 200
    data = response.json()
    assert "templates" in data
    assert len(data["templates"]) > 0 