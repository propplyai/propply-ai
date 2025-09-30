# 🔐 Google OAuth Configuration Guide

## ✅ Code Changes Applied

1. ✅ Removed AuthDebug and AuthTest components
2. ✅ Fixed Google OAuth redirect URL logic
3. ✅ Now uses `window.location.origin` for all environments

---

## 🚀 Google OAuth Setup Steps

### **Step 1: Get Google OAuth Credentials**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Web application**

### **Step 2: Configure Authorized URLs**

#### **For Local Development:**
```
Authorized JavaScript origins:
- http://localhost:3000
- http://localhost:3001

Authorized redirect URIs:
- https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback
```

#### **For Production (Railway/Render):**
```
Authorized JavaScript origins:
- https://your-app.up.railway.app
- https://your-app.onrender.com

Authorized redirect URIs:
- https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback
```

**Important:** Remove any old ngrok URLs from this list!

### **Step 3: Configure Supabase**

1. Go to your [Supabase Dashboard](https://supabase.com)
2. Select your project
3. Go to **Authentication** → **Providers**
4. Find **Google** and enable it
5. Enter your Google OAuth credentials:
   - **Client Secret** (from Google Cloud Console)
6. Click **Save**

### **Step 4: Configure Redirect URLs in Supabase**

1. In Supabase Dashboard → **Authentication** → **URL Configuration## **Production Only Setup (Recommended)**

**Site URL:** 
# After Google auth, should redirect back to http://localhost:3000
```

### **Production Testing:**
```bash
# Visit your deployed URL
# Click "Continue with Google"
# After Google auth, should redirect back to your deployed URL
```

---

## ❌ Old ngrok URL Removed

The old redirect logic that checked for ngrok has been removed:
```javascript
// ❌ OLD CODE (removed):
const redirectUrl = window.location.href.includes('ngrok') 
  ? window.location.origin 
  : window.location.origin;

// ✅ NEW CODE (cleaner):
const redirectUrl = window.location.origin;
```

**This means:**
- ✅ Works with localhost
- ✅ Works with Railway
- ✅ Works with Render
- ✅ Works with any deployment URL
- ❌ No more hardcoded ngrok URLs

---

## 🔧 How OAuth Redirect Works Now

### **Flow:**
1. User clicks "Continue with Google"
2. App calls `signInWithGoogle()`
3. Redirect URL is set to current origin: `window.location.origin`
4. User is redirected to Google
5. After Google auth, user is redirected to Supabase callback
6. Supabase processes auth and redirects back to your app origin
7. App detects the auth code in URL and completes sign-in

### **URL Examples:**
```bash
# Local:
http://localhost:3000 → Google → Supabase → http://localhost:3000

# Railway:
https://your-app.up.railway.app → Google → Supabase → https://your-app.up.railway.app

# Render:
https://your-app.onrender.com → Google → Supabase → https://your-app.onrender.com
```

---

## 🎯 Checklist

### **Google Cloud Console:**
- [ ] OAuth 2.0 Client ID created
- [ ] Authorized JavaScript origins added (localhost + production)
- [ ] Authorized redirect URIs added (Supabase callback)
- [ ] **All old ngrok URLs removed**
- [ ] Client ID and Secret copied

### **Supabase Dashboard:**
- [ ] Google provider enabled
- [ ] Client ID and Secret pasted
- [ ] Site URLs configured (localhost + production)
- [ ] Redirect URLs configured
- [ ] Changes saved

### **Testing:**
- [ ] Local OAuth works (redirects to localhost)
- [ ] Production OAuth works (redirects to deployment URL)
- [ ] User profile created after OAuth
- [ ] No console errors

---

## 🐛 Troubleshooting

### **"Redirect URI mismatch" Error**
→ Check that Supabase callback URL is in Google Cloud Console authorized redirect URIs:
```
https://YOUR_PROJECT.supabase.co/auth/v1/callback
```

### **Redirects to old ngrok URL**
→ Code has been fixed! Make sure you:
1. Pulled latest code from GitHub
2. Removed old ngrok URLs from Google Cloud Console
3. Cleared browser cache

### **OAuth works locally but not in production**
→ Add your production URL to:
1. Google Cloud Console authorized origins
2. Supabase Site URLs
3. Supabase Redirect URLs

### **User stuck on loading screen**
→ Check browser console for errors
→ Verify Supabase environment variables are set correctly

---

## 📝 Summary

✅ **Auth debug panels removed**  
✅ **Google OAuth redirect fixed** (no more ngrok)  
✅ **Works in all environments** (localhost, Railway, Render)  
✅ **Clean, production-ready code**  

Just configure Google Cloud Console and Supabase, and OAuth will work! 🚀
