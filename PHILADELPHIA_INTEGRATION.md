# Philadelphia Backend Services Integration

This document explains how to use the Philadelphia backend services that have been created to mirror your NYC implementation.

## 🏗️ Architecture Overview

The Philadelphia integration follows the same pattern as your NYC services:

```
philly_opendata_client.py     → PhillyOpenDataClient (similar to NYCOpenDataClient)
philly_property_finder.py     → Property search and compliance functions
PhillyInspectionAutomationService.js → Automated data sync and compliance tracking
propply_app.py               → Updated Flask app with dual city support
```

## 📊 Available Philadelphia Datasets

### Core Datasets via OpenDataPhilly

1. **Building Permits** (`building-permits`)
   - L&I building permits and inspections
   - Work types, contractors, permit dates
   - Daily updates

2. **Building Violations** (`building-violations`)
   - L&I building code violations
   - Violation types, status, descriptions
   - Daily updates

3. **Property Assessments** (`property-assessments`)
   - Property tax assessments and valuations
   - Market value, assessed value, property characteristics
   - Annual updates

4. **Fire Inspections** (`fire-inspections`)
   - Fire department safety inspections
   - Inspection results, inspector information
   - Weekly updates

5. **Housing Violations** (`housing-violations`)
   - Housing code violations and enforcement
   - Violation types, status, descriptions
   - Daily updates

6. **Zoning Information** (`zoning`)
   - Property zoning classifications
   - Zoning regulations and requirements
   - Monthly updates

## 🔧 Usage Examples

### 1. Basic Property Search

```python
from philly_opendata_client import PhillyOpenDataClient
from philly_property_finder import search_property_by_address

# Initialize client
client = PhillyOpenDataClient()

# Search for a property
address = "1234 Market St, Philadelphia, PA 19107"
matches = search_property_by_address(client, address)

for match in matches:
    print(f"Address: {match['address']}")
    print(f"OPA Account: {match.get('opa_account')}")
    print(f"Market Value: ${match.get('market_value', 'N/A')}")
    print(f"Zoning: {match.get('zoning', 'N/A')}")
```

### 2. Comprehensive Compliance Check

```python
from philly_property_finder import get_property_compliance

# Get full compliance report
compliance = get_property_compliance(client, address)

print(f"Compliance Score: {compliance['compliance_summary']['compliance_score']}")
print(f"Total Violations: {compliance['compliance_summary']['total_violations']}")
print(f"Open Violations: {compliance['compliance_summary']['open_violations']}")
print(f"Recent Permits: {compliance['compliance_summary']['recent_permits']}")
```

### 3. Direct Dataset Queries

```python
# Get building permits for an address
permits = client.get_building_permits("1234 Market St")

# Get building violations
violations = client.get_building_violations("1234 Market St", status="open")

# Get property assessments
assessments = client.get_property_assessments("1234 Market St")

# Get fire inspections
inspections = client.get_fire_inspections("1234 Market St")
```

## 🌐 API Endpoints

Your Flask app now supports both NYC and Philadelphia:

### Property Search
```bash
POST /api/search
{
    "address": "1234 Market St, Philadelphia, PA 19107",
    "city": "Philadelphia"  # Optional - auto-detected from address
}
```

### Compliance Report Generation
```bash
POST /api/compliance
{
    "address": "1234 Market St, Philadelphia, PA 19107",
    "city": "Philadelphia"
}
```

### Property Addition with Auto-Discovery
```bash
POST /add_property
{
    "address": "1234 Market St, Philadelphia, PA 19107",
    "property_type": "residential",
    "units": 10,
    "city": "Philadelphia"  # Optional
}
```

## 🗄️ Database Schema

### New Philadelphia Tables

1. **philly_permits** - Building permits data
2. **philly_violations** - Building violations data  
3. **philly_inspections** - Fire and other inspections
4. **philly_housing_violations** - Housing code violations

### Enhanced Properties Table

Added Philadelphia-specific fields:
- `opa_account` - Office of Property Assessment account
- `market_value` - Property market value
- `assessed_value` - Tax assessed value
- `land_area` - Land area in square feet
- `building_area` - Building area in square feet
- `year_built` - Year property was built
- `zoning` - Zoning classification
- `use_code` - Property use code

## 🔄 Automation Service

The `PhillyInspectionAutomationService.js` provides:

### Automated Tasks
- **Deadline Tracking**: Monitors compliance deadlines
- **Data Synchronization**: Syncs with Philadelphia Open Data
- **Notification Generation**: Creates alerts for violations and permits
- **Compliance Scoring**: Calculates property compliance scores

