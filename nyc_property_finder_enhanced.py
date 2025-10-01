#!/usr/bin/env python3
"""
NYC Property Finder - Enhanced Implementation
Comprehensive property search and compliance analysis for NYC properties
"""

from typing import List, Dict, Optional, Any
from nyc_opendata_client import NYCOpenDataClient
from datetime import datetime, timedelta
import logging
import pandas as pd

logger = logging.getLogger(__name__)


class NYCPropertyFinder:
    """Enhanced NYC property finder with comprehensive compliance analysis"""
    
    def __init__(self):
        self.client = NYCOpenDataClient()
        
        # Risk category mappings
        self.violation_risk_categories = {
            'FIRE': ['FIRE', 'SPRINKLER', 'ALARM', 'SMOKE', 'EGRESS', 'EMERGENCY'],
            'STRUCTURAL': ['STRUCTURAL', 'FOUNDATION', 'WALL', 'ROOF', 'FLOOR'],
            'ELECTRICAL': ['ELECTRICAL', 'WIRING', 'POWER', 'ELECTRIC'],
            'MECHANICAL': ['HVAC', 'MECHANICAL', 'HEATING', 'VENTILATION', 'COOLING'],
            'PLUMBING': ['PLUMBING', 'WATER', 'SEWER', 'DRAIN', 'PIPE'],
            'HOUSING': ['HOUSING', 'APARTMENT', 'TENANT', 'HABITABILITY'],
            'ZONING': ['ZONING', 'USE', 'OCCUPANCY', 'CERTIFICATE']
        }
        
        # Cost estimation ranges
        self.violation_cost_estimates = {
            'FIRE': {'min': 2000, 'max': 8000, 'urgency': 'CRITICAL'},
            'STRUCTURAL': {'min': 5000, 'max': 30000, 'urgency': 'HIGH'},
            'ELECTRICAL': {'min': 800, 'max': 4000, 'urgency': 'HIGH'},
            'MECHANICAL': {'min': 1500, 'max': 10000, 'urgency': 'MEDIUM'},
            'PLUMBING': {'min': 500, 'max': 3000, 'urgency': 'MEDIUM'},
            'HOUSING': {'min': 300, 'max': 2000, 'urgency': 'LOW'},
            'ZONING': {'min': 200, 'max': 1500, 'urgency': 'LOW'}
        }
    
    def search_property_by_address(self, address: str, zip_code: str = None) -> List[Dict]:
        """
        Search for NYC properties by address
        
        Args:
            address: Property address
            zip_code: Optional zip code filter
            
        Returns:
            List of matching property records
        """
        try:
            logger.info(f"Searching NYC property: {address}")
            
            # Search across multiple datasets
            results = []
            
            # Search DOB violations for address matches
            dob_violations = self.client.search_by_address('dob_violations', address, limit=10)
            if not dob_violations.empty:
                for _, row in dob_violations.iterrows():
                    results.append({
                        'source': 'DOB Violations',
                        'address': f"{row.get('house_number', '')} {row.get('street', '')}".strip(),
                        'borough': row.get('boro', ''),
                        'bin': row.get('bin', ''),
                        'bbl': row.get('bbl', '')
                    })
            
            # Search HPD registrations
            hpd_registrations = self.client.search_by_address('hpd_registrations', address, limit=10)
            if not hpd_registrations.empty:
                for _, row in hpd_registrations.iterrows():
                    results.append({
                        'source': 'HPD Registrations',
                        'address': f"{row.get('housenumber', '')} {row.get('streetname', '')}".strip(),
                        'borough': row.get('boroid', ''),
                        'bin': row.get('bin', ''),
                        'bbl': row.get('bbl', '')
                    })
            
            # Deduplicate by BIN
            unique_results = {}
            for result in results:
                bin_number = result.get('bin')
                if bin_number and bin_number not in unique_results:
                    unique_results[bin_number] = result
            
            return list(unique_results.values())
            
        except Exception as e:
            logger.error(f"Error searching NYC property {address}: {e}")
            return []
    
    def _categorize_violation_risk(self, violation_type: str) -> str:
        """Categorize violation by risk level"""
        violation_upper = str(violation_type).upper()
        
        for category, keywords in self.violation_risk_categories.items():
            if any(keyword in violation_upper for keyword in keywords):
                return category
        
        return 'OTHER'
    
    def _is_open_violation(self, violation: Dict) -> bool:
        """Check if violation is currently open"""
        status = str(violation.get('violationstatus', violation.get('status', ''))).upper()
        return status in ['OPEN', 'ACTIVE', 'IN VIOLATION', 'PENDING']
    
    def _analyze_violations(self, violations_data: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
        """Analyze violations data"""
        total_violations = 0
        open_violations = 0
        violations_by_risk = {cat: 0 for cat in self.violation_risk_categories.keys()}
        violations_by_risk['OTHER'] = 0
        
        all_violations = []
        
        # Process DOB violations
        if 'dob' in violations_data and not violations_data['dob'].empty:
            for _, violation in violations_data['dob'].iterrows():
                total_violations += 1
                violation_dict = violation.to_dict()
                
                if self._is_open_violation(violation_dict):
                    open_violations += 1
                
                risk_category = self._categorize_violation_risk(
                    violation.get('violation_type', violation.get('violationtypecode', ''))
                )
                violations_by_risk[risk_category] += 1
                
                all_violations.append({
                    'source': 'DOB',
                    'violation_id': violation.get('isndobbisviol', ''),
                    'type': violation.get('violation_type', ''),
                    'description': violation.get('violation_description', ''),
                    'date': violation.get('issue_date', ''),
                    'status': violation.get('violationstatus', ''),
                    'risk_category': risk_category
                })
        
        # Process HPD violations
        if 'hpd' in violations_data and not violations_data['hpd'].empty:
            for _, violation in violations_data['hpd'].iterrows():
                total_violations += 1
                violation_dict = violation.to_dict()
                
                if self._is_open_violation(violation_dict):
                    open_violations += 1
                
                risk_category = self._categorize_violation_risk(
                    violation.get('violationdescription', '')
                )
                violations_by_risk[risk_category] += 1
                
                all_violations.append({
                    'source': 'HPD',
                    'violation_id': violation.get('violationid', ''),
                    'type': violation.get('class', ''),
                    'description': violation.get('violationdescription', ''),
                    'date': violation.get('inspectiondate', ''),
                    'status': violation.get('violationstatus', ''),
                    'risk_category': risk_category
                })
        
        return {
            'total': total_violations,
            'open': open_violations,
            'closed': total_violations - open_violations,
            'by_risk_category': violations_by_risk,
            'records': all_violations
        }
    
    def _analyze_equipment(self, elevator_data: pd.DataFrame, 
                          boiler_data: pd.DataFrame) -> Dict[str, Any]:
        """Analyze equipment inspection data"""
        equipment_summary = {
            'elevators': {
                'total': len(elevator_data) if not elevator_data.empty else 0,
                'compliant': 0,
                'issues': 0
            },
            'boilers': {
                'total': len(boiler_data) if not boiler_data.empty else 0,
                'compliant': 0,
                'issues': 0
            }
        }
        
        # Analyze elevator status
        if not elevator_data.empty:
            for _, elevator in elevator_data.iterrows():
                status = str(elevator.get('device_status', '')).upper()
                if 'ACTIVE' in status or 'COMPLIANT' in status:
                    equipment_summary['elevators']['compliant'] += 1
                else:
                    equipment_summary['elevators']['issues'] += 1
        
        # Analyze boiler status
        if not boiler_data.empty:
            for _, boiler in boiler_data.iterrows():
                status = str(boiler.get('inspection_result', '')).upper()
                if 'PASS' in status or 'APPROVED' in status:
                    equipment_summary['boilers']['compliant'] += 1
                else:
                    equipment_summary['boilers']['issues'] += 1
        
        return equipment_summary
    
    def _analyze_311_complaints(self, complaints_data: pd.DataFrame) -> Dict[str, Any]:
        """Analyze 311 complaints"""
        if complaints_data.empty:
            return {
                'total': 0,
                'open': 0,
                'by_type': {},
                'recent_complaints': []
            }
        
        total = len(complaints_data)
        open_complaints = len(complaints_data[
            complaints_data['status'].str.upper().isin(['OPEN', 'PENDING', 'IN PROGRESS'])
        ]) if 'status' in complaints_data.columns else 0
        
        # Group by complaint type
        by_type = {}
        if 'complaint_type' in complaints_data.columns:
            by_type = complaints_data['complaint_type'].value_counts().to_dict()
        
        # Get recent complaints
        recent = complaints_data.head(10).to_dict('records') if not complaints_data.empty else []
        
        return {
            'total': total,
            'open': open_complaints,
            'by_type': by_type,
            'recent_complaints': recent
        }
    
    def _calculate_compliance_score(self, violations: Dict, equipment: Dict, 
                                   complaints: Dict) -> int:
        """Calculate overall compliance score (0-100)"""
        score = 100
        
        # Deduct for violations
        score -= min(violations['open'] * 5, 40)  # Max 40 points for violations
        
        # Deduct for equipment issues
        equipment_issues = (equipment.get('elevators', {}).get('issues', 0) + 
                          equipment.get('boilers', {}).get('issues', 0))
        score -= min(equipment_issues * 3, 20)  # Max 20 points for equipment
        
        # Deduct for 311 complaints
        score -= min(complaints['open'] * 2, 20)  # Max 20 points for complaints
        
        return max(score, 0)
    
    def get_property_compliance(self, address: str, bin_number: str = None, 
                               bbl: str = None) -> Dict[str, Any]:
        """
        Get comprehensive compliance information for NYC property
        
        Args:
            address: Property address
            bin_number: Building Identification Number
            bbl: Borough, Block, Lot identifier
            
        Returns:
            Dictionary with comprehensive compliance information
        """
        try:
            logger.info(f"Getting NYC compliance for: {address} (BIN: {bin_number}, BBL: {bbl})")
            
            # Get comprehensive property data
            property_data = self.client.get_comprehensive_property_data(address, bin_number, bbl)
            
            if 'error' in property_data:
                return {'error': property_data['error']}
            
            # Analyze violations
            violations_analysis = self._analyze_violations(property_data.get('violations', {}))
            
            # Analyze equipment
            equipment_analysis = self._analyze_equipment(
                property_data.get('elevator_inspections', pd.DataFrame()),
                property_data.get('boiler_inspections', pd.DataFrame())
            )
            
            # Analyze 311 complaints
            complaints_analysis = self._analyze_311_complaints(
                property_data.get('complaints_311', pd.DataFrame())
            )
            
            # Calculate compliance score
            compliance_score = self._calculate_compliance_score(
                violations_analysis,
                equipment_analysis,
                complaints_analysis
            )
            
            # Determine risk level
            if compliance_score >= 90:
                risk_level = 'LOW'
            elif compliance_score >= 70:
                risk_level = 'MEDIUM'
            elif compliance_score >= 50:
                risk_level = 'HIGH'
            else:
                risk_level = 'CRITICAL'
            
            return {
                'address': address,
                'bin': bin_number,
                'bbl': bbl,
                'city': 'NYC',
                'analysis_date': datetime.now().isoformat(),
                'compliance_summary': {
                    'compliance_score': compliance_score,
                    'risk_level': risk_level,
                    'total_violations': violations_analysis['total'],
                    'open_violations': violations_analysis['open'],
                    'equipment_issues': (
                        equipment_analysis.get('elevators', {}).get('issues', 0) +
                        equipment_analysis.get('boilers', {}).get('issues', 0)
                    ),
                    'open_311_complaints': complaints_analysis['open']
                },
                'violations': violations_analysis,
                'equipment': equipment_analysis,
                'complaints_311': complaints_analysis,
                'building_complaints': property_data.get('building_complaints', pd.DataFrame()).to_dict('records')
            }
            
        except Exception as e:
            logger.error(f"Error getting NYC compliance: {e}")
            return {
                'error': str(e),
                'address': address,
                'bin': bin_number,
                'bbl': bbl,
                'city': 'NYC'
            }
    
    def generate_action_plan(self, compliance_data: Dict) -> List[Dict]:
        """Generate prioritized action plan from compliance data"""
        actions = []
        
        violations = compliance_data.get('violations', {}).get('records', [])
        
        # Generate actions for open violations
        open_violations = [v for v in violations if v.get('status', '').upper() in ['OPEN', 'ACTIVE', 'IN VIOLATION']]
        
        for violation in open_violations:
            risk_category = violation.get('risk_category', 'OTHER')
            cost_info = self.violation_cost_estimates.get(risk_category, {
                'min': 500,
                'max': 2000,
                'urgency': 'MEDIUM'
            })
            
            actions.append({
                'type': 'VIOLATION_RESOLUTION',
                'priority': cost_info['urgency'],
                'title': f"Resolve {risk_category.title()} Violation",
                'description': violation.get('description', 'Unknown violation'),
                'violation_id': violation.get('violation_id'),
                'violation_date': violation.get('date'),
                'estimated_cost_min': cost_info['min'],
                'estimated_cost_max': cost_info['max'],
                'source': violation.get('source')
            })
        
        # Sort by priority
        priority_order = {'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3}
        actions.sort(key=lambda x: priority_order.get(x['priority'], 3))
        
        return actions


# Legacy function wrappers for backwards compatibility
def search_property_by_address(client: NYCOpenDataClient, address: str, zip_code: str = None) -> List[Dict]:
    """Legacy wrapper - use NYCPropertyFinder class instead"""
    finder = NYCPropertyFinder()
    return finder.search_property_by_address(address, zip_code)


def get_property_compliance(client: NYCOpenDataClient, bin_number: str = None, 
                          borough: str = None, block: str = None, lot: str = None) -> Dict[str, Any]:
    """Legacy wrapper - use NYCPropertyFinder class instead"""
    finder = NYCPropertyFinder()
    
    # Construct BBL if components provided
    bbl = None
    if borough and block and lot:
        borough_codes = {'MANHATTAN': '1', 'BRONX': '2', 'BROOKLYN': '3', 'QUEENS': '4', 'STATEN ISLAND': '5'}
        bbl = f"{borough_codes.get(borough.upper(), '1')}{block.zfill(5)}{lot.zfill(4)}"
    
    return finder.get_property_compliance('', bin_number, bbl)


def demo_nyc_finder():
    """Demonstrate NYC property finder capabilities"""
    finder = NYCPropertyFinder()
    
    print("🗽 NYC PROPERTY FINDER DEMO")
    print("=" * 60)
    
    # Test with a sample NYC address
    test_address = "350 5TH AVE"  # Empire State Building
    
    print(f"\n🔍 Searching for: {test_address}")
    properties = finder.search_property_by_address(test_address)
    
    if properties:
        print(f"   Found {len(properties)} matching properties")
        for prop in properties[:3]:
            print(f"   - {prop['address']} (BIN: {prop.get('bin', 'N/A')})")
    else:
        print("   No properties found")


if __name__ == "__main__":
    demo_nyc_finder()

