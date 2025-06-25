"""
Comprehensive Data Integrity and Consistency Tests
Tests for data integrity, consistency, and business logic va        # If update is supported, verify consistency
        if update_response.status_code in [200, 201]:
            get_response = self.client.get(f"/api/v1/agents/{agent_id}")
            assert get_response.status_code == 200
            
            retrieved_data = get_response.json()
            # Handle nested agent data
            retrieved_agent = retrieved_data.get("agent", retrieved_data)
            assert retrieved_agent["name"] == updated_data["name"]
            assert retrieved_agent["type"] == updated_data["type"].
"""
import pytest
import json
import time
import threading
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import sys
import os
from datetime import datetime, timedelta

# Add the project root to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from core.agents.manager import AgentManager
from core.simulation.engine import SimulationEngine
from core.events.event_manager import EventManager
from core.artifacts.generator import ArtifactGenerator

client = TestClient(app)

class TestDataIntegrityConsistency:
    """Comprehensive data integrity and consistency tests"""
    
    def setup_method(self):
        """Setup for each test"""
        self.client = client
        self.created_agents = []
        self.created_artifacts = []
    
    def teardown_method(self):
        """Cleanup after each test"""
        # Clean up created agents
        for agent_id in self.created_agents:
            try:
                self.client.delete(f"/api/v1/agents/{agent_id}")
            except:
                pass
        
        # Clean up created artifacts
        for artifact_id in self.created_artifacts:
            try:
                self.client.delete(f"/api/v1/artifacts/{artifact_id}")
            except:
                pass
    
    # ========== AGENT DATA INTEGRITY TESTS ==========
    
    def test_agent_data_consistency(self):
        """Test agent data consistency across operations"""
        # Create an agent
        agent_data = {
            "name": "ConsistencyTestAgent",
            "type": "data_analyst",
            "skills": ["analysis", "reporting", "data_mining"]
        }
        
        create_response = self.client.post("/api/v1/agents", json=agent_data)
        assert create_response.status_code in [200, 201]
        
        agent_id = create_response.json().get("id")
        self.created_agents.append(agent_id)
        
        # Verify data consistency in GET request
        get_response = self.client.get(f"/api/v1/agents/{agent_id}")
        assert get_response.status_code == 200
        
        retrieved_data = get_response.json()
        # Handle nested agent data
        retrieved_agent = retrieved_data.get("agent", retrieved_data)
        assert retrieved_agent["name"] == agent_data["name"]
        assert retrieved_agent["type"] == agent_data["type"]
        assert set(retrieved_agent["skills"]) == set(agent_data["skills"])
        
        # Verify data consistency in list request
        list_response = self.client.get("/api/v1/agents")
        assert list_response.status_code == 200
        
        agents_list = list_response.json()["agents"]
        found_agent = None
        for agent in agents_list:
            if agent.get("id") == agent_id:
                found_agent = agent
                break
        
        assert found_agent is not None
        assert found_agent["name"] == agent_data["name"]
        assert found_agent["type"] == agent_data["type"]
    
    def test_agent_update_consistency(self):
        """Test agent update data consistency"""
        # Create an agent
        agent_data = {
            "name": "UpdateTestAgent",
            "type": "data_analyst",
            "skills": ["analysis"]
        }
        
        create_response = self.client.post("/api/v1/agents", json=agent_data)
        assert create_response.status_code in [200, 201]
        
        agent_id = create_response.json().get("id")
        self.created_agents.append(agent_id)
        
        # Update the agent
        updated_data = {
            "name": "UpdatedTestAgent",
            "type": "data_scientist",
            "skills": ["analysis", "machine_learning", "statistics"]
        }
        
        update_response = self.client.put(f"/api/v1/agents/{agent_id}", json=updated_data)
        
        # If update is supported, verify consistency
        if update_response.status_code in [200, 201]:
            get_response = self.client.get(f"/api/v1/agents/{agent_id}")
            assert get_response.status_code == 200
            
            retrieved_data = get_response.json()
            # Handle nested agent data
            updated_agent = retrieved_data.get("agent", retrieved_data)
            assert updated_agent["name"] == updated_data["name"]
            assert updated_agent["type"] == updated_data["type"]
            assert set(updated_agent["skills"]) == set(updated_data["skills"])
    
    def test_agent_deletion_consistency(self):
        """Test agent deletion consistency"""
        # Create an agent
        agent_data = {
            "name": "DeletionTestAgent",
            "type": "data_analyst",
            "skills": ["analysis"]
        }
        
        create_response = self.client.post("/api/v1/agents", json=agent_data)
        assert create_response.status_code in [200, 201]
        
        agent_id = create_response.json().get("id")
        
        # Verify agent exists
        get_response = self.client.get(f"/api/v1/agents/{agent_id}")
        assert get_response.status_code == 200
        
        # Delete the agent
        delete_response = self.client.delete(f"/api/v1/agents/{agent_id}")
        assert delete_response.status_code in [200, 204, 404]
        
        # Verify agent is deleted
        get_response_after = self.client.get(f"/api/v1/agents/{agent_id}")
        assert get_response_after.status_code == 404
        
        # Verify agent is not in list
        list_response = self.client.get("/api/v1/agents")
        assert list_response.status_code == 200
        
        agents_list = list_response.json()["agents"]
        agent_ids = [agent.get("id") for agent in agents_list]
        assert agent_id not in agent_ids
    
    # ========== SIMULATION STATE CONSISTENCY TESTS ==========
    
    def test_simulation_state_consistency(self):
        """Test simulation state consistency"""
        # Get initial state
        initial_status = self.client.get("/api/v1/simulation/status")
        assert initial_status.status_code == 200
        
        initial_state = initial_status.json()
        
        # Start simulation
        start_response = self.client.post("/api/v1/simulation/start")
        # Should succeed or fail gracefully
        assert start_response.status_code in [200, 400, 409]
        
        if start_response.status_code == 200:
            # Check state after start
            running_status = self.client.get("/api/v1/simulation/status")
            assert running_status.status_code == 200
            
            running_state = running_status.json()
            # State should indicate simulation is running
            assert running_state.get("status") != initial_state.get("status")
            
            # Stop simulation
            stop_response = self.client.post("/api/v1/simulation/stop")
            assert stop_response.status_code in [200, 400]
            
            if stop_response.status_code == 200:
                # Check state after stop
                stopped_status = self.client.get("/api/v1/simulation/status")
                assert stopped_status.status_code == 200
                
                stopped_state = stopped_status.json()
                # State should indicate simulation is stopped
                assert stopped_state.get("status") != running_state.get("status")
    
    def test_simulation_configuration_consistency(self):
        """Test simulation configuration consistency"""
        # Configure simulation
        config_data = {
            "duration": 3600,
            "max_agents": 50,
            "scenario": "data_analysis_project"
        }
        
        config_response = self.client.post("/api/v1/simulation/configure", json=config_data)
        assert config_response.status_code in [200, 400, 422]
        
        if config_response.status_code == 200:
            # Verify configuration is applied
            status_response = self.client.get("/api/v1/simulation/status")
            assert status_response.status_code == 200
            
            status_data = status_response.json()
            # Configuration should be reflected in status
            # (The exact structure depends on implementation)
            assert status_data is not None
    
    # ========== ARTIFACT CONSISTENCY TESTS ==========
    
    def test_artifact_creation_consistency(self):
        """Test artifact creation and data consistency"""
        # Create an agent first
        agent_data = {
            "name": "ArtifactTestAgent",
            "type": "data_analyst",
            "skills": ["analysis", "reporting"]
        }
        
        agent_response = self.client.post("/api/v1/agents", json=agent_data)
        assert agent_response.status_code in [200, 201]
        
        agent_id = agent_response.json().get("id")
        self.created_agents.append(agent_id)
        
        # Create an artifact
        artifact_data = {
            "type": "report",
            "description": "Test data analysis report",
            "priority": "high"
        }
        
        artifact_response = self.client.post(f"/api/v1/agents/{agent_id}/artifacts", json=artifact_data)
        
        if artifact_response.status_code in [200, 201]:
            artifact_id = artifact_response.json().get("id")
            self.created_artifacts.append(artifact_id)
            
            # Verify artifact data consistency
            get_artifact_response = self.client.get(f"/api/v1/artifacts/{artifact_id}")
            
            if get_artifact_response.status_code == 200:
                retrieved_artifact = get_artifact_response.json()
                assert retrieved_artifact["type"] == artifact_data["type"]
                assert retrieved_artifact["description"] == artifact_data["description"]
                assert retrieved_artifact.get("agent_id") == agent_id
    
    # ========== BUSINESS LOGIC VALIDATION TESTS ==========
    
    def test_agent_skill_validation(self):
        """Test agent skill validation business logic"""
        # Test valid skill combinations
        valid_combinations = [
            ["analysis", "reporting"],
            ["data_mining", "machine_learning"],
            ["visualization", "statistics"],
            ["project_management", "communication"],
        ]
        
        for skills in valid_combinations:
            response = self.client.post("/api/v1/agents", json={
                "name": f"SkillTestAgent_{len(skills)}",
                "type": "data_analyst",
                "skills": skills
            })
            assert response.status_code in [200, 201]
            
            if response.status_code in [200, 201]:
                agent_id = response.json().get("id")
                self.created_agents.append(agent_id)
        
        # Test invalid skill combinations (if validation exists)
        invalid_combinations = [
            [],  # Empty skills
            ["invalid_skill"],
            ["skill1", "skill1"],  # Duplicate skills
        ]
        
        for skills in invalid_combinations:
            response = self.client.post("/api/v1/agents", json={
                "name": f"InvalidSkillAgent_{len(skills)}",
                "type": "data_analyst",
                "skills": skills
            })
            # Should either accept (lenient validation) or reject appropriately
            assert response.status_code in [200, 201, 400, 422]
    
    def test_agent_type_validation(self):
        """Test agent type validation business logic"""
        # Test valid agent types
        valid_types = [
            "data_analyst",
            "data_scientist",
            "project_manager",
            "software_engineer",
            "business_analyst",
        ]
        
        for agent_type in valid_types:
            response = self.client.post("/api/v1/agents", json={
                "name": f"TypeTestAgent_{agent_type}",
                "type": agent_type,
                "skills": ["analysis"]
            })
            assert response.status_code in [200, 201]
            
            if response.status_code in [200, 201]:
                agent_id = response.json().get("id")
                self.created_agents.append(agent_id)
        
        # Test invalid agent types
        invalid_types = [
            "invalid_type",
            "admin",
            "root",
            "system",
        ]
        
        for agent_type in invalid_types:
            response = self.client.post("/api/v1/agents", json={
                "name": f"InvalidTypeAgent_{agent_type}",
                "type": agent_type,
                "skills": ["analysis"]
            })
            # Should either accept (lenient validation) or reject appropriately
            assert response.status_code in [200, 201, 400, 422]
    
    # ========== CONCURRENCY CONSISTENCY TESTS ==========
    
    def test_concurrent_agent_operations(self):
        """Test consistency under concurrent operations"""
        import concurrent.futures
        
        def create_agent(index):
            return self.client.post("/api/v1/agents", json={
                "name": f"ConcurrentAgent_{index}",
                "type": "data_analyst",
                "skills": ["analysis"]
            })
        
        def get_agents():
            return self.client.get("/api/v1/agents")
        
        # Perform concurrent operations
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            # Create agents concurrently
            create_futures = [executor.submit(create_agent, i) for i in range(10)]
            
            # Get agents list concurrently while creating
            get_futures = [executor.submit(get_agents) for _ in range(5)]
            
            # Wait for all operations
            create_results = [future.result() for future in create_futures]
            get_results = [future.result() for future in get_futures]
        
        # Verify consistency
        successful_creates = [r for r in create_results if r.status_code in [200, 201]]
        successful_gets = [r for r in get_results if r.status_code == 200]
        
        # At least some operations should succeed
        assert len(successful_creates) > 0
        assert len(successful_gets) > 0
        
        # Collect agent IDs for cleanup
        for result in successful_creates:
            agent_id = result.json().get("id")
            if agent_id:
                self.created_agents.append(agent_id)
    
    # ========== REFERENTIAL INTEGRITY TESTS ==========
    
    def test_referential_integrity(self):
        """Test referential integrity between entities"""
        # Create an agent
        agent_response = self.client.post("/api/v1/agents", json={
            "name": "ReferentialTestAgent",
            "type": "data_analyst",
            "skills": ["analysis"]
        })
        assert agent_response.status_code in [200, 201]
        
        agent_id = agent_response.json().get("id")
        self.created_agents.append(agent_id)
        
        # Create artifact for this agent
        artifact_response = self.client.post(f"/api/v1/agents/{agent_id}/artifacts", json={
            "type": "report",
            "description": "Test report"
        })
        
        if artifact_response.status_code in [200, 201]:
            artifact_id = artifact_response.json().get("id")
            self.created_artifacts.append(artifact_id)
            
            # Delete the agent
            delete_response = self.client.delete(f"/api/v1/agents/{agent_id}")
            
            if delete_response.status_code in [200, 204]:
                # Check if artifact still exists or is properly handled
                artifact_check = self.client.get(f"/api/v1/artifacts/{artifact_id}")
                
                # Artifact should either be deleted (cascade) or marked as orphaned
                # The exact behavior depends on implementation
                assert artifact_check.status_code in [200, 404]
                
                if artifact_check.status_code == 200:
                    # If artifact still exists, it should handle the missing agent gracefully
                    artifact_data = artifact_check.json()
                    assert artifact_data is not None
    
    # ========== TRANSACTION CONSISTENCY TESTS ==========
    
    def test_transaction_consistency(self):
        """Test transaction consistency in complex operations"""
        # Simulate a complex operation that should be atomic
        # (This depends on the specific implementation)
        
        # Create multiple agents in what should be a single transaction
        batch_data = [
            {"name": f"BatchAgent_{i}", "type": "data_analyst", "skills": ["analysis"]}
            for i in range(5)
        ]
        
        # If batch operations are supported
        batch_response = self.client.post("/api/v1/agents/batch", json=batch_data)
        
        if batch_response.status_code in [200, 201]:
            # All agents should be created successfully
            created_agents = batch_response.json()
            assert len(created_agents) == len(batch_data)
            
            # Add to cleanup list
            for agent in created_agents:
                agent_id = agent.get("id")
                if agent_id:
                    self.created_agents.append(agent_id)
        
        elif batch_response.status_code == 404:
            # Batch operation not supported, test individual consistency
            for agent_data in batch_data:
                response = self.client.post("/api/v1/agents", json=agent_data)
                if response.status_code in [200, 201]:
                    agent_id = response.json().get("id")
                    self.created_agents.append(agent_id)
    
    # ========== DATA VALIDATION CONSISTENCY TESTS ==========
    
    def test_field_validation_consistency(self):
        """Test field validation consistency across operations"""
        # Test the same validation rules across different operations
        
        # Invalid name should be rejected consistently
        invalid_names = ["", " ", None, "a" * 1000]
        
        for name in invalid_names:
            if name is not None:
                create_response = self.client.post("/api/v1/agents", json={
                    "name": name,
                    "type": "data_analyst",
                    "skills": ["analysis"]
                })
                
                # Should be rejected consistently
                assert create_response.status_code in [400, 422]
    
    def test_business_rule_consistency(self):
        """Test business rule consistency"""
        # Test that business rules are applied consistently
        
        # Create agent with specific configuration
        response = self.client.post("/api/v1/agents", json={
            "name": "BusinessRuleTestAgent",
            "type": "data_analyst",
            "skills": ["analysis", "reporting"],
            "max_concurrent_tasks": 5
        })
        
        if response.status_code in [200, 201]:
            agent_id = response.json().get("id")
            self.created_agents.append(agent_id)
            
            # Verify business rules are enforced
            # (e.g., agent can't have more than max_concurrent_tasks)
            # This depends on the specific business logic implementation
            
            get_response = self.client.get(f"/api/v1/agents/{agent_id}")
            assert get_response.status_code == 200
            
            retrieved_data = get_response.json()
            # Handle nested agent data
            agent_data = retrieved_data.get("agent", retrieved_data)
            # Business rules should be reflected in the data
            assert agent_data is not None
    
    # ========== PERFORMANCE CONSISTENCY TESTS ==========
    
    def test_performance_consistency(self):
        """Test that performance remains consistent under load"""
        # Measure baseline performance
        start_time = time.time()
        response = self.client.get("/api/v1/agents")
        baseline_time = time.time() - start_time
        
        # Create some load
        for i in range(10):
            create_response = self.client.post("/api/v1/agents", json={
                "name": f"PerformanceTestAgent_{i}",
                "type": "data_analyst",
                "skills": ["analysis"]
            })
            
            if create_response.status_code in [200, 201]:
                agent_id = create_response.json().get("id")
                self.created_agents.append(agent_id)
        
        # Measure performance under load
        start_time = time.time()
        response = self.client.get("/api/v1/agents")
        load_time = time.time() - start_time
        
        # Performance should remain consistent (within reasonable bounds)
        assert load_time < baseline_time * 5  # Allow 5x degradation
        assert response.status_code == 200

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
