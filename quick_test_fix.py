#!/usr/bin/env python3
"""
Quick test to verify the Philadelphia data client fix
"""

from philly_enhanced_data_client import PhillyEnhancedDataClient

def test_fix():
    print("🧪 Testing FIXED Philadelphia data client...")
    
    client = PhillyEnhancedDataClient()
    address = "1234 Market St, Philadelphia, PA 19107"
    
    print(f"Testing address: {address}")
    
    # Test permits
    print("\n1. Testing permits...")
    permits = client.get_li_building_permits(address)
    print(f"✅ Permits found: {len(permits)}")
    if permits:
        print(f"   First permit: {permits[0]['permitnumber']} - {permits[0]['permittype']}")
    
    # Test violations
    print("\n2. Testing violations...")
    violations = client.get_li_code_violations(address)
    print(f"✅ Violations found: {len(violations)}")
    if violations:
        print(f"   First violation: {violations[0]['violationid']} - {violations[0]['violationtype']}")
    
    # Test comprehensive data
    print("\n3. Testing comprehensive data...")
    comprehensive = client.get_comprehensive_property_data(address)
    permits_count = len(comprehensive.get("permits", {}).get("records", []))
    violations_count = len(comprehensive.get("violations", {}).get("records", []))
    compliance_score = comprehensive.get("compliance_summary", {}).get("compliance_score", "N/A")
    
    print(f"✅ Comprehensive data:")
    print(f"   Permits: {permits_count}")
    print(f"   Violations: {violations_count}")
    print(f"   Compliance Score: {compliance_score}")
    
    if permits_count > 0 or violations_count > 0:
        print("\n🎉 SUCCESS! Real data is now being fetched!")
        return True
    else:
        print("\n❌ Still no data found. Check the fix.")
        return False

if __name__ == "__main__":
    test_fix()

