# Mechanical Systems Data Access Guide

This document explains how to access elevator, boiler, and electrical inspection data for both NYC and Philadelphia properties using the new mechanical systems client.

## 🏗️ Overview

The `MechanicalSystemsClient` provides specialized access to mechanical systems data from both NYC and Philadelphia open data sources. This includes:

- **Elevator Data**: Permits, inspections, violations, and safety records
- **Boiler Data**: Mechanical permits, inspections, violations, and certifications
- **Electrical Data**: Electrical permits, inspections, violations, and compliance records

## 📊 Available Data Sources

### NYC Data Sources
- **DOB Building Permits** (`ipu4-2q9a`) - General building permits including mechanical work
- **DOB Electrical Permits** (`fxyw-8mw6`) - Electrical-specific permits and inspections
- **DOB Plumbing Permits** (`8h7b-9ny9`) - Plumbing and mechanical permits
- **DOB Mechanical Permits** (`b2iz-pps8`) - Mechanical system permits
- **DOB Violations** (`3h2n-5cm9`) - Building code violations
- **DOB Complaints** (`b2iz-pps8`) - Building complaints and inspections

### Philadelphia Data Sources
- **Building Permits** (`building-permits`) - L&I building permits including mechanical work
- **Electrical Permits** (`electrical-permits`) - Electrical-specific permits
- **Mechanical Permits** (`mechanical-permits`) - Mechanical system permits
- **Building Violations** (`building-violations`) - L&I violations
- **Fire Inspections** (`fire-inspections`) - Fire department inspections

## 🔧 Usage Examples

### 1. Basic Elevator Data Access

```python
from mechanical_systems_client import MechanicalSystemsClient

# NYC Elevator Data
nyc_client = MechanicalSystemsClient('NYC')
elevator_data = nyc_client.get_elevator_data("123 Broadway, New York, NY 10001")

print(f"Elevator Permits: {len(elevator_data.get('elevator_permits', []))}")
print(f"Elevator Violations: {len(elevator_data.get('elevator_violations', []))}")

# Philadelphia Elevator Data
philly_client = MechanicalSystemsClient('PHILADELPHIA')
elevator_data = philly_client.get_elevator_data("1234 Market St, Philadelphia, PA 19107")
```

### 2. Boiler System Data

```python
# Get boiler data for NYC property
boiler_data = nyc_client.get_boiler_data("123 Broadway, New York, NY 10001", bin_number="1234567")

# Get boiler data for Philadelphia property
boiler_data = philly_client.get_boiler_data("1234 Market St, Philadelphia, PA 19107")

# Analyze boiler permits
for permit in boiler_data.get('boiler_permits', []):
    print(f"Permit: {permit.get('permit_number')} - {permit.get('job_type')}")
    print(f"Issued: {permit.get('permit_issued_date')}")
    print(f"Status: {permit.get('job_status')}")
```

### 3. Electrical System Data

```python
# Get electrical data
electrical_data = nyc_client.get_electrical_data("123 Broadway, New York, NY 10001")

# Check for electrical violations
violations = electrical_data.get('electrical_violations', [])
for violation in violations:
    print(f"Violation: {violation.get('violation_type')}")
    print(f"Description: {violation.get('description')}")
    print(f"Status: {violation.get('status')}")
```

### 4. Comprehensive Mechanical Systems Report

```python
# Get all mechanical systems data at once
comprehensive_data = nyc_client.get_comprehensive_mechanical_data(
    "123 Broadway, New York, NY 10001", 
    bin_number="1234567"
)

print(f"Total Permits: {comprehensive_data['summary']['total_permits']}")
print(f"Total Violations: {comprehensive_data['summary']['total_violations']}")
print(f"Compliance Score: {comprehensive_data['summary']['compliance_score']}")

# Access specific system data
elevator_data = comprehensive_data['elevator_data']
boiler_data = comprehensive_data['boiler_data']
electrical_data = comprehensive_data['electrical_data']
```

## 🌐 API Endpoints

### Elevator Data
```bash
POST /api/mechanical/elevator
{
    "address": "123 Broadway, New York, NY 10001",
    "city": "NYC",
    "bin_number": "1234567"  # Optional for NYC
}
```

### Boiler Data
```bash
POST /api/mechanical/boiler
{
    "address": "1234 Market St, Philadelphia, PA 19107",
    "city": "PHILADELPHIA"
}
```

### Electrical Data
```bash
POST /api/mechanical/electrical
{
    "address": "123 Broadway, New York, NY 10001",
    "city": "NYC",
    "bin_number": "1234567"  # Optional for NYC
}
```

### Comprehensive Mechanical Systems Report
```bash
POST /api/mechanical/comprehensive
{
    "address": "123 Broadway, New York, NY 10001",
    "city": "NYC",
    "bin_number": "1234567"  # Optional for NYC
}
```

## 📋 Data Structure

### Elevator Data Response
```json
{
    "address": "123 Broadway, New York, NY 10001",
    "city": "NYC",
    "elevator_permits": [
        {
            "permit_number": "123456789",
            "job_type": "Elevator Installation",
            "permit_issued_date": "2023-01-15",
            "job_status": "Completed",
            "contractor": "ABC Elevator Co",
            "description": "Install new passenger elevator"
        }
    ],
    "elevator_violations": [
        {
            "violation_number": "V123456",
            "violation_type": "Elevator Safety",
            "violation_date": "2023-06-01",
            "status": "Open",
            "description": "Elevator safety inspection overdue"
        }
    ],
    "data_source": "NYC DOB"
}
```

