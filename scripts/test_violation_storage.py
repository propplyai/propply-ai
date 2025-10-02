#!/usr/bin/env python3
"""
Test Violation Storage
Quick test to manually store violations and see what happens
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

def test_violation_storage():
    """Test storing violations manually"""
    
    # Supabase credentials
    supabase_url = "https://vlnnvxlgzhtaorpixsay.supabase.co"
    supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsbm52eGxnemh0YW9ycGl4c2F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMTE1NjgsImV4cCI6MjA3NDc4NzU2OH0.yGC82Qop5M_CSA48nXpwC15HxrqqW7CugFIb-17nxG0"
    
    supabase: Client = create_client(supabase_url, supabase_key)
    
    # Test property ID
    nyc_property_id = "3e5fff14-af70-4dce-81ab-c654c4a18055"
    
    print("🧪 Testing violation storage...")
    
    # Create a test violation record
    test_violation = {
        'nyc_property_id': nyc_property_id,
        'violation_id': f"TEST-DOB-{datetime.now().timestamp()}",
        'bin': '1001234',
        'bbl': '1001234001',
        'issue_date': '2024-01-15',
        'violation_type': 'Construction',
        'violation_type_code': 'C01',
        'violation_description': 'Test violation for debugging',
        'violation_category': 'Construction',
        'violation_status': 'OPEN',
        'disposition_date': None,
        'disposition_comments': None,
        'house_number': '140',
        'street': 'W 28TH ST',
        'borough': 'Manhattan'
    }
    
    try:
        print("📝 Inserting test violation...")
        response = supabase.table('nyc_dob_violations').insert([test_violation]).execute()
        
        if response.data:
            print(f"✅ Successfully stored test violation: {response.data[0]['id']}")
            
            # Check if it was stored
            check_response = supabase.table('nyc_dob_violations').select('*').eq('nyc_property_id', nyc_property_id).execute()
            print(f"📊 Total violations for property: {len(check_response.data)}")
            
            return True
        else:
            print("❌ Failed to store test violation")
            return False
            
    except Exception as e:
        print(f"❌ Error storing test violation: {e}")
        return False

if __name__ == '__main__':
    success = test_violation_storage()
    if success:
        print("\n🎉 Test completed successfully!")
    else:
        print("\n💥 Test failed!")
        sys.exit(1)
