# Railway Environment Variables - Quick Reference

## 🔑 Required Environment Variables

Copy and paste these into Railway's environment variables dashboard. Replace the placeholder values with your actual credentials.

### Supabase Configuration
```bash
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to find**:
- Go to your Supabase project dashboard
- Settings → API
- Copy "Project URL" and "anon public" key

---

### Backend API Configuration
```bash
REACT_APP_API_URL=https://your-backend.railway.app
```

**Note**: If you have a separate backend service on Railway, use its Railway URL. If not deployed yet, you can update this later.

---

### Stripe Configuration
```bash
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_51...
```

**Where to find**:
- Go to Stripe Dashboard
- Developers → API keys
- Copy "Publishable key" (starts with `pk_test_` or `pk_live_`)

---

### Stripe Price IDs
```bash
REACT_APP_STRIPE_PRICE_ID_SINGLE_ONE_TIME=price_1...
REACT_APP_STRIPE_PRICE_ID_SINGLE_MONTHLY=price_1...
REACT_APP_STRIPE_PRICE_ID_MULTIPLE_ONGOING=price_1...
REACT_APP_STRIPE_PRICE_ID_ENTERPRISE_YEARLY=price_1...
```

**Where to find**:
- Go to Stripe Dashboard
- Products → Select your product
- Copy the Price ID for each pricing tier

**How to create** (if you haven't yet):
1. Go to Stripe Dashboard → Products
2. Create a new product: "Propply AI - Single Property One-Time"
3. Add pricing: One-time payment
4. Copy the Price ID
5. Repeat for each pricing tier

---

## ⚙️ Optional Environment Variables

### Build Optimization
```bash
GENERATE_SOURCEMAP=false
INLINE_RUNTIME_CHUNK=false
NODE_ENV=production
CI=false
```

**Note**: `CI=false` is critical - it prevents ESLint warnings from failing the build. These are already set in `.env.production` but you can override them in Railway if needed.

---

### Memory Configuration (if build fails)
```bash
NODE_OPTIONS=--max-old-space-size=4096
```

**When to use**: Only add this if you see "JavaScript heap out of memory" errors during build.

---

### Analytics (Optional)
```bash
REACT_APP_ANALYTICS_ID=your-analytics-id
```

---

## 📋 Checklist

Before deploying, ensure you have:

- [ ] Created a Supabase project
- [ ] Copied Supabase URL and anon key
- [ ] Created a Stripe account
- [ ] Created Stripe products and prices
- [ ] Copied all 4 Stripe price IDs
- [ ] Deployed backend API (or have its URL ready)
- [ ] Added all variables to Railway dashboard

---

## 🚀 How to Add Variables in Railway

### Method 1: Railway Dashboard (Recommended)
1. Go to your Railway project
2. Click on your service
3. Go to "Variables" tab
4. Click "New Variable"
5. Add each variable name and value
6. Click "Add" for each one

### Method 2: Railway CLI
```bash
railway variables set REACT_APP_SUPABASE_URL="https://your-project.supabase.co"
railway variables set REACT_APP_SUPABASE_ANON_KEY="your-key"
# ... repeat for each variable
```

### Method 3: Bulk Import
1. Create a file `railway-vars.txt`:
```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-key
REACT_APP_API_URL=https://your-backend.railway.app
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
REACT_APP_STRIPE_PRICE_ID_SINGLE_ONE_TIME=price_1...
REACT_APP_STRIPE_PRICE_ID_SINGLE_MONTHLY=price_1...
REACT_APP_STRIPE_PRICE_ID_MULTIPLE_ONGOING=price_1...
REACT_APP_STRIPE_PRICE_ID_ENTERPRISE_YEARLY=price_1...
```

2. In Railway dashboard, click "Raw Editor" and paste the contents

---

## 🔒 Security Best Practices

1. **Never commit** `.env.local` or files with actual secrets to Git
2. **Use test keys** for development (pk_test_, sk_test_)
3. **Use live keys** only in production (pk_live_, sk_live_)
4. **Rotate keys** if they're ever exposed
5. **Restrict API keys** in Supabase and Stripe dashboards

---

## ✅ Verification

After adding all variables:

1. **Check Railway logs** for any missing variable warnings
2. **Redeploy** if you added variables after initial deployment
3. **Test the app** to ensure all features work:
   - Authentication (Supabase)
   - Payment flow (Stripe)
   - API calls (Backend)

---

## 🐛 Troubleshooting

### "Cannot read property of undefined" errors
**Cause**: Missing environment variable
**Fix**: Check Railway logs to see which variable is undefined, then add it

### Stripe checkout not working
**Cause**: Wrong Stripe publishable key or price IDs
**Fix**: Verify keys in Stripe dashboard match Railway variables

### Authentication fails
**Cause**: Wrong Supabase URL or key
**Fix**: Verify credentials in Supabase dashboard

### API calls fail
**Cause**: Wrong backend URL or backend not deployed
**Fix**: Ensure backend is running and URL is correct

---

## 📞 Need Help?

1. Check Railway logs: `railway logs`
2. Check browser console for errors
3. Verify all variables are set: Railway dashboard → Variables tab
4. Test locally first: Set variables in `.env.local` and run `npm start`

---

## 🎯 Quick Copy-Paste Template

```bash
# Copy this template and fill in your values
REACT_APP_SUPABASE_URL=
REACT_APP_SUPABASE_ANON_KEY=
REACT_APP_API_URL=
REACT_APP_STRIPE_PUBLISHABLE_KEY=
REACT_APP_STRIPE_PRICE_ID_SINGLE_ONE_TIME=
REACT_APP_STRIPE_PRICE_ID_SINGLE_MONTHLY=
REACT_APP_STRIPE_PRICE_ID_MULTIPLE_ONGOING=
REACT_APP_STRIPE_PRICE_ID_ENTERPRISE_YEARLY=
GENERATE_SOURCEMAP=false
INLINE_RUNTIME_CHUNK=false
NODE_ENV=production
CI=false
```
