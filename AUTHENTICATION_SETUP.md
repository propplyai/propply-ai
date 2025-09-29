# Propply AI Authentication Setup Guide

This guide will help you set up email and Google OAuth authentication for your Propply AI MVP.

## Prerequisites

1. **Supabase Project**: You need a Supabase project with authentication enabled
2. **Google OAuth Credentials**: For Google sign-in functionality
3. **Environment Variables**: Proper configuration in your React app

## Step 1: Supabase Configuration

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and anon key

### 1.2 Configure Authentication Settings
In your Supabase dashboard:

1. **Go to Authentication > Settings**
2. **Site URL**: Set to your app URL (e.g., `http://localhost:3000` for development)
3. **Redirect URLs**: Add your app URLs:
   - `http://localhost:3000` (development)
   - `https://yourdomain.com` (production)
   - `https://your-ngrok-url.ngrok-free.app` (if using ngrok)

### 1.3 Enable Email Authentication
1. **Go to Authentication > Settings**
2. **Enable email confirmations**: Set to `false` for development (optional)
3. **Enable email signup**: Set to `true`
4. **Password requirements**: Configure as needed

### 1.4 Enable Google OAuth
1. **Go to Authentication > Providers**
2. **Enable Google provider**
3. **Add Google OAuth credentials** (see Step 2)

## Step 2: Google OAuth Setup

### 2.1 Create Google OAuth Application
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client IDs**

### 2.2 Configure OAuth Client
1. **Application type**: Web application
2. **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - `https://yourdomain.com`
   - `https://your-ngrok-url.ngrok-free.app`
3. **Authorized redirect URIs**:
   - `https://your-supabase-project.supabase.co/auth/v1/callback`
   - `https://your-supabase-project.supabase.co/auth/v1/callback?redirect_to=http://localhost:3000`

### 2.3 Add Credentials to Supabase
1. Copy your Google OAuth **Client ID** and **Client Secret**
2. In Supabase dashboard, go to **Authentication > Providers**
3. **Enable Google** and enter your credentials

## Step 3: Environment Variables

Create a `.env` file in your project root:

```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# Optional: For development with ngrok
NGROK_URL=https://your-ngrok-url.ngrok-free.app

# Optional: Email configuration
SENDGRID_API_KEY=your_sendgrid_api_key
```

## Step 4: Database Setup

### 4.1 Run Database Schema
Execute the SQL from `database/schema.sql` in your Supabase SQL editor:

```sql
-- This creates the user_profiles table and related tables
-- with proper RLS policies and triggers
```

### 4.2 Verify Tables Created
Check that these tables exist:
- `user_profiles`
- `properties`
- `compliance_reports`
- `payments`
- `vendors`
- `vendor_quotes`

## Step 5: Test Authentication

### 5.1 Start Development Server
```bash
npm start
```

### 5.2 Test Email Authentication
1. Go to your app
2. Click "Sign Up"
3. Enter email and password
4. Check if user profile is created in Supabase

### 5.3 Test Google OAuth
1. Click "Continue with Google"
2. Complete Google OAuth flow
3. Verify user is created and redirected back

## Step 6: Troubleshooting

### Common Issues

#### 1. "Provider not found" Error
- **Cause**: Google OAuth not properly configured in Supabase
- **Solution**: Check Google provider settings in Supabase dashboard

#### 2. Redirect URI Mismatch
- **Cause**: OAuth redirect URI doesn't match configured URLs
- **Solution**: Update Google OAuth settings with correct redirect URIs

#### 3. CORS Issues
- **Cause**: Supabase URL not properly configured
- **Solution**: Check `REACT_APP_SUPABASE_URL` in environment variables

#### 4. User Profile Not Created
- **Cause**: Database schema not applied or RLS policies blocking
- **Solution**: Run database schema and check RLS policies

### Debug Steps

1. **Check Browser Console**: Look for authentication errors
2. **Check Supabase Logs**: Go to Supabase dashboard > Logs
3. **Verify Environment Variables**: Ensure all required variables are set
4. **Test Database Connection**: Try creating a user profile manually

## Step 7: Production Deployment

### 7.1 Update Supabase Settings
1. **Site URL**: Set to your production domain
2. **Redirect URLs**: Add production URLs
3. **Email Templates**: Customize if needed

### 7.2 Update Google OAuth
1. Add production domain to authorized origins
2. Update redirect URIs for production

### 7.3 Environment Variables
Set production environment variables in your hosting platform.

## Security Considerations

1. **Row Level Security**: All tables have RLS enabled
2. **User Isolation**: Users can only access their own data
3. **API Keys**: Never expose service role keys in frontend
4. **HTTPS**: Always use HTTPS in production

## Support

If you encounter issues:
1. Check Supabase documentation
2. Review Google OAuth documentation
3. Check browser console for errors
4. Verify all environment variables are set correctly
