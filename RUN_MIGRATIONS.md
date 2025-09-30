# Database Migration Instructions

## Important: You MUST run these migrations in Supabase!

Your app is failing because the `user_profiles` table doesn't exist in your Supabase database.

## Steps to Fix:

### 1. Open Supabase SQL Editor

Go to: https://app.supabase.com/project/vlnnvxlgzhtaorpixsay/sql

### 2. Run Migrations in Order

Run each SQL file in this exact order:

#### Step 1: Create user_profiles table
```sql
-- Copy and paste contents of: supabase/migrations/000_create_user_profiles.sql
```

#### Step 2: Create auto-profile trigger
```sql
-- Copy and paste contents of: supabase/migrations/004_auto_create_user_profile.sql
```

### 3. Verify Tables Exist

Run this query to verify:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'user_profiles';
```

You should see `user_profiles` in the results.

### 4. Test the Trigger

The trigger should automatically create a profile when a user signs up. Test it:

```sql
-- Check if trigger exists
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

### 5. Fix OAuth Configuration

After tables are set up, fix the OAuth redirect issue:

1. Go to: https://app.supabase.com/project/vlnnvxlgzhtaorpixsay/settings/auth
2. Set **Site URL** to: `https://agent4nyc.onrender.com`
3. Add **Redirect URLs**:
   - `https://agent4nyc.onrender.com`
   - `https://agent4nyc.onrender.com/**`
   - `http://localhost:3000` (for local dev)
4. Click **Save**

## Alternative: Use Supabase CLI

If you have Supabase CLI installed:

```bash
# Link to your project
supabase link --project-ref vlnnvxlgzhtaorpixsay

# Run migrations
supabase db push
```

## Troubleshooting

### Error: "relation 'user_profiles' does not exist"
- Make sure you ran migration 000_create_user_profiles.sql first

### Error: "function handle_new_user() does not exist"
- Make sure you ran migration 004_auto_create_user_profile.sql after 000

### OAuth still failing after migrations
- Double-check Site URL and Redirect URLs in Supabase Auth settings
- Clear browser cache and try again

## After Migration

Once migrations are complete, your app should:
1. ✅ Allow users to sign up with Google OAuth
2. ✅ Automatically create user profiles
3. ✅ Track subscription tiers and usage
4. ✅ Support Stripe payment integration

## Need Help?

If you're still having issues after running migrations, check:
- Supabase logs: https://app.supabase.com/project/vlnnvxlgzhtaorpixsay/logs/explorer
- Application logs in Render dashboard
- Browser console for JavaScript errors