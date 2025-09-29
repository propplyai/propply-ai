#!/usr/bin/env python3
"""
Mechanical Systems Data Client
Specialized client for accessing elevator, boiler, and electrical inspection data
for both NYC and Philadelphia properties
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

class MechanicalSystemsClient:
    """Client for accessing mechanical systems inspection data"""
    
    def __init__(self, city='NYC'):
        """
        Initialize mechanical systems client
        
        Args:
            city: 'NYC' or 'PHILADELPHIA'
        """
        self.city = city.upper()
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'PropplyAI/1.0 (Property Compliance Management)',
            'Accept': 'application/json'
        })
        
        if self.city == 'NYC':
            self._setup_nyc_endpoints()
        elif self.city == 'PHILADELPHIA':
            self._setup_philly_endpoints()
        else:
            raise ValueError(f"Unsupported city: {city}")
    
    def _setup_nyc_endpoints(self):
        """Setup NYC-specific API endpoints"""
        self.base_url = "https://data.cityofnewyork.us/resource"
        self.app_token = os.getenv('NYC_APP_TOKEN')
        
        if self.app_token:
            self.session.headers.update({'X-App-Token': self.app_token})
        
        # NYC datasets for mechanical systems
        self.datasets = {
            'building_permits': 'ipu4-2q9a',  # DOB Building Permits
            'electrical_permits': 'fxyw-8mw6',  # DOB Electrical Permits
            'plumbing_permits': '8h7b-9ny9',  # DOB Plumbing Permits
            'mechanical_permits': 'b2iz-pps8',  # DOB Mechanical Permits
            'elevator_permits': '8h7b-9ny9',  # Elevator Permits (subset of plumbing)
            'violations': '3h2n-5cm9',  # DOB Violations
            'complaints': 'b2iz-pps8',  # DOB Complaints
            'inspections': 'ipu4-2q9a'  # Building Inspections
        }
    
    def _setup_philly_endpoints(self):
        """Setup Philadelphia-specific API endpoints"""
        self.base_url = "https://www.opendataphilly.org"
        self.app_token = os.getenv('PHILLY_APP_TOKEN')
        
        if self.app_token:
            self.session.headers.update({'X-App-Token': self.app_token})
        
        # Philadelphia datasets for mechanical systems
        self.datasets = {
            'building_permits': 'building-permits',
            'electrical_permits': 'electrical-permits',
            'mechanical_permits': 'mechanical-permits',
            'violations': 'building-violations',
            'inspections': 'fire-inspections'
        }
    
    def get_elevator_data(self, address: str, bin_number: str = None) -> Dict[str, Any]:
        """
        Get elevator inspection and permit data
        
        Args:
            address: Property address
            bin_number: NYC BIN number (for NYC only)
            
        Returns:
            Dictionary with elevator data
        """
        try:
            elevator_data = {
                'address': address,
                'city': self.city,
                'elevators': [],
                'permits': [],
                'violations': [],
                'inspections': []
            }
            
            if self.city == 'NYC':
                elevator_data.update(self._get_nyc_elevator_data(address, bin_number))
            elif self.city == 'PHILADELPHIA':
                elevator_data.update(self._get_philly_elevator_data(address))
            
            return elevator_data
            
        except Exception as e:
            logger.error(f"Error getting elevator data: {e}")
            return {'error': str(e), 'address': address, 'city': self.city}
    
    def _get_nyc_elevator_data(self, address: str, bin_number: str = None) -> Dict[str, Any]:
        """Get NYC elevator data from DOB datasets"""
        try:
            # Search for elevator-related permits
            where_conditions = []
            if bin_number:
                where_conditions.append(f"bin = '{bin_number}'")
            else:
                where_conditions.append(f"address ILIKE '%{address}%'")
            
            where_conditions.append("(job_type ILIKE '%elevator%' OR job_description ILIKE '%elevator%')")
            where_clause = " AND ".join(where_conditions)
            
            # Get elevator permits
            permits_url = f"{self.base_url}/{self.datasets['building_permits']}.json"
            params = {
                '$where': where_clause,
                '$limit': 100
            }
            
            response = self.session.get(permits_url, params=params)
            response.raise_for_status()
            permits = response.json()
            
            # Get elevator violations
            violations_url = f"{self.base_url}/{self.datasets['violations']}.json"
            violation_params = {
                '$where': f"address ILIKE '%{address}%' AND (violation_type ILIKE '%elevator%' OR description ILIKE '%elevator%')",
                '$limit': 50
            }
            
            response = self.session.get(violations_url, params=violation_params)
            response.raise_for_status()
            violations = response.json()
            
            return {
                'elevator_permits': permits,
                'elevator_violations': violations,
                'data_source': 'NYC DOB'
            }
            
        except Exception as e:
            logger.error(f"Error getting NYC elevator data: {e}")
            return {'error': str(e)}
    
    def _get_philly_elevator_data(self, address: str) -> Dict[str, Any]:
        """Get Philadelphia elevator data from L&I datasets"""
        try:
            # Search for elevator-related permits
            permits_url = f"{self.base_url}/dataset/{self.datasets['building_permits']}.json"
            params = {
                '$where': f"address ILIKE '%{address}%' AND (work_type ILIKE '%elevator%' OR permit_type ILIKE '%elevator%')",
                '$limit': 100
            }
            
            response = self.session.get(permits_url, params=params)
            response.raise_for_status()
            permits = response.json()
            
            # Get elevator violations
            violations_url = f"{self.base_url}/dataset/{self.datasets['violations']}.json"
            violation_params = {
                '$where': f"address ILIKE '%{address}%' AND (violation_type ILIKE '%elevator%' OR description ILIKE '%elevator%')",
                '$limit': 50
            }
            
            response = self.session.get(violations_url, params=violation_params)
            response.raise_for_status()
            violations = response.json()
            
            return {
                'elevator_permits': permits,
                'elevator_violations': violations,
                'data_source': 'Philadelphia L&I'
            }
            
        except Exception as e:
            logger.error(f"Error getting Philadelphia elevator data: {e}")
            return {'error': str(e)}
    
    def get_boiler_data(self, address: str, bin_number: str = None) -> Dict[str, Any]:
        """
        Get boiler inspection and permit data
        
        Args:
            address: Property address
            bin_number: NYC BIN number (for NYC only)
            
        Returns:
            Dictionary with boiler data
        """
        try:
            boiler_data = {
                'address': address,
                'city': self.city,
                'boilers': [],
                'permits': [],
                'violations': [],
                'inspections': []
            }
            
            if self.city == 'NYC':
                boiler_data.update(self._get_nyc_boiler_data(address, bin_number))
            elif self.city == 'PHILADELPHIA':
                boiler_data.update(self._get_philly_boiler_data(address))
            
            return boiler_data
            
        except Exception as e:
            logger.error(f"Error getting boiler data: {e}")
            return {'error': str(e), 'address': address, 'city': self.city}
    
    def _get_nyc_boiler_data(self, address: str, bin_number: str = None) -> Dict[str, Any]:
        """Get NYC boiler data from DOB datasets"""
        try:
            # Search for boiler-related permits
            where_conditions = []
            if bin_number:
                where_conditions.append(f"bin = '{bin_number}'")
            else:
                where_conditions.append(f"address ILIKE '%{address}%'")
            
            where_conditions.append("(job_type ILIKE '%boiler%' OR job_description ILIKE '%boiler%' OR job_type ILIKE '%mechanical%')")
            where_clause = " AND ".join(where_conditions)
            
            # Get boiler permits
            permits_url = f"{self.base_url}/{self.datasets['mechanical_permits']}.json"
            params = {
                '$where': where_clause,
                '$limit': 100
            }
            
            response = self.session.get(permits_url, params=params)
            response.raise_for_status()
            permits = response.json()
            
            # Get boiler violations
            violations_url = f"{self.base_url}/{self.datasets['violations']}.json"
            violation_params = {
                '$where': f"address ILIKE '%{address}%' AND (violation_type ILIKE '%boiler%' OR description ILIKE '%boiler%' OR violation_type ILIKE '%mechanical%')",
                '$limit': 50
            }
            
            response = self.session.get(violations_url, params=violation_params)
            response.raise_for_status()
            violations = response.json()
            
            return {
                'boiler_permits': permits,
                'boiler_violations': violations,
                'data_source': 'NYC DOB'
            }
            
        except Exception as e:
            logger.error(f"Error getting NYC boiler data: {e}")
            return {'error': str(e)}
    
    def _get_philly_boiler_data(self, address: str) -> Dict[str, Any]:
        """Get Philadelphia boiler data from L&I datasets"""
        try:
            # Search for boiler-related permits
            permits_url = f"{self.base_url}/dataset/{self.datasets['mechanical_permits']}.json"
            params = {
                '$where': f"address ILIKE '%{address}%' AND (work_type ILIKE '%boiler%' OR permit_type ILIKE '%mechanical%')",
                '$limit': 100
            }
            
            response = self.session.get(permits_url, params=params)
            response.raise_for_status()
            permits = response.json()
            
            # Get boiler violations
            violations_url = f"{self.base_url}/dataset/{self.datasets['violations']}.json"
            violation_params = {
                '$where': f"address ILIKE '%{address}%' AND (violation_type ILIKE '%boiler%' OR description ILIKE '%mechanical%')",
                '$limit': 50
            }
            
            response = self.session.get(violations_url, params=violation_params)
            response.raise_for_status()
            violations = response.json()
            
            return {
                'boiler_permits': permits,
                'boiler_violations': violations,
                'data_source': 'Philadelphia L&I'
            }
            
        except Exception as e:
            logger.error(f"Error getting Philadelphia boiler data: {e}")
            return {'error': str(e)}
    
    def get_electrical_data(self, address: str, bin_number: str = None) -> Dict[str, Any]:
        """
        Get electrical inspection and permit data
        
        Args:
            address: Property address
            bin_number: NYC BIN number (for NYC only)
            
        Returns:
            Dictionary with electrical data
        """
        try:
            electrical_data = {
                'address': address,
                'city': self.city,
                'electrical_work': [],
                'permits': [],
                'violations': [],
                'inspections': []
            }
            
            if self.city == 'NYC':
                electrical_data.update(self._get_nyc_electrical_data(address, bin_number))
            elif self.city == 'PHILADELPHIA':
                electrical_data.update(self._get_philly_electrical_data(address))
            
            return electrical_data
            
        except Exception as e:
            logger.error(f"Error getting electrical data: {e}")
            return {'error': str(e), 'address': address, 'city': self.city}
    
    def _get_nyc_electrical_data(self, address: str, bin_number: str = None) -> Dict[str, Any]:
        """Get NYC electrical data from DOB datasets"""
        try:
            # Search for electrical permits
            where_conditions = []
            if bin_number:
                where_conditions.append(f"bin = '{bin_number}'")
            else:
                where_conditions.append(f"address ILIKE '%{address}%'")
            
            where_conditions.append("job_type ILIKE '%electrical%'")
            where_clause = " AND ".join(where_conditions)
            
            # Get electrical permits
            permits_url = f"{self.base_url}/{self.datasets['electrical_permits']}.json"
            params = {
                '$where': where_clause,
                '$limit': 100
            }
            
            response = self.session.get(permits_url, params=params)
            response.raise_for_status()
            permits = response.json()
            
            # Get electrical violations
            violations_url = f"{self.base_url}/{self.datasets['violations']}.json"
            violation_params = {
                '$where': f"address ILIKE '%{address}%' AND (violation_type ILIKE '%electrical%' OR description ILIKE '%electrical%')",
                '$limit': 50
            }
            
            response = self.session.get(violations_url, params=violation_params)
            response.raise_for_status()
            violations = response.json()
            
            return {
                'electrical_permits': permits,
                'electrical_violations': violations,
                'data_source': 'NYC DOB'
            }
            
        except Exception as e:
            logger.error(f"Error getting NYC electrical data: {e}")
            return {'error': str(e)}
    
    def _get_philly_electrical_data(self, address: str) -> Dict[str, Any]:
        """Get Philadelphia electrical data from L&I datasets"""
        try:
            # Search for electrical permits
            permits_url = f"{self.base_url}/dataset/{self.datasets['electrical_permits']}.json"
            params = {
                '$where': f"address ILIKE '%{address}%' AND (work_type ILIKE '%electrical%' OR permit_type ILIKE '%electrical%')",
                '$limit': 100
            }
            
            response = self.session.get(permits_url, params=params)
            response.raise_for_status()
            permits = response.json()
            
            # Get electrical violations
            violations_url = f"{self.base_url}/dataset/{self.datasets['violations']}.json"
            violation_params = {
                '$where': f"address ILIKE '%{address}%' AND (violation_type ILIKE '%electrical%' OR description ILIKE '%electrical%')",
                '$limit': 50
            }
            
            response = self.session.get(violations_url, params=violation_params)
            response.raise_for_status()
            violations = response.json()
            
            return {
                'electrical_permits': permits,
                'electrical_violations': violations,
                'data_source': 'Philadelphia L&I'
            }
            
        except Exception as e:
            logger.error(f"Error getting Philadelphia electrical data: {e}")
            return {'error': str(e)}
    
    def get_comprehensive_mechanical_data(self, address: str, bin_number: str = None) -> Dict[str, Any]:
        """
        Get comprehensive mechanical systems data (elevator, boiler, electrical)
        
        Args:
            address: Property address
            bin_number: NYC BIN number (for NYC only)
            
        Returns:
            Dictionary with all mechanical systems data
        """
        try:
            comprehensive_data = {
                'address': address,
                'city': self.city,
                'generated_at': datetime.now().isoformat(),
                'elevator_data': {},
                'boiler_data': {},
                'electrical_data': {},
                'summary': {
                    'total_permits': 0,
                    'total_violations': 0,
                    'compliance_score': 100
                }
            }
            
            # Get all mechanical systems data
            elevator_data = self.get_elevator_data(address, bin_number)
            boiler_data = self.get_boiler_data(address, bin_number)
            electrical_data = self.get_electrical_data(address, bin_number)
            
            comprehensive_data['elevator_data'] = elevator_data
            comprehensive_data['boiler_data'] = boiler_data
            comprehensive_data['electrical_data'] = electrical_data
            
            # Calculate summary statistics
            total_permits = 0
            total_violations = 0
            
            for system_data in [elevator_data, boiler_data, electrical_data]:
                if 'error' not in system_data:
                    # Count permits
                    for key in system_data:
                        if 'permits' in key and isinstance(system_data[key], list):
                            total_permits += len(system_data[key])
                    
                    # Count violations
                    for key in system_data:
                        if 'violations' in key and isinstance(system_data[key], list):
                            total_violations += len(system_data[key])
            
            comprehensive_data['summary']['total_permits'] = total_permits
            comprehensive_data['summary']['total_violations'] = total_violations
            
            # Calculate compliance score (start at 100, deduct for violations)
            compliance_score = 100 - (total_violations * 5)
            comprehensive_data['summary']['compliance_score'] = max(0, compliance_score)
            
            return comprehensive_data
            
        except Exception as e:
            logger.error(f"Error getting comprehensive mechanical data: {e}")
            return {'error': str(e), 'address': address, 'city': self.city}

# Example usage and testing
if __name__ == "__main__":
    # Test NYC client
    print("Testing NYC Mechanical Systems Client...")
    nyc_client = MechanicalSystemsClient('NYC')
    
    test_address = "123 Broadway, New York, NY 10001"
    
    # Test elevator data
    elevator_data = nyc_client.get_elevator_data(test_address)
    print(f"NYC Elevator Data: {len(elevator_data.get('elevator_permits', []))} permits, {len(elevator_data.get('elevator_violations', []))} violations")
    
    # Test boiler data
    boiler_data = nyc_client.get_boiler_data(test_address)
    print(f"NYC Boiler Data: {len(boiler_data.get('boiler_permits', []))} permits, {len(boiler_data.get('boiler_violations', []))} violations")
    
    # Test electrical data
    electrical_data = nyc_client.get_electrical_data(test_address)
    print(f"NYC Electrical Data: {len(electrical_data.get('electrical_permits', []))} permits, {len(electrical_data.get('electrical_violations', []))} violations")
    
    # Test Philadelphia client
    print("\nTesting Philadelphia Mechanical Systems Client...")
    philly_client = MechanicalSystemsClient('PHILADELPHIA')
    
    test_philly_address = "1234 Market St, Philadelphia, PA 19107"
    
    # Test comprehensive data
    comprehensive_data = philly_client.get_comprehensive_mechanical_data(test_philly_address)
    print(f"Philadelphia Comprehensive Data: {comprehensive_data['summary']['total_permits']} permits, {comprehensive_data['summary']['total_violations']} violations, Score: {comprehensive_data['summary']['compliance_score']}")

