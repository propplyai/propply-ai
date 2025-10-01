#!/bin/bash
# Build script for React frontend

echo "Installing Node.js dependencies..."
npm ci --legacy-peer-deps

echo "Building React app..."
npm run build

echo "Frontend build complete!"
