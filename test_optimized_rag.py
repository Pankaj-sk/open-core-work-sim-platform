#!/usr/bin/env python3
"""
Optimized RAG Memory Test - With Rate Limiting and Context Management
Tests enhanced RAG memory system with ChatGPT-like optimizations
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Any
import threading
from concurrent.futures import ThreadPoolExecutor

class OptimizedRAGTester:
    """Optimized RAG memory system tester with rate limiting"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.project_id = None
        self.test_results = {}
        self.conversation_logs = []
        self.rate_limiter = self._init_rate_limiter()
        
    def _init_rate_limiter(self):
        """Initialize rate limiter for API calls"""
        self.request_times = []
        self.max_requests_per_minute = 45  # Conservative limit
        self.lock = threading.Lock()
        return True
        
    def wait_for_rate_limit(self):
        """Wait if rate limit would be exceeded"""
        with self.lock:
            now = time.time()
            # Remove requests older than 1 minute
            self.request_times = [t for t in self.request_times if now - t < 60]
            
            if len(self.request_times) >= self.max_requests_per_minute:
                # Wait for the oldest request to age out
                wait_time = 60 - (now - self.request_times[0]) + 1
                print(f"    Rate limit reached, waiting {wait_time:.1f}s...")
                time.sleep(wait_time)
                # Clean up old requests after waiting
                now = time.time()
                self.request_times = [t for t in self.request_times if now - t < 60]
            
            self.request_times.append(now)
        
    def log_test(self, test_name: str, result: bool, details: str = ""):
        """Log test results"""
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"    Details: {details}")
        self.test_results[test_name] = {"passed": result, "details": details}
        
    def create_test_project(self) -> str:
        """Create a test project for optimized testing"""
        try:
            project_data = {
                "name": f"Optimized RAG Test {datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "description": "Optimized test project for enhanced RAG memory system",
                "user_role": "project_manager",
                "team_size": 5,
                "project_type": "web_development"
            }
            
            self.wait_for_rate_limit()
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
    
    def test_optimized_conversation_flow(self) -> bool:
        """Test optimized conversation flow with rate limiting"""
        if not self.project_id:
            return False
            
        try:
            print("\n--- Testing Optimized Conversation Flow ---")
            
            # Structured conversation scenarios
            conversation_phases = [
                {
                    "phase": "Project Kickoff",
                    "conversations": [
                        ("manager_001", "Let's start our new project planning session."),
                        ("developer_001", "I'll handle the technical architecture planning."),
                        ("designer_001", "I'm excited to work on the user experience design."),
                        ("qa_001", "I'll prepare our quality assurance strategy."),
                        ("analyst_001", "Let me gather the business requirements.")
                    ]
                },
                {
                    "phase": "Technical Discussion", 
                    "conversations": [
                        ("developer_001", "We need to design the database schema carefully."),
                        ("manager_001", "What are the main technical challenges you foresee?"),
                        ("qa_001", "We should consider performance testing early."),
                        ("designer_001", "How will the technical architecture affect the UI?"),
                        ("analyst_001", "The business logic needs to be well-documented.")
                    ]
                },
                {
                    "phase": "Implementation Planning",
                    "conversations": [
                        ("manager_001", "Let's break down the implementation into sprints."),
                        ("developer_001", "I suggest we start with the authentication system."),
                        ("designer_001", "I'll create wireframes for the main user flows."),
                        ("qa_001", "We need comprehensive test cases for each feature."),
                        ("analyst_001", "I'll validate the requirements with stakeholders.")
                    ]
                }
            ]
            
            successful_conversations = 0
            total_conversations = 0
            start_time = time.time()
            
            for phase_data in conversation_phases:
                phase_name = phase_data["phase"]
                conversations = phase_data["conversations"]
                
                print(f"\n  Phase: {phase_name}")
                phase_start = time.time()
                
                for agent_id, message in conversations:
                    try:
                        self.wait_for_rate_limit()  # Rate limiting
                        
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
                            successful_conversations += 1
                            
                            # Log conversation
                            self.conversation_logs.append({
                                "phase": phase_name,
                                "agent_id": agent_id,
                                "message": message,
                                "response": response_data.get("response", ""),
                                "timestamp": datetime.now().isoformat()
                            })
                            
                            print(f"    ✓ {agent_id}: {message[:40]}...")
                        else:
                            print(f"    ✗ {agent_id}: Failed ({response.status_code})")
                        
                        total_conversations += 1
                        
                    except Exception as e:
                        print(f"    ✗ {agent_id}: Error - {e}")
                        total_conversations += 1
                
                phase_time = time.time() - phase_start
                print(f"    Phase completed in {phase_time:.2f}s")
                
                # Brief pause between phases
                time.sleep(1)
            
            total_time = time.time() - start_time
            success_rate = successful_conversations / total_conversations if total_conversations > 0 else 0
            avg_time = total_time / total_conversations if total_conversations > 0 else 0
            
            print(f"\n  Summary:")
            print(f"    Total: {successful_conversations}/{total_conversations} conversations")
            print(f"    Success Rate: {success_rate:.1%}")
            print(f"    Total Time: {total_time:.2f}s")
            print(f"    Average Time: {avg_time:.2f}s per conversation")
            
            # Test passes if good success rate and reasonable timing
            optimized_flow_ok = success_rate >= 0.8 and avg_time <= 10.0
            
            self.log_test("Optimized Conversation Flow", optimized_flow_ok,
                        f"{successful_conversations}/{total_conversations} conversations, {success_rate:.1%} success rate")
            
            return optimized_flow_ok
            
        except Exception as e:
            self.log_test("Optimized Conversation Flow", False, f"Error: {e}")
            return False
    
    def test_context_retention_quality(self) -> bool:
        """Test context retention quality with manageable load"""
        if not self.project_id:
            return False
            
        try:
            print("\n--- Testing Context Retention Quality ---")
            
            # Create contextual conversation
            context_building_messages = [
                ("manager_001", "We're working on a project called 'EcommerceX' - an online shopping platform."),
                ("developer_001", "I'm implementing the user authentication with JWT tokens and Redis sessions."),
                ("designer_001", "I'm designing a mobile-first checkout flow with Apple Pay integration."),
                ("qa_001", "I found a critical bug in the payment processing module yesterday."),
                ("analyst_001", "The client wants to add multi-language support for international markets.")
            ]
            
            # Send context-building messages
            print("\n  Building context...")
            for agent_id, message in context_building_messages:
                try:
                    self.wait_for_rate_limit()
                    
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
                        print(f"    ✓ Context: {message[:50]}...")
                    
                except Exception as e:
                    print(f"    ✗ Context failed: {e}")
            
            # Wait for context processing
            time.sleep(2)
            
            # Test context recall
            context_tests = [
                {
                    "agent_id": "manager_001",
                    "question": "What did the developer mention about user authentication?",
                    "expected_keywords": ["jwt", "tokens", "redis", "authentication", "sessions"]
                },
                {
                    "agent_id": "developer_001", 
                    "question": "What did the designer say about the checkout process?",
                    "expected_keywords": ["checkout", "mobile", "apple pay", "flow", "design"]
                },
                {
                    "agent_id": "designer_001",
                    "question": "What quality issue did the QA engineer find?",
                    "expected_keywords": ["bug", "critical", "payment", "processing", "qa"]
                },
                {
                    "agent_id": "qa_001",
                    "question": "What international feature does the business analyst want?",
                    "expected_keywords": ["multi-language", "international", "markets", "language", "support"]
                }
            ]
            
            print("\n  Testing context recall...")
            context_scores = []
            
            for test in context_tests:
                try:
                    self.wait_for_rate_limit()
                    
                    response = requests.post(
                        f"{self.base_url}/api/v1/agents/{test['agent_id']}/chat",
                        json={
                            "agent_id": test["agent_id"],
                            "message": test["question"],
                            "project_id": self.project_id
                        },
                        headers={"Content-Type": "application/json"}
                    )
                    
                    if response.status_code == 200:
                        response_data = response.json()
                        agent_response = response_data.get("response", "").lower()
                        
                        # Check context retention
                        matched_keywords = sum(1 for keyword in test["expected_keywords"] 
                                             if keyword.lower() in agent_response)
                        context_score = matched_keywords / len(test["expected_keywords"])
                        context_scores.append(context_score)
                        
                        print(f"    ✓ {test['agent_id']}: {context_score:.2f} context score")
                        print(f"      Q: {test['question']}")
                        print(f"      A: {agent_response[:80]}...")
                        
                    else:
                        print(f"    ✗ {test['agent_id']}: Failed ({response.status_code})")
                        context_scores.append(0.0)
                    
                except Exception as e:
                    print(f"    ✗ {test['agent_id']}: Error - {e}")
                    context_scores.append(0.0)
            
            avg_context_score = sum(context_scores) / len(context_scores) if context_scores else 0
            context_retention_good = avg_context_score >= 0.6  # 60% context retention
            
            self.log_test("Context Retention Quality", context_retention_good,
                        f"Average context score: {avg_context_score:.2f}")
            
            return context_retention_good
            
        except Exception as e:
            self.log_test("Context Retention Quality", False, f"Error: {e}")
            return False
    
    def test_response_consistency(self) -> bool:
        """Test response time consistency and reliability"""
        if not self.project_id:
            return False
            
        try:
            print("\n--- Testing Response Consistency ---")
            
            response_times = []
            successful_requests = 0
            
            # Test 10 similar requests to measure consistency
            for i in range(10):
                try:
                    self.wait_for_rate_limit()
                    
                    start_time = time.time()
                    response = requests.post(
                        f"{self.base_url}/api/v1/agents/manager_001/chat",
                        json={
                            "agent_id": "manager_001",
                            "message": f"Test {i+1}: What's the current status of our project?",
                            "project_id": self.project_id
                        },
                        headers={"Content-Type": "application/json"}
                    )
                    end_time = time.time()
                    
                    response_time = end_time - start_time
                    response_times.append(response_time)
                    
                    if response.status_code == 200:
                        successful_requests += 1
                        print(f"    Test {i+1}: {response_time:.2f}s ✓")
                    else:
                        print(f"    Test {i+1}: {response_time:.2f}s ✗ ({response.status_code})")
                    
                except Exception as e:
                    print(f"    Test {i+1}: Error - {e}")
            
            if response_times:
                avg_response_time = sum(response_times) / len(response_times)
                min_response_time = min(response_times)
                max_response_time = max(response_times)
                consistency_ratio = max_response_time / min_response_time if min_response_time > 0 else float('inf')
                
                print(f"\n  Response Time Analysis:")
                print(f"    Average: {avg_response_time:.2f}s")
                print(f"    Range: {min_response_time:.2f}s - {max_response_time:.2f}s")
                print(f"    Consistency Ratio: {consistency_ratio:.2f}")
                print(f"    Success Rate: {successful_requests/10:.1%}")
                
                # Good consistency: ratio < 3.0, avg < 15s, success > 80%
                consistency_good = (consistency_ratio < 3.0 and 
                                  avg_response_time < 15.0 and 
                                  successful_requests >= 8)
                
                self.log_test("Response Consistency", consistency_good,
                            f"Avg: {avg_response_time:.2f}s, Ratio: {consistency_ratio:.2f}, Success: {successful_requests}/10")
                
                return consistency_good
            else:
                self.log_test("Response Consistency", False, "No response times recorded")
                return False
            
        except Exception as e:
            self.log_test("Response Consistency", False, f"Error: {e}")
            return False
    
    def run_optimized_tests(self) -> Dict[str, Any]:
        """Run optimized RAG tests with rate limiting"""
        print("🧠 Optimized RAG Memory System Testing")
        print("=" * 60)
        print("Features: Rate limiting, Context optimization, Smart batching")
        print("=" * 60)
        
        # Create test project
        if not self.create_test_project():
            return {"error": "Failed to create test project"}
        
        # Run optimized tests
        tests = [
            ("Optimized Conversation Flow", self.test_optimized_conversation_flow),
            ("Context Retention Quality", self.test_context_retention_quality),
            ("Response Consistency", self.test_response_consistency)
        ]
        
        results = {}
        passed_tests = 0
        total_start_time = time.time()
        
        for test_name, test_func in tests:
            print(f"\n{'='*20} {test_name} {'='*20}")
            try:
                test_start = time.time()
                result = test_func()
                test_time = time.time() - test_start
                
                results[test_name] = result
                if result:
                    passed_tests += 1
                    
                print(f"Test completed in {test_time:.2f}s")
                
            except Exception as e:
                print(f"❌ {test_name} crashed: {e}")
                results[test_name] = False
        
        total_time = time.time() - total_start_time
        
        # Summary
        print(f"\n{'='*60}")
        print(f"Optimized RAG Memory Test Summary")
        print(f"{'='*60}")
        print(f"Tests Passed: {passed_tests}/{len(tests)}")
        print(f"Success Rate: {(passed_tests/len(tests)*100):.1f}%")
        print(f"Total Time: {total_time:.2f}s")
        print(f"Total Conversations: {len(self.conversation_logs)}")
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {test_name}")
        
        return {
            "total_tests": len(tests),
            "passed_tests": passed_tests,
            "success_rate": passed_tests/len(tests)*100,
            "total_time": total_time,
            "conversation_count": len(self.conversation_logs),
            "results": results,
            "test_results": self.test_results
        }

def main():
    """Main optimized test function"""
    tester = OptimizedRAGTester()
    results = tester.run_optimized_tests()
    
    # Save results to file
    with open('optimized_rag_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📊 Detailed results saved to 'optimized_rag_test_results.json'")
    
    return results

if __name__ == "__main__":
    main()
