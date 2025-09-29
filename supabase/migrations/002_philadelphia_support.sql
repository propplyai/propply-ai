-- Migration: Add Philadelphia Support
-- This migration adds tables and data to support Philadelphia properties and compliance

-- Create Philadelphia-specific data tables
CREATE TABLE IF NOT EXISTS philly_permits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    permit_number TEXT NOT NULL,
    permit_type TEXT,
    permit_issued_date DATE,
    work_type TEXT,
    contractor TEXT,
    address TEXT,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(property_id, permit_number)
);

CREATE TABLE IF NOT EXISTS philly_violations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    violation_number TEXT NOT NULL,
    violation_date DATE,
    violation_type TEXT,
    status TEXT,
    description TEXT,
    address TEXT,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(property_id, violation_number)
);

CREATE TABLE IF NOT EXISTS philly_inspections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    inspection_date DATE,
    inspection_type TEXT,
    result TEXT,
    inspector TEXT,
    address TEXT,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(property_id, inspection_date, inspection_type)
);

CREATE TABLE IF NOT EXISTS philly_housing_violations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    violation_number TEXT NOT NULL,
    violation_date DATE,
    violation_type TEXT,
    status TEXT,
    description TEXT,
    address TEXT,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(property_id, violation_number)
);

-- Add Philadelphia-specific fields to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS opa_account TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS market_value DECIMAL(12,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS assessed_value DECIMAL(12,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS land_area INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS building_area INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS year_built INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS zoning TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS use_code TEXT;

-- Create indexes for Philadelphia tables
CREATE INDEX IF NOT EXISTS idx_philly_permits_property_id ON philly_permits(property_id);
CREATE INDEX IF NOT EXISTS idx_philly_permits_permit_date ON philly_permits(permit_issued_date);
CREATE INDEX IF NOT EXISTS idx_philly_permits_permit_type ON philly_permits(permit_type);

CREATE INDEX IF NOT EXISTS idx_philly_violations_property_id ON philly_violations(property_id);
CREATE INDEX IF NOT EXISTS idx_philly_violations_status ON philly_violations(status);
CREATE INDEX IF NOT EXISTS idx_philly_violations_date ON philly_violations(violation_date);

CREATE INDEX IF NOT EXISTS idx_philly_inspections_property_id ON philly_inspections(property_id);
CREATE INDEX IF NOT EXISTS idx_philly_inspections_date ON philly_inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_philly_inspections_type ON philly_inspections(inspection_type);

CREATE INDEX IF NOT EXISTS idx_philly_housing_violations_property_id ON philly_housing_violations(property_id);
CREATE INDEX IF NOT EXISTS idx_philly_housing_violations_status ON philly_housing_violations(status);
CREATE INDEX IF NOT EXISTS idx_philly_housing_violations_date ON philly_housing_violations(violation_date);

-- Create triggers for updated_at on new tables
CREATE TRIGGER update_philly_permits_updated_at BEFORE UPDATE ON philly_permits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_philly_violations_updated_at BEFORE UPDATE ON philly_violations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_philly_inspections_updated_at BEFORE UPDATE ON philly_inspections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_philly_housing_violations_updated_at BEFORE UPDATE ON philly_housing_violations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert Philadelphia-specific compliance systems
INSERT INTO compliance_systems (system_key, name, description, category, frequency, required_by, estimated_cost_min, estimated_cost_max, applicable_locales) VALUES
-- Philadelphia Specific Systems
('philly_li_registration', 'L&I Business License', 'Annual business license with Philadelphia Department of Licenses and Inspections', 'Registration', 'Annual', 'Philadelphia L&I', 100.00, 250.00, ARRAY['Philadelphia']),
('philly_li_permit', 'L&I Building Permits', 'Building permits and inspections from Philadelphia L&I', 'Permits', 'As Needed', 'Philadelphia L&I', 150.00, 500.00, ARRAY['Philadelphia']),
('philly_fire_inspection', 'Fire Department Inspection', 'Fire safety inspection by Philadelphia Fire Department', 'Fire Safety', 'Annual', 'Philadelphia Fire Department', 200.00, 400.00, ARRAY['Philadelphia']),
('philly_elevator_inspection', 'Elevator Safety Inspection', 'Annual elevator inspection by licensed inspector', 'Elevator Safety', 'Annual', 'Philadelphia L&I', 300.00, 600.00, ARRAY['Philadelphia']),
('philly_housing_inspection', 'Housing Code Inspection', 'Annual housing code compliance inspection', 'Housing', 'Annual', 'Philadelphia L&I', 150.00, 300.00, ARRAY['Philadelphia']),
('philly_water_sewer', 'Water & Sewer Compliance', 'Water and sewer system compliance and inspections', 'Utilities', 'Annual', 'Philadelphia Water Department', 200.00, 400.00, ARRAY['Philadelphia']),
('philly_zoning_compliance', 'Zoning Compliance', 'Zoning compliance verification and permits', 'Zoning', 'As Needed', 'Philadelphia Planning Commission', 100.00, 300.00, ARRAY['Philadelphia']),
('philly_environmental', 'Environmental Compliance', 'Environmental regulations and hazardous materials compliance', 'Environmental', 'Annual', 'Philadelphia Health Department', 250.00, 500.00, ARRAY['Philadelphia']),
('philly_accessibility', 'ADA Compliance', 'Americans with Disabilities Act compliance inspection', 'Accessibility', 'Annual', 'Philadelphia L&I', 200.00, 400.00, ARRAY['Philadelphia']),
('philly_energy_efficiency', 'Energy Efficiency Standards', 'Energy efficiency compliance and inspections', 'Energy', 'Annual', 'Philadelphia Energy Office', 300.00, 600.00, ARRAY['Philadelphia']),
('philly_lead_paint', 'Lead Paint Compliance', 'Lead paint inspection and abatement compliance', 'Health & Safety', 'As Needed', 'Philadelphia Health Department', 400.00, 800.00, ARRAY['Philadelphia']),
('philly_asbestos', 'Asbestos Compliance', 'Asbestos inspection and abatement compliance', 'Health & Safety', 'As Needed', 'Philadelphia Health Department', 500.00, 1000.00, ARRAY['Philadelphia']),
('philly_radon', 'Radon Testing', 'Radon testing and mitigation compliance', 'Health & Safety', 'Biannual', 'Philadelphia Health Department', 150.00, 300.00, ARRAY['Philadelphia']),
('philly_pest_control', 'Pest Control Compliance', 'Integrated pest management and compliance', 'Health & Safety', 'Quarterly', 'Philadelphia Health Department', 100.00, 200.00, ARRAY['Philadelphia']),
('philly_waste_management', 'Waste Management Compliance', 'Waste disposal and recycling compliance', 'Environmental', 'Annual', 'Philadelphia Streets Department', 200.00, 400.00, ARRAY['Philadelphia']),
('philly_stormwater', 'Stormwater Management', 'Stormwater management and runoff compliance', 'Environmental', 'Annual', 'Philadelphia Water Department', 300.00, 600.00, ARRAY['Philadelphia']),
('philly_historic_preservation', 'Historic Preservation', 'Historic preservation compliance for designated properties', 'Historic', 'As Needed', 'Philadelphia Historical Commission', 400.00, 800.00, ARRAY['Philadelphia']),
('philly_construction_safety', 'Construction Safety', 'Construction site safety and OSHA compliance', 'Safety', 'Ongoing', 'Philadelphia L&I', 200.00, 500.00, ARRAY['Philadelphia']),
('philly_noise_compliance', 'Noise Compliance', 'Noise ordinance compliance and permits', 'Environmental', 'As Needed', 'Philadelphia L&I', 100.00, 250.00, ARRAY['Philadelphia']),
('philly_signage_permit', 'Signage Permits', 'Signage permits and compliance', 'Permits', 'As Needed', 'Philadelphia L&I', 150.00, 300.00, ARRAY['Philadelphia']);

-- Insert Philadelphia vendors
INSERT INTO vendors (name, description, services, contact_email, contact_phone, website, certifications, service_areas, rating, is_verified) VALUES
('Philadelphia Building Solutions', 'Full-service building compliance and inspection company serving Philadelphia', ARRAY['Building Permits', 'L&I Compliance', 'Fire Safety', 'Elevator Inspection'], 'info@phillybuildingsolutions.com', '(215) 555-0101', 'https://phillybuildingsolutions.com', ARRAY['L&I Licensed', 'Fire Safety Certified'], ARRAY['Philadelphia'], 4.8, true),
('Liberty Fire Safety', 'Specialized fire safety inspections and compliance for Philadelphia properties', ARRAY['Fire Safety', 'Fire Suppression', 'Emergency Systems'], 'contact@libertyfiresafety.com', '(215) 555-0102', 'https://libertyfiresafety.com', ARRAY['Fire Safety Certified', 'FDNY Licensed'], ARRAY['Philadelphia'], 4.9, true),
('Philly Elevator Services', 'Elevator inspection and maintenance services for Philadelphia buildings', ARRAY['Elevator Inspection', 'Elevator Maintenance', 'Safety Testing'], 'service@phillyelevator.com', '(215) 555-0103', 'https://phillyelevator.com', ARRAY['Elevator Inspector Licensed', 'ASME Certified'], ARRAY['Philadelphia'], 4.7, true),
('Philadelphia Environmental Solutions', 'Environmental compliance and hazardous materials management', ARRAY['Environmental Compliance', 'Lead Paint', 'Asbestos', 'Radon Testing'], 'info@phillyenv.com', '(215) 555-0104', 'https://phillyenv.com', ARRAY['EPA Certified', 'Lead Inspector'], ARRAY['Philadelphia'], 4.6, true),
('Historic Philadelphia Preservation', 'Specialized historic preservation and compliance services', ARRAY['Historic Preservation', 'Zoning Compliance', 'Historic Tax Credits'], 'preserve@historicphilly.com', '(215) 555-0105', 'https://historicphilly.com', ARRAY['Historic Preservation Certified'], ARRAY['Philadelphia'], 4.8, true),
('Philadelphia Energy Solutions', 'Energy efficiency compliance and green building certifications', ARRAY['Energy Efficiency', 'Green Building', 'LEED Certification'], 'energy@phillyenergy.com', '(215) 555-0106', 'https://phillyenergy.com', ARRAY['LEED AP', 'Energy Auditor'], ARRAY['Philadelphia'], 4.5, true),
('Philly Water & Sewer', 'Water and sewer system compliance and maintenance', ARRAY['Water Compliance', 'Sewer Systems', 'Stormwater Management'], 'water@phillywater.com', '(215) 555-0107', 'https://phillywater.com', ARRAY['Water Systems Licensed'], ARRAY['Philadelphia'], 4.4, true),
('Philadelphia Accessibility Solutions', 'ADA compliance and accessibility consulting', ARRAY['ADA Compliance', 'Accessibility Consulting', 'Universal Design'], 'access@phillyaccess.com', '(215) 555-0108', 'https://phillyaccess.com', ARRAY['ADA Specialist', 'Universal Design Certified'], ARRAY['Philadelphia'], 4.7, true);

-- Update existing compliance systems to include both cities where applicable
UPDATE compliance_systems SET applicable_locales = ARRAY['NYC', 'Philadelphia'] 
WHERE system_key IN (
    'elevator_inspection',
    'fire_safety_inspection', 
    'environmental_compliance',
    'accessibility_compliance',
    'energy_efficiency',
    'lead_paint_compliance',
    'asbestos_compliance',
    'pest_control',
    'waste_management'
);

-- Create RLS policies for Philadelphia tables
ALTER TABLE philly_permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE philly_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE philly_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE philly_housing_violations ENABLE ROW LEVEL SECURITY;

-- RLS policies for philly_permits
CREATE POLICY "Users can view philly_permits for their properties" ON philly_permits
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert philly_permits for their properties" ON philly_permits
    FOR INSERT WITH CHECK (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update philly_permits for their properties" ON philly_permits
    FOR UPDATE USING (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

-- RLS policies for philly_violations
CREATE POLICY "Users can view philly_violations for their properties" ON philly_violations
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert philly_violations for their properties" ON philly_violations
    FOR INSERT WITH CHECK (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update philly_violations for their properties" ON philly_violations
    FOR UPDATE USING (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

-- RLS policies for philly_inspections
CREATE POLICY "Users can view philly_inspections for their properties" ON philly_inspections
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert philly_inspections for their properties" ON philly_inspections
    FOR INSERT WITH CHECK (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update philly_inspections for their properties" ON philly_inspections
    FOR UPDATE USING (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

-- RLS policies for philly_housing_violations
CREATE POLICY "Users can view philly_housing_violations for their properties" ON philly_housing_violations
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert philly_housing_violations for their properties" ON philly_housing_violations
    FOR INSERT WITH CHECK (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update philly_housing_violations for their properties" ON philly_housing_violations
    FOR UPDATE USING (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

-- Add comments for documentation
COMMENT ON TABLE philly_permits IS 'Philadelphia L&I building permits data';
COMMENT ON TABLE philly_violations IS 'Philadelphia L&I building violations data';
COMMENT ON TABLE philly_inspections IS 'Philadelphia fire department and other inspection data';
COMMENT ON TABLE philly_housing_violations IS 'Philadelphia housing code violations data';

COMMENT ON COLUMN properties.opa_account IS 'Philadelphia Office of Property Assessment account number';
COMMENT ON COLUMN properties.market_value IS 'Property market value from Philadelphia assessments';
COMMENT ON COLUMN properties.assessed_value IS 'Property assessed value for tax purposes';
COMMENT ON COLUMN properties.zoning IS 'Philadelphia zoning classification';
COMMENT ON COLUMN properties.use_code IS 'Property use code from Philadelphia assessments';

