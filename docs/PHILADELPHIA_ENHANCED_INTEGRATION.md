# Philadelphia Enhanced Data Integration

This document describes the enhanced Philadelphia data integration system based on comprehensive research of Philadelphia Open Data APIs. The system provides real-time access to L&I Building & Zoning Permits, Code Violations, Building Certifications, and other critical compliance data.

## 🏗️ Architecture Overview

The enhanced Philadelphia integration consists of three main components:

```
philly_enhanced_data_client.py    → Enhanced API client for Philadelphia data sources
philly_data_sync_service.py       → Automated data synchronization service
003_philadelphia_enhanced_data.sql → Enhanced database schema
```

## 📊 Available Datasets

### 1. L&I Building & Zoning Permits (2007–Present)
- **Source**: Carto SQL API (`https://phl.carto.com/api/v2/sql`)
- **Description**: Comprehensive permit records for construction and related activities
- **Includes**: Building permits, zoning permits, mechanical permits, electrical permits, plumbing permits
- **Update Frequency**: Daily
- **Key Fields**: `permitnumber`, `permittype`, `permitissuedate`, `permitdescription`, `contractor`, `status`, `bin`, `opa_account`

### 2. L&I Code Violations (Property Violations)
- **Source**: Carto SQL API (`https://phl.carto.com/api/v2/sql`)
- **Description**: All code enforcement violations for building safety and property maintenance
- **Includes**: Building code violations, fire code violations, housing code violations
- **Update Frequency**: Daily
- **Key Fields**: `violationid`, `violationdate`, `violationtype`, `violationdescription`, `status`, `compliance_date`, `inspector`

### 3. L&I Building Certifications (Periodic Inspection Records)
- **Source**: ArcGIS REST API (`https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/BUILDING_CERTS/FeatureServer/0/query`)
- **Description**: Required periodic safety inspections for building systems and structures
- **Includes**: Fire sprinkler systems, fire alarm systems, facade inspections, fire escapes, emergency power systems
- **Update Frequency**: Daily
- **Key Fields**: `certification_number`, `cert_type`, `last_inspection_date`, `inspection_result`, `expiration_date`, `inspector_company`

### 4. L&I Building Certification Summary (Compliance Status by Building)
- **Source**: ArcGIS REST API (`https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/BUILDING_CERTS_SUMMARY/FeatureServer/0/query`)
- **Description**: Property-level summary of all required certifications and their status
- **Includes**: One record per property with compliance status for all systems
- **Update Frequency**: Daily
- **Key Fields**: `structure_id`, `sprinkler_status`, `fire_alarm_status`, `facade_status`, `fire_escape_status`, etc.

### 5. L&I Case Investigations (Inspection History)
- **Source**: Carto SQL API (`https://phl.carto.com/api/v2/sql`)
- **Description**: Records of inspections/investigations conducted by L&I inspectors
- **Includes**: Property maintenance inspections, fire code inspections, complaint investigations
- **Update Frequency**: Daily
- **Key Fields**: `caseid`, `investigationcompleted`, `investigationtype`, `outcome`, `violation_issued`, `inspector`

### 6. Unsafe Buildings & Imminently Dangerous Buildings
- **Source**: ArcGIS REST API (separate endpoints)
- **Description**: Subsets of violations data highlighting hazardous structures
- **Includes**: Buildings deemed unsafe or in imminent danger of collapse
- **Update Frequency**: Daily
- **Key Fields**: `unsafe_building_id`, `designation_date`, `unsafe_reason`, `status`

## 🔧 Usage Examples

### 1. Basic Data Client Usage

```python
from philly_enhanced_data_client import PhillyEnhancedDataClient

# Initialize client
client = PhillyEnhancedDataClient()

# Get building permits for an address
permits = client.get_li_building_permits("1234 Market St, Philadelphia, PA 19107")
print(f"Found {len(permits)} permits")

# Get code violations
violations = client.get_li_code_violations("1234 Market St, Philadelphia, PA 19107", status="open")
print(f"Found {len(violations)} open violations")

# Get building certifications
certifications = client.get_li_building_certifications("1234 Market St, Philadelphia, PA 19107")
print(f"Found {len(certifications)} certifications")

# Get comprehensive property data
comprehensive_data = client.get_comprehensive_property_data("1234 Market St, Philadelphia, PA 19107")
print(f"Compliance Score: {comprehensive_data['compliance_summary']['compliance_score']}")
```

### 2. Data Synchronization Service Usage

