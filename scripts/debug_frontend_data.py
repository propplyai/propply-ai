#!/usr/bin/env python3
"""
Debug Frontend Data
Check if the frontend can access the data properly
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

def debug_frontend_data():
    """Debug what the frontend should see"""
    
    # Supabase credentials
    supabase_url = "https://vlnnvxlgzhtaorpixsay.supabase.co"
    supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsbm52eGxnemh0YW9ycGl4c2F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMTE1NjgsImV4cCI6MjA3NDc4NzU2OH0.yGC82Qop5M_CSA48nXpwC15HxrqqW7CugFIb-17nxG0"
    
    supabase: Client = create_client(supabase_url, supabase_key)
    
    property_id = "a161f5d2-1db9-4ae8-a0c0-20e08429b0af"
    
    print("🔍 Debugging frontend data access...")
    print(f"Property ID: {property_id}")
    print("=" * 60)
    
    try:
        # Step 1: Check if property exists
        print("1️⃣ Checking property...")
        property_response = supabase.table('properties').select('*').eq('id', property_id).execute()
        
        if not property_response.data:
            print("❌ Property not found!")
            return False
        
        property_data = property_response.data[0]
        print(f"✅ Property found: {property_data['address']}")
        
        # Step 2: Check NYC property record
        print("\n2️⃣ Checking NYC property record...")
        nyc_property_response = supabase.table('nyc_properties').select('*').eq('property_id', property_id).execute()
        
        if not nyc_property_response.data:
            print("❌ NYC property record not found!")
            return False
        
        nyc_property = nyc_property_response.data[0]
        print(f"✅ NYC property found: {nyc_property['id']}")
        print(f"   BIN: {nyc_property.get('bin', 'Not set')}")
        print(f"   BBL: {nyc_property.get('bbl', 'Not set')}")
        print(f"   Borough: {nyc_property.get('borough', 'Not set')}")
        
        # Step 3: Check compliance summary
        print("\n3️⃣ Checking compliance summary...")
        compliance_response = supabase.table('nyc_compliance_summary').select('*').eq('nyc_property_id', nyc_property['id']).execute()
        
        if not compliance_response.data:
            print("❌ Compliance summary not found!")
            return False
        
        compliance = compliance_response.data[0]
        print(f"✅ Compliance summary found:")
        print(f"   Score: {compliance.get('compliance_score', 'N/A')}%")
        print(f"   Risk: {compliance.get('risk_level', 'N/A')}")
        print(f"   Total Violations: {compliance.get('total_violations', 'N/A')}")
        print(f"   DOB Violations: {compliance.get('dob_violations', 'N/A')}")
        print(f"   HPD Violations: {compliance.get('hpd_violations', 'N/A')}")
        
        # Step 4: Check DOB violations
        print("\n4️⃣ Checking DOB violations...")
        dob_response = supabase.table('nyc_dob_violations').select('*').eq('nyc_property_id', nyc_property['id']).execute()
        
        dob_count = len(dob_response.data) if dob_response.data else 0
        print(f"✅ Found {dob_count} DOB violations")
        
        if dob_count > 0:
            print("   Sample violations:")
            for i, violation in enumerate(dob_response.data[:3]):  # Show first 3
                print(f"   {i+1}. {violation.get('violation_type', 'Unknown')} - {violation.get('violation_description', 'No description')[:50]}...")
        
        # Step 5: Check HPD violations
        print("\n5️⃣ Checking HPD violations...")
        hpd_response = supabase.table('nyc_hpd_violations').select('*').eq('nyc_property_id', nyc_property['id']).execute()
        
        hpd_count = len(hpd_response.data) if hpd_response.data else 0
        print(f"✅ Found {hpd_count} HPD violations")
        
        # Step 6: Check equipment data
        print("\n6️⃣ Checking equipment data...")
        elevator_response = supabase.table('nyc_elevator_inspections').select('*').eq('nyc_property_id', nyc_property['id']).execute()
        boiler_response = supabase.table('nyc_boiler_inspections').select('*').eq('nyc_property_id', nyc_property['id']).execute()
        
        elevator_count = len(elevator_response.data) if elevator_response.data else 0
        boiler_count = len(boiler_response.data) if boiler_response.data else 0
        
        print(f"✅ Found {elevator_count} elevator inspections")
        print(f"✅ Found {boiler_count} boiler inspections")
        
        # Step 7: Summary
        print("\n" + "=" * 60)
        print("📊 FRONTEND SHOULD SHOW:")
        print(f"   • Compliance Score: {compliance.get('compliance_score', 'N/A')}%")
        print(f"   • Risk Level: {compliance.get('risk_level', 'N/A')}")
        print(f"   • DOB Violations: {dob_count} total")
        print(f"   • HPD Violations: {hpd_count} total")
        print(f"   • Elevator Equipment: {elevator_count} total")
        print(f"   • Boiler Equipment: {boiler_count} total")
        
        if dob_count > 0 or hpd_count > 0 or elevator_count > 0 or boiler_count > 0:
            print("\n🎉 Data is available! The frontend should show real data.")
            print("   If the modal still shows '0 total, 0 active', there might be:")
            print("   • Frontend caching issue")
            print("   • RLS (Row Level Security) policy blocking access")
            print("   • Frontend not refreshing the data")
        else:
            print("\n⚠️ No data found. The modal will show '0 total, 0 active'")
        
        return True
        
    except Exception as e:
        print(f"❌ Error debugging frontend data: {e}")
        return False

if __name__ == '__main__':
    success = debug_frontend_data()
    if success:
        print("\n✅ Debug completed!")
    else:
        print("\n💥 Debug failed!")
        sys.exit(1)
