#!/usr/bin/env python3
"""
Refresh Property Data
Update compliance summary with current violation counts
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

def refresh_property_data(property_id: str):
    """Refresh compliance data for a property"""
    
    # Supabase credentials
    supabase_url = "https://vlnnvxlgzhtaorpixsay.supabase.co"
    supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsbm52eGxnemh0YW9ycGl4c2F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMTE1NjgsImV4cCI6MjA3NDc4NzU2OH0.yGC82Qop5M_CSA48nXpwC15HxrqqW7CugFIb-17nxG0"
    
    supabase: Client = create_client(supabase_url, supabase_key)
    
    print(f"🔄 Refreshing compliance data for property: {property_id}")
    
    try:
        # Get NYC property ID
        nyc_property_response = supabase.table('nyc_properties').select('id').eq('property_id', property_id).execute()
        
        if not nyc_property_response.data:
            print("❌ NYC property record not found")
            return False
        
        nyc_property_id = nyc_property_response.data[0]['id']
        print(f"📋 NYC Property ID: {nyc_property_id}")
        
        # Get current violation counts
        dob_response = supabase.table('nyc_dob_violations').select('id').eq('nyc_property_id', nyc_property_id).execute()
        hpd_response = supabase.table('nyc_hpd_violations').select('id').eq('nyc_property_id', nyc_property_id).execute()
        elevator_response = supabase.table('nyc_elevator_inspections').select('id').eq('nyc_property_id', nyc_property_id).execute()
        boiler_response = supabase.table('nyc_boiler_inspections').select('id').eq('nyc_property_id', nyc_property_id).execute()
        complaints_response = supabase.table('nyc_311_complaints').select('id').eq('nyc_property_id', nyc_property_id).execute()
        
        dob_count = len(dob_response.data) if dob_response.data else 0
        hpd_count = len(hpd_response.data) if hpd_response.data else 0
        elevator_count = len(elevator_response.data) if elevator_response.data else 0
        boiler_count = len(boiler_response.data) if boiler_response.data else 0
        complaints_count = len(complaints_response.data) if complaints_response.data else 0
        
        total_violations = dob_count + hpd_count
        
        print(f"📊 Current counts:")
        print(f"  • DOB Violations: {dob_count}")
        print(f"  • HPD Violations: {hpd_count}")
        print(f"  • Elevator Inspections: {elevator_count}")
        print(f"  • Boiler Inspections: {boiler_count}")
        print(f"  • 311 Complaints: {complaints_count}")
        print(f"  • Total Violations: {total_violations}")
        
        # Calculate compliance score
        compliance_score = 100
        compliance_score -= (total_violations * 5)  # -5 points per violation
        compliance_score -= (complaints_count * 2)  # -2 points per 311 complaint
        compliance_score = max(0, compliance_score)
        
        risk_level = 'LOW' if compliance_score > 80 else 'MEDIUM' if compliance_score > 60 else 'HIGH'
        
        print(f"📈 Calculated compliance:")
        print(f"  • Compliance Score: {compliance_score}%")
        print(f"  • Risk Level: {risk_level}")
        
        # Update compliance summary
        summary_data = {
            'nyc_property_id': nyc_property_id,
            'compliance_score': compliance_score,
            'risk_level': risk_level,
            'total_violations': total_violations,
            'open_violations': total_violations,
            'dob_violations': dob_count,
            'hpd_violations': hpd_count,
            'equipment_issues': 0,
            'open_311_complaints': complaints_count,
            'fire_safety_issues': 0,
            'last_analyzed_at': datetime.now().isoformat()
        }
        
        # Update the compliance summary
        update_response = supabase.table('nyc_compliance_summary').update(summary_data).eq('nyc_property_id', nyc_property_id).execute()
        
        if update_response.data:
            print("✅ Compliance summary updated successfully!")
            print(f"🎯 The Property Analysis modal should now show:")
            print(f"  • Compliance Score: {compliance_score}%")
            print(f"  • Risk Level: {risk_level}")
            print(f"  • DOB Violations: {dob_count} total")
            print(f"  • HPD Violations: {hpd_count} total")
            return True
        else:
            print("❌ Failed to update compliance summary")
            return False
            
    except Exception as e:
        print(f"❌ Error refreshing property data: {e}")
        return False

if __name__ == '__main__':
    # Property ID from the user's message
    property_id = "a161f5d2-1db9-4ae8-a0c0-20e08429b0af"
    
    success = refresh_property_data(property_id)
    if success:
        print("\n🎉 Property data refreshed successfully!")
        print("   The Property Analysis modal should now show real data.")
    else:
        print("\n💥 Failed to refresh property data!")
        sys.exit(1)
