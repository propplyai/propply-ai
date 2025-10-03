# NYC Implementation - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Test the Implementation
```bash
cd /Users/art3a/dev/Propply_MVP
python test_nyc_implementation.py
```

Expected output: All tests passing ✅

### 2. Basic Usage Examples

#### Get Recent Violations
```python
from nyc_opendata_client import NYCOpenDataClient

client = NYCOpenDataClient()
violations = client.get_recent_data('dob_violations', days_back=30, limit=50)
print(f"Found {len(violations)} violations")
```

#### Analyze a Property
```python
from nyc_property_finder_enhanced import NYCPropertyFinder

finder = NYCPropertyFinder()
compliance = finder.get_property_compliance(
    address="350 5th Ave, New York, NY",
    bin_number="1001234"  # Optional but helpful
)

print(f"Compliance Score: {compliance['compliance_summary']['compliance_score']}/100")
print(f"Risk Level: {compliance['compliance_summary']['risk_level']}")
```

#### Generate Action Plan
```python
actions = finder.generate_action_plan(compliance)
for action in actions[:5]:
    print(f"[{action['priority']}] {action['title']} - ${action['estimated_cost_max']:,}")
```

---

## 📊 Available Datasets

```python
# List all available datasets
client = NYCOpenDataClient()
for dataset in client.list_datasets():
    print(f"{dataset['key']}: {dataset['name']}")
```

**11 Datasets Available:**
1. `dob_violations` - DOB Violations
2. `hpd_violations` - HPD Violations
3. `elevator_inspections` - Elevator Status
4. `boiler_inspections` - Boiler Status
5. `complaints_311` - 311 Complaints
6. `building_complaints` - Building Complaints
7. `fire_safety_inspections` - Fire Safety
8. `cooling_tower_registrations` - Cooling Towers
9. `cooling_tower_inspections` - Tower Inspections
10. `electrical_permits` - Electrical Permits
11. `hpd_registrations` - Property Registrations

---

## 🔍 Search Methods

### By Address
```python
violations = client.search_by_address('dob_violations', "123 Main St")
```

### By BIN (Building ID)
```python
violations = client.search_by_bin('dob_violations', "1234567")
```

### By BBL (Borough-Block-Lot)
```python
violations = client.search_by_bbl('hpd_violations', "1001230001")
```

### Recent Data
```python
recent = client.get_recent_data('complaints_311', days_back=7)
```

---

## 🗄️ Database Setup

### Run Schema Migration
```bash
# Using Supabase CLI
supabase db push

# Or apply manually in Supabase dashboard:
# Copy contents of database/nyc_schema.sql
# Paste in SQL Editor
```

### Tables Created
- `nyc_properties` - Master property table
- `nyc_dob_violations` - DOB violations
- `nyc_hpd_violations` - HPD violations
- `nyc_elevator_inspections` - Elevator data
- `nyc_boiler_inspections` - Boiler data
- `nyc_311_complaints` - 311 complaints
- `nyc_compliance_summary` - Compliance scores
- ...and 6 more tables

---

## ⚙️ Configuration (Optional)

### Get Better API Performance
```bash
# Get free API token from NYC Open Data
# Visit: https://data.cityofnewyork.us/profile/app_tokens

# Add to your environment
export NYC_APP_TOKEN="your_token_here"
```

**Benefits:**
- 10 requests/sec (vs 2 req/sec)
- Higher daily limits
- Priority queue access

---

## 🎯 Risk Categories

| Risk Level | Examples | Est. Cost | Priority |
|------------|----------|-----------|----------|
| **FIRE** | Fire alarms, sprinklers | $2K-$8K | CRITICAL |
| **STRUCTURAL** | Foundation, walls | $5K-$30K | HIGH |
| **ELECTRICAL** | Wiring, power | $800-$4K | HIGH |
| **MECHANICAL** | HVAC, heating | $1.5K-$10K | MEDIUM |
| **PLUMBING** | Water, drains | $500-$3K | MEDIUM |
| **HOUSING** | Habitability | $300-$2K | LOW |
| **ZONING** | Use violations | $200-$1.5K | LOW |

---

