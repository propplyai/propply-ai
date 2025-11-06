#!/usr/bin/env python3
"""
Propply AI - Intelligent Compliance Management Platform
Modern Flask web application for property compliance management
"""

from flask import Flask, render_template, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
import json
import os
import uuid
import asyncio
import logging
import requests
from datetime import datetime, timedelta
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv('.env.local')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
from NYC_data import NYCOpenDataClient
from complianceNYC import ComprehensivePropertyComplianceSystem
from nyc_data_sync_service import NYCDataSyncService
from philly_enhanced_data_client import PhillyEnhancedDataClient
from philly_property_finder import search_property_by_address as philly_search_property, get_property_compliance as philly_get_compliance
from mechanical_systems_client import MechanicalSystemsClient
from ai_compliance_analyzer import AIComplianceAnalyzer
from simple_vendor_marketplace import SimpleVendorMarketplace
from stripe_service import stripe_service

app = Flask(__name__, 
           static_folder='build/static', 
           static_url_path='/static',
           template_folder='build')
CORS(app)  # Enable CORS for React frontend

# Initialize AI analyzer
ai_analyzer = AIComplianceAnalyzer()

# Initialize simple vendor marketplace
vendor_marketplace = SimpleVendorMarketplace(
    apify_token=os.getenv('APIFY_TOKEN')
)

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
# Use service role key for backend operations (bypasses RLS)
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
if supabase_url and supabase_key:
    supabase = create_client(supabase_url, supabase_key)
    print(f"✅ Supabase connected with {'service role' if 'SUPABASE_SERVICE_ROLE_KEY' in os.environ else 'anon'} key")
else:
    print("Warning: Supabase credentials not found")
    supabase = None

# Initialize NYC data sync service
try:
    nyc_sync_service = NYCDataSyncService()
except Exception as e:
    print(f"Warning: NYC Sync Service initialization failed: {e}")
    nyc_sync_service = None

def get_client(city='NYC'):
    """Get Open Data client with config for specified city"""
    try:
        if city.upper() == 'NYC':
            return NYCOpenDataClient.from_config()
        elif city.upper() == 'PHILADELPHIA' or city.upper() == 'PHILLY':
            return PhillyEnhancedDataClient()
        else:
            raise ValueError(f"Unsupported city: {city}")
    except Exception as e:
        print(f"Error initializing {city} client: {e}")
        return None

@app.route('/api/info')
def api_info():
    """API info endpoint"""
    return jsonify({
        'message': 'Propply AI MVP API',
        'version': '2.0',
        'endpoints': {
            'health': '/api/health',
            'search': '/api/search',
            'compliance': '/api/compliance',
            'ai_analysis': '/api/ai-optimized-analysis',
            'ai_callback': '/api/ai-callback'
        },
        'documentation': 'See README_MVP.md for complete API documentation'
    })

# Old template routes - now handled by React app
# @app.route('/portfolio')
# @app.route('/compliance')
# @app.route('/marketplace')
# @app.route('/analytics')
# @app.route('/settings')
# @app.route('/add-property')

@app.route('/add_property', methods=['POST'])
def add_property_post():
    """Handle property addition form submission"""
    try:
        data = request.get_json()
        
        # Extract form data
        address = data.get('address', '').strip()
        property_type = data.get('property_type')
        units = data.get('units')
        contact_name = data.get('contact_name')
        contact_email = data.get('contact_email')
        contact_phone = data.get('contact_phone')
        
        # Optional fields
        year_built = data.get('year_built')
        square_footage = data.get('square_footage')
        management_company = data.get('management_company')
        owner_name = data.get('owner_name')
        owner_email = data.get('owner_email')
        compliance_systems = data.get('compliance_systems', [])
        
        if not address:
            return jsonify({'error': 'Property address is required'}), 400
        
        # Try to auto-discover property data via Open Data APIs
        # Determine city from address or user input
        city = data.get('city', 'NYC').upper()
        if 'philadelphia' in address.lower() or 'philly' in address.lower():
            city = 'PHILADELPHIA'
        
        client = get_client(city)
        property_data = {'user_input': data, 'city': city}
        
        if client:
            try:
                if city == 'NYC':
                    matches = search_property_by_address(client, address)
                    if matches and len(matches) > 0:
                        best_match = matches[0]
                        property_data['nyc_data'] = {
                            'bin': best_match.get('bin'),
                            'borough': best_match.get('borough'),
                            'block': best_match.get('block'),
                            'lot': best_match.get('lot'),
                            'address': best_match.get('address')
                        }
                elif city == 'PHILADELPHIA':
                    matches = philly_search_property(client, address)
                    if matches and len(matches) > 0:
                        best_match = matches[0]
                        property_data['philly_data'] = {
                            'opa_account': best_match.get('opa_account'),
                            'market_value': best_match.get('market_value'),
                            'assessed_value': best_match.get('assessed_value'),
                            'zoning': best_match.get('zoning'),
                            'address': best_match.get('address')
                        }
            except Exception as e:
                print(f"Auto-discovery failed for {city}: {e}")
        
        # Generate a property ID (in real app, this would be saved to database)
        property_id = str(uuid.uuid4())
        
        # Trigger compliance report generation in background
        try:
            if supabase and city == 'NYC':
                # Store property in database first
                property_record = {
                    'id': property_id,
                    'user_id': data.get('user_id', 'anonymous'),
                    'address': address,
                    'city': city,
                    'property_type': property_type,
                    'units': units,
                    'year_built': year_built,
                    'square_footage': square_footage,
                    'contact_name': contact_name,
                    'contact_email': contact_email,
                    'contact_phone': contact_phone,
                    'management_company': management_company,
                    'owner_name': owner_name,
                    'owner_email': owner_email,
                    'compliance_systems': compliance_systems,
                    'status': 'Active',
                    'created_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat()
                }
                
                # Add NYC-specific data if available
                if 'nyc_data' in property_data:
                    property_record.update({
                        'bin': property_data['nyc_data'].get('bin'),
                        'borough': property_data['nyc_data'].get('borough'),
                        'block': property_data['nyc_data'].get('block'),
                        'lot': property_data['nyc_data'].get('lot')
                    })
                
                # Insert property into database
                supabase.table('properties').insert(property_record).execute()
                print(f"✅ Property saved to database: {property_id}")

                # Auto-sync NYC data to Supabase
                if nyc_sync_service:
                    print(f"🔄 Starting automatic NYC data sync for {address}")
                    try:
                        sync_result = nyc_sync_service.sync_property_data(
                            property_id=property_id,
                            address=address,
                            bin_number=property_data['nyc_data'].get('bin'),
                            bbl=None  # Will be fetched by sync service
                        )

                        if sync_result.get('success'):
                            print(f"✅ NYC data synced successfully")
                            print(f"   - HPD Violations: {sync_result.get('hpd_violations', 0)}")
                            print(f"   - DOB Violations: {sync_result.get('dob_violations', 0)}")
                            print(f"   - Boiler Inspections: {sync_result.get('boiler_inspections', 0)}")
                            print(f"   - Elevator Inspections: {sync_result.get('elevator_inspections', 0)}")
                        else:
                            print(f"⚠️ NYC data sync failed: {sync_result.get('message')}")
                    except Exception as sync_error:
                        print(f"⚠️ NYC data sync error: {sync_error}")
                else:
                    print(f"⚠️ NYC Sync Service not available - skipping auto-sync")
                    
        except Exception as e:
            print(f"⚠️ Background report generation failed: {e}")
            # Don't fail the property addition if report generation fails
        
        return jsonify({
            'success': True,
            'message': 'Property added successfully! NYC data sync completed.',
            'property_id': property_id,
            'data': property_data,
            'data_sync': 'completed' if nyc_sync_service else 'unavailable'
        })
        
    except Exception as e:
        print(f"Add property error: {e}")
        return jsonify({'error': f'Failed to add property: {str(e)}'}), 500

