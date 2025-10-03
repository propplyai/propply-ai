#!/bin/bash

# Quick test script for Philadelphia webhook integration using curl
# Make sure your Flask server is running: python propply_app.py

echo "🧪 Testing Philadelphia Webhook Integration with curl"
echo "=================================================="

# Configuration
FLASK_URL="http://localhost:5002"
TEST_ADDRESS="1234 Market St, Philadelphia, PA 19107"
PROPERTY_ID="test_prop_$(date +%s)"

echo "📍 Test Address: $TEST_ADDRESS"
echo "🆔 Property ID: $PROPERTY_ID"
echo ""

# Test 1: Health check
echo "1️⃣ Testing Flask server health..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "$FLASK_URL/api/health"
echo ""

# Test 2: AI Analysis endpoint
echo "2️⃣ Testing AI Analysis endpoint..."
echo "Sending request to: $FLASK_URL/api/ai-optimized-analysis"
echo ""

curl -X POST "$FLASK_URL/api/ai-optimized-analysis" \
  -H "Content-Type: application/json" \
  -d "{
    \"address\": \"$TEST_ADDRESS\",
    \"city\": \"Philadelphia\",
    \"property_id\": \"$PROPERTY_ID\"
  }" \
  -w "\n\nResponse Time: %{time_total}s\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || echo "Response received (jq not available for formatting)"

echo ""
echo "3️⃣ Testing webhook callback simulation..."
echo "Sending callback to: $FLASK_URL/api/ai-callback"
echo ""

# Test 3: Simulate webhook callback
curl -X POST "$FLASK_URL/api/ai-callback" \
  -H "Content-Type: application/json" \
  -d "{
    \"request_id\": \"req_$(date +%s)\",
    \"property_id\": \"$PROPERTY_ID\",
    \"analysis_type\": \"compliance_analysis\",
    \"compliance_score\": 85,
    \"risk_level\": \"Medium\",
    \"findings\": [
      \"3 open violations require attention\",
      \"Recent permits show active maintenance\",
      \"Building certifications are current\"
    ],
    \"recommendations\": [
      {
        \"priority\": \"High\",
        \"action\": \"Address open violations\",
        \"estimated_cost\": 5000,
        \"timeline\": \"30 days\"
      }
    ],
    \"cost_estimates\": {
      \"total_estimated_cost\": 6500,
      \"high_priority_cost\": 5000
    },
    \"confidence_score\": 0.87,
    \"analysis_date\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"ai_model\": \"external_ai_v1\",
    \"processing_time_seconds\": 12.5
  }" \
  -w "\n\nResponse Time: %{time_total}s\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || echo "Response received (jq not available for formatting)"

echo ""
echo "✅ Test completed!"
echo ""
echo "💡 Tips:"
echo "   - Make sure Flask server is running: python propply_app.py"
echo "   - Check logs for detailed information"
echo "   - Install jq for better JSON formatting: brew install jq"

