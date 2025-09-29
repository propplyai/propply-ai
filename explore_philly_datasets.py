#!/usr/bin/env python3
"""
Explore Philadelphia Open Data Datasets
Analyze what we currently use and what else is available
"""

from philly_enhanced_data_client import PhillyEnhancedDataClient
import requests
import json

def explore_current_datasets():
    print('🔍 Current Datasets We Pull From:')
    print('=' * 50)
    
    client = PhillyEnhancedDataClient()
    
    print('\n1. Current API Endpoints:')
    print(f'   - Carto Base URL: {client.carto_base_url}')
    print(f'   - Building Certs: {client.arcgis_building_certs_url}')
    print(f'   - Certs Summary: {client.arcgis_building_certs_summary_url}')
    print(f'   - Socrata Base: {client.socrata_base_url}')
    
    print('\n2. Test Data Availability:')
    try:
        # Test permits table
        permits_count = client._make_carto_query('SELECT COUNT(*) as count FROM permits')
        print(f'   - Permits: {permits_count[0]["count"] if permits_count else "N/A"} records')
        
        # Test violations table  
        violations_count = client._make_carto_query('SELECT COUNT(*) as count FROM violations')
        print(f'   - Violations: {violations_count[0]["count"] if violations_count else "N/A"} records')
        
        # Test other potential tables
        tables_to_check = ['cases', 'investigations', 'property_assessments', 'business_licenses']
        for table in tables_to_check:
            try:
                result = client._make_carto_query(f'SELECT COUNT(*) as count FROM {table}')
                if result:
                    print(f'   - {table.title()}: {result[0]["count"]} records')
            except:
                print(f'   - {table.title()}: Not available')
                
    except Exception as e:
        print(f'   Error testing tables: {e}')

def explore_available_datasets():
    print('\n\n🌐 Available Philadelphia Open Data Datasets:')
    print('=' * 60)
    
    # Known datasets from research
    datasets = {
        'Property & Building Data': [
            'Building and Zoning Permits (882K+ records)',
            'Code Violation Notices (1.9M+ records)', 
            'Property Assessments (200K+ properties)',
            'Building Certifications',
            'Fire Department Inspections',
            'Housing Code Violations'
        ],
        'Business & Licensing': [
            'Business Licenses (429K+ records)',
            'Food Establishment Licenses',
            'Liquor Licenses',
            'Tax Delinquencies'
        ],
        'Infrastructure & Services': [
            '311 Service Requests',
            'Street Cleaning',
            'Trash Collection',
            'Water Department Data',
            'PWD (Water) Violations'
        ],
        'Public Safety': [
            'Crime Incidents',
            'Fire Incidents',
            'Traffic Accidents',
            'Emergency Calls'
        ],
        'Transportation': [
            'SEPTA Routes & Schedules',
            'Bike Lanes',
            'Traffic Signals',
            'Parking Violations'
        ],
        'Health & Environment': [
            'COVID-19 Data',
            'Air Quality',
            'Lead Paint Violations',
            'Health Inspections'
        ],
        'Demographics & Planning': [
            'Census Data',
            'Zoning Districts',
            'Neighborhood Boundaries',
            'School Districts'
        ]
    }
    
    for category, items in datasets.items():
        print(f'\n📊 {category}:')
        for item in items:
            print(f'   - {item}')

def test_additional_endpoints():
    print('\n\n🧪 Testing Additional Data Sources:')
    print('=' * 50)
    
    # Test Socrata API
    print('\n1. Socrata API (data.phila.gov):')
    socrata_endpoints = [
        'https://data.phila.gov/resource/sspu-uyfa.json',  # Property assessments
        'https://data.phila.gov/resource/3k2y-5pgh.json',  # Business licenses
        'https://data.phila.gov/resource/4t9v-rpqt.json',  # 311 requests
    ]
    
    for endpoint in socrata_endpoints:
        try:
            response = requests.get(endpoint, params={'$limit': 1}, timeout=5)
            if response.status_code == 200:
                data = response.json()
                print(f'   ✅ {endpoint.split("/")[-1]}: Available')
            else:
                print(f'   ❌ {endpoint.split("/")[-1]}: Status {response.status_code}')
        except Exception as e:
            print(f'   ❌ {endpoint.split("/")[-1]}: Error - {e}')

def suggest_enhancements():
    print('\n\n💡 Suggested Enhancements for Propply AI:')
    print('=' * 60)
    
    enhancements = [
        {
            'dataset': 'Property Assessments',
            'benefit': 'Property values, building characteristics, tax history',
            'use_case': 'Investment analysis, property valuation, market trends'
        },
        {
            'dataset': 'Business Licenses', 
            'benefit': 'Commercial activity, business types, compliance status',
            'use_case': 'Mixed-use property analysis, commercial compliance'
        },
        {
            'dataset': '311 Service Requests',
            'benefit': 'Infrastructure issues, neighborhood maintenance',
            'use_case': 'Property condition assessment, neighborhood quality'
        },
        {
            'dataset': 'Crime Incidents',
            'benefit': 'Safety metrics, neighborhood security',
            'use_case': 'Property safety scoring, risk assessment'
        },
        {
            'dataset': 'Fire Incidents',
            'benefit': 'Fire safety history, property risk factors',
            'use_case': 'Insurance risk assessment, safety compliance'
        },
        {
            'dataset': 'Water Department Violations',
            'benefit': 'Water system compliance, utility issues',
            'use_case': 'Utility compliance tracking, infrastructure health'
        }
    ]
    
    for i, enhancement in enumerate(enhancements, 1):
        print(f'\n{i}. {enhancement["dataset"]}:')
        print(f'   Benefit: {enhancement["benefit"]}')
        print(f'   Use Case: {enhancement["use_case"]}')

if __name__ == "__main__":
    explore_current_datasets()
    explore_available_datasets()
    test_additional_endpoints()
    suggest_enhancements()
    
    print('\n\n🎯 Next Steps:')
    print('=' * 30)
    print('1. Integrate Property Assessments for valuation data')
    print('2. Add Business License data for commercial properties')
    print('3. Include 311 requests for neighborhood quality')
    print('4. Add Crime data for safety scoring')
    print('5. Integrate Fire incidents for risk assessment')

