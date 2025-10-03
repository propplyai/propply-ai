# 🚀 Propply AI Deployment Guide

This guide will help you deploy your Propply AI MVP to Vercel and set up authentication.

## 📋 Prerequisites

1. **GitHub Account** (for code repository)
2. **Vercel Account** (free at vercel.com)
3. **Supabase Account** (free at supabase.com)
4. **Google Cloud Account** (for OAuth - optional)

## 🎯 Step 1: Deploy to Vercel

### 1.1 Push to GitHub
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit: Propply AI MVP with authentication"

# Create GitHub repository and push
git remote add origin https://github.com/yourusername/propply-ai.git
git push -u origin main
```

### 1.2 Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect React and configure build settings
5. Click "Deploy"

## 🗄️ Step 2: Set up Supabase Database

### 2.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization and enter project details
4. Wait for project to be ready (2-3 minutes)

### 2.2 Set up Database Schema
1. Go to **SQL Editor** in Supabase dashboard
2. Copy and paste the contents of `database/schema.sql`
3. Click "Run" to execute the schema

### 2.3 Configure Authentication
1. Go to **Authentication > Settings**
2. **Site URL**: Set to your Vercel domain (e.g., `https://propply-ai.vercel.app`)
3. **Redirect URLs**: Add your Vercel domain
4. **Enable email signup**: Set to `true`
5. **Enable email confirmations**: Set to `false` for development

## 🔐 Step 3: Configure Environment Variables

### 3.1 Get Supabase Credentials
1. Go to **Settings > API** in Supabase dashboard
2. Copy:
   - **Project URL** (e.g., `https://your-project-ref.supabase.co`)
   - **Anon Key** (public key)

### 3.2 Add to Vercel
1. Go to your Vercel project dashboard
2. Click **Settings > Environment Variables**
3. Add:
   - `REACT_APP_SUPABASE_URL` = your Supabase project URL
   - `REACT_APP_SUPABASE_ANON_KEY` = your Supabase anon key
4. Click "Save"
5. **Redeploy** your project

## 🔑 Step 4: Set up Google OAuth (Optional)

### 4.1 Create Google OAuth App
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials > Create Credentials > OAuth 2.0 Client IDs**
5. **Application type**: Web application
6. **Authorized JavaScript origins**:
   - `https://your-vercel-domain.vercel.app`
   - `http://localhost:3000` (for development)
7. **Authorized redirect URIs**:
   - `https://your-project-ref.supabase.co/auth/v1/callback`

### 4.2 Configure in Supabase
1. Go to **Authentication > Providers** in Supabase
2. **Enable Google provider**
3. Add your Google OAuth credentials:
   - **Client ID**: from Google Cloud Console
   - **Client Secret**: from Google Cloud Console

## ✅ Step 5: Test Your Deployment

### 5.1 Test Basic Functionality
1. Visit your Vercel domain
2. Check if the landing page loads
3. Test navigation and UI

### 5.2 Test Authentication
1. **Email Signup**: Try creating an account
2. **Email Signin**: Test login functionality
3. **Google OAuth**: Test Google sign-in (if configured)
4. **User Profile**: Check if user data is saved

### 5.3 Debug Issues
1. **Check Vercel logs**: Go to Functions tab in Vercel dashboard
2. **Check Supabase logs**: Go to Logs in Supabase dashboard
3. **Browser console**: Check for JavaScript errors
4. **Network tab**: Check for failed API calls

## 🔧 Troubleshooting

### Common Issues

#### 1. "Supabase not configured" Error
- **Cause**: Environment variables not set
- **Solution**: Add Supabase credentials to Vercel environment variables

#### 2. "Provider not found" Error
- **Cause**: Google OAuth not configured in Supabase
- **Solution**: Set up Google OAuth in Supabase dashboard

#### 3. Database Connection Issues
- **Cause**: Database schema not applied
- **Solution**: Run the SQL schema in Supabase SQL editor

#### 4. CORS Issues
- **Cause**: Supabase URL not configured correctly
- **Solution**: Check environment variables in Vercel

### Debug Steps
1. **Check environment variables** in Vercel dashboard
2. **Verify Supabase project** is active
3. **Test database connection** in Supabase dashboard
4. **Check browser console** for errors
5. **Review Vercel build logs** for deployment issues

## 🚀 Production Checklist

- [ ] App deployed to Vercel
- [ ] Supabase project created and configured
- [ ] Database schema applied
- [ ] Environment variables set in Vercel
- [ ] Authentication working (email + Google)
- [ ] User profiles being created
- [ ] No console errors
- [ ] All features working on live site

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Supabase logs
3. Review browser console errors
4. Verify all environment variables are set
5. Test database connection in Supabase dashboard

## 🎉 Success!

Once everything is working, you'll have:
- ✅ Live Propply AI MVP
- ✅ User authentication (email + Google)
- ✅ Database with user profiles
- ✅ Secure, scalable hosting
- ✅ Ready for users to sign up!

Your Propply AI MVP is now live and ready for users! 🚀
