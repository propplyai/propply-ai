#!/bin/bash
# Build frontend and prepare for deployment

echo "🔨 Building React frontend..."
npm ci --legacy-peer-deps
npm run build

echo "✅ Frontend build complete!"
echo "📁 Build directory contents:"
ls -la build/

echo "🚀 Ready for deployment!"
echo "The build/ directory contains the compiled React app."
echo "Your render.yaml is configured to use these pre-built assets."
