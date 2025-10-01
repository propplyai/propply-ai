#!/usr/bin/env python3
"""
NYC Data Sync Service - Syncs NYC Open Data to Supabase
Orchestrates fetching from NYC APIs and storing in Supabase database
"""

import os
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from dataclasses import dataclass
from supabase import create_client, Client
from nyc_opendata_client import NYCOpenDataClient
from nyc_property_finder_enhanced import NYCPropertyFinder
import pandas as pd

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class SyncConfig:
    """Configuration for NYC data sync"""
    sync_violations: bool = True
    sync_equipment: bool = True
    sync_complaints: bool = True
    sync_permits: bool = True
    max_records: int = 500
    rate_limit_delay: float = 1.0


class NYCDataSyncService:
    """
    Service for synchronizing NYC Open Data with Supabase database
    
    Complete pipeline:
    1. Fetch data from NYC Open Data APIs
    2. Store in Supabase tables (nyc_properties, nyc_dob_violations, etc.)
    3. Calculate compliance scores
    4. Return analysis results
    """
    
    def __init__(self, supabase_url: str = None, supabase_key: str = None):
        """
        Initialize the sync service
        
        Args:
            supabase_url: Supabase project URL (or from env)
            supabase_key: Supabase anon key (or from env)
        """
        supabase_url = supabase_url or os.getenv('SUPABASE_URL')
        supabase_key = supabase_key or os.getenv('SUPABASE_ANON_KEY')
        
        if not supabase_url or not supabase_key:
            raise ValueError("Supabase credentials not found. Set SUPABASE_URL and SUPABASE_ANON_KEY")
        
        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.nyc_client = NYCOpenDataClient.from_config()
        self.nyc_finder = NYCPropertyFinder()
        self.config = SyncConfig()
    
    def sync_property_data(self, property_id: str, address: str, 
                          bin_number: str = None, bbl: str = None,
                          config: Optional[SyncConfig] = None) -> Dict[str, Any]:
        """
        Main sync method - Fetches all NYC data and stores in Supabase
        
        Args:
            property_id: Supabase property UUID
            address: Property address
            bin_number: Building Identification Number (optional)
            bbl: Borough-Block-Lot (optional)
            config: Sync configuration
            
        Returns:
            Dictionary with sync results and compliance data
        """
        if config is None:
            config = self.config
            
        logger.info(f"Starting NYC sync for property {property_id}: {address}")
        
        sync_results = {
            'property_id': property_id,
            'address': address,
            'sync_started_at': datetime.now().isoformat(),
            'results': {},
            'errors': []
        }
        
        try:
            # Step 1: Get or create NYC property record
            nyc_property = self._get_or_create_nyc_property(
                property_id, address, bin_number, bbl
            )
            
            if not nyc_property:
                sync_results['errors'].append('Failed to create NYC property record')
                return sync_results
            
            sync_results['nyc_property_id'] = nyc_property['id']
            sync_results['bin'] = nyc_property.get('bin')
            sync_results['bbl'] = nyc_property.get('bbl')
            
            # Step 2: Fetch comprehensive data from NYC Open Data
            logger.info(f"Fetching NYC data for BIN: {nyc_property.get('bin')}")
            nyc_data = self.nyc_client.get_comprehensive_property_data(
                address=address,
                bin_number=nyc_property.get('bin'),
                bbl=nyc_property.get('bbl')
            )
            
            # Step 3: Sync DOB Violations
            if config.sync_violations and 'violations' in nyc_data:
                dob_result = self._sync_dob_violations(
                    nyc_property['id'], 
                    nyc_data['violations'].get('dob', pd.DataFrame())
                )
                sync_results['results']['dob_violations'] = dob_result
                
                # Sync HPD Violations
                hpd_result = self._sync_hpd_violations(
                    nyc_property['id'],
                    nyc_data['violations'].get('hpd', pd.DataFrame())
                )
                sync_results['results']['hpd_violations'] = hpd_result
            
            # Step 4: Sync Equipment (Elevators & Boilers)
            if config.sync_equipment:
                if 'elevator_inspections' in nyc_data:
                    elevator_result = self._sync_elevator_inspections(
                        nyc_property['id'],
                        nyc_data['elevator_inspections']
                    )
                    sync_results['results']['elevators'] = elevator_result
                
                if 'boiler_inspections' in nyc_data:
                    boiler_result = self._sync_boiler_inspections(
                        nyc_property['id'],
                        nyc_data['boiler_inspections']
                    )
                    sync_results['results']['boilers'] = boiler_result
            
            # Step 5: Sync 311 Complaints
            if config.sync_complaints and 'complaints_311' in nyc_data:
                complaints_result = self._sync_311_complaints(
                    nyc_property['id'],
                    nyc_data['complaints_311']
                )
                sync_results['results']['complaints_311'] = complaints_result
            
            # Step 6: Calculate and store compliance summary
            compliance_data = self.nyc_finder.get_property_compliance(
                address=address,
                bin_number=nyc_property.get('bin'),
                bbl=nyc_property.get('bbl')
            )
            
            compliance_summary = self._store_compliance_summary(
                nyc_property['id'],
                property_id,
                compliance_data
            )
            sync_results['compliance'] = compliance_summary
            
            # Step 7: Update last sync timestamp
            self.supabase.table('nyc_properties').update({
                'last_synced_at': datetime.now().isoformat()
            }).eq('id', nyc_property['id']).execute()
            
            sync_results['sync_completed_at'] = datetime.now().isoformat()
            sync_results['success'] = True
            
            logger.info(f"✅ NYC sync completed for {address}")
            
        except Exception as e:
            logger.error(f"Error syncing NYC data: {e}", exc_info=True)
            sync_results['errors'].append(str(e))
            sync_results['success'] = False
        
        return sync_results
    
    def _get_or_create_nyc_property(self, property_id: str, address: str,
                                   bin_number: str = None, bbl: str = None) -> Optional[Dict]:
        """Get existing or create new NYC property record"""
        try:
            # Check if NYC property already exists
            if bin_number:
                result = self.supabase.table('nyc_properties')\
                    .select('*')\
                    .eq('property_id', property_id)\
                    .eq('bin', bin_number)\
                    .execute()
                
                if result.data and len(result.data) > 0:
                    logger.info(f"Found existing NYC property: {bin_number}")
                    return result.data[0]
            
            # If no BIN provided, try to find it
            if not bin_number:
                logger.info(f"Searching for BIN for address: {address}")
                matches = self.nyc_finder.search_property(address)
                if matches and len(matches) > 0:
                    best_match = matches[0]
                    bin_number = best_match.get('bin')
                    bbl = best_match.get('bbl')
                    logger.info(f"Found BIN: {bin_number}, BBL: {bbl}")
            
            # Create new NYC property record
            nyc_property_data = {
                'property_id': property_id,
                'bin': bin_number,
                'bbl': bbl,
                'address': address,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            result = self.supabase.table('nyc_properties')\
                .insert(nyc_property_data)\
                .execute()
            
            if result.data and len(result.data) > 0:
                logger.info(f"✅ Created NYC property record")
                return result.data[0]
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting/creating NYC property: {e}")
            return None
    
    def _sync_dob_violations(self, nyc_property_id: str, violations_df: pd.DataFrame) -> Dict:
        """Sync DOB violations to Supabase"""
        try:
            if violations_df.empty:
                logger.info("No DOB violations to sync")
                return {'synced': 0, 'skipped': 0}
            
            synced = 0
            skipped = 0
            
            for _, violation in violations_df.iterrows():
                try:
                    # Check if violation already exists
                    violation_id = str(violation.get('isndobbisviol', ''))
                    if not violation_id:
                        skipped += 1
                        continue
                    
                    existing = self.supabase.table('nyc_dob_violations')\
                        .select('id')\
                        .eq('violation_id', violation_id)\
                        .execute()
                    
                    if existing.data and len(existing.data) > 0:
                        skipped += 1
                        continue
                    
                    # Insert new violation
                    violation_data = {
                        'nyc_property_id': nyc_property_id,
                        'violation_id': violation_id,
                        'bin': str(violation.get('bin', '')),
                        'issue_date': str(violation.get('issue_date', ''))[:10] if pd.notna(violation.get('issue_date')) else None,
                        'violation_type': str(violation.get('violation_type', '')),
                        'violation_type_code': str(violation.get('violation_type_code', '')),
                        'violation_category': str(violation.get('violation_category', '')),
                        'disposition_date': str(violation.get('disposition_date', ''))[:10] if pd.notna(violation.get('disposition_date')) else None,
                        'created_at': datetime.now().isoformat()
                    }
                    
                    self.supabase.table('nyc_dob_violations').insert(violation_data).execute()
                    synced += 1
                    
                except Exception as e:
                    logger.warning(f"Error syncing individual DOB violation: {e}")
                    skipped += 1
            
            logger.info(f"✅ DOB Violations: {synced} synced, {skipped} skipped")
            return {'synced': synced, 'skipped': skipped}
            
        except Exception as e:
            logger.error(f"Error syncing DOB violations: {e}")
            return {'error': str(e)}
    
    def _sync_hpd_violations(self, nyc_property_id: str, violations_df: pd.DataFrame) -> Dict:
        """Sync HPD violations to Supabase"""
        try:
            if violations_df.empty:
                logger.info("No HPD violations to sync")
                return {'synced': 0, 'skipped': 0}
            
            synced = 0
            skipped = 0
            
            for _, violation in violations_df.iterrows():
                try:
                    violation_id = str(violation.get('violationid', ''))
                    if not violation_id:
                        skipped += 1
                        continue
                    
                    # Check if exists
                    existing = self.supabase.table('nyc_hpd_violations')\
                        .select('id')\
                        .eq('violation_id', violation_id)\
                        .execute()
                    
                    if existing.data and len(existing.data) > 0:
                        skipped += 1
                        continue
                    
                    violation_data = {
                        'nyc_property_id': nyc_property_id,
                        'violation_id': violation_id,
                        'bbl': str(violation.get('bbl', '')),
                        'inspection_date': str(violation.get('inspectiondate', ''))[:10] if pd.notna(violation.get('inspectiondate')) else None,
                        'violation_class': str(violation.get('class', '')),
                        'violation_status': str(violation.get('currentstatus', '')),
                        'created_at': datetime.now().isoformat()
                    }
                    
                    self.supabase.table('nyc_hpd_violations').insert(violation_data).execute()
                    synced += 1
                    
                except Exception as e:
                    logger.warning(f"Error syncing individual HPD violation: {e}")
                    skipped += 1
            
            logger.info(f"✅ HPD Violations: {synced} synced, {skipped} skipped")
            return {'synced': synced, 'skipped': skipped}
            
        except Exception as e:
            logger.error(f"Error syncing HPD violations: {e}")
            return {'error': str(e)}
    
    def _sync_elevator_inspections(self, nyc_property_id: str, inspections_df: pd.DataFrame) -> Dict:
        """Sync elevator inspections to Supabase"""
        try:
            if inspections_df.empty:
                logger.info("No elevator inspections to sync")
                return {'synced': 0, 'skipped': 0}
            
            synced = 0
            skipped = 0
            
            for _, inspection in inspections_df.iterrows():
                try:
                    device_number = str(inspection.get('device_number', ''))
                    if not device_number:
                        skipped += 1
                        continue
                    
                    # Check if exists
                    existing = self.supabase.table('nyc_elevator_inspections')\
                        .select('id')\
                        .eq('device_number', device_number)\
                        .eq('nyc_property_id', nyc_property_id)\
                        .execute()
                    
                    inspection_data = {
                        'nyc_property_id': nyc_property_id,
                        'device_number': device_number,
                        'bin': str(inspection.get('bin', '')),
                        'device_type': str(inspection.get('device_type', '')),
                        'last_inspection_date': str(inspection.get('last_inspection_date', ''))[:10] if pd.notna(inspection.get('last_inspection_date')) else None,
                        'device_status': str(inspection.get('device_status', '')),
                        'updated_at': datetime.now().isoformat()
                    }
                    
                    if existing.data and len(existing.data) > 0:
                        # Update existing
                        self.supabase.table('nyc_elevator_inspections')\
                            .update(inspection_data)\
                            .eq('id', existing.data[0]['id'])\
                            .execute()
                    else:
                        # Insert new
                        inspection_data['created_at'] = datetime.now().isoformat()
                        self.supabase.table('nyc_elevator_inspections').insert(inspection_data).execute()
                    
                    synced += 1
                    
                except Exception as e:
                    logger.warning(f"Error syncing elevator inspection: {e}")
                    skipped += 1
            
            logger.info(f"✅ Elevator Inspections: {synced} synced, {skipped} skipped")
            return {'synced': synced, 'skipped': skipped, 'total_devices': len(inspections_df)}
            
        except Exception as e:
            logger.error(f"Error syncing elevator inspections: {e}")
            return {'error': str(e)}
    
    def _sync_boiler_inspections(self, nyc_property_id: str, inspections_df: pd.DataFrame) -> Dict:
        """Sync boiler inspections to Supabase"""
        try:
            if inspections_df.empty:
                logger.info("No boiler inspections to sync")
                return {'synced': 0, 'skipped': 0}
            
            synced = 0
            skipped = 0
            
            for _, inspection in inspections_df.iterrows():
                try:
                    device_number = str(inspection.get('device_number', ''))
                    if not device_number:
                        skipped += 1
                        continue
                    
                    existing = self.supabase.table('nyc_boiler_inspections')\
                        .select('id')\
                        .eq('device_number', device_number)\
                        .eq('nyc_property_id', nyc_property_id)\
                        .execute()
                    
                    inspection_data = {
                        'nyc_property_id': nyc_property_id,
                        'device_number': device_number,
                        'bin': str(inspection.get('bin', '')),
                        'inspection_date': str(inspection.get('inspection_date', ''))[:10] if pd.notna(inspection.get('inspection_date')) else None,
                        'status': str(inspection.get('status', '')),
                        'updated_at': datetime.now().isoformat()
                    }
                    
                    if existing.data and len(existing.data) > 0:
                        self.supabase.table('nyc_boiler_inspections')\
                            .update(inspection_data)\
                            .eq('id', existing.data[0]['id'])\
                            .execute()
                    else:
                        inspection_data['created_at'] = datetime.now().isoformat()
                        self.supabase.table('nyc_boiler_inspections').insert(inspection_data).execute()
                    
                    synced += 1
                    
                except Exception as e:
                    logger.warning(f"Error syncing boiler inspection: {e}")
                    skipped += 1
            
            logger.info(f"✅ Boiler Inspections: {synced} synced, {skipped} skipped")
            return {'synced': synced, 'skipped': skipped, 'total_devices': len(inspections_df)}
            
        except Exception as e:
            logger.error(f"Error syncing boiler inspections: {e}")
            return {'error': str(e)}
    
    def _sync_311_complaints(self, nyc_property_id: str, complaints_df: pd.DataFrame) -> Dict:
        """Sync 311 complaints to Supabase"""
        try:
            if complaints_df.empty:
                logger.info("No 311 complaints to sync")
                return {'synced': 0, 'skipped': 0}
            
            synced = 0
            skipped = 0
            
            for _, complaint in complaints_df.iterrows():
                try:
                    unique_key = str(complaint.get('unique_key', ''))
                    if not unique_key:
                        skipped += 1
                        continue
                    
                    existing = self.supabase.table('nyc_311_complaints')\
                        .select('id')\
                        .eq('unique_key', unique_key)\
                        .execute()
                    
                    if existing.data and len(existing.data) > 0:
                        skipped += 1
                        continue
                    
                    complaint_data = {
                        'nyc_property_id': nyc_property_id,
                        'unique_key': unique_key,
                        'created_date': str(complaint.get('created_date', ''))[:10] if pd.notna(complaint.get('created_date')) else None,
                        'complaint_type': str(complaint.get('complaint_type', '')),
                        'descriptor': str(complaint.get('descriptor', '')),
                        'status': str(complaint.get('status', '')),
                        'created_at': datetime.now().isoformat()
                    }
                    
                    self.supabase.table('nyc_311_complaints').insert(complaint_data).execute()
                    synced += 1
                    
                except Exception as e:
                    logger.warning(f"Error syncing 311 complaint: {e}")
                    skipped += 1
            
            logger.info(f"✅ 311 Complaints: {synced} synced, {skipped} skipped")
            return {'synced': synced, 'skipped': skipped}
            
        except Exception as e:
            logger.error(f"Error syncing 311 complaints: {e}")
            return {'error': str(e)}
    
    def _store_compliance_summary(self, nyc_property_id: str, property_id: str, 
                                 compliance_data: Dict) -> Dict:
        """Store calculated compliance summary"""
        try:
            summary = compliance_data.get('compliance_summary', {})
            
            summary_data = {
                'nyc_property_id': nyc_property_id,
                'property_id': property_id,
                'compliance_score': summary.get('compliance_score', 0),
                'risk_level': summary.get('risk_level', 'UNKNOWN'),
                'total_violations': summary.get('total_violations', 0),
                'open_violations': summary.get('open_violations', 0),
                'critical_issues': summary.get('critical_issues', 0),
                'equipment_status': summary.get('equipment_status', 'UNKNOWN'),
                'last_calculated': datetime.now().isoformat()
            }
            
            # Check if summary exists
            existing = self.supabase.table('nyc_compliance_summary')\
                .select('id')\
                .eq('nyc_property_id', nyc_property_id)\
                .execute()
            
            if existing.data and len(existing.data) > 0:
                # Update
                self.supabase.table('nyc_compliance_summary')\
                    .update(summary_data)\
                    .eq('id', existing.data[0]['id'])\
                    .execute()
            else:
                # Insert
                self.supabase.table('nyc_compliance_summary').insert(summary_data).execute()
            
            logger.info(f"✅ Compliance Summary: Score {summary_data['compliance_score']}, Risk {summary_data['risk_level']}")
            return summary_data
            
        except Exception as e:
            logger.error(f"Error storing compliance summary: {e}")
            return {'error': str(e)}
    
    def get_property_compliance_data(self, property_id: str) -> Dict[str, Any]:
        """
        Retrieve all stored NYC compliance data for a property from Supabase
        
        Args:
            property_id: Supabase property UUID
            
        Returns:
            Complete compliance data package for frontend
        """
        try:
            # Get NYC property
            nyc_prop = self.supabase.table('nyc_properties')\
                .select('*')\
                .eq('property_id', property_id)\
                .execute()
            
            if not nyc_prop.data or len(nyc_prop.data) == 0:
                return {'error': 'NYC property not found'}
            
            nyc_property = nyc_prop.data[0]
            nyc_property_id = nyc_property['id']
            
            # Get compliance summary
            summary = self.supabase.table('nyc_compliance_summary')\
                .select('*')\
                .eq('nyc_property_id', nyc_property_id)\
                .execute()
            
            # Get DOB violations
            dob_violations = self.supabase.table('nyc_dob_violations')\
                .select('*')\
                .eq('nyc_property_id', nyc_property_id)\
                .execute()
            
            # Get HPD violations
            hpd_violations = self.supabase.table('nyc_hpd_violations')\
                .select('*')\
                .eq('nyc_property_id', nyc_property_id)\
                .execute()
            
            # Get elevator inspections
            elevators = self.supabase.table('nyc_elevator_inspections')\
                .select('*')\
                .eq('nyc_property_id', nyc_property_id)\
                .execute()
            
            # Get boiler inspections
            boilers = self.supabase.table('nyc_boiler_inspections')\
                .select('*')\
                .eq('nyc_property_id', nyc_property_id)\
                .execute()
            
            # Get 311 complaints
            complaints = self.supabase.table('nyc_311_complaints')\
                .select('*')\
                .eq('nyc_property_id', nyc_property_id)\
                .order('created_date', desc=True)\
                .limit(50)\
                .execute()
            
            return {
                'success': True,
                'property': nyc_property,
                'compliance_summary': summary.data[0] if summary.data else None,
                'dob_violations': dob_violations.data or [],
                'hpd_violations': hpd_violations.data or [],
                'elevators': elevators.data or [],
                'boilers': boilers.data or [],
                'complaints_311': complaints.data or []
            }
            
        except Exception as e:
            logger.error(f"Error retrieving compliance data: {e}")
            return {'error': str(e)}


# Example usage
if __name__ == "__main__":
    # Initialize service
    sync_service = NYCDataSyncService()
    
    # Test sync for a NYC property
    test_property_id = "test-uuid-123"
    test_address = "666 Broadway, New York, NY 10012"
    
    print(f"🗽 Testing NYC Data Sync for: {test_address}")
    print("=" * 60)
    
    # Sync the property
    result = sync_service.sync_property_data(
        property_id=test_property_id,
        address=test_address
    )
    
    print(f"\n✅ Sync Result:")
    print(f"   Success: {result.get('success')}")
    print(f"   BIN: {result.get('bin')}")
    print(f"   Compliance Score: {result.get('compliance', {}).get('compliance_score')}")
    print(f"   Risk Level: {result.get('compliance', {}).get('risk_level')}")
    print(f"\n📊 Data Synced:")
    for key, value in result.get('results', {}).items():
        print(f"   {key}: {value}")

