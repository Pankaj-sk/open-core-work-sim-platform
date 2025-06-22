from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel

from core.agent_manager import AgentManager

router = APIRouter()


class AgentPersona(BaseModel):
    id: str
    name: str
    role: str
    personality: str
    background: str
    skills: List[str]


class AgentResponse(BaseModel):
    agent_id: str
    name: str
    role: str
    is_available: bool


@router.get("/")
async def get_available_agents():
    """Get list of available AI agents"""
    manager = AgentManager()
    agents = manager.get_available_agents()
    return {"agents": agents}


@router.get("/{agent_id}")
async def get_agent_details(agent_id: str):
    """Get detailed information about a specific agent"""
    try:
        manager = AgentManager()
        agent = manager.get_agent(agent_id)
        return agent
    except Exception as e:
        raise HTTPException(status_code=404, detail="Agent not found")


@router.post("/{agent_id}/chat")
async def chat_with_agent(agent_id: str, message: str):
    """Send a message to an AI agent and get response"""
    try:
        manager = AgentManager()
        response = manager.chat_with_agent(agent_id, message)
        return {
            "agent_id": agent_id,
            "message": message,
            "response": response,
            "timestamp": "2024-01-01T12:00:00Z"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/roles")
async def get_available_roles():
    """Get list of available agent roles"""
    roles = [
        {
            "id": "manager",
            "name": "Team Manager",
            "description": "Experienced team leader with strong communication skills",
            "difficulty": "medium"
        },
        {
            "id": "developer",
            "name": "Software Developer",
            "description": "Technical team member with programming expertise",
            "difficulty": "easy"
        },
        {
            "id": "client",
            "name": "Client Representative",
            "description": "External stakeholder with specific requirements",
            "difficulty": "hard"
        },
        {
            "id": "hr",
            "name": "HR Specialist",
            "description": "Human resources professional handling workplace issues",
            "difficulty": "medium"
        }
    ]
    return {"roles": roles} 