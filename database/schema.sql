-- Propply AI Database Schema
-- Run this in your Supabase SQL editor to set up the database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    company TEXT,
    phone TEXT,
    
    -- Subscription information
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'single_location_one_time', 'single_location_monthly', 'multiple_locations_ongoing', 'enterprise_yearly')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'incomplete')),
    subscription_id TEXT, -- Stripe subscription ID
    customer_id TEXT, -- Stripe customer ID
    
    -- Billing periods
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    
    -- Report usage tracking
    reports_used INTEGER DEFAULT 0,
    reports_limit INTEGER DEFAULT 0, -- -1 for unlimited
    
    -- Metadata
    properties_count INTEGER DEFAULT 0,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Property details
    address TEXT NOT NULL,
    city TEXT NOT NULL CHECK (city IN ('NYC', 'Philadelphia')),
    state TEXT DEFAULT 'NY',
    zip_code TEXT,
    
    -- Property identifiers
    bin_number TEXT, -- NYC Building Identification Number
    opa_account TEXT, -- Philadelphia OPA Account Number
    
    -- Property metadata
    property_type TEXT,
    units INTEGER,
    year_built INTEGER,
    square_footage INTEGER,
    
    -- Contact information
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    management_company TEXT,
    owner_name TEXT,
    owner_email TEXT,
    
    -- Compliance systems
    compliance_systems JSONB DEFAULT '[]',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compliance reports table
CREATE TABLE IF NOT EXISTS compliance_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    
    -- Report details
    report_type TEXT NOT NULL CHECK (report_type IN ('full_compliance', 'single_system', 'violation_check')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    
    -- AI analysis data
    ai_analysis JSONB,
    compliance_score INTEGER CHECK (compliance_score >= 0 AND compliance_score <= 100),
    risk_level TEXT CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    
    -- Violations and recommendations
    violations JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    cost_estimates JSONB DEFAULT '{}',
    
    -- Report metadata
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    download_count INTEGER DEFAULT 0,
    
    -- Payment information
    payment_id TEXT, -- Stripe payment intent ID
    amount_paid DECIMAL(10,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table for tracking all transactions
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Payment details
    stripe_payment_id TEXT UNIQUE,
    stripe_session_id TEXT,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled')),
    
    -- Payment type
    payment_type TEXT CHECK (payment_type IN ('one_time', 'subscription')),
    subscription_tier TEXT,
    
    -- Related records
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    report_id UUID REFERENCES compliance_reports(id) ON DELETE SET NULL,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendor marketplace table
CREATE TABLE IF NOT EXISTS vendors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Vendor details
    name TEXT NOT NULL,
    company TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    
    -- Service information
    services JSONB DEFAULT '[]', -- Array of service types
    cities JSONB DEFAULT '[]', -- Cities they serve
    specializations JSONB DEFAULT '[]',
    
    -- Ratings and verification
    rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
    review_count INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    license_numbers JSONB DEFAULT '{}',
    
    -- Availability
    active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendor quotes table
CREATE TABLE IF NOT EXISTS vendor_quotes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    report_id UUID REFERENCES compliance_reports(id) ON DELETE SET NULL,
    
    -- Quote details
    service_type TEXT NOT NULL,
    description TEXT,
    estimated_cost DECIMAL(10,2),
    timeline TEXT,
    
    -- Quote status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    
    -- Communication
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_tier ON user_profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_user_profiles_customer_id ON user_profiles(customer_id);
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_user_id ON compliance_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_property_id ON compliance_reports(property_id);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_status ON compliance_reports(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_id ON payments(stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_vendors_active ON vendors(active);
CREATE INDEX IF NOT EXISTS idx_vendor_quotes_user_id ON vendor_quotes(user_id);

-- Row Level Security (RLS) policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_quotes ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Properties policies
CREATE POLICY "Users can view own properties" ON properties
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own properties" ON properties
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own properties" ON properties
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own properties" ON properties
    FOR DELETE USING (auth.uid() = user_id);

-- Compliance reports policies
CREATE POLICY "Users can view own reports" ON compliance_reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports" ON compliance_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports" ON compliance_reports
    FOR UPDATE USING (auth.uid() = user_id);

-- Payments policies
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments" ON payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Vendor quotes policies
CREATE POLICY "Users can view own quotes" ON vendor_quotes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quotes" ON vendor_quotes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quotes" ON vendor_quotes
    FOR UPDATE USING (auth.uid() = user_id);

-- Vendors table is publicly readable (no user_id)
CREATE POLICY "Anyone can view active vendors" ON vendors
    FOR SELECT USING (active = true);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_reports_updated_at BEFORE UPDATE ON compliance_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_quotes_updated_at BEFORE UPDATE ON vendor_quotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update property count when properties are added/removed
CREATE OR REPLACE FUNCTION update_property_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE user_profiles 
        SET properties_count = properties_count + 1
        WHERE id = NEW.user_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE user_profiles 
        SET properties_count = properties_count - 1
        WHERE id = OLD.user_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create triggers for property count
CREATE TRIGGER update_property_count_insert AFTER INSERT ON properties
    FOR EACH ROW EXECUTE FUNCTION update_property_count();

CREATE TRIGGER update_property_count_delete AFTER DELETE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_property_count();

-- Insert some sample vendors
INSERT INTO vendors (name, company, email, phone, services, cities, specializations, rating, review_count, verified, active) VALUES
('John Smith', 'NYC Compliance Solutions', 'john@nycompliance.com', '(212) 555-0101', '["boiler_inspection", "elevator_inspection", "fire_safety"]', '["NYC"]', '["DOB_violations", "emergency_repairs"]', 4.8, 127, true, true),
('Maria Rodriguez', 'Philly Property Services', 'maria@phillyprop.com', '(215) 555-0202', '["electrical_inspection", "plumbing", "hvac"]', '["Philadelphia"]', '["L&I_violations", "code_compliance"]', 4.6, 89, true, true),
('David Chen', 'Metro Building Inspectors', 'david@metrobuilding.com', '(646) 555-0303', '["comprehensive_inspection", "violation_resolution"]', '["NYC", "Philadelphia"]', '["multi_family", "commercial"]', 4.9, 203, true, true),
('Sarah Johnson', 'East Coast Contractors', 'sarah@eastcoastcontractors.com', '(267) 555-0404', '["general_contracting", "renovation", "compliance_upgrades"]', '["Philadelphia", "NYC"]', '["affordable_housing", "historic_buildings"]', 4.7, 156, true, true);

-- Create a function to check if user can generate reports based on their subscription
CREATE OR REPLACE FUNCTION can_generate_report(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    user_profile RECORD;
    result JSONB;
BEGIN
    SELECT * INTO user_profile FROM user_profiles WHERE id = user_uuid;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('can_generate', false, 'reason', 'User not found');
    END IF;
    
    -- Free tier cannot generate reports
    IF user_profile.subscription_tier = 'free' THEN
        RETURN jsonb_build_object('can_generate', false, 'reason', 'Upgrade required');
    END IF;
    
    -- Unlimited tiers
    IF user_profile.reports_limit = -1 THEN
        RETURN jsonb_build_object('can_generate', true, 'remaining', -1);
    END IF;
    
    -- Limited tiers
    IF user_profile.reports_used < user_profile.reports_limit THEN
        RETURN jsonb_build_object(
            'can_generate', true, 
            'remaining', user_profile.reports_limit - user_profile.reports_used,
            'used', user_profile.reports_used,
            'limit', user_profile.reports_limit
        );
    ELSE
        RETURN jsonb_build_object('can_generate', false, 'reason', 'Monthly limit reached');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