# API Endpoints
@app.route('/api/property/search', methods=['POST'])
def api_property_search():
    """Enhanced property search with auto-populated data for simplified form"""
    try:
        data = request.get_json()
        address = data.get('address', '').strip()
        city = data.get('city', 'NYC').upper()
        
        if not address:
            return jsonify({'error': 'Address is required'}), 400
        
        # Auto-detect city from address
        if 'philadelphia' in address.lower() or 'philly' in address.lower() or ', pa' in address.lower():
            city = 'Philadelphia'
        elif any(borough in address.lower() for borough in ['brooklyn', 'queens', 'bronx', 'manhattan', 'staten island']) or ', ny' in address.lower() or 'new york' in address.lower():
            city = 'NYC'
        
        property_data = {
            'address': address,
            'city': city,
            'type': 'Residential',  # Default
            'units': None,
            'year_built': None,
            'bin': None,
            'opa_account': None
        }
        
        try:
            if city == 'NYC':
                # Use comprehensive NYC compliance system
                compliance_system = ComprehensivePropertyComplianceSystem()
                
                # Get property identifiers using the comprehensive system
                import asyncio
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    identifiers = loop.run_until_complete(
                        compliance_system.get_property_identifiers(address)
                    )
                finally:
                    loop.close()
                
                if identifiers:
                    property_data.update({
                        'bin': identifiers.bin,
                        'bbl': identifiers.bbl,
                        'borough': identifiers.borough,
                        'block': identifiers.block,
                        'lot': identifiers.lot,
                        'address': identifiers.address,
                        'zip_code': identifiers.zip_code
                    })
                            
            elif city == 'Philadelphia':
                # Use Philly Property Finder
                from philly_property_finder import search_property_by_address as philly_search
                from philly_enhanced_data_client import PhiladelphiaEnhancedDataClient
                
                philly_client = PhiladelphiaEnhancedDataClient()
                results = philly_client.search_property_by_address(address)
                
                if results and len(results) > 0:
                    best_match = results[0]
                    property_data.update({
                        'opa_account': best_match.get('opa_account') or best_match.get('parcel_number'),
                        'address': best_match.get('location', address),
                        'year_built': best_match.get('year_built'),
                        'units': best_match.get('number_of_units') or best_match.get('total_livable_area', 0) // 1000 if best_match.get('total_livable_area') else None,
                        'type': 'Residential' if 'residential' in str(best_match.get('category', '')).lower() else 'Commercial'
                    })
        except Exception as e:
            print(f"Error fetching detailed property data for {city}: {e}")
            # Continue with basic data
        
        return jsonify({
            'success': True,
            'property': property_data,
            'message': f'Property data retrieved from {city}'
        })
        
    except Exception as e:
        print(f"Property search error: {e}")
        return jsonify({'error': f'Failed to search property: {str(e)}'}), 500

@app.route('/api/search', methods=['POST'])
def api_search_property():
    """Search for property by address"""
    try:
        data = request.get_json()
        address = data.get('address', '').strip()
        zip_code = data.get('zip_code', '').strip() or None
        city = data.get('city', 'NYC').upper()
        
        if not address:
            return jsonify({'error': 'Address is required'}), 400
        
        # Auto-detect city from address if not specified
        if 'philadelphia' in address.lower() or 'philly' in address.lower():
            city = 'PHILADELPHIA'
        
        client = get_client(city)
        if not client:
            return jsonify({'error': f'Unable to connect to {city} Open Data'}), 500
        
        # Search for properties based on city
        if city == 'NYC':
            # Use comprehensive compliance system for NYC property search
            compliance_system = ComprehensivePropertyComplianceSystem()
            
            # Get property identifiers using the comprehensive system
            import asyncio
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                identifiers = loop.run_until_complete(
                    compliance_system.get_property_identifiers(address)
                )
            finally:
                loop.close()
            
            if identifiers:
                matches = [{
                    'address': identifiers.address,
                    'bin': identifiers.bin,
                    'bbl': identifiers.bbl,
                    'borough': identifiers.borough,
                    'block': identifiers.block,
                    'lot': identifiers.lot,
                    'zip_code': identifiers.zip_code,
                    'dataset': 'NYC_Planning_GeoSearch',
                    'strategy': 'comprehensive_search'
                }]
            else:
                matches = []
        elif city == 'PHILADELPHIA':
            matches = philly_search_property(client, address)
        else:
            return jsonify({'error': f'Unsupported city: {city}'}), 400
        
        if not matches:
            return jsonify({'matches': [], 'message': 'No properties found'})
        
        # Format matches for frontend
        formatted_matches = []
        for match in matches:
            if match and hasattr(match, 'get'):
                if city == 'NYC':
                    formatted_match = {
                        'address': match.get('address', 'Unknown Address'),
                        'borough': match.get('borough', 'Unknown'),
                        'bin': match.get('bin'),
                        'block': match.get('block'),
                        'lot': match.get('lot'),
                        'dataset': match.get('dataset'),
                        'strategy': match.get('strategy'),
                        'city': 'NYC'
                    }
                else:  # Philadelphia
                    formatted_match = {
                        'address': match.get('address', 'Unknown Address'),
                        'opa_account': match.get('opa_account'),
                        'market_value': match.get('market_value'),
                        'assessed_value': match.get('assessed_value'),
                        'zoning': match.get('zoning'),
                        'dataset': match.get('dataset'),
                        'strategy': match.get('strategy'),
                        'city': 'PHILADELPHIA'
                    }
                formatted_matches.append(formatted_match)
        
        return jsonify({'matches': formatted_matches, 'city': city})
        
    except Exception as e:
        print(f"Search error: {e}")
        return jsonify({'error': f'Search failed: {str(e)}'}), 500

@app.route('/api/compliance', methods=['POST'])
def api_generate_compliance():
    """Generate compliance report for selected property"""
    try:
        data = request.get_json()
        city = data.get('city', 'NYC').upper()
        
        # NYC-specific parameters
        bin_number = data.get('bin')
        borough = data.get('borough')
        block = data.get('block')
        lot = data.get('lot')
        
        # Philadelphia-specific parameters
        address = data.get('address')
        opa_account = data.get('opa_account')
        
        client = get_client(city)
        if not client:
            return jsonify({'error': f'Unable to connect to {city} Open Data'}), 500
        
        # Generate compliance report based on city
        if city == 'NYC':
            # Use comprehensive compliance system for NYC
            compliance_system = ComprehensivePropertyComplianceSystem()
            
            # Process the property using the comprehensive system
            import asyncio
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                record = loop.run_until_complete(
                    compliance_system.process_property(address, borough)
                )
            finally:
                loop.close()
            
            # Convert to the expected format
            report = {
                'address': record.address,
                'bin': record.bin,
                'bbl': record.bbl,
                'borough': record.borough,
                'compliance_summary': {
                    'overall_score': record.overall_compliance_score,
                    'hpd_score': record.hpd_compliance_score,
                    'dob_score': record.dob_compliance_score,
                    'elevator_score': record.elevator_compliance_score,
                    'electrical_score': record.electrical_compliance_score,
                    'hpd_violations_total': record.hpd_violations_total,
                    'hpd_violations_active': record.hpd_violations_active,
                    'dob_violations_total': record.dob_violations_total,
                    'dob_violations_active': record.dob_violations_active,
                    'elevator_devices_total': record.elevator_devices_total,
                    'elevator_devices_active': record.elevator_devices_active,
                    'boiler_devices_total': record.boiler_devices_total,
                    'electrical_permits_total': record.electrical_permits_total,
                    'electrical_permits_active': record.electrical_permits_active
                },
                'hpd_violations': json.loads(record.hpd_violations_data),
                'dob_violations': json.loads(record.dob_violations_data),
                'elevator_inspections': json.loads(record.elevator_data),
                'boiler_inspections': json.loads(record.boiler_data),
                'electrical_permits': json.loads(record.electrical_data),
                'processed_at': record.processed_at,
                'data_sources': record.data_sources
            }
        elif city == 'PHILADELPHIA':
            if not address:
                return jsonify({'error': 'Address is required for Philadelphia'}), 400
            report = client.get_comprehensive_property_data(address)
        else:
            return jsonify({'error': f'Unsupported city: {city}'}), 400
        
        if not report:
            return jsonify({'error': 'Unable to generate compliance report'}), 500
        
        # Save report to file
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"compliance_report_{city.lower()}_{timestamp}.json"
        filepath = os.path.join('static', filename)
        
        with open(filepath, 'w') as f:
            json.dump(report, f, indent=2)
        
        return jsonify({
            'report': report,
            'download_url': f'/static/{filename}',
            'generated_at': datetime.now().isoformat(),
            'city': city
        })
        
    except Exception as e:
        return jsonify({'error': f'Compliance report generation failed: {str(e)}'}), 500


