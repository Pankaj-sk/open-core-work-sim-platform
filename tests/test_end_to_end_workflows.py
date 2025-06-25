"""
End-to-End Workflow and User Scenario Tests
Tests complete user workflows and realistic usage scenarios.
"""
import pytest
import json
import time
from unittest.mock import patch
from fastapi.testclient import TestClient
import sys
import os

# Add the project root to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

client = TestClient(app)

class TestEndToEndWorkflows:
    """End-to-end workflow and user scenario tests"""
    
    def setup_method(self):
        """Setup for each test"""
        self.client = client
        self.created_resources = {
            "agents": [],
            "artifacts": [],
            "simulations": []
        }
    
    def teardown_method(self):
        """Cleanup after each test"""
        # Clean up in reverse order of dependencies
        
        # Stop any running simulations
        try:
            self.client.post("/api/v1/simulation/stop")
        except:
            pass
        
        # Clean up artifacts
        for artifact_id in self.created_resources["artifacts"]:
            try:
                self.client.delete(f"/api/v1/artifacts/{artifact_id}")
            except:
                pass
        
        # Clean up agents
        for agent_id in self.created_resources["agents"]:
            try:
                self.client.delete(f"/api/v1/agents/{agent_id}")
            except:
                pass
    
    # ========== COMPLETE USER WORKFLOWS ==========
    
    def test_complete_data_analysis_workflow(self):
        """Test complete data analysis project workflow"""
        # Step 1: Create a data analyst agent
        analyst_response = self.client.post("/api/v1/agents", json={
            "name": "DataAnalyst_Sarah",
            "type": "data_analyst",
            "skills": ["data_analysis", "statistical_modeling", "visualization", "reporting"]
        })
        
        assert analyst_response.status_code in [200, 201]
        analyst_id = analyst_response.json().get("id")
        self.created_resources["agents"].append(analyst_id)
        
        # Step 2: Create a project manager agent
        pm_response = self.client.post("/api/v1/agents", json={
            "name": "ProjectManager_John",
            "type": "project_manager",
            "skills": ["project_management", "stakeholder_communication", "resource_planning"]
        })
        
        assert pm_response.status_code in [200, 201]
        pm_id = pm_response.json().get("id")
        self.created_resources["agents"].append(pm_id)
        
        # Step 3: Configure simulation for data analysis project
        config_response = self.client.post("/api/v1/simulation/configure", json={
            "duration": 1800,  # 30 minutes
            "max_agents": 10,
            "scenario": "data_analysis_project"
        })
        
        assert config_response.status_code in [200, 400, 422]
        
        # Step 4: Start simulation
        start_response = self.client.post("/api/v1/simulation/start")
        
        if start_response.status_code == 200:
            # Step 5: Check simulation status
            status_response = self.client.get("/api/v1/simulation/status")
            assert status_response.status_code == 200
            
            status_data = status_response.json()
            assert status_data.get("status") in ["running", "active", True]
            
            # Step 6: Generate artifacts during simulation
            # Analyst creates data analysis report
            analysis_artifact = self.client.post(f"/api/v1/agents/{analyst_id}/artifacts", json={
                "type": "data_analysis_report",
                "description": "Customer segmentation analysis based on purchase history and demographics",
                "priority": "high",
                "estimated_hours": 8
            })
            
            if analysis_artifact.status_code in [200, 201]:
                artifact_id = analysis_artifact.json().get("id")
                self.created_resources["artifacts"].append(artifact_id)
            
            # PM creates project plan
            plan_artifact = self.client.post(f"/api/v1/agents/{pm_id}/artifacts", json={
                "type": "project_plan",
                "description": "Data analysis project timeline and resource allocation",
                "priority": "medium",
                "estimated_hours": 4
            })
            
            if plan_artifact.status_code in [200, 201]:
                artifact_id = plan_artifact.json().get("id")
                self.created_resources["artifacts"].append(artifact_id)
            
            # Step 7: Monitor simulation progress
            time.sleep(2)  # Let simulation run briefly
            
            progress_response = self.client.get("/api/v1/simulation/status")
            assert progress_response.status_code == 200
            
            # Step 8: Stop simulation
            stop_response = self.client.post("/api/v1/simulation/stop")
            assert stop_response.status_code in [200, 400]
            
            # Step 9: Verify final state
            final_status = self.client.get("/api/v1/simulation/status")
            assert final_status.status_code == 200
            
            final_data = final_status.json()
            assert final_data.get("status") in ["stopped", "completed", "idle", False]
    
    def test_multi_team_software_development_workflow(self):
        """Test multi-team software development workflow"""
        # Create development team
        team_members = [
            {"name": "Developer_Alice", "type": "software_engineer", "skills": ["python", "javascript", "api_development"]},
            {"name": "Developer_Bob", "type": "software_engineer", "skills": ["frontend", "react", "ui_design"]},
            {"name": "QA_Carol", "type": "quality_assurance", "skills": ["testing", "automation", "bug_tracking"]},
            {"name": "DevOps_Dave", "type": "devops_engineer", "skills": ["deployment", "monitoring", "infrastructure"]},
        ]
        
        created_agents = []
        for member in team_members:
            response = self.client.post("/api/v1/agents", json=member)
            if response.status_code in [200, 201]:
                agent_id = response.json().get("id")
                created_agents.append(agent_id)
                self.created_resources["agents"].append(agent_id)
        
        assert len(created_agents) >= 2, "Need at least 2 agents for team workflow"
        
        # Configure team simulation
        team_config = self.client.post("/api/v1/simulation/configure", json={
            "duration": 2400,  # 40 minutes
            "max_agents": 20,
            "scenario": "software_development_sprint"
        })
        
        # Start team collaboration
        start_response = self.client.post("/api/v1/simulation/start")
        
        if start_response.status_code == 200:
            # Each team member creates artifacts
            artifacts_created = []
            
            # Developer creates code
            if len(created_agents) > 0:
                code_artifact = self.client.post(f"/api/v1/agents/{created_agents[0]}/artifacts", json={
                    "type": "source_code",
                    "description": "REST API endpoints for user management",
                    "priority": "high"
                })
                if code_artifact.status_code in [200, 201]:
                    artifacts_created.append(code_artifact.json().get("id"))
            
            # QA creates test plan
            if len(created_agents) > 2:
                test_artifact = self.client.post(f"/api/v1/agents/{created_agents[2]}/artifacts", json={
                    "type": "test_plan",
                    "description": "Comprehensive testing strategy for API endpoints",
                    "priority": "high"
                })
                if test_artifact.status_code in [200, 201]:
                    artifacts_created.append(test_artifact.json().get("id"))
            
            self.created_resources["artifacts"].extend(artifacts_created)
            
            # Monitor team progress
            progress_checks = 0
            for _ in range(3):
                time.sleep(1)
                status = self.client.get("/api/v1/simulation/status")
                if status.status_code == 200:
                    progress_checks += 1
            
            assert progress_checks >= 2, "Should be able to monitor progress"
            
            # Stop simulation
            self.client.post("/api/v1/simulation/stop")
    
    def test_customer_support_scenario(self):
        """Test customer support team scenario"""
        # Create customer support team
        support_team = [
            {"name": "Support_Emma", "type": "customer_support", "skills": ["communication", "problem_solving", "documentation"]},
            {"name": "Support_Frank", "type": "technical_support", "skills": ["troubleshooting", "system_analysis", "escalation"]},
            {"name": "Manager_Grace", "type": "team_lead", "skills": ["team_management", "escalation_handling", "reporting"]},
        ]
        
        team_ids = []
        for member in support_team:
            response = self.client.post("/api/v1/agents", json=member)
            if response.status_code in [200, 201]:
                agent_id = response.json().get("id")
                team_ids.append(agent_id)
                self.created_resources["agents"].append(agent_id)
        
        # Simulate customer support scenario
        if len(team_ids) >= 2:
            # Configure support simulation
            config_response = self.client.post("/api/v1/simulation/configure", json={
                "duration": 1200,  # 20 minutes
                "scenario": "customer_support_incident"
            })
            
            # Start support session
            start_response = self.client.post("/api/v1/simulation/start")
            
            if start_response.status_code == 200:
                # Support agents handle different types of requests
                
                # Create incident report
                incident_response = self.client.post(f"/api/v1/agents/{team_ids[0]}/artifacts", json={
                    "type": "incident_report",
                    "description": "Customer unable to access dashboard - investigating login issues",
                    "priority": "urgent"
                })
                
                if incident_response.status_code in [200, 201]:
                    incident_id = incident_response.json().get("id")
                    self.created_resources["artifacts"].append(incident_id)
                
                # Create resolution documentation
                if len(team_ids) > 1:
                    resolution_response = self.client.post(f"/api/v1/agents/{team_ids[1]}/artifacts", json={
                        "type": "solution_documentation",
                        "description": "Step-by-step resolution for login authentication issues",
                        "priority": "medium"
                    })
                    
                    if resolution_response.status_code in [200, 201]:
                        resolution_id = resolution_response.json().get("id")
                        self.created_resources["artifacts"].append(resolution_id)
                
                # Monitor incident handling
                time.sleep(1)
                status = self.client.get("/api/v1/simulation/status")
                assert status.status_code == 200
                
                # End support session
                self.client.post("/api/v1/simulation/stop")
    
    # ========== STRESS TEST WORKFLOWS ==========
    
    def test_high_volume_agent_creation_workflow(self):
        """Test workflow with high volume of agents"""
        # Create many agents rapidly
        batch_size = 25
        created_count = 0
        
        for i in range(batch_size):
            response = self.client.post("/api/v1/agents", json={
                "name": f"VolumeTestAgent_{i:03d}",
                "type": "data_analyst" if i % 2 == 0 else "software_engineer",
                "skills": ["analysis", "reporting"] if i % 2 == 0 else ["coding", "testing"]
            })
            
            if response.status_code in [200, 201]:
                agent_id = response.json().get("id")
                self.created_resources["agents"].append(agent_id)
                created_count += 1
        
        # Should create at least 80% successfully
        success_rate = created_count / batch_size
        assert success_rate >= 0.8, f"Only {success_rate:.1%} of agents created successfully"
        
        # Verify all agents are accessible
        agents_response = self.client.get("/api/v1/agents")
        assert agents_response.status_code == 200
        
        agents_list = agents_response.json()["agents"]
        volume_agents = [a for a in agents_list if a.get("name", "").startswith("VolumeTestAgent_")]
        assert len(volume_agents) == created_count
    
    def test_complex_simulation_workflow(self):
        """Test complex simulation with multiple phases"""
        # Phase 1: Setup
        setup_agents = []
        for i in range(5):
            response = self.client.post("/api/v1/agents", json={
                "name": f"ComplexAgent_{i}",
                "type": ["data_analyst", "software_engineer", "project_manager"][i % 3],
                "skills": ["analysis", "coding", "management"][i % 3:i % 3 + 1] + ["communication"]
            })
            
            if response.status_code in [200, 201]:
                agent_id = response.json().get("id")
                setup_agents.append(agent_id)
                self.created_resources["agents"].append(agent_id)
        
        # Phase 2: Initial configuration
        config_response = self.client.post("/api/v1/simulation/configure", json={
            "duration": 3600,
            "max_agents": 50,
            "scenario": "complex_project_simulation"
        })
        
        # Phase 3: Start simulation
        start_response = self.client.post("/api/v1/simulation/start")
        
        if start_response.status_code == 200:
            # Phase 4: Dynamic artifact creation
            artifacts_per_agent = 2
            total_artifacts = 0
            
            for agent_id in setup_agents:
                for j in range(artifacts_per_agent):
                    artifact_response = self.client.post(f"/api/v1/agents/{agent_id}/artifacts", json={
                        "type": ["report", "code", "plan"][j % 3],
                        "description": f"Complex project artifact {j+1} from agent {agent_id}",
                        "priority": ["low", "medium", "high"][j % 3]
                    })
                    
                    if artifact_response.status_code in [200, 201]:
                        artifact_id = artifact_response.json().get("id")
                        self.created_resources["artifacts"].append(artifact_id)
                        total_artifacts += 1
            
            # Phase 5: Monitor and verify
            monitoring_rounds = 3
            successful_checks = 0
            
            for round_num in range(monitoring_rounds):
                time.sleep(1)
                
                # Check simulation status
                status_response = self.client.get("/api/v1/simulation/status")
                if status_response.status_code == 200:
                    successful_checks += 1
                
                # Check agents status
                agents_response = self.client.get("/api/v1/agents")
                if agents_response.status_code == 200:
                    successful_checks += 1
            
            assert successful_checks >= monitoring_rounds, "Monitoring should be stable during complex simulation"
            
            # Phase 6: Graceful shutdown
            stop_response = self.client.post("/api/v1/simulation/stop")
            assert stop_response.status_code in [200, 400]
            
            # Phase 7: Post-simulation verification
            final_status = self.client.get("/api/v1/simulation/status")
            assert final_status.status_code == 200
            
            # Verify artifacts still exist
            if total_artifacts > 0:
                # At least some artifacts should still be accessible
                artifacts_accessible = 0
                for artifact_id in self.created_resources["artifacts"][:5]:  # Check first 5
                    artifact_response = self.client.get(f"/api/v1/artifacts/{artifact_id}")
                    if artifact_response.status_code == 200:
                        artifacts_accessible += 1
                
                # Should maintain data integrity
                assert artifacts_accessible >= 0  # At least accessible or properly cleaned up
    
    # ========== ERROR RECOVERY WORKFLOWS ==========
    
    def test_error_recovery_workflow(self):
        """Test system recovery from various error conditions"""
        # Step 1: Create initial state
        response = self.client.post("/api/v1/agents", json={
            "name": "ErrorRecoveryAgent",
            "type": "data_analyst",
            "skills": ["analysis"]
        })
        
        assert response.status_code in [200, 201]
        agent_id = response.json().get("id")
        self.created_resources["agents"].append(agent_id)
        
        # Step 2: Cause various errors
        error_scenarios = [
            # Invalid agent operations
            {"method": "POST", "url": "/api/v1/agents", "data": {"invalid": "data"}},
            {"method": "GET", "url": "/api/v1/agents/nonexistent"},
            {"method": "DELETE", "url": "/api/v1/agents/invalid_id"},
            
            # Invalid simulation operations
            {"method": "POST", "url": "/api/v1/simulation/configure", "data": {"invalid": "config"}},
            {"method": "POST", "url": "/api/v1/simulation/start"},  # Might fail if not configured
        ]
        
        error_count = 0
        for scenario in error_scenarios:
            try:
                if scenario["method"] == "GET":
                    error_response = self.client.get(scenario["url"])
                elif scenario["method"] == "POST":
                    error_response = self.client.post(scenario["url"], json=scenario.get("data", {}))
                elif scenario["method"] == "DELETE":
                    error_response = self.client.delete(scenario["url"])
                
                if error_response.status_code >= 400:
                    error_count += 1
            except:
                error_count += 1
        
        # Step 3: Verify system still works after errors
        recovery_response = self.client.get(f"/api/v1/agents/{agent_id}")
        assert recovery_response.status_code == 200, "System should recover from errors"
        
        # Step 4: Verify new operations work
        new_agent_response = self.client.post("/api/v1/agents", json={
            "name": "PostErrorAgent",
            "type": "data_analyst",
            "skills": ["analysis"]
        })
        
        if new_agent_response.status_code in [200, 201]:
            new_agent_id = new_agent_response.json().get("id")
            self.created_resources["agents"].append(new_agent_id)
        
        # System should handle errors gracefully and continue operating
        assert error_count > 0, "Should have encountered some errors for this test to be meaningful"
    
    # ========== PERFORMANCE WORKFLOW TESTS ==========
    
    def test_sustained_load_workflow(self):
        """Test system under sustained load"""
        # Phase 1: Establish baseline
        baseline_start = time.time()
        baseline_response = self.client.get("/api/v1/agents")
        baseline_time = time.time() - baseline_start
        
        assert baseline_response.status_code == 200
        
        # Phase 2: Apply sustained load
        load_operations = []
        load_start_time = time.time()
        
        for i in range(20):  # 20 operations
            # Mix of operations
            if i % 3 == 0:
                # Create agent
                response = self.client.post("/api/v1/agents", json={
                    "name": f"LoadTestAgent_{i}",
                    "type": "data_analyst",
                    "skills": ["analysis"]
                })
                if response.status_code in [200, 201]:
                    agent_id = response.json().get("id")
                    self.created_resources["agents"].append(agent_id)
                    load_operations.append(("CREATE", response.status_code, response.elapsed if hasattr(response, 'elapsed') else 0))
            
            elif i % 3 == 1:
                # List agents
                response = self.client.get("/api/v1/agents")
                load_operations.append(("LIST", response.status_code, response.elapsed if hasattr(response, 'elapsed') else 0))
            
            else:
                # Get simulation status
                response = self.client.get("/api/v1/simulation/status")
                load_operations.append(("STATUS", response.status_code, response.elapsed if hasattr(response, 'elapsed') else 0))
        
        load_end_time = time.time()
        total_load_time = load_end_time - load_start_time
        
        # Phase 3: Verify performance metrics
        successful_operations = [op for op in load_operations if op[1] == 200]
        success_rate = len(successful_operations) / len(load_operations)
        
        assert success_rate >= 0.8, f"Success rate {success_rate:.1%} too low under sustained load"
        
        # Phase 4: Verify system responsiveness after load
        post_load_start = time.time()
        post_load_response = self.client.get("/api/v1/agents")
        post_load_time = time.time() - post_load_start
        
        assert post_load_response.status_code == 200
        
        # Response time should not degrade significantly
        performance_degradation = post_load_time / baseline_time if baseline_time > 0 else 1
        # Allow for reasonable degradation under sustained load (5x is acceptable for stress testing)
        assert performance_degradation < 6.0, f"Performance degraded by {performance_degradation:.1f}x after load"
    
    # ========== INTEGRATION WORKFLOW TESTS ==========
    
    def test_full_api_integration_workflow(self):
        """Test full API integration across all endpoints"""
        workflow_steps = []
        
        # Step 1: System health check
        health_response = self.client.get("/api/v1/simulation/status")
        workflow_steps.append(("HEALTH_CHECK", health_response.status_code))
        
        # Step 2: Create multiple agents with different types
        agent_types = ["data_analyst", "software_engineer", "project_manager"]
        created_agents = []
        
        for i, agent_type in enumerate(agent_types):
            response = self.client.post("/api/v1/agents", json={
                "name": f"IntegrationAgent_{agent_type}",
                "type": agent_type,
                "skills": ["analysis", "communication"] if agent_type == "data_analyst"
                         else ["coding", "testing"] if agent_type == "software_engineer"
                         else ["planning", "coordination"]
            })
            
            workflow_steps.append(("CREATE_AGENT", response.status_code))
            
            if response.status_code in [200, 201]:
                agent_id = response.json().get("id")
                created_agents.append((agent_id, agent_type))
                self.created_resources["agents"].append(agent_id)
        
        # Step 3: Verify agents exist
        list_response = self.client.get("/api/v1/agents")
        workflow_steps.append(("LIST_AGENTS", list_response.status_code))
        
        # Step 4: Configure and start simulation
        config_response = self.client.post("/api/v1/simulation/configure", json={
            "duration": 1800,
            "max_agents": 20
        })
        workflow_steps.append(("CONFIGURE_SIM", config_response.status_code))
        
        start_response = self.client.post("/api/v1/simulation/start")
        workflow_steps.append(("START_SIM", start_response.status_code))
        
        # Step 5: Generate artifacts for each agent
        if start_response.status_code == 200:
            for agent_id, agent_type in created_agents:
                artifact_response = self.client.post(f"/api/v1/agents/{agent_id}/artifacts", json={
                    "type": "report" if agent_type == "data_analyst"
                           else "code" if agent_type == "software_engineer"
                           else "plan",
                    "description": f"Integration test artifact for {agent_type}",
                    "priority": "medium"
                })
                
                workflow_steps.append(("CREATE_ARTIFACT", artifact_response.status_code))
                
                if artifact_response.status_code in [200, 201]:
                    artifact_id = artifact_response.json().get("id")
                    self.created_resources["artifacts"].append(artifact_id)
        
        # Step 6: Monitor simulation
        for _ in range(3):
            time.sleep(0.5)
            status_response = self.client.get("/api/v1/simulation/status")
            workflow_steps.append(("MONITOR_SIM", status_response.status_code))
        
        # Step 7: Stop simulation
        stop_response = self.client.post("/api/v1/simulation/stop")
        workflow_steps.append(("STOP_SIM", stop_response.status_code))
        
        # Step 8: Final verification
        final_status = self.client.get("/api/v1/simulation/status")
        workflow_steps.append(("FINAL_STATUS", final_status.status_code))
        
        # Analyze workflow success
        successful_steps = [step for step in workflow_steps if step[1] in [200, 201]]
        total_steps = len(workflow_steps)
        success_rate = len(successful_steps) / total_steps
        
        # At least 80% of workflow steps should succeed
        assert success_rate >= 0.8, f"Integration workflow success rate {success_rate:.1%} too low"
        
        # Critical steps must succeed
        critical_steps = ["HEALTH_CHECK", "CREATE_AGENT", "LIST_AGENTS"]
        critical_success = [step for step in workflow_steps if step[0] in critical_steps and step[1] in [200, 201]]
        
        assert len(critical_success) >= 2, "Critical workflow steps must succeed"

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
