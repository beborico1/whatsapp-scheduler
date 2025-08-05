#!/usr/bin/env python3
"""
Simple test runner to demonstrate test execution.
Note: This requires pytest and other test dependencies to be installed.
"""

import subprocess
import sys
import os

def run_command(cmd, description):
    """Run a command and return success status."""
    print(f"\n{'='*60}")
    print(f"Running: {description}")
    print(f"Command: {cmd}")
    print('='*60)
    
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ {description} - PASSED")
            if result.stdout:
                print(result.stdout)
            return True
        else:
            print(f"❌ {description} - FAILED")
            if result.stderr:
                print("Error output:")
                print(result.stderr)
            if result.stdout:
                print("Standard output:")
                print(result.stdout)
            return False
    except Exception as e:
        print(f"❌ {description} - ERROR: {str(e)}")
        return False

def main():
    """Run all tests with proper reporting."""
    print("🧪 WhatsApp Scheduler - Backend Test Suite")
    print("==========================================")
    
    # Check if we're in the backend directory
    if not os.path.exists("tests"):
        print("❌ Error: 'tests' directory not found. Please run from the backend directory.")
        sys.exit(1)
    
    # List of test commands to run
    test_commands = [
        ("pytest tests/test_whatsapp_service.py -v", "WhatsApp Service Tests"),
        ("pytest tests/test_scheduling.py -v", "Scheduling Tests"),
        ("pytest tests/test_api_endpoints.py -v", "API Endpoint Tests"),
        ("pytest tests/ -v --cov=app --cov-report=term-missing", "All Tests with Coverage"),
    ]
    
    all_passed = True
    
    print("\n📋 Test Plan:")
    for cmd, desc in test_commands:
        print(f"  - {desc}")
    
    # Run each test suite
    for cmd, description in test_commands:
        if not run_command(cmd, description):
            all_passed = False
    
    # Summary
    print("\n" + "="*60)
    print("📊 Test Summary")
    print("="*60)
    
    if all_passed:
        print("✅ All tests passed successfully!")
        sys.exit(0)
    else:
        print("❌ Some tests failed. Please check the output above.")
        sys.exit(1)

if __name__ == "__main__":
    main()