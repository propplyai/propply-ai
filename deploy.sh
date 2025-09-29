#!/bin/bash

# Propply AI Deployment Script
echo "🚀 Propply AI Deployment Script"
echo "================================"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit: Propply AI MVP with authentication"
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Committing changes..."
    git add .
    git commit -m "Update: Fix ESLint warnings and prepare for deployment"
    echo "✅ Changes committed"
else
    echo "✅ No uncommitted changes"
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Are you in the right directory?"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Run build to check for errors
echo "🔨 Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🎯 Next Steps:"
    echo "1. Push to GitHub: git push origin main"
    echo "2. Deploy to Vercel: https://vercel.com"
    echo "3. Set up Supabase: https://supabase.com"
    echo "4. Configure environment variables"
    echo "5. Test authentication"
    echo ""
    echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions"
else
    echo "❌ Build failed. Please fix errors before deploying."
    exit 1
fi
