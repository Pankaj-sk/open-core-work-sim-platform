#!/usr/bin/env python3
"""
Advanced Agent Interaction Tests
Tests edge cases, error conditions, and complex scenarios
"""

import pytest
from fastapi.testclient import TestClient
from core.api import app
import time

client = TestClient(app)


class TestAdvancedAgentInteractions:
    """Advanced tests for agent interactions and edge cases"""

    def test_concurrent_chat_sessions(self):
        """Test multiple concurrent chat sessions with different agents"""
        agents = ["manager_001", "developer_001", "client_001", "hr_001"]
        messages = [
            "What are your main responsibilities?",
            "How do you handle difficult situations?",
            "What's your experience with remote work?",
            "Can you describe your communication style?"
        ]
        
        responses = []
        for agent_id in agents:
            for message in messages:
                response = client.post(
                    f"/api/v1/agents/{agent_id}/chat",
                    json={"message": message}
                )
                assert response.status_code == 200
                data = response.json()
                assert "response" in data
                assert data["agent_id"] == agent_id
                assert len(data["response"]) > 0
                responses.append((agent_id, message, data["response"]))
        
        # Verify we got responses from all agents
        agent_responses = {}
        for agent_id, message, response in responses:
            if agent_id not in agent_responses:
                agent_responses[agent_id] = []
            agent_responses[agent_id].append(response)
        
        assert len(agent_responses) == 4  # All 4 agents responded
        for agent_id, agent_responses_list in agent_responses.items():
            assert len(agent_responses_list) == 4  # Each agent responded to all 4 messages

    def test_very_long_message_handling(self):
        """Test handling of very long messages"""
        long_message = "This is a very long message. " * 100  # 3000+ characters
        
        response = client.post(
            "/api/v1/agents/manager_001/chat",
            json={"message": long_message}
        )
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert len(data["response"]) > 0

    def test_special_characters_in_messages(self):
        """Test handling of special characters and unicode"""
        special_messages = [
            "Hello! How are you? 😊",
            "Can you handle émojis and ñoñó?",
            "What about symbols: @#$%^&*()_+-={}[]|\\:;\"'<>?,./",
            "Unicode test: 你好世界 こんにちは नमस्ते",
            "Code: `console.log('Hello World');`",
            "SQL: SELECT * FROM users WHERE id = 1; DROP TABLE users;--"
        ]
        
        for message in special_messages:
            response = client.post(
                "/api/v1/agents/developer_001/chat",
                json={"message": message}
            )
            assert response.status_code == 200
            data = response.json()
            assert "response" in data
            assert len(data["response"]) > 0

    def test_empty_and_null_message_handling(self):
        """Test handling of empty and null messages"""
        test_cases = [
            {"message": ""},
            {"message": "   "},  # Only whitespace
            {"message": "\n\n\n"},  # Only newlines
        ]
        
        for test_case in test_cases:
            response = client.post(
                "/api/v1/agents/manager_001/chat",
                json=test_case
            )
            # Should either return 200 with a response or 400 for invalid input
            assert response.status_code in [200, 400]

    def test_rapid_successive_requests(self):
        """Test rapid successive requests to same agent"""
        agent_id = "developer_001"
        
        responses = []
        for i in range(10):
            response = client.post(
                f"/api/v1/agents/{agent_id}/chat",
                json={"message": f"Quick message {i}"}
            )
            responses.append(response)
        
        # All requests should succeed
        for response in responses:
            assert response.status_code == 200
            data = response.json()
            assert "response" in data
            assert data["agent_id"] == agent_id

    def test_conversation_history_persistence(self):
        """Test that conversation history is properly maintained"""
        agent_id = "client_001"
        
        # Send multiple messages
        messages = [
            "Hello, I'm interested in your services",
            "What packages do you offer?",
            "What about pricing?",
            "Can we schedule a meeting?"
        ]
        
        for message in messages:
            response = client.post(
                f"/api/v1/agents/{agent_id}/chat",
                json={"message": message}
            )
            assert response.status_code == 200
        
        # Get conversation history
        history_response = client.get(f"/api/v1/agents/{agent_id}/history")
        assert history_response.status_code == 200
        
        history_data = history_response.json()
        assert "history" in history_data
        
        # Should have at least the messages we sent
        history = history_data["history"]
        assert len(history) >= len(messages)

    def test_invalid_agent_interactions(self):
        """Test interactions with invalid agent IDs"""
        invalid_agents = [
            "nonexistent_agent",
            "agent_999",
            "invalid-id",
            "null",
            "admin_001",  # Potentially restricted
        ]
        
        for invalid_agent in invalid_agents:
            # Test chat
            response = client.post(
                f"/api/v1/agents/{invalid_agent}/chat",
                json={"message": "Hello"}
            )
            assert response.status_code == 404
            
            # Test get agent
            response = client.get(f"/api/v1/agents/{invalid_agent}")
            assert response.status_code == 404
            
            # Test history
            response = client.get(f"/api/v1/agents/{invalid_agent}/history")
            assert response.status_code == 404
        
        # Test empty agent ID separately (this redirects to agents list)
        response = client.get("/api/v1/agents/")
        # Empty agent ID should either be 404 or redirect to 200 (both acceptable)
        assert response.status_code in [200, 404]

    def test_malformed_request_payloads(self):
        """Test handling of malformed request payloads"""
        agent_id = "manager_001"
        
        malformed_payloads = [
            {},  # Empty payload
            {"msg": "Hello"},  # Wrong field name
            {"message": None},  # Null message
            {"message": 123},  # Non-string message
            {"message": ["Hello"]},  # Array instead of string
            {"message": {"text": "Hello"}},  # Object instead of string
        ]
        
        for payload in malformed_payloads:
            response = client.post(
                f"/api/v1/agents/{agent_id}/chat",
                json=payload
            )
            # Should return 400 or 422 for bad request
            assert response.status_code in [400, 422]

    def test_agent_availability_consistency(self):
        """Test that agent availability is consistent across requests"""
        # Get all agents multiple times
        responses = []
        for _ in range(5):
            response = client.get("/api/v1/agents")
            assert response.status_code == 200
            responses.append(response.json())
        
        # All responses should be identical
        first_response = responses[0]
        for response in responses[1:]:
            assert response == first_response
        
        # All agents should be available
        agents = first_response["agents"]
        for agent in agents:
            assert agent["is_available"] is True
            assert "id" in agent
            assert "name" in agent
            assert "role" in agent

    def test_cross_agent_context_isolation(self):
        """Test that conversations with different agents don't interfere"""
        # Start conversations with two different agents
        manager_msg = "I need help with project management"
        developer_msg = "I need help with coding"
        
        # Send to manager
        manager_response = client.post(
            "/api/v1/agents/manager_001/chat",
            json={"message": manager_msg}
        )
        assert manager_response.status_code == 200
        
        # Send to developer
        developer_response = client.post(
            "/api/v1/agents/developer_001/chat",
            json={"message": developer_msg}
        )
        assert developer_response.status_code == 200
        
        # Get histories - they should be independent
        manager_history = client.get("/api/v1/agents/manager_001/history")
        developer_history = client.get("/api/v1/agents/developer_001/history")
        
        assert manager_history.status_code == 200
        assert developer_history.status_code == 200
        
        # Histories should be different
        manager_data = manager_history.json()["history"]
        developer_data = developer_history.json()["history"]
        
        # Each should contain their respective messages
        manager_messages = [item.get("message", "") for item in manager_data if isinstance(item, dict)]
        developer_messages = [item.get("message", "") for item in developer_data if isinstance(item, dict)]
        
        # The conversations should be independent
        assert manager_messages != developer_messages
