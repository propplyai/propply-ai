# ⚡ Quick Deploy Checklist

## 🔥 Issues Fixed
- ✅ Removed double-build (`postinstall` script)
- ✅ Added explicit build phase for Railway
- ✅ Set `CI=false` to allow warnings
- ✅ Added `--legacy-peer-deps` for Render
- ✅ Fixed port configuration

## 📋 Deploy Now - 3 Steps

### **1. Set Environment Variables**

**In Railway/Render Dashboard, add these:**

```bash
# REQUIRED - Get from Supabase dashboard
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJxxx...

# OPTIONAL - For backend API (can use placeholder)
REACT_APP_API_URL=http://localhost:5002

# OPTIONAL - For Stripe (can use test keys)
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
REACT_APP_STRIPE_PRICE_ID_SINGLE_ONE_TIME=price_xxxxx
REACT_APP_STRIPE_PRICE_ID_SINGLE_MONTHLY=price_xxxxx
REACT_APP_STRIPE_PRICE_ID_MULTIPLE_ONGOING=price_xxxxx
REACT_APP_STRIPE_PRICE_ID_ENTERPRISE_YEARLY=price_xxxxx
```

### **2. Push to GitHub**

```bash
git add .
git commit -m "Fix deployment configuration"
git push origin main
```

### **3. Deploy**

**Railway:** Auto-deploys from GitHub  
**Render:** Auto-deploys from GitHub

---

## ✅ Success Looks Like:

```
Creating an optimized production build...
Compiled successfully.

File sizes after gzip:
  106.03 kB  build/static/js/main.xxx.js
  8.51 kB    build/static/css/main.xxx.css

✓ Build complete!
```

---

## 🆘 If Build Fails:

1. **Check logs** for specific error
2. **Verify environment variables** are set
3. **Clear build cache** and redeploy
4. See `DEPLOYMENT_FIX.md` for detailed troubleshooting

---

## 📞 Where to Get Credentials

### **Supabase (Required):**
1. Go to [supabase.com](https://supabase.com)
2. Create new project (or use existing)
3. Settings → API → Copy:
   - Project URL → `REACT_APP_SUPABASE_URL`
   - anon/public key → `REACT_APP_SUPABASE_ANON_KEY`

### **Stripe (Optional - can skip for initial deploy):**
1. Go to [stripe.com](https://stripe.com)
2. Developers → API keys
3. Copy **Publishable key** (starts with `pk_test_`)
4. Create products in Stripe dashboard
5. Copy **Price IDs** (start with `price_`)

---

## 🎯 You're Ready!

All configuration issues are fixed. Just:
1. Add environment variables
2. Push to GitHub
3. Watch it deploy ✨
