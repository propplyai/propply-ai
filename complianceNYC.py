
#!/usr/bin/env python3
"""
Comprehensive NYC Property Compliance System
============================================

Final comprehensive script implementing best practices for NYC property compliance data retrieval:
- NYC Geoclient API for authoritative address → BIN/BBL conversion
- Robust multi-key search strategy (BIN, BBL, block/lot, address)
- Complete dataset coverage including DOB Complaints and Safety Violations
- Cross-dataset merging and BIN mismatch handling
- Supabase-ready structured output

Based on comprehensive research and the official NYC property compliance data retrieval guide.
Integrated with Propply AI system.
"""

import os
import sys
import json
import asyncio
import requests
import math
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import from the updated NYC_data.py
from NYC_data import NYCOpenDataClient

@dataclass
class PropertyIdentifiers:
    """Canonical property identifiers from Geoclient API"""
    address: str
    bin: Optional[str] = None
    bbl: Optional[str] = None
    borough: Optional[str] = None
    block: Optional[str] = None
    lot: Optional[str] = None
    zip_code: Optional[str] = None

@dataclass
class ComplianceRecord:
    """Structured compliance record for Supabase"""
    # Property identifiers
    address: str
    bin: Optional[str]
    bbl: Optional[str]
    borough: Optional[str]
    block: Optional[str]
    lot: Optional[str]
    zip_code: Optional[str]
    
    # Violation counts
    hpd_violations_total: int = 0
    hpd_violations_active: int = 0
    dob_violations_total: int = 0
    dob_violations_active: int = 0
    
    # Equipment counts
    elevator_devices_total: int = 0
    elevator_devices_active: int = 0
    boiler_devices_total: int = 0
    electrical_permits_total: int = 0
    electrical_permits_active: int = 0
    
    # Compliance scores (0-100)
    hpd_compliance_score: float = 100.0
    dob_compliance_score: float = 100.0
    elevator_compliance_score: float = 100.0
    electrical_compliance_score: float = 100.0
    overall_compliance_score: float = 100.0
    
    # Raw data (JSON)
    hpd_violations_data: str = "[]"
    dob_violations_data: str = "[]"
    elevator_data: str = "[]"
    boiler_data: str = "[]"
    electrical_data: str = "[]"
    
    # Metadata
    processed_at: str = ""
    data_sources: str = ""