```python
from philly_data_sync_service import PhillyDataSyncService, SyncConfig
import asyncio

# Initialize sync service
sync_service = PhillyDataSyncService(
    supabase_url="your-supabase-url",
    supabase_key="your-supabase-key",
    app_token="your-philly-app-token"  # Optional
)

# Configure sync settings
config = SyncConfig(
    sync_permits=True,
    sync_violations=True,
    sync_certifications=True,
    sync_certification_summary=True,
    sync_investigations=True,
    days_back=30,
    rate_limit_delay=1.0
)

# Sync data for a specific property
async def sync_property():
    result = await sync_service.sync_property_data(
        property_id="your-property-id",
        address="1234 Market St, Philadelphia, PA 19107",
        config=config
    )
    print(f"Sync result: {result}")

# Sync all Philadelphia properties
async def sync_all_properties():
    results = await sync_service.sync_all_philadelphia_properties(config)
    print(f"Synced {results['successful_syncs']} properties successfully")

# Run sync
asyncio.run(sync_property())
```

### 3. Database Schema Usage

The enhanced database schema includes the following tables:

```sql
-- L&I Building & Zoning Permits
philly_li_permits
- permit_number, permit_type, permit_issued_date
- permit_description, work_type, contractor
- status, bin, opa_account

-- L&I Code Violations
philly_li_violations
- violation_id, violation_date, violation_type
- violation_code, violation_description, status
- compliance_date, inspector

-- Building Certifications
philly_building_certifications
- certification_number, certification_type
- last_inspection_date, inspection_result
- expiration_date, inspector_company

-- Building Certification Summary
philly_building_certification_summary
- structure_id, sprinkler_status, fire_alarm_status
- facade_status, fire_escape_status
- emergency_power_status, etc.

-- Case Investigations
philly_case_investigations
- case_id, investigation_completed_date
- investigation_type, outcome
- violation_issued, inspector

-- Enhanced Property Fields
properties (enhanced with Philadelphia-specific fields)
- bin, opa_account, market_value, assessed_value
- zoning, use_code, year_built, etc.
```

## 🚀 Getting Started

### 1. Environment Setup

```bash
# Add to your .env.local
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
PHILLY_APP_TOKEN=your-philly-app-token  # Optional for higher rate limits
```

### 2. Database Migration

```bash
# Apply the enhanced Philadelphia migration
psql -h your-supabase-host -U postgres -d postgres -f supabase/migrations/003_philadelphia_enhanced_data.sql
```

### 3. Test the Integration

```python
# Test the enhanced client
python philly_enhanced_data_client.py

# Test the sync service
python philly_data_sync_service.py
```

### 4. Integration with Flask App

Update your `propply_app.py` to use the enhanced client:

```python
from philly_enhanced_data_client import PhillyEnhancedDataClient

# Initialize enhanced client
philly_enhanced_client = PhillyEnhancedDataClient()

@app.route('/api/philly/comprehensive-data', methods=['POST'])
def get_philly_comprehensive_data():
    data = request.get_json()
    address = data.get('address')
    
    if not address:
        return jsonify({'error': 'Address is required'}), 400
    
    try:
        # Get comprehensive data
        comprehensive_data = philly_enhanced_client.get_comprehensive_property_data(address)
        return jsonify(comprehensive_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

## 📈 Compliance Scoring

The system automatically calculates compliance scores based on:

- **Open Violations**: -10 points per open violation
- **Recent Permits**: +2 points per permit in the last year
- **Certification Status**: Points based on active/expired certifications
- **Investigation History**: Points based on recent investigation outcomes

### Compliance Score Calculation

```python
def calculate_compliance_score(violations, permits, certifications):
    score = 100
    
    # Deduct for open violations
    open_violations = [v for v in violations if v.get('status') == 'open']
    score -= len(open_violations) * 10
    
    # Add for recent permits
    recent_permits = [p for p in permits if is_recent(p.get('permit_issued_date'))]
    score += len(recent_permits) * 2
    
    # Add for active certifications
    active_certs = [c for c in certifications if c.get('inspection_result') == 'Certified']
    score += len(active_certs) * 5
    
    return max(0, min(100, score))
```

## 🔄 Automated Synchronization

### Scheduled Sync

```python
# Schedule regular sync every 24 hours
async def schedule_sync():
    sync_service = PhillyDataSyncService(supabase_url, supabase_key)
    await sync_service.schedule_regular_sync(interval_hours=24)

# Run scheduled sync
asyncio.run(schedule_sync())
```

### Manual Sync

```python
# Manual sync for all properties
async def manual_sync():
    sync_service = PhillyDataSyncService(supabase_url, supabase_key)
    results = await sync_service.sync_all_philadelphia_properties()
    return results
```

## 🛠️ API Endpoints

### Enhanced Philadelphia Endpoints

```bash
# Get comprehensive property data
POST /api/philly/comprehensive-data
{
    "address": "1234 Market St, Philadelphia, PA 19107"
}

# Get specific data types
GET /api/philly/permits?address=1234%20Market%20St
GET /api/philly/violations?address=1234%20Market%20St&status=open
GET /api/philly/certifications?address=1234%20Market%20St
GET /api/philly/investigations?address=1234%20Market%20St