@app.route('/api/ai-optimized-analysis', methods=['POST'])
def api_initiate_ai_analysis():
    """
    Initiate AI-powered compliance analysis via n8n webhook
    
    Workflow Step 1: Frontend → /api/ai-optimized-analysis → Propply optimizes data → n8n webhook
    """
    try:
        data = request.get_json()
        address = data.get('address')
        property_id = data.get('property_id')
        
        if not address:
            return jsonify({'error': 'Property address is required'}), 400
        
        # Get compliance data first
        city = data.get('city', 'Philadelphia').upper()
        if 'philadelphia' in address.lower() or 'philly' in address.lower():
            city = 'PHILADELPHIA'
        
        client = get_client(city)
        
        if not client:
            return jsonify({'error': f'Unable to connect to {city} Open Data'}), 500
        
        # Get comprehensive compliance data
        if city == 'NYC':
            # Use comprehensive compliance system for NYC
            compliance_system = ComprehensivePropertyComplianceSystem()
            
            # Process the property using the comprehensive system
            import asyncio
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                record = loop.run_until_complete(
                    compliance_system.process_property(address, borough)
                )
            finally:
                loop.close()
            
            # Convert to the expected format for AI analysis
            compliance_data = {
                'address': record.address,
                'bin': record.bin,
                'bbl': record.bbl,
                'borough': record.borough,
                'compliance_summary': {
                    'overall_score': record.overall_compliance_score,
                    'hpd_score': record.hpd_compliance_score,
                    'dob_score': record.dob_compliance_score,
                    'elevator_score': record.elevator_compliance_score,
                    'electrical_score': record.electrical_compliance_score,
                    'hpd_violations_total': record.hpd_violations_total,
                    'hpd_violations_active': record.hpd_violations_active,
                    'dob_violations_total': record.dob_violations_total,
                    'dob_violations_active': record.dob_violations_active,
                    'elevator_devices_total': record.elevator_devices_total,
                    'elevator_devices_active': record.elevator_devices_active,
                    'boiler_devices_total': record.boiler_devices_total,
                    'electrical_permits_total': record.electrical_permits_total,
                    'electrical_permits_active': record.electrical_permits_active
                },
                'hpd_violations': json.loads(record.hpd_violations_data),
                'dob_violations': json.loads(record.dob_violations_data),
                'elevator_inspections': json.loads(record.elevator_data),
                'boiler_inspections': json.loads(record.boiler_data),
                'electrical_permits': json.loads(record.electrical_data),
                'processed_at': record.processed_at,
                'data_sources': record.data_sources
            }
        elif city == 'PHILADELPHIA':
            from philly_enhanced_data_client import PhillyEnhancedDataClient
            enhanced_client = PhillyEnhancedDataClient()
            compliance_data = enhanced_client.get_comprehensive_property_data(address)
            
            if 'error' in compliance_data:
                return jsonify({'error': compliance_data['error']}), 500
        else:
            return jsonify({'error': f'Unsupported city: {city}'}), 400
        
        # Prepare property info
        property_info = {
            'address': address,
            'property_id': property_id or str(uuid.uuid4()),
            'city': city
        }
        
        # Initiate AI analysis via n8n webhook (async)
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(
                ai_analyzer.analyze_compliance_data(compliance_data, property_info)
            )
        finally:
            loop.close()
        
        return jsonify(result)
        
    except Exception as e:
        print(f"AI Analysis initiation error: {e}")
        return jsonify({'error': f'AI analysis initiation failed: {str(e)}'}), 500

@app.route('/api/ai-callback', methods=['POST'])
def api_ai_callback():
    """
    Receive AI analysis results from n8n webhook
    
    Workflow Step 4: n8n + External AI → AI analysis → /api/ai-callback → Supabase storage
    """
    try:
        webhook_payload = request.get_json()
        
        if not webhook_payload:
            return jsonify({'error': 'No payload received'}), 400
        
        # Process AI callback and store in Supabase
        result = ai_analyzer.handle_ai_callback(webhook_payload)
        
        return jsonify(result)
        
    except Exception as e:
        print(f"AI Callback error: {e}")
        return jsonify({'error': f'AI callback processing failed: {str(e)}'}), 500

@app.route('/api/sync-nyc-property', methods=['POST'])
def api_sync_nyc_property():
    """
    Sync NYC Open Data to Supabase for a specific property

    Flow: Frontend → This endpoint → NYC APIs → Supabase storage

    Request body:
    {
        "property_id": "uuid",
        "address": "666 Broadway, New York, NY 10012",
        "bin": "1001620" (optional),
        "bbl": "1001620001" (optional)
    }
    """
    try:
        if not nyc_sync_service:
            return jsonify({'error': 'NYC Sync Service not available. Check Supabase configuration.'}), 500

        data = request.get_json()
        property_id = data.get('property_id')
        address = data.get('address')
        bin_number = data.get('bin')
        bbl = data.get('bbl')

        if not property_id or not address:
            return jsonify({'error': 'property_id and address are required'}), 400

        logger.info(f"🗽 Starting NYC sync for property {property_id}: {address}")

        # Run sync
        result = nyc_sync_service.sync_property_data(
            property_id=property_id,
            address=address,
            bin_number=bin_number,
            bbl=bbl
        )

        if result.get('success'):
            return jsonify({
                'success': True,
                'message': 'NYC data synced successfully',
                'data': result
            })
        else:
            return jsonify({
                'success': False,
                'message': 'NYC sync completed with errors',
                'data': result
            }), 500

    except Exception as e:
        logger.error(f"NYC sync error: {e}", exc_info=True)
        return jsonify({'error': f'NYC sync failed: {str(e)}'}), 500

@app.route('/api/nyc-comprehensive-data', methods=['POST'])
def api_nyc_comprehensive_data():
    """
    Get comprehensive NYC data using the enhanced compliance system
    
    Request body:
    {
        "address": "140 W 28th St, New York, NY 10001",
        "borough": "Manhattan" (optional)
    }
    """
    try:
        data = request.get_json()
        address = data.get('address')
        borough = data.get('borough')

        if not address:
            return jsonify({'error': 'address is required'}), 400

        logger.info(f"🗽 Fetching comprehensive NYC compliance data for: {address}")

        # Initialize comprehensive compliance system
        compliance_system = ComprehensivePropertyComplianceSystem()
        
        # Process the property using the comprehensive system
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            record = loop.run_until_complete(
                compliance_system.process_property(address, borough)
            )
        finally:
            loop.close()
        
        # Convert the compliance record to a dictionary for JSON response
        compliance_data = {
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
            'hpd_violations_data': json.loads(record.hpd_violations_data),
            'dob_violations_data': json.loads(record.dob_violations_data),
            'elevator_data': json.loads(record.elevator_data),
            'boiler_data': json.loads(record.boiler_data),
            'electrical_data': json.loads(record.electrical_data),
            'processed_at': record.processed_at,
            'data_sources': record.data_sources
        }
        
        return jsonify({
            'success': True,
            'message': 'Comprehensive NYC compliance data fetched successfully',
            'data': compliance_data
        })

    except Exception as e:
        logger.error(f"NYC comprehensive data error: {e}", exc_info=True)
        return jsonify({'error': f'NYC data fetch failed: {str(e)}'}), 500