class NYCPlanningGeoSearchClient:
    """NYC Planning GeoSearch API client - modern, free, no authentication required"""
    
    def __init__(self):
        self.base_url = "https://geosearch.planninglabs.nyc/v2"
    
    def get_property_identifiers(self, address: str, borough: str = None) -> Optional[PropertyIdentifiers]:
        """Get property identifiers from address using NYC Planning GeoSearch API"""
        
        # Format address for search
        search_text = address.strip()
        if borough:
            search_text = f"{address}, {borough}"
        
        try:
            params = {
                'text': search_text,
                'size': 1  # Only need the best match
            }
            
            response = requests.get(f"{self.base_url}/search", params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if not data.get('features'):
                print(f"❌ NYC GeoSearch: No results for {address}")
                return None
            
            feature = data['features'][0]
            properties = feature.get('properties', {})
            
            # Extract property details
            house_number = properties.get('housenumber', '')
            street = properties.get('street', '')
            formatted_address = f"{house_number} {street}".strip()
            
            # Get borough name and normalize
            borough_name = properties.get('borough')
            borough_map = {
                'Manhattan': 'MANHATTAN', 'Brooklyn': 'BROOKLYN', 
                'Queens': 'QUEENS', 'Bronx': 'BRONX', 'Staten Island': 'STATEN ISLAND'
            }
            normalized_borough = borough_map.get(borough_name, borough_name)
            
            # Extract BIN and BBL from addendum.pad (new v2 structure)
            pad_data = properties.get('addendum', {}).get('pad', {})
            bin_number = pad_data.get('bin')
            bbl = pad_data.get('bbl')
            
            # Parse BBL to get block/lot (BBL format: borough+block+lot)
            block = None
            lot = None
            if bbl and len(bbl) >= 10:  # BBL should be 10 digits
                try:
                    block = bbl[1:6].lstrip('0')  # Remove leading zeros
                    lot = bbl[6:].lstrip('0')    # Remove leading zeros
                except:
                    pass
            
            identifiers = PropertyIdentifiers(
                address=formatted_address,
                bin=bin_number,
                bbl=bbl,
                borough=normalized_borough,
                block=block,
                lot=lot,
                zip_code=properties.get('postalcode')
            )
            
            print(f"✅ NYC GeoSearch API: Found {identifiers.address}")
            print(f"   BIN: {identifiers.bin}, BBL: {identifiers.bbl}")
            print(f"   Borough: {identifiers.borough}, Block/Lot: {identifiers.block}/{identifiers.lot}")
            
            return identifiers
            
        except Exception as e:
            print(f"❌ NYC GeoSearch API error: {e}")
            return None

class ComprehensivePropertyComplianceSystem:
    """Comprehensive NYC property compliance data retrieval system"""
    
    def __init__(self):
        self.nyc_client = NYCOpenDataClient.from_config()
        self.geoclient = NYCPlanningGeoSearchClient()
    
    async def process_property(self, address: str, borough: str = None) -> ComplianceRecord:
        """Process a property address and return comprehensive compliance data"""
        
        print(f"🏢 COMPREHENSIVE PROPERTY COMPLIANCE ANALYSIS")
        print(f"Address: {address}")
        print("=" * 80)
        
        # Step 1: Get canonical property identifiers
        identifiers = await self.get_property_identifiers(address, borough)
        
        if not identifiers:
            print("❌ Could not identify property")
            return self.create_empty_record(address)
        
        # Step 2: Gather compliance data using robust multi-key search
        compliance_data = await self.gather_comprehensive_compliance_data(identifiers)
        
        # Step 3: Create structured compliance record
        record = self.create_compliance_record(identifiers, compliance_data)
        
        return record
    
    async def get_property_identifiers(self, address: str, borough: str = None) -> Optional[PropertyIdentifiers]:
        """Get property identifiers using multiple strategies"""
        
        print(f"\n🔍 STEP 1: PROPERTY IDENTIFICATION")
        print("-" * 40)
        
        # Strategy 1: NYC Planning GeoSearch API (free, no auth required)
        print("🌐 Using NYC Planning GeoSearch API...")
        identifiers = self.geoclient.get_property_identifiers(address, borough)
        if identifiers:
            return identifiers
        
        # Strategy 2: Fallback to HPD violations search
        print("🔍 Fallback: HPD violations search...")
        identifiers = await self.fallback_property_search(address)
        
        return identifiers
    
    async def fallback_property_search(self, address: str) -> Optional[PropertyIdentifiers]:
        """Fallback property search using HPD violations dataset"""
        
        # Clean up address - remove borough and state suffixes
        address_clean = address.upper().strip()
        # Remove common suffixes
        suffixes_to_remove = [', NEW YORK, NY', ', NEW YORK', ', NY', ', MANHATTAN', ', BROOKLYN', ', QUEENS', ', BRONX', ', STATEN ISLAND']
        for suffix in suffixes_to_remove:
            address_clean = address_clean.replace(suffix, '')
        
        # Extract ZIP code
        import re
        zip_match = re.search(r'\b(\d{5})\b', address_clean)
        zip_code = zip_match.group(1) if zip_match else None
        if zip_code:
            address_clean = address_clean.replace(zip_code, '').strip()
        
        # Parse address components
        address_parts = address_clean.split(' ')
        house_number = address_parts[0] if address_parts else ""
        street_name = ' '.join(address_parts[1:]) if len(address_parts) > 1 else ""
        
        try:
            # Use the same approach as nyc_property_finder.py
            where_clause = f"housenumber = '{house_number}' AND streetname LIKE '%{street_name}%'"
            if zip_code:
                where_clause += f" AND zip = '{zip_code}'"
            
            print(f"   Searching HPD with: {where_clause}")
            
            data = self.nyc_client.get_data(
                'hpd_violations',
                where=where_clause,
                select="buildingid, housenumber, streetname, boro, block, lot, zip",
                limit=1
            )
            
            print(f"   HPD search returned: {type(data)}, empty: {len(data) == 0 if data is not None else 'None'}")
            
            if data is not None and len(data) > 0:
                match = data[0] if data else {}
                
                identifiers = PropertyIdentifiers(
                    address=f"{match.get('housenumber', '')} {match.get('streetname', '')}".strip(),
                    bin=match.get('buildingid'),
                    bbl=f"{match.get('boro', '')}{match.get('block', '')}{match.get('lot', '')}",
                    borough=match.get('boro'),
                    block=match.get('block'),
                    lot=match.get('lot'),
                    zip_code=match.get('zip')
                )
                
                print(f"✅ Found via HPD: {identifiers.address}")
                print(f"   BIN: {identifiers.bin}, Block/Lot: {identifiers.block}/{identifiers.lot}")
                
                return identifiers
            
            return None
            
        except Exception as e:
            print(f"❌ Fallback search error: {e}")
            return None
    
    async def gather_comprehensive_compliance_data(self, identifiers: PropertyIdentifiers) -> Dict[str, List[Dict]]:
        """Gather comprehensive compliance data using robust multi-key search"""
        
        print(f"\n🔍 STEP 2: COMPREHENSIVE DATA GATHERING")
        print("-" * 40)
        
        compliance_data = {
            'hpd_violations': [],
            'dob_violations': [],
            'elevator_inspections': [],
            'boiler_inspections': [],
            'certificate_of_occupancy': [],
            'electrical_permits': []
        }
        
        # HPD Violations
        await self.gather_hpd_violations(identifiers, compliance_data)
        
        # DOB Violations
        await self.gather_dob_violations(identifiers, compliance_data)
        
        # Elevator Inspections (robust multi-key search)
        await self.gather_elevator_data(identifiers, compliance_data)
        
        # Boiler Inspections
        await self.gather_boiler_data(identifiers, compliance_data)
        
        # Certificate of Occupancy
        await self.gather_certificate_of_occupancy(identifiers, compliance_data)
        
        # Electrical Permits
        await self.gather_electrical_permits(identifiers, compliance_data)
        
        return compliance_data
    
    async def gather_hpd_violations(self, identifiers: PropertyIdentifiers, compliance_data: Dict):
        """Gather HPD violations data using multiple search strategies with timeout handling - ACTIVE ONLY"""
        
        hpd_violations = []
        search_strategies = []
        
        # Strategy 1: BIN search (most reliable)
        if identifiers.bin:
            search_strategies.append(("BIN", f"bin = '{identifiers.bin}'"))
        
        # Strategy 2: BBL search
        if identifiers.bbl:
            search_strategies.append(("BBL", f"bbl = '{identifiers.bbl}'"))
        
        # Strategy 3: Block/Lot search
        if identifiers.block and identifiers.lot:
            search_strategies.append(("Block/Lot", f"block = '{identifiers.block}' AND lot = '{identifiers.lot}'"))
        
        for strategy_name, where_clause in search_strategies:
            try:
                print(f"🔍 HPD Violations - Trying {strategy_name} search: {where_clause}")
                
                # Add active status filter to the where clause - HPD uses 'Open' format
                active_where_clause = f"({where_clause}) AND violationstatus = 'Open'"
                
                violations_data = self.nyc_client.get_data(
                    'hpd_violations',
                    where=active_where_clause,
                    limit=500  # Get more historical records0
                )
                
                if violations_data and len(violations_data) > 0:
                    # Filter data to match the correct BIN when using block/lot search
                    if strategy_name == "Block/Lot" and identifiers.bin:
                        filtered_data = [record for record in violations_data if record.get('bin') == identifiers.bin]
                        if not filtered_data:
                            print(f"   ⚠️  Found {len(violations_data)} HPD violations in block/lot {identifiers.block}/{identifiers.lot}, but none match BIN {identifiers.bin}")
                            continue  # Try next strategy
                        violations_data = filtered_data
                    
                    hpd_violations = violations_data  # Already a list of dicts
                    print(f"✅ HPD Violations - Found {len(hpd_violations)} ACTIVE violations using {strategy_name}")
                    break
                else:
                    print(f"❌ HPD Violations - No active results with {strategy_name}")
                    
            except Exception as e:
                print(f"❌ HPD Violations - {strategy_name} search failed: {e}")
                continue
        
        # Clean and process violations data
        if hpd_violations:
            hpd_violations = self.clean_data_for_json(hpd_violations)
            
            # Sort violations by inspection date in descending order (newest first)
            hpd_violations.sort(
                key=lambda x: (
                    x.get('inspectiondate') or '1900-01-01T00:00:00.000',  # Fallback for missing dates
                    x.get('violationid', '')  # Secondary sort by violation ID
                ),
                reverse=True  # Newest first
            )
            
            # All violations are active since we filtered for them
            active_violations = hpd_violations
            
            compliance_data['hpd_violations_total'] = len(hpd_violations)  # Only active count
            compliance_data['hpd_violations_active'] = len(active_violations)
            compliance_data['hpd_violations_data'] = json.dumps(hpd_violations)
            
            # Calculate HPD compliance score (lower is worse)
            if len(active_violations) == 0:
                compliance_data['hpd_compliance_score'] = 100.0
            elif len(active_violations) <= 5:
                compliance_data['hpd_compliance_score'] = 85.0
            elif len(active_violations) <= 15:
                compliance_data['hpd_compliance_score'] = 70.0
            elif len(active_violations) <= 30:
                compliance_data['hpd_compliance_score'] = 50.0
            else:
                compliance_data['hpd_compliance_score'] = 25.0
                
            print(f"📊 HPD Analysis: {len(active_violations)} ACTIVE violations found")
        else:
            compliance_data['hpd_violations_total'] = 0
            compliance_data['hpd_violations_active'] = 0
            compliance_data['hpd_violations_data'] = json.dumps([])
            compliance_data['hpd_compliance_score'] = 100.0
            print("✅ HPD Analysis: No active violations found - perfect score")
    
    async def gather_dob_violations(self, identifiers: PropertyIdentifiers, compliance_data: Dict):
        """Gather DOB violations data using multiple search strategies - ACTIVE ONLY"""
        
        dob_violations = []
        search_strategies = []
        
        # Strategy 1: BIN search (most reliable)
        if identifiers.bin:
            search_strategies.append(("BIN", f"bin = '{identifiers.bin}'"))
        
        # Strategy 2: BBL search
        if identifiers.bbl:
            search_strategies.append(("BBL", f"bbl = '{identifiers.bbl}'"))
        
        # Strategy 3: Block/Lot search
        if identifiers.block and identifiers.lot:
            search_strategies.append(("Block/Lot", f"block = '{identifiers.block}' AND lot = '{identifiers.lot}'"))
        
        for strategy_name, where_clause in search_strategies:
            try:
                print(f"🔍 DOB Violations - Trying {strategy_name} search: {where_clause}")
                
                # Add active status filter to the where clause - DOB uses violation_category field
                active_where_clause = f"({where_clause}) AND violation_category LIKE '%ACTIVE%'"
                
                violations_data = self.nyc_client.get_data(
                    'dob_violations',
                    where=active_where_clause,
                    limit=500  # Get more historical records0
                )
                
                if violations_data and len(violations_data) > 0:
                    # Filter data to match the correct BIN when using block/lot search
                    if strategy_name == "Block/Lot" and identifiers.bin:
                        filtered_data = [record for record in violations_data if record.get('bin') == identifiers.bin]
                        if not filtered_data:
                            print(f"   ⚠️  Found {len(violations_data)} DOB violations in block/lot {identifiers.block}/{identifiers.lot}, but none match BIN {identifiers.bin}")
                            continue  # Try next strategy
                        violations_data = filtered_data
                    
                    dob_violations = violations_data  # Already a list of dicts
                    print(f"✅ DOB Violations - Found {len(dob_violations)} ACTIVE violations using {strategy_name}")
                    break
                else:
                    print(f"❌ DOB Violations - No active results with {strategy_name}")
                    
            except Exception as e:
                print(f"❌ DOB Violations - {strategy_name} search failed: {e}")
                continue
        
        # Clean and process violations data
        if dob_violations:
            dob_violations = self.clean_data_for_json(dob_violations)

            # Normalize keys and dates for frontend compatibility
            # - Ensure 'issuedate' exists and is ISO formatted (YYYY-MM-DD)
            # - Ensure 'dispositiondate' is ISO formatted when available
            # - Ensure 'status' exists (fallback to violation_category if needed)
            def _to_iso_date(val: Any) -> Optional[str]:
                if not val:
                    return None
                try:
                    s = str(val)
                    # Trim to date part if timestamp
                    s10 = s[:10]
                    for fmt in ('%Y-%m-%d', '%m/%d/%Y', '%m-%d-%Y', '%Y/%m/%d'):
                        try:
                            return datetime.strptime(s10, fmt).strftime('%Y-%m-%d')
                        except ValueError:
                            continue
                    # Last resort: let fromisoformat try
                    try:
                        return datetime.fromisoformat(s[:19]).strftime('%Y-%m-%d')
                    except Exception:
                        return None
                except Exception:
                    return None

            for v in dob_violations:
                # issuedate normalization from possible variants - DOB API uses 'issue_date' field
                raw_issue = v.get('issue_date') or v.get('issuedate') or v.get('issue_dt')
                iso_issue = _to_iso_date(raw_issue)
                if iso_issue:
                    v['issuedate'] = iso_issue
                    v['issue_date'] = iso_issue  # Keep both for compatibility

                # dispositiondate normalization from possible variants
                raw_disp = v.get('dispositiondate') or v.get('disposition_date') or v.get('disposition_dt')
                iso_disp = _to_iso_date(raw_disp)
                if iso_disp:
                    v['dispositiondate'] = iso_disp

                # Ensure status field exists
                if not v.get('status'):
                    vc = (v.get('violation_category') or v.get('violationcategory') or '').upper()
                    if 'ACTIVE' in vc:
                        v['status'] = 'ACTIVE'
                    elif 'RESOLVED' in vc or 'CLOSED' in vc or 'DISMISSED' in vc:
                        v['status'] = 'RESOLVED'

            # Sort violations by normalized issuedate in descending order (newest first)
            dob_violations.sort(
                key=lambda x: (
                    x.get('issuedate') or '1900-01-01',
                    x.get('isn_dob_bis_viol', '')  # Secondary sort by violation ID
                ),
                reverse=True  # Newest first
            )
            
            # All violations are active since we filtered for them
            active_violations = dob_violations
            
            compliance_data['dob_violations_total'] = len(dob_violations)  # Only active count
            compliance_data['dob_violations_active'] = len(active_violations)
            compliance_data['dob_violations_data'] = json.dumps(dob_violations)
            
            # Calculate DOB compliance score
            if len(active_violations) == 0:
                compliance_data['dob_compliance_score'] = 100.0
            elif len(active_violations) <= 3:
                compliance_data['dob_compliance_score'] = 85.0
            elif len(active_violations) <= 10:
                compliance_data['dob_compliance_score'] = 70.0
            elif len(active_violations) <= 20:
                compliance_data['dob_compliance_score'] = 50.0
            else:
                compliance_data['dob_compliance_score'] = 25.0
                
            print(f"📊 DOB Analysis: {len(active_violations)} ACTIVE violations found")
        else:
            compliance_data['dob_violations_total'] = 0
            compliance_data['dob_violations_active'] = 0
            compliance_data['dob_violations_data'] = json.dumps([])
            compliance_data['dob_compliance_score'] = 100.0
            print("✅ DOB Analysis: No active violations found - perfect score")
    
    async def gather_elevator_data(self, identifiers: PropertyIdentifiers, compliance_data: Dict):
        """Gather elevator data using multiple search strategies to handle BIN mismatches"""
        print("🛗 Gathering elevator data...")
        
        try:
            # Strategy 1: Search by BIN
            if identifiers.bin:
                data = self.nyc_client.get_data(
                    'elevator_inspections',
                    where=f"bin = '{identifiers.bin}'",
                    select="device_number, device_type, device_status, status_date, house_number, street_name",
                    order="status_date DESC",
                    limit=500  # Get more historical records
                )
                
                if data is not None and len(data) > 0:
                    # Group elevator data by device number to show unique devices with all inspections
                    grouped_data = self.group_devices_by_id(data, 'device_number', 'status_date')
                    compliance_data['elevator_inspections'] = grouped_data
                    unique_devices = len(grouped_data)
                    total_inspections = sum(len(device['inspections']) for device in grouped_data)
                    print(f"   ✅ Found {len(data)} total elevator records, grouped into {unique_devices} unique devices with {total_inspections} total inspections (BIN search)")
                    return
            
            # Strategy 2: Search by block/lot
            if identifiers.block and identifiers.lot:
                data = self.nyc_client.get_data(
                    'elevator_inspections',
                    where=f"block = '{identifiers.block}' AND lot = '{identifiers.lot}'",
                    select="device_number, device_type, device_status, status_date, bin, house_number, street_name",
                    order="status_date DESC",
                    limit=500  # Get more historical records
                )
                
                if data is not None and len(data) > 0:
                    # Filter data to match the correct BIN - block/lot can return multiple properties
                    if identifiers.bin:
                        filtered_data = [record for record in data if record.get('bin') == identifiers.bin]
                        if not filtered_data:
                            print(f"   ⚠️  Found {len(data)} elevator records in block/lot {identifiers.block}/{identifiers.lot}, but none match BIN {identifiers.bin}")
                            # Continue to next strategy instead of returning wrong data
                            data = []
                        else:
                            data = filtered_data
                    
                    if data and len(data) > 0:  # Only proceed if we have matching data
                        # Group elevator data by device number
                        grouped_data = self.group_devices_by_id(data, 'device_number', 'status_date')
                        compliance_data['elevator_inspections'] = grouped_data
                        unique_devices = len(grouped_data)
                        total_inspections = sum(len(device['inspections']) for device in grouped_data)
                        print(f"   ✅ Found {len(data)} total elevator records, grouped into {unique_devices} unique devices with {total_inspections} total inspections (block/lot search)")
                        return
            
            # Strategy 3: Address search with variations
            address_parts = identifiers.address.split(' ')
            if len(address_parts) >= 2:
                house_number = address_parts[0]
                street_name = ' '.join(address_parts[1:])
                
                # Try different address search patterns
                for street_pattern in [street_name, street_name.replace('AVENUE', 'AVE'), street_name.replace('AVE', 'AVENUE')]:
                    try:
                        data = self.nyc_client.get_data(
                            'elevator_inspections',
                            where=f"house_number = '{house_number}' AND street_name LIKE '%{street_pattern}%'",
                            select="device_number, device_type, device_status, status_date, bin",
                            order="status_date DESC",
                            limit=500  # Get more historical records
                        )
                        
                        if data is not None and len(data) > 0:
                            # Group elevator data by device number
                            grouped_data = self.group_devices_by_id(data, 'device_number', 'status_date')
                            compliance_data['elevator_inspections'] = grouped_data
                            unique_devices = len(grouped_data)
                            total_inspections = sum(len(device['inspections']) for device in grouped_data)
                            print(f"   ✅ Found {len(data)} total elevator records, grouped into {unique_devices} unique devices with {total_inspections} total inspections (address search)")
                            return
                    except:
                        continue
            
            print(f"   ❌ No elevator records found")
            compliance_data['elevator_inspections'] = []
            
        except Exception as e:
            print(f"   ❌ Elevator data error: {e}")
            compliance_data['elevator_inspections'] = []
    
    async def gather_boiler_data(self, identifiers: PropertyIdentifiers, compliance_data: Dict):
        """Gather boiler inspection data using BIN-only search strategy"""
        print("🔥 Gathering boiler data...")
        
        # IMPORTANT: The boiler inspections dataset (52dp-yji6) only contains these columns:
        # tracking_number, boiler_id, report_type, boiler_make, pressure_type, inspection_date,
        # defects_exist, lff_45_days, lff_180_days, filing_fee, total_amount_paid, report_status,
        # bin_number, boiler_model
        #
        # It does NOT contain address components like house_number or street_name.
        # Boiler searches can ONLY be performed using bin_number.
        
        try:
            # Only strategy available: Search by BIN
            if identifiers.bin:
                print(f"   🔍 Searching by BIN: {identifiers.bin}")
                data = self.nyc_client.get_data(
                    'boiler_inspections',
                    where=f"bin_number = '{identifiers.bin}'",
                    select="tracking_number, boiler_id, inspection_date, defects_exist, " +
                           "report_status, bin_number, boiler_make, pressure_type, report_type",
                    order="inspection_date DESC",
                    limit=500  # Get more historical records0  # Get ALL historical records - no filtering
                )
                
                if data is not None and len(data) > 0:
                    # Debug: Show original data dates
                    print(f"   🔍 Original data dates: {[item.get('inspection_date') for item in data[:5]]}")
                    
                    # Get ALL historical records and group by device ID - no time filtering
                    grouped_data = self.group_devices_by_id(data, 'boiler_id', 'inspection_date')
                    compliance_data['boiler_inspections'] = grouped_data
                    
                    # Debug: Show grouped data summary
                    unique_devices = len(grouped_data)
                    total_inspections = sum(len(device['inspections']) for device in grouped_data)
                    print(f"   🔍 Grouped into {unique_devices} unique devices with {total_inspections} total inspections")
                    
                    print(f"   ✅ Found {len(data)} total boiler records, grouped into {unique_devices} unique devices (ALL HISTORICAL DATA)")
                    
                    # Show summary of findings from grouped data
                    if grouped_data:
                        latest_device = grouped_data[0]
                        active_devices = len([device for device in grouped_data if device.get('device_status') == 'Active'])
                        defective_devices = len([device for device in grouped_data if device.get('defects_exist') == 'Yes'])
                        unique_devices = len(grouped_data)
                        
                        print(f"   📊 Latest inspection: {latest_device.get('latest_inspection_date')}")
                        print(f"   📊 Unique devices: {unique_devices}, Active devices: {active_devices}, With defects: {defective_devices}")
                    return
                else:
                    print(f"   ❌ No boiler records found for BIN {identifiers.bin}")
                    print(f"   ℹ️  This property may not have boilers requiring inspection")
            else:
                print(f"   ❌ No BIN available for boiler search")
                print(f"   ℹ️  Boiler data requires BIN number - address-based search not supported")
            
        except Exception as e:
            print(f"   ❌ Boiler data error: {e}")
            # If it's a 400 error, provide more specific guidance
            if "400 Client Error" in str(e):
                print(f"   ℹ️  Note: Boiler dataset only supports BIN-based searches")
    
    def group_devices_by_id(self, data: List[Dict], device_id_field: str, date_field: str) -> List[Dict]:
        """Group ALL device records by device ID with complete inspection history - NO time filtering"""
        from datetime import datetime
        
        # Group by device ID
        device_groups = {}
        
        for record in data:
            device_id = record.get(device_id_field)
            if not device_id:
                continue
                
            if device_id not in device_groups:
                device_groups[device_id] = {
                    'device_id': device_id,
                    'device_name': record.get('device_number', device_id),  # For elevators
                    'device_type': record.get('device_type', 'Unknown'),
                    'device_status': record.get('device_status', 'Unknown'),
                    'inspections': [],
                    'latest_inspection_date': None,
                    'total_inspections': 0,
                    'defects_exist': record.get('defects_exist', 'No'),
                    'filing_status': record.get('filing_status', 'Unknown'),
                    'house_number': record.get('house_number', ''),
                    'street_name': record.get('street_name', ''),
                    'bin': record.get('bin', record.get('bin_number', ''))
                }
            
            # Add this inspection to the device
            device_groups[device_id]['inspections'].append(record)
            
            # Update latest inspection date and status from most recent record
            inspection_date = record.get(date_field)
            if inspection_date:
                try:
                    # Handle different date formats
                    parsed_date = None
                    for fmt in ['%m/%d/%Y', '%Y-%m-%d', '%m-%d-%Y']:
                        try:
                            parsed_date = datetime.strptime(inspection_date[:10], fmt)
                            break
                        except ValueError:
                            continue
                    
                    if parsed_date and (device_groups[device_id]['latest_inspection_date'] is None or 
                        parsed_date > device_groups[device_id]['latest_inspection_date']):
                        device_groups[device_id]['latest_inspection_date'] = parsed_date
                        # Update status from most recent record
                        device_groups[device_id]['device_status'] = record.get('device_status', 'Unknown')
                        device_groups[device_id]['defects_exist'] = record.get('defects_exist', 'No')
                        device_groups[device_id]['filing_status'] = record.get('filing_status', 'Unknown')
                except (ValueError, AttributeError):
                    pass
        
        # Convert to list and sort inspections within each device by date (newest first)
        result = []
        for device_data in device_groups.values():
            device_data['inspections'].sort(key=lambda x: x.get(date_field, ''), reverse=True)
            device_data['total_inspections'] = len(device_data['inspections'])
            # Convert datetime back to string for JSON serialization
            if device_data['latest_inspection_date']:
                device_data['latest_inspection_date'] = device_data['latest_inspection_date'].strftime('%Y-%m-%d')
            result.append(device_data)
        
        # Sort devices by latest inspection date (newest first)
        result.sort(key=lambda x: x.get('latest_inspection_date', ''), reverse=True)
        
        return result
    
    async def gather_electrical_permits(self, identifiers: PropertyIdentifiers, compliance_data: Dict):
        """Gather electrical permit applications data - critical for electrical safety compliance"""
        print("⚡ Gathering electrical permits...")
        
        try:
            # Strategy 1: Search by BIN (most reliable)
            if identifiers.bin:
                data = self.nyc_client.get_data(
                    'electrical_permits',
                    where=f"bin = '{identifiers.bin}'",
                    select="filing_number, filing_date, filing_status, job_description, applicant_first_name, applicant_last_name, completion_date, amount_paid",
                    order="filing_date DESC",
                    limit=500  # Get more historical records
                )
                
                if data is not None and len(data) > 0:
                    # Group electrical permits by filing number to show unique permits with all related records
                    grouped_data = self.group_devices_by_id(data, 'filing_number', 'filing_date')
                    compliance_data['electrical_permits'] = grouped_data
                    
                    # Show summary of electrical permits
                    unique_permits = len(grouped_data)
                    total_filings = sum(len(permit['inspections']) for permit in grouped_data)
                    active_permits = len([permit for permit in grouped_data if permit.get('filing_status') in ['Approved', 'Job in Process', 'Active']])
                    
                    if grouped_data:
                        latest_permit = grouped_data[0]
                        print(f"   ✅ Found {len(data)} total electrical permit records, grouped into {unique_permits} unique permits (ALL HISTORICAL DATA)")
                        print(f"   📊 Latest permit: {latest_permit.get('device_id')} - Status: {latest_permit.get('filing_status')} ({latest_permit.get('latest_inspection_date')})")
                        if latest_permit.get('inspections') and len(latest_permit['inspections']) > 0:
                            latest_filing = latest_permit['inspections'][0]
                            print(f"   📊 Job description: {latest_filing.get('job_description', 'N/A')}")
                            if latest_filing.get('completion_date'):
                                print(f"   📊 Completion date: {latest_filing.get('completion_date')}")
                        print(f"   📊 Active permits: {active_permits} out of {unique_permits} total")
                    return
            
            # Strategy 2: Search by block/lot as fallback
            if identifiers.borough and identifiers.block:
                # Map borough names for electrical dataset
                boro_map = {'MANHATTAN': 'MANHATTAN', 'BRONX': 'BRONX', 'BROOKLYN': 'BROOKLYN', 
                           'QUEENS': 'QUEENS', 'STATEN ISLAND': 'STATEN ISLAND'}
                borough_name = boro_map.get(identifiers.borough, identifiers.borough)
                
                data = self.nyc_client.get_data(
                    'electrical_permits',
                    where=f"borough = '{borough_name}' AND block = '{identifiers.block}'",
                    select="filing_number, filing_date, filing_status, job_description, bin",
                    order="filing_date DESC",
                    limit=500  # Get more historical records
                )
                
                if data is not None and len(data) > 0:
                    # Group electrical permits by filing number
                    grouped_data = self.group_devices_by_id(data, 'filing_number', 'filing_date')
                    compliance_data['electrical_permits'] = grouped_data
                    unique_permits = len(grouped_data)
                    total_filings = sum(len(permit['inspections']) for permit in grouped_data)
                    print(f"   ✅ Found {len(data)} total electrical permit records, grouped into {unique_permits} unique permits (block search)")
                    return
            
            print(f"   ❌ No electrical permit records found")
            print(f"   ℹ️  This may indicate no recent electrical work or permits")
            
        except Exception as e:
            print(f"   ❌ Electrical permits error: {e}")
    
    async def gather_certificate_of_occupancy(self, identifiers: PropertyIdentifiers, compliance_data: Dict):
        """Gather Certificate of Occupancy data - critical for legal occupancy status"""
        print("🏢 Gathering Certificate of Occupancy data...")
        
        try:
            # Strategy 1: Search by BIN (most reliable)
            if identifiers.bin:
                data = self.nyc_client.get_data(
                    'certificate_of_occupancy',
                    where=f"bin = '{identifiers.bin}'",
                    select="bin, c_of_o_filing_type, c_of_o_status, c_of_o_issuance_date, job_type, block, lot, house_no, street_name",
                    order="c_of_o_issuance_date DESC",
                    limit=50
                )
                
                if data is not None and len(data) > 0:
                    compliance_data['certificate_of_occupancy'] = data
                    
                    # Show summary of C of O status
                    latest_co = data[0]
                    active_cos = len(data[data['c_of_o_status'].isin(['Issued', 'Active', 'Current'])])
                    
                    print(f"   ✅ Found {len(compliance_data['certificate_of_occupancy'])} Certificate of Occupancy records")
                    print(f"   📊 Latest C of O: {latest_co['c_of_o_filing_type']} - Status: {latest_co['c_of_o_status']} ({latest_co['c_of_o_issuance_date']})")
                    print(f"   📊 Job Type: {latest_co.get('job_type', 'N/A')}")
                    print(f"   📊 Address: {latest_co.get('house_no', '')} {latest_co.get('street_name', '')}")
                    return
            
            # Strategy 2: Search by block/lot as fallback
            if identifiers.block and identifiers.lot:
                data = self.nyc_client.get_data(
                    'certificate_of_occupancy',
                    where=f"block = '{identifiers.block}' AND lot = '{identifiers.lot}'",
                    select="bin, c_of_o_filing_type, c_of_o_status, c_of_o_issuance_date, job_type, block, lot, house_no, street_name",
                    order="c_of_o_issuance_date DESC",
                    limit=50
                )
                
                if data is not None and len(data) > 0:
                    compliance_data['certificate_of_occupancy'] = data
                    print(f"   ✅ Found {len(compliance_data['certificate_of_occupancy'])} C of O records (block/lot search)")
                    
                    # Show latest record
                    latest_co = data[0]
                    print(f"   📊 Latest C of O: {latest_co['c_of_o_filing_type']} - Status: {latest_co['c_of_o_status']}")
                    return
            
            print(f"   ❌ No Certificate of Occupancy records found")
            print(f"   ⚠️  This may indicate occupancy compliance issues")
            
        except Exception as e:
            print(f"   ❌ Certificate of Occupancy error: {e}")
    
    def clean_data_for_json(self, data: List[Dict]) -> List[Dict]:
        """Clean data by replacing NaN values with None for JSON serialization and handling invalid dates"""
        cleaned_data = []
        date_fields = ['issue_date', 'inspection_date', 'inspectiondate', 'status_date', 'filing_date', 'approveddate', 'originalcorrectbydate']
        
        for item in data:
            cleaned_item = {}
            for key, value in item.items():
                # Handle various types of NaN/null values
                if value is None or (isinstance(value, float) and math.isnan(value)) or str(value).lower() == 'nan':
                    cleaned_item[key] = None
                # Handle date fields specifically
                elif key.lower() in date_fields or 'date' in key.lower():
                    cleaned_value = self.clean_date_value(value)
                    cleaned_item[key] = cleaned_value
                else:
                    cleaned_item[key] = value
            cleaned_data.append(cleaned_item)
        return cleaned_data
    
    def clean_date_value(self, date_value) -> str:
        """Clean and validate date values, returning None for invalid dates"""
        if date_value is None:
            return None
            
        date_str = str(date_value).strip()
        
        # Return None for empty or obviously invalid values
        if not date_str or date_str.lower() in ['nan', 'null', 'none', '', 'invalid date']:
            return None
            
        try:
            # Try to parse the date to validate it
            from datetime import datetime
            
            # Handle common date formats
            date_formats = ['%Y-%m-%d', '%m/%d/%Y', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%dT%H:%M:%S.%f']
            
            for fmt in date_formats:
                try:
                    parsed_date = datetime.strptime(date_str[:len(fmt.replace('%f', '000'))], fmt)
                    # Validate reasonable date range (after 1900)
                    if parsed_date.year >= 1900:
                        return date_str
                    else:
                        return None
                except ValueError:
                    continue
            
            # If no format worked, try generic parsing
            parsed_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            if parsed_date.year >= 1900:
                return date_str
            else:
                return None
                
        except Exception:
            # If all parsing fails, return None
            return None
    
    def create_compliance_record(self, identifiers: PropertyIdentifiers, compliance_data: Dict) -> ComplianceRecord:
        """Create structured compliance record from gathered data"""
        
        print(f"\n📊 STEP 3: CREATING COMPLIANCE RECORD")
        print("-" * 40)
        
        # Calculate compliance metrics - use new violation data keys
        hpd_total = compliance_data.get('hpd_violations_total', 0)
        hpd_active = compliance_data.get('hpd_violations_active', 0)
        
        dob_total = compliance_data.get('dob_violations_total', 0)
        dob_active = compliance_data.get('dob_violations_active', 0)
        
        # Handle both old flat format and new grouped format for backward compatibility
        elevator_inspections = compliance_data.get('elevator_inspections', [])
        if elevator_inspections and len(elevator_inspections) > 0 and isinstance(elevator_inspections[0], dict) and 'device_id' in elevator_inspections[0]:
            # New grouped format
            elevator_total = len(elevator_inspections)
            elevator_active = len([e for e in elevator_inspections if e.get('device_status') == 'Active'])
        elif elevator_inspections and len(elevator_inspections) > 0:
            # Old flat format (fallback)
            elevator_total = len(elevator_inspections)
            elevator_active = len([e for e in elevator_inspections if e.get('device_status') == 'Active'])
        else:
            # No elevator data found
            elevator_total = 0
            elevator_active = 0
        
        boiler_inspections = compliance_data['boiler_inspections']
        if boiler_inspections and isinstance(boiler_inspections[0], dict) and 'device_id' in boiler_inspections[0]:
            # New grouped format
            boiler_total = len(boiler_inspections)
        else:
            # Old flat format (fallback)
            boiler_total = len(boiler_inspections)
        
        electrical_permits = compliance_data['electrical_permits']
        if electrical_permits and isinstance(electrical_permits[0], dict) and 'device_id' in electrical_permits[0]:
            # New grouped format
            electrical_total = len(electrical_permits)
            electrical_active = len([e for e in electrical_permits if e.get('filing_status') in ['Approved', 'Job in Process', 'Active', 'Permit Issued']])
        else:
            # Old flat format (fallback)
            electrical_total = len(electrical_permits)
            electrical_active = len([e for e in electrical_permits if e.get('filing_status') in ['Approved', 'Job in Process', 'Active', 'Permit Issued']])
        
        # Calculate compliance scores
        hpd_score = max(0, 100 - (hpd_active * 10)) if hpd_total > 0 else 100
        dob_score = max(0, 100 - (dob_active * 15)) if dob_total > 0 else 100
        elevator_score = (elevator_active / elevator_total * 100) if elevator_total > 0 else 100
        
        # Electrical compliance: Recent permits indicate active maintenance
        electrical_score = 100
        if electrical_total > 0:
            # Score based on recent activity and permit status
            recent_permits = len([e for e in compliance_data['electrical_permits']
                                if e.get('filing_date') and 
                                datetime.strptime(e['filing_date'][:10], '%Y-%m-%d').year >= datetime.now().year - 2])
            if recent_permits == 0:
                electrical_score = 70  # No recent electrical work may indicate neglect
            elif electrical_active > 0:
                electrical_score = 90   # Active permits show ongoing maintenance
        else:
            electrical_score = 85  # No permits may be normal for some buildings
        
        overall_score = (hpd_score * 0.3 + dob_score * 0.3 + elevator_score * 0.2 + electrical_score * 0.2)
        
        # Create compliance record
        record = ComplianceRecord(
            address=identifiers.address,
            bin=identifiers.bin,
            bbl=identifiers.bbl,
            borough=identifiers.borough,
            block=identifiers.block,
            lot=identifiers.lot,
            zip_code=identifiers.zip_code,
            
            hpd_violations_total=hpd_total,
            hpd_violations_active=hpd_active,
            dob_violations_total=dob_total,
            dob_violations_active=dob_active,
            
            elevator_devices_total=elevator_total,
            elevator_devices_active=elevator_active,
            boiler_devices_total=boiler_total,
            electrical_permits_total=electrical_total,
            electrical_permits_active=electrical_active,
            
            hpd_compliance_score=hpd_score,
            dob_compliance_score=dob_score,
            elevator_compliance_score=elevator_score,
            electrical_compliance_score=electrical_score,
            overall_compliance_score=overall_score,
            
            hpd_violations_data=compliance_data.get('hpd_violations_data', '[]'),
            dob_violations_data=compliance_data.get('dob_violations_data', '[]'),
            elevator_data=json.dumps(self.clean_data_for_json(compliance_data['elevator_inspections'])),
            boiler_data=json.dumps(self.clean_data_for_json(compliance_data['boiler_inspections'])),
            electrical_data=json.dumps(self.clean_data_for_json(compliance_data['electrical_permits'])),
            
            processed_at=datetime.now().isoformat(),
            data_sources="NYC_Open_Data,NYC_Planning_GeoSearch"
        )
        
        print(f"✅ Compliance record created")
        print(f"   Overall Score: {record.overall_compliance_score:.1f}/100")
        print(f"   HPD: {record.hpd_violations_total} total, {record.hpd_violations_active} active")
        print(f"   DOB: {record.dob_violations_total} total, {record.dob_violations_active} active")
        print(f"   Elevators: {record.elevator_devices_total} total, {record.elevator_devices_active} active")
        print(f"   Boilers: {record.boiler_devices_total} total")
        print(f"   Electrical: {record.electrical_permits_total} permits, {record.electrical_permits_active} active")
        
        return record
    
    def create_empty_record(self, address: str) -> ComplianceRecord:
        """Create empty compliance record for failed searches"""
        return ComplianceRecord(
            address=address,
            bin=None,
            bbl=None,
            borough=None,
            block=None,
            lot=None,
            zip_code=None,
            processed_at=datetime.now().isoformat(),
            data_sources="FAILED"
        )
    
    async def display_comprehensive_report(self, record: ComplianceRecord):
        """Display comprehensive compliance report"""
        
        print(f"\n" + "="*80)
        print("📊 COMPREHENSIVE PROPERTY COMPLIANCE REPORT")
        print("="*80)
        
        print(f"🏢 PROPERTY INFORMATION:")
        print(f"   Address: {record.address}")
        print(f"   BIN: {record.bin}")
        print(f"   BBL: {record.bbl}")
        print(f"   Borough: {record.borough}")
        print(f"   Block/Lot: {record.block}/{record.lot}")
        print(f"   ZIP Code: {record.zip_code}")
        
        print(f"\n📈 COMPLIANCE SCORES:")
        print(f"   Overall Score: {record.overall_compliance_score:.1f}/100")
        print(f"   HPD Score: {record.hpd_compliance_score:.1f}/100")
        print(f"   DOB Score: {record.dob_compliance_score:.1f}/100")
        print(f"   Elevator Score: {record.elevator_compliance_score:.1f}/100")
        print(f"   Electrical Score: {record.electrical_compliance_score:.1f}/100")
        
        print(f"\n📊 VIOLATION SUMMARY:")
        print(f"   HPD Violations: {record.hpd_violations_total} total, {record.hpd_violations_active} active")
        print(f"   DOB Violations: {record.dob_violations_total} total, {record.dob_violations_active} active")
        
        print(f"\n🏗️ EQUIPMENT SUMMARY:")
        print(f"   Elevator Devices: {record.elevator_devices_total} total, {record.elevator_devices_active} active")
        print(f"   Boiler Devices: {record.boiler_devices_total} total")
        print(f"   Electrical Permits: {record.electrical_permits_total} total, {record.electrical_permits_active} active")
        
        # Show sample violations if available
        hpd_violations = json.loads(record.hpd_violations_data)
        if hpd_violations:
            print(f"\n🔍 SAMPLE HPD VIOLATIONS:")
            for i, violation in enumerate(hpd_violations[:3], 1):
                status = violation.get('violationstatus', 'N/A')
                date = violation.get('approveddate', 'N/A')
                desc = violation.get('novdescription', 'N/A')[:60] + '...' if violation.get('novdescription') else 'N/A'
                print(f"   {i}. Status: {status} | Date: {date}")
                print(f"      Description: {desc}")
        
        elevator_data = json.loads(record.elevator_data)
        if elevator_data:
            print(f"\n🛗 ELEVATOR DEVICES:")
            for i, device in enumerate(elevator_data[:5], 1):
                device_num = device.get('device_number', 'N/A')
                device_type = device.get('device_type', 'N/A')
                status = device.get('device_status', 'N/A')
                date = device.get('status_date', 'N/A')
                print(f"   {i}. Device: {device_num} | Type: {device_type} | Status: {status} | Date: {date}")
        
        print(f"\n✅ Report processed at: {record.processed_at}")
        print(f"📊 Data sources: {record.data_sources}")

async def main():
    """Main function to process property with comprehensive compliance analysis"""
    
    if len(sys.argv) < 2:
        print("Usage: python comprehensive_property_compliance.py 'ADDRESS' [BOROUGH]")
        print("Example: python comprehensive_property_compliance.py '140 West 28th Street' 'Manhattan'")
        print("         python comprehensive_property_compliance.py '1662 Park Avenue, New York, NY 10035'")
        sys.exit(1)
    
    address = sys.argv[1]
    borough = sys.argv[2] if len(sys.argv) > 2 else None
    
    # Initialize comprehensive compliance system
    system = ComprehensivePropertyComplianceSystem()
    
    # Process the property
    record = await system.process_property(address, borough)
    
    # Display comprehensive report
    await system.display_comprehensive_report(record)
    
    # Save to file
    output_file = f"comprehensive_compliance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    
    # Convert dataclass to dict for JSON serialization
    record_dict = {
        'address': record.address,
        'bin': record.bin,
        'bbl': record.bbl,
        'borough': record.borough,
        'block': record.block,
        'lot': record.lot,
        'zip_code': record.zip_code,
        'hpd_violations_total': record.hpd_violations_total,
        'hpd_violations_active': record.hpd_violations_active,
        'dob_violations_total': record.dob_violations_total,
        'dob_violations_active': record.dob_violations_active,
        'elevator_devices_total': record.elevator_devices_total,
        'elevator_devices_active': record.elevator_devices_active,
        'boiler_devices_total': record.boiler_devices_total,
        'electrical_permits_total': record.electrical_permits_total,
        'electrical_permits_active': record.electrical_permits_active,
        'hpd_compliance_score': record.hpd_compliance_score,
        'dob_compliance_score': record.dob_compliance_score,
        'elevator_compliance_score': record.elevator_compliance_score,
        'electrical_compliance_score': record.electrical_compliance_score,
        'overall_compliance_score': record.overall_compliance_score,
        'hpd_violations_data': record.hpd_violations_data,
        'dob_violations_data': record.dob_violations_data,
        'elevator_data': record.elevator_data,
        'boiler_data': record.boiler_data,
        'electrical_data': record.electrical_data,
        'processed_at': record.processed_at,
        'data_sources': record.data_sources
    }
    
    with open(output_file, 'w') as f:
        json.dump(record_dict, f, indent=2)
    
    print(f"\n💾 Full report saved to: {output_file}")
    print(f"🎯 SUCCESS: Comprehensive compliance analysis complete for {address}")
    print(f"📊 Overall Compliance Score: {record.overall_compliance_score:.1f}/100")

if __name__ == "__main__":
    asyncio.run(main())
