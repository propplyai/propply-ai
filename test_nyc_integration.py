#!/usr/bin/env python3
"""
Test script for NYC compliance system integration
"""

import asyncio
import json
from complianceNYC import ComprehensivePropertyComplianceSystem

async def test_nyc_compliance():
    """Test the comprehensive NYC compliance system"""
    
    print("🧪 Testing NYC Compliance System Integration")
    print("=" * 60)
    
    # Initialize the comprehensive compliance system
    compliance_system = ComprehensivePropertyComplianceSystem()
    
    # Test addresses
    test_addresses = [
        "140 West 28th Street, New York, NY 10001",
        "666 Broadway, New York, NY 10012",
        "1 Wall Street, New York, NY 10005"
    ]
    
    for address in test_addresses:
        print(f"\n🏢 Testing address: {address}")
        print("-" * 40)
        
        try:
            # Process the property
            record = await compliance_system.process_property(address)
            
            # Display results
            print(f"✅ Address: {record.address}")
            print(f"   BIN: {record.bin}")
            print(f"   BBL: {record.bbl}")
            print(f"   Borough: {record.borough}")
            print(f"   Overall Score: {record.overall_compliance_score:.1f}/100")
            print(f"   HPD Violations: {record.hpd_violations_total} total, {record.hpd_violations_active} active")
            print(f"   DOB Violations: {record.dob_violations_total} total, {record.dob_violations_active} active")
            print(f"   Elevator Devices: {record.elevator_devices_total} total, {record.elevator_devices_active} active")
            print(f"   Boiler Devices: {record.boiler_devices_total} total")
            print(f"   Electrical Permits: {record.electrical_permits_total} total, {record.electrical_permits_active} active")
            
            # Show sample violations if available
            hpd_violations = json.loads(record.hpd_violations_data)
            if hpd_violations:
                print(f"   📋 Sample HPD Violation: {hpd_violations[0].get('novdescription', 'N/A')[:50]}...")
            
            dob_violations = json.loads(record.dob_violations_data)
            if dob_violations:
                print(f"   📋 Sample DOB Violation: {dob_violations[0].get('violation_type', 'N/A')}")
            
            print(f"   📊 Data Sources: {record.data_sources}")
            print(f"   ⏰ Processed: {record.processed_at}")
            
        except Exception as e:
            print(f"❌ Error processing {address}: {e}")
    
    print(f"\n✅ NYC Compliance System Integration Test Complete")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_nyc_compliance())

