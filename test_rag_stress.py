#!/usr/bin/env python3
"""
RAG Memory Stress Test - Volume and Efficiency Testing
Tests RAG memory with high volume conversations and complex scenarios
"""

import asyncio
import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any
import threading
from concurrent.futures import ThreadPoolExecutor

class RAGMemoryStressTester:
    """High-volume RAG memory system tester"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.project_id = None
        self.test_results = {}
        self.conversation_logs = []
        
    def log_test(self, test_name: str, result: bool, details: str = ""):
        """Log test results"""
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"    Details: {details}")
        self.test_results[test_name] = {"passed": result, "details": details}
        
    def create_test_project(self) -> str:
        """Create a test project for stress testing"""
        try:
            project_data = {
                "name": f"RAG Stress Test {datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "description": "High-volume stress test project for RAG memory system evaluation",
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
                    
        except Exception as e:
            self.log_test("Project Creation", False, f"Error: {e}")
            return None
    
    def test_high_volume_conversations(self) -> bool:
        """Test RAG memory with high volume of conversations"""
        if not self.project_id:
            return False
            
        try:
            print("\n--- Testing High Volume Conversations ---")
            
            # Create 50 conversations across different agents
            agents = ["manager_001", "developer_001", "designer_001", "qa_001", "analyst_001"]
            
            conversation_scenarios = [
                # Technical discussions
                "Let's discuss the database architecture for the new feature.",
                "I need help with the API endpoint implementation.",
                "The authentication system needs security review.",
                "We should optimize the query performance.",
                "Let's review the caching strategy implementation.",
                
                # Project management
                "What's the status of the current sprint?",
                "We need to adjust the timeline for the deliverables.",
                "Let's coordinate the resource allocation.",
                "The stakeholder meeting is scheduled for tomorrow.",
                "We should review the project milestones.",
                
                # Design discussions
                "The user interface needs accessibility improvements.",
                "Let's finalize the design system components.",
                "The user experience flow requires optimization.",
                "We should conduct user testing sessions.",
                "The visual design needs brand consistency.",
                
                # Quality assurance
                "The test cases need comprehensive coverage.",
                "Let's review the automated testing strategy.",
                "We found critical bugs in the payment module.",
                "The performance testing results are concerning.",
                "We should implement integration testing.",
                
                # Business analysis
                "The requirements need clarification from stakeholders.",
                "Let's analyze the user feedback data.",
                "The business logic needs documentation.",
                "We should validate the acceptance criteria.",
                "The process workflow needs optimization."
            ]
            
            start_time = time.time()
            total_conversations = 0
            successful_conversations = 0
            
            # Send conversations in batches
            for i in range(10):  # 10 rounds of conversations
                batch_start = time.time()
                batch_successful = 0
                
                for j, scenario in enumerate(conversation_scenarios):
                    agent_id = agents[j % len(agents)]
                    conversation_msg = f"Round {i+1}: {scenario}"
                    
                    try:
                        response = requests.post(
                            f"{self.base_url}/api/v1/agents/{agent_id}/chat",
                            json={
                                "agent_id": agent_id,
                                "message": conversation_msg,
                                "project_id": self.project_id
                            },
                            headers={"Content-Type": "application/json"}
                        )
                        
                        if response.status_code == 200:
                            response_data = response.json()
                            batch_successful += 1
                            
                            # Log conversation
                            self.conversation_logs.append({
                                "round": i+1,
                                "agent_id": agent_id,
                                "message": conversation_msg,
                                "response": response_data.get("response", ""),
                                "timestamp": datetime.now().isoformat()
                            })
                            
                        total_conversations += 1
                        
                    except Exception as e:
                        print(f"    Error in conversation {total_conversations}: {e}")
                
                batch_time = time.time() - batch_start
                successful_conversations += batch_successful
                
                print(f"    Batch {i+1}: {batch_successful}/{len(conversation_scenarios)} successful in {batch_time:.2f}s")
                
                # Small delay between batches
                time.sleep(0.5)
            
            total_time = time.time() - start_time
            success_rate = successful_conversations / total_conversations if total_conversations > 0 else 0
            
            print(f"    Total: {successful_conversations}/{total_conversations} conversations in {total_time:.2f}s")
            print(f"    Average: {total_time/total_conversations:.2f}s per conversation")
            print(f"    Success Rate: {success_rate:.1%}")
            
            # Test passes if we have >80% success rate and reasonable performance
            performance_ok = (total_time / total_conversations) < 5.0  # Under 5 seconds per conversation
            high_volume_ok = success_rate > 0.8 and performance_ok
            
            self.log_test("High Volume Conversations", high_volume_ok,
                        f"{successful_conversations}/{total_conversations} conversations, {success_rate:.1%} success rate")
            
            return high_volume_ok
            
        except Exception as e:
            self.log_test("High Volume Conversations", False, f"Error: {e}")
            return False
    
    def test_complex_memory_queries(self) -> bool:
        """Test complex memory queries and contextual understanding"""
        if not self.project_id:
            return False
            
        try:
            print("\n--- Testing Complex Memory Queries ---")
            
            # Test complex queries that require understanding context from multiple conversations
            complex_queries = [
                {
                    "agent_id": "manager_001",
                    "query": "Can you summarize all the technical issues we've discussed across the team?",
                    "context_type": "technical_summary"
                },
                {
                    "agent_id": "developer_001",
                    "query": "What are the common themes in our database and performance discussions?",
                    "context_type": "technical_patterns"
                },
                {
                    "agent_id": "designer_001",
                    "query": "How do the user experience concerns relate to the technical constraints mentioned?",
                    "context_type": "cross_domain_analysis"
                },
                {
                    "agent_id": "qa_001",
                    "query": "What quality issues have been raised across different project areas?",
                    "context_type": "quality_summary"
                },
                {
                    "agent_id": "analyst_001",
                    "query": "What are the recurring business requirements mentioned in our discussions?",
                    "context_type": "business_analysis"
                }
            ]
            
            complex_query_scores = []
            
            for query_test in complex_queries:
                agent_id = query_test["agent_id"]
                query = query_test["query"]
                context_type = query_test["context_type"]
                
                try:
                    response = requests.post(
                        f"{self.base_url}/api/v1/agents/{agent_id}/chat",
                        json={
                            "agent_id": agent_id,
                            "message": query,
                            "project_id": self.project_id
                        },
                        headers={"Content-Type": "application/json"}
                    )
                    
                    if response.status_code == 200:
                        response_data = response.json()
                        agent_response = response_data.get("response", "").lower()
                        
                        # Score based on response complexity and relevance
                        complexity_indicators = [
                            "database", "performance", "testing", "design", "requirements",
                            "architecture", "api", "user", "security", "optimization",
                            "discussed", "mentioned", "team", "issues", "concerns"
                        ]
                        
                        complexity_score = sum(1 for indicator in complexity_indicators if indicator in agent_response)
                        normalized_score = min(complexity_score / 10, 1.0)  # Normalize to 0-1
                        
                        complex_query_scores.append(normalized_score)
                        
                        print(f"    Query: {query}")
                        print(f"    Response Length: {len(agent_response)} chars")
                        print(f"    Complexity Score: {normalized_score:.2f}")
                        print(f"    Response: {agent_response[:100]}...")
                        print()
                        
                    else:
                        print(f"    Failed query: {response.status_code}")
                        complex_query_scores.append(0.0)
                        
                except Exception as e:
                    print(f"    Error in complex query: {e}")
                    complex_query_scores.append(0.0)
            
            avg_complexity_score = sum(complex_query_scores) / len(complex_query_scores) if complex_query_scores else 0
            complex_memory_ok = avg_complexity_score >= 0.4  # At least 40% complexity
            
            self.log_test("Complex Memory Queries", complex_memory_ok,
                        f"Average complexity score: {avg_complexity_score:.2f}")
            
            return complex_memory_ok
            
        except Exception as e:
            self.log_test("Complex Memory Queries", False, f"Error: {e}")
            return False
    
    def test_memory_efficiency_over_time(self) -> bool:
        """Test if memory efficiency degrades over time with volume"""
        if not self.project_id:
            return False
            
        try:
            print("\n--- Testing Memory Efficiency Over Time ---")
            
            # Test response times at different conversation volumes
            response_times = []
            
            for i in range(5):  # Test 5 different time points
                start_time = time.time()
                
                # Send a standard query
                response = requests.post(
                    f"{self.base_url}/api/v1/agents/manager_001/chat",
                    json={
                        "agent_id": "manager_001",
                        "message": f"Time efficiency test {i+1}: What's the current project status?",
                        "project_id": self.project_id
                    },
                    headers={"Content-Type": "application/json"}
                )
                
                end_time = time.time()
                response_time = end_time - start_time
                response_times.append(response_time)
                
                print(f"    Test {i+1}: {response_time:.2f}s response time")
                
                # Add some delay between tests
                time.sleep(1)
            
            # Check if response times are consistent (no significant degradation)
            avg_response_time = sum(response_times) / len(response_times)
            max_response_time = max(response_times)
            min_response_time = min(response_times)
            
            # Efficiency is good if max response time is not more than 3x the minimum
            efficiency_ratio = max_response_time / min_response_time if min_response_time > 0 else float('inf')
            efficiency_ok = efficiency_ratio < 3.0 and avg_response_time < 10.0
            
            print(f"    Average Response Time: {avg_response_time:.2f}s")
            print(f"    Response Time Range: {min_response_time:.2f}s - {max_response_time:.2f}s")
            print(f"    Efficiency Ratio: {efficiency_ratio:.2f}")
            
            self.log_test("Memory Efficiency Over Time", efficiency_ok,
                        f"Avg: {avg_response_time:.2f}s, Ratio: {efficiency_ratio:.2f}")
            
            return efficiency_ok
            
        except Exception as e:
            self.log_test("Memory Efficiency Over Time", False, f"Error: {e}")
            return False
    
    def run_stress_tests(self) -> Dict[str, Any]:
        """Run all stress tests"""
        print("🧠 RAG Memory System Stress Testing")
        print("=" * 60)
        
        # Create test project
        if not self.create_test_project():
            return {"error": "Failed to create test project"}
        
        # Run stress tests
        tests = [
            ("High Volume Conversations", self.test_high_volume_conversations),
            ("Complex Memory Queries", self.test_complex_memory_queries),
            ("Memory Efficiency Over Time", self.test_memory_efficiency_over_time)
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
        print(f"\n{'='*60}")
        print(f"RAG Memory Stress Test Summary")
        print(f"{'='*60}")
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
            "test_results": self.test_results,
            "conversation_count": len(self.conversation_logs)
        }

def main():
    """Main stress test function"""
    tester = RAGMemoryStressTester()
    results = tester.run_stress_tests()
    
    # Save results to file
    with open('rag_stress_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📊 Detailed results saved to 'rag_stress_test_results.json'")
    print(f"📝 Total conversations logged: {results.get('conversation_count', 0)}")
    
    return results

if __name__ == "__main__":
    main()
