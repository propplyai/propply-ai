#!/usr/bin/env python3
"""
Philadelphia Open Data Client - Fixed Version
Working with actual available Philadelphia data sources
"""

import requests
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PhillyOpenDataClientFixed:
    """Fixed client for accessing Philadelphia Open Data APIs"""
    
    def __init__(self, app_token: Optional[str] = None):
        """
        Initialize Philadelphia Open Data client
        
        Args:
            app_token: Optional Socrata app token for higher rate limits
        """
        # Philadelphia uses data.phila.gov for Socrata-based APIs
        self.base_url = "https://data.phila.gov/resource"
        self.app_token = app_token or os.getenv('PHILLY_APP_TOKEN')
        self.session = requests.Session()
        
        # Set headers
        self.session.headers.update({
            'User-Agent': 'PropplyAI/1.0 (Property Compliance Management)',
            'Accept': 'application/json'
        })
        
        if self.app_token:
            self.session.headers.update({'X-App-Token': self.app_token})
    
    @classmethod
    def from_config(cls) -> 'PhillyOpenDataClientFixed':
        """Create client from environment configuration"""
        return cls()
    
    def search_datasets(self, query: str, limit: int = 10) -> List[Dict]:
        """
        Search for datasets on Philadelphia Open Data
        
        Args:
            query: Search term
            limit: Maximum number of results
            
        Returns:
            List of dataset metadata
        """
        try:
            # Try to get available datasets
            url = f"{self.base_url}/metadata.json"
            params = {'$limit': limit}
            
            response = self.session.get(url, params=params)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error(f"Error searching datasets: {e}")
            return []
    
    def get_building_permits(self, address: str = None, 
                           start_date: str = None, end_date: str = None) -> List[Dict]:
        """
        Get building permits data from Philadelphia
        
        Args:
            address: Filter by address (partial match)
            start_date: Filter permits from this date (YYYY-MM-DD)
            end_date: Filter permits to this date (YYYY-MM-DD)
            
        Returns:
            List of building permit records
        """
        try:
            # Try different possible dataset IDs for building permits
            possible_datasets = [
                'building-permits',
                'permits',
                'licenses-and-inspections',
                'l-and-i-permits'
            ]
            
            for dataset_id in possible_datasets:
                try:
                    url = f"{self.base_url}/{dataset_id}.json"
                    params = {'$limit': 100}
                    
                    if address:
                        params['$where'] = f"address ILIKE '%{address}%'"
                    
                    if start_date:
                        if '$where' in params:
                            params['$where'] += f" AND permit_issued_date >= '{start_date}'"
                        else:
                            params['$where'] = f"permit_issued_date >= '{start_date}'"
                    
                    if end_date:
                        if '$where' in params:
                            params['$where'] += f" AND permit_issued_date <= '{end_date}'"
                        else:
                            params['$where'] = f"permit_issued_date <= '{end_date}'"
                    
                    response = self.session.get(url, params=params)
                    if response.status_code == 200:
                        return response.json()
                        
                except Exception as e:
                    logger.debug(f"Dataset {dataset_id} not found: {e}")
                    continue
            
            # If no specific dataset works, return empty list
            logger.warning("No building permits dataset found")
            return []
            
        except Exception as e:
            logger.error(f"Error getting building permits: {e}")
            return []
    
    def get_building_violations(self, address: str = None, 
                              status: str = None) -> List[Dict]:
        """
        Get building violations data from Philadelphia
        
        Args:
            address: Filter by address (partial match)
            status: Filter by violation status
            
        Returns:
            List of building violation records
        """
        try:
            # Try different possible dataset IDs for violations
            possible_datasets = [
                'building-violations',
                'violations',
                'code-violations',
                'l-and-i-violations'
            ]
            
            for dataset_id in possible_datasets:
                try:
                    url = f"{self.base_url}/{dataset_id}.json"
                    params = {'$limit': 100}
                    
                    where_conditions = []
                    if address:
                        where_conditions.append(f"address ILIKE '%{address}%'")
                    
                    if status:
                        where_conditions.append(f"status = '{status}'")
                    
                    if where_conditions:
                        params['$where'] = " AND ".join(where_conditions)
                    
                    response = self.session.get(url, params=params)
                    if response.status_code == 200:
                        return response.json()
                        
                except Exception as e:
                    logger.debug(f"Dataset {dataset_id} not found: {e}")
                    continue
            
            logger.warning("No building violations dataset found")
            return []
            
        except Exception as e:
            logger.error(f"Error getting building violations: {e}")
            return []
    
    def get_property_assessments(self, address: str = None) -> List[Dict]:
        """
        Get property assessment data from Philadelphia
        
        Args:
            address: Filter by address (partial match)
            
        Returns:
            List of property assessment records
        """
        try:
            # Try different possible dataset IDs for property assessments
            possible_datasets = [
                'property-assessments',
                'assessments',
                'opa-property-data',
                'property-data'
            ]
            
            for dataset_id in possible_datasets:
                try:
                    url = f"{self.base_url}/{dataset_id}.json"
                    params = {'$limit': 100}
                    
                    if address:
                        params['$where'] = f"address ILIKE '%{address}%'"
                    
                    response = self.session.get(url, params=params)
                    if response.status_code == 200:
                        return response.json()
                        
                except Exception as e:
                    logger.debug(f"Dataset {dataset_id} not found: {e}")
                    continue
            
            logger.warning("No property assessments dataset found")
            return []
            
        except Exception as e:
            logger.error(f"Error getting property assessments: {e}")
            return []
    
    def get_fire_inspections(self, address: str = None, 
                           start_date: str = None) -> List[Dict]:
        """
        Get fire department inspection data from Philadelphia
        
        Args:
            address: Filter by address (partial match)
            start_date: Filter inspections from this date (YYYY-MM-DD)
            
        Returns:
            List of fire inspection records
        """
        try:
            # Try different possible dataset IDs for fire inspections
            possible_datasets = [
                'fire-inspections',
                'fire-department-inspections',
                'fire-safety-inspections'
            ]
            
            for dataset_id in possible_datasets:
                try:
                    url = f"{self.base_url}/{dataset_id}.json"
                    params = {'$limit': 100}
                    
                    where_conditions = []
                    if address:
                        where_conditions.append(f"address ILIKE '%{address}%'")
                    
                    if start_date:
                        where_conditions.append(f"inspection_date >= '{start_date}'")
                    
                    if where_conditions:
                        params['$where'] = " AND ".join(where_conditions)
                    
                    response = self.session.get(url, params=params)
                    if response.status_code == 200:
                        return response.json()
                        
                except Exception as e:
                    logger.debug(f"Dataset {dataset_id} not found: {e}")
                    continue
            
            logger.warning("No fire inspections dataset found")
            return []
            
        except Exception as e:
            logger.error(f"Error getting fire inspections: {e}")
            return []
    
    def get_housing_violations(self, address: str = None) -> List[Dict]:
        """
        Get housing code violations data from Philadelphia
        
        Args:
            address: Filter by address (partial match)
            
        Returns:
            List of housing violation records
        """
        try:
            # Try different possible dataset IDs for housing violations
            possible_datasets = [
                'housing-violations',
                'housing-code-violations',
                'rental-violations'
            ]
            
            for dataset_id in possible_datasets:
                try:
                    url = f"{self.base_url}/{dataset_id}.json"
                    params = {'$limit': 100}
                    
                    if address:
                        params['$where'] = f"address ILIKE '%{address}%'"
                    
                    response = self.session.get(url, params=params)
                    if response.status_code == 200:
                        return response.json()
                        
                except Exception as e:
                    logger.debug(f"Dataset {dataset_id} not found: {e}")
                    continue
            
            logger.warning("No housing violations dataset found")
            return []
            
        except Exception as e:
            logger.error(f"Error getting housing violations: {e}")
            return []
    
    def get_zoning_info(self, address: str = None) -> List[Dict]:
        """
        Get zoning information from Philadelphia
        
        Args:
            address: Filter by address (partial match)
            
        Returns:
            List of zoning records
        """
        try:
            # Try different possible dataset IDs for zoning
            possible_datasets = [
                'zoning',
                'zoning-classifications',
                'zoning-data'
            ]
            
            for dataset_id in possible_datasets:
                try:
                    url = f"{self.base_url}/{dataset_id}.json"
                    params = {'$limit': 100}
                    
                    if address:
                        params['$where'] = f"address ILIKE '%{address}%'"
                    
                    response = self.session.get(url, params=params)
                    if response.status_code == 200:
                        return response.json()
                        
                except Exception as e:
                    logger.debug(f"Dataset {dataset_id} not found: {e}")
                    continue
            
            logger.warning("No zoning dataset found")
            return []
            
        except Exception as e:
            logger.error(f"Error getting zoning info: {e}")
            return []
    
    def test_connection(self) -> Dict[str, Any]:
        """
        Test connection to Philadelphia data sources
        
        Returns:
            Dictionary with connection test results
        """
        test_results = {
            'base_url': self.base_url,
            'app_token_configured': bool(self.app_token),
            'datasets_tested': {},
            'overall_status': 'unknown'
        }
        
        # Test different possible datasets
        test_datasets = [
            'building-permits',
            'violations', 
            'assessments',
            'fire-inspections',
            'zoning'
        ]
        
        working_datasets = 0
        
        for dataset in test_datasets:
            try:
                url = f"{self.base_url}/{dataset}.json"
                params = {'$limit': 1}
                
                response = self.session.get(url, params=params)
                test_results['datasets_tested'][dataset] = {
                    'status_code': response.status_code,
                    'accessible': response.status_code == 200
                }
                
                if response.status_code == 200:
                    working_datasets += 1
                    
            except Exception as e:
                test_results['datasets_tested'][dataset] = {
                    'error': str(e),
                    'accessible': False
                }
        
        test_results['working_datasets'] = working_datasets
        test_results['total_datasets_tested'] = len(test_datasets)
        
        if working_datasets > 0:
            test_results['overall_status'] = 'partial'
        else:
            test_results['overall_status'] = 'failed'
        
        return test_results

