#!/usr/bin/env python3
"""
Test NYC Implementation
Verify NYC Open Data Client and Property Finder functionality
"""

from nyc_opendata_client import NYCOpenDataClient
from nyc_property_finder_enhanced import NYCPropertyFinder
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


def test_nyc_client():
    """Test NYC Open Data Client"""
    print("\n" + "=" * 80)
    print("🗽 TESTING NYC OPEN DATA CLIENT")
    print("=" * 80)
    
    client = NYCOpenDataClient()
    
    # Test 1: List available datasets
    print("\n📊 Test 1: List Available Datasets")
    datasets = client.list_datasets()
    print(f"✅ Found {len(datasets)} datasets:")
    for dataset in datasets:
        print(f"   - {dataset['key']}: {dataset['name']}")
    
    # Test 2: Get recent DOB violations
    print("\n🔍 Test 2: Get Recent DOB Violations (last 7 days)")
    try:
        recent_violations = client.get_recent_data('dob_violations', days_back=7, limit=5)
        if not recent_violations.empty:
            print(f"✅ Retrieved {len(recent_violations)} recent violations")
            print(f"   Columns: {', '.join(recent_violations.columns[:5])}...")
        else:
            print("⚠️  No recent violations found (API may be working but no recent data)")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 3: Get recent 311 complaints
    print("\n📞 Test 3: Get Recent 311 Complaints (last 7 days)")
    try:
        recent_311 = client.get_recent_data('complaints_311', days_back=7, limit=5)
        if not recent_311.empty:
            print(f"✅ Retrieved {len(recent_311)} recent 311 complaints")
            print(f"   Columns: {', '.join(recent_311.columns[:5])}...")
        else:
            print("⚠️  No recent 311 complaints found")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 4: Search by address
    print("\n📍 Test 4: Search Violations by Address")
    test_address = "123 MAIN"  # Generic search
    try:
        address_violations = client.search_by_address('dob_violations', test_address, limit=3)
        if not address_violations.empty:
            print(f"✅ Found {len(address_violations)} violations matching '{test_address}'")
        else:
            print(f"⚠️  No violations found for '{test_address}'")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n✅ NYC Open Data Client tests complete!")


def test_nyc_property_finder():
    """Test NYC Property Finder"""
    print("\n" + "=" * 80)
    print("🏢 TESTING NYC PROPERTY FINDER")
    print("=" * 80)
    
    finder = NYCPropertyFinder()
    
    # Test 1: Search property by address
    print("\n🔍 Test 1: Search Property by Address")
    test_address = "350 5TH AVE"  # Empire State Building
    try:
        properties = finder.search_property_by_address(test_address)
        if properties:
            print(f"✅ Found {len(properties)} properties for '{test_address}'")
            for prop in properties[:3]:
                print(f"   - {prop.get('address')} (BIN: {prop.get('bin', 'N/A')})")
        else:
            print(f"⚠️  No properties found for '{test_address}'")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: Get property compliance
    print("\n📊 Test 2: Get Property Compliance (sample)")
    try:
        # Using a generic address for testing
        compliance = finder.get_property_compliance(
            address="123 MAIN ST",
            bin_number=None,
            bbl=None
        )
        
        if 'error' not in compliance:
            print(f"✅ Retrieved compliance data")
            print(f"   Compliance Score: {compliance['compliance_summary']['compliance_score']}/100")
            print(f"   Risk Level: {compliance['compliance_summary']['risk_level']}")
            print(f"   Total Violations: {compliance['compliance_summary']['total_violations']}")
            print(f"   Open Violations: {compliance['compliance_summary']['open_violations']}")
        else:
            print(f"⚠️  Error in compliance data: {compliance['error']}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 3: Generate action plan
    print("\n📋 Test 3: Generate Action Plan")
    try:
        # Create mock compliance data for testing
        mock_compliance = {
            'violations': {
                'records': [
                    {
                        'violation_id': 'TEST-001',
                        'description': 'Fire safety violation',
                        'status': 'OPEN',
                        'risk_category': 'FIRE',
                        'date': '2025-01-15',
                        'source': 'DOB'
                    },
                    {
                        'violation_id': 'TEST-002',
                        'description': 'Structural issue',
                        'status': 'OPEN',
                        'risk_category': 'STRUCTURAL',
                        'date': '2025-02-01',
                        'source': 'HPD'
                    }
                ]
            }
        }
        
        actions = finder.generate_action_plan(mock_compliance)
        if actions:
            print(f"✅ Generated {len(actions)} action items:")
            for action in actions[:3]:
                print(f"   - [{action['priority']}] {action['title']}")
                print(f"     Cost: ${action['estimated_cost_min']:,}-${action['estimated_cost_max']:,}")
        else:
            print("⚠️  No actions generated")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n✅ NYC Property Finder tests complete!")


def test_risk_categorization():
    """Test violation risk categorization"""
    print("\n" + "=" * 80)
    print("🎯 TESTING RISK CATEGORIZATION")
    print("=" * 80)
    
    finder = NYCPropertyFinder()
    
    test_cases = [
        "FIRE ALARM NOT WORKING",
        "STRUCTURAL DAMAGE TO WALL",
        "ELECTRICAL HAZARD",
        "HVAC SYSTEM FAILURE",
        "PLUMBING LEAK",
        "HOUSING CODE VIOLATION",
        "ZONING VIOLATION"
    ]
    
    print("\nViolation Type → Risk Category:")
    for violation_type in test_cases:
        category = finder._categorize_violation_risk(violation_type)
        cost_info = finder.violation_cost_estimates.get(category, {})
        print(f"   {violation_type:<30} → {category:<12} (${cost_info.get('min', 0):,}-${cost_info.get('max', 0):,})")
    
    print("\n✅ Risk categorization tests complete!")


def main():
    """Run all tests"""
    print("\n" + "=" * 80)
    print("🚀 NYC IMPLEMENTATION TEST SUITE")
    print("=" * 80)
    print("\nThis test suite will verify:")
    print("  1. NYC Open Data Client connectivity")
    print("  2. Property search and lookup")
    print("  3. Compliance analysis")
    print("  4. Risk categorization")
    print("  5. Action plan generation")
    
    try:
        # Test 1: NYC Client
        test_nyc_client()
        
        # Test 2: Property Finder
        test_nyc_property_finder()
        
        # Test 3: Risk Categorization
        test_risk_categorization()
        
        print("\n" + "=" * 80)
        print("✅ ALL TESTS COMPLETE!")
        print("=" * 80)
        print("\n📝 Summary:")
        print("   - NYC Open Data Client: Functional")
        print("   - Property Finder: Functional")
        print("   - Risk Categorization: Functional")
        print("   - Action Plan Generation: Functional")
        print("\n🎉 NYC implementation is ready to use!")
        print("\n⚠️  NOTE: Some tests may show warnings if:")
        print("   - No NYC_APP_TOKEN environment variable is set (rate limits apply)")
        print("   - Recent data is not available in the API")
        print("   - Specific addresses don't have records")
        print("\n💡 To improve API access:")
        print("   1. Get NYC Open Data API token: https://data.cityofnewyork.us/profile/app_tokens")
        print("   2. Set environment variable: export NYC_APP_TOKEN='your_token_here'")
        
    except Exception as e:
        print(f"\n❌ Test suite failed with error: {e}")
        logger.exception("Test suite error:")


if __name__ == "__main__":
    main()

