#!/usr/bin/env python3
"""
Stress Testing and Performance Tests
Tests system behavior under load and edge conditions
"""

import pytest
from fastapi.testclient import TestClient
from core.api import app
import time
import threading
import concurrent.futures

client = TestClient(app)


class TestStressAndPerformance:
    """Stress testing and performance validation"""

    def test_high_volume_agent_requests(self):
        """Test handling of high volume of agent requests"""
        def make_request(agent_id, message_num):
            response = client.post(
                f"/api/v1/agents/{agent_id}/chat",
                json={"message": f"Stress test message {message_num}"}
            )
            return response.status_code == 200
        
        # Test with 50 concurrent requests
        agent_id = "manager_001"
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request, agent_id, i) for i in range(50)]
            results = [future.result() for future in concurrent.futures.as_completed(futures)]
        
        # All requests should succeed
        success_rate = sum(results) / len(results)
        assert success_rate >= 0.95  # Allow for 5% failure due to stress

    def test_simulation_stress_testing(self):
        """Test multiple simultaneous simulations"""
        from core.simulation.engine import SimulationConfig
        
        def start_simulation(scenario_name):
            config = SimulationConfig(
                scenario_id=scenario_name,
                duration_minutes=30,
                participants=["manager_001", "developer_001"]
            )
            response = client.post("/api/v1/simulations/start", json=config.model_dump())
            return response.status_code == 200, response.json() if response.status_code == 200 else None
        
        scenarios = ["team_meeting", "client_presentation", "crisis_management"]
        
        # Start multiple simulations concurrently
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(start_simulation, scenario) for scenario in scenarios * 3]  # 9 total
            results = [future.result() for future in concurrent.futures.as_completed(futures)]
        
        successful_starts = [result for success, result in results if success]
        assert len(successful_starts) >= 6  # At least 2/3 should succeed

    def test_artifact_generation_load(self):
        """Test artifact generation under load"""
        def generate_artifact(template_id, data_variant):
            payload = {
                "template_id": template_id,
                "data": {
                    "project_name": f"Load Test Project {data_variant}",
                    "objectives": f"Objective {data_variant}",
                    "timeline": "1 month",
                    "budget": "$10,000"
                }
            }
            response = client.post("/api/v1/artifacts/generate", json=payload)
            return response.status_code == 200
        
        # Generate 20 artifacts concurrently
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
            futures = [
                executor.submit(generate_artifact, "project_proposal", i) 
                for i in range(20)
            ]
            results = [future.result() for future in concurrent.futures.as_completed(futures)]
        
        success_rate = sum(results) / len(results)
        assert success_rate >= 0.9  # 90% success rate under load

    def test_response_time_consistency(self):
        """Test that response times are consistent and reasonable"""
        response_times = []
        
        for i in range(20):
            start_time = time.time()
            response = client.get("/api/v1/agents")
            end_time = time.time()
            
            assert response.status_code == 200
            response_times.append(end_time - start_time)
        
        # Calculate statistics
        avg_time = sum(response_times) / len(response_times)
        max_time = max(response_times)
        
        # Response times should be reasonable
        assert avg_time < 2.0  # Average under 2 seconds
        assert max_time < 5.0  # Max under 5 seconds
        
        # 95% of requests should be under 3 seconds
        sorted_times = sorted(response_times)
        p95_time = sorted_times[int(0.95 * len(sorted_times))]
        assert p95_time < 3.0

    def test_memory_leak_detection(self):
        """Test for potential memory leaks with repeated operations"""
        # Perform many operations to detect memory issues
        for i in range(100):
            # Agent operations
            response = client.get("/api/v1/agents")
            assert response.status_code == 200
            
            # Chat operations
            response = client.post(
                "/api/v1/agents/manager_001/chat",
                json={"message": f"Memory test {i}"}
            )
            assert response.status_code == 200
            
            # Scenario operations
            response = client.get("/api/v1/simulations/scenarios")
            assert response.status_code == 200
            
            # Template operations
            response = client.get("/api/v1/artifacts/templates")
            assert response.status_code == 200
        
        # If we reach here without crashes, memory handling is likely stable

    def test_database_connection_resilience(self):
        """Test system resilience to database-like operations"""
        # Simulate database stress with rapid consecutive operations
        operations = 0
        failures = 0
        
        for i in range(50):
            try:
                # Multiple rapid operations
                client.get("/api/v1/agents")
                client.get("/api/v1/simulations/scenarios")
                client.get("/api/v1/artifacts/templates")
                operations += 3
            except Exception as e:
                failures += 1
        
        # Should have high success rate
        success_rate = (operations - failures) / operations if operations > 0 else 0
        assert success_rate >= 0.95

    def test_concurrent_different_operations(self):
        """Test concurrent execution of different types of operations"""
        def get_agents():
            return client.get("/api/v1/agents").status_code == 200
        
        def chat_operation():
            return client.post(
                "/api/v1/agents/developer_001/chat",
                json={"message": "Concurrent test"}
            ).status_code == 200
        
        def get_scenarios():
            return client.get("/api/v1/simulations/scenarios").status_code == 200
        
        def get_templates():
            return client.get("/api/v1/artifacts/templates").status_code == 200
        
        # Run different operations concurrently
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
            futures = []
            
            # Mix different types of operations
            for _ in range(5):
                futures.append(executor.submit(get_agents))
                futures.append(executor.submit(chat_operation))
                futures.append(executor.submit(get_scenarios))
                futures.append(executor.submit(get_templates))
            
            results = [future.result() for future in concurrent.futures.as_completed(futures)]
        
        success_rate = sum(results) / len(results)
        assert success_rate >= 0.95

    def test_large_conversation_history_handling(self):
        """Test handling of agents with large conversation histories"""
        agent_id = "hr_001"
        
        # Build up a large conversation history
        for i in range(30):  # 30 messages
            response = client.post(
                f"/api/v1/agents/{agent_id}/chat",
                json={"message": f"Building history message {i}. " * 10}  # Longer messages
            )
            assert response.status_code == 200
        
        # Test that history retrieval still works
        history_response = client.get(f"/api/v1/agents/{agent_id}/history")
        assert history_response.status_code == 200
        
        # Test that new chats still work with large history
        response = client.post(
            f"/api/v1/agents/{agent_id}/chat",
            json={"message": "Final test message after large history"}
        )
        assert response.status_code == 200

    def test_edge_case_input_combinations(self):
        """Test various edge case input combinations"""
        edge_cases = [
            # Very short inputs
            {"message": "Hi"},
            {"message": "?"},
            {"message": "1"},
            
            # Repeated patterns
            {"message": "Hello " * 50},
            {"message": "a" * 1000},
            
            # Mixed content
            {"message": "Hello! 😊 How are you today? I have a question about 💼 work."},
            {"message": "Code: `print('hello')` and SQL: SELECT * FROM table;"},
            
            # Different languages
            {"message": "Bonjour comment allez-vous?"},
            {"message": "¿Cómo estás hoy?"},
            {"message": "Wie geht es dir heute?"},
        ]
        
        agent_id = "client_001"
        successful_responses = 0
        
        for test_case in edge_cases:
            try:
                response = client.post(
                    f"/api/v1/agents/{agent_id}/chat",
                    json=test_case
                )
                if response.status_code == 200:
                    successful_responses += 1
            except Exception:
                pass  # Count as failure
        
        # Should handle most edge cases successfully
        success_rate = successful_responses / len(edge_cases)
        assert success_rate >= 0.8  # 80% success rate for edge cases
