import pytest
from core.agents.manager import AgentManager
from core.simulation.engine import SimulationEngine, SimulationConfig
from core.events.event_manager import EventManager
from core.artifacts.generator import ArtifactGenerator


class TestAgentManager:
    def setup_method(self):
        self.agent_manager = AgentManager()
    
    def test_get_available_agents(self):
        agents = self.agent_manager.get_available_agents()
        assert len(agents) > 0
        assert all('id' in agent for agent in agents)
        assert all('name' in agent for agent in agents)
    
    def test_get_agent(self):
        agent = self.agent_manager.get_agent("manager_001")
        assert agent.name == "Sarah Johnson"
        assert agent.role == "Team Manager"
    
    def test_chat_with_agent(self):
        response = self.agent_manager.chat_with_agent("manager_001", "Hello")
        assert isinstance(response, str)
        assert len(response) > 0


class TestSimulationEngine:
    def setup_method(self):
        self.engine = SimulationEngine()
    
    def test_load_scenarios(self):
        assert len(self.engine.scenarios) > 0
        assert "team_meeting" in self.engine.scenarios
    
    def test_start_simulation(self):
        config = SimulationConfig(
            scenario_id="team_meeting",
            participants=["manager", "developer"],
            duration_minutes=30
        )
        simulation_id = self.engine.start_simulation(config)
        assert isinstance(simulation_id, str)
        assert len(simulation_id) > 0


class TestEventManager:
    def setup_method(self):
        self.event_manager = EventManager()
    
    def test_emit_event(self):
        event_id = self.event_manager.emit("test_event", {"data": "test"})
        assert isinstance(event_id, str)
        assert len(event_id) > 0
    
    def test_get_events(self):
        self.event_manager.emit("test_event", {"data": "test"})
        events = self.event_manager.get_events()
        assert len(events) > 0


class TestArtifactGenerator:
    def setup_method(self):
        self.generator = ArtifactGenerator()
    
    def test_load_templates(self):
        assert len(self.generator.templates) > 0
        assert "meeting_minutes" in self.generator.templates
    
    def test_generate_artifact(self):
        data = {
            "participants": ["John", "Jane"],
            "agenda": ["Item 1", "Item 2"],
            "decisions": ["Decision 1"],
            "action_items": ["Action 1"]
        }
        artifact = self.generator.generate_artifact("meeting_minutes", data)
        assert artifact.name == "Meeting Minutes"
        assert "title" in artifact.content 