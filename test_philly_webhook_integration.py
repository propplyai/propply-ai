#!/usr/bin/env python3
"""
Test Script for Philadelphia Data Analysis & Webhook Integration
Tests the complete workflow: Philadelphia data → AI analysis → n8n webhook → callback
"""

import requests
import json
import os
import time
from datetime import datetime
from philly_enhanced_data_client import PhillyEnhancedDataClient

# Test configuration
TEST_ADDRESSES = [
    "1234 Market St, Philadelphia, PA 19107",  # Center City
    "1600 Pennsylvania Ave, Philadelphia, PA 19103",  # Rittenhouse Square
    "1 Independence Mall, Philadelphia, PA 19106",  # Old City
    "2200 Benjamin Franklin Pkwy, Philadelphia, PA 19130",  # Art Museum
    "100 S Broad St, Philadelphia, PA 19110"  # City Hall area
]

# Webhook endpoints
FLASK_BASE_URL = "http://localhost:5002"
AI_ANALYSIS_ENDPOINT = f"{FLASK_BASE_URL}/api/ai-optimized-analysis"
AI_CALLBACK_ENDPOINT = f"{FLASK_BASE_URL}/api/ai-callback"
HEALTH_ENDPOINT = f"{FLASK_BASE_URL}/api/health"

def test_flask_server():
    """Test if Flask server is running"""
    try:
        response = requests.get(HEALTH_ENDPOINT, timeout=5)
        if response.status_code == 200:
            print("✅ Flask server is running")
            return True
        else:
            print(f"❌ Flask server returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Flask server is not running. Start it with: python propply_app.py")
        return False
    except Exception as e:
        print(f"❌ Error testing Flask server: {e}")
        return False

def test_philly_data_client():
    """Test Philadelphia data client directly"""
    print("\n🔍 Testing Philadelphia Data Client...")
    
    try:
        client = PhillyEnhancedDataClient()
        
        # Test with first address
        test_address = TEST_ADDRESSES[0]
        print(f"Testing address: {test_address}")
        
        # Get comprehensive data
        data = client.get_comprehensive_property_data(test_address)
        
        if 'error' in data:
            print(f"❌ Data client error: {data['error']}")
            return False
        
        print(f"✅ Data retrieved successfully")
        print(f"   - Permits: {len(data.get('permits', []))}")
        print(f"   - Violations: {len(data.get('violations', []))}")
        print(f"   - Certifications: {len(data.get('certifications', []))}")
        print(f"   - Compliance Score: {data.get('compliance_summary', {}).get('compliance_score', 'N/A')}")
        
        return data
        
    except Exception as e:
        print(f"❌ Error testing data client: {e}")
        return False

