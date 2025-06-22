from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from core.simulation_engine import SimulationEngine
from core.agent_manager import AgentManager

router = APIRouter()


class SimulationConfig(BaseModel):
    scenario_id: str
    participants: List[str]
    duration_minutes: int = 60
    difficulty: str = "medium"


class SimulationResponse(BaseModel):
    simulation_id: str
    status: str
    participants: List[str]
    start_time: datetime
    estimated_end_time: datetime


@router.get("/ping")
async def ping():
    """Health check endpoint for testing the pipeline"""
    return {"status": "ok", "message": "Simulation service is running"}


@router.post("/start", response_model=SimulationResponse)
async def start_simulation(config: SimulationConfig):
    """Start a new simulation with the given configuration"""
    try:
        engine = SimulationEngine()
        simulation_id = engine.start_simulation(config)
        
        return SimulationResponse(
            simulation_id=simulation_id,
            status="running",
            participants=config.participants,
            start_time=datetime.now(),
            estimated_end_time=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{simulation_id}/status")
async def get_simulation_status(simulation_id: str):
    """Get the current status of a simulation"""
    try:
        engine = SimulationEngine()
        status = engine.get_simulation_status(simulation_id)
        return {"simulation_id": simulation_id, "status": status}
    except Exception as e:
        raise HTTPException(status_code=404, detail="Simulation not found")


@router.get("/scenarios")
async def get_available_scenarios():
    """Get list of available simulation scenarios"""
    scenarios = [
        {
            "id": "team_meeting",
            "name": "Team Meeting Simulation",
            "description": "Practice leading a team meeting with various personalities",
            "duration": 30,
            "difficulty": "easy"
        },
        {
            "id": "client_presentation",
            "name": "Client Presentation",
            "description": "Present a proposal to a challenging client",
            "duration": 45,
            "difficulty": "medium"
        },
        {
            "id": "crisis_management",
            "name": "Crisis Management",
            "description": "Handle a workplace crisis with multiple stakeholders",
            "duration": 60,
            "difficulty": "hard"
        }
    ]
    return {"scenarios": scenarios}


@router.post("/{simulation_id}/end")
async def end_simulation(simulation_id: str):
    """End a running simulation"""
    try:
        engine = SimulationEngine()
        result = engine.end_simulation(simulation_id)
        return {"simulation_id": simulation_id, "status": "ended", "result": result}
    except Exception as e:
        raise HTTPException(status_code=404, detail="Simulation not found") 