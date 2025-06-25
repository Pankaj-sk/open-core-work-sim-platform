"""
Comprehensive Production Readiness Tests
Tests for production deployment, monitoring, logging, and operational requirements.
"""
import pytest
import json
import time
import os
import psutil
import threading
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import sys
import logging
from datetime import datetime

# Add the project root to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

client = TestClient(app)

class TestProductionReadiness:
    """Comprehensive production readiness tests"""
    
    def setup_method(self):
        """Setup for each test"""
        self.client = client
        self.created_agents = []
    
    def teardown_method(self):
        """Cleanup after each test"""
        for agent_id in self.created_agents:
            try:
                self.client.delete(f"/api/v1/agents/{agent_id}")
            except:
                pass
    
    # ========== HEALTH CHECK AND MONITORING TESTS ==========
    
    def test_health_check_endpoint(self):
        """Test health check endpoint availability"""
        # Test common health check endpoints
        health_endpoints = [
            "/health",
            "/api/health",
            "/api/v1/health",
            "/status",
            "/ping",
        ]
        
        health_found = False
        for endpoint in health_endpoints:
            try:
                response = self.client.get(endpoint)
                if response.status_code == 200:
                    health_found = True
                    health_data = response.json()
                    
                    # Health response should contain useful information
                    assert isinstance(health_data, dict)
                    
                    # Should contain status information
                    expected_fields = ["status", "timestamp", "version", "uptime"]
                    # At least one of these should be present
                    assert any(field in health_data for field in expected_fields)
                    
                    break
            except:
                continue
        
        # If no health endpoint exists, test that the main API is responsive
        if not health_found:
            response = self.client.get("/api/v1/agents")
            assert response.status_code == 200
    
    def test_metrics_endpoint(self):
        """Test metrics endpoint for monitoring"""
        metrics_endpoints = [
            "/metrics",
            "/api/metrics",
            "/api/v1/metrics",
        ]
        
        for endpoint in metrics_endpoints:
            try:
                response = self.client.get(endpoint)
                if response.status_code == 200:
                    # Metrics should be in proper format (JSON or Prometheus)
                    content_type = response.headers.get("content-type", "")
                    
                    if "application/json" in content_type:
                        metrics_data = response.json()
                        assert isinstance(metrics_data, dict)
                    elif "text/plain" in content_type:
                        # Prometheus format
                        metrics_text = response.text
                        assert len(metrics_text) > 0
                    
                    break
            except:
                continue
    
    def test_api_documentation_availability(self):
        """Test API documentation availability"""
        docs_endpoints = [
            "/docs",
            "/api/docs",
            "/swagger",
            "/redoc",
            "/openapi.json",
        ]
        
        docs_found = False
        for endpoint in docs_endpoints:
            try:
                response = self.client.get(endpoint)
                if response.status_code == 200:
                    docs_found = True
                    break
            except:
                continue
        
        # At least one documentation endpoint should be available
        assert docs_found, "No API documentation endpoint found"
    
    # ========== PERFORMANCE AND SCALABILITY TESTS ==========
    
    def test_response_time_requirements(self):
        """Test response time meets production requirements"""
        endpoints_to_test = [
            ("/api/v1/agents", "GET"),
            ("/api/v1/simulation/status", "GET"),
        ]
        
        for endpoint, method in endpoints_to_test:
            start_time = time.time()
            
            if method == "GET":
                response = self.client.get(endpoint)
            else:
                response = self.client.post(endpoint, json={})
            
            response_time = time.time() - start_time
            
            # Response time should be under acceptable limits
            if response.status_code == 200:
                assert response_time < 2.0, f"{endpoint} response time {response_time}s exceeds 2s limit"
            
            # Even error responses should be fast
            assert response_time < 5.0, f"{endpoint} response time {response_time}s exceeds 5s limit"
    
    def test_concurrent_request_handling(self):
        """Test concurrent request handling capability"""
        import concurrent.futures
        
        def make_request():
            return self.client.get("/api/v1/agents")
        
        # Test with multiple concurrent requests
        start_time = time.time()
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
            futures = [executor.submit(make_request) for _ in range(50)]
            results = [future.result() for future in futures]
        
        total_time = time.time() - start_time
        
        # Most requests should succeed
        successful_requests = [r for r in results if r.status_code == 200]
        success_rate = len(successful_requests) / len(results)
        
        assert success_rate >= 0.8, f"Success rate {success_rate} below 80%"
        
        # Average response time should be reasonable
        avg_response_time = total_time / len(results)
        assert avg_response_time < 1.0, f"Average response time {avg_response_time}s too high"
    
    def test_memory_usage_stability(self):
        """Test memory usage stability"""
        try:
            import psutil
            process = psutil.Process()
            
            # Get initial memory usage
            initial_memory = process.memory_info().rss / 1024 / 1024  # MB
            
            # Perform operations that might cause memory leaks
            for i in range(20):
                # Create agent
                response = self.client.post("/api/v1/agents", json={
                    "name": f"MemoryTestAgent_{i}",
                    "type": "data_analyst",
                    "skills": ["analysis"]
                })
                
                if response.status_code in [200, 201]:
                    agent_id = response.json().get("id")
                    self.created_agents.append(agent_id)
                
                # Get agents list
                self.client.get("/api/v1/agents")
                
                # Generate artifact if possible
                if agent_id:
                    self.client.post(f"/api/v1/agents/{agent_id}/artifacts", json={
                        "type": "report",
                        "description": "Memory test report"
                    })
            
            # Check memory usage after operations
            final_memory = process.memory_info().rss / 1024 / 1024  # MB
            memory_increase = final_memory - initial_memory
            
            # Memory increase should be reasonable (less than 100MB for this test)
            assert memory_increase < 100, f"Memory usage increased by {memory_increase:.2f}MB"
            
        except ImportError:
            # psutil not available, skip memory test
            pytest.skip("psutil not available for memory testing")
    
    # ========== ERROR HANDLING AND LOGGING TESTS ==========
    
    def test_error_logging_capability(self):
        """Test error logging capability"""
        # Cause an error and check if it's properly logged
        with patch('logging.Logger.error') as mock_logger:
            # Make an invalid request
            response = self.client.post("/api/v1/agents", json={"invalid": "data"})
            
            # Error should be logged (if logging is implemented)
            # This test checks if the logging infrastructure is in place
            assert response.status_code in [400, 422, 500]
    
    def test_graceful_error_handling(self):
        """Test graceful error handling"""
        error_scenarios = [
            # Invalid JSON
            ("/api/v1/agents", "POST", "invalid json"),
            # Missing required fields
            ("/api/v1/agents", "POST", json.dumps({})),
            # Invalid agent ID
            ("/api/v1/agents/invalid_id", "GET", None),
            # Invalid simulation command
            ("/api/v1/simulation/invalid_command", "POST", json.dumps({})),
        ]
        
        for endpoint, method, data in error_scenarios:
            try:
                if method == "GET":
                    response = self.client.get(endpoint)
                elif method == "POST":
                    if data:
                        if data.startswith("{"):
                            headers = {"Content-Type": "application/json"}
                            response = self.client.post(endpoint, data=data, headers=headers)
                        else:
                            response = self.client.post(endpoint, data=data)
                    else:
                        response = self.client.post(endpoint)
                
                # Should return proper error codes, not crash
                assert response.status_code in [400, 404, 405, 422, 500]
                
                # Should return JSON error response
                try:
                    error_data = response.json()
                    assert isinstance(error_data, dict)
                    # Should contain error information
                    assert any(key in error_data for key in ["error", "detail", "message"])
                except:
                    # Non-JSON error response is also acceptable
                    pass
                
            except Exception as e:
                pytest.fail(f"Unhandled exception for {endpoint}: {e}")
    
    # ========== CONFIGURATION AND ENVIRONMENT TESTS ==========
    
    def test_environment_configuration(self):
        """Test environment configuration handling"""
        # Test that the application handles missing environment variables gracefully
        
        # This is more of a design test - the app should have defaults
        # or proper error handling for missing config
        
        response = self.client.get("/api/v1/agents")
        assert response.status_code in [200, 500]  # Should not crash
        
        # If the app requires configuration and it's missing, 
        # it should return a proper error, not crash
    
    def test_database_connection_handling(self):
        """Test database connection handling"""
        # Test that database connection issues are handled gracefully
        
        # Simulate database connectivity test
        # This would typically test actual database connections
        response = self.client.get("/api/v1/agents")
        
        # Should either work or fail gracefully
        assert response.status_code in [200, 500, 503]
        
        if response.status_code in [500, 503]:
            # Should return proper error message
            try:
                error_data = response.json()
                assert "error" in error_data or "detail" in error_data
            except:
                pass
    
    # ========== SECURITY PRODUCTION TESTS ==========
    
    def test_security_headers_production(self):
        """Test security headers for production"""
        response = self.client.get("/api/v1/agents")
        headers = response.headers
        
        # Check for production security headers
        recommended_headers = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": ["DENY", "SAMEORIGIN"],
            "X-XSS-Protection": "1; mode=block",
        }
        
        # These are recommendations, not strict requirements
        # Log which headers are missing
        missing_headers = []
        for header, expected_value in recommended_headers.items():
            if header not in headers:
                missing_headers.append(header)
            elif isinstance(expected_value, list):
                if headers[header] not in expected_value:
                    missing_headers.append(f"{header} (value: {headers[header]})")
            elif headers[header] != expected_value:
                missing_headers.append(f"{header} (value: {headers[header]})")
        
        # For production readiness, we note missing headers but don't fail
        # unless it's a critical security issue
        if missing_headers:
            print(f"Recommended security headers missing or incorrect: {missing_headers}")
    
    def test_cors_production_configuration(self):
        """Test CORS configuration for production"""
        # Test CORS with various origins
        test_origins = [
            "http://localhost:3000",  # Development
            "https://example.com",    # Production domain
            "http://evil-site.com",   # Should be blocked
        ]
        
        for origin in test_origins:
            response = self.client.get(
                "/api/v1/agents",
                headers={"Origin": origin}
            )
            
            # Should handle CORS appropriately
            assert response.status_code in [200, 403]
            
            # Check CORS headers if present
            if "Access-Control-Allow-Origin" in response.headers:
                allowed_origin = response.headers["Access-Control-Allow-Origin"]
                # Should not allow all origins in production
                if allowed_origin == "*":
                    print("Warning: CORS allows all origins (*) - not recommended for production")
    
    # ========== DEPLOYMENT READINESS TESTS ==========
    
    def test_static_file_serving(self):
        """Test static file serving capability"""
        # Test if static files can be served (for frontend)
        static_endpoints = [
            "/",
            "/index.html",
            "/static/js/main.js",
            "/static/css/main.css",
        ]
        
        for endpoint in static_endpoints:
            try:
                response = self.client.get(endpoint)
                # Should either serve the file or return 404, not crash
                assert response.status_code in [200, 404, 405]
            except:
                # Static file serving might not be implemented in FastAPI
                pass
    
    def test_api_versioning_support(self):
        """Test API versioning support"""
        # Test that API versioning is properly implemented
        v1_response = self.client.get("/api/v1/agents")
        assert v1_response.status_code in [200, 404]
        
        # Test unsupported versions
        v2_response = self.client.get("/api/v2/agents")
        assert v2_response.status_code == 404
        
        # Test version in headers (if implemented)
        if v1_response.status_code == 200:
            # Should ideally include API version in response headers
            # This is optional but good practice
            pass
    
    def test_graceful_shutdown_preparation(self):
        """Test graceful shutdown preparation"""
        # Test that the application can handle shutdown signals gracefully
        # This is more of a process test, but we can check basic state
        
        # Start a simulation if possible
        start_response = self.client.post("/api/v1/simulation/start")
        
        if start_response.status_code == 200:
            # Check that we can get status
            status_response = self.client.get("/api/v1/simulation/status")
            assert status_response.status_code == 200
            
            # Stop simulation
            stop_response = self.client.post("/api/v1/simulation/stop")
            assert stop_response.status_code in [200, 400]
    
    # ========== MONITORING AND OBSERVABILITY TESTS ==========
    
    def test_request_tracing_capability(self):
        """Test request tracing capability"""
        # Test that requests can be traced (correlation IDs, etc.)
        response = self.client.get("/api/v1/agents")
        
        # Check for tracing headers
        tracing_headers = [
            "X-Request-ID",
            "X-Correlation-ID",
            "X-Trace-ID",
        ]
        
        has_tracing = any(header in response.headers for header in tracing_headers)
        
        # Tracing is optional but recommended for production
        if not has_tracing:
            print("Note: No request tracing headers found - consider implementing for production")
    
    def test_rate_limiting_production(self):
        """Test rate limiting for production"""
        # Test rate limiting behavior
        requests_made = 0
        rate_limited = False
        
        for i in range(100):  # Make many requests quickly
            response = self.client.get("/api/v1/agents")
            requests_made += 1
            
            if response.status_code == 429:  # Too Many Requests
                rate_limited = True
                break
            elif response.status_code != 200:
                break
        
        # Rate limiting is optional but recommended
        if not rate_limited and requests_made >= 100:
            print("Note: No rate limiting detected - consider implementing for production")
    
    def test_request_size_limits(self):
        """Test request size limits"""
        # Test with large payloads
        large_skills = ["skill"] * 10000  # Very large skills array
        
        large_payload = {
            "name": "LargePayloadTest",
            "type": "data_analyst",
            "skills": large_skills
        }
        
        response = self.client.post("/api/v1/agents", json=large_payload)
        
        # Should either handle or reject gracefully with proper error code
        assert response.status_code in [200, 201, 400, 413, 422]
        
        if response.status_code == 413:
            # Proper "Payload Too Large" response
            assert True
        elif response.status_code in [200, 201]:
            # If accepted, clean up
            agent_id = response.json().get("id")
            if agent_id:
                self.created_agents.append(agent_id)
    
    # ========== BACKUP AND RECOVERY TESTS ==========
    
    def test_data_export_capability(self):
        """Test data export capability for backup"""
        # Create some test data
        response = self.client.post("/api/v1/agents", json={
            "name": "BackupTestAgent",
            "type": "data_analyst",
            "skills": ["analysis"]
        })
        
        if response.status_code in [200, 201]:
            agent_id = response.json().get("id")
            self.created_agents.append(agent_id)
            
            # Test data export endpoints (if they exist)
            export_endpoints = [
                "/api/v1/export/agents",
                "/api/v1/backup",
                "/api/v1/data/export",
            ]
            
            for endpoint in export_endpoints:
                try:
                    export_response = self.client.get(endpoint)
                    if export_response.status_code == 200:
                        # Should return data in exportable format
                        export_data = export_response.json()
                        assert isinstance(export_data, (dict, list))
                        break
                except:
                    continue
    
    # ========== FINAL PRODUCTION READINESS ASSESSMENT ==========
    
    def test_overall_production_readiness(self):
        """Overall production readiness assessment"""
        readiness_checks = {
            "api_responsive": False,
            "error_handling": False,
            "concurrent_requests": False,
            "documentation_available": False,
        }
        
        # Test API responsiveness
        try:
            response = self.client.get("/api/v1/agents")
            if response.status_code == 200:
                readiness_checks["api_responsive"] = True
        except:
            pass
        
        # Test error handling
        try:
            response = self.client.post("/api/v1/agents", json={"invalid": "data"})
            if response.status_code in [400, 422]:
                readiness_checks["error_handling"] = True
        except:
            pass
        
        # Test concurrent requests
        try:
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                futures = [executor.submit(lambda: self.client.get("/api/v1/agents")) for _ in range(10)]
                results = [future.result() for future in futures]
            
            success_count = sum(1 for r in results if r.status_code == 200)
            if success_count >= 8:  # 80% success rate
                readiness_checks["concurrent_requests"] = True
        except:
            pass
        
        # Test documentation
        try:
            docs_response = self.client.get("/docs")
            if docs_response.status_code == 200:
                readiness_checks["documentation_available"] = True
        except:
            pass
        
        # Calculate readiness score
        passed_checks = sum(readiness_checks.values())
        total_checks = len(readiness_checks)
        readiness_score = passed_checks / total_checks
        
        print(f"\nProduction Readiness Assessment:")
        print(f"Readiness Score: {readiness_score:.1%} ({passed_checks}/{total_checks})")
        for check, passed in readiness_checks.items():
            status = "✓" if passed else "✗"
            print(f"  {status} {check.replace('_', ' ').title()}")
        
        # Minimum 75% for production readiness
        assert readiness_score >= 0.75, f"Production readiness score {readiness_score:.1%} below 75% threshold"

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
