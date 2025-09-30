-- Migration: Auto-create user profile on signup
-- This trigger automatically creates a user_profiles entry when a new user signs up
-- Ensures every authenticated user has a unique profile

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert new profile for the user
    INSERT INTO public.user_profiles (
        id,
        email,
        full_name,
        company,
        phone,
        subscription_tier,
        subscription_status,
        reports_used,
        reports_limit,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'company', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        'free',
        'active',
        0,
        0,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING; -- Avoid errors if profile already exists
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that fires when a new user is created
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.user_profiles TO postgres, anon, authenticated, service_role;
