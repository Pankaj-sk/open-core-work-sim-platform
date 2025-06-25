#!/usr/bin/env python3
"""
Simple test runner for all test suites
"""
import subprocess
import sys
import os
from datetime import datetime

def run_all_tests():
    """Run all test suites"""
    
    print("="*80)
    print("COMPREHENSIVE TEST SUITE EXECUTION")
    print("="*80)
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    test_files = [
        ("tests/test_core.py", "Core Functionality"),
        ("tests/test_integration.py", "Integration Tests"),
        ("tests/test_simulation.py", "Simulation Tests"),
        ("tests/test_advanced_agents.py", "Advanced Agent Tests"),
        ("tests/test_stress_performance.py", "Stress & Performance"),
        ("tests/test_deep_integration_security.py", "Deep Integration & Security"),
        ("tests/test_error_boundaries.py", "Error Boundaries"),
        ("tests/test_edge_cases_comprehensive.py", "Edge Cases & Boundary Conditions"),
        ("tests/test_data_integrity_consistency.py", "Data Integrity & Consistency"),
        ("tests/test_production_readiness.py", "Production Readiness"),
        ("tests/test_end_to_end_workflows.py", "End-to-End Workflows"),
    ]
    
    total_passed = 0
    total_failed = 0
    total_tests = 0
    
    results = []
    
    for test_file, description in test_files:
        print(f"\n{'='*60}")
        print(f"Running {description}")
        print(f"File: {test_file}")
        print(f"{'='*60}")
        
        # Run pytest for this file
        result = subprocess.run([
            sys.executable, "-m", "pytest", 
            test_file, 
            "-v", 
            "--tb=short"
        ], capture_output=True, text=True)
        
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        
        # Parse results from output
        lines = result.stdout.split('\n')
        passed = 0
        failed = 0
        
        for line in lines:
            if "PASSED" in line and "::" in line:
                passed += 1
            elif "FAILED" in line and "::" in line:
                failed += 1
        
        tests_run = passed + failed
        success_rate = (passed / tests_run * 100) if tests_run > 0 else 0
        
        results.append({
            'description': description,
            'file': test_file,
            'passed': passed,
            'failed': failed,
            'total': tests_run,
            'success_rate': success_rate,
            'exit_code': result.returncode
        })
        
        total_passed += passed
        total_failed += failed
        total_tests += tests_run
        
        print(f"\nResult: {passed}/{tests_run} passed ({success_rate:.1f}%)")
        
    # Summary
    print(f"\n{'='*80}")
    print("COMPREHENSIVE TEST SUMMARY")
    print(f"{'='*80}")
    
    overall_success_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
    
    print(f"Total Tests: {total_tests}")
    print(f"Total Passed: {total_passed}")
    print(f"Total Failed: {total_failed}")
    print(f"Overall Success Rate: {overall_success_rate:.1f}%")
    print()
    
    print("DETAILED BREAKDOWN:")
    print("-" * 80)
    
    for result in results:
        status = "✓ PASS" if result['failed'] == 0 and result['total'] > 0 else "✗ FAIL"
        print(f"{status} {result['description']:<35} {result['passed']:>3}/{result['total']:<3} ({result['success_rate']:>6.1f}%)")
    
    print(f"\n{'='*80}")
    
    if overall_success_rate >= 95:
        print("🎉 EXCELLENT! System is production-ready!")
    elif overall_success_rate >= 90:
        print("👍 GOOD! System is mostly ready for production.")
    elif overall_success_rate >= 80:
        print("⚠️  FAIR! System needs some improvements before production.")
    else:
        print("❌ POOR! System needs significant work before production.")
    
    print(f"Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    return overall_success_rate >= 90

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
