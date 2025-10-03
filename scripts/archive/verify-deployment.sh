#!/bin/bash

# Propply AI - Deployment Verification Script
# This script verifies that all necessary files and configurations are ready for Railway deployment

echo "🔍 Verifying Propply AI Deployment Configuration..."
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required files exist
echo "📁 Checking required files..."
files=("package.json" "railway.json" "nixpacks.toml" "Procfile" ".npmrc")
all_files_exist=true

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file exists"
    else
        echo -e "${RED}✗${NC} $file is missing"
        all_files_exist=false
    fi
done

echo ""

# Check if build directory exists
echo "🏗️  Checking build status..."
if [ -d "build" ]; then
    echo -e "${GREEN}✓${NC} Build directory exists"
    
    # Check build contents
    if [ -f "build/index.html" ]; then
        echo -e "${GREEN}✓${NC} build/index.html exists"
    else
        echo -e "${RED}✗${NC} build/index.html is missing - run 'npm run build'"
    fi
    
    if [ -d "build/static" ]; then
        echo -e "${GREEN}✓${NC} build/static directory exists"
    else
        echo -e "${RED}✗${NC} build/static directory is missing - run 'npm run build'"
    fi
else
    echo -e "${YELLOW}⚠${NC} Build directory doesn't exist - will be created during deployment"
fi

echo ""

# Check package.json configuration
echo "📦 Checking package.json configuration..."
if grep -q '"postinstall"' package.json; then
    echo -e "${GREEN}✓${NC} postinstall script configured"
else
    echo -e "${RED}✗${NC} postinstall script missing"
fi

if grep -q '"serve"' package.json; then
    echo -e "${GREEN}✓${NC} serve script configured"
else
    echo -e "${RED}✗${NC} serve script missing"
fi

if grep -q '"engines"' package.json; then
    echo -e "${GREEN}✓${NC} Node.js engine version specified"
else
    echo -e "${YELLOW}⚠${NC} Node.js engine version not specified"
fi

echo ""

# Check for environment variables
echo "🔐 Checking environment configuration..."
if [ -f ".env.example" ]; then
    echo -e "${GREEN}✓${NC} .env.example exists"
else
    echo -e "${YELLOW}⚠${NC} .env.example is missing"
fi

if [ -f ".env.production" ]; then
    echo -e "${GREEN}✓${NC} .env.production exists"
else
    echo -e "${YELLOW}⚠${NC} .env.production is missing"
fi

echo ""

# Check dependencies
echo "📚 Checking dependencies..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules directory exists"
    
    # Check for critical dependencies
    critical_deps=("react" "react-dom" "react-scripts" "serve" "@supabase/supabase-js")
    for dep in "${critical_deps[@]}"; do
        if [ -d "node_modules/$dep" ]; then
            echo -e "${GREEN}✓${NC} $dep installed"
        else
            echo -e "${RED}✗${NC} $dep is missing - run 'npm install'"
        fi
    done
else
    echo -e "${RED}✗${NC} node_modules directory doesn't exist - run 'npm install'"
fi

echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 DEPLOYMENT CHECKLIST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Before deploying to Railway, ensure:"
echo ""
echo "1. ${YELLOW}Set environment variables in Railway:${NC}"
echo "   - REACT_APP_SUPABASE_URL"
echo "   - REACT_APP_SUPABASE_ANON_KEY"
echo "   - REACT_APP_API_URL"
echo "   - REACT_APP_STRIPE_PUBLISHABLE_KEY"
echo "   - REACT_APP_STRIPE_PRICE_ID_* (all 4 price IDs)"
echo ""
echo "2. ${YELLOW}Commit and push your changes:${NC}"
echo "   git add ."
echo "   git commit -m 'Fix Railway deployment configuration'"
echo "   git push origin main"
echo ""
echo "3. ${YELLOW}Deploy on Railway:${NC}"
echo "   - Railway will auto-deploy from GitHub"
echo "   - Or use: railway up"
echo ""
echo "4. ${YELLOW}Monitor deployment:${NC}"
echo "   - Check Railway logs for errors"
echo "   - Verify the app loads at your Railway URL"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test build locally
echo "🧪 Would you like to test the build locally? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo ""
    echo "Running npm run build..."
    npm run build
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✓${NC} Build successful!"
        echo ""
        echo "To test locally, run: npm run serve"
        echo "Then visit: http://localhost:3000"
    else
        echo ""
        echo -e "${RED}✗${NC} Build failed. Check the errors above."
    fi
fi

echo ""
echo "Done! 🚀"
