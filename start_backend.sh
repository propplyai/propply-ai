#!/bin/bash

# Start the Propply AI Backend Server
echo "🚀 Starting Propply AI Backend Server..."

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed or not in PATH"
    exit 1
fi

# Check if required Python packages are installed
echo "📦 Checking Python dependencies..."
python3 -c "import flask, pandas, requests" 2>/dev/null || {
    echo "❌ Missing required Python packages. Please install:"
    echo "   pip install flask pandas requests"
    exit 1
}

# Set environment variables
export FLASK_APP=propply_app.py
export FLASK_ENV=development
export FLASK_DEBUG=1

# Start the Flask server
echo "🌐 Starting Flask server on http://localhost:5000"
echo "📡 API endpoint: http://localhost:5000/api/property/search"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python3 propply_app.py