@app.route('/api/nyc-property-data/<property_id>', methods=['GET'])
def api_get_nyc_property_data(property_id):
    """
    Get all stored NYC compliance data for a property from Supabase
    
    Returns:
    - Property info (BIN, BBL, address)
    - Compliance summary (score, risk level)
    - DOB violations
    - HPD violations  
    - Elevator inspections
    - Boiler inspections
    - 311 complaints
    """
    try:
        if not nyc_sync_service:
            return jsonify({'error': 'NYC Sync Service not available'}), 500
        
        logger.info(f"📊 Fetching NYC data for property {property_id}")
        
        # Get data from Supabase
        data = nyc_sync_service.get_property_compliance_data(property_id)
        
        if 'error' in data:
            return jsonify({'error': data['error']}), 404
        
        return jsonify({
            'success': True,
            'data': data
        })
        
    except Exception as e:
        logger.error(f"Error fetching NYC data: {e}", exc_info=True)
        return jsonify({'error': f'Failed to fetch NYC data: {str(e)}'}), 500

@app.route('/api/dashboard-data')
def api_dashboard_data():
    """Get dashboard overview data"""
    try:
        # Mock data for demonstration - replace with real data
        dashboard_data = {
            'overview': {
                'total_properties': 12,
                'compliance_rate': 87.5,
                'pending_inspections': 3,
                'overdue_items': 1
            },
            'upcoming_deadlines': [
                {
                    'property': '123 Main St, Brooklyn',
                    'inspection_type': 'Boiler Inspection',
                    'due_date': (datetime.now() + timedelta(days=7)).isoformat(),
                    'priority': 'high'
                },
                {
                    'property': '456 Oak Ave, Manhattan',
                    'inspection_type': 'Elevator Inspection',
                    'due_date': (datetime.now() + timedelta(days=14)).isoformat(),
                    'priority': 'medium'
                },
                {
                    'property': '789 Pine St, Queens',
                    'inspection_type': 'Fire Safety',
                    'due_date': (datetime.now() + timedelta(days=21)).isoformat(),
                    'priority': 'low'
                }
            ],
            'recent_activity': [
                {
                    'type': 'inspection_completed',
                    'property': '123 Main St, Brooklyn',
                    'description': 'Boiler inspection completed successfully',
                    'timestamp': (datetime.now() - timedelta(hours=2)).isoformat()
                },
                {
                    'type': 'violation_resolved',
                    'property': '456 Oak Ave, Manhattan',
                    'description': 'DOB violation resolved',
                    'timestamp': (datetime.now() - timedelta(days=1)).isoformat()
                }
            ]
        }
        
        return jsonify(dashboard_data)
        
    except Exception as e:
        return jsonify({'error': f'Failed to load dashboard data: {str(e)}'}), 500

@app.route('/api/vendors/search', methods=['POST'])
def api_search_vendors():
    """Search for verified vendors"""
    try:
        data = request.get_json()
        property_address = data.get('property_address', '').strip()
        service_type = data.get('service_type', '').strip()
        compliance_requirements = data.get('compliance_requirements', [])
        
        if not property_address or not service_type:
            return jsonify({'error': 'Property address and service type are required'}), 400
        
        # Run async vendor search
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(
                vendor_marketplace.find_verified_vendors(
                    property_address=property_address,
                    service_type=service_type,
                    compliance_requirements=compliance_requirements
                )
            )
        finally:
            loop.close()
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Vendor search error: {e}")
        return jsonify({'error': f'Vendor search failed: {str(e)}'}), 500

@app.route('/api/vendors/compliance', methods=['POST'])
def api_get_compliance_vendors():
    """Get vendors for specific compliance categories"""
    try:
        data = request.get_json()
        compliance_categories = data.get('compliance_categories', [])
        
        if not compliance_categories:
            return jsonify({'error': 'Compliance categories are required'}), 400
        
        # Run async compliance vendor search
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(
                vendor_marketplace.get_compliance_vendors(compliance_categories)
            )
        finally:
            loop.close()
        
        return jsonify({
            'compliance_categories': compliance_categories,
            'vendors_by_category': result,
            'search_timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"Compliance vendor search error: {e}")
        return jsonify({'error': f'Compliance vendor search failed: {str(e)}'}), 500

# Mechanical Systems API Endpoints
@app.route('/api/mechanical/elevator', methods=['POST'])
def api_get_elevator_data():
    """Get elevator inspection and permit data"""
    try:
        data = request.get_json()
        address = data.get('address', '').strip()
        city = data.get('city', 'NYC').upper()
        bin_number = data.get('bin_number')  # For NYC
        
        if not address:
            return jsonify({'error': 'Address is required'}), 400
        
        # Initialize mechanical systems client
        mechanical_client = MechanicalSystemsClient(city)
        
        # Get elevator data
        elevator_data = mechanical_client.get_elevator_data(address, bin_number)
        
        if 'error' in elevator_data:
            return jsonify({'error': elevator_data['error']}), 500
        
        return jsonify({
            'elevator_data': elevator_data,
            'generated_at': datetime.now().isoformat(),
            'city': city
        })
        
    except Exception as e:
        print(f"Elevator data error: {e}")
        return jsonify({'error': f'Elevator data retrieval failed: {str(e)}'}), 500

@app.route('/api/mechanical/boiler', methods=['POST'])
def api_get_boiler_data():
    """Get boiler inspection and permit data"""
    try:
        data = request.get_json()
        address = data.get('address', '').strip()
        city = data.get('city', 'NYC').upper()
        bin_number = data.get('bin_number')  # For NYC
        
        if not address:
            return jsonify({'error': 'Address is required'}), 400
        
        # Initialize mechanical systems client
        mechanical_client = MechanicalSystemsClient(city)
        
        # Get boiler data
        boiler_data = mechanical_client.get_boiler_data(address, bin_number)
        
        if 'error' in boiler_data:
            return jsonify({'error': boiler_data['error']}), 500
        
        return jsonify({
            'boiler_data': boiler_data,
            'generated_at': datetime.now().isoformat(),
            'city': city
        })
        
    except Exception as e:
        print(f"Boiler data error: {e}")
        return jsonify({'error': f'Boiler data retrieval failed: {str(e)}'}), 500

@app.route('/api/mechanical/electrical', methods=['POST'])
def api_get_electrical_data():
    """Get electrical inspection and permit data"""
    try:
        data = request.get_json()
        address = data.get('address', '').strip()
        city = data.get('city', 'NYC').upper()
        bin_number = data.get('bin_number')  # For NYC
        
        if not address:
            return jsonify({'error': 'Address is required'}), 400
        
        # Initialize mechanical systems client
        mechanical_client = MechanicalSystemsClient(city)
        
        # Get electrical data
        electrical_data = mechanical_client.get_electrical_data(address, bin_number)
        
        if 'error' in electrical_data:
            return jsonify({'error': electrical_data['error']}), 500
        
        return jsonify({
            'electrical_data': electrical_data,
            'generated_at': datetime.now().isoformat(),
            'city': city
        })
        
    except Exception as e:
        print(f"Electrical data error: {e}")
        return jsonify({'error': f'Electrical data retrieval failed: {str(e)}'}), 500

@app.route('/api/mechanical/comprehensive', methods=['POST'])
def api_get_comprehensive_mechanical_data():
    """Get comprehensive mechanical systems data (elevator, boiler, electrical)"""
    try:
        data = request.get_json()
        address = data.get('address', '').strip()
        city = data.get('city', 'NYC').upper()
        bin_number = data.get('bin_number')  # For NYC
        
        if not address:
            return jsonify({'error': 'Address is required'}), 400
        
        # Initialize mechanical systems client
        mechanical_client = MechanicalSystemsClient(city)
        
        # Get comprehensive mechanical data
        comprehensive_data = mechanical_client.get_comprehensive_mechanical_data(address, bin_number)
        
        if 'error' in comprehensive_data:
            return jsonify({'error': comprehensive_data['error']}), 500
        
        # Save comprehensive report to file
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"mechanical_systems_report_{city.lower()}_{timestamp}.json"
        filepath = os.path.join('static', filename)
        
        with open(filepath, 'w') as f:
            json.dump(comprehensive_data, f, indent=2)
        
        return jsonify({
            'comprehensive_data': comprehensive_data,
            'download_url': f'/static/{filename}',
            'generated_at': comprehensive_data.get('generated_at'),
            'city': city
        })
        
    except Exception as e:
        print(f"Comprehensive mechanical data error: {e}")
        return jsonify({'error': f'Comprehensive mechanical data retrieval failed: {str(e)}'}), 500

@app.route('/vendor-marketplace')
def vendor_marketplace_page():
    """Render vendor marketplace page"""
    return render_template('propply/vendor_marketplace.html')

@app.route('/api/health')
def api_health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '2.0'
    })