## 🔗 Integration with Your App

### In Flask Backend (propply_app.py)
```python
from nyc_property_finder_enhanced import NYCPropertyFinder

@app.route('/api/nyc-compliance', methods=['POST'])
def get_nyc_compliance():
    data = request.get_json()
    address = data.get('address')
    
    finder = NYCPropertyFinder()
    compliance = finder.get_property_compliance(address)
    
    return jsonify(compliance)
```

### In React Frontend
```javascript
// Fetch NYC compliance data
const response = await fetch('/api/nyc-compliance', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({address: '123 Main St, NYC'})
});

const compliance = await response.json();
console.log('Compliance Score:', compliance.compliance_summary.compliance_score);
```

---

## 📝 Common Queries

### Get All Violations for a Property
```python
violations = client.get_property_violations(
    address="123 Main St",
    bin_number="1234567"
)

# Returns dict with:
# violations['dob'] - DOB violations DataFrame
# violations['hpd'] - HPD violations DataFrame
```

### Get Equipment Status
```python
elevators = client.get_elevator_status("1234567")
boilers = client.get_boiler_status("1234567")
```

### Get 311 Complaints
```python
complaints = client.get_311_complaints("123 Main St", days_back=365)
```

### Comprehensive Property Data
```python
all_data = client.get_comprehensive_property_data(
    address="123 Main St",
    bin_number="1234567",
    bbl="1001230001"
)

# Returns dict with:
# - violations
# - complaints_311
# - elevator_inspections
# - boiler_inspections
# - building_complaints
```

---

## 🐛 Troubleshooting

### No Data Returned
**Issue:** Empty DataFrame  
**Solution:** Property may not have violations (this is normal). Try a known address with violations.

### Rate Limiting
**Issue:** 429 Too Many Requests  
**Solution:** Add `NYC_APP_TOKEN` environment variable or reduce request frequency.

### Timeout Errors
**Issue:** Request takes too long  
**Solution:** Reduce `limit` parameter in queries.

### Invalid BIN/BBL
**Issue:** No results found  
**Solution:** Verify format:
- BIN: 7 digits (e.g., "1234567")
- BBL: 10 digits (1-borough, 5-block, 4-lot, e.g., "1001230001")

---

## 📚 Key Files

| File | Purpose |
|------|---------|
| `nyc_opendata_client.py` | API client |
| `nyc_property_finder_enhanced.py` | Property analysis |
| `database/nyc_schema.sql` | Database tables |
| `test_nyc_implementation.py` | Test suite |
| `NYC_IMPLEMENTATION_COMPLETE.md` | Full documentation |
| `PROPPLY_AI_INTEGRATION_STRATEGY.md` | Strategy document |

---

## ✅ What's Working

- ✅ 11 datasets accessible
- ✅ Property search by address/BIN/BBL
- ✅ Compliance scoring (0-100)
- ✅ Risk categorization
- ✅ Cost estimation
- ✅ Action plan generation
- ✅ Equipment monitoring
- ✅ 311 complaint tracking
- ✅ Database schema ready
- ✅ All tests passing

---

## 🔜 Next Steps

1. **Deploy Database Schema** to Supabase
2. **Add API Routes** to propply_app.py
3. **Update Frontend** components to display NYC data
4. **Build Data Sync** service for automatic updates
5. **Add AI Chatbot** for compliance Q&A

---

## 💡 Tips

1. **Start with test data:** Use the test script to verify everything works
2. **Get API token:** Significantly improves performance
3. **Cache in database:** Avoid repeated API calls
4. **Batch operations:** Process multiple properties at once
5. **Monitor rate limits:** Track API usage to avoid throttling

---

## 🆘 Need Help?

1. Run test suite: `python test_nyc_implementation.py`
2. Check logs: Look for error messages in console
3. Verify environment: Ensure Python packages installed
4. Review docs: See `NYC_IMPLEMENTATION_COMPLETE.md`

---

## 🎉 You're Ready!

Your NYC implementation is production-ready and matches the quality of your Philadelphia system. Start using it in your application today!

**Quick Test:**
```bash
python test_nyc_implementation.py
```

**Expected:** All tests passing ✅

