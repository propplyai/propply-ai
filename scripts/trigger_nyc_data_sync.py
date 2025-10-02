#!/usr/bin/env python3
"""
NYC Data Sync Trigger Script
Automatically fetches and stores comprehensive NYC compliance data for properties

Usage:
    python scripts/trigger_nyc_data_sync.py --property-id "uuid" --address "140 W 28th St, New York, NY 10001"
    python scripts/trigger_nyc_data_sync.py --property-id "uuid" --address "140 W 28th St, New York, NY 10001" --bin "1001234"
    python scripts/trigger_nyc_data_sync.py --property-id "uuid" --address "140 W 28th St, New York, NY 10001" --bin "1001234" --bbl "1001234001"
"""

import sys
import os
import argparse
import logging
from datetime import datetime
from typing import Dict, Any, Optional

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from nyc_opendata_client import NYCOpenDataClient
from supabase import create_client, Client

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class NYCDataSyncTrigger:
    """
    Triggers comprehensive NYC data sync for a property
    """
    
    def __init__(self):
        """Initialize the sync trigger with Supabase and NYC Open Data client"""
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_ANON_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required")
        
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        self.nyc_client = NYCOpenDataClient()
        
        logger.info("✅ NYC Data Sync Trigger initialized")
    
    def sync_property_data(self, property_id: str, address: str, bin_number: Optional[str] = None, 
                          bbl: Optional[str] = None) -> Dict[str, Any]:
        """
        Sync comprehensive NYC data for a property
        
        Args:
            property_id: UUID of the property in Supabase
            address: Property address
            bin_number: Building Identification Number (optional)
            bbl: Borough, Block, Lot identifier (optional)
            
        Returns:
            Dictionary with sync results
        """
        logger.info(f"🗽 Starting comprehensive NYC data sync for property {property_id}")
        logger.info(f"📍 Address: {address}")
        logger.info(f"🏢 BIN: {bin_number or 'Not provided'}")
        logger.info(f"📋 BBL: {bbl or 'Not provided'}")
        
        try:
            # Step 1: Create or get NYC property record
            nyc_property = self._get_or_create_nyc_property(property_id, address, bin_number, bbl)
            logger.info(f"✅ NYC property record: {nyc_property['id']}")
            
            # Step 2: Fetch comprehensive data from NYC Open Data
            logger.info("🔍 Fetching comprehensive NYC data...")
            comprehensive_data = self.nyc_client.get_comprehensive_property_data(
                address=address,
                bin_number=bin_number,
                bbl=bbl
            )
            
            # Step 3: Store all the data
            results = {
                'nyc_property_id': nyc_property['id'],
                'address': address,
                'sync_timestamp': datetime.now().isoformat(),
                'data_sources': {}
            }
            
            # Store violations
            if 'violations' in comprehensive_data:
                violations_result = self._store_violations(nyc_property['id'], comprehensive_data['violations'])
                results['data_sources']['violations'] = violations_result
                logger.info(f"📋 Violations stored: DOB={violations_result.get('dob_count', 0)}, HPD={violations_result.get('hpd_count', 0)}")
            
            # Store equipment inspections
            if 'elevator_inspections' in comprehensive_data:
                elevator_result = self._store_elevator_inspections(nyc_property['id'], comprehensive_data['elevator_inspections'])
                results['data_sources']['elevator_inspections'] = elevator_result
                logger.info(f"🛗 Elevator inspections stored: {elevator_result.get('count', 0)}")
            
            if 'boiler_inspections' in comprehensive_data:
                boiler_result = self._store_boiler_inspections(nyc_property['id'], comprehensive_data['boiler_inspections'])
                results['data_sources']['boiler_inspections'] = boiler_result
                logger.info(f"🔥 Boiler inspections stored: {boiler_result.get('count', 0)}")
            
            # Store 311 complaints
            if 'complaints_311' in comprehensive_data:
                complaints_result = self._store_311_complaints(nyc_property['id'], comprehensive_data['complaints_311'])
                results['data_sources']['complaints_311'] = complaints_result
                logger.info(f"📞 311 complaints stored: {complaints_result.get('count', 0)}")
            
            # Step 4: Create compliance summary
            compliance_summary = self._create_compliance_summary(nyc_property['id'])
            results['compliance_summary'] = compliance_summary
            logger.info(f"📊 Compliance summary: {compliance_summary['compliance_score']}% score, {compliance_summary['risk_level']} risk")
            
            # Step 5: Update sync timestamp
            self._update_sync_timestamp(nyc_property['id'])
            
            logger.info("✅ Comprehensive NYC data sync completed successfully")
            return {
                'success': True,
                'message': 'NYC data synced successfully',
                'results': results
            }
            
        except Exception as e:
            logger.error(f"❌ NYC data sync failed: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'message': 'NYC data sync failed'
            }
    
    def _get_or_create_nyc_property(self, property_id: str, address: str, 
                                   bin_number: Optional[str], bbl: Optional[str]) -> Dict[str, Any]:
        """Get or create NYC property record"""
        try:
            # Check if NYC property already exists
            response = self.supabase.table('nyc_properties').select('*').eq('property_id', property_id).execute()
            
            if response.data and len(response.data) > 0:
                logger.info("📋 NYC property record already exists")
                return response.data[0]
            
            # Create new NYC property record
            nyc_property_data = {
                'property_id': property_id,
                'address': address,
                'bin': bin_number,
                'bbl': bbl,
                'borough': self._detect_borough(address),
                'last_synced_at': datetime.now().isoformat()
            }
            
            response = self.supabase.table('nyc_properties').insert(nyc_property_data).execute()
            
            if response.data and len(response.data) > 0:
                logger.info("✅ NYC property record created")
                return response.data[0]
            else:
                raise Exception("Failed to create NYC property record")
                
        except Exception as e:
            logger.error(f"❌ Error creating NYC property record: {e}")
            raise
    
    def _store_violations(self, nyc_property_id: str, violations_data: Dict[str, Any]) -> Dict[str, int]:
        """Store DOB and HPD violations"""
        results = {'dob_count': 0, 'hpd_count': 0}
        
        try:
            # Store DOB violations
            if 'dob_violations' in violations_data and violations_data['dob_violations'] is not None:
                dob_violations = violations_data['dob_violations']
                if hasattr(dob_violations, 'to_dict'):  # DataFrame
                    dob_violations = dob_violations.to_dict('records')
                
                if dob_violations:
                    violation_records = []
                    for violation in dob_violations:
                        violation_records.append({
                            'nyc_property_id': nyc_property_id,
                            'violation_id': violation.get('violation_number', f"DOB-{datetime.now().timestamp()}"),
                            'bin': violation.get('bin'),
                            'bbl': violation.get('bbl'),
                            'issue_date': violation.get('issue_date'),
                            'violation_type': violation.get('violation_type'),
                            'violation_type_code': violation.get('violation_type_code'),
                            'violation_description': violation.get('description'),
                            'violation_category': violation.get('violation_category'),
                            'violation_status': 'OPEN' if not violation.get('disposition_date') else 'RESOLVED',
                            'disposition_date': violation.get('disposition_date'),
                            'disposition_comments': violation.get('disposition_comments'),
                            'house_number': violation.get('house_number'),
                            'street': violation.get('street'),
                            'borough': violation.get('boro')
                        })
                    
                    if violation_records:
                        self.supabase.table('nyc_dob_violations').insert(violation_records).execute()
                        results['dob_count'] = len(violation_records)
                        logger.info(f"✅ Stored {len(violation_records)} DOB violations")
            
            # Store HPD violations
            if 'hpd_violations' in violations_data and violations_data['hpd_violations'] is not None:
                hpd_violations = violations_data['hpd_violations']
                if hasattr(hpd_violations, 'to_dict'):  # DataFrame
                    hpd_violations = hpd_violations.to_dict('records')
                
                if hpd_violations:
                    violation_records = []
                    for violation in hpd_violations:
                        violation_records.append({
                            'nyc_property_id': nyc_property_id,
                            'violation_id': violation.get('violationid'),
                            'building_id': violation.get('buildingid'),
                            'bbl': violation.get('bbl'),
                            'inspection_date': violation.get('inspectiondate'),
                            'violation_description': violation.get('violationdescription'),
                            'violation_class': violation.get('class'),
                            'violation_category': violation.get('category'),
                            'violation_status': violation.get('status'),
                            'current_status_date': violation.get('currentstatusdate'),
                            'apartment': violation.get('apartment'),
                            'story': violation.get('story'),
                            'house_number': violation.get('housenumber'),
                            'street_name': violation.get('streetname'),
                            'borough_id': violation.get('boroid')
                        })
                    
                    if violation_records:
                        self.supabase.table('nyc_hpd_violations').insert(violation_records).execute()
                        results['hpd_count'] = len(violation_records)
                        logger.info(f"✅ Stored {len(violation_records)} HPD violations")
            
            return results
            
        except Exception as e:
            logger.error(f"❌ Error storing violations: {e}")
            return results
    
    def _store_elevator_inspections(self, nyc_property_id: str, elevator_data) -> Dict[str, int]:
        """Store elevator inspection data"""
        try:
            if elevator_data is None or (hasattr(elevator_data, 'empty') and elevator_data.empty):
                return {'count': 0}
            
            if hasattr(elevator_data, 'to_dict'):  # DataFrame
                elevator_data = elevator_data.to_dict('records')
            
            if not elevator_data:
                return {'count': 0}
            
            inspection_records = []
            for inspection in elevator_data:
                inspection_records.append({
                    'nyc_property_id': nyc_property_id,
                    'device_number': inspection.get('device_number', f"ELEV-{datetime.now().timestamp()}"),
                    'bin': inspection.get('bin'),
                    'device_type': inspection.get('device_type', 'Elevator'),
                    'device_status': inspection.get('device_status', 'ACTIVE'),
                    'last_inspection_date': inspection.get('last_inspection_date'),
                    'next_inspection_date': inspection.get('next_inspection_date'),
                    'inspection_result': inspection.get('inspection_result'),
                    'borough': inspection.get('borough'),
                    'house_number': inspection.get('house_number'),
                    'street_name': inspection.get('street_name')
                })
            
            if inspection_records:
                self.supabase.table('nyc_elevator_inspections').insert(inspection_records).execute()
                logger.info(f"✅ Stored {len(inspection_records)} elevator inspections")
                return {'count': len(inspection_records)}
            
            return {'count': 0}
            
        except Exception as e:
            logger.error(f"❌ Error storing elevator inspections: {e}")
            return {'count': 0}
    
    def _store_boiler_inspections(self, nyc_property_id: str, boiler_data) -> Dict[str, int]:
        """Store boiler inspection data"""
        try:
            if boiler_data is None or (hasattr(boiler_data, 'empty') and boiler_data.empty):
                return {'count': 0}
            
            if hasattr(boiler_data, 'to_dict'):  # DataFrame
                boiler_data = boiler_data.to_dict('records')
            
            if not boiler_data:
                return {'count': 0}
            
            inspection_records = []
            for inspection in boiler_data:
                inspection_records.append({
                    'nyc_property_id': nyc_property_id,
                    'device_number': inspection.get('device_number', f"BOIL-{datetime.now().timestamp()}"),
                    'bin': inspection.get('bin'),
                    'boiler_type': inspection.get('boiler_type', 'Boiler'),
                    'inspection_date': inspection.get('inspection_date'),
                    'inspection_result': inspection.get('inspection_result'),
                    'next_inspection_date': inspection.get('next_inspection_date'),
                    'property_type': inspection.get('property_type'),
                    'borough': inspection.get('borough'),
                    'house_number': inspection.get('house_number'),
                    'street_name': inspection.get('street_name')
                })
            
            if inspection_records:
                self.supabase.table('nyc_boiler_inspections').insert(inspection_records).execute()
                logger.info(f"✅ Stored {len(inspection_records)} boiler inspections")
                return {'count': len(inspection_records)}
            
            return {'count': 0}
            
        except Exception as e:
            logger.error(f"❌ Error storing boiler inspections: {e}")
            return {'count': 0}
    
    def _store_311_complaints(self, nyc_property_id: str, complaints_data) -> Dict[str, int]:
        """Store 311 complaints data"""
        try:
            if complaints_data is None or (hasattr(complaints_data, 'empty') and complaints_data.empty):
                return {'count': 0}
            
            if hasattr(complaints_data, 'to_dict'):  # DataFrame
                complaints_data = complaints_data.to_dict('records')
            
            if not complaints_data:
                return {'count': 0}
            
            complaint_records = []
            for complaint in complaints_data:
                complaint_records.append({
                    'nyc_property_id': nyc_property_id,
                    'complaint_id': complaint.get('unique_key'),
                    'created_date': complaint.get('created_date'),
                    'complaint_type': complaint.get('complaint_type'),
                    'descriptor': complaint.get('descriptor'),
                    'incident_address': complaint.get('incident_address'),
                    'borough': complaint.get('borough'),
                    'status': complaint.get('status'),
                    'resolution_description': complaint.get('resolution_description'),
                    'latitude': complaint.get('latitude'),
                    'longitude': complaint.get('longitude')
                })
            
            if complaint_records:
                self.supabase.table('nyc_311_complaints').insert(complaint_records).execute()
                logger.info(f"✅ Stored {len(complaint_records)} 311 complaints")
                return {'count': len(complaint_records)}
            
            return {'count': 0}
            
        except Exception as e:
            logger.error(f"❌ Error storing 311 complaints: {e}")
            return {'count': 0}
    
    def _create_compliance_summary(self, nyc_property_id: str) -> Dict[str, Any]:
        """Create compliance summary based on stored data"""
        try:
            # Get violation counts
            dob_response = self.supabase.table('nyc_dob_violations').select('id').eq('nyc_property_id', nyc_property_id).execute()
            hpd_response = self.supabase.table('nyc_hpd_violations').select('id').eq('nyc_property_id', nyc_property_id).execute()
            
            # Get equipment counts
            elevator_response = self.supabase.table('nyc_elevator_inspections').select('id, device_status').eq('nyc_property_id', nyc_property_id).execute()
            boiler_response = self.supabase.table('nyc_boiler_inspections').select('id, inspection_result').eq('nyc_property_id', nyc_property_id).execute()
            
            # Get 311 complaints
            complaints_response = self.supabase.table('nyc_311_complaints').select('id').eq('nyc_property_id', nyc_property_id).execute()
            
            dob_count = len(dob_response.data) if dob_response.data else 0
            hpd_count = len(hpd_response.data) if hpd_response.data else 0
            elevator_count = len(elevator_response.data) if elevator_response.data else 0
            boiler_count = len(boiler_response.data) if boiler_response.data else 0
            complaints_count = len(complaints_response.data) if complaints_response.data else 0
            
            total_violations = dob_count + hpd_count
            equipment_issues = sum(1 for e in (elevator_response.data or []) if e.get('device_status') == 'FAIL') + \
                              sum(1 for b in (boiler_response.data or []) if b.get('inspection_result') == 'FAIL')
            
            # Calculate compliance score
            compliance_score = 100
            compliance_score -= (total_violations * 5)  # -5 points per violation
            compliance_score -= (equipment_issues * 10)  # -10 points per equipment failure
            compliance_score -= (complaints_count * 2)  # -2 points per 311 complaint
            compliance_score = max(0, compliance_score)
            
            risk_level = 'LOW' if compliance_score > 80 else 'MEDIUM' if compliance_score > 60 else 'HIGH'
            
            # Create or update compliance summary
            summary_data = {
                'nyc_property_id': nyc_property_id,
                'compliance_score': compliance_score,
                'risk_level': risk_level,
                'total_violations': total_violations,
                'open_violations': total_violations,  # Simplified
                'dob_violations': dob_count,
                'hpd_violations': hpd_count,
                'equipment_issues': equipment_issues,
                'open_311_complaints': complaints_count,
                'fire_safety_issues': 0,
                'last_analyzed_at': datetime.now().isoformat()
            }
            
            # Insert or update compliance summary
            self.supabase.table('nyc_compliance_summary').upsert(summary_data).execute()
            
            logger.info(f"📊 Compliance summary: {compliance_score}% score, {risk_level} risk")
            return summary_data
            
        except Exception as e:
            logger.error(f"❌ Error creating compliance summary: {e}")
            return {}
    
    def _update_sync_timestamp(self, nyc_property_id: str):
        """Update the last synced timestamp"""
        try:
            self.supabase.table('nyc_properties').update({
                'last_synced_at': datetime.now().isoformat()
            }).eq('id', nyc_property_id).execute()
            logger.info("✅ Updated sync timestamp")
        except Exception as e:
            logger.error(f"❌ Error updating sync timestamp: {e}")
    
    def _detect_borough(self, address: str) -> str:
        """Detect borough from address"""
        address_upper = address.upper()
        if 'MANHATTAN' in address_upper or 'NYC' in address_upper:
            return 'Manhattan'
        elif 'BROOKLYN' in address_upper:
            return 'Brooklyn'
        elif 'QUEENS' in address_upper:
            return 'Queens'
        elif 'BRONX' in address_upper:
            return 'Bronx'
        elif 'STATEN' in address_upper:
            return 'Staten Island'
        else:
            return 'Manhattan'  # Default


def main():
    """Main function to run the NYC data sync"""
    parser = argparse.ArgumentParser(description='Trigger NYC data sync for a property')
    parser.add_argument('--property-id', required=True, help='Property ID (UUID)')
    parser.add_argument('--address', required=True, help='Property address')
    parser.add_argument('--bin', help='Building Identification Number (optional)')
    parser.add_argument('--bbl', help='Borough, Block, Lot identifier (optional)')
    parser.add_argument('--verbose', '-v', action='store_true', help='Enable verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    try:
        # Initialize the sync trigger
        sync_trigger = NYCDataSyncTrigger()
        
        # Run the sync
        result = sync_trigger.sync_property_data(
            property_id=args.property_id,
            address=args.address,
            bin_number=args.bin,
            bbl=args.bbl
        )
        
        if result['success']:
            print("✅ NYC data sync completed successfully!")
            print(f"📊 Results: {result['results']}")
        else:
            print(f"❌ NYC data sync failed: {result['error']}")
            sys.exit(1)
            
    except Exception as e:
        logger.error(f"❌ Script failed: {e}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    main()
