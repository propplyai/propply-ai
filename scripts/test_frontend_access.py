#!/usr/bin/env python3
"""
Test Frontend Data Access
Test if the frontend can access the data with the correct property ID
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

def test_frontend_access():
    """Test what the frontend should see"""
    
    # Supabase credentials
    supabase_url = "https://vlnnvxlgzhtaorpixsay.supabase.co"
    supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsbm52eGxnemh0YW9ycGl4c2F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMTE1NjgsImV4cCI6MjA3NDc4NzU2OH0.yGC82Qop5M_CSA48nXpwC15HxrqqW7CugFIb-17nxG0"
    
    supabase: Client = create_client(supabase_url, supabase_key)
    
    print("🔍 Testing frontend data access...")
    print("=" * 60)
    
    try:
        # Get the most recent property with data
        print("1️⃣ Finding properties with NYC data...")
        
        # Get properties with compliance data using direct queries
        print("   Getting properties...")
        properties_response = supabase.table('properties').select('id, address, created_at').order('created_at', desc=True).limit(5).execute()
        
        if not properties_response.data:
            print("❌ No properties found!")
            return False
        
        print(f"   Found {len(properties_response.data)} properties")
        
        # Check each property for compliance data
        properties_with_data = []
        
        for prop in properties_response.data:
            print(f"   Checking property: {prop['id']}")
            
            # Check if it has NYC property record
            nyc_response = supabase.table('nyc_properties').select('id').eq('property_id', prop['id']).execute()
            if not nyc_response.data:
                continue
                
            nyc_property_id = nyc_response.data[0]['id']
            
            # Check if it has compliance summary
            compliance_response = supabase.table('nyc_compliance_summary').select('*').eq('nyc_property_id', nyc_property_id).execute()
            if not compliance_response.data:
                continue
                
            compliance = compliance_response.data[0]
            properties_with_data.append({
                'property_id': prop['id'],
                'address': prop['address'],
                'nyc_property_id': nyc_property_id,
                'compliance_score': compliance.get('compliance_score'),
                'risk_level': compliance.get('risk_level'),
                'total_violations': compliance.get('total_violations'),
                'dob_violations': compliance.get('dob_violations'),
                'hpd_violations': compliance.get('hpd_violations')
            })
        
        response_data = properties_with_data
        
        if not response_data:
            print("❌ No properties with compliance data found!")
            return False
        
        print(f"✅ Found {len(response_data)} properties with compliance data:")
        
        for i, prop in enumerate(response_data):
            print(f"\n📋 Property {i+1}:")
            print(f"   ID: {prop['property_id']}")
            print(f"   Address: {prop['address']}")
            print(f"   Compliance Score: {prop['compliance_score']}%")
            print(f"   Risk Level: {prop['risk_level']}")
            print(f"   Total Violations: {prop['total_violations']}")
            print(f"   DOB Violations: {prop['dob_violations']}")
            print(f"   HPD Violations: {prop['hpd_violations']}")
        
        # Test the first property in detail
        test_property_id = response_data[0]['property_id']
        print(f"\n🧪 Testing detailed data for property: {test_property_id}")
        
        # Test NYC property record
        nyc_response = supabase.table('nyc_properties').select('*').eq('property_id', test_property_id).execute()
        if nyc_response.data:
            nyc_property = nyc_response.data[0]
            print(f"✅ NYC Property Record: {nyc_property['id']}")
            
            # Test violations
            dob_response = supabase.table('nyc_dob_violations').select('*').eq('nyc_property_id', nyc_property['id']).execute()
            hpd_response = supabase.table('nyc_hpd_violations').select('*').eq('nyc_property_id', nyc_property['id']).execute()
            
            print(f"✅ DOB Violations: {len(dob_response.data) if dob_response.data else 0}")
            print(f"✅ HPD Violations: {len(hpd_response.data) if hpd_response.data else 0}")
            
            # Test equipment
            elevator_response = supabase.table('nyc_elevator_inspections').select('*').eq('nyc_property_id', nyc_property['id']).execute()
            boiler_response = supabase.table('nyc_boiler_inspections').select('*').eq('nyc_property_id', nyc_property['id']).execute()
            
            print(f"✅ Elevator Inspections: {len(elevator_response.data) if elevator_response.data else 0}")
            print(f"✅ Boiler Inspections: {len(boiler_response.data) if boiler_response.data else 0}")
            
            print(f"\n🎯 FRONTEND SHOULD SHOW FOR PROPERTY {test_property_id}:")
            print(f"   • Compliance Score: {response_data[0]['compliance_score']}%")
            print(f"   • Risk Level: {response_data[0]['risk_level']}")
            print(f"   • DOB Violations: {len(dob_response.data) if dob_response.data else 0} total")
            print(f"   • HPD Violations: {len(hpd_response.data) if hpd_response.data else 0} total")
            print(f"   • Elevator Equipment: {len(elevator_response.data) if elevator_response.data else 0} total")
            print(f"   • Boiler Equipment: {len(boiler_response.data) if boiler_response.data else 0} total")
            
            if len(dob_response.data) > 0 or len(hpd_response.data) > 0:
                print(f"\n🎉 This property HAS violation data! The modal should show real data.")
                print(f"   Try clicking on this property in the frontend: {test_property_id}")
            else:
                print(f"\n⚠️ This property has compliance summary but no violation details.")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing frontend access: {e}")
        return False

if __name__ == '__main__':
    success = test_frontend_access()
    if success:
        print("\n✅ Frontend access test completed!")
    else:
        print("\n💥 Frontend access test failed!")
        sys.exit(1)
