-- Migration: Enhanced Philadelphia Data Support
-- Based on comprehensive research of Philadelphia Open Data APIs
-- Adds support for L&I Building & Zoning Permits, Code Violations, Building Certifications, etc.

-- Create enhanced Philadelphia permits table with specific L&I fields
CREATE TABLE IF NOT EXISTS philly_li_permits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    permit_number TEXT NOT NULL,
    permit_type TEXT, -- e.g., 'Residential Building Permit', 'Commercial Building Permit', 'Mechanical', 'Electrical', 'Plumbing'
    permit_issued_date DATE,
    application_date DATE,
    permit_description TEXT,
    work_type TEXT,
    contractor TEXT,
    contractor_license TEXT,
    status TEXT, -- e.g., 'Issued', 'Pending', 'Expired'
    address TEXT,
    bin TEXT, -- Building Identification Number
    opa_account TEXT, -- Office of Property Assessment account
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(property_id, permit_number)
);

-- Create enhanced Philadelphia violations table with specific L&I fields
CREATE TABLE IF NOT EXISTS philly_li_violations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    violation_id TEXT NOT NULL,
    violation_date DATE,
    violation_type TEXT, -- e.g., 'Building Code', 'Fire Code', 'Housing Code'
    violation_code TEXT, -- Specific code section violated
    violation_description TEXT,
    status TEXT, -- e.g., 'open', 'corrected', 'complied', 'vacated'
    compliance_date DATE,
    inspector TEXT,
    address TEXT,
    bin TEXT,
    opa_account TEXT,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(property_id, violation_id)
);

-- Create Philadelphia building certifications table
CREATE TABLE IF NOT EXISTS philly_building_certifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    certification_number TEXT NOT NULL, -- e.g., 'BC-2023-XXXXX'
    certification_type TEXT NOT NULL, -- e.g., 'Sprinkler Certification', 'Fire Alarm Certification', 'Facade Certification'
    last_inspection_date DATE,
    inspection_result TEXT, -- e.g., 'Certified', 'Deficient'
    expiration_date DATE,
    inspector_company TEXT,
    inspector_address TEXT,
    address TEXT,
    bin TEXT,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(property_id, certification_number)
);

-- Create Philadelphia building certification summary table
CREATE TABLE IF NOT EXISTS philly_building_certification_summary (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    structure_id TEXT, -- BIN
    address TEXT,
    -- Fire Safety Systems
    sprinkler_status TEXT, -- 'Active', 'Expired', or blank if not applicable
    sprinkler_casefile TEXT,
    fire_alarm_status TEXT,
    fire_alarm_casefile TEXT,
    standpipe_status TEXT,
    standpipe_casefile TEXT,
    smoke_control_status TEXT,
    smoke_control_casefile TEXT,
    -- Structural Systems
    facade_status TEXT,
    facade_casefile TEXT,
    fire_escape_status TEXT,
    fire_escape_casefile TEXT,
    private_bridge_status TEXT,
    private_bridge_casefile TEXT,
    pier_status TEXT,
    pier_casefile TEXT,
    -- Mechanical Systems
    emer_stdby_pwr_sys_status TEXT, -- Emergency/Standby Power System
    emer_stdby_pwr_sys_casefile TEXT,
    damper_status TEXT,
    damper_casefile TEXT,
    -- Special Systems
    special_hazards_status TEXT,
    special_hazards_casefile TEXT,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(property_id, structure_id)
);

-- Create Philadelphia case investigations table
CREATE TABLE IF NOT EXISTS philly_case_investigations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    case_id TEXT NOT NULL,
    investigation_completed_date DATE,
    investigation_type TEXT, -- e.g., 'Property Maintenance Inspection', 'Fire Code Inspection'
    outcome TEXT, -- e.g., 'No Violation', 'Violation Issued', 'Case Closed'
    violation_issued BOOLEAN DEFAULT FALSE,
    violation_id TEXT, -- Reference to violation if one was issued
    inspector TEXT,
    address TEXT,
    bin TEXT,
    opa_account TEXT,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(property_id, case_id)
);

