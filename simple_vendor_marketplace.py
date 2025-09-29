#!/usr/bin/env python3
"""
Simple Vendor Marketplace
Basic vendor discovery and management system
"""

import asyncio
import logging
from typing import Dict, List, Any
from datetime import datetime

logger = logging.getLogger(__name__)

class SimpleVendorMarketplace:
    """Simple vendor marketplace for property compliance services"""
    
    def __init__(self, apify_token: str = None):
        self.apify_token = apify_token
        
        # Mock vendor database for demonstration
        self.mock_vendors = {
            'Philadelphia': [
                {
                    'id': 'vendor_1',
                    'name': 'Philadelphia Building Solutions',
                    'services': ['building_permits', 'code_violations', 'inspections'],
                    'rating': 4.8,
                    'contact': 'info@phillybuildingsolutions.com',
                    'phone': '(215) 555-0101',
                    'specialties': ['fire_safety', 'structural', 'electrical'],
                    'certified': True
                },
                {
                    'id': 'vendor_2', 
                    'name': 'Liberty Fire Safety',
                    'services': ['fire_inspections', 'sprinkler_systems', 'fire_alarms'],
                    'rating': 4.9,
                    'contact': 'contact@libertyfiresafety.com',
                    'phone': '(215) 555-0102',
                    'specialties': ['fire_safety', 'emergency_systems'],
                    'certified': True
                },
                {
                    'id': 'vendor_3',
                    'name': 'Philly Elevator Services',
                    'services': ['elevator_inspections', 'elevator_maintenance', 'mechanical'],
                    'rating': 4.7,
                    'contact': 'service@phillyelevator.com',
                    'phone': '(215) 555-0103',
                    'specialties': ['mechanical', 'elevators'],
                    'certified': True
                }
            ],
            'NYC': [
                {
                    'id': 'vendor_nyc_1',
                    'name': 'NYC Compliance Solutions',
                    'services': ['dob_permits', 'violations', 'inspections'],
                    'rating': 4.6,
                    'contact': 'info@nycompliance.com',
                    'phone': '(212) 555-0201',
                    'specialties': ['dob_compliance', 'structural', 'fire_safety'],
                    'certified': True
                }
            ]
        }
    
    async def find_verified_vendors(self, property_address: str, service_type: str, 
                                  compliance_requirements: List[str] = None) -> Dict[str, Any]:
        """
        Find verified vendors for specific compliance needs
        
        Args:
            property_address: Property address to determine city
            service_type: Type of service needed
            compliance_requirements: List of specific compliance requirements
            
        Returns:
            Dictionary with vendor search results
        """
        try:
            logger.info(f"Searching vendors for {service_type} at {property_address}")
            
            # Determine city from address
            city = 'Philadelphia' if 'philadelphia' in property_address.lower() else 'NYC'
            
            # Get vendors for the city
            city_vendors = self.mock_vendors.get(city, [])
            
            # Filter vendors by service type and requirements
            matching_vendors = []
            
            for vendor in city_vendors:
                # Check if vendor provides the required service
                if any(service in vendor['services'] for service in [service_type, service_type.replace('_', ' ')]):
                    match_score = self._calculate_match_score(vendor, service_type, compliance_requirements)
                    
                    vendor_result = vendor.copy()
                    vendor_result['match_score'] = match_score
                    vendor_result['estimated_response_time'] = '1-2 business days'
                    vendor_result['availability'] = 'Available'
                    
                    matching_vendors.append(vendor_result)
            
            # Sort by match score and rating
            matching_vendors.sort(key=lambda x: (x['match_score'], x['rating']), reverse=True)
            
            return {
                'property_address': property_address,
                'service_type': service_type,
                'city': city,
                'total_vendors_found': len(matching_vendors),
                'vendors': matching_vendors,
                'search_timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error searching vendors: {e}")
            return {
                'error': str(e),
                'property_address': property_address,
                'service_type': service_type
            }
    
    async def get_compliance_vendors(self, compliance_categories: List[str]) -> Dict[str, List[Dict]]:
        """
        Get vendors organized by compliance categories
        
        Args:
            compliance_categories: List of compliance categories needed
            
        Returns:
            Dictionary mapping categories to vendor lists
        """
        try:
            vendors_by_category = {}
            
            for category in compliance_categories:
                category_vendors = []
                
                # Search all cities for vendors that handle this category
                for city, vendors in self.mock_vendors.items():
                    for vendor in vendors:
                        if category.lower() in vendor.get('specialties', []):
                            vendor_result = vendor.copy()
                            vendor_result['city'] = city
                            category_vendors.append(vendor_result)
                
                vendors_by_category[category] = category_vendors
            
            return vendors_by_category
            
        except Exception as e:
            logger.error(f"Error getting compliance vendors: {e}")
            return {'error': str(e)}
    
    def _calculate_match_score(self, vendor: Dict, service_type: str, 
                             compliance_requirements: List[str] = None) -> float:
        """Calculate how well a vendor matches the requirements"""
        score = 0.0
        
        # Base score from rating
        score += vendor.get('rating', 0) * 20  # Max 100 points from rating
        
        # Service type match
        if service_type in vendor.get('services', []):
            score += 50
        elif any(service in service_type for service in vendor.get('services', [])):
            score += 30
        
        # Compliance requirements match
        if compliance_requirements:
            vendor_specialties = vendor.get('specialties', [])
            matches = sum(1 for req in compliance_requirements 
                         if any(spec in req.lower() for spec in vendor_specialties))
            score += (matches / len(compliance_requirements)) * 30
        
        # Certification bonus
        if vendor.get('certified', False):
            score += 20
        
        return min(100.0, score)  # Cap at 100

# Test function
if __name__ == "__main__":
    async def test_marketplace():
        marketplace = SimpleVendorMarketplace()
        
        # Test vendor search
        result = await marketplace.find_verified_vendors(
            property_address="1234 Market St, Philadelphia, PA",
            service_type="fire_inspections",
            compliance_requirements=["fire_safety", "sprinkler_systems"]
        )
        
        print("Vendor Search Results:")
        print(f"Found {result['total_vendors_found']} vendors")
        for vendor in result['vendors']:
            print(f"- {vendor['name']} (Rating: {vendor['rating']}, Match: {vendor['match_score']:.1f})")
    
    asyncio.run(test_marketplace())
