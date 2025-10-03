# 🚀 Railway Deployment Guide for Propply AI

## Why Railway is Perfect for Propply AI

- ✅ **Full-stack hosting** (React frontend + Flask backend)
- ✅ **Built-in PostgreSQL database** (no need for external Supabase)
- ✅ **Automatic deployments** from GitHub
- ✅ **Environment variable management**
- ✅ **Global CDN** and auto-scaling
- ✅ **Free tier** with generous limits
- ✅ **One-click database setup**

## 📋 Prerequisites

1. **GitHub Account** (for code repository)
2. **Railway Account** (free at railway.app)
3. **Google Cloud Account** (for OAuth - optional)

## 🎯 Step 1: Prepare Your Code for Railway

### 1.1 Create Railway Configuration

Railway will auto-detect your React app, but let's create a proper configuration:

```json
// railway.json (create this file)
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 1.2 Update Package.json for Production

```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "serve": "serve -s build -l 3000",
    "dev": "react-scripts start"
  }
}
```

## 🚀 Step 2: Deploy to Railway

### 2.1 Create GitHub Repository

1. **Go to [github.com/new](https://github.com/new)**
2. **Repository name**: `propply-ai`
3. **Description**: "Propply AI - Property Compliance Management Platform"
4. **Make it Public**
5. **DO NOT** initialize with README
6. **Click "Create repository"**

### 2.2 Push Code to GitHub

```bash
# In your project directory
git remote add origin https://github.com/YOUR_USERNAME/propply-ai.git
git push -u origin main
```

### 2.3 Deploy to Railway

1. **Go to [railway.app](https://railway.app)**
2. **Sign in with GitHub**
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose your `propply-ai` repository**
6. **Railway will auto-detect React and configure settings**
7. **Click "Deploy"**

## 🗄️ Step 3: Set up Database

### 3.1 Add PostgreSQL Database

1. **In Railway dashboard**, click **"+ New"**
2. **Select "Database"**
3. **Choose "PostgreSQL"**
4. **Click "Add"**
5. **Wait for database to be provisioned**

### 3.2 Get Database Connection Details

1. **Click on your PostgreSQL service**
2. **Go to "Variables" tab**
3. **Copy these values**:
   - `DATABASE_URL`
   - `PGHOST`
   - `PGPORT`
   - `PGUSER`
   - `PGPASSWORD`
   - `PGDATABASE`

## 🔧 Step 4: Configure Environment Variables

### 4.1 Add Database Variables

1. **In Railway dashboard**, click on your **React service**
2. **Go to "Variables" tab**
3. **Add these variables**:

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:password@host:port/database
PGHOST=your-db-host
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your-password
PGDATABASE=railway

# Supabase Configuration (for authentication)
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# Optional: Flask Backend
FLASK_ENV=production
FLASK_DEBUG=false
```

### 4.2 Set up Supabase for Authentication

Since Railway provides the database, we'll use Supabase only for authentication:

1. **Go to [supabase.com](https://supabase.com)**
2. **Create new project**
3. **Get credentials**:
   - Project URL
   - Anon Key
4. **Add to Railway environment variables**

## 🗃️ Step 5: Set up Database Schema

### 5.1 Connect to Railway Database

You can use Railway's built-in database tools or connect externally:

```bash
# Using Railway CLI
railway connect

# Or use the connection string from Railway dashboard
psql $DATABASE_URL
```

### 5.2 Run Database Schema

1. **Copy the contents of `database/schema.sql`**
2. **Execute in Railway database**:
   - Use Railway's database dashboard
   - Or connect via psql and run the schema

## 🔐 Step 6: Configure Authentication

### 6.1 Set up Supabase Authentication

1. **In Supabase dashboard**, go to **Authentication > Settings**
2. **Site URL**: Set to your Railway domain (e.g., `https://propply-ai-production.up.railway.app`)
3. **Redirect URLs**: Add your Railway domain
4. **Enable email signup**: ✅ True
5. **Enable email confirmations**: ❌ False (for development)

### 6.2 Optional: Set up Google OAuth

1. **Go to [Google Cloud Console](https://console.cloud.google.com)**
2. **Create OAuth 2.0 credentials**
3. **Authorized JavaScript origins**:
   - `https://propply-ai-production.up.railway.app`
4. **Authorized redirect URIs**:
   - `https://your-project-ref.supabase.co/auth/v1/callback`
5. **Configure in Supabase**: Authentication > Providers > Google

## 🚀 Step 7: Deploy and Test

### 7.1 Trigger Deployment

1. **Railway will auto-deploy** when you push to GitHub
2. **Or manually trigger**: Railway dashboard → Deployments → Redeploy

### 7.2 Test Your Application

1. **Visit your Railway domain**
2. **Test the landing page**
3. **Test email authentication**:
   - Sign up with email/password
   - Check if user is created in Supabase
4. **Test user profile creation**
5. **Check browser console** for errors

## 🔧 Step 8: Configure Custom Domain (Optional)

1. **In Railway dashboard**, go to **Settings**
2. **Click "Custom Domains"**
3. **Add your domain** (e.g., `propply-ai.com`)
4. **Configure DNS** as instructed
5. **SSL certificate** will be auto-generated

## 📊 Step 9: Monitor and Scale

### 9.1 Monitor Performance

- **Railway dashboard** → Metrics
- **Database performance** → PostgreSQL metrics
- **Application logs** → Real-time logs

### 9.2 Scale as Needed

- **Automatic scaling** based on traffic
- **Database scaling** available
- **CDN** for global performance

## 🎉 Success Checklist

- [ ] ✅ GitHub repository created and code pushed
- [ ] ✅ Railway deployment successful
- [ ] ✅ PostgreSQL database provisioned
- [ ] ✅ Database schema applied
- [ ] ✅ Environment variables configured
- [ ] ✅ Supabase authentication working
- [ ] ✅ User profiles being created
- [ ] ✅ No console errors
- [ ] ✅ Optional: Google OAuth working
- [ ] ✅ Optional: Custom domain configured

## 🔧 Troubleshooting

### Common Issues:

1. **Build failures**
   - Check Railway build logs
   - Verify all dependencies in package.json

2. **Database connection issues**
   - Verify DATABASE_URL is correct
   - Check database is provisioned

3. **Authentication not working**
   - Check Supabase configuration
   - Verify environment variables

4. **Environment variables not loading**
   - Restart the service after adding variables
   - Check variable names match exactly

### Debug Steps:
1. **Check Railway logs**: Service → Logs
2. **Check database connection**: Service → Database
3. **Browser console**: Look for JavaScript errors
4. **Network tab**: Check for failed API calls

## 💰 Railway Pricing

- **Free Tier**: $5 credit/month (generous for MVP)
- **Pro Plan**: $20/month (when you scale)
- **Database**: Included in free tier
- **Bandwidth**: Generous limits

## 🚀 Your App is Live!

Once everything is working, you'll have:
- ✅ **Professional Railway deployment**
- ✅ **Automatic deployments** from GitHub
- ✅ **Built-in PostgreSQL database**
- ✅ **Global CDN** and scaling
- ✅ **User authentication**
- ✅ **Production-ready hosting**

**Your Propply AI MVP is now live on Railway!** 🎉

## 📞 Support

If you encounter issues:
1. Check Railway logs and metrics
2. Verify all environment variables
3. Test database connection
4. Review browser console for errors
5. Check Supabase authentication settings
