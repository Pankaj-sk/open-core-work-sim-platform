from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class ArtifactRequest(BaseModel):
    simulation_id: str
    artifact_type: str
    content: dict


class ArtifactResponse(BaseModel):
    artifact_id: str
    simulation_id: str
    artifact_type: str
    content: dict
    created_at: datetime
    status: str


@router.get("/")
async def get_artifacts(simulation_id: Optional[str] = None):
    """Get all artifacts or filter by simulation ID"""
    # Mock data for now
    artifacts = [
        {
            "artifact_id": "art_001",
            "simulation_id": "sim_001",
            "artifact_type": "meeting_minutes",
            "content": {
                "title": "Team Meeting Minutes",
                "participants": ["John", "Sarah", "Mike"],
                "action_items": ["Complete project proposal", "Schedule client meeting"]
            },
            "created_at": "2024-01-01T12:00:00Z",
            "status": "completed"
        }
    ]
    
    if simulation_id:
        artifacts = [a for a in artifacts if a["simulation_id"] == simulation_id]
    
    return {"artifacts": artifacts}


@router.post("/generate", response_model=ArtifactResponse)
async def generate_artifact(request: ArtifactRequest):
    """Generate a new artifact based on simulation data"""
    try:
        # Mock artifact generation
        artifact_id = f"art_{len(request.content)}"
        
        return ArtifactResponse(
            artifact_id=artifact_id,
            simulation_id=request.simulation_id,
            artifact_type=request.artifact_type,
            content=request.content,
            created_at=datetime.now(),
            status="generated"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/types")
async def get_artifact_types():
    """Get available artifact types"""
    types = [
        {
            "id": "meeting_minutes",
            "name": "Meeting Minutes",
            "description": "Automated meeting summary with action items"
        },
        {
            "id": "project_report",
            "name": "Project Report",
            "description": "Comprehensive project status report"
        },
        {
            "id": "performance_review",
            "name": "Performance Review",
            "description": "Individual performance assessment"
        },
        {
            "id": "client_proposal",
            "name": "Client Proposal",
            "description": "Professional client proposal document"
        }
    ]
    return {"artifact_types": types}


@router.get("/{artifact_id}")
async def get_artifact(artifact_id: str):
    """Get a specific artifact by ID"""
    # Mock data
    artifact = {
        "artifact_id": artifact_id,
        "simulation_id": "sim_001",
        "artifact_type": "meeting_minutes",
        "content": {
            "title": "Team Meeting Minutes",
            "participants": ["John", "Sarah", "Mike"],
            "action_items": ["Complete project proposal", "Schedule client meeting"]
        },
        "created_at": "2024-01-01T12:00:00Z",
        "status": "completed"
    }
    
    return artifact 