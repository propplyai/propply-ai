# 🚨 Fix Login Issues - Quick Action Guide

## 🎯 Start Here: 3-Step Quick Fix

### Step 1: Run Diagnostics (2 minutes)

**Option A: In your deployed app**
1. Open your production app in browser
2. Press F12 to open DevTools
3. Go to Console tab
4. Copy/paste the contents of `diagnose-auth.js`
5. Review the results

**Option B: In local development**
```bash
# Terminal
cd /Users/art3a/dev/Propply_MVP
npm start

# Then in browser console, run diagnose-auth.js
```

### Step 2: Check Environment Variables (5 minutes)

**For Production (Railway/Vercel/Render):**

```bash
# Verify these are set in your deployment platform:
REACT_APP_SUPABASE_URL=https://tsvgwcvgiidrfthaaghn.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzdmd3Y3ZnaWlkcmZ0aGFhZ2huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MjI0NzMsImV4cCI6MjA3Mzk5ODQ3M30.qyTHfxzz8DA6_pQWlpmG-7uD6RI4aX511bWbCkXSEOw
```

**How to set:**

**Railway:**
```bash
railway variables set REACT_APP_SUPABASE_URL=https://tsvgwcvgiidrfthaaghn.supabase.co
railway variables set REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzdmd3Y3ZnaWlkcmZ0aGFhZ2huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MjI0NzMsImV4cCI6MjA3Mzk5ODQ3M30.qyTHfxzz8DA6_pQWlpmG-7uD6RI4aX511bWbCkXSEOw
```

**Vercel:**
```bash
vercel env add REACT_APP_SUPABASE_URL production
# Paste: https://tsvgwcvgiidrfthaaghn.supabase.co

vercel env add REACT_APP_SUPABASE_ANON_KEY production
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Render:**
1. Go to Render Dashboard
2. Select your web service
3. Go to "Environment"
4. Add the two variables above
5. Click "Save Changes"

**After setting, redeploy:**
```bash
# Railway
railway up

# Vercel
vercel --prod

