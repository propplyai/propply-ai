#!/usr/bin/env python3
"""
Auto Sync on Property Add
This script can be called when a new property is added to automatically sync NYC data

Usage:
    python scripts/auto_sync_on_property_add.py --property-id "uuid" --address "123 Main St, New York, NY"
"""

import sys
import os
import argparse
import logging
from datetime import datetime

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.trigger_nyc_data_sync import NYCDataSyncTrigger

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def auto_sync_property(property_id: str, address: str, bin_number: str = None, bbl: str = None):
    """
    Automatically sync NYC data when a property is added
    
    This function can be called from:
    1. Frontend after property creation
    2. Backend API endpoint
    3. Supabase webhook/trigger
    4. Manual script execution
    """
    try:
        logger.info(f"🚀 Auto-syncing NYC data for new property: {property_id}")
        logger.info(f"📍 Address: {address}")
        
        # Initialize sync trigger
        sync_trigger = NYCDataSyncTrigger()
        
        # Run comprehensive sync
        result = sync_trigger.sync_property_data(
            property_id=property_id,
            address=address,
            bin_number=bin_number,
            bbl=bbl
        )
        
        if result['success']:
            logger.info("✅ Auto-sync completed successfully")
            return {
                'success': True,
                'message': 'NYC data synced automatically',
                'data': result['results']
            }
        else:
            logger.error(f"❌ Auto-sync failed: {result['error']}")
            return {
                'success': False,
                'error': result['error'],
                'message': 'Auto-sync failed'
            }
            
    except Exception as e:
        logger.error(f"❌ Auto-sync error: {e}", exc_info=True)
        return {
            'success': False,
            'error': str(e),
            'message': 'Auto-sync error'
        }

def main():
    """Main function for command line usage"""
    parser = argparse.ArgumentParser(description='Auto-sync NYC data for a new property')
    parser.add_argument('--property-id', required=True, help='Property ID (UUID)')
    parser.add_argument('--address', required=True, help='Property address')
    parser.add_argument('--bin', help='Building Identification Number (optional)')
    parser.add_argument('--bbl', help='Borough, Block, Lot identifier (optional)')
    parser.add_argument('--verbose', '-v', action='store_true', help='Enable verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    print("🚀 Auto-Sync NYC Data for New Property")
    print("=" * 50)
    print(f"Property ID: {args.property_id}")
    print(f"Address: {args.address}")
    print(f"BIN: {args.bin or 'Not provided'}")
    print(f"BBL: {args.bbl or 'Not provided'}")
    print("=" * 50)
    
    # Run auto-sync
    result = auto_sync_property(
        property_id=args.property_id,
        address=args.address,
        bin_number=args.bin,
        bbl=args.bbl
    )
    
    if result['success']:
        print("\n✅ Auto-sync completed successfully!")
        print(f"📊 Message: {result['message']}")
        
        if 'data' in result:
            data = result['data']
            print(f"\n📋 Sync Results:")
            print(f"  • NYC Property ID: {data.get('nyc_property_id', 'N/A')}")
            print(f"  • Sync Timestamp: {data.get('sync_timestamp', 'N/A')}")
            
            if 'compliance_summary' in data:
                summary = data['compliance_summary']
                print(f"  • Compliance Score: {summary.get('compliance_score', 0)}%")
                print(f"  • Risk Level: {summary.get('risk_level', 'UNKNOWN')}")
        
        print("\n🎉 Property is now ready with comprehensive NYC compliance data!")
        return 0
    else:
        print(f"\n❌ Auto-sync failed: {result['error']}")
        print(f"   Message: {result['message']}")
        return 1

if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code)
