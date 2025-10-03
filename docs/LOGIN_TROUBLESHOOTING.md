# 🔍 Login & Profile Dashboard Access Troubleshooting

## Overview
This document identifies **all potential reasons** why users might not be able to login or access the profile dashboard.

---

## 🔴 Critical Issues (Must Fix)

### 1. **Supabase Environment Variables Not Configured in Production**

**Issue:** Your `.env.production` file is empty except for build config.

```bash
# Current .env.production
GENERATE_SOURCEMAP=false
INLINE_RUNTIME_CHUNK=false
CI=false
```

**Problem:** 
- Production builds don't have access to Supabase credentials
- Without `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`, authentication cannot work
- Your app will show: "Supabase environment variables not configured"

**Solution:**
```bash
# Add to Railway/Render environment variables:
REACT_APP_SUPABASE_URL=https://tsvgwcvgiidrfthaaghn.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzdmd3Y3ZnaWlkcmZ0aGFhZ2huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MjI0NzMsImV4cCI6MjA3Mzk5ODQ3M30.qyTHfxzz8DA6_pQWlpmG-7uD6RI4aX511bWbCkXSEOw
```

**Where to set:**
- **Railway:** Project Settings → Variables
- **Vercel:** Project Settings → Environment Variables
- **Render:** Environment → Environment Variables

---

### 2. **Google OAuth Not Fully Configured**

**Issue:** Google OAuth setup is incomplete.

**Current Status:**
- ✅ Code implementation complete (`authService.signInWithGoogle()`)
- ❌ Google OAuth credentials not added to Supabase
- ❌ Redirect URLs not configured in Google Cloud Console

**Problems this causes:**
- "Continue with Google" button triggers errors
- Users get "Provider not found" or "Invalid provider" errors
- OAuth callback fails silently

**Solution:**

#### Step 1: Configure Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select/Create project
3. Go to **APIs & Services** → **Credentials**
4. Create **OAuth 2.0 Client ID** (Web application)
5. Add **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   https://your-production-domain.com
   ```
6. Add **Authorized redirect URIs:**
   ```
   https://tsvgwcvgiidrfthaaghn.supabase.co/auth/v1/callback
   ```

#### Step 2: Configure Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com)
2. Select your project
3. Go to **Authentication** → **Providers**
4. Enable **Google** provider
5. Enter **Client ID** and **Client Secret** from Google Cloud Console
6. Click **Save**

#### Step 3: Configure Redirect URLs in Supabase
1. In Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add **Site URLs:**
   ```
   http://localhost:3000
   https://your-production-domain.com
   ```
3. Add **Redirect URLs:**
   ```
   http://localhost:3000
   https://your-production-domain.com
   ```

---

### 3. **User Profile Not Created After Authentication**

**Issue:** Authentication succeeds but profile lookup fails.

**Symptoms:**
- User can authenticate with Supabase
- App shows loading screen indefinitely
- Console error: "Could not get user profile"
- User stuck on auth callback page

**Root Causes:**

#### A. Database Trigger Not Running
The `handle_new_user()` trigger should auto-create profiles but may fail if:
- Trigger not enabled in Supabase
- RLS policies blocking insert
- Missing metadata from OAuth provider

**Check in Supabase SQL Editor:**
```sql
-- Verify trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check if profiles exist for authenticated users
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created,
  up.id as profile_id,
  up.created_at as profile_created
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;  -- Users without profiles
```

**Fix:** Manually create missing profiles:
```sql
-- Create profile for users missing one
INSERT INTO public.user_profiles (id, email, full_name, subscription_tier, subscription_status, reports_used, reports_limit)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', ''),
  'free',
  'active',
  0,
  0
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.user_profiles);
```

#### B. RLS Policies Blocking Read
Your app calls `authService.getUserProfile()` which requires:
- User must be authenticated (session valid)
- RLS policy: `auth.uid() = id` must match

**Check RLS:**
```sql
-- Verify RLS policies
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';

-- Test profile access (run as authenticated user)
SELECT * FROM user_profiles WHERE id = auth.uid();
```

---

### 4. **Session Storage/Cookie Issues**

**Issue:** Browser not persisting auth session.

**Symptoms:**
- User logs in successfully
- Page refresh logs them out
- "No session found" errors
- Infinite redirect loops

**Causes:**
1. **Third-party cookies blocked** (Safari, Firefox strict mode)
2. **LocalStorage disabled/cleared**
3. **Incognito/Private browsing** without session storage
4. **CORS issues** preventing cookie setting

**Solutions:**

#### A. Check Supabase Auth Config
```javascript
// In src/config/supabase.js
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,      // ✅ Already set
    persistSession: true,         // ✅ Already set
    detectSessionInUrl: true,     // ✅ Already set
    flowType: 'pkce',            // ✅ Already set
    storage: window.localStorage, // Add this explicitly
    storageKey: 'propply-auth-token' // Add custom key
  }
});
```

#### B. Check CORS Headers
Your production domain must be whitelisted in:
1. **Supabase Dashboard** → **API Settings** → **CORS Origins**
2. Add: `https://your-production-domain.com`

