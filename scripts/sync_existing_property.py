#!/usr/bin/env python3
"""
Sync NYC Data for Existing Property
Quick script to sync NYC data for the property that's showing "no data"

Usage:
    python scripts/sync_existing_property.py
"""

import sys
import os
import logging
from datetime import datetime

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.trigger_nyc_data_sync import NYCDataSyncTrigger

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    """Sync NYC data for the existing property showing 'no data'"""
    
    # Property details from the image - "140 W 28th St, New York, NY 10001, USA"
    property_id = "ef5b8538-7fcb-4ba6-b7ac-579ff51f2fa6"  # From our earlier query
    address = "140 W 28th St, New York, NY 10001, USA"
    bin_number = "1001234"  # We can try to find this or leave as None
    bbl = "1001234001"  # We can try to find this or leave as None
    
    print("🗽 NYC Data Sync for Existing Property")
    print("=" * 50)
    print(f"Property ID: {property_id}")
    print(f"Address: {address}")
    print(f"BIN: {bin_number}")
    print(f"BBL: {bbl}")
    print("=" * 50)
    
    try:
        # Initialize the sync trigger
        print("🔧 Initializing NYC Data Sync Trigger...")
        sync_trigger = NYCDataSyncTrigger()
        
        # Run the sync
        print("🚀 Starting comprehensive NYC data sync...")
        result = sync_trigger.sync_property_data(
            property_id=property_id,
            address=address,
            bin_number=bin_number,
            bbl=bbl
        )
        
        if result['success']:
            print("\n✅ NYC data sync completed successfully!")
            print("\n📊 Sync Results:")
            print(f"  • NYC Property ID: {result['results']['nyc_property_id']}")
            print(f"  • Sync Timestamp: {result['results']['sync_timestamp']}")
            
            if 'data_sources' in result['results']:
                data_sources = result['results']['data_sources']
                print("\n📋 Data Sources:")
                
                if 'violations' in data_sources:
                    violations = data_sources['violations']
                    print(f"  • DOB Violations: {violations.get('dob_count', 0)}")
                    print(f"  • HPD Violations: {violations.get('hpd_count', 0)}")
                
                if 'elevator_inspections' in data_sources:
                    elevators = data_sources['elevator_inspections']
                    print(f"  • Elevator Inspections: {elevators.get('count', 0)}")
                
                if 'boiler_inspections' in data_sources:
                    boilers = data_sources['boiler_inspections']
                    print(f"  • Boiler Inspections: {boilers.get('count', 0)}")
                
                if 'complaints_311' in data_sources:
                    complaints = data_sources['complaints_311']
                    print(f"  • 311 Complaints: {complaints.get('count', 0)}")
            
            if 'compliance_summary' in result['results']:
                summary = result['results']['compliance_summary']
                print(f"\n📊 Compliance Summary:")
                print(f"  • Compliance Score: {summary.get('compliance_score', 0)}%")
                print(f"  • Risk Level: {summary.get('risk_level', 'UNKNOWN')}")
                print(f"  • Total Violations: {summary.get('total_violations', 0)}")
                print(f"  • Equipment Issues: {summary.get('equipment_issues', 0)}")
            
            print("\n🎉 The Property Analysis Results modal should now show real data!")
            print("   Refresh the modal to see the updated compliance information.")
            
        else:
            print(f"\n❌ NYC data sync failed: {result['error']}")
            print(f"   Message: {result['message']}")
            return 1
            
    except Exception as e:
        logger.error(f"❌ Script failed: {e}", exc_info=True)
        print(f"\n❌ Script failed: {e}")
        return 1
    
    return 0

if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code)
