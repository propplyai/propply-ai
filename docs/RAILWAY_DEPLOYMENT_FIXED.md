# Railway Deployment Guide - Fixed Configuration

## ✅ Package Issues Fixed

### Changes Made:
1. **Updated package.json**:
   - Added `engines` field to specify Node.js >= 18.0.0
   - Updated outdated dependencies (@supabase/supabase-js, react, react-dom, etc.)
   - Added `postinstall` script to build automatically after npm install
   - Updated `serve` command to use PORT environment variable: `${PORT:-3000}`

2. **Created .npmrc**:
   - Ensures consistent installation with `legacy-peer-deps=true`
   - Prevents engine version conflicts

3. **Updated nixpacks.toml**:
   - Properly configured build phases
   - Uses `npm ci --legacy-peer-deps` for faster, more reliable installs
   - Set `NPM_CONFIG_PRODUCTION=false` to ensure devDependencies are available for build

4. **Updated railway.json**:
   - Increased healthcheck timeout to 300s (build can take time)
   - Added schema reference

5. **Created .env.production**:
   - Template for production environment variables

## 🚀 Deployment Steps

### Step 1: Set Environment Variables in Railway

Go to your Railway project settings and add these variables:

```bash
# Required - Supabase
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# Required - Backend API
REACT_APP_API_URL=https://your-backend-api.railway.app

# Required - Stripe
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_or_test_key
REACT_APP_STRIPE_PRICE_ID_SINGLE_ONE_TIME=price_xxx
REACT_APP_STRIPE_PRICE_ID_SINGLE_MONTHLY=price_xxx
REACT_APP_STRIPE_PRICE_ID_MULTIPLE_ONGOING=price_xxx
REACT_APP_STRIPE_PRICE_ID_ENTERPRISE_YEARLY=price_xxx

# Build Optimization
GENERATE_SOURCEMAP=false
INLINE_RUNTIME_CHUNK=false
NODE_ENV=production
```

### Step 2: Push to GitHub

```bash
git add .
git commit -m "Fix Railway deployment configuration"
git push origin main
```

### Step 3: Deploy on Railway

Railway will automatically:
1. Install dependencies with `npm ci --legacy-peer-deps`
2. Build the app with `npm run build` (via postinstall)
3. Start the server with `npm run serve`

### Step 4: Verify Deployment

1. Check Railway logs for any errors
2. Visit your Railway URL
3. Test authentication and key features

## 🔧 Troubleshooting

### Build Fails with "Out of Memory"
Add to Railway environment variables:
```bash
NODE_OPTIONS=--max-old-space-size=4096
```

### Environment Variables Not Loading
- Ensure all `REACT_APP_*` variables are set in Railway
- Redeploy after adding new variables
- Check Railway logs for missing variable warnings

### 404 on Page Refresh
Add this to your `serve` command (already configured):
```bash
serve -s build -l ${PORT:-3000}
```
The `-s` flag enables SPA mode with proper routing.

### Port Binding Issues
Railway automatically provides the `PORT` environment variable. Our serve command uses `${PORT:-3000}` which:
- Uses Railway's PORT if available
- Falls back to 3000 for local development

## 📊 Build Performance

Current build size:
- JavaScript: ~106 KB (gzipped)
- CSS: ~8.5 KB (gzipped)

Build time: ~30-60 seconds on Railway

## 🔒 Security Notes

1. Never commit `.env.local` or `.env.production` with actual secrets
2. Use Railway's environment variables dashboard for all sensitive data
3. Rotate API keys regularly
4. Enable HTTPS (Railway does this automatically)

## 📝 Known Warnings

The build shows some ESLint warnings (unused imports, missing useEffect dependencies). These are non-critical but should be fixed for production:

- Remove unused imports in components
- Add missing dependencies to useEffect hooks
- Consider using `useCallback` for functions in dependencies

## 🎯 Next Steps

1. ✅ Packages updated and fixed
2. ✅ Railway configuration optimized
3. ⏳ Set environment variables in Railway
4. ⏳ Deploy and test
5. ⏳ Fix ESLint warnings (optional but recommended)

## 📞 Support

If deployment still fails:
1. Check Railway logs: `railway logs`
2. Verify all environment variables are set
3. Ensure your Supabase project is accessible
4. Check that your backend API is running