#### C. Browser Console Check
```javascript
// Run in browser console
console.log('LocalStorage:', localStorage.getItem('supabase.auth.token'));
console.log('Session:', await supabase.auth.getSession());
```

---

### 5. **Auth Callback Not Redirecting to Dashboard**

**Issue:** OAuth callback succeeds but user not redirected to profile.

**Current Flow:**
```javascript
// In AuthCallback.jsx (line 39-40)
setTimeout(() => {
  navigate('/?tab=profile', { replace: true });
}, 2000);
```

**Problems:**
1. **2-second delay** can confuse users
2. **Tab parameter might not be recognized** by MVPDashboard
3. **Navigation might fail** if router not ready

**Check in App.js:**
```javascript
// Line 25-29: Tab parameter handling
const urlParams = new URLSearchParams(window.location.search);
const tabParam = urlParams.get('tab');
if (tabParam === 'profile') {
  setInitialTab('profile');  // ✅ This looks correct
}
```

**Solutions:**

#### A. Reduce Callback Delay
```javascript
// In AuthCallback.jsx, change line 39:
setTimeout(() => {
  navigate('/?tab=profile', { replace: true });
}, 500); // Reduce from 2000ms to 500ms
```

#### B. Add Fallback Navigation
```javascript
// In AuthCallback.jsx, add after line 40:
// Fallback if navigation doesn't work
setTimeout(() => {
  if (window.location.pathname !== '/') {
    window.location.href = '/?tab=profile';
  }
}, 3000);
```

---

### 6. **Database Connection/Query Failures**

**Issue:** Supabase queries failing silently.

**Symptoms:**
- Console errors: "Failed to fetch"
- Network tab shows 400/401/403 errors
- Profile data never loads

**Common Causes:**

#### A. Invalid API Key
```javascript
// Check in browser console
console.log('Supabase URL:', process.env.REACT_APP_SUPABASE_URL);
console.log('Key prefix:', process.env.REACT_APP_SUPABASE_ANON_KEY?.substring(0, 20));
```

**Expected:**
- URL: `https://tsvgwcvgiidrfthaaghn.supabase.co`
- Key starts with: `eyJhbGciOiJIUzI1NiIsInR...`

#### B. RLS Policies Too Strict
```sql
-- Check if policies allow profile creation
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies 
WHERE tablename = 'user_profiles';
```

**Fix:** Ensure INSERT policy exists:
```sql
-- Add if missing
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

#### C. API Rate Limiting
If you see `429 Too Many Requests`:
- Supabase free tier: 500 requests/hour
- Solution: Upgrade plan or implement request caching

---

### 7. **Frontend Route/Component Issues**

**Issue:** Dashboard component not rendering even with valid session.

**Potential Problems:**

#### A. MVPDashboard Not Receiving initialTab
```javascript
// In App.js line 242
<MVPDashboard user={user} onLogout={handleLogout} initialTab={initialTab} />
```

**Check console logs:**
- Look for: `"App: initialTab changed to: profile"`
- Look for: `"MVPDashboard: initialTab changed to: profile"`
- Look for: `"MVPDashboard: activeTab is now: profile"`

**Debug by adding:**
```javascript
// In MVPDashboard.jsx, add at top of render:
console.log('MVPDashboard render:', { user: user?.email, initialTab, activeTab });
```

#### B. UserProfile Component Not Loading
```javascript
// In MVPDashboard.jsx, check if profile tab is rendered
// Look for condition that shows UserProfile component
```

**Check:**
1. Is `activeTab === 'profile'` being set correctly?
2. Is `UserProfile` component imported?
3. Are there any conditional renders blocking it?

---

### 8. **Email Confirmation Required But Not Completed**

**Issue:** Supabase requires email confirmation but user hasn't verified.

**Check in Supabase Dashboard:**
1. **Authentication** → **Settings**
2. Look for "**Enable email confirmations**" toggle

**If enabled:**
- User must click verification link in email before they can sign in
- Sign-in attempts will fail with: "Email not confirmed"

**Solutions:**

#### A. Disable for Development
```sql
-- In Supabase Dashboard → Authentication → Settings
-- Toggle OFF: "Enable email confirmations"
```

#### B. Manually Confirm User
```sql
-- In Supabase SQL Editor
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'user@example.com' AND email_confirmed_at IS NULL;
```

#### C. Resend Verification Email
```javascript
// In your app
await supabase.auth.resend({
  type: 'signup',
  email: 'user@example.com'
});
```

---

### 9. **Loading State Never Completes**

**Issue:** App stuck on loading screen forever.

**Current Timeout:** 20 seconds (line 38 in App.js)

**Symptoms:**
- Loading spinner shows indefinitely
- Console shows: "Auth initialization timeout"

**Causes:**
1. **Supabase not responding** (network issue)
2. **Auth callback stuck** in infinite loop
3. **Profile fetch failing** silently

**Debug Steps:**

#### A. Check Network Tab
1. Open browser DevTools → Network
2. Look for requests to `supabase.co`
3. Check status codes (should be 200)
4. Check response times (should be < 2 seconds)

#### B. Check Console for Errors
Look for:
- ❌ "Auth initialization error"
- ❌ "Get user profile error"
- ❌ "Failed to fetch"
- ❌ CORS errors

#### C. Force Load Even on Error
```javascript
// In App.js, modify line 86-90 to always set user:
if (profileResult.success) {
  setUser({ ...session.user, profile: profileResult.data });
} else {
  // ✅ Still set user to prevent infinite loading
  console.warn('Profile fetch failed, setting user without profile');
  setUser(session.user);
}
```

---

## 🟡 Medium Priority Issues

### 10. **Password Reset Flow Not Working**

**Issue:** Users click "Forgot Password" but never receive email.

**Check:**
1. Supabase Dashboard → **Authentication** → **Email Templates**
2. Verify SMTP settings configured
3. Test with `authService.resetPassword('test@example.com')`

### 11. **Profile Data Not Syncing**

**Issue:** User updates profile but changes don't save.

**Check:**
- `authService.updateUserProfile()` implementation
- RLS UPDATE policy on `user_profiles`
- Network tab for 403/401 errors

### 12. **Multiple Sessions/Concurrent Logins**

**Issue:** User logged in on multiple devices, one session invalidates the other.

**Solution:**
- Supabase supports multiple concurrent sessions by default
- Check if you have custom session management logic conflicting

---

## 🟢 Low Priority Issues

### 13. **UI/UX Issues**

- Dashboard tab not highlighting correctly
- Profile form validation errors not showing
- Success messages not displaying

### 14. **Browser-Specific Issues**

- Safari blocking third-party cookies
- Firefox strict tracking protection
- Older browser versions not supported

---

## 🔧 Quick Diagnostic Checklist

Run these checks in order:

### Local Development:
```bash
# 1. Check environment variables
cat .env | grep SUPABASE

