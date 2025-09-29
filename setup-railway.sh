#!/bin/bash

# Railway Setup Script for Propply AI
echo "🚀 Propply AI Railway Setup Script"
echo "=================================="

# Check if git remote exists
if git remote get-url origin >/dev/null 2>&1; then
    echo "✅ Git remote 'origin' already exists"
    echo "Current remote URL: $(git remote get-url origin)"
else
    echo "📝 No git remote found. Please add your GitHub repository:"
    echo ""
    echo "1. Go to https://github.com/new"
    echo "2. Create repository named 'propply-ai'"
    echo "3. Copy the repository URL"
    echo "4. Run: git remote add origin <YOUR_REPO_URL>"
    echo ""
    read -p "Enter your GitHub repository URL (or press Enter to skip): " repo_url
    
    if [ ! -z "$repo_url" ]; then
        git remote add origin "$repo_url"
        echo "✅ Remote added: $repo_url"
    else
        echo "⚠️  Skipping remote setup. You can add it later with:"
        echo "   git remote add origin <YOUR_REPO_URL>"
    fi
fi

# Check current branch
current_branch=$(git branch --show-current)
echo "📋 Current branch: $current_branch"

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Uncommitted changes found. Committing them..."
    git add .
    git commit -m "Add Railway configuration and deployment setup"
    echo "✅ Changes committed"
else
    echo "✅ No uncommitted changes"
fi

# Push to GitHub if remote exists
if git remote get-url origin >/dev/null 2>&1; then
    echo "🚀 Pushing to GitHub..."
    git push -u origin main
    if [ $? -eq 0 ]; then
        echo "✅ Successfully pushed to GitHub!"
        echo ""
        echo "🎯 Next Steps:"
        echo "1. Go to https://railway.app"
        echo "2. Sign in with GitHub"
        echo "3. Click 'New Project' → 'Deploy from GitHub repo'"
        echo "4. Select your 'propply-ai' repository"
        echo "5. Add PostgreSQL database"
        echo "6. Configure environment variables"
        echo "7. Set up Supabase for authentication"
        echo ""
        echo "📖 See RAILWAY_DEPLOYMENT.md for detailed instructions"
    else
        echo "❌ Failed to push to GitHub. Please check your repository URL and try again."
    fi
else
    echo "⚠️  No remote configured. Please add your GitHub repository first."
    echo "   Run: git remote add origin <YOUR_REPO_URL>"
    echo "   Then run this script again."
fi

echo ""
echo "🔗 Useful Links:"
echo "- Railway: https://railway.app"
echo "- GitHub: https://github.com"
echo "- Supabase: https://supabase.com"
echo "- Google Cloud: https://console.cloud.google.com"
echo ""
echo "💡 Railway Benefits:"
echo "- Full-stack hosting (React + Flask)"
echo "- Built-in PostgreSQL database"
echo "- Automatic deployments from GitHub"
echo "- Global CDN and auto-scaling"
echo "- Free tier with generous limits"
