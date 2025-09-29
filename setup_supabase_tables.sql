-- Propply AI - Supabase Database Setup Script
-- Run this script in your Supabase SQL Editor to create all required tables

-- Enable Row Level Security by default
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
CREATE TABLE IF NOT EXISTS compliance_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
CREATE TABLE IF NOT EXISTS ai_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
CREATE TABLE IF NOT EXISTS vendors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- Create inspections table
CREATE TABLE IF NOT EXISTS inspections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    inspection_type TEXT NOT NULL,
    compliance_system TEXT NOT NULL, -- Maps to compliance system (fire_alarms, elevators, etc.)
    frequency TEXT NOT NULL CHECK (frequency IN ('Annual', 'Quarterly', 'Biannual', 'Monthly')),
    category TEXT NOT NULL, -- Fire Safety, Building Systems, Water Systems, etc.
    required_by TEXT NOT NULL, -- FDNY, DOB, DOH, DEP, etc.
    estimated_cost_min INTEGER, -- Minimum estimated cost in cents
    estimated_cost_max INTEGER, -- Maximum estimated cost in cents
    actual_cost INTEGER, -- Actual cost in cents
    scheduled_date DATE NOT NULL,
    completed_date DATE,
    last_completed_date DATE, -- Previous completion date for tracking
    next_due_date DATE, -- Calculated next due date
    inspector_name TEXT,
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'In Progress', 'Completed', 'Failed', 'Cancelled', 'Due Soon', 'Overdue')),
    urgency_level TEXT DEFAULT 'Normal' CHECK (urgency_level IN ('Low', 'Normal', 'High', 'Critical')),
    results JSONB,
    violations_found INTEGER DEFAULT 0,
    certificate_issued BOOLEAN DEFAULT false,
    certificate_expiry DATE,
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create violations table
CREATE TABLE IF NOT EXISTS violations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- Create compliance_systems table (inspection templates)
CREATE TABLE IF NOT EXISTS compliance_systems (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    system_key TEXT UNIQUE NOT NULL, -- fire_alarms, elevators, boilers, etc.
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    frequency TEXT NOT NULL,
    required_by TEXT NOT NULL,
    estimated_cost_min INTEGER NOT NULL,
    estimated_cost_max INTEGER NOT NULL,
    description TEXT,
    requirements TEXT[],
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create property_compliance_systems table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS property_compliance_systems (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    compliance_system_key TEXT NOT NULL,
    selected BOOLEAN DEFAULT true,
    custom_frequency TEXT,
    custom_cost_estimate INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(property_id, compliance_system_key)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
CREATE INDEX IF NOT EXISTS idx_properties_address ON properties(address);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_compliance_score ON properties(compliance_score);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_property_id ON compliance_reports(property_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_property_id ON ai_analyses(property_id);
CREATE INDEX IF NOT EXISTS idx_inspections_property_id ON inspections(property_id);
CREATE INDEX IF NOT EXISTS idx_inspections_scheduled_date ON inspections(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_violations_property_id ON violations(property_id);
CREATE INDEX IF NOT EXISTS idx_violations_status ON violations(status);
CREATE INDEX IF NOT EXISTS idx_notifications_property_id ON notifications(property_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_compliance_systems_system_key ON compliance_systems(system_key);
CREATE INDEX IF NOT EXISTS idx_property_compliance_systems_property_id ON property_compliance_systems(property_id);
CREATE INDEX IF NOT EXISTS idx_inspections_compliance_system ON inspections(compliance_system);
CREATE INDEX IF NOT EXISTS idx_inspections_next_due_date ON inspections(next_due_date);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inspections_updated_at ON inspections;
CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON inspections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_violations_updated_at ON violations;
CREATE TRIGGER update_violations_updated_at BEFORE UPDATE ON violations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (you can modify these later for security)
CREATE POLICY "Enable read access for all users" ON properties FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON properties FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON properties FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON properties FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON compliance_reports FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON compliance_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON compliance_reports FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON compliance_reports FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON ai_analyses FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON ai_analyses FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON ai_analyses FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON ai_analyses FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON vendors FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON vendors FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON vendors FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON vendors FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON inspections FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON inspections FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON inspections FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON inspections FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON violations FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON violations FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON violations FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON violations FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON notifications FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON notifications FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON notifications FOR DELETE USING (true);

-- Insert sample data
INSERT INTO properties (address, type, units, year_built, square_footage, compliance_score, violations, next_inspection) VALUES
('123 Broadway, New York, NY 10001', 'Residential', 24, 1985, 12000, 85, 2, '2025-08-15'),
('456 5th Avenue, New York, NY 10018', 'Commercial', 12, 1995, 8500, 92, 0, '2025-09-01'),
('789 Park Avenue, New York, NY 10021', 'Mixed Use', 36, 1978, 18000, 78, 3, '2025-07-30')
ON CONFLICT (id) DO NOTHING;

INSERT INTO vendors (name, rating, certifications, services, phone, email, compliance_match, response_time, pricing_range, verified) VALUES
('NYC Elite Elevators', 4.8, ARRAY['DOB Licensed', 'FDNY Certified', 'OSHA Compliant'], ARRAY['Elevator Maintenance', 'Safety Inspections', 'Emergency Repairs'], '(212) 555-0123', 'contact@nyceliteelevators.com', 95, '< 2 hours', '$150-300/hour', true),
('Metro Fire Safety Solutions', 4.6, ARRAY['FDNY Licensed', 'Safety Certified', 'EPA Approved'], ARRAY['Fire Safety', 'Sprinkler Systems', 'Alarm Installation'], '(212) 555-0456', 'info@metrofiresafety.com', 88, '< 4 hours', '$200-400/hour', true),
('Borough Boiler Experts', 4.7, ARRAY['DOB Licensed', 'EPA Certified', 'Gas Safe Registered'], ARRAY['Boiler Maintenance', 'HVAC Systems', 'Energy Audits'], '(212) 555-0789', 'service@boroughboiler.com', 92, '< 3 hours', '$175-350/hour', true)
ON CONFLICT (id) DO NOTHING;

-- Insert compliance systems templates
INSERT INTO compliance_systems (system_key, name, category, frequency, required_by, estimated_cost_min, estimated_cost_max, description, requirements) VALUES
('fire_alarms', 'Fire Alarm System Inspection', 'Fire Safety', 'Annual', 'FDNY', 30000, 50000, 'Annual inspection of fire alarm systems including smoke detectors, pull stations, and control panels', ARRAY['Visual inspection of all devices', 'Functional testing', 'Battery backup testing', 'Documentation review']),
('elevators', 'Elevator Safety Inspection', 'Building Systems', 'Annual', 'DOB', 40000, 60000, 'Comprehensive elevator safety inspection including mechanical systems and safety devices', ARRAY['Mechanical inspection', 'Safety device testing', 'Load testing', 'Certificate issuance']),
('boilers', 'Boiler Inspection', 'Building Systems', 'Annual', 'DOB', 25000, 40000, 'Annual boiler inspection for safety and efficiency compliance', ARRAY['Pressure testing', 'Safety valve inspection', 'Efficiency testing', 'Emissions compliance']),
('cooling_towers', 'Cooling Tower Inspection', 'Water Systems', 'Quarterly', 'DOH', 20000, 35000, 'Quarterly inspection for Legionella prevention and water quality', ARRAY['Water sampling', 'Legionella testing', 'System cleaning verification', 'Maintenance records review']),
('backflow_prevention', 'Backflow Prevention Testing', 'Water Systems', 'Annual', 'DEP', 15000, 25000, 'Annual testing of backflow prevention devices to protect water supply', ARRAY['Device testing', 'Pressure testing', 'Valve inspection', 'Certification']),
('sprinkler_systems', 'Sprinkler System Inspection', 'Fire Safety', 'Annual', 'FDNY', 35000, 55000, 'Annual inspection of fire sprinkler systems and water supply', ARRAY['System pressure testing', 'Sprinkler head inspection', 'Pump testing', 'Water flow testing']),
('emergency_lighting', 'Emergency Lighting Testing', 'Fire Safety', 'Monthly', 'FDNY', 10000, 20000, 'Monthly testing of emergency lighting and exit signs', ARRAY['Battery testing', 'Illumination testing', 'Duration testing', 'Maintenance records'])
ON CONFLICT (system_key) DO UPDATE SET
name = EXCLUDED.name,
category = EXCLUDED.category,
frequency = EXCLUDED.frequency,
required_by = EXCLUDED.required_by,
estimated_cost_min = EXCLUDED.estimated_cost_min,
estimated_cost_max = EXCLUDED.estimated_cost_max,
description = EXCLUDED.description,
requirements = EXCLUDED.requirements;
