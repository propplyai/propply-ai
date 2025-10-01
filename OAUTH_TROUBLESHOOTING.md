# OAuth Troubleshooting Guide

## 🚨 CRITICAL ISSUE FOUND

Your `.env` file uses a **different Supabase project** (`vlnnvxlgzhtaorpixsay`) than what's connected to MCP (`dfgaqomwpxrysrbkkvuv`).

**First, determine which project is correct for production.**

---

## ✅ Step 1: Verify Supabase Project

1. Log into https://supabase.com/dashboard
2. Find the project for `agent4nyc.onrender.com`
3. Check the Project URL - it should be: `vlnnvxlgzhtaorpixsay.supabase.co` (from your .env)
4. Verify this is the project you want to use

---

## ✅ Step 2: Check Google OAuth Configuration

### In Supabase Dashboard:

1. Go to **Authentication** → **Providers**
2. Find **Google** provider
3. Verify it's **ENABLED**
4. Check that you have:
   - ✅ **Client ID** (from Google Cloud Console)
   - ✅ **Client Secret** (from Google Cloud Console)

---

## ✅ Step 3: Verify Redirect URLs

### In Supabase Dashboard (Project: vlnnvxlgzhtaorpixsay):

1. Go to **Authentication** → **URL Configuration**
2. **Site URL** should be **EXACTLY**:
   ```
   https://agent4nyc.onrender.com
   ```
   ⚠️ **NO trailing slash!**
   ⚠️ **Must be https:// (not http://)**

3. **Redirect URLs** should include:
   ```
   https://agent4nyc.onrender.com
   https://agent4nyc.onrender.com/**
   http://localhost:3000/**
   ```

---

## ✅ Step 4: Check Google Cloud Console

1. Go to https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID for Propply
3. Under **Authorized JavaScript origins**, add:
   ```
   https://agent4nyc.onrender.com
   https://vlnnvxlgzhtaorpixsay.supabase.co
   ```

4. Under **Authorized redirect URIs**, add:
   ```
   https://vlnnvxlgzhtaorpixsay.supabase.co/auth/v1/callback
   https://agent4nyc.onrender.com
   ```

---

## ✅ Step 5: Test OAuth Flow

### Manual Test:

1. Open browser in **Incognito/Private mode**
2. Go to https://agent4nyc.onrender.com
3. Click "Sign in with Google"
4. Watch the browser console (F12) for errors
5. Check the URL parameters after redirect

### Expected Flow:

1. Click "Sign in with Google"
2. Redirect to Google: `https://accounts.google.com/...`
3. Choose Google account
4. Redirect to Supabase: `https://vlnnvxlgzhtaorpixsay.supabase.co/auth/v1/callback?code=...`
5. Redirect to your app: `https://agent4nyc.onrender.com?code=...`
6. Your app exchanges code for session

### Common Errors:

#### Error: `redirect_uri_mismatch`
**Cause:** Google Cloud Console doesn't have the Supabase callback URL
**Fix:** Add `https://vlnnvxlgzhtaorpixsay.supabase.co/auth/v1/callback` to Google Cloud Console

#### Error: `bad_oauth_callback` or `error_code=400`
**Cause:** Supabase Site URL doesn't match your app's URL
**Fix:** Set Site URL to exactly `https://agent4nyc.onrender.com` (no trailing slash)

#### Error: `PKCE verification failed`
**Cause:** localStorage was cleared between starting and finishing OAuth
**Fix:** Already fixed in your code (line 92-94 of auth.js)

#### Session/User is null after redirect
**Cause:** Code exchange failed or profile creation issue
**Fix:** Check browser console for errors during `exchangeCodeForSession`

---

## 🔍 Debug Commands

### Check browser console after OAuth attempt:
```javascript
// In browser console after OAuth redirect
console.log('Session:', await supabase.auth.getSession());
console.log('User:', await supabase.auth.getUser());
```

### Check localStorage:
```javascript
// In browser console
console.log('Auth key:', localStorage.getItem('propply-auth'));
console.log('All localStorage:', {...localStorage});
```

### Check network tab:
1. Open DevTools → Network tab
2. Try signing in with Google
3. Look for failed requests (red)
4. Check the `/callback` request from Supabase
5. Check the `exchangeCodeForSession` request

---

## 🎯 Most Likely Issues (in order):

1. **Redirect URL mismatch** - Site URL in Supabase ≠ `https://agent4nyc.onrender.com`
2. **Google Cloud Console** - Missing Supabase callback URL
3. **Google OAuth not enabled** - Provider not turned on in Supabase
4. **Wrong project credentials** - Using `vlnnvxlgzhtaorpixsay` vs `dfgaqomwpxrysrbkkvuv`

---

## 📝 Quick Fix Script

If you need to update environment variables on Render:

```bash
# Set correct Supabase URL and Key
REACT_APP_SUPABASE_URL=https://vlnnvxlgzhtaorpixsay.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsbm52eGxnemh0YW9ycGl4c2F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMTE1NjgsImV4cCI6MjA3NDc4NzU2OH0.yGC82Qop5M_CSA48nXpwC15HxrqqW7CugFIb-17nxG0
```

Then **redeploy** your app on Render.

---

## 🆘 If Still Not Working

Share the **exact error** you see in:
1. Browser console (F12 → Console tab)
2. Network tab (F12 → Network tab)
3. URL after redirect (copy the full URL)

I'll help diagnose further!

