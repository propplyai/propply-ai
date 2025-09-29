# 🚀 GitHub + Vercel Deployment Guide

## Step-by-Step Deployment Instructions

### **Step 1: Create GitHub Repository**

1. **Go to GitHub.com** and sign in
2. **Click "New repository"** (green button)
3. **Repository name**: `propply-ai` (or your preferred name)
4. **Description**: "Propply AI - Property Compliance Management Platform"
5. **Visibility**: Public (or Private if you prefer)
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. **Click "Create repository"**

### **Step 2: Push Code to GitHub**

Run these commands in your terminal:

```bash
# Navigate to your project directory
cd /Users/art3a/dev/Propply_MVP

# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/propply-ai.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### **Step 3: Deploy to Vercel**

1. **Go to [vercel.com](https://vercel.com)** and sign in
2. **Click "New Project"**
3. **Import Git Repository**: Select your `propply-ai` repository
4. **Configure Project**:
   - **Project Name**: `propply-ai` (or your preference)
   - **Framework Preset**: React (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `build` (default)
5. **Click "Deploy"**

### **Step 4: Set up Supabase Database**

1. **Go to [supabase.com](https://supabase.com)** and sign in
2. **Click "New Project"**
3. **Choose Organization** (or create one)
4. **Project Details**:
   - **Name**: `propply-ai-db`
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your users
5. **Click "Create new project"**
6. **Wait 2-3 minutes** for project to be ready

### **Step 5: Configure Database Schema**

1. **In Supabase dashboard**, go to **SQL Editor**
2. **Click "New query"**
3. **Copy and paste** the entire contents of `database/schema.sql`
4. **Click "Run"** to execute the schema
5. **Verify tables created**: Check **Table Editor** to see:
   - `user_profiles`
   - `properties`
   - `compliance_reports`
   - `payments`
   - `vendors`
   - `vendor_quotes`

### **Step 6: Configure Authentication**

1. **In Supabase dashboard**, go to **Authentication > Settings**
2. **Site URL**: Set to your Vercel domain (e.g., `https://propply-ai.vercel.app`)
3. **Redirect URLs**: Add your Vercel domain
4. **Email Settings**:
   - **Enable email signup**: ✅ True
   - **Enable email confirmations**: ❌ False (for development)
5. **Click "Save"**

### **Step 7: Get Supabase Credentials**

1. **In Supabase dashboard**, go to **Settings > API**
2. **Copy these values**:
   - **Project URL**: `https://your-project-ref.supabase.co`
   - **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### **Step 8: Configure Vercel Environment Variables**

1. **In Vercel dashboard**, go to your project
2. **Click "Settings"** tab
3. **Click "Environment Variables"**
4. **Add these variables**:
   - **Name**: `REACT_APP_SUPABASE_URL`
   - **Value**: Your Supabase Project URL
   - **Environment**: Production, Preview, Development
   - **Click "Save"**
5. **Add second variable**:
   - **Name**: `REACT_APP_SUPABASE_ANON_KEY`
   - **Value**: Your Supabase Anon Key
   - **Environment**: Production, Preview, Development
   - **Click "Save"**
6. **Redeploy**: Click "Deployments" → "Redeploy" → "Use existing Build Cache" → "Redeploy"

### **Step 9: Test Your Deployment**

1. **Visit your Vercel domain** (e.g., `https://propply-ai.vercel.app`)
2. **Test the landing page** loads correctly
3. **Test email signup**:
   - Click "Sign Up"
   - Enter email and password
   - Check if user is created in Supabase
4. **Test email signin**:
   - Sign out and sign back in
   - Verify session works
5. **Check browser console** for any errors

### **Step 10: Optional - Set up Google OAuth**

#### **10.1 Create Google OAuth App**
1. **Go to [Google Cloud Console](https://console.cloud.google.com)**
2. **Create new project** or select existing
3. **Enable Google+ API**
4. **Go to Credentials > Create Credentials > OAuth 2.0 Client IDs**
5. **Application type**: Web application
6. **Authorized JavaScript origins**:
   - `https://propply-ai.vercel.app`
   - `http://localhost:3000` (for development)
7. **Authorized redirect URIs**:
   - `https://your-project-ref.supabase.co/auth/v1/callback`

#### **10.2 Configure in Supabase**
1. **In Supabase dashboard**, go to **Authentication > Providers**
2. **Enable Google provider**
3. **Add credentials**:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
4. **Click "Save"**

## 🎉 **Success Checklist**

- [ ] ✅ GitHub repository created and code pushed
- [ ] ✅ Vercel deployment successful
- [ ] ✅ Supabase project created
- [ ] ✅ Database schema applied
- [ ] ✅ Environment variables configured
- [ ] ✅ Authentication working (email)
- [ ] ✅ User profiles being created
- [ ] ✅ No console errors
- [ ] ✅ Optional: Google OAuth working

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **"Supabase not configured" error**
   - Check environment variables in Vercel
   - Verify Supabase URL and key are correct

2. **Database connection issues**
   - Verify database schema was applied
   - Check Supabase project is active

3. **Authentication not working**
   - Check Supabase authentication settings
   - Verify redirect URLs are configured

4. **Build failures**
   - Check Vercel build logs
   - Verify all dependencies are in package.json

### **Debug Steps:**
1. **Check Vercel logs**: Project → Functions → View logs
2. **Check Supabase logs**: Dashboard → Logs
3. **Browser console**: Look for JavaScript errors
4. **Network tab**: Check for failed API calls

## 📞 **Support**

If you encounter issues:
1. Check the deployment logs in Vercel
2. Verify all environment variables are set
3. Test database connection in Supabase
4. Review browser console for errors

## 🚀 **Your App is Live!**

Once everything is working, you'll have:
- ✅ **Professional GitHub repository**
- ✅ **Automatic deployments** on every push
- ✅ **Live Propply AI MVP**
- ✅ **User authentication**
- ✅ **Database with user profiles**
- ✅ **Scalable hosting**

**Your Propply AI MVP is now live and ready for users!** 🎉
