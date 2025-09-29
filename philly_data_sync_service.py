#!/usr/bin/env python3
"""
Philadelphia Data Synchronization Service
Automatically syncs data from Philadelphia Open Data APIs to Supabase database
Based on comprehensive research of available datasets
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import json
from dataclasses import dataclass
from supabase import create_client, Client
from philly_enhanced_data_client import PhillyEnhancedDataClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class SyncConfig:
    """Configuration for data synchronization"""
    sync_permits: bool = True
    sync_violations: bool = True
    sync_certifications: bool = True
    sync_certification_summary: bool = True
    sync_investigations: bool = True
    sync_unsafe_buildings: bool = True
    sync_dangerous_buildings: bool = True
    days_back: int = 30  # How many days back to sync
    batch_size: int = 100  # Batch size for database operations
    rate_limit_delay: float = 1.0  # Delay between API calls in seconds

class PhillyDataSyncService:
    """
    Service for synchronizing Philadelphia Open Data with Supabase database
    """
    
    def __init__(self, supabase_url: str, supabase_key: str, app_token: Optional[str] = None):
        """
        Initialize the sync service
        
        Args:
            supabase_url: Supabase project URL
            supabase_key: Supabase anon key
            app_token: Optional Philadelphia app token for higher rate limits
        """
        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.philly_client = PhillyEnhancedDataClient(app_token)
        self.config = SyncConfig()
        
    async def sync_property_data(self, property_id: str, address: str, 
                               config: Optional[SyncConfig] = None) -> Dict[str, Any]:
        """
        Sync all Philadelphia data for a specific property
        
        Args:
            property_id: Supabase property ID
            address: Property address
            config: Optional sync configuration
            
        Returns:
            Dictionary with sync results
        """
        if config is None:
            config = self.config
            
        logger.info(f"Starting sync for property {property_id}: {address}")
        
        sync_results = {
            'property_id': property_id,
            'address': address,
            'sync_started_at': datetime.now().isoformat(),
            'results': {},
            'errors': []
        }
        
        try:
            # Get comprehensive data from Philadelphia APIs
            comprehensive_data = self.philly_client.get_comprehensive_property_data(address)
            
            if 'error' in comprehensive_data:
                sync_results['errors'].append(f"API Error: {comprehensive_data['error']}")
                return sync_results
            
            # Sync permits
            if config.sync_permits and comprehensive_data.get('permits', {}).get('records'):
                try:
                    permits_result = await self._sync_permits(property_id, comprehensive_data['permits']['records'])
                    sync_results['results']['permits'] = permits_result
                except Exception as e:
                    sync_results['errors'].append(f"Permits sync error: {str(e)}")
            
            # Sync violations
            if config.sync_violations and comprehensive_data.get('violations', {}).get('records'):
                try:
                    violations_result = await self._sync_violations(property_id, comprehensive_data['violations']['records'])
                    sync_results['results']['violations'] = violations_result
                except Exception as e:
                    sync_results['errors'].append(f"Violations sync error: {str(e)}")
            
            # Sync certifications
            if config.sync_certifications and comprehensive_data.get('certifications', {}).get('records'):
                try:
                    certs_result = await self._sync_certifications(property_id, comprehensive_data['certifications']['records'])
                    sync_results['results']['certifications'] = certs_result
                except Exception as e:
                    sync_results['errors'].append(f"Certifications sync error: {str(e)}")
            
            # Sync certification summary
            if config.sync_certification_summary and comprehensive_data.get('certification_summary', {}).get('records'):
                try:
                    cert_summary_result = await self._sync_certification_summary(property_id, comprehensive_data['certification_summary']['records'])
                    sync_results['results']['certification_summary'] = cert_summary_result
                except Exception as e:
                    sync_results['errors'].append(f"Certification summary sync error: {str(e)}")
            
            # Sync investigations
            if config.sync_investigations and comprehensive_data.get('investigations', {}).get('records'):
                try:
                    investigations_result = await self._sync_investigations(property_id, comprehensive_data['investigations']['records'])
                    sync_results['results']['investigations'] = investigations_result
                except Exception as e:
                    sync_results['errors'].append(f"Investigations sync error: {str(e)}")
            
            # Update property compliance score
            try:
                await self._update_property_compliance_score(property_id, comprehensive_data.get('compliance_summary', {}))
            except Exception as e:
                sync_results['errors'].append(f"Compliance score update error: {str(e)}")
            
            sync_results['sync_completed_at'] = datetime.now().isoformat()
            sync_results['success'] = len(sync_results['errors']) == 0
            
            logger.info(f"Sync completed for property {property_id}: {len(sync_results['errors'])} errors")
            
        except Exception as e:
            sync_results['errors'].append(f"General sync error: {str(e)}")
            sync_results['sync_completed_at'] = datetime.now().isoformat()
            sync_results['success'] = False
            logger.error(f"Sync failed for property {property_id}: {str(e)}")
        
        return sync_results
    
    async def _sync_permits(self, property_id: str, permits_data: List[Dict]) -> Dict[str, Any]:
        """Sync permits data to database"""
        logger.info(f"Syncing {len(permits_data)} permits for property {property_id}")
        
        synced_count = 0
        updated_count = 0
        errors = []
        
        for permit in permits_data:
            try:
                # Prepare permit data for database
                permit_record = {
                    'property_id': property_id,
                    'permit_number': permit.get('permitnumber', ''),
                    'permit_type': permit.get('permittype', ''),
                    'permit_issued_date': self._parse_date(permit.get('permitissuedate')),
                    'application_date': self._parse_date(permit.get('applicationdate')),
                    'permit_description': permit.get('permitdescription', ''),
                    'work_type': permit.get('worktype', ''),
                    'contractor': permit.get('contractor', ''),
                    'contractor_license': permit.get('contractorlicense', ''),
                    'status': permit.get('status', ''),
                    'address': permit.get('address', ''),
                    'bin': permit.get('bin', ''),
                    'opa_account': permit.get('opa_account', ''),
                    'raw_data': permit
                }
                
                # Check if permit already exists
                existing = self.supabase.table('philly_li_permits').select('id').eq('property_id', property_id).eq('permit_number', permit_record['permit_number']).execute()
                
                if existing.data:
                    # Update existing record
                    self.supabase.table('philly_li_permits').update(permit_record).eq('id', existing.data[0]['id']).execute()
                    updated_count += 1
                else:
                    # Insert new record
                    self.supabase.table('philly_li_permits').insert(permit_record).execute()
                    synced_count += 1
                
                # Rate limiting
                await asyncio.sleep(self.config.rate_limit_delay)
                
            except Exception as e:
                errors.append(f"Permit {permit.get('permitnumber', 'unknown')}: {str(e)}")
        
        return {
            'synced': synced_count,
            'updated': updated_count,
            'errors': errors
        }
    
    async def _sync_violations(self, property_id: str, violations_data: List[Dict]) -> Dict[str, Any]:
        """Sync violations data to database"""
        logger.info(f"Syncing {len(violations_data)} violations for property {property_id}")
        
        synced_count = 0
        updated_count = 0
        errors = []
        
        for violation in violations_data:
            try:
                # Prepare violation data for database
                violation_record = {
                    'property_id': property_id,
                    'violation_id': violation.get('violationid', ''),
                    'violation_date': self._parse_date(violation.get('violationdate')),
                    'violation_type': violation.get('violationtype', ''),
                    'violation_code': violation.get('violationcode', ''),
                    'violation_description': violation.get('violationdescription', ''),
                    'status': violation.get('status', ''),
                    'compliance_date': self._parse_date(violation.get('compliance_date')),
                    'inspector': violation.get('inspector', ''),
                    'address': violation.get('address', ''),
                    'bin': violation.get('bin', ''),
                    'opa_account': violation.get('opa_account', ''),
                    'raw_data': violation
                }
                
                # Check if violation already exists
                existing = self.supabase.table('philly_li_violations').select('id').eq('property_id', property_id).eq('violation_id', violation_record['violation_id']).execute()
                
                if existing.data:
                    # Update existing record
                    self.supabase.table('philly_li_violations').update(violation_record).eq('id', existing.data[0]['id']).execute()
                    updated_count += 1
                else:
                    # Insert new record
                    self.supabase.table('philly_li_violations').insert(violation_record).execute()
                    synced_count += 1
                
                # Rate limiting
                await asyncio.sleep(self.config.rate_limit_delay)
                
            except Exception as e:
                errors.append(f"Violation {violation.get('violationid', 'unknown')}: {str(e)}")
        
        return {
            'synced': synced_count,
            'updated': updated_count,
            'errors': errors
        }
    
    async def _sync_certifications(self, property_id: str, certifications_data: List[Dict]) -> Dict[str, Any]:
        """Sync certifications data to database"""
        logger.info(f"Syncing {len(certifications_data)} certifications for property {property_id}")
        
        synced_count = 0
        updated_count = 0
        errors = []
        
        for cert in certifications_data:
            try:
                # Prepare certification data for database
                cert_record = {
                    'property_id': property_id,
                    'certification_number': cert.get('certification_number', ''),
                    'certification_type': cert.get('cert_type', ''),
                    'last_inspection_date': self._parse_date(cert.get('last_inspection_date')),
                    'inspection_result': cert.get('inspection_result', ''),
                    'expiration_date': self._parse_date(cert.get('expiration_date')),
                    'inspector_company': cert.get('inspector_company', ''),
                    'inspector_address': cert.get('inspector_address', ''),
                    'address': cert.get('address', ''),
                    'bin': cert.get('bin', ''),
                    'raw_data': cert
                }
                
                # Check if certification already exists
                existing = self.supabase.table('philly_building_certifications').select('id').eq('property_id', property_id).eq('certification_number', cert_record['certification_number']).execute()
                
                if existing.data:
                    # Update existing record
                    self.supabase.table('philly_building_certifications').update(cert_record).eq('id', existing.data[0]['id']).execute()
                    updated_count += 1
                else:
                    # Insert new record
                    self.supabase.table('philly_building_certifications').insert(cert_record).execute()
                    synced_count += 1
                
                # Rate limiting
                await asyncio.sleep(self.config.rate_limit_delay)
                
            except Exception as e:
                errors.append(f"Certification {cert.get('certification_number', 'unknown')}: {str(e)}")
        
        return {
            'synced': synced_count,
            'updated': updated_count,
            'errors': errors
        }
    
    async def _sync_certification_summary(self, property_id: str, cert_summary_data: List[Dict]) -> Dict[str, Any]:
        """Sync certification summary data to database"""
        logger.info(f"Syncing {len(cert_summary_data)} certification summaries for property {property_id}")
        
        synced_count = 0
        updated_count = 0
        errors = []
        
        for summary in cert_summary_data:
            try:
                # Prepare certification summary data for database
                summary_record = {
                    'property_id': property_id,
                    'structure_id': summary.get('structure_id', ''),
                    'address': summary.get('address', ''),
                    'sprinkler_status': summary.get('sprinkler_status', ''),
                    'sprinkler_casefile': summary.get('sprinkler_casefile', ''),
                    'fire_alarm_status': summary.get('fire_alarm_status', ''),
                    'fire_alarm_casefile': summary.get('fire_alarm_casefile', ''),
                    'standpipe_status': summary.get('standpipe_status', ''),
                    'standpipe_casefile': summary.get('standpipe_casefile', ''),
                    'smoke_control_status': summary.get('smoke_control_status', ''),
                    'smoke_control_casefile': summary.get('smoke_control_casefile', ''),
                    'facade_status': summary.get('facade_status', ''),
                    'facade_casefile': summary.get('facade_casefile', ''),
                    'fire_escape_status': summary.get('fire_escape_status', ''),
                    'fire_escape_casefile': summary.get('fire_escape_casefile', ''),
                    'private_bridge_status': summary.get('private_bridge_status', ''),
                    'private_bridge_casefile': summary.get('private_bridge_casefile', ''),
                    'pier_status': summary.get('pier_status', ''),
                    'pier_casefile': summary.get('pier_casefile', ''),
                    'emer_stdby_pwr_sys_status': summary.get('emer_stdby_pwr_sys_status', ''),
                    'emer_stdby_pwr_sys_casefile': summary.get('emer_stdby_pwr_sys_casefile', ''),
                    'damper_status': summary.get('damper_status', ''),
                    'damper_casefile': summary.get('damper_casefile', ''),
                    'special_hazards_status': summary.get('special_hazards_status', ''),
                    'special_hazards_casefile': summary.get('special_hazards_casefile', ''),
                    'raw_data': summary
                }
                
                # Check if certification summary already exists
                existing = self.supabase.table('philly_building_certification_summary').select('id').eq('property_id', property_id).eq('structure_id', summary_record['structure_id']).execute()
                
                if existing.data:
                    # Update existing record
                    self.supabase.table('philly_building_certification_summary').update(summary_record).eq('id', existing.data[0]['id']).execute()
                    updated_count += 1
                else:
                    # Insert new record
                    self.supabase.table('philly_building_certification_summary').insert(summary_record).execute()
                    synced_count += 1
                
                # Rate limiting
                await asyncio.sleep(self.config.rate_limit_delay)
                
            except Exception as e:
                errors.append(f"Certification summary {summary.get('structure_id', 'unknown')}: {str(e)}")
        
        return {
            'synced': synced_count,
            'updated': updated_count,
            'errors': errors
        }
    
    async def _sync_investigations(self, property_id: str, investigations_data: List[Dict]) -> Dict[str, Any]:
        """Sync investigations data to database"""
        logger.info(f"Syncing {len(investigations_data)} investigations for property {property_id}")
        
        synced_count = 0
        updated_count = 0
        errors = []
        
        for investigation in investigations_data:
            try:
                # Prepare investigation data for database
                investigation_record = {
                    'property_id': property_id,
                    'case_id': investigation.get('caseid', ''),
                    'investigation_completed_date': self._parse_date(investigation.get('investigationcompleted')),
                    'investigation_type': investigation.get('investigationtype', ''),
                    'outcome': investigation.get('outcome', ''),
                    'violation_issued': investigation.get('violation_issued', False),
                    'violation_id': investigation.get('violation_id', ''),
                    'inspector': investigation.get('inspector', ''),
                    'address': investigation.get('address', ''),
                    'bin': investigation.get('bin', ''),
                    'opa_account': investigation.get('opa_account', ''),
                    'raw_data': investigation
                }
                
                # Check if investigation already exists
                existing = self.supabase.table('philly_case_investigations').select('id').eq('property_id', property_id).eq('case_id', investigation_record['case_id']).execute()
                
                if existing.data:
                    # Update existing record
                    self.supabase.table('philly_case_investigations').update(investigation_record).eq('id', existing.data[0]['id']).execute()
                    updated_count += 1
                else:
                    # Insert new record
                    self.supabase.table('philly_case_investigations').insert(investigation_record).execute()
                    synced_count += 1
                
                # Rate limiting
                await asyncio.sleep(self.config.rate_limit_delay)
                
            except Exception as e:
                errors.append(f"Investigation {investigation.get('caseid', 'unknown')}: {str(e)}")
        
        return {
            'synced': synced_count,
            'updated': updated_count,
            'errors': errors
        }
    
    async def _update_property_compliance_score(self, property_id: str, compliance_summary: Dict[str, Any]):
        """Update property compliance score based on synced data"""
        try:
            compliance_score = compliance_summary.get('compliance_score', 0)
            total_violations = compliance_summary.get('total_violations', 0)
            open_violations = compliance_summary.get('open_violations', 0)
            recent_permits = compliance_summary.get('recent_permits', 0)
            
            # Update property record
            self.supabase.table('properties').update({
                'compliance_score': compliance_score,
                'last_compliance_check': datetime.now().isoformat()
            }).eq('id', property_id).execute()
            
            logger.info(f"Updated compliance score for property {property_id}: {compliance_score}")
            
        except Exception as e:
            logger.error(f"Error updating compliance score for property {property_id}: {str(e)}")
            raise
    
    def _parse_date(self, date_str: Optional[str]) -> Optional[str]:
        """Parse date string to ISO format"""
        if not date_str:
            return None
        
        try:
            # Try different date formats
            for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%dT%H:%M:%S.%f']:
                try:
                    parsed_date = datetime.strptime(date_str, fmt)
                    return parsed_date.date().isoformat()
                except ValueError:
                    continue
            
            # If no format works, return None
            return None
            
        except Exception:
            return None
    
    async def sync_all_philadelphia_properties(self, config: Optional[SyncConfig] = None) -> Dict[str, Any]:
        """
        Sync data for all Philadelphia properties in the database
        
        Args:
            config: Optional sync configuration
            
        Returns:
            Dictionary with overall sync results
        """
        if config is None:
            config = self.config
        
        logger.info("Starting sync for all Philadelphia properties")
        
        # Get all Philadelphia properties
        properties_response = self.supabase.table('properties').select('id, address').eq('city', 'Philadelphia').execute()
        properties = properties_response.data
        
        if not properties:
            logger.warning("No Philadelphia properties found in database")
            return {
                'total_properties': 0,
                'successful_syncs': 0,
                'failed_syncs': 0,
                'errors': ['No Philadelphia properties found']
            }
        
        logger.info(f"Found {len(properties)} Philadelphia properties to sync")
        
        sync_results = {
            'total_properties': len(properties),
            'successful_syncs': 0,
            'failed_syncs': 0,
            'property_results': [],
            'errors': []
        }
        
        # Sync each property
        for property_data in properties:
            try:
                property_id = property_data['id']
                address = property_data['address']
                
                result = await self.sync_property_data(property_id, address, config)
                sync_results['property_results'].append(result)
                
                if result['success']:
                    sync_results['successful_syncs'] += 1
                else:
                    sync_results['failed_syncs'] += 1
                    sync_results['errors'].extend(result['errors'])
                
                # Add delay between properties to respect rate limits
                await asyncio.sleep(self.config.rate_limit_delay * 2)
                
            except Exception as e:
                sync_results['failed_syncs'] += 1
                sync_results['errors'].append(f"Property {property_data.get('id', 'unknown')}: {str(e)}")
                logger.error(f"Error syncing property {property_data.get('id', 'unknown')}: {str(e)}")
        
        logger.info(f"Sync completed: {sync_results['successful_syncs']} successful, {sync_results['failed_syncs']} failed")
        
        return sync_results
    
    async def schedule_regular_sync(self, interval_hours: int = 24):
        """
        Schedule regular data synchronization
        
        Args:
            interval_hours: Hours between sync runs
        """
        logger.info(f"Scheduling regular sync every {interval_hours} hours")
        
        while True:
            try:
                logger.info("Starting scheduled sync")
                results = await self.sync_all_philadelphia_properties()
                logger.info(f"Scheduled sync completed: {results['successful_syncs']} successful, {results['failed_syncs']} failed")
                
            except Exception as e:
                logger.error(f"Scheduled sync failed: {str(e)}")
            
            # Wait for next sync
            await asyncio.sleep(interval_hours * 3600)

# Example usage and testing
async def main():
    """Example usage of the sync service"""
    
    # Initialize the sync service
    supabase_url = os.getenv('REACT_APP_SUPABASE_URL')
    supabase_key = os.getenv('REACT_APP_SUPABASE_ANON_KEY')
    philly_token = os.getenv('PHILLY_APP_TOKEN')
    
    if not supabase_url or not supabase_key:
        logger.error("Missing Supabase configuration")
        return
    
    sync_service = PhillyDataSyncService(supabase_url, supabase_key, philly_token)
    
    # Test API connectivity
    logger.info("Testing API connectivity...")
    connectivity_test = sync_service.philly_client.test_api_connectivity()
    logger.info(f"API Connectivity: {connectivity_test['overall_status']}")
    
    # Test sync for a specific property
    test_address = "1431 Spruce St, Philadelphia, PA 19102"
    logger.info(f"Testing sync for: {test_address}")
    
    # You would need to get a real property ID from your database
    # For testing, we'll use a placeholder
    test_property_id = "test-property-id"
    
    # Sync the property
    result = await sync_service.sync_property_data(test_property_id, test_address)
    logger.info(f"Sync result: {result}")

if __name__ == "__main__":
    asyncio.run(main())

