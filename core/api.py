from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Optional
import uvicorn

from .config import settings
from .agents.manager import AgentManager
from .simulation.engine import SimulationEngine, SimulationConfig
from .events.event_manager import event_manager
from .artifacts.generator import artifact_generator


# Initialize FastAPI app
app = FastAPI(
    title=settings.project_name,
    version="1.0.0",
    description="AI-powered work simulation platform"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize core components
agent_manager = AgentManager()
simulation_engine = SimulationEngine()


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Work Simulation Platform API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "components": ["agents", "simulation", "events", "artifacts"]}


# Agent endpoints
@app.get("/api/v1/agents")
async def get_agents():
    """Get all available agents"""
    return {"agents": agent_manager.get_available_agents()}


@app.get("/api/v1/agents/{agent_id}")
async def get_agent(agent_id: str):
    """Get specific agent details"""
    try:
        agent = agent_manager.get_agent(agent_id)
        return {"agent": agent.dict()}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/v1/agents/{agent_id}/chat")
async def chat_with_agent(agent_id: str, message: Dict[str, str]):
    """Chat with an agent"""
    try:
        response = agent_manager.chat_with_agent(agent_id, message["message"])
        return {"response": response, "agent_id": agent_id}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/api/v1/agents/{agent_id}/history")
async def get_chat_history(agent_id: str):
    """Get chat history with an agent"""
    try:
        history = agent_manager.get_conversation_history(agent_id)
        return {"history": history}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# Simulation endpoints
@app.get("/api/v1/simulations/scenarios")
async def get_scenarios():
    """Get available simulation scenarios"""
    return {"scenarios": simulation_engine.scenarios}


@app.post("/api/v1/simulations/start")
async def start_simulation(config: SimulationConfig):
    """Start a new simulation"""
    try:
        simulation_id = simulation_engine.start_simulation(config)
        return {"simulation_id": simulation_id, "status": "started"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/v1/simulations/{simulation_id}")
async def get_simulation(simulation_id: str):
    """Get simulation details"""
    try:
        simulation = simulation_engine.get_simulation_details(simulation_id)
        return {"simulation": simulation.dict()}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/v1/simulations/{simulation_id}/end")
async def end_simulation(simulation_id: str):
    """End a simulation"""
    try:
        result = simulation_engine.end_simulation(simulation_id)
        return {"result": result}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# Artifact endpoints
@app.get("/api/v1/artifacts/templates")
async def get_artifact_templates():
    """Get available artifact templates"""
    return {"templates": artifact_generator.get_available_templates()}


@app.post("/api/v1/artifacts/generate")
async def generate_artifact(request: Dict):
    """Generate an artifact"""
    try:
        template_id = request["template_id"]
        data = request["data"]
        simulation_id = request.get("simulation_id")
        
        artifact = artifact_generator.generate_artifact(template_id, data, simulation_id)
        return {"artifact": artifact.dict()}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/v1/artifacts/{artifact_id}")
async def get_artifact(artifact_id: str):
    """Get a specific artifact"""
    artifact = artifact_generator.get_artifact(artifact_id)
    if not artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")
    return {"artifact": artifact.dict()}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 