-- Create Philadelphia unsafe buildings table
CREATE TABLE IF NOT EXISTS philly_unsafe_buildings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    unsafe_building_id TEXT NOT NULL,
    designation_date DATE,
    unsafe_reason TEXT,
    status TEXT, -- e.g., 'Active', 'Resolved', 'Demolished'
    address TEXT,
    bin TEXT,
    opa_account TEXT,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(property_id, unsafe_building_id)
);

-- Create Philadelphia imminently dangerous buildings table
CREATE TABLE IF NOT EXISTS philly_imminently_dangerous_buildings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    dangerous_building_id TEXT NOT NULL,
    designation_date DATE,
    danger_reason TEXT,
    status TEXT, -- e.g., 'Active', 'Resolved', 'Demolished'
    address TEXT,
    bin TEXT,
    opa_account TEXT,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(property_id, dangerous_building_id)
);

-- Add enhanced Philadelphia-specific fields to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS bin TEXT; -- Building Identification Number
ALTER TABLE properties ADD COLUMN IF NOT EXISTS opa_account TEXT; -- Office of Property Assessment account
ALTER TABLE properties ADD COLUMN IF NOT EXISTS market_value DECIMAL(12,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS assessed_value DECIMAL(12,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS land_area INTEGER; -- Square feet
ALTER TABLE properties ADD COLUMN IF NOT EXISTS building_area INTEGER; -- Square feet
ALTER TABLE properties ADD COLUMN IF NOT EXISTS year_built INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS zoning TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS use_code TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_class TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_livable_area INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_rooms INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS bedrooms INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS bathrooms INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS basement TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS central_air TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS fireplaces INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS garage_spaces INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS parking_type TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS exterior_condition TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS interior_condition TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS quality_grade TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS story_height TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS exterior_finish TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS roof_material TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS roof_style TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS basement_finish TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS heating TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS fuel TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS sewer TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS water TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS last_sale_date DATE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS last_sale_price DECIMAL(12,2);

-- Create comprehensive indexes for performance
CREATE INDEX IF NOT EXISTS idx_philly_li_permits_property_id ON philly_li_permits(property_id);
CREATE INDEX IF NOT EXISTS idx_philly_li_permits_permit_date ON philly_li_permits(permit_issued_date);
CREATE INDEX IF NOT EXISTS idx_philly_li_permits_permit_type ON philly_li_permits(permit_type);
CREATE INDEX IF NOT EXISTS idx_philly_li_permits_status ON philly_li_permits(status);
CREATE INDEX IF NOT EXISTS idx_philly_li_permits_bin ON philly_li_permits(bin);
CREATE INDEX IF NOT EXISTS idx_philly_li_permits_opa_account ON philly_li_permits(opa_account);

CREATE INDEX IF NOT EXISTS idx_philly_li_violations_property_id ON philly_li_violations(property_id);
CREATE INDEX IF NOT EXISTS idx_philly_li_violations_status ON philly_li_violations(status);
CREATE INDEX IF NOT EXISTS idx_philly_li_violations_date ON philly_li_violations(violation_date);
CREATE INDEX IF NOT EXISTS idx_philly_li_violations_type ON philly_li_violations(violation_type);
CREATE INDEX IF NOT EXISTS idx_philly_li_violations_bin ON philly_li_violations(bin);
CREATE INDEX IF NOT EXISTS idx_philly_li_violations_opa_account ON philly_li_violations(opa_account);

CREATE INDEX IF NOT EXISTS idx_philly_building_certifications_property_id ON philly_building_certifications(property_id);
CREATE INDEX IF NOT EXISTS idx_philly_building_certifications_type ON philly_building_certifications(certification_type);
CREATE INDEX IF NOT EXISTS idx_philly_building_certifications_expiration ON philly_building_certifications(expiration_date);
CREATE INDEX IF NOT EXISTS idx_philly_building_certifications_result ON philly_building_certifications(inspection_result);
CREATE INDEX IF NOT EXISTS idx_philly_building_certifications_bin ON philly_building_certifications(bin);

CREATE INDEX IF NOT EXISTS idx_philly_cert_summary_property_id ON philly_building_certification_summary(property_id);
CREATE INDEX IF NOT EXISTS idx_philly_cert_summary_structure_id ON philly_building_certification_summary(structure_id);
CREATE INDEX IF NOT EXISTS idx_philly_cert_summary_sprinkler_status ON philly_building_certification_summary(sprinkler_status);
CREATE INDEX IF NOT EXISTS idx_philly_cert_summary_fire_alarm_status ON philly_building_certification_summary(fire_alarm_status);
CREATE INDEX IF NOT EXISTS idx_philly_cert_summary_facade_status ON philly_building_certification_summary(facade_status);

CREATE INDEX IF NOT EXISTS idx_philly_case_investigations_property_id ON philly_case_investigations(property_id);
CREATE INDEX IF NOT EXISTS idx_philly_case_investigations_date ON philly_case_investigations(investigation_completed_date);
CREATE INDEX IF NOT EXISTS idx_philly_case_investigations_type ON philly_case_investigations(investigation_type);
CREATE INDEX IF NOT EXISTS idx_philly_case_investigations_outcome ON philly_case_investigations(outcome);
CREATE INDEX IF NOT EXISTS idx_philly_case_investigations_bin ON philly_case_investigations(bin);
CREATE INDEX IF NOT EXISTS idx_philly_case_investigations_opa_account ON philly_case_investigations(opa_account);

CREATE INDEX IF NOT EXISTS idx_philly_unsafe_buildings_property_id ON philly_unsafe_buildings(property_id);
CREATE INDEX IF NOT EXISTS idx_philly_unsafe_buildings_status ON philly_unsafe_buildings(status);
CREATE INDEX IF NOT EXISTS idx_philly_unsafe_buildings_date ON philly_unsafe_buildings(designation_date);
CREATE INDEX IF NOT EXISTS idx_philly_unsafe_buildings_bin ON philly_unsafe_buildings(bin);

CREATE INDEX IF NOT EXISTS idx_philly_dangerous_buildings_property_id ON philly_imminently_dangerous_buildings(property_id);
CREATE INDEX IF NOT EXISTS idx_philly_dangerous_buildings_status ON philly_imminently_dangerous_buildings(status);
CREATE INDEX IF NOT EXISTS idx_philly_dangerous_buildings_date ON philly_imminently_dangerous_buildings(designation_date);
CREATE INDEX IF NOT EXISTS idx_philly_dangerous_buildings_bin ON philly_imminently_dangerous_buildings(bin);

-- Create indexes for enhanced property fields
CREATE INDEX IF NOT EXISTS idx_properties_bin ON properties(bin);
CREATE INDEX IF NOT EXISTS idx_properties_opa_account ON properties(opa_account);
CREATE INDEX IF NOT EXISTS idx_properties_zoning ON properties(zoning);
CREATE INDEX IF NOT EXISTS idx_properties_use_code ON properties(use_code);
CREATE INDEX IF NOT EXISTS idx_properties_year_built ON properties(year_built);
CREATE INDEX IF NOT EXISTS idx_properties_market_value ON properties(market_value);

-- Create triggers for updated_at on new tables
CREATE TRIGGER update_philly_li_permits_updated_at BEFORE UPDATE ON philly_li_permits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_philly_li_violations_updated_at BEFORE UPDATE ON philly_li_violations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_philly_building_certifications_updated_at BEFORE UPDATE ON philly_building_certifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_philly_building_certification_summary_updated_at BEFORE UPDATE ON philly_building_certification_summary FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_philly_case_investigations_updated_at BEFORE UPDATE ON philly_case_investigations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_philly_unsafe_buildings_updated_at BEFORE UPDATE ON philly_unsafe_buildings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_philly_imminently_dangerous_buildings_updated_at BEFORE UPDATE ON philly_imminently_dangerous_buildings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all new tables
ALTER TABLE philly_li_permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE philly_li_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE philly_building_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE philly_building_certification_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE philly_case_investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE philly_unsafe_buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE philly_imminently_dangerous_buildings ENABLE ROW LEVEL SECURITY;

-- RLS policies for philly_li_permits
CREATE POLICY "Users can view philly_li_permits for their properties" ON philly_li_permits
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert philly_li_permits for their properties" ON philly_li_permits
    FOR INSERT WITH CHECK (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update philly_li_permits for their properties" ON philly_li_permits
    FOR UPDATE USING (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

-- RLS policies for philly_li_violations
CREATE POLICY "Users can view philly_li_violations for their properties" ON philly_li_violations
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert philly_li_violations for their properties" ON philly_li_violations
    FOR INSERT WITH CHECK (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update philly_li_violations for their properties" ON philly_li_violations
    FOR UPDATE USING (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

-- RLS policies for philly_building_certifications
CREATE POLICY "Users can view philly_building_certifications for their properties" ON philly_building_certifications
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert philly_building_certifications for their properties" ON philly_building_certifications
    FOR INSERT WITH CHECK (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update philly_building_certifications for their properties" ON philly_building_certifications
    FOR UPDATE USING (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

-- RLS policies for philly_building_certification_summary
CREATE POLICY "Users can view philly_building_certification_summary for their properties" ON philly_building_certification_summary
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert philly_building_certification_summary for their properties" ON philly_building_certification_summary
    FOR INSERT WITH CHECK (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update philly_building_certification_summary for their properties" ON philly_building_certification_summary
    FOR UPDATE USING (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

-- RLS policies for philly_case_investigations
CREATE POLICY "Users can view philly_case_investigations for their properties" ON philly_case_investigations
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert philly_case_investigations for their properties" ON philly_case_investigations
    FOR INSERT WITH CHECK (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update philly_case_investigations for their properties" ON philly_case_investigations
    FOR UPDATE USING (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

-- RLS policies for philly_unsafe_buildings
CREATE POLICY "Users can view philly_unsafe_buildings for their properties" ON philly_unsafe_buildings
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert philly_unsafe_buildings for their properties" ON philly_unsafe_buildings
    FOR INSERT WITH CHECK (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update philly_unsafe_buildings for their properties" ON philly_unsafe_buildings
    FOR UPDATE USING (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

-- RLS policies for philly_imminently_dangerous_buildings
CREATE POLICY "Users can view philly_imminently_dangerous_buildings for their properties" ON philly_imminently_dangerous_buildings
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert philly_imminently_dangerous_buildings for their properties" ON philly_imminently_dangerous_buildings
    FOR INSERT WITH CHECK (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update philly_imminently_dangerous_buildings for their properties" ON philly_imminently_dangerous_buildings
    FOR UPDATE USING (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

-- Add comments for documentation
COMMENT ON TABLE philly_li_permits IS 'Philadelphia L&I Building & Zoning Permits (2007–Present) - Comprehensive permit records for construction and related activities';
COMMENT ON TABLE philly_li_violations IS 'Philadelphia L&I Code Violations - All code enforcement violations for building safety and property maintenance';
COMMENT ON TABLE philly_building_certifications IS 'Philadelphia L&I Building Certifications - Periodic safety inspections for building systems and structures';
COMMENT ON TABLE philly_building_certification_summary IS 'Philadelphia L&I Building Certification Summary - Property-level compliance status for all required certifications';
COMMENT ON TABLE philly_case_investigations IS 'Philadelphia L&I Case Investigations - Inspection history and investigation records';
COMMENT ON TABLE philly_unsafe_buildings IS 'Philadelphia Unsafe Buildings - Structures deemed unsafe by L&I';
COMMENT ON TABLE philly_imminently_dangerous_buildings IS 'Philadelphia Imminently Dangerous Buildings - Structures in imminent danger of collapse';

-- Add column comments for key fields
COMMENT ON COLUMN philly_li_permits.permit_type IS 'Type of permit: Residential Building Permit, Commercial Building Permit, Zoning Permit, Mechanical, Electrical, Plumbing, etc.';
COMMENT ON COLUMN philly_li_permits.bin IS 'Building Identification Number - unique identifier for the building';
COMMENT ON COLUMN philly_li_permits.opa_account IS 'Office of Property Assessment account number';

COMMENT ON COLUMN philly_li_violations.violation_code IS 'Specific code section violated (e.g., specific code section for elevator, boiler, fire safety)';
COMMENT ON COLUMN philly_li_violations.status IS 'Violation status: open, corrected, complied, vacated';

COMMENT ON COLUMN philly_building_certifications.certification_type IS 'Type of certification: Sprinkler Certification, Fire Alarm Certification, Facade Certification, Emergency & Standby Power, Special Hazards, etc.';
COMMENT ON COLUMN philly_building_certifications.inspection_result IS 'Inspection result: Certified (passed) or Deficient (issues found)';

COMMENT ON COLUMN philly_building_certification_summary.sprinkler_status IS 'Fire sprinkler system status: Active (current certification), Expired (past due), or blank (not applicable)';
COMMENT ON COLUMN philly_building_certification_summary.fire_alarm_status IS 'Fire alarm system status: Active (current certification), Expired (past due), or blank (not applicable)';
COMMENT ON COLUMN philly_building_certification_summary.facade_status IS 'Facade inspection status: Active (current certification), Expired (past due), or blank (not applicable)';

COMMENT ON COLUMN philly_case_investigations.investigation_type IS 'Type of investigation: Property Maintenance Inspection, Fire Code Inspection, etc.';
COMMENT ON COLUMN philly_case_investigations.outcome IS 'Investigation outcome: No Violation, Violation Issued, Case Closed, etc.';

COMMENT ON COLUMN properties.bin IS 'Building Identification Number - unique identifier for the building in Philadelphia';
COMMENT ON COLUMN properties.opa_account IS 'Office of Property Assessment account number for tax and assessment purposes';
COMMENT ON COLUMN properties.zoning IS 'Philadelphia zoning classification';
COMMENT ON COLUMN properties.use_code IS 'Property use code from Philadelphia assessments';

-- ============================================================================
-- ENHANCED COMPLIANCE FEATURES
-- Risk Assessment, Cost Tracking, and Advanced Analytics
-- ============================================================================

-- Add risk assessment fields to violations table
ALTER TABLE philly_li_violations ADD COLUMN IF NOT EXISTS risk_category TEXT;
ALTER TABLE philly_li_violations ADD COLUMN IF NOT EXISTS risk_weight INTEGER;
ALTER TABLE philly_li_violations ADD COLUMN IF NOT EXISTS estimated_cost_min INTEGER;
ALTER TABLE philly_li_violations ADD COLUMN IF NOT EXISTS estimated_cost_max INTEGER;
ALTER TABLE philly_li_violations ADD COLUMN IF NOT EXISTS regulatory_impact TEXT;

-- Add enhanced fields to permits table
ALTER TABLE philly_li_permits ADD COLUMN IF NOT EXISTS follow_up_required BOOLEAN DEFAULT FALSE;
ALTER TABLE philly_li_permits ADD COLUMN IF NOT EXISTS follow_up_date DATE;
ALTER TABLE philly_li_permits ADD COLUMN IF NOT EXISTS compliance_impact_score INTEGER;

-- Create compliance risk assessments table
CREATE TABLE IF NOT EXISTS compliance_risk_assessments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    overall_risk_score INTEGER NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    fire_safety_risk INTEGER DEFAULT 0,
    structural_risk INTEGER DEFAULT 0,
    mechanical_risk INTEGER DEFAULT 0,
    electrical_risk INTEGER DEFAULT 0,
    certification_risk INTEGER DEFAULT 0,
    compliance_trajectory TEXT CHECK (compliance_trajectory IN ('IMPROVING', 'STABLE', 'DECLINING')),
    next_review_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create compliance action plans table
CREATE TABLE IF NOT EXISTS compliance_action_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('VIOLATION_RESOLUTION', 'CERTIFICATION_RENEWAL', 'PREVENTIVE_INSPECTION')),
    priority TEXT NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    title TEXT NOT NULL,
    description TEXT,
    estimated_cost_min INTEGER,
    estimated_cost_max INTEGER,
    deadline DATE,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    regulatory_impact TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create compliance cost tracking table
CREATE TABLE IF NOT EXISTS compliance_cost_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    cost_category TEXT NOT NULL,
    estimated_cost_min INTEGER,
    estimated_cost_max INTEGER,
    actual_cost INTEGER,
    cost_date DATE,
    description TEXT,
    roi_impact DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create compliance analytics table for historical tracking
CREATE TABLE IF NOT EXISTS compliance_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    analysis_date DATE NOT NULL,
    compliance_score INTEGER NOT NULL,
    total_violations INTEGER DEFAULT 0,
    open_violations INTEGER DEFAULT 0,
    critical_violations INTEGER DEFAULT 0,
    recent_permits INTEGER DEFAULT 0,
    expired_certifications INTEGER DEFAULT 0,
    maintenance_pattern TEXT CHECK (maintenance_pattern IN ('PROACTIVE', 'REACTIVE', 'DEFERRED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(property_id, analysis_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_compliance_risk_assessments_property_date 
    ON compliance_risk_assessments(property_id, assessment_date DESC);

CREATE INDEX IF NOT EXISTS idx_compliance_action_plans_property_priority 
    ON compliance_action_plans(property_id, priority, status);

CREATE INDEX IF NOT EXISTS idx_compliance_analytics_property_date 
    ON compliance_analytics(property_id, analysis_date DESC);

CREATE INDEX IF NOT EXISTS idx_philly_li_violations_risk_category
    ON philly_li_violations(property_id, risk_category, status);

-- Create views for common queries
CREATE OR REPLACE VIEW property_compliance_dashboard AS
SELECT 
    p.id,
    p.address,
    p.compliance_score,
    cra.risk_level,
    cra.overall_risk_score,
    cra.fire_safety_risk,
    cra.structural_risk,
    cra.mechanical_risk,
    ca.total_violations,
    ca.open_violations,
    ca.critical_violations,
    COUNT(cap.id) FILTER (WHERE cap.status = 'PENDING' AND cap.priority = 'CRITICAL') as critical_actions_pending,
    COUNT(cap.id) FILTER (WHERE cap.status = 'PENDING') as total_actions_pending
FROM properties p
LEFT JOIN compliance_risk_assessments cra ON p.id = cra.property_id 
    AND cra.assessment_date = (SELECT MAX(assessment_date) FROM compliance_risk_assessments WHERE property_id = p.id)
LEFT JOIN compliance_analytics ca ON p.id = ca.property_id 
    AND ca.analysis_date = (SELECT MAX(analysis_date) FROM compliance_analytics WHERE property_id = p.id)
LEFT JOIN compliance_action_plans cap ON p.id = cap.property_id
GROUP BY p.id, p.address, p.compliance_score, cra.risk_level, cra.overall_risk_score, 
         cra.fire_safety_risk, cra.structural_risk, cra.mechanical_risk,
         ca.total_violations, ca.open_violations, ca.critical_violations;

-- Create function to update compliance scores with enhanced logic
CREATE OR REPLACE FUNCTION update_property_compliance_score(property_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    new_score INTEGER;
    fire_violations INTEGER;
    structural_violations INTEGER;
    electrical_violations INTEGER;
    mechanical_violations INTEGER;
    other_violations INTEGER;
    recent_permit_count INTEGER;
    expired_cert_count INTEGER;
BEGIN
    -- Count violations by risk category
    SELECT 
        COUNT(*) FILTER (WHERE risk_category = 'FIRE') INTO fire_violations,
        COUNT(*) FILTER (WHERE risk_category = 'STRUCTURAL') INTO structural_violations,
        COUNT(*) FILTER (WHERE risk_category = 'ELECTRICAL') INTO electrical_violations,
        COUNT(*) FILTER (WHERE risk_category = 'MECHANICAL') INTO mechanical_violations,
        COUNT(*) FILTER (WHERE risk_category IS NULL OR risk_category NOT IN ('FIRE', 'STRUCTURAL', 'ELECTRICAL', 'MECHANICAL')) INTO other_violations
    FROM philly_li_violations 
    WHERE property_id = property_uuid 
    AND status IN ('OPEN', 'ACTIVE', 'IN VIOLATION');
    
    -- Count recent permits (last 365 days)
    SELECT COUNT(*) INTO recent_permit_count 
    FROM philly_li_permits 
    WHERE property_id = property_uuid 
    AND permit_issued_date > CURRENT_DATE - INTERVAL '365 days';
    
    -- Calculate enhanced score with risk weighting
    new_score := 100;
    new_score := new_score - (fire_violations * 25);        -- Fire: -25 points each
    new_score := new_score - (structural_violations * 20);  -- Structural: -20 points each
    new_score := new_score - (electrical_violations * 15);  -- Electrical: -15 points each
    new_score := new_score - (mechanical_violations * 12);  -- Mechanical: -12 points each
    new_score := new_score - (other_violations * 5);        -- Other: -5 points each
    new_score := new_score + LEAST(recent_permit_count * 3, 15); -- Bonus for recent permits (max +15)
    
    -- Ensure score is between 0 and 100
    new_score := GREATEST(0, LEAST(100, new_score));
    
    -- Update property
    UPDATE properties 
    SET compliance_score = new_score, updated_at = NOW()
    WHERE id = property_uuid;
    
    RETURN new_score;
END;
$$ LANGUAGE plpgsql;

-- Create function to categorize violations by risk
CREATE OR REPLACE FUNCTION categorize_violation_risk(violation_description TEXT)
RETURNS TEXT AS $$
BEGIN
    IF violation_description IS NULL THEN
        RETURN 'OTHER';
    END IF;
    
    -- Fire safety violations (highest risk)
    IF violation_description ~* '(FIRE|SMOKE|ALARM|SPRINKLER|EXTINGUISHER|EGRESS|EXIT)' THEN
        RETURN 'FIRE';
    -- Structural violations (high risk)
    ELSIF violation_description ~* '(STRUCTURAL|FACADE|FOUNDATION|BEAM|WALL|ROOF)' THEN
        RETURN 'STRUCTURAL';
    -- Electrical violations (medium-high risk)
    ELSIF violation_description ~* '(ELECTRICAL|WIRING|OUTLET|CIRCUIT)' THEN
        RETURN 'ELECTRICAL';
    -- Mechanical violations (medium risk)
    ELSIF violation_description ~* '(MECHANICAL|BOILER|HVAC|HEATING|VENTILATION)' THEN
        RETURN 'MECHANICAL';
    -- Plumbing violations (medium risk)
    ELSIF violation_description ~* '(PLUMBING|WATER|PIPE|SEWER|DRAIN)' THEN
        RETURN 'PLUMBING';
    -- Housing code violations (low-medium risk)
    ELSIF violation_description ~* '(HOUSING|OCCUPANCY|MAINTENANCE|PROPERTY)' THEN
        RETURN 'HOUSING';
    -- Zoning violations (low risk)
    ELSIF violation_description ~* '(ZONING|USE|PERMIT)' THEN
        RETURN 'ZONING';
    ELSE
        RETURN 'OTHER';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Update existing violations with risk categories
UPDATE philly_li_violations 
SET risk_category = categorize_violation_risk(violation_description)
WHERE risk_category IS NULL;

-- Add comments for new tables
COMMENT ON TABLE compliance_risk_assessments IS 'Risk assessment data for properties with scoring by category';
COMMENT ON TABLE compliance_action_plans IS 'Prioritized action plans for addressing compliance issues';
COMMENT ON TABLE compliance_cost_tracking IS 'Cost tracking and ROI analysis for compliance activities';
COMMENT ON TABLE compliance_analytics IS 'Historical compliance analytics and trend data';

COMMENT ON COLUMN compliance_risk_assessments.overall_risk_score IS 'Total risk score calculated from all risk factors';
COMMENT ON COLUMN compliance_risk_assessments.risk_level IS 'Overall risk level: LOW, MEDIUM, HIGH, or CRITICAL';
COMMENT ON COLUMN compliance_action_plans.priority IS 'Action priority level for scheduling and resource allocation';
COMMENT ON COLUMN compliance_cost_tracking.roi_impact IS 'Return on investment ratio for compliance spending';
