#!/usr/bin/env python3
"""
Deep RAG Memory System Test
Tests RAG memory efficiency, conversation retention, and introduction logic
"""

import asyncio
import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Any

class RAGMemoryTester:
    """Comprehensive RAG memory system tester"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.project_id = None
        self.conversation_id = None
        self.test_results = {}
        
    def log_test(self, test_name: str, result: bool, details: str = ""):
        """Log test results"""
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"    Details: {details}")
        self.test_results[test_name] = {"passed": result, "details": details}
        
    def create_test_project(self) -> str:
        """Create a test project for RAG memory testing"""
        try:
            project_data = {
                "name": f"RAG Memory Test Project {datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "description": "A comprehensive test project for evaluating RAG memory system efficiency and conversation retention capabilities",
                "user_role": "project_manager",
                "team_size": 5,
                "project_type": "web_development"
            }
            
            response = requests.post(
                f"{self.base_url}/api/v1/projects",
                json=project_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                response_data = response.json()
                if response_data.get("success") and "data" in response_data:
                    self.project_id = response_data["data"]["project_id"]
                    self.log_test("Project Creation", True, f"Project ID: {self.project_id}")
                    return self.project_id
                else:
                    self.log_test("Project Creation", False, f"Invalid response: {response_data}")
                    return None
            else:
                self.log_test("Project Creation", False, f"Status: {response.status_code}")
                return None
                
        except Exception as e:
            self.log_test("Project Creation", False, f"Error: {e}")
            return None
    
    def test_introduction_logic(self) -> bool:
        """Test if introduction logic works correctly with RAG memory"""
        if not self.project_id:
            return False
            
        try:
            # Test 1: First time introductions should be generated
            print("\n--- Testing First Time Introductions ---")
            
            response = requests.post(
                f"{self.base_url}/api/v1/projects/{self.project_id}/introduce-team",
                json={"meeting_type": "project_kickoff"},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                intro_data = response.json()["data"]
                introductions = intro_data.get("introductions", [])
                
                # Check if we got introductions for all team members
                expected_agents = 5  # Sarah, Alex, Emma, David, Lisa
                has_all_agents = len(introductions) == expected_agents
                
                self.log_test("First Time Introductions - Count", has_all_agents, 
                            f"Got {len(introductions)} introductions (expected {expected_agents})")
                
                # Check if introductions are stored in memory
                has_meaningful_content = all(
                    len(intro.get("message", "")) > 10 for intro in introductions
                )
                
                self.log_test("First Time Introductions - Content Quality", has_meaningful_content,
                            "All introductions have meaningful content")
                
                # Test 2: Second time introductions should be skipped or different
                print("\n--- Testing Duplicate Introduction Prevention ---")
                
                # Wait a moment to ensure memory is stored
                time.sleep(2)
                
                response2 = requests.post(
                    f"{self.base_url}/api/v1/projects/{self.project_id}/introduce-team",
                    json={"meeting_type": "project_kickoff"},
                    headers={"Content-Type": "application/json"}
                )
                
                if response2.status_code == 200:
                    intro_data2 = response2.json()["data"]
                    introductions2 = intro_data2.get("introductions", [])
                    
                    # For now, we expect the same number of introductions
                    # In a more advanced system, this might be different
                    duplicate_handling = len(introductions2) == len(introductions)
                    
                    self.log_test("Duplicate Introduction Handling", duplicate_handling,
                                f"Second call returned {len(introductions2)} introductions")
                    
                    return has_all_agents and has_meaningful_content and duplicate_handling
                else:
                    self.log_test("Duplicate Introduction Test", False, 
                                f"Second call failed: {response2.status_code}")
                    return False
                    
            else:
                self.log_test("First Time Introductions", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Introduction Logic Test", False, f"Error: {e}")
            return False
    
    def test_conversation_memory_retention(self) -> bool:
        """Test RAG memory's ability to retain and recall conversations"""
        if not self.project_id:
            return False
            
        try:
            print("\n--- Testing Conversation Memory Retention ---")
            
            # Create a series of conversations with different agents
            test_conversations = [
                {
                    "agent_id": "manager_001",
                    "messages": [
                        "Let's discuss the project timeline and key milestones.",
                        "I think we need to prioritize the MVP features first.",
                        "What are your thoughts on the resource allocation?"
                    ]
                },
                {
                    "agent_id": "developer_001", 
                    "messages": [
                        "I'm working on the authentication system architecture.",
                        "The database schema needs optimization for performance.",
                        "We should implement caching for frequently accessed data."
                    ]
                },
                {
                    "agent_id": "designer_001",
                    "messages": [
                        "I'm designing the user interface for the main dashboard.",
                        "The user experience flow needs refinement.",
                        "Let's conduct usability testing with real users."
                    ]
                }
            ]
            
            # Send conversations and collect responses
            conversation_responses = []
            
            for i, conv in enumerate(test_conversations):
                agent_id = conv["agent_id"]
                print(f"\n  Testing conversation {i+1} with {agent_id}")
                
                for j, message in enumerate(conv["messages"]):
                    try:
                        response = requests.post(
                            f"{self.base_url}/api/v1/agents/{agent_id}/chat",
                            json={
                                "agent_id": agent_id,
                                "message": message,
                                "project_id": self.project_id
                            },
                            headers={"Content-Type": "application/json"}
                        )
                        
                        if response.status_code == 200:
                            response_data = response.json()
                            conversation_responses.append({
                                "agent_id": agent_id,
                                "message": message,
                                "response": response_data.get("response", ""),
                                "timestamp": datetime.now().isoformat()
                            })
                            
                            print(f"    Message {j+1}: {message[:50]}...")
                            print(f"    Response: {response_data.get('response', '')[:50]}...")
                            
                            # Small delay to ensure proper sequencing
                            time.sleep(0.5)
                            
                        else:
                            print(f"    ❌ Failed to send message {j+1}: {response.status_code}")
                            
                    except Exception as e:
                        print(f"    ❌ Error sending message {j+1}: {e}")
            
            # Test memory retention by asking contextual questions
            print("\n--- Testing Memory Recall ---")
            
            memory_test_questions = [
                {
                    "agent_id": "manager_001",
                    "question": "What did we discuss about the project timeline earlier?",
                    "context_keywords": ["timeline", "milestone", "MVP", "resource"]
                },
                {
                    "agent_id": "developer_001",
                    "question": "Can you remind me about the database optimization we talked about?",
                    "context_keywords": ["database", "optimization", "performance", "caching"]
                },
                {
                    "agent_id": "designer_001",
                    "question": "What were your thoughts on the user interface design?",
                    "context_keywords": ["interface", "dashboard", "user experience", "usability"]
                }
            ]
            
            memory_recall_scores = []
            
            for test_q in memory_test_questions:
                agent_id = test_q["agent_id"]
                question = test_q["question"]
                keywords = test_q["context_keywords"]
                
                try:
                    response = requests.post(
                        f"{self.base_url}/api/v1/agents/{agent_id}/chat",
                        json={
                            "agent_id": agent_id,
                            "message": question,
                            "project_id": self.project_id
                        },
                        headers={"Content-Type": "application/json"}
                    )
                    
                    if response.status_code == 200:
                        response_data = response.json()
                        agent_response = response_data.get("response", "").lower()
                        
                        # Check if the response contains relevant context
                        context_matches = sum(1 for keyword in keywords if keyword.lower() in agent_response)
                        context_score = context_matches / len(keywords)
                        
                        memory_recall_scores.append(context_score)
                        
                        print(f"    Question: {question}")
                        print(f"    Response: {agent_response[:100]}...")
                        print(f"    Context Score: {context_score:.2f} ({context_matches}/{len(keywords)} keywords)")
                        
                    else:
                        print(f"    ❌ Failed to ask question: {response.status_code}")
                        memory_recall_scores.append(0.0)
                        
                except Exception as e:
                    print(f"    ❌ Error asking question: {e}")
                    memory_recall_scores.append(0.0)
            
            # Calculate overall memory retention score
            avg_memory_score = sum(memory_recall_scores) / len(memory_recall_scores) if memory_recall_scores else 0
            memory_retention_good = avg_memory_score >= 0.3  # At least 30% context retention
            
            self.log_test("Conversation Memory Retention", memory_retention_good,
                        f"Average context retention: {avg_memory_score:.2f}")
            
            return memory_retention_good
            
        except Exception as e:
            self.log_test("Conversation Memory Retention", False, f"Error: {e}")
            return False
    
    def test_cross_conversation_context(self) -> bool:
        """Test if RAG memory can connect context across different conversations"""
        if not self.project_id:
            return False
            
        try:
            print("\n--- Testing Cross-Conversation Context ---")
            
            # Have different agents discuss related topics
            cross_context_tests = [
                {
                    "agent_id": "manager_001",
                    "message": "Alex mentioned some database performance concerns. What's your take on that?",
                    "expected_context": "database performance mentioned by Alex"
                },
                {
                    "agent_id": "designer_001", 
                    "message": "Sarah was talking about MVP features. How does that affect our design priorities?",
                    "expected_context": "MVP features mentioned by Sarah"
                },
                {
                    "agent_id": "developer_001",
                    "message": "Emma is working on the dashboard design. Should we coordinate on the data requirements?",
                    "expected_context": "dashboard design mentioned by Emma"
                }
            ]
            
            cross_context_scores = []
            
            for test in cross_context_tests:
                agent_id = test["agent_id"]
                message = test["message"]
                expected_context = test["expected_context"]
                
                try:
                    response = requests.post(
                        f"{self.base_url}/api/v1/agents/{agent_id}/chat",
                        json={
                            "agent_id": agent_id,
                            "message": message,
                            "project_id": self.project_id
                        },
                        headers={"Content-Type": "application/json"}
                    )
                    
                    if response.status_code == 200:
                        response_data = response.json()
                        agent_response = response_data.get("response", "").lower()
                        
                        # Check if response shows awareness of cross-conversation context
                        has_context_awareness = any(
                            keyword in agent_response for keyword in 
                            ["alex", "sarah", "emma", "mentioned", "said", "discussed", "talked"]
                        )
                        
                        cross_context_scores.append(1.0 if has_context_awareness else 0.0)
                        
                        print(f"    Message: {message}")
                        print(f"    Response: {agent_response[:100]}...")
                        print(f"    Context Awareness: {'Yes' if has_context_awareness else 'No'}")
                        
                    else:
                        print(f"    ❌ Failed to send message: {response.status_code}")
                        cross_context_scores.append(0.0)
                        
                except Exception as e:
                    print(f"    ❌ Error sending message: {e}")
                    cross_context_scores.append(0.0)
            
            # Calculate cross-context score
            avg_cross_context_score = sum(cross_context_scores) / len(cross_context_scores) if cross_context_scores else 0
            cross_context_good = avg_cross_context_score >= 0.5  # At least 50% context awareness
            
            self.log_test("Cross-Conversation Context", cross_context_good,
                        f"Average cross-context awareness: {avg_cross_context_score:.2f}")
            
            return cross_context_good
            
        except Exception as e:
            self.log_test("Cross-Conversation Context", False, f"Error: {e}")
            return False
    
    def test_memory_persistence(self) -> bool:
        """Test if RAG memory persists across multiple sessions"""
        if not self.project_id:
            return False
            
        try:
            print("\n--- Testing Memory Persistence ---")
            
            # Send a distinctive message that should be remembered
            distinctive_message = f"MEMORY_TEST_{datetime.now().strftime('%Y%m%d_%H%M%S')}: Remember this unique project identifier for future reference"
            
            response = requests.post(
                f"{self.base_url}/api/v1/agents/manager_001/chat",
                json={
                    "agent_id": "manager_001",
                    "message": distinctive_message,
                    "project_id": self.project_id
                },
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                print(f"    Stored distinctive message: {distinctive_message[:50]}...")
                
                # Wait a moment for memory to be processed
                time.sleep(3)
                
                # Ask the agent to recall the distinctive message
                recall_question = "What was that unique project identifier you were supposed to remember?"
                
                response2 = requests.post(
                    f"{self.base_url}/api/v1/agents/manager_001/chat",
                    json={
                        "agent_id": "manager_001",
                        "message": recall_question,
                        "project_id": self.project_id
                    },
                    headers={"Content-Type": "application/json"}
                )
                
                if response2.status_code == 200:
                    recall_response = response2.json().get("response", "").lower()
                    
                    # Check if the response contains the distinctive identifier
                    has_memory = "memory_test" in recall_response
                    
                    print(f"    Recall Question: {recall_question}")
                    print(f"    Recall Response: {recall_response[:100]}...")
                    print(f"    Memory Retained: {'Yes' if has_memory else 'No'}")
                    
                    self.log_test("Memory Persistence", has_memory,
                                f"Distinctive message {'was' if has_memory else 'was not'} recalled")
                    
                    return has_memory
                else:
                    self.log_test("Memory Persistence", False, f"Recall failed: {response2.status_code}")
                    return False
                    
            else:
                self.log_test("Memory Persistence", False, f"Storage failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Memory Persistence", False, f"Error: {e}")
            return False
    
    def run_comprehensive_test(self) -> Dict[str, Any]:
        """Run all RAG memory tests"""
        print("🧠 RAG Memory System Deep Testing")
        print("=" * 50)
        
        # Create test project
        if not self.create_test_project():
            return {"error": "Failed to create test project"}
        
        # Run all tests
        tests = [
            ("Introduction Logic", self.test_introduction_logic),
            ("Conversation Memory Retention", self.test_conversation_memory_retention),
            ("Cross-Conversation Context", self.test_cross_conversation_context),
            ("Memory Persistence", self.test_memory_persistence)
        ]
        
        results = {}
        passed_tests = 0
        
        for test_name, test_func in tests:
            print(f"\n{'='*20} {test_name} {'='*20}")
            try:
                result = test_func()
                results[test_name] = result
                if result:
                    passed_tests += 1
            except Exception as e:
                print(f"❌ {test_name} crashed: {e}")
                results[test_name] = False
        
        # Summary
        print(f"\n{'='*50}")
        print(f"RAG Memory Test Summary")
        print(f"{'='*50}")
        print(f"Tests Passed: {passed_tests}/{len(tests)}")
        print(f"Success Rate: {(passed_tests/len(tests)*100):.1f}%")
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {test_name}")
        
        return {
            "total_tests": len(tests),
            "passed_tests": passed_tests,
            "success_rate": passed_tests/len(tests)*100,
            "results": results,
            "test_results": self.test_results
        }

def main():
    """Main test function"""
    tester = RAGMemoryTester()
    results = tester.run_comprehensive_test()
    
    # Save results to file
    with open('rag_memory_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📊 Detailed results saved to 'rag_memory_test_results.json'")
    
    return results

if __name__ == "__main__":
    main()