# 2. Start app and check console
npm start
# Look for: "Supabase initialized with:"

# 3. Try to sign up
# Check browser console for errors

# 4. Check if profile created
# Supabase Dashboard → Database → user_profiles
```

### Production Deployment:
```bash
# 1. Verify environment variables set
# Railway: railway variables
# Vercel: vercel env ls

# 2. Check build logs
# Look for: "Supabase environment variables not configured"

# 3. Test login in incognito mode

# 4. Check browser console for errors
```

### Database Checks:
```sql
-- 1. Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'user_profiles';

-- 2. Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'user_profiles';

-- 3. Count users vs profiles
SELECT 
  (SELECT COUNT(*) FROM auth.users) as auth_users,
  (SELECT COUNT(*) FROM user_profiles) as profiles;

-- 4. Find orphaned users (no profile)
SELECT au.email, au.created_at
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL;
```

---

## 🎯 Most Likely Issues (Start Here)

Based on your codebase, these are the **most probable** causes:

1. **🔴 Production environment variables not set** (90% likely if production)
2. **🔴 Google OAuth not configured** (80% likely for OAuth users)
3. **🔴 User profile not auto-created** (70% likely for new users)
4. **🟡 Session not persisting** (50% likely)
5. **🟡 Auth callback redirect failing** (40% likely)

---

## 🚀 Recommended Action Plan

### Immediate Actions:

1. **Set production environment variables** in Railway/Vercel/Render
2. **Check Supabase Dashboard** for user profiles
3. **Test in incognito mode** to isolate session issues
4. **Review browser console** for specific error messages

### Short-term Fixes:

1. **Complete Google OAuth setup** (if using OAuth)
2. **Create missing user profiles** manually in database
3. **Add better error messages** to auth flows
4. **Reduce callback redirect delay**

### Long-term Improvements:

1. **Add comprehensive error logging** (e.g., Sentry)
2. **Implement retry logic** for failed profile creation
3. **Add user-facing error messages** instead of infinite loading
4. **Create admin panel** to manually fix auth issues

---

## 📞 Getting Unstuck

If you're still having issues:

1. **Open browser DevTools** (F12)
2. **Go to Console tab**
3. **Attempt to log in**
4. **Copy all error messages**
5. **Share the specific errors** for targeted help

Key things to look for:
- Red error messages in console
- Network requests failing (Status 400, 401, 403, 500)
- "Supabase environment variables not configured" warning
- "Auth initialization timeout" message

---

## ✅ Success Indicators

You'll know auth is working when:

- ✅ User can sign up without errors
- ✅ User receives confirmation email (if enabled)
- ✅ User can sign in with credentials
- ✅ Dashboard loads with user data
- ✅ Profile tab shows user information
- ✅ Page refresh keeps user logged in
- ✅ User can sign out successfully
