#!/usr/bin/env python3
"""
NYC Open Data Client - Production Implementation
Comprehensive client for accessing NYC Open Data APIs via Socrata

Dataset Coverage:
- DOB Violations
- HPD Violations  
- Elevator Inspections
- Boiler Inspections
- 311 Complaints
- Building Complaints
- Fire Safety Inspections
- Cooling Tower Registrations & Inspections
- Electrical Permits
- HPD Registrations
"""

import requests
import pandas as pd
import os
import time
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
from urllib.parse import urlencode
import logging

logger = logging.getLogger(__name__)


class NYCOpenDataClient:
    """
    Production-ready NYC Open Data client using Socrata API
    
    Features:
    - Multiple dataset support
    - SoQL (Socrata Query Language) queries
    - Pagination for large datasets
    - Date filtering
    - Error handling and retries
    - Rate limiting protection
    - Multiple output formats
    """
    
    # Dataset identifiers from NYC Open Data
    DATASETS = {
        'dob_violations': {
            'id': '3h2n-5cm9',
            'name': 'DOB Violations',
            'description': 'Department of Buildings violations'
        },
        'hpd_violations': {
            'id': 'wvxf-dwi5',
            'name': 'HPD Violations',
            'description': 'Housing Preservation & Development violations'
        },
        'hpd_registrations': {
            'id': 'tesw-yqqr',
            'name': 'HPD Registrations',
            'description': 'Property registration information'
        },
        'elevator_inspections': {
            'id': 'ju4y-gjjz',
            'name': 'Elevator Inspections',
            'description': 'DOB NOW Elevator Compliance data'
        },
        'boiler_inspections': {
            'id': 'yb3y-jj3p',
            'name': 'Boiler Inspections',
            'description': 'Boiler inspection records'
        },
        'complaints_311': {
            'id': 'erm2-nwe9',
            'name': '311 Complaints',
            'description': 'Citizen complaints about properties'
        },
        'building_complaints': {
            'id': 'eabe-havv',
            'name': 'Building Complaints',
            'description': 'DOB complaints specific to building issues'
        },
        'fire_safety_inspections': {
            'id': 'tb8h-r8xh',
            'name': 'Fire Safety Inspections',
            'description': 'FDNY inspection data'
        },
        'cooling_tower_registrations': {
            'id': 'zjjz-xg8w',
            'name': 'Cooling Tower Registrations',
            'description': 'Registration data for cooling towers'
        },
        'cooling_tower_inspections': {
            'id': 'vhfd-45yz',
            'name': 'Cooling Tower Inspections',
            'description': 'Inspection dates, status, compliance information'
        },
        'electrical_permits': {
            'id': 'ipu4-2q9a',
            'name': 'Electrical Permits',
            'description': 'Electrical work permits'
        }
    }
    
    def __init__(self, app_token: Optional[str] = None, api_key_id: Optional[str] = None, 
                 api_key_secret: Optional[str] = None):
        """
        Initialize NYC Open Data client
        
        Args:
            app_token: Optional app token for higher rate limits
            api_key_id: Optional API key ID for authentication
            api_key_secret: Optional API key secret for authentication
        """
        self.base_url = "https://data.cityofnewyork.us/resource"
        self.app_token = app_token or os.getenv('NYC_APP_TOKEN')
        self.api_key_id = api_key_id or os.getenv('NYC_API_KEY_ID')
        self.api_key_secret = api_key_secret or os.getenv('NYC_API_KEY_SECRET')
        
        self.session = requests.Session()
        
        # Set headers
        self.session.headers.update({
            'User-Agent': 'PropplyAI/2.0 (Property Compliance Management)',
            'Accept': 'application/json'
        })
        
        # Add app token if available
        if self.app_token:
            self.session.headers.update({'X-App-Token': self.app_token})
        
        # Add basic auth if API keys provided
        if self.api_key_id and self.api_key_secret:
            self.session.auth = (self.api_key_id, self.api_key_secret)
        
        # Rate limiting
        self.request_count = 0
        self.last_request_time = time.time()
        self.max_requests_per_second = 10 if self.app_token else 2
    
    @classmethod
    def from_config(cls) -> 'NYCOpenDataClient':
        """Create client from environment configuration"""
        return cls()
    
    def _rate_limit(self):
        """Implement rate limiting to avoid throttling"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < 1.0:
            if self.request_count >= self.max_requests_per_second:
                sleep_time = 1.0 - time_since_last
                logger.debug(f"Rate limiting: sleeping {sleep_time:.2f}s")
                time.sleep(sleep_time)
                self.request_count = 0
                self.last_request_time = time.time()
        else:
            self.request_count = 0
            self.last_request_time = current_time
        
        self.request_count += 1
    
    def _make_request(self, dataset_id: str, params: Dict[str, Any] = None, 
                     retries: int = 3) -> requests.Response:
        """
        Make API request with error handling and retries
        
        Args:
            dataset_id: Socrata dataset identifier
            params: Query parameters
            retries: Number of retry attempts
            
        Returns:
            Response object
        """
        url = f"{self.base_url}/{dataset_id}.json"
        
        for attempt in range(retries):
            try:
                self._rate_limit()
                
                response = self.session.get(url, params=params, timeout=30)
                response.raise_for_status()
                
                return response
                
            except requests.exceptions.HTTPError as e:
                if e.response.status_code == 429:  # Too many requests
                    wait_time = 2 ** attempt  # Exponential backoff
                    logger.warning(f"Rate limited. Waiting {wait_time}s before retry {attempt + 1}/{retries}")
                    time.sleep(wait_time)
                elif e.response.status_code >= 500:  # Server error
                    wait_time = 2 ** attempt
                    logger.warning(f"Server error. Waiting {wait_time}s before retry {attempt + 1}/{retries}")
                    time.sleep(wait_time)
                else:
                    raise
                    
            except requests.exceptions.Timeout:
                logger.warning(f"Request timeout. Retry {attempt + 1}/{retries}")
                if attempt < retries - 1:
                    time.sleep(1)
                else:
                    raise
                    
            except requests.exceptions.RequestException as e:
                logger.error(f"Request failed: {e}")
                if attempt < retries - 1:
                    time.sleep(1)
                else:
                    raise
        
        raise Exception(f"Failed after {retries} retries")
    
    def get_data(self, dataset_key: str, where: str = None, select: str = None,
                 order: str = None, group: str = None, limit: int = 1000,
                 offset: int = 0, format_type: str = 'dataframe') -> Union[pd.DataFrame, List[Dict], str]:
        """
        Get data from a dataset with flexible filtering
        
        Args:
            dataset_key: Key from DATASETS dict
            where: SoQL WHERE clause
            select: SoQL SELECT clause
            order: SoQL ORDER BY clause
            group: SoQL GROUP BY clause
            limit: Maximum number of records
            offset: Number of records to skip
            format_type: Output format ('dataframe', 'json', 'csv')
            
        Returns:
            Data in requested format
        """
        if dataset_key not in self.DATASETS:
            raise ValueError(f"Unknown dataset: {dataset_key}. Available: {list(self.DATASETS.keys())}")
        
        dataset_id = self.DATASETS[dataset_key]['id']
        
        # Build query parameters
        params = {}
        if where:
            params['$where'] = where
        if select:
            params['$select'] = select
        if order:
            params['$order'] = order
        if group:
            params['$group'] = group
        if limit:
            params['$limit'] = limit
        if offset:
            params['$offset'] = offset
        
        logger.info(f"Fetching {dataset_key} data with params: {params}")
        
        try:
            response = self._make_request(dataset_id, params)
            data = response.json()
            
            if format_type == 'json':
                return data
            elif format_type == 'csv':
                df = pd.DataFrame(data)
                return df.to_csv(index=False)
            else:  # dataframe
                return pd.DataFrame(data)
                
        except Exception as e:
            logger.error(f"Error fetching data from {dataset_key}: {e}")
            return pd.DataFrame() if format_type == 'dataframe' else []
    
    def get_recent_data(self, dataset_key: str, days_back: int = 30, 
                       date_field: str = None, limit: int = 1000) -> pd.DataFrame:
        """
        Get recent data from a dataset
        
        Args:
            dataset_key: Key from DATASETS dict
            days_back: Number of days to look back
            date_field: Name of the date field (auto-detected if None)
            limit: Maximum number of records
            
        Returns:
            DataFrame with recent records
        """
        # Common date field names by dataset
        date_fields = {
            'dob_violations': 'issue_date',
            'hpd_violations': 'inspectiondate',
            'elevator_inspections': 'last_inspection_date',
            'boiler_inspections': 'inspection_date',
            'complaints_311': 'created_date',
            'building_complaints': 'date_entered',
            'fire_safety_inspections': 'inspection_date',
            'cooling_tower_inspections': 'inspection_date'
        }
        
        date_field = date_field or date_fields.get(dataset_key, 'created_date')
        
        cutoff_date = (datetime.now() - timedelta(days=days_back)).strftime('%Y-%m-%d')
        where_clause = f"{date_field} >= '{cutoff_date}'"
        
        return self.get_data(
            dataset_key,
            where=where_clause,
            order=f"{date_field} DESC",
            limit=limit
        )
    
    def search_by_address(self, dataset_key: str, address: str, 
                         limit: int = 100) -> pd.DataFrame:
        """
        Search for records by address
        
        Args:
            dataset_key: Key from DATASETS dict
            address: Property address to search for
            limit: Maximum number of records
            
        Returns:
            DataFrame with matching records
        """
        # Normalize address for search
        address_clean = address.upper().strip()
        
        # Common address field names
        address_fields = {
            'dob_violations': 'house_number',
            'hpd_violations': 'housenumber',
            'hpd_registrations': 'housenumber',
            'complaints_311': 'incident_address',
            'building_complaints': 'house_number'
        }
        
        address_field = address_fields.get(dataset_key, 'address')
        
        # Simple address search - can be enhanced with fuzzy matching
        where_clause = f"UPPER({address_field}) LIKE '%{address_clean}%'"
        
        return self.get_data(
            dataset_key,
            where=where_clause,
            limit=limit
        )
    
    def search_by_bin(self, dataset_key: str, bin_number: str, 
                     limit: int = 100) -> pd.DataFrame:
        """
        Search for records by BIN (Building Identification Number)
        
        Args:
            dataset_key: Key from DATASETS dict
            bin_number: Building Identification Number
            limit: Maximum number of records
            
        Returns:
            DataFrame with matching records
        """
        where_clause = f"bin = '{bin_number}'"
        
        return self.get_data(
            dataset_key,
            where=where_clause,
            limit=limit
        )
    
    def search_by_bbl(self, dataset_key: str, bbl: str, 
                     limit: int = 100) -> pd.DataFrame:
        """
        Search for records by BBL (Borough, Block, Lot)
        
        Args:
            dataset_key: Key from DATASETS dict
            bbl: BBL identifier
            limit: Maximum number of records
            
        Returns:
            DataFrame with matching records
        """
        where_clause = f"bbl = '{bbl}'"
        
        return self.get_data(
            dataset_key,
            where=where_clause,
            limit=limit
        )
    
    def get_property_violations(self, address: str = None, bin_number: str = None,
                               bbl: str = None) -> Dict[str, pd.DataFrame]:
        """
        Get all violations for a property from multiple sources
        
        Args:
            address: Property address
            bin_number: Building Identification Number
            bbl: Borough, Block, Lot identifier
            
        Returns:
            Dictionary with violations from different sources
        """
        violations = {}
        
        try:
            # DOB Violations
            if bin_number:
                violations['dob'] = self.search_by_bin('dob_violations', bin_number)
            elif address:
                violations['dob'] = self.search_by_address('dob_violations', address)
            
            # HPD Violations
            if bbl:
                violations['hpd'] = self.search_by_bbl('hpd_violations', bbl)
            elif address:
                violations['hpd'] = self.search_by_address('hpd_violations', address)
            
            logger.info(f"Retrieved violations - DOB: {len(violations.get('dob', []))}, HPD: {len(violations.get('hpd', []))}")
            
        except Exception as e:
            logger.error(f"Error retrieving violations: {e}")
        
        return violations
    
    def get_elevator_status(self, bin_number: str) -> pd.DataFrame:
        """Get elevator inspection status for a building"""
        return self.search_by_bin('elevator_inspections', bin_number)
    
    def get_boiler_status(self, bin_number: str) -> pd.DataFrame:
        """Get boiler inspection status for a building"""
        return self.search_by_bin('boiler_inspections', bin_number)
    
    def get_311_complaints(self, address: str, days_back: int = 365) -> pd.DataFrame:
        """Get 311 complaints for an address"""
        cutoff_date = (datetime.now() - timedelta(days=days_back)).strftime('%Y-%m-%d')
        address_clean = address.upper().strip()
        
        where_clause = f"created_date >= '{cutoff_date}' AND UPPER(incident_address) LIKE '%{address_clean}%'"
        
        return self.get_data(
            'complaints_311',
            where=where_clause,
            order='created_date DESC',
            limit=500
        )
    
    def get_comprehensive_property_data(self, address: str, bin_number: str = None,
                                       bbl: str = None) -> Dict[str, Any]:
        """
        Get comprehensive property data from all available sources
        
        Args:
            address: Property address
            bin_number: Building Identification Number
            bbl: Borough, Block, Lot identifier
            
        Returns:
            Dictionary with all property data
        """
        logger.info(f"Fetching comprehensive NYC data for: {address}")
        
        data = {
            'address': address,
            'bin': bin_number,
            'bbl': bbl,
            'fetch_date': datetime.now().isoformat()
        }
        
        try:
            # Violations
            data['violations'] = self.get_property_violations(address, bin_number, bbl)
            
            # 311 Complaints
            data['complaints_311'] = self.get_311_complaints(address)
            
            # Equipment inspections (if BIN available)
            if bin_number:
                data['elevator_inspections'] = self.get_elevator_status(bin_number)
                data['boiler_inspections'] = self.get_boiler_status(bin_number)
            
            # Building complaints
            if address:
                data['building_complaints'] = self.search_by_address('building_complaints', address)
            
            logger.info(f"Successfully fetched comprehensive data for {address}")
            
        except Exception as e:
            logger.error(f"Error fetching comprehensive data: {e}")
            data['error'] = str(e)
        
        return data
    
    def list_datasets(self) -> List[Dict[str, str]]:
        """List all available datasets"""
        return [
            {'key': key, **info}
            for key, info in self.DATASETS.items()
        ]


def demo_nyc_client():
    """Demonstrate NYC Open Data client capabilities"""
    client = NYCOpenDataClient()
    
    print("🗽 NYC OPEN DATA CLIENT DEMO")
    print("=" * 60)
    
    # List available datasets
    print("\n📊 Available Datasets:")
    for dataset in client.list_datasets():
        print(f"   - {dataset['key']}: {dataset['name']}")
    
    # Example: Get recent DOB violations
    print("\n🔍 Recent DOB Violations (last 7 days):")
    recent_violations = client.get_recent_data('dob_violations', days_back=7, limit=5)
    if not recent_violations.empty:
        print(f"   Found {len(recent_violations)} recent violations")
        print(recent_violations[['issue_date', 'violation_type', 'house_number']].head() if 'issue_date' in recent_violations.columns else recent_violations.head())
    else:
        print("   No recent violations found")


if __name__ == "__main__":
    # Run demo
    demo_nyc_client()

