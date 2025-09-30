#!/bin/bash

# Propply AI - Render Deployment Script
# This script pushes changes to GitHub which triggers Render auto-deploy

echo "🚀 Deploying Propply AI to Render..."
echo ""

# Check if we have uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo "⚠️  You have uncommitted changes. Please commit them first."
    git status -s
    exit 1
fi

# Get current branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "📦 Current branch: $BRANCH"

# Push to origin
echo "📤 Pushing to GitHub..."
git push origin $BRANCH

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "🔄 Render should automatically start deploying..."
    echo ""
    echo "📊 Check deployment status:"
    echo "   https://dashboard.render.com"
    echo ""
    echo "🌐 Your app will be live at:"
    echo "   https://agent4nyc.onrender.com"
    echo ""
    echo "⏱️  Deployment usually takes 2-5 minutes"
else
    echo ""
    echo "❌ Failed to push to GitHub"
    exit 1
fi
