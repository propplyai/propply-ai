#!/usr/bin/env python3

from philly_enhanced_data_client import PhillyEnhancedDataClient

# Test with real Philadelphia addresses
client = PhillyEnhancedDataClient()

# Test addresses - real Philadelphia locations
test_addresses = [
    "1400 John F Kennedy Blvd",  # City Hall
    "1234 Market St",            # Center City
    "123 S Broad St"             # South Broad
]

for address in test_addresses:
    print(f"\n{'='*60}")
    print(f"TESTING: {address}")
    print('='*60)
    
    # Get data
    permits = client.get_li_building_permits(address)
    violations = client.get_li_code_violations(address)
    investigations = client.get_li_case_investigations(address)
    
    print(f"📋 PERMITS: {len(permits)} found")
    print(f"⚠️  VIOLATIONS: {len(violations)} found")  
    print(f"🔍 INVESTIGATIONS: {len(investigations)} found")
    
    # Show samples
    if permits:
        p = permits[0]
        print(f"\n📋 Sample Permit:")
        print(f"   #{p.get('permitnumber', 'N/A')} - {p.get('permittype', 'N/A')}")
        print(f"   Status: {p.get('status', 'N/A')}")
        
    if violations:
        v = violations[0] 
        print(f"\n⚠️  Sample Violation:")
        print(f"   #{v.get('violationid', 'N/A')} - {v.get('violationtype', 'N/A')}")
        print(f"   Status: {v.get('status', 'N/A')}")
        
    if investigations:
        i = investigations[0]
        print(f"\n🔍 Sample Investigation:")
        print(f"   #{i.get('caseid', 'N/A')} - {i.get('investigationtype', 'N/A')}")
        print(f"   Outcome: {i.get('outcome', 'N/A')}")

print(f"\n{'='*60}")
print("TEST COMPLETE")
print('='*60)

