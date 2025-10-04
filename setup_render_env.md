# Render Environment Variables Setup

## Required Environment Variables for Render Deployment

Add these environment variables to your Render service:

### Database Configuration
```
SUPABASE_URL=https://vlnnvxlgzhtaorpixsay.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsbm52eGxnemh0YW9ycGl4c2F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMTE1NjgsImV4cCI6MjA3NDc4NzU2OH0.yGC82Qop5M_CSA48nXpwC15HxrqqW7CugFIb-17nxG0
SUPABASE_SERVICE_ROLE_KEY=<GET_FROM_SUPABASE_DASHBOARD>
```

### NYC Data API
```
NYC_APP_TOKEN=5tcwowe7jan06ecsjr4rum67ks1xm3elcw4jnuce87h77w6inh
```

### Google Maps (Optional)
```
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyA4gSJ9LDVqQ9AVxw3zVoHSQQVr_9W2V54
```

### Frontend Configuration
```
REACT_APP_API_URL=https://your-render-app.onrender.com
REACT_APP_SUPABASE_URL=https://vlnnvxlgzhtaorpixsay.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsbm52eGxnemh0YW9ycGl4c2F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMTE1NjgsImV4cCI6MjA3NDc4NzU2OH0.yGC82Qop5M_CSA48nXpwC15HxrqqW7CugFIb-17nxG0
```

## How to Get Service Role Key

1. Go to your Supabase dashboard
2. Navigate to Settings > API
3. Copy the "service_role" key (not the anon key)
4. Replace `<GET_FROM_SUPABASE_DASHBOARD>` with the actual service role key

## Important Notes

- The service role key bypasses Row Level Security (RLS)
- Keep the service role key secure - never commit it to version control
- The service role key should only be used by the backend server
- Frontend should continue using the anon key
