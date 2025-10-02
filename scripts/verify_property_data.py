#!/usr/bin/env python3
"""
Verify Property Data
Check specific property data that should show in frontend
"""

import sys
import os
import logging
from datetime import datetime

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from supabase import create_client, Client

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def verify_property_data():
    """Verify the data for the property that should show violations"""
    
    # Supabase credentials
    supabase_url = "https://vlnnvxlgzhtaorpixsay.supabase.co"
    supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsbm52eGxnemh0YW9ycGl4c2F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMTE1NjgsImV4cCI6MjA3NDc4NzU2OH0.yGC82Qop5M_CSA48nXpwC15HxrqqW7CugFIb-17nxG0"
    
    supabase: Client = create_client(supabase_url, supabase_key)
    
    # Test the property that should have violations (using the most recent one with data)
    property_id = "217ad3c4-01f9-4c42-be2d-534f3deae7ed"
    
    print("🔍 Verifying property data for frontend...")
    print(f"Property ID: {property_id}")
    print("=" * 60)
    
    try:
        # Step 1: Get property info
        print("1️⃣ Getting property info...")
        property_response = supabase.table('properties').select('*').eq('id', property_id).execute()
        
        if not property_response.data:
            print("❌ Property not found!")
            return False
        
        property_data = property_response.data[0]
        print(f"✅ Property: {property_data['address']}")
        
        # Step 2: Get NYC property record
        print("\n2️⃣ Getting NYC property record...")
        nyc_response = supabase.table('nyc_properties').select('*').eq('property_id', property_id).execute()
        
        if not nyc_response.data:
            print("❌ NYC property record not found!")
            return False
        
        nyc_property = nyc_response.data[0]
        print(f"✅ NYC Property ID: {nyc_property['id']}")
        print(f"   BIN: {nyc_property.get('bin', 'Not set')}")
        print(f"   BBL: {nyc_property.get('bbl', 'Not set')}")
        print(f"   Borough: {nyc_property.get('borough', 'Not set')}")
        
        # Step 3: Get compliance summary
        print("\n3️⃣ Getting compliance summary...")
        compliance_response = supabase.table('nyc_compliance_summary').select('*').eq('nyc_property_id', nyc_property['id']).execute()
        
        if not compliance_response.data:
            print("❌ Compliance summary not found!")
            return False
        
        compliance = compliance_response.data[0]
        print(f"✅ Compliance Summary:")
        print(f"   Score: {compliance.get('compliance_score')}%")
        print(f"   Risk: {compliance.get('risk_level')}")
        print(f"   Total Violations: {compliance.get('total_violations')}")
        print(f"   DOB Violations: {compliance.get('dob_violations')}")
        print(f"   HPD Violations: {compliance.get('hpd_violations')}")
        
        # Step 4: Get DOB violations
        print("\n4️⃣ Getting DOB violations...")
        dob_response = supabase.table('nyc_dob_violations').select('*').eq('nyc_property_id', nyc_property['id']).execute()
        
        dob_count = len(dob_response.data) if dob_response.data else 0
        print(f"✅ Found {dob_count} DOB violations")
        
        if dob_count > 0:
            print("   Sample violations:")
            for i, violation in enumerate(dob_response.data[:3]):
                print(f"   {i+1}. {violation.get('violation_type', 'Unknown')} - {violation.get('violation_description', 'No description')[:50]}...")
        
        # Step 5: Get HPD violations
        print("\n5️⃣ Getting HPD violations...")
        hpd_response = supabase.table('nyc_hpd_violations').select('*').eq('nyc_property_id', nyc_property['id']).execute()
        
        hpd_count = len(hpd_response.data) if hpd_response.data else 0
        print(f"✅ Found {hpd_count} HPD violations")
        
        # Step 6: Get equipment data
        print("\n6️⃣ Getting equipment data...")
        elevator_response = supabase.table('nyc_elevator_inspections').select('*').eq('nyc_property_id', nyc_property['id']).execute()
        boiler_response = supabase.table('nyc_boiler_inspections').select('*').eq('nyc_property_id', nyc_property['id']).execute()
        
        elevator_count = len(elevator_response.data) if elevator_response.data else 0
        boiler_count = len(boiler_response.data) if boiler_response.data else 0
        
        print(f"✅ Elevator Inspections: {elevator_count}")
        print(f"✅ Boiler Inspections: {boiler_count}")
        
        # Step 7: Final summary
        print("\n" + "=" * 60)
        print("🎯 FRONTEND MODAL SHOULD SHOW:")
        print(f"   • Compliance Score: {compliance.get('compliance_score')}%")
        print(f"   • Risk Level: {compliance.get('risk_level')}")
        print(f"   • DOB Violations: {dob_count} total, {dob_count} active")
        print(f"   • HPD Violations: {hpd_count} total, {hpd_count} open")
        print(f"   • Elevator Equipment: {elevator_count} total, 0 active")
        print(f"   • Boiler Equipment: {boiler_count} total, 0 active")
        
        if dob_count > 0 or hpd_count > 0:
            print(f"\n🎉 THIS PROPERTY HAS REAL VIOLATION DATA!")
            print(f"   The modal should NOT show '0 total, 0 active'")
            print(f"   If it still shows zeros, it's a frontend caching issue")
            print(f"\n💡 SOLUTIONS TO TRY:")
            print(f"   1. Click the refresh button (🔄) in the modal")
            print(f"   2. Close and reopen the modal")
            print(f"   3. Hard refresh the browser (Ctrl+F5 or Cmd+Shift+R)")
            print(f"   4. Check browser console for errors")
        else:
            print(f"\n⚠️ This property has compliance summary but no violation details")
        
        return True
        
    except Exception as e:
        print(f"❌ Error verifying property data: {e}")
        return False

if __name__ == '__main__':
    success = verify_property_data()
    if success:
        print("\n✅ Property data verification completed!")
    else:
        print("\n💥 Property data verification failed!")
        sys.exit(1)