@app.route('/api/debug/paths')
def api_debug_paths():
    """Debug endpoint to check file paths"""
    import os
    current_dir = os.getcwd()
    script_dir = os.path.dirname(__file__)
    
    build_paths = [
        os.path.join(current_dir, 'build', 'index.html'),
        os.path.join(script_dir, 'build', 'index.html'),
        'build/index.html'
    ]
    
    results = {}
    for path in build_paths:
        results[path] = {
            'exists': os.path.exists(path),
            'is_file': os.path.isfile(path) if os.path.exists(path) else False,
            'size': os.path.getsize(path) if os.path.exists(path) else 0
        }
    
    return jsonify({
        'current_dir': current_dir,
        'script_dir': script_dir,
        'build_paths': results,
        'build_dir_contents': os.listdir('build') if os.path.exists('build') else 'build directory not found'
    })

# ============================================
# FRONTEND INTEGRATION ENDPOINTS
# ============================================

@app.route('/api/compliance-reports', methods=['GET'])
def api_get_compliance_reports():
    """Get all compliance reports for a user"""
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        
        # Get reports first
        reports = supabase.table('compliance_reports')\
            .select('*')\
            .eq('user_id', user_id)\
            .order('generated_at', desc=True)\
            .execute()
        
        if not reports.data:
            return jsonify({
                'success': True,
                'reports': []
            })
        
        # Get property details for each report
        reports_with_properties = []
        for report in reports.data:
            property_data = supabase.table('properties')\
                .select('*')\
                .eq('id', report['property_id'])\
                .single()\
                .execute()
            
            report_with_property = {
                **report,
                'properties': property_data.data if property_data.data else None
            }
            reports_with_properties.append(report_with_property)
        
        return jsonify({
            'success': True,
            'reports': reports_with_properties
        })
            
    except Exception as e:
        logger.error(f"Error fetching compliance reports: {e}")
        return jsonify({'error': f'Failed to fetch reports: {str(e)}'}), 500

@app.route('/api/compliance-reports/<report_id>', methods=['GET'])
def api_get_compliance_report(report_id):
    """Get a specific compliance report with full details"""
    try:
        # Get report first
        report = supabase.table('compliance_reports')\
            .select('*')\
            .eq('id', report_id)\
            .single()\
            .execute()
        
        if not report.data:
            return jsonify({'error': 'Report not found'}), 404
        
        # Get property details separately
        property_data = supabase.table('properties')\
            .select('*')\
            .eq('id', report.data['property_id'])\
            .single()\
            .execute()
        
        # Combine the data
        report_with_property = {
            **report.data,
            'properties': property_data.data if property_data.data else None
        }
        
        return jsonify({
            'success': True,
            'report': report_with_property
        })
        
    except Exception as e:
        logger.error(f"Error fetching compliance report: {e}")
        return jsonify({'error': f'Failed to fetch report: {str(e)}'}), 500

@app.route('/api/compliance-reports/<report_id>/dismiss-violation', methods=['POST'])
def api_dismiss_violation(report_id):
    """Dismiss an individual violation and recalculate compliance scores"""
    try:
        data = request.get_json()
        violation_type = data.get('violation_type')  # 'HPD' or 'DOB'
        violation_id = data.get('violation_id')
        violation_data = data.get('violation_data', {})
        dismissed_by = data.get('dismissed_by', 'user')
        dismiss_reason = data.get('dismiss_reason', '')
        
        if not violation_type or not violation_id:
            return jsonify({'error': 'Missing required fields'}), 400
        
        if violation_type not in ['HPD', 'DOB']:
            return jsonify({'error': 'Invalid violation type'}), 400
        
        # Insert dismissed violation record
        dismissed_record = supabase.table('dismissed_violations').insert({
            'report_id': report_id,
            'violation_type': violation_type,
            'violation_id': violation_id,
            'violation_data': violation_data,
            'dismissed_by': dismissed_by,
            'dismiss_reason': dismiss_reason
        }).execute()
        
        # Recalculate compliance scores using database function
        result = supabase.rpc('recalculate_compliance_score', {
            'report_uuid': report_id
        }).execute()
        
        logger.info(f"Violation dismissed: {violation_type} {violation_id} from report {report_id}")
        
        return jsonify({
            'success': True,
            'message': 'Violation dismissed successfully',
            'recalculation': result.data
        })
        
    except Exception as e:
        logger.error(f"Error dismissing violation: {e}")
        return jsonify({'error': f'Failed to dismiss violation: {str(e)}'}), 500

@app.route('/api/compliance-reports/<report_id>/restore-violation', methods=['POST'])
def api_restore_violation(report_id):
    """Restore a dismissed violation and recalculate compliance scores"""
    try:
        data = request.get_json()
        violation_type = data.get('violation_type')  # 'HPD' or 'DOB'
        violation_id = data.get('violation_id')
        
        if not violation_type or not violation_id:
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Delete dismissed violation record
        supabase.table('dismissed_violations')\
            .delete()\
            .eq('report_id', report_id)\
            .eq('violation_type', violation_type)\
            .eq('violation_id', violation_id)\
            .execute()
        
        # Recalculate compliance scores using database function
        result = supabase.rpc('recalculate_compliance_score', {
            'report_uuid': report_id
        }).execute()
        
        logger.info(f"Violation restored: {violation_type} {violation_id} from report {report_id}")
        
        return jsonify({
            'success': True,
            'message': 'Violation restored successfully',
            'recalculation': result.data
        })
        
    except Exception as e:
        logger.error(f"Error restoring violation: {e}")
        return jsonify({'error': f'Failed to restore violation: {str(e)}'}), 500

@app.route('/api/compliance-reports/<report_id>/dismissed-violations', methods=['GET'])
def api_get_dismissed_violations(report_id):
    """Get all dismissed violations for a report"""
    try:
        dismissed = supabase.table('dismissed_violations')\
            .select('*')\
            .eq('report_id', report_id)\
            .execute()
        
        return jsonify({
            'success': True,
            'dismissed_violations': dismissed.data
        })
        
    except Exception as e:
        logger.error(f"Error fetching dismissed violations: {e}")
        return jsonify({'error': f'Failed to fetch dismissed violations: {str(e)}'}), 500

@app.route('/api/properties/<property_id>/compliance-data', methods=['GET'])
def api_get_property_compliance_data(property_id):
    """Get comprehensive compliance data for a property"""
    try:
        # Get property details
        property_data = supabase.table('properties')\
            .select('*')\
            .eq('id', property_id)\
            .single()\
            .execute()
        
        if not property_data.data:
            return jsonify({'error': 'Property not found'}), 404
        
        property_info = property_data.data
        city = property_info.get('city', 'NYC').upper()
        
        # Get compliance data based on city
        if city == 'NYC':
            # Get NYC property data
            nyc_property = supabase.table('nyc_properties')\
                .select('*')\
                .eq('property_id', property_id)\
                .single()\
                .execute()
            
            if not nyc_property.data:
                return jsonify({'error': 'NYC property data not found'}), 404
            
            nyc_property_id = nyc_property.data['id']
            
            # Get compliance summary
            compliance_summary = supabase.table('nyc_compliance_summary')\
                .select('*')\
                .eq('nyc_property_id', nyc_property_id)\
                .single()\
                .execute()
            
            # Get violations
            dob_violations = supabase.table('nyc_dob_violations')\
                .select('*')\
                .eq('nyc_property_id', nyc_property_id)\
                .execute()
            
            hpd_violations = supabase.table('nyc_hpd_violations')\
                .select('*')\
                .eq('nyc_property_id', nyc_property_id)\
                .execute()
            
            # Get equipment data
            elevators = supabase.table('nyc_elevator_inspections')\
                .select('*')\
                .eq('nyc_property_id', nyc_property_id)\
                .execute()
            
            boilers = supabase.table('nyc_boiler_inspections')\
                .select('*')\
                .eq('nyc_property_id', nyc_property_id)\
                .execute()
            
            electrical_permits = supabase.table('nyc_electrical_permits')\
                .select('*')\
                .eq('nyc_property_id', nyc_property_id)\
                .execute()
            
            return jsonify({
                'success': True,
                'property': property_info,
                'nyc_property': nyc_property.data,
                'compliance_summary': compliance_summary.data,
                'violations': {
                    'dob': dob_violations.data or [],
                    'hpd': hpd_violations.data or []
                },
                'equipment': {
                    'elevators': elevators.data or [],
                    'boilers': boilers.data or [],
                    'electrical': electrical_permits.data or []
                }
            })
        
        else:
            return jsonify({'error': f'Compliance data not yet supported for {city}'}), 400
        
    except Exception as e:
        logger.error(f"Error fetching property compliance data: {e}")
        return jsonify({'error': f'Failed to fetch compliance data: {str(e)}'}), 500

@app.route('/api/properties/<property_id>/sync', methods=['POST'])
def api_sync_property_data(property_id):
    """Sync property data with city APIs"""
    try:
        # Get property details
        property_data = supabase.table('properties')\
            .select('*')\
            .eq('id', property_id)\
            .single()\
            .execute()
        
        if not property_data.data:
            return jsonify({'error': 'Property not found'}), 404
        
        property_info = property_data.data
        city = property_info.get('city', 'NYC').upper()
        
        if city == 'NYC':
            # Use NYC sync service
            if not nyc_sync_service:
                return jsonify({'error': 'NYC Sync Service not available'}), 500
            
            result = nyc_sync_service.sync_property_data(
                property_id=property_id,
                address=property_info['address'],
                bin_number=property_info.get('bin_number'),
                bbl=property_info.get('bbl')
            )
            
            return jsonify({
                'success': result.get('success', False),
                'message': result.get('message', 'Sync completed'),
                'data': result
            })
        
        else:
            return jsonify({'error': f'Sync not yet supported for {city}'}), 400
        
    except Exception as e:
        logger.error(f"Error syncing property data: {e}")
        return jsonify({'error': f'Sync failed: {str(e)}'}), 500

@app.route('/api/dashboard/overview', methods=['GET'])
def api_get_dashboard_overview():
    """Get dashboard overview data"""
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        
        # Get user's properties
        properties = supabase.table('properties')\
            .select('*')\
            .eq('user_id', user_id)\
            .execute()
        
        # Get compliance reports
        reports = supabase.table('compliance_reports')\
            .select('*')\
            .eq('user_id', user_id)\
            .execute()
        
        # Calculate overview metrics
        total_properties = len(properties.data) if properties.data else 0
        total_reports = len(reports.data) if reports.data else 0
        completed_reports = len([r for r in (reports.data or []) if r.get('status') == 'completed'])
        
        # Calculate average compliance score
        avg_compliance_score = 0
        if reports.data:
            scores = [r.get('compliance_score', 0) for r in reports.data if r.get('compliance_score')]
            avg_compliance_score = sum(scores) / len(scores) if scores else 0
        
        # Get recent activity
        recent_reports = sorted(reports.data or [], key=lambda x: x.get('generated_at', ''), reverse=True)[:5]
        
        return jsonify({
            'success': True,
            'overview': {
                'total_properties': total_properties,
                'total_reports': total_reports,
                'completed_reports': completed_reports,
                'average_compliance_score': round(avg_compliance_score, 1),
                'compliance_rate': round((completed_reports / total_reports * 100) if total_reports > 0 else 0, 1)
            },
            'recent_activity': recent_reports,
            'properties': properties.data or []
        })
        
    except Exception as e:
        logger.error(f"Error fetching dashboard overview: {e}")
        return jsonify({'error': f'Failed to fetch dashboard data: {str(e)}'}), 500

# ============================================
# COMPLIANCE REPORT GENERATION ENDPOINTS
# ============================================

@app.route('/api/generate-compliance-report', methods=['POST'])
def api_generate_compliance_report():
    """
    Generate comprehensive compliance report for a property
    
    Request body:
    {
        "property_id": "uuid",
        "address": "140 West 28th Street, New York, NY 10001",
        "city": "NYC",
        "bin_number": "1001620" (optional)
    }
    """
    try:
        data = request.get_json()
        property_id = data.get('property_id')
        address = data.get('address')
        city = data.get('city', 'NYC')
        bin_number = data.get('bin_number')
        
        if not property_id or not address:
            return jsonify({'error': 'property_id and address are required'}), 400
        
        logger.info(f"🏢 Generating compliance report for {address} in {city}")
        
        # For NYC properties, run comprehensive compliance analysis
        if city.upper() == 'NYC':
            try:
                # Initialize the comprehensive compliance system
                compliance_system = ComprehensivePropertyComplianceSystem()
                
                # Process the property and get compliance data
                import asyncio
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                
                compliance_record = loop.run_until_complete(
                    compliance_system.process_property(address)
                )
                
                # Convert compliance record to dict for JSON serialization
                compliance_data = {
                    'address': compliance_record.address,
                    'bin': compliance_record.bin,
                    'bbl': compliance_record.bbl,
                    'borough': compliance_record.borough,
                    'block': compliance_record.block,
                    'lot': compliance_record.lot,
                    'zip_code': compliance_record.zip_code,
                    'hpd_violations_total': compliance_record.hpd_violations_total,
                    'hpd_violations_active': compliance_record.hpd_violations_active,
                    'dob_violations_total': compliance_record.dob_violations_total,
                    'dob_violations_active': compliance_record.dob_violations_active,
                    'elevator_devices_total': compliance_record.elevator_devices_total,
                    'elevator_devices_active': compliance_record.elevator_devices_active,
                    'boiler_devices_total': compliance_record.boiler_devices_total,
                    'electrical_permits_total': compliance_record.electrical_permits_total,
                    'electrical_permits_active': compliance_record.electrical_permits_active,
                    'hpd_compliance_score': compliance_record.hpd_compliance_score,
                    'dob_compliance_score': compliance_record.dob_compliance_score,
                    'elevator_compliance_score': compliance_record.elevator_compliance_score,
                    'electrical_compliance_score': compliance_record.electrical_compliance_score,
                    'overall_compliance_score': compliance_record.overall_compliance_score,
                    'hpd_violations_data': compliance_record.hpd_violations_data,
                    'dob_violations_data': compliance_record.dob_violations_data,
                    'elevator_data': compliance_record.elevator_data,
                    'boiler_data': compliance_record.boiler_data,
                    'electrical_data': compliance_record.electrical_data,
                    'processed_at': compliance_record.processed_at,
                    'data_sources': compliance_record.data_sources
                }
                
                # Save compliance data to database (only if property exists)
                try:
                    save_compliance_data_to_db(property_id, compliance_data)
                except Exception as db_error:
                    logger.warning(f"Could not save compliance data to database: {db_error}")
                    # Continue with response even if database save fails
                
                return jsonify({
                    'success': True,
                    'message': 'Compliance report generated successfully',
                    'data': compliance_data
                })
                
            except Exception as e:
                logger.error(f"Error running NYC compliance analysis: {e}")
                return jsonify({
                    'success': False,
                    'error': f'NYC compliance analysis failed: {str(e)}'
                }), 500
        
        else:
            # For non-NYC properties, return a placeholder response
            return jsonify({
                'success': True,
                'message': 'Compliance analysis not available for this city',
                'data': {
                    'compliance_score': 85,
                    'violations': [],
                    'recommendations': ['Compliance analysis available for NYC properties only']
                }
            })
        
    except Exception as e:
        logger.error(f"Error generating compliance report: {e}")
        return jsonify({'error': f'Compliance report generation failed: {str(e)}'}), 500

def save_standalone_compliance_report(property_id, compliance_data):
    """Save standalone compliance report using safe insert function"""
    try:
        # Convert compliance score to decimal
        compliance_score = float(compliance_data.get('overall_compliance_score', 0))
        risk_level = get_risk_level(compliance_score)
        
        # Use the safe insert function
        result = supabase.rpc('safe_insert_compliance_report', {
            'p_user_id': 'a54bbfc2-5435-4c2a-b061-788234cb5e43',  # Default test user
            'p_property_id': property_id,
            'p_report_type': 'full_compliance',
            'p_status': 'completed',
            'p_compliance_score': compliance_score,
            'p_risk_level': risk_level,
            'p_ai_analysis': compliance_data,
            'p_generated_at': compliance_data.get('processed_at', datetime.now().isoformat())
        }).execute()
        
        if result.data:
            report_id = result.data
            logger.info(f"✅ Saved standalone compliance report: {report_id}")
            return {'id': report_id}
        else:
            logger.error("No data returned from safe_insert_compliance_report")
            return None
            
    except Exception as e:
        logger.error(f"Error saving standalone report: {e}")
        # Fallback to direct insert if RPC fails
        try:
            report_data = {
                'id': str(uuid.uuid4()),
                'property_id': property_id,
                'user_id': 'a54bbfc2-5435-4c2a-b061-788234cb5e43',
                'report_type': 'full_compliance',
                'status': 'completed',
                'compliance_score': float(compliance_data.get('overall_compliance_score', 0)),
                'risk_level': get_risk_level(compliance_data.get('overall_compliance_score', 0)),
                'ai_analysis': compliance_data,
                'generated_at': compliance_data.get('processed_at', datetime.now().isoformat()),
                'created_at': datetime.now().isoformat()
            }
            
            result = supabase.table('compliance_reports').insert([report_data]).execute()
            logger.info(f"✅ Saved standalone compliance report (fallback): {report_data['id']}")
            return result.data[0] if result.data else None
        except Exception as fallback_error:
            logger.error(f"Fallback insert also failed: {fallback_error}")
            return None

def save_compliance_data_to_db(property_id, compliance_data):
    """Save compliance data to Supabase database"""
    try:
        # Check if property exists in properties table first
        try:
            property_exists = supabase.table('properties')\
                .select('id')\
                .eq('id', property_id)\
                .execute()
            
            if not property_exists.data:
                logger.warning(f"Property {property_id} not found in properties table, saving as standalone report")
                # Save as standalone report without property reference
                return save_standalone_compliance_report(property_id, compliance_data)
        except Exception as prop_check_error:
            logger.warning(f"Could not check property existence: {prop_check_error}, saving as standalone report")
            return save_standalone_compliance_report(property_id, compliance_data)
        
        # First, get or create the NYC property record
        nyc_property_result = supabase.table('nyc_properties')\
            .select('id')\
            .eq('property_id', property_id)\
            .execute()
        
        nyc_property_id = None
        if nyc_property_result.data:
            nyc_property_id = nyc_property_result.data[0]['id']
        else:
            # Create NYC property record
            new_nyc_property = supabase.table('nyc_properties')\
                .insert([{
                    'property_id': property_id,
                    'address': compliance_data.get('address', ''),
                    'bin': compliance_data.get('bin'),
                    'bbl': compliance_data.get('bbl'),
                    'borough': compliance_data.get('borough'),
                    'block': compliance_data.get('block'),
                    'lot': compliance_data.get('lot'),
                    'zip_code': compliance_data.get('zip_code')
                }])\
                .execute()
            
            if new_nyc_property.data:
                nyc_property_id = new_nyc_property.data[0]['id']
        
        if not nyc_property_id:
            raise Exception("Failed to create or find NYC property record")
        
        # Save compliance summary
        compliance_summary = {
            'nyc_property_id': nyc_property_id,
            'compliance_score': compliance_data.get('overall_compliance_score', 85),
            'risk_level': get_risk_level(compliance_data.get('overall_compliance_score', 85)),
            'total_violations': (compliance_data.get('hpd_violations_total', 0) + 
                               compliance_data.get('dob_violations_total', 0)),
            'open_violations': (compliance_data.get('hpd_violations_active', 0) + 
                              compliance_data.get('dob_violations_active', 0)),
            'dob_violations': compliance_data.get('dob_violations_total', 0),
            'hpd_violations': compliance_data.get('hpd_violations_total', 0),
            'equipment_issues': compliance_data.get('elevator_devices_total', 0),
            'hpd_compliance_score': compliance_data.get('hpd_compliance_score', 100),
            'dob_compliance_score': compliance_data.get('dob_compliance_score', 100),
            'elevator_compliance_score': compliance_data.get('elevator_compliance_score', 100),
            'electrical_compliance_score': compliance_data.get('electrical_compliance_score', 100),
            'overall_compliance_score': compliance_data.get('overall_compliance_score', 85),
            'hpd_violations_total': compliance_data.get('hpd_violations_total', 0),
            'hpd_violations_active': compliance_data.get('hpd_violations_active', 0),
            'dob_violations_total': compliance_data.get('dob_violations_total', 0),
            'dob_violations_active': compliance_data.get('dob_violations_active', 0),
            'elevator_devices_total': compliance_data.get('elevator_devices_total', 0),
            'elevator_devices_active': compliance_data.get('elevator_devices_active', 0),
            'boiler_devices_total': compliance_data.get('boiler_devices_total', 0),
            'electrical_permits_total': compliance_data.get('electrical_permits_total', 0),
            'electrical_permits_active': compliance_data.get('electrical_permits_active', 0),
            'hpd_violations_data': compliance_data.get('hpd_violations_data', '[]'),
            'dob_violations_data': compliance_data.get('dob_violations_data', '[]'),
            'elevator_data': compliance_data.get('elevator_data', '[]'),
            'boiler_data': compliance_data.get('boiler_data', '[]'),
            'electrical_data': compliance_data.get('electrical_data', '[]'),
            'processed_at': compliance_data.get('processed_at', datetime.now().isoformat()),
            'data_sources': compliance_data.get('data_sources', 'NYC_Open_Data,NYC_Planning_GeoSearch')
        }
        
        # Upsert compliance summary
        supabase.table('nyc_compliance_summary')\
            .upsert(compliance_summary, on_conflict='nyc_property_id')\
            .execute()
        
        logger.info('Compliance data saved successfully')
        
    except Exception as e:
        logger.error(f"Error saving compliance data: {e}")
        raise e

