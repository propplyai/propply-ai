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
from datetime import datetime, timedelta

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
from nyc_opendata_client import NYCOpenDataClient
from nyc_property_finder import search_property_by_address, get_property_compliance
from nyc_data_sync_service import NYCDataSyncService
from philly_enhanced_data_client import PhillyEnhancedDataClient
from philly_property_finder import search_property_by_address as philly_search_property, get_property_compliance as philly_get_compliance
from mechanical_systems_client import MechanicalSystemsClient
from ai_compliance_analyzer import AIComplianceAnalyzer
from simple_vendor_marketplace import SimpleVendorMarketplace
from stripe_service import stripe_service

app = Flask(__name__, 
           static_folder='build', 
           static_url_path='/static',
           template_folder='build')
CORS(app)  # Enable CORS for React frontend

# Initialize AI analyzer
ai_analyzer = AIComplianceAnalyzer()

# Initialize simple vendor marketplace
vendor_marketplace = SimpleVendorMarketplace(
    apify_token=os.getenv('APIFY_TOKEN')
)

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
        
        return jsonify({
            'success': True,
            'message': 'Property added successfully!',
            'property_id': property_id,
            'data': property_data
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
                # Use NYC Property Finder
                from nyc_property_finder_enhanced import NYCPropertyFinder
                finder = NYCPropertyFinder()
                results = finder.search_property_by_address(address)
                
                if results and len(results) > 0:
                    best_match = results[0]
                    property_data.update({
                        'bin': best_match.get('bin'),
                        'borough': best_match.get('borough'),
                        'address': best_match.get('address', address)
                    })
                    
                    # Try to get property details
                    bin_number = best_match.get('bin')
                    if bin_number:
                        property_details = finder.get_property_compliance_analysis(bin_number)
                        if property_details:
                            property_data['units'] = property_details.get('property_info', {}).get('units')
                            property_data['year_built'] = property_details.get('property_info', {}).get('year_built')
                            property_data['type'] = property_details.get('property_info', {}).get('building_type', 'Residential')
                            
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
            matches = search_property_by_address(client, address, zip_code)
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
            if not bin_number and not (borough and block and lot):
                return jsonify({'error': 'Either BIN or Borough/Block/Lot is required for NYC'}), 400
            report = get_property_compliance(client, bin_number, borough, block, lot)
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
            # NYC implementation would go here
            return jsonify({'error': 'NYC AI analysis not yet implemented'}), 501
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

# Serve static files from build folder
@app.route('/static/<path:path>')
def serve_static(path):
    """Serve static assets from build/static directory"""
    return send_from_directory('build/static', path)

# Serve React app for all non-API routes
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app(path):
    """Serve the React app for all non-API routes"""
    # Don't serve React app for API routes
    if path.startswith('api/'):
        return jsonify({'error': 'API endpoint not found'}), 404
    
    # Check if the path is a static file request
    if path and '.' in path.split('/')[-1]:
        try:
            return send_from_directory('build', path)
        except FileNotFoundError:
            pass
    
    # Otherwise serve the React app
    try:
        return send_file('build/index.html')
    except FileNotFoundError:
        return jsonify({'error': 'React app not built. Please run npm run build first.'}), 500

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    # For API routes, return JSON error
    if request.path.startswith('/api/'):
        return jsonify({'error': 'API endpoint not found'}), 404
    # For other routes, serve React app (let React handle routing)
    try:
        return send_file('build/index.html')
    except FileNotFoundError:
        return jsonify({'error': 'Application not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # For development
    app.run(debug=True, host='0.0.0.0', port=5002)
else:
    # For production with Gunicorn
    application = app