# Render
git push origin main  # Auto-deploys
```

### Step 3: Verify User Profiles Exist (3 minutes)

**Go to Supabase Dashboard:**
1. Visit https://supabase.com/dashboard
2. Select your project (`tsvgwcvgiidrfthaaghn`)
3. Go to **Table Editor** → **user_profiles**
4. Check if profiles exist for your users

**If NO profiles exist:**

Run this in **SQL Editor**:
```sql
-- Create profiles for users that don't have them
INSERT INTO public.user_profiles (
  id, 
  email, 
  full_name, 
  subscription_tier, 
  subscription_status, 
  reports_used, 
  reports_limit
)
SELECT 
  au.id, 
  au.email, 
  COALESCE(
    au.raw_user_meta_data->>'full_name', 
    au.raw_user_meta_data->>'name', 
    ''
  ),
  'free',
  'active',
  0,
  0
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;
```

---

## 🔍 Common Scenarios & Instant Fixes

### Scenario 1: "I can sign up but can't see my dashboard"

**Cause:** User profile not created

**Fix:**
1. Run the SQL above to create missing profiles
2. Have user log out and log back in
3. Should work immediately

### Scenario 2: "Google login doesn't work"

**Cause:** Google OAuth not configured

**Fix:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 Client ID
3. Add redirect URI: `https://tsvgwcvgiidrfthaaghn.supabase.co/auth/v1/callback`
4. Go to [Supabase Dashboard](https://supabase.com/dashboard) → **Authentication** → **Providers**
5. Enable Google and paste Client ID + Secret
6. Save

**Detailed steps:** See `GOOGLE_OAUTH_SETUP.md`

### Scenario 3: "App just shows loading spinner forever"

**Cause:** Session/profile fetch timing out

**Quick Fix:**
```javascript
// Open browser console and run:
localStorage.clear();
location.reload();
```

**Permanent Fix:**
1. Check if Supabase is responding (run diagnose-auth.js)
2. Verify environment variables are set
3. Check if user profile exists in database

### Scenario 4: "Works locally but not in production"

**Cause:** Environment variables not set in production

**Fix:**
1. Set `REACT_APP_SUPABASE_URL` in deployment platform
2. Set `REACT_APP_SUPABASE_ANON_KEY` in deployment platform
3. Redeploy
4. Clear browser cache
5. Try again

### Scenario 5: "User logs in but immediately logs out"

**Cause:** Session not persisting

**Fix:**
1. Check if third-party cookies are blocked (Safari)
2. Try in incognito mode
3. Add your domain to Supabase CORS settings:
   - Supabase Dashboard → **Settings** → **API** → **CORS Origins**
   - Add your production URL

---

## 🧪 Test Your Fix

After applying fixes, test with:

### Test 1: Sign Up Flow
```
1. Go to your app
2. Click "Sign Up"
3. Enter: test@example.com / password123
4. Should see dashboard within 5 seconds
```

### Test 2: Sign In Flow
```
1. Go to your app
2. Click "Sign In"
3. Enter credentials from Test 1
4. Should see dashboard immediately
```

### Test 3: Refresh Test
```
1. While logged in, press F5
2. Should stay logged in
3. Dashboard should reload with your data
```

### Test 4: Profile Tab
```
1. Click on profile tab (or user icon)
2. Should see your user information
3. Try editing a field
4. Click "Save"
5. Should see success message
```

---

## 📊 Monitoring & Debugging

### Real-time Console Logs

Open browser console (F12) and look for:

**✅ Good signs:**
```
Supabase initialized with: { url: "https://...", keyPrefix: "eyJ..." }
User found: test@example.com
Profile fetch result: { success: true, data: {...} }
Auth state change: SIGNED_IN test@example.com
MVPDashboard render: { user: "test@example.com", initialTab: "profile" }
```

**❌ Bad signs:**
```
⚠️ Supabase environment variables not configured
Auth initialization timeout
Get user profile error
Failed to fetch
CORS error
```

### Network Tab Analysis

1. Open DevTools → Network tab
2. Filter by "supabase.co"
3. Look for failed requests (red)
4. Check status codes:
   - 200: ✅ Success
   - 401: ❌ Unauthorized (bad API key or expired session)
   - 403: ❌ Forbidden (RLS policy blocking)
   - 404: ❌ Not found (wrong URL or table doesn't exist)
   - 500: ❌ Server error (database issue)

### Supabase Dashboard Checks

**Authentication → Users:**
- Should see your test accounts
- Check if email is confirmed (green checkmark)

**Table Editor → user_profiles:**
- Should have same number of rows as auth.users
- Each user should have a profile

**Authentication → Logs:**
- Real-time auth events
- Look for failed login attempts

---

## 🚀 Production Deployment Checklist

Before deploying, ensure:

- [ ] Environment variables set in deployment platform
- [ ] Database schema applied (schema.sql)
- [ ] RLS policies enabled
- [ ] Auth trigger active (handle_new_user)
- [ ] Google OAuth configured (if using)
- [ ] CORS origins whitelisted
- [ ] Domain added to Supabase Site URLs

**Deployment command:**
```bash
# Build locally first to test
npm run build

# Deploy to Railway
railway up

# Or deploy to Vercel
vercel --prod

# Or push to GitHub (auto-deploy to Render)
git add .
git commit -m "fix: Configure Supabase environment variables"
git push origin main
```

---

## 💡 Pro Tips

### Tip 1: Use Incognito Mode for Testing
- Isolates session issues
- No cached data interfering
- Fresh localStorage

### Tip 2: Create Test Accounts
```javascript
// In browser console
const testAccounts = [
  'test1@propply.ai',
  'test2@propply.ai',
  'test3@propply.ai'
];
// Use these for different scenarios
```

### Tip 3: Enable Supabase Auth Debug Logs
```javascript
// In src/config/supabase.js (already set for dev)
auth: {
  debug: true  // Shows detailed auth logs
}
```

### Tip 4: Monitor Real Users
```sql
-- See recent signups
SELECT email, created_at, email_confirmed_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- See recent logins
SELECT email, last_sign_in_at
FROM auth.users
WHERE last_sign_in_at > NOW() - INTERVAL '24 hours'
ORDER BY last_sign_in_at DESC;
```

---

## 🆘 Still Not Working?

If you've completed all steps above and still have issues:

### 1. Collect Debug Info

Run this in browser console:
```javascript
const debugInfo = {
  url: window.location.href,
  supabaseUrl: process.env.REACT_APP_SUPABASE_URL,
  hasKey: !!process.env.REACT_APP_SUPABASE_ANON_KEY,
  localStorage: Object.keys(localStorage),
  cookies: document.cookie.split(';').map(c => c.split('=')[0].trim())
};
console.log('Debug Info:', JSON.stringify(debugInfo, null, 2));
```

### 2. Check Specific Errors

Copy the **exact error message** from:
- Browser console (red text)
- Network tab (failed requests)
- Supabase logs (Dashboard → Authentication → Logs)

### 3. Verify Prerequisites

```bash
# Check Node version (should be 14+)
node --version

# Check npm version
npm --version

# Check if build works
npm run build

# Check for TypeScript/ESLint errors
npm run lint
```

### 4. Nuclear Option (Fresh Start)

```bash
# Clear everything and rebuild
rm -rf node_modules package-lock.json build
npm install
npm start
```

---

## 📚 Additional Resources

- **LOGIN_TROUBLESHOOTING.md** - Comprehensive issue list with solutions
- **GOOGLE_OAUTH_SETUP.md** - Step-by-step OAuth configuration
- **AUTHENTICATION_SETUP.md** - Complete auth system guide
- **diagnose-auth.js** - Automated diagnostic script

---

## ✅ Success Criteria

You'll know everything is working when:

1. ✅ User can sign up with email/password
2. ✅ User receives profile data immediately after login
3. ✅ Dashboard loads with correct tab (profile/dashboard)
4. ✅ Page refresh keeps user logged in
5. ✅ User can view/edit their profile
6. ✅ User can sign out successfully
7. ✅ Google OAuth works (if configured)
8. ✅ No errors in browser console
9. ✅ All network requests return 200 status
10. ✅ User profile exists in database

---

**Last Updated:** 2025-09-30
**Your Supabase Project:** tsvgwcvgiidrfthaaghn
**Status:** Ready for diagnostics
