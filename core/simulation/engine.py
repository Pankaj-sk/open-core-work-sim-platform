import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from pydantic import BaseModel


class SimulationConfig(BaseModel):
    scenario_id: str
    participants: List[str]
    duration_minutes: int = 60
    difficulty: str = "medium"


class SimulationState(BaseModel):
    simulation_id: str
    config: SimulationConfig
    status: str  # "running", "paused", "completed", "failed"
    start_time: datetime
    end_time: Optional[datetime] = None
    events: List[Dict] = []
    artifacts: List[str] = []


class SimulationEngine:
    def __init__(self):
        self.active_simulations: Dict[str, SimulationState] = {}
        self.scenarios = self._load_scenarios()
    
    def _load_scenarios(self) -> Dict:
        """Load available simulation scenarios"""
        return {
            "team_meeting": {
                "name": "Team Meeting Simulation",
                "description": "Lead a team meeting with various personalities",
                "duration": 30,
                "difficulty": "easy",
                "roles": ["manager", "developer", "designer"]
            },
            "client_presentation": {
                "name": "Client Presentation",
                "description": "Present a proposal to a challenging client",
                "duration": 45,
                "difficulty": "medium",
                "roles": ["presenter", "client", "technical_lead"]
            },
            "crisis_management": {
                "name": "Crisis Management",
                "description": "Handle a workplace crisis with multiple stakeholders",
                "duration": 60,
                "difficulty": "hard",
                "roles": ["manager", "hr", "legal", "communications"]
            }
        }
    
    def start_simulation(self, config: SimulationConfig) -> str:
        """Start a new simulation"""
        simulation_id = str(uuid.uuid4())
        
        # Validate scenario exists
        if config.scenario_id not in self.scenarios:
            raise ValueError(f"Scenario {config.scenario_id} not found")
        
        # Create simulation state
        simulation_state = SimulationState(
            simulation_id=simulation_id,
            config=config,
            status="running",
            start_time=datetime.now(),
            events=[],
            artifacts=[]
        )
        
        # Store simulation
        self.active_simulations[simulation_id] = simulation_state
        
        # Generate initial events
        self._generate_initial_events(simulation_id)
        
        return simulation_id
    
    def get_simulation_status(self, simulation_id: str) -> str:
        """Get the status of a simulation"""
        if simulation_id not in self.active_simulations:
            raise ValueError(f"Simulation {simulation_id} not found")
        
        return self.active_simulations[simulation_id].status
    
    def end_simulation(self, simulation_id: str) -> Dict:
        """End a simulation and generate results"""
        if simulation_id not in self.active_simulations:
            raise ValueError(f"Simulation {simulation_id} not found")
        
        simulation = self.active_simulations[simulation_id]
        simulation.status = "completed"
        simulation.end_time = datetime.now()
        
        # Generate final artifacts
        artifacts = self._generate_final_artifacts(simulation_id)
        
        result = {
            "simulation_id": simulation_id,
            "duration": (simulation.end_time - simulation.start_time).total_seconds() / 60,
            "events_count": len(simulation.events),
            "artifacts_generated": len(artifacts),
            "status": "completed"
        }
        
        return result
    
    def _generate_initial_events(self, simulation_id: str):
        """Generate initial events for the simulation"""
        simulation = self.active_simulations[simulation_id]
        
        # Add simulation start event
        simulation.events.append({
            "id": str(uuid.uuid4()),
            "type": "simulation_start",
            "timestamp": simulation.start_time.isoformat(),
            "message": f"Simulation {simulation_id} started",
            "participants": simulation.config.participants
        })
    
    def _generate_final_artifacts(self, simulation_id: str) -> List[str]:
        """Generate final artifacts for the simulation"""
        simulation = self.active_simulations[simulation_id]
        
        # Mock artifact generation
        artifacts = [
            f"meeting_minutes_{simulation_id}",
            f"performance_report_{simulation_id}",
            f"action_items_{simulation_id}"
        ]
        
        simulation.artifacts.extend(artifacts)
        return artifacts
    
    def get_simulation_details(self, simulation_id: str) -> SimulationState:
        """Get detailed information about a simulation"""
        if simulation_id not in self.active_simulations:
            raise ValueError(f"Simulation {simulation_id} not found")
        
        return self.active_simulations[simulation_id] 