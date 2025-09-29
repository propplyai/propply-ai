-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create properties table
CREATE TABLE properties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    address TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Residential', 'Commercial', 'Mixed Use')),
    units INTEGER NOT NULL,
    year_built INTEGER,
    square_footage INTEGER,
    contact TEXT,
    management_company TEXT,
    owner_name TEXT,
    owner_email TEXT,
    compliance_score INTEGER DEFAULT 0 CHECK (compliance_score >= 0 AND compliance_score <= 100),
    violations INTEGER DEFAULT 0,
    next_inspection DATE,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Under Review')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create compliance_reports table
CREATE TABLE compliance_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sections JSONB NOT NULL,
    recommendations TEXT[],
    estimated_costs JSONB,
    created_by TEXT,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Archived', 'Draft'))
);

-- Create ai_analyses table
CREATE TABLE ai_analyses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    insights TEXT[],
    predictions TEXT[],
    priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    trends JSONB,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    model_version TEXT DEFAULT 'v1.0'
);

-- Create vendors table
CREATE TABLE vendors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
    certifications TEXT[],
    services TEXT[],
    phone TEXT,
    email TEXT,
    website TEXT,
    address TEXT,
    compliance_match INTEGER CHECK (compliance_match >= 0 AND compliance_match <= 100),
    response_time TEXT,
    pricing_range TEXT,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create property_vendor_relationships table
CREATE TABLE property_vendor_relationships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL,
    contract_start DATE,
    contract_end DATE,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inspections table
CREATE TABLE inspections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    inspection_type TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    completed_date DATE,
    inspector_name TEXT,
    status TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'In Progress', 'Completed', 'Failed', 'Cancelled')),
    results JSONB,
    violations_found INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create violations table
CREATE TABLE violations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    inspection_id UUID REFERENCES inspections(id) ON DELETE SET NULL,
    violation_code TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Dismissed')),
    issued_date DATE NOT NULL,
    due_date DATE,
    resolved_date DATE,
    fine_amount DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('inspection_due', 'violation_issued', 'compliance_alert', 'vendor_update')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    read BOOLEAN DEFAULT false,
    action_required BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_properties_address ON properties(address);
CREATE INDEX idx_properties_type ON properties(type);
CREATE INDEX idx_properties_compliance_score ON properties(compliance_score);
CREATE INDEX idx_compliance_reports_property_id ON compliance_reports(property_id);
CREATE INDEX idx_ai_analyses_property_id ON ai_analyses(property_id);
CREATE INDEX idx_inspections_property_id ON inspections(property_id);
CREATE INDEX idx_inspections_scheduled_date ON inspections(scheduled_date);
CREATE INDEX idx_violations_property_id ON violations(property_id);
CREATE INDEX idx_violations_status ON violations(status);
CREATE INDEX idx_notifications_property_id ON notifications(property_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON inspections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_violations_updated_at BEFORE UPDATE ON violations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create compliance_systems table for locale-aware punch lists
CREATE TABLE compliance_systems (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    system_key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    frequency TEXT NOT NULL CHECK (frequency IN ('Monthly', 'Quarterly', 'Biannual', 'Annual')),
    required_by TEXT NOT NULL,
    estimated_cost_min DECIMAL(10,2),
    estimated_cost_max DECIMAL(10,2),
    applicable_locales TEXT[] NOT NULL DEFAULT ARRAY['NYC', 'Philadelphia'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create property_compliance_systems table for tracking applicable items per property
CREATE TABLE property_compliance_systems (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    compliance_system_key TEXT REFERENCES compliance_systems(system_key),
    selected BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(property_id, compliance_system_key)
);

-- Create subscriptions table
CREATE TABLE subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    subscription_type TEXT NOT NULL CHECK (subscription_type IN ('single_report', 'enterprise_monthly', 'enterprise_yearly')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    price DECIMAL(10,2) NOT NULL,
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchased_reports table
CREATE TABLE purchased_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    report_type TEXT NOT NULL,
    purchase_type TEXT NOT NULL CHECK (purchase_type IN ('single_report', 'subscription')),
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    price DECIMAL(10,2) NOT NULL,
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    update_entitlement_until TIMESTAMP WITH TIME ZONE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    report_data JSONB NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled'))
);

-- Create rfps table for vendor requests
CREATE TABLE rfps (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    compliance_systems TEXT[] NOT NULL,
    budget_range TEXT,
    timeline TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'responses_received', 'awarded', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rfp_vendors table for tracking which vendors received the RFP
CREATE TABLE rfp_vendors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    rfp_id UUID REFERENCES rfps(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    sent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    response_date TIMESTAMP WITH TIME ZONE,
    response_data JSONB,
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'responded', 'declined', 'awarded'))
);

-- Create property_todos table for quick To-Do generation
CREATE TABLE property_todos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    due_date DATE,
    assigned_to TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for new tables
CREATE INDEX idx_compliance_systems_locales ON compliance_systems USING GIN(applicable_locales);
CREATE INDEX idx_property_compliance_systems_property_id ON property_compliance_systems(property_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_purchased_reports_property_id ON purchased_reports(property_id);
CREATE INDEX idx_purchased_reports_user_id ON purchased_reports(user_id);
CREATE INDEX idx_rfps_property_id ON rfps(property_id);
CREATE INDEX idx_rfps_user_id ON rfps(user_id);
CREATE INDEX idx_property_todos_property_id ON property_todos(property_id);
CREATE INDEX idx_property_todos_status ON property_todos(status);

-- Create triggers for updated_at on new tables
CREATE TRIGGER update_compliance_systems_updated_at BEFORE UPDATE ON compliance_systems FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_property_compliance_systems_updated_at BEFORE UPDATE ON property_compliance_systems FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rfps_updated_at BEFORE UPDATE ON rfps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_property_todos_updated_at BEFORE UPDATE ON property_todos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert compliance systems data for NYC and Philadelphia
INSERT INTO compliance_systems (system_key, name, description, category, frequency, required_by, estimated_cost_min, estimated_cost_max, applicable_locales) VALUES
-- NYC Specific Systems
('nyc_hpd_registration', 'HPD Registration', 'Annual registration with NYC Housing Preservation and Development', 'Registration', 'Annual', 'NYC HPD', 150.00, 300.00, ARRAY['NYC']),
('nyc_dob_permit', 'DOB Permits', 'Building permits and inspections from NYC Department of Buildings', 'Permits', 'Annual', 'NYC DOB', 200.00, 500.00, ARRAY['NYC']),
('nyc_fdny_inspection', 'FDNY Fire Safety Inspection', 'Annual fire safety inspection by NYC Fire Department', 'Fire Safety', 'Annual', 'NYC FDNY', 300.00, 600.00, ARRAY['NYC']),
('nyc_elevator_inspection', 'Elevator Safety Inspection', 'Annual elevator inspection by licensed inspector', 'Elevator Safety', 'Annual', 'NYC DOB', 400.00, 800.00, ARRAY['NYC']),
('nyc_boiler_inspection', 'Boiler Inspection', 'Annual boiler inspection and certification', 'HVAC', 'Annual', 'NYC DOB', 250.00, 500.00, ARRAY['NYC']),
('nyc_lead_paint', 'Lead Paint Assessment', 'Lead paint inspection and abatement if required', 'Environmental', 'Biannual', 'NYC DOH', 500.00, 1200.00, ARRAY['NYC']),
('nyc_asbestos', 'Asbestos Assessment', 'Asbestos inspection and management plan', 'Environmental', 'Annual', 'NYC DOH', 800.00, 1500.00, ARRAY['NYC']),
('nyc_water_tank', 'Water Tank Inspection', 'Annual water tank cleaning and inspection', 'Water Systems', 'Annual', 'NYC DOH', 300.00, 600.00, ARRAY['NYC']),

-- Philadelphia Specific Systems
('philly_licenses_inspections', 'L&I Licenses & Inspections', 'Annual licensing and inspection with Philadelphia L&I', 'Licensing', 'Annual', 'Philadelphia L&I', 200.00, 400.00, ARRAY['Philadelphia']),
('philly_fire_inspection', 'Fire Department Inspection', 'Annual fire safety inspection by Philadelphia Fire Department', 'Fire Safety', 'Annual', 'Philadelphia Fire', 250.00, 500.00, ARRAY['Philadelphia']),
('philly_elevator_inspection', 'Elevator Inspection', 'Annual elevator inspection by licensed inspector', 'Elevator Safety', 'Annual', 'Philadelphia L&I', 350.00, 700.00, ARRAY['Philadelphia']),
('philly_boiler_inspection', 'Boiler Inspection', 'Annual boiler inspection and certification', 'HVAC', 'Annual', 'Philadelphia L&I', 200.00, 450.00, ARRAY['Philadelphia']),
('philly_lead_certification', 'Lead Certification', 'Lead paint certification and abatement if required', 'Environmental', 'Biannual', 'Philadelphia DOH', 400.00, 1000.00, ARRAY['Philadelphia']),
('philly_asbestos_management', 'Asbestos Management', 'Asbestos inspection and management plan', 'Environmental', 'Annual', 'Philadelphia DOH', 600.00, 1200.00, ARRAY['Philadelphia']),
('philly_water_systems', 'Water System Inspection', 'Annual water system inspection and testing', 'Water Systems', 'Annual', 'Philadelphia Water', 250.00, 500.00, ARRAY['Philadelphia']),

-- Common Systems (Both NYC and Philadelphia)
('general_pest_control', 'Pest Control', 'Regular pest control and extermination services', 'Maintenance', 'Quarterly', 'Local Health Dept', 100.00, 250.00, ARRAY['NYC', 'Philadelphia']),
('general_cleaning_services', 'Cleaning Services', 'Regular cleaning and maintenance services', 'Maintenance', 'Monthly', 'Property Management', 200.00, 500.00, ARRAY['NYC', 'Philadelphia']),
('general_security_systems', 'Security System Maintenance', 'Security system inspection and maintenance', 'Security', 'Quarterly', 'Security Company', 150.00, 300.00, ARRAY['NYC', 'Philadelphia']),
('general_insurance_renewal', 'Insurance Renewal', 'Annual property insurance renewal and review', 'Insurance', 'Annual', 'Insurance Provider', 1000.00, 3000.00, ARRAY['NYC', 'Philadelphia']);

-- Insert sample data
INSERT INTO properties (address, type, units, year_built, square_footage, compliance_score, violations, next_inspection) VALUES
('123 Broadway, New York, NY 10001', 'Residential', 24, 1985, 12000, 85, 2, '2025-08-15'),
('456 5th Avenue, New York, NY 10018', 'Commercial', 12, 1995, 8500, 92, 0, '2025-09-01'),
('789 Park Avenue, New York, NY 10021', 'Mixed Use', 36, 1978, 18000, 78, 3, '2025-07-30'),
('100 Market Street, Philadelphia, PA 19106', 'Commercial', 8, 1990, 6000, 88, 1, '2025-08-20'),
('200 Chestnut Street, Philadelphia, PA 19106', 'Residential', 16, 1988, 8000, 82, 2, '2025-09-05');

INSERT INTO vendors (name, rating, certifications, services, phone, email, compliance_match, response_time, pricing_range, verified) VALUES
('NYC Elite Elevators', 4.8, ARRAY['DOB Licensed', 'FDNY Certified', 'OSHA Compliant'], ARRAY['Elevator Maintenance', 'Safety Inspections', 'Emergency Repairs'], '(212) 555-0123', 'contact@nyceliteelevators.com', 95, '< 2 hours', '$150-300/hour', true),
('Metro Fire Safety Solutions', 4.6, ARRAY['FDNY Licensed', 'Safety Certified', 'EPA Approved'], ARRAY['Fire Safety', 'Sprinkler Systems', 'Alarm Installation'], '(212) 555-0456', 'info@metrofiresafety.com', 88, '< 4 hours', '$200-400/hour', true),
('Borough Boiler Experts', 4.7, ARRAY['DOB Licensed', 'EPA Certified', 'Gas Safe Registered'], ARRAY['Boiler Maintenance', 'HVAC Systems', 'Energy Audits'], '(212) 555-0789', 'service@boroughboiler.com', 92, '< 3 hours', '$175-350/hour', true),
('Philly Pro Elevators', 4.5, ARRAY['L&I Licensed', 'OSHA Compliant'], ARRAY['Elevator Maintenance', 'Safety Inspections'], '(215) 555-0123', 'contact@phillyproelevators.com', 90, '< 3 hours', '$140-280/hour', true),
('Philadelphia Fire Safety', 4.4, ARRAY['Fire Department Licensed', 'Safety Certified'], ARRAY['Fire Safety', 'Sprinkler Systems'], '(215) 555-0456', 'info@phillyfiresafety.com', 85, '< 4 hours', '$180-350/hour', true);