### Boiler Data Response
```json
{
    "address": "123 Broadway, New York, NY 10001",
    "city": "NYC",
    "boiler_permits": [
        {
            "permit_number": "987654321",
            "job_type": "Boiler Installation",
            "permit_issued_date": "2023-03-20",
            "job_status": "In Progress",
            "contractor": "XYZ Boiler Services",
            "description": "Replace existing boiler system"
        }
    ],
    "boiler_violations": [
        {
            "violation_number": "V987654",
            "violation_type": "Boiler Safety",
            "violation_date": "2023-05-15",
            "status": "Resolved",
            "description": "Boiler inspection certificate expired"
        }
    ],
    "data_source": "NYC DOB"
}
```

### Electrical Data Response
```json
{
    "address": "123 Broadway, New York, NY 10001",
    "city": "NYC",
    "electrical_permits": [
        {
            "permit_number": "456789123",
            "job_type": "Electrical Work",
            "permit_issued_date": "2023-02-10",
            "job_status": "Completed",
            "contractor": "DEF Electrical Co",
            "description": "Upgrade electrical panel"
        }
    ],
    "electrical_violations": [
        {
            "violation_number": "V456789",
            "violation_type": "Electrical Safety",
            "violation_date": "2023-04-01",
            "status": "Open",
            "description": "Electrical work without permit"
        }
    ],
    "data_source": "NYC DOB"
}
```

### Comprehensive Report Response
```json
{
    "address": "123 Broadway, New York, NY 10001",
    "city": "NYC",
    "generated_at": "2024-01-15T10:30:00Z",
    "elevator_data": { /* elevator data structure */ },
    "boiler_data": { /* boiler data structure */ },
    "electrical_data": { /* electrical data structure */ },
    "summary": {
        "total_permits": 15,
        "total_violations": 3,
        "compliance_score": 85
    }
}
```

## 🔍 Search Parameters

### NYC Search Parameters
- **address**: Property address (required)
- **bin_number**: NYC Building Identification Number (optional, improves accuracy)
- **job_type**: Filter by specific job types (elevator, boiler, electrical)
- **date_range**: Filter by permit/violation date ranges

### Philadelphia Search Parameters
- **address**: Property address (required)
- **work_type**: Filter by work types (elevator, boiler, electrical)
- **permit_type**: Filter by permit types
- **status**: Filter by permit/violation status

## 📊 Compliance Scoring

The system calculates a compliance score based on:

- **Base Score**: 100 points
- **Violation Deduction**: -5 points per violation
- **Open Violations**: Additional -2 points for open violations
- **Recent Permits**: +1 point for permits issued in last 2 years
- **Minimum Score**: 0 (cannot go below)

### Example Calculation
```
Base Score: 100
- 3 violations × 5 points = -15
- 1 open violation × 2 points = -2
+ 2 recent permits × 1 point = +2
Final Score: 85
```

## 🛠️ Error Handling

### Common Error Scenarios
1. **Invalid Address**: Address not found in city databases
2. **API Rate Limits**: Exceeded API request limits
3. **Network Issues**: Connection problems with data sources
4. **Data Unavailable**: Specific mechanical systems data not available

### Error Response Format
```json
{
    "error": "Error description",
    "address": "123 Broadway, New York, NY 10001",
    "city": "NYC",
    "error_type": "validation_error|api_error|network_error"
}
```

## 🚀 Performance Optimization

### Best Practices
1. **Use BIN Numbers**: For NYC properties, always provide BIN numbers when available
2. **Batch Requests**: Group multiple property lookups
3. **Cache Results**: Store frequently accessed data
4. **Filter by Date**: Use date ranges to limit data volume
5. **Rate Limiting**: Implement proper rate limiting for production

### Example Optimized Query
```python
# Get recent elevator data only
from datetime import datetime, timedelta

one_year_ago = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d')

# This would be implemented in the client with date filtering
elevator_data = client.get_elevator_data(
    address="123 Broadway, New York, NY 10001",
    start_date=one_year_ago
)
```

## 🔮 Future Enhancements

### Planned Features
1. **Real-time Monitoring**: WebSocket connections for live updates
2. **Predictive Analytics**: ML models for compliance risk prediction
3. **Integration APIs**: Direct connections to city inspection systems
4. **Mobile Alerts**: Push notifications for critical violations
5. **Historical Trends**: Long-term compliance trend analysis

### Additional Data Sources
1. **Third-party Inspectors**: Licensed inspection company data
2. **Insurance Records**: Property insurance inspection data
3. **Maintenance Logs**: Building maintenance and repair records
4. **Energy Efficiency**: Energy audit and efficiency data

## 📞 Support and Troubleshooting

### Common Issues

1. **No Data Found**
   - Verify address format and spelling
   - Check if property exists in city databases
   - Try alternative address formats

2. **API Errors**
   - Check internet connection
   - Verify API tokens are valid
   - Monitor rate limit usage

3. **Incomplete Data**
   - Some properties may have limited mechanical systems
   - Historical data may be incomplete
   - Check dataset update frequencies

### Debug Mode
```python
import logging
logging.basicConfig(level=logging.DEBUG)

# This will show detailed API calls and responses
client = MechanicalSystemsClient('NYC')
```

### Getting Help
1. **Documentation**: Check this guide and inline code comments
2. **API Status**: Monitor NYC Open Data and OpenDataPhilly status pages
3. **Community**: City developer community forums
4. **Support**: Contact Propply AI support team

---

## 🎯 Quick Start Checklist

- [ ] Install required dependencies
- [ ] Set up API tokens (optional but recommended)
- [ ] Test basic property search
- [ ] Verify elevator data access
- [ ] Check boiler data retrieval
- [ ] Test electrical data queries
- [ ] Run comprehensive mechanical systems report
- [ ] Implement error handling
- [ ] Set up monitoring and logging

**Propply AI Mechanical Systems Integration** - Comprehensive mechanical systems compliance for NYC and Philadelphia 🏗️⚡