# Sync data for a property
POST /api/philly/sync
{
    "property_id": "uuid",
    "address": "1234 Market St, Philadelphia, PA 19107"
}
```

## 📊 Data Quality & Performance

### Strengths
- **Comprehensive Coverage**: 6 major datasets covering all aspects of property compliance
- **Real-time Updates**: Daily updates for most datasets
- **Rich Metadata**: Detailed property characteristics and assessment data
- **Automated Sync**: Background synchronization with configurable intervals
- **Compliance Scoring**: Automated calculation of property compliance scores

### Performance Optimizations
- **Batch Processing**: Configurable batch sizes for database operations
- **Rate Limiting**: Built-in delays to respect API rate limits
- **Incremental Updates**: Only updates changed records
- **Indexing**: Comprehensive database indexes for fast queries
- **Caching**: Optional caching of frequently accessed data

### Limitations
- **API Rate Limits**: Standard rate limits apply (can be increased with app token)
- **Data Completeness**: Some historical data may be incomplete
- **Address Matching**: Requires exact address matching for best results
- **Dataset Availability**: Some datasets may have temporary outages

## 🔍 Troubleshooting

### Common Issues

1. **API Connection Errors**
   ```python
   # Test API connectivity
   client = PhillyEnhancedDataClient()
   connectivity_test = client.test_api_connectivity()
   print(f"Status: {connectivity_test['overall_status']}")
   ```

2. **No Data Found**
   - Verify address format: "1234 Market St, Philadelphia, PA 19107"
   - Check if property exists in Philadelphia databases
   - Try partial address matching

3. **Sync Errors**
   ```python
   # Check sync results
   results = await sync_service.sync_property_data(property_id, address)
   if not results['success']:
       print(f"Errors: {results['errors']}")
   ```

4. **Database Connection Issues**
   - Verify Supabase credentials
   - Check database migration status
   - Ensure RLS policies are properly configured

### Debug Mode

```python
import logging
logging.basicConfig(level=logging.DEBUG)

# This will show detailed API calls and responses
client = PhillyEnhancedDataClient()
```

## 📈 Analytics & Reporting

### Compliance Analytics

```python
# Get compliance summary for a property
comprehensive_data = client.get_comprehensive_property_data(address)
compliance = comprehensive_data['compliance_summary']

print(f"Compliance Score: {compliance['compliance_score']}")
print(f"Total Violations: {compliance['total_violations']}")
print(f"Open Violations: {compliance['open_violations']}")
print(f"Recent Permits: {compliance['recent_permits']}")
```

### Portfolio Analytics

```sql
-- Get compliance summary for all Philadelphia properties
SELECT 
    p.address,
    p.compliance_score,
    COUNT(v.id) as total_violations,
    COUNT(CASE WHEN v.status = 'open' THEN 1 END) as open_violations,
    COUNT(perm.id) as recent_permits
FROM properties p
LEFT JOIN philly_li_violations v ON p.id = v.property_id
LEFT JOIN philly_li_permits perm ON p.id = perm.property_id 
    AND perm.permit_issued_date >= CURRENT_DATE - INTERVAL '1 year'
WHERE p.city = 'Philadelphia'
GROUP BY p.id, p.address, p.compliance_score
ORDER BY p.compliance_score DESC;
```

## 🔮 Future Enhancements

### Planned Features
1. **Real-time Webhooks**: Subscribe to dataset updates
2. **Advanced Analytics**: Trend analysis and predictions
3. **Mobile Integration**: React Native support
4. **API Rate Optimization**: Intelligent caching and batching
5. **Additional Datasets**: Crime data, school districts, transit

### Integration Opportunities
1. **City APIs**: Direct integration with L&I systems
2. **Third-party Data**: Zillow, Redfin property data
3. **IoT Sensors**: Smart building compliance monitoring
4. **AI Predictions**: Machine learning for compliance risk

## 📞 Support

For technical support or questions about the enhanced Philadelphia integration:

1. **Documentation**: Check this file and inline code comments
2. **API Status**: Monitor Philadelphia Open Data status
3. **Community**: Philadelphia developer community forums
4. **Logs**: Check application logs for detailed error information

---

**Propply AI Enhanced Philadelphia Integration** - Comprehensive property compliance for the City of Brotherly Love 🏛️✨

## 📋 Quick Reference

### Key API Endpoints
- **Carto SQL API**: `https://phl.carto.com/api/v2/sql`
- **Building Certifications**: `https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/BUILDING_CERTS/FeatureServer/0/query`
- **Certification Summary**: `https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/BUILDING_CERTS_SUMMARY/FeatureServer/0/query`

### Key Database Tables
- `philly_li_permits` - Building and zoning permits
- `philly_li_violations` - Code violations
- `philly_building_certifications` - Building system certifications
- `philly_building_certification_summary` - Property-level compliance summary
- `philly_case_investigations` - Inspection history

### Key Configuration
- `PHILLY_APP_TOKEN` - Optional app token for higher rate limits
- `SyncConfig` - Configurable sync settings
- Rate limiting and batch processing for optimal performance