### Usage
```javascript
import PhillyInspectionAutomationService from './services/PhillyInspectionAutomationService.js';

const phillyService = new PhillyInspectionAutomationService(supabase);

// Run all automated tasks
await phillyService.runAutomatedTasks();

// Or run specific tasks
await phillyService.syncPhillyData();
await phillyService.checkUpcomingDeadlines();
await phillyService.updateComplianceScores();
```

## 📋 Philadelphia Compliance Systems

The system includes 20+ Philadelphia-specific compliance requirements:

### Key Categories
- **L&I Registration & Permits** - Business licenses, building permits
- **Fire Safety** - Fire department inspections
- **Housing Code** - Housing compliance inspections
- **Environmental** - Lead paint, asbestos, radon testing
- **Accessibility** - ADA compliance
- **Energy Efficiency** - Green building standards
- **Historic Preservation** - Historic district compliance

### Sample Compliance Systems
- `philly_li_registration` - Annual L&I business license ($100-250)
- `philly_fire_inspection` - Fire safety inspection ($200-400)
- `philly_lead_paint` - Lead paint compliance ($400-800)
- `philly_historic_preservation` - Historic preservation ($400-800)

## 🏢 Philadelphia Vendors

8 certified Philadelphia vendors have been added:

1. **Philadelphia Building Solutions** - Full-service compliance
2. **Liberty Fire Safety** - Fire safety specialists
3. **Philly Elevator Services** - Elevator inspection & maintenance
4. **Philadelphia Environmental Solutions** - Environmental compliance
5. **Historic Philadelphia Preservation** - Historic preservation
6. **Philadelphia Energy Solutions** - Energy efficiency
7. **Philly Water & Sewer** - Water/sewer compliance
8. **Philadelphia Accessibility Solutions** - ADA compliance

## 🚀 Getting Started

### 1. Environment Setup
```bash
# Add to your .env.local
PHILLY_APP_TOKEN=your_philly_app_token_here  # Optional for higher rate limits
```

### 2. Database Migration
```bash
# Apply the Philadelphia migration
psql -h your-supabase-host -U postgres -d postgres -f supabase/migrations/002_philadelphia_support.sql
```

### 3. Test the Integration
```python
# Test basic functionality
python philly_opendata_client.py
python philly_property_finder.py
```

### 4. Run the Updated Flask App
```bash
python propply_app.py
```

## 🔍 Data Quality & Limitations

### Strengths
- **Comprehensive Coverage**: 6 major datasets covering all aspects of property compliance
- **Real-time Updates**: Daily/weekly updates for most datasets
- **Rich Metadata**: Detailed property characteristics and assessment data
- **Violation Tracking**: Complete violation history and status tracking

### Limitations
- **API Rate Limits**: Standard Socrata rate limits apply
- **Data Completeness**: Some historical data may be incomplete
- **Address Matching**: Requires exact address matching for best results
- **Dataset Availability**: Some datasets may have temporary outages

## 🛠️ Troubleshooting

### Common Issues

1. **No Property Matches**
   - Verify address format: "1234 Market St, Philadelphia, PA 19107"
   - Try partial address matching
   - Check if property exists in assessment records

2. **API Connection Errors**
   - Verify internet connection
   - Check if OpenDataPhilly is accessible
   - Consider adding app token for higher rate limits

3. **Missing Data**
   - Some properties may not have complete assessment data
   - Newer properties may have limited violation history
   - Check dataset update frequencies

### Debug Mode
```python
import logging
logging.basicConfig(level=logging.DEBUG)

# This will show detailed API calls and responses
client = PhillyOpenDataClient()
```

## 📈 Performance Optimization

### Best Practices
1. **Batch Requests**: Group multiple property lookups
2. **Cache Results**: Store frequently accessed data
3. **Use Filters**: Apply date and status filters to reduce data
4. **Rate Limiting**: Implement proper rate limiting for production

### Example Optimized Query
```python
# Get recent violations only
recent_violations = client.get_building_violations(
    address="1234 Market St",
    status="open"
)

# Get permits from last year
from datetime import datetime, timedelta
one_year_ago = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d')
recent_permits = client.get_building_permits(
    address="1234 Market St",
    start_date=one_year_ago
)
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

---

## 📞 Support

For technical support or questions about the Philadelphia integration:

1. **Documentation**: Check this file and inline code comments
2. **OpenDataPhilly**: https://opendataphilly.org for dataset documentation
3. **API Status**: Monitor OpenDataPhilly status page
4. **Community**: Philadelphia developer community forums

**Propply AI Philadelphia Integration** - Comprehensive property compliance for the City of Brotherly Love 🏛️✨