def test_ai_analysis_endpoint(address, property_id=None):
    """Test the AI analysis endpoint"""
    print(f"\n🤖 Testing AI Analysis Endpoint...")
    print(f"Address: {address}")
    
    payload = {
        "address": address,
        "city": "Philadelphia",
        "property_id": property_id or f"test_prop_{int(time.time())}"
    }
    
    try:
        print(f"Sending request to: {AI_ANALYSIS_ENDPOINT}")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(
            AI_ANALYSIS_ENDPOINT,
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ AI Analysis initiated successfully")
            print(f"Response: {json.dumps(result, indent=2)}")
            return result
        else:
            print(f"❌ AI Analysis failed with status {response.status_code}")
            print(f"Error: {response.text}")
            return None
            
    except requests.exceptions.Timeout:
        print("❌ Request timed out (30s)")
        return None
    except Exception as e:
        print(f"❌ Error testing AI analysis: {e}")
        return None

def simulate_webhook_callback(property_id, analysis_result):
    """Simulate a webhook callback from n8n"""
    print(f"\n🔄 Simulating Webhook Callback...")
    
    # Simulate AI analysis results
    callback_payload = {
        "request_id": f"req_{int(time.time())}",
        "property_id": property_id,
        "analysis_type": "compliance_analysis",
        "compliance_score": 85,
        "risk_level": "Medium",
        "findings": [
            "3 open violations require attention",
            "Recent permits show active maintenance",
            "Building certifications are current"
        ],
        "recommendations": [
            {
                "priority": "High",
                "action": "Address open violations",
                "estimated_cost": 5000,
                "timeline": "30 days"
            },
            {
                "priority": "Medium", 
                "action": "Schedule annual inspection",
                "estimated_cost": 1500,
                "timeline": "90 days"
            }
        ],
        "cost_estimates": {
            "total_estimated_cost": 6500,
            "high_priority_cost": 5000,
            "medium_priority_cost": 1500
        },
        "confidence_score": 0.87,
        "analysis_date": datetime.now().isoformat(),
        "ai_model": "external_ai_v1",
        "processing_time_seconds": 12.5
    }
    
    try:
        print(f"Sending callback to: {AI_CALLBACK_ENDPOINT}")
        print(f"Callback payload: {json.dumps(callback_payload, indent=2)}")
        
        response = requests.post(
            AI_CALLBACK_ENDPOINT,
            json=callback_payload,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print(f"Callback Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Webhook callback processed successfully")
            print(f"Result: {json.dumps(result, indent=2)}")
            return result
        else:
            print(f"❌ Callback failed with status {response.status_code}")
            print(f"Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error testing callback: {e}")
        return None

def test_complete_workflow():
    """Test the complete workflow end-to-end"""
    print("🚀 Testing Complete Philadelphia Webhook Workflow")
    print("=" * 60)
    
    # Step 1: Test Flask server
    if not test_flask_server():
        return False
    
    # Step 2: Test data client
    philly_data = test_philly_data_client()
    if not philly_data:
        return False
    
    # Step 3: Test AI analysis endpoint
    test_address = TEST_ADDRESSES[0]
    property_id = f"test_prop_{int(time.time())}"
    
    ai_result = test_ai_analysis_endpoint(test_address, property_id)
    if not ai_result:
        return False
    
    # Step 4: Simulate webhook callback
    callback_result = simulate_webhook_callback(property_id, ai_result)
    if not callback_result:
        return False
    
    print("\n🎉 Complete workflow test successful!")
    return True

def test_multiple_addresses():
    """Test with multiple Philadelphia addresses"""
    print("\n🏢 Testing Multiple Philadelphia Addresses")
    print("=" * 50)
    
    results = []
    
    for i, address in enumerate(TEST_ADDRESSES[:3], 1):  # Test first 3 addresses
        print(f"\n📍 Test {i}/3: {address}")
        
        property_id = f"test_prop_{i}_{int(time.time())}"
        result = test_ai_analysis_endpoint(address, property_id)
        
        if result:
            results.append({
                "address": address,
                "property_id": property_id,
                "status": "success",
                "result": result
            })
            print(f"✅ Address {i} processed successfully")
        else:
            results.append({
                "address": address,
                "property_id": property_id,
                "status": "failed"
            })
            print(f"❌ Address {i} failed")
        
        # Small delay between requests
        time.sleep(2)
    
    # Summary
    successful = len([r for r in results if r["status"] == "success"])
    print(f"\n📊 Summary: {successful}/{len(results)} addresses processed successfully")
    
    return results

def main():
    """Main test function"""
    print("🧪 Philadelphia Webhook Integration Test Suite")
    print("=" * 60)
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Flask URL: {FLASK_BASE_URL}")
    print(f"n8n Webhook: {os.getenv('N8N_WEBHOOK_URL', 'Not configured')}")
    
    # Run tests
    try:
        # Test 1: Complete workflow
        workflow_success = test_complete_workflow()
        
        if workflow_success:
            # Test 2: Multiple addresses
            test_multiple_addresses()
        
        print("\n" + "=" * 60)
        print("🏁 Test suite completed!")
        
    except KeyboardInterrupt:
        print("\n⏹️  Test interrupted by user")
    except Exception as e:
        print(f"\n💥 Test suite failed with error: {e}")

if __name__ == "__main__":
    main()

