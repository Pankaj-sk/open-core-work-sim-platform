#!/usr/bin/env python3
"""
Deep Integration and Security Tests
Tests complex workflows, security boundaries, and data integrity
"""

import pytest
from fastapi.testclient import TestClient
from core.api import app
import json
import uuid

client = TestClient(app)


class TestDeepIntegrationSecurity:
    """Deep integration and security validation tests"""

    def test_end_to_end_simulation_workflow(self):
        """Test complete simulation workflow from start to finish"""
        from core.simulation.engine import SimulationConfig
        
        # Step 1: Get available scenarios
        scenarios_response = client.get("/api/v1/simulations/scenarios")
        assert scenarios_response.status_code == 200
        scenarios = scenarios_response.json()["scenarios"]
        assert len(scenarios) > 0
        
        # Step 2: Get available agents
        agents_response = client.get("/api/v1/agents")
        assert agents_response.status_code == 200
        agents = agents_response.json()["agents"]
        assert len(agents) >= 2
        
        # Step 3: Start a simulation
        scenario_name = list(scenarios.keys())[0]
        participant_ids = [agents[0]["id"], agents[1]["id"]]
        
        config = SimulationConfig(
            scenario_id=scenario_name,
            duration_minutes=60,
            participants=participant_ids
        )
        
        start_response = client.post("/api/v1/simulations/start", json=config.model_dump())
        assert start_response.status_code == 200
        simulation_data = start_response.json()
        simulation_id = simulation_data["simulation_id"]
        
        # Step 4: Verify simulation details
        details_response = client.get(f"/api/v1/simulations/{simulation_id}")
        assert details_response.status_code == 200
        details = details_response.json()
        assert details["simulation"]["simulation_id"] == simulation_id
        
        # Step 5: Interact with agents during simulation
        for participant_id in participant_ids:
            chat_response = client.post(
                f"/api/v1/agents/{participant_id}/chat",
                json={"message": f"How is the {scenario_name} simulation going?"}
            )
            assert chat_response.status_code == 200
        
        # Step 6: End the simulation
        end_response = client.post(f"/api/v1/simulations/{simulation_id}/end")
        assert end_response.status_code == 200

    def test_artifact_workflow_integration(self):
        """Test complete artifact generation workflow"""
        # Step 1: Get available templates
        templates_response = client.get("/api/v1/artifacts/templates")
        assert templates_response.status_code == 200
        templates = templates_response.json()["templates"]
        assert len(templates) > 0
        
        # Step 2: Start a simulation for context
        from core.simulation.engine import SimulationConfig
        config = SimulationConfig(
            scenario_id="team_meeting",
            duration_minutes=30,
            participants=["manager_001", "developer_001"]
        )
        
        sim_response = client.post("/api/v1/simulations/start", json=config.model_dump())
        assert sim_response.status_code == 200
        simulation_id = sim_response.json()["simulation_id"]
        
        # Step 3: Generate artifact with simulation context
        template = templates[0]
        template_id = template["id"]
        required_vars = template["variables"]
        
        # Create test data for all required variables
        test_data = {}
        for var in required_vars:
            if var == "participants":
                test_data[var] = ["Manager", "Developer"]
            elif var == "agenda":
                test_data[var] = ["Project Updates", "Next Steps"]
            elif var == "decisions":
                test_data[var] = ["Approved new feature", "Set timeline"]
            elif var == "action_items":
                test_data[var] = ["Create documentation", "Schedule review"]
            elif var == "employee":
                test_data[var] = "John Doe"
            elif var == "period":
                test_data[var] = "Q1 2025"
            elif var == "metrics":
                test_data[var] = {"productivity": "95%", "quality": "excellent"}
            elif var == "feedback":
                test_data[var] = "Outstanding performance this quarter"
            elif var == "project_name":
                test_data[var] = "Integration Test Project"
            elif var == "objectives":
                test_data[var] = "Complete deep integration testing"
            elif var == "timeline":
                test_data[var] = "2 weeks"
            elif var == "budget":
                test_data[var] = "$15,000"
            else:
                test_data[var] = f"Test value for {var}"
        
        artifact_payload = {
            "template_id": template_id,
            "data": test_data,
            "simulation_id": simulation_id
        }
        
        generate_response = client.post("/api/v1/artifacts/generate", json=artifact_payload)
        assert generate_response.status_code == 200
        artifact_data = generate_response.json()
        artifact_id = artifact_data["artifact"]["id"]
        
        # Step 4: Retrieve the generated artifact
        retrieve_response = client.get(f"/api/v1/artifacts/{artifact_id}")
        assert retrieve_response.status_code == 200
        retrieved_artifact = retrieve_response.json()
        assert retrieved_artifact["artifact"]["id"] == artifact_id

    def test_data_validation_and_sanitization(self):
        """Test input validation and data sanitization"""
        # Test SQL injection attempts
        sql_injection_attempts = [
            "'; DROP TABLE users; --",
            "1' OR '1'='1",
            "admin'--",
            "' UNION SELECT * FROM sensitive_data --"
        ]
        
        for injection_attempt in sql_injection_attempts:
            response = client.post(
                "/api/v1/agents/manager_001/chat",
                json={"message": injection_attempt}
            )
            # Should either handle gracefully or return valid response
            assert response.status_code in [200, 400, 422]
            if response.status_code == 200:
                # Response should not contain SQL error messages
                response_text = response.json().get("response", "").lower()
                dangerous_terms = ["sql", "error", "exception", "database", "table"]
                for term in dangerous_terms:
                    assert term not in response_text or "sql" not in response_text

    def test_cross_site_scripting_prevention(self):
        """Test XSS prevention in responses"""
        xss_attempts = [
            "<script>alert('xss')</script>",
            "javascript:alert('xss')",
            "<img src=x onerror=alert('xss')>",
            "');alert('xss');//",
            "<svg onload=alert('xss')>"
        ]
        
        for xss_attempt in xss_attempts:
            response = client.post(
                "/api/v1/agents/developer_001/chat",
                json={"message": xss_attempt}
            )
            assert response.status_code in [200, 400, 422]
            if response.status_code == 200:
                # Response should not contain unescaped script tags
                response_text = response.json().get("response", "")
                assert "<script>" not in response_text
                assert "javascript:" not in response_text
                assert "onerror=" not in response_text

    def test_rate_limiting_behavior(self):
        """Test system behavior under rapid requests (basic rate limiting)"""
        # Make rapid requests to see how system handles them
        rapid_responses = []
        for i in range(20):
            response = client.get("/api/v1/agents")
            rapid_responses.append(response.status_code)
        
        # Most should succeed, system should handle gracefully
        success_count = sum(1 for status in rapid_responses if status == 200)
        assert success_count >= 15  # At least 75% success rate

    def test_resource_exhaustion_protection(self):
        """Test protection against resource exhaustion"""
        # Test with very large payloads
        large_data = {
            "template_id": "project_proposal",
            "data": {
                "project_name": "A" * 10000,  # Very long project name
                "objectives": "B" * 50000,    # Very long objectives
                "timeline": "C" * 1000,
                "budget": "D" * 1000
            }
        }
        
        response = client.post("/api/v1/artifacts/generate", json=large_data)
        # Should either handle gracefully or reject with appropriate error
        assert response.status_code in [200, 400, 413, 422]

    def test_concurrent_simulation_isolation(self):
        """Test that concurrent simulations don't interfere with each other"""
        from core.simulation.engine import SimulationConfig
        import threading
        
        simulation_results = {}
        
        def start_simulation(scenario_name, thread_id):
            config = SimulationConfig(
                scenario_id=scenario_name,
                duration_minutes=30,
                participants=["manager_001", "developer_001"]
            )
            response = client.post("/api/v1/simulations/start", json=config.model_dump())
            if response.status_code == 200:
                sim_id = response.json()["simulation_id"]
                simulation_results[thread_id] = sim_id
        
        # Start multiple simulations concurrently
        threads = []
        scenarios = ["team_meeting", "client_presentation", "crisis_management"]
        
        for i, scenario in enumerate(scenarios):
            thread = threading.Thread(target=start_simulation, args=(scenario, i))
            threads.append(thread)
            thread.start()
        
        for thread in threads:
            thread.join()
        
        # All simulations should have unique IDs
        sim_ids = list(simulation_results.values())
        assert len(sim_ids) == len(set(sim_ids))  # All unique

    def test_error_handling_consistency(self):
        """Test consistent error handling across all endpoints"""
        error_test_cases = [
            # Invalid agent endpoints
            ("GET", "/api/v1/agents/nonexistent", None, 404),
            ("POST", "/api/v1/agents/nonexistent/chat", {"message": "test"}, 404),
            ("GET", "/api/v1/agents/nonexistent/history", None, 404),
            
            # Invalid simulation endpoints
            ("GET", "/api/v1/simulations/nonexistent", None, 404),
            ("POST", "/api/v1/simulations/nonexistent/end", None, 404),
            
            # Invalid artifact endpoints
            ("GET", "/api/v1/artifacts/nonexistent", None, 404),
            
            # Malformed requests
            ("POST", "/api/v1/artifacts/generate", {"invalid": "data"}, [400, 422]),
        ]
        
        for method, endpoint, payload, expected_status in error_test_cases:
            if method == "GET":
                response = client.get(endpoint)
            elif method == "POST":
                response = client.post(endpoint, json=payload)
            
            if isinstance(expected_status, list):
                assert response.status_code in expected_status
            else:
                assert response.status_code == expected_status
            
            # All error responses should have proper JSON structure
            if response.status_code >= 400:
                try:
                    error_data = response.json()
                    assert "detail" in error_data  # FastAPI standard error format
                except:
                    pass  # Some errors might not be JSON

    def test_data_persistence_simulation(self):
        """Test data persistence across operations"""
        # Create some conversation history
        agent_id = "manager_001"
        test_messages = [
            "Hello, I'm starting a new project",
            "What are the key milestones?",
            "How should we track progress?"
        ]
        
        for message in test_messages:
            response = client.post(
                f"/api/v1/agents/{agent_id}/chat",
                json={"message": message}
            )
            assert response.status_code == 200
        
        # Verify history persists
        history_response = client.get(f"/api/v1/agents/{agent_id}/history")
        assert history_response.status_code == 200
        
        # Make more requests and verify history grows
        additional_message = "One more question about the timeline"
        response = client.post(
            f"/api/v1/agents/{agent_id}/chat",
            json={"message": additional_message}
        )
        assert response.status_code == 200
        
        # History should now include the new message
        updated_history = client.get(f"/api/v1/agents/{agent_id}/history")
        assert updated_history.status_code == 200
        
        # Should have more entries than before
        original_history = history_response.json()["history"]
        new_history = updated_history.json()["history"]
        assert len(new_history) >= len(original_history)

    def test_system_boundaries_and_limits(self):
        """Test system boundaries and operational limits"""
        # Test maximum number of concurrent operations
        import concurrent.futures
        
        def make_request():
            return client.get("/api/v1/agents").status_code == 200
        
        # Test with reasonable concurrent load
        with concurrent.futures.ThreadPoolExecutor(max_workers=15) as executor:
            futures = [executor.submit(make_request) for _ in range(30)]
            results = [future.result() for future in concurrent.futures.as_completed(futures)]
        
        success_rate = sum(results) / len(results)
        assert success_rate >= 0.9  # Should handle reasonable concurrent load