def get_risk_level(score):
    """Determine risk level based on compliance score"""
    if score >= 90:
        return 'LOW'
    elif score >= 75:
        return 'MEDIUM'
    elif score >= 50:
        return 'HIGH'
    else:
        return 'CRITICAL'

# ============================================
# STRIPE PAYMENT ENDPOINTS
# ============================================

@app.route('/api/stripe/create-checkout-session', methods=['POST'])
def create_checkout_session():
    """Create a Stripe checkout session for subscription or one-time payment"""
    try:
        data = request.get_json()

        # Extract required fields
        tier_id = data.get('tier_id')
        user_id = data.get('user_id')
        user_email = data.get('user_email')
        price_id = data.get('price_id')
        mode = data.get('mode', 'subscription')  # 'subscription' or 'payment'
        property_data = data.get('property_data')

        if not all([tier_id, user_id, user_email, price_id]):
            return jsonify({'error': 'Missing required fields'}), 400

        # Create checkout session
        result = stripe_service.create_checkout_session(
            price_id=price_id,
            customer_email=user_email,
            user_id=user_id,
            tier_id=tier_id,
            mode=mode,
            property_data=property_data
        )

        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400

    except Exception as e:
        print(f"Error creating checkout session: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/stripe/create-portal-session', methods=['POST'])
def create_portal_session():
    """Create a customer portal session for managing subscriptions"""
    try:
        data = request.get_json()
        customer_id = data.get('customer_id')
        return_url = data.get('return_url')

        if not customer_id:
            return jsonify({'error': 'customer_id is required'}), 400

        result = stripe_service.create_customer_portal_session(
            customer_id=customer_id,
            return_url=return_url
        )

        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400

    except Exception as e:
        print(f"Error creating portal session: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/stripe/subscription/<subscription_id>', methods=['GET'])
def get_subscription(subscription_id):
    """Get subscription details"""
    try:
        result = stripe_service.get_subscription(subscription_id)

        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404

    except Exception as e:
        print(f"Error getting subscription: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/stripe/subscription/<subscription_id>/cancel', methods=['POST'])
def cancel_subscription(subscription_id):
    """Cancel a subscription"""
    try:
        data = request.get_json() or {}
        cancel_immediately = data.get('cancel_immediately', False)

        result = stripe_service.cancel_subscription(
            subscription_id=subscription_id,
            cancel_immediately=cancel_immediately
        )

        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400

    except Exception as e:
        print(f"Error cancelling subscription: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/stripe/subscription/<subscription_id>/update', methods=['POST'])
def update_subscription(subscription_id):
    """Update subscription to a new plan"""
    try:
        data = request.get_json()
        new_price_id = data.get('new_price_id')

        if not new_price_id:
            return jsonify({'error': 'new_price_id is required'}), 400

        result = stripe_service.update_subscription(
            subscription_id=subscription_id,
            new_price_id=new_price_id
        )

        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400

    except Exception as e:
        print(f"Error updating subscription: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/stripe/webhook', methods=['POST'])
def stripe_webhook():
    """Handle Stripe webhook events"""
    try:
        payload = request.data
        sig_header = request.headers.get('Stripe-Signature')

        if not sig_header:
            return jsonify({'error': 'Missing Stripe-Signature header'}), 400

        # Verify webhook signature
        event = stripe_service.verify_webhook_signature(payload, sig_header)

        if not event:
            return jsonify({'error': 'Invalid signature'}), 400

        # Process the event
        result = stripe_service.handle_webhook_event(event)

        print(f"Webhook processed: {result['event_type']}")
        print(f"Updates to apply: {result['updates']}")

        # TODO: Update user profile in Supabase with result['updates']
        # This should be done here or in a background task
        # Example:
        # if result['updates'].get('user_id'):
        #     supabase_client.update_user_subscription(
        #         user_id=result['updates']['user_id'],
        #         updates=result['updates']
        #     )

        return jsonify({'received': True, 'processed': result['processed']}), 200

    except Exception as e:
        print(f"Webhook error: {e}")
        return jsonify({'error': str(e)}), 500

# Static files are now handled automatically by Flask's static_folder configuration

# Serve favicon and other root-level static files
@app.route('/favicon.ico')
@app.route('/favicon.png')
@app.route('/favicon.svg')
@app.route('/manifest.json')
@app.route('/asset-manifest.json')
def serve_root_static():
    """Serve root-level static files"""
    import os
    filename = request.path.lstrip('/')
    try:
        return send_from_directory('build', filename)
    except FileNotFoundError:
        alt_path = os.path.join(os.getcwd(), 'build', filename)
        if os.path.exists(alt_path):
            return send_file(alt_path)
        else:
            return jsonify({'error': f'File not found: {filename}'}), 404

# Serve React app for root route only
@app.route('/')
def serve_react_app():
    """Serve the React app for the root route"""
    try:
        import os
        build_path = os.path.join(os.getcwd(), 'build', 'index.html')
        if os.path.exists(build_path):
            return send_file(build_path)
        else:
            # Try alternative path
            alt_path = os.path.join(os.path.dirname(__file__), 'build', 'index.html')
            if os.path.exists(alt_path):
                return send_file(alt_path)
            else:
                return jsonify({'error': f'React app not found. Tried: {build_path} and {alt_path}'}), 500
    except Exception as e:
        return jsonify({'error': f'Error serving React app: {str(e)}'}), 500

# Catch-all route for React Router (must be last)
@app.route('/<path:path>')
def serve_react_router(path):
    """Serve React app for client-side routing"""
    print(f"DEBUG: Catch-all route called for: {path}")
    # Don't serve React app for API routes
    if path.startswith('api/'):
        print(f"DEBUG: API route requested: {path}")
        return jsonify({'error': 'API endpoint not found'}), 404
    
    # Don't serve React app for static files
    if path.startswith('static/'):
        print(f"DEBUG: Static file route requested: {path}")
        return jsonify({'error': 'Static file not found'}), 404
    
    # Serve React app for all other routes (React Router will handle them)
    try:
        import os
        build_path = os.path.join(os.getcwd(), 'build', 'index.html')
        if os.path.exists(build_path):
            return send_file(build_path)
        else:
            # Try alternative path
            alt_path = os.path.join(os.path.dirname(__file__), 'build', 'index.html')
            if os.path.exists(alt_path):
                return send_file(alt_path)
            else:
                return jsonify({'error': f'Application not found. Tried: {build_path} and {alt_path}'}), 404
    except Exception as e:
        return jsonify({'error': f'Error serving application: {str(e)}'}), 500

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    # For API routes, return JSON error
    if request.path.startswith('/api/'):
        return jsonify({'error': 'API endpoint not found'}), 404
    # For other routes, serve React app (let React handle routing)
    try:
        import os
        build_path = os.path.join(os.getcwd(), 'build', 'index.html')
        if os.path.exists(build_path):
            return send_file(build_path)
        else:
            # Try alternative path
            alt_path = os.path.join(os.path.dirname(__file__), 'build', 'index.html')
            if os.path.exists(alt_path):
                return send_file(alt_path)
            else:
                return jsonify({'error': f'Application not found. Tried: {build_path} and {alt_path}'}), 404
    except Exception as e:
        return jsonify({'error': f'Error serving application: {str(e)}'}), 500

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # For development
    app.run(debug=True, host='0.0.0.0', port=5001)
else:
    # For production with Gunicorn
    application = app