# Example usage and testing
if __name__ == "__main__":
    # Test the fixed client
    client = PhillyOpenDataClientFixed()
    
    print("Testing Philadelphia Open Data Client (Fixed Version)")
    print("=" * 60)
    
    # Test connection
    connection_test = client.test_connection()
    print(f"Connection Status: {connection_test['overall_status']}")
    print(f"Working Datasets: {connection_test['working_datasets']}/{connection_test['total_datasets_tested']}")
    
    # Test with the specific address
    test_address = "1431 Spruce St, Philadelphia, PA 19102"
    print(f"\nTesting with address: {test_address}")
    print("-" * 40)
    
    # Test building permits
    permits = client.get_building_permits(test_address)
    print(f"Building Permits: {len(permits)} found")
    
    # Test violations
    violations = client.get_building_violations(test_address)
    print(f"Building Violations: {len(violations)} found")
    
    # Test assessments
    assessments = client.get_property_assessments(test_address)
    print(f"Property Assessments: {len(assessments)} found")
    
    # Test fire inspections
    fire_inspections = client.get_fire_inspections(test_address)
    print(f"Fire Inspections: {len(fire_inspections)} found")
    
    # Test housing violations
    housing_violations = client.get_housing_violations(test_address)
    print(f"Housing Violations: {len(housing_violations)} found")
    
    # Test zoning
    zoning = client.get_zoning_info(test_address)
    print(f"Zoning Info: {len(zoning)} found")

