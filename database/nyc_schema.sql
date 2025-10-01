-- NYC Property Data Schema for Supabase
-- Comprehensive tables for NYC Open Data integration

-- ============================================================================
-- NYC PROPERTIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS nyc_properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    bin TEXT UNIQUE,  -- Building Identification Number
    bbl TEXT,         -- Borough, Block, Lot
    address TEXT NOT NULL,
    borough TEXT,     -- MANHATTAN, BRONX, BROOKLYN, QUEENS, STATEN ISLAND
    block TEXT,
    lot TEXT,
    zip_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_synced_at TIMESTAMPTZ,
    UNIQUE(property_id, bin)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_nyc_properties_bin ON nyc_properties(bin);
CREATE INDEX IF NOT EXISTS idx_nyc_properties_bbl ON nyc_properties(bbl);
CREATE INDEX IF NOT EXISTS idx_nyc_properties_address ON nyc_properties USING gin(to_tsvector('english', address));
CREATE INDEX IF NOT EXISTS idx_nyc_properties_property_id ON nyc_properties(property_id);

-- ============================================================================
-- DOB VIOLATIONS (Department of Buildings)
-- ============================================================================

CREATE TABLE IF NOT EXISTS nyc_dob_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nyc_property_id UUID REFERENCES nyc_properties(id) ON DELETE CASCADE,
    violation_id TEXT UNIQUE NOT NULL,  -- isndobbisviol
    bin TEXT,
    bbl TEXT,
    issue_date DATE,
    violation_type TEXT,
    violation_type_code TEXT,
    violation_description TEXT,
    violation_category TEXT,  -- FIRE, STRUCTURAL, ELECTRICAL, etc.
    violation_status TEXT,
    disposition_date DATE,
    disposition_comments TEXT,
    house_number TEXT,
    street TEXT,
    borough TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dob_violations_bin ON nyc_dob_violations(bin);
CREATE INDEX IF NOT EXISTS idx_dob_violations_bbl ON nyc_dob_violations(bbl);
CREATE INDEX IF NOT EXISTS idx_dob_violations_status ON nyc_dob_violations(violation_status);
CREATE INDEX IF NOT EXISTS idx_dob_violations_date ON nyc_dob_violations(issue_date);
CREATE INDEX IF NOT EXISTS idx_dob_violations_category ON nyc_dob_violations(violation_category);

-- ============================================================================
-- HPD VIOLATIONS (Housing Preservation & Development)
-- ============================================================================

CREATE TABLE IF NOT EXISTS nyc_hpd_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nyc_property_id UUID REFERENCES nyc_properties(id) ON DELETE CASCADE,
    violation_id TEXT UNIQUE NOT NULL,
    building_id TEXT,
    bbl TEXT,
    inspection_date DATE,
    violation_description TEXT,
    violation_class TEXT,  -- A, B, C
    violation_category TEXT,
    violation_status TEXT,
    current_status_date DATE,
    apartment TEXT,
    story TEXT,
    house_number TEXT,
    street_name TEXT,
    borough_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hpd_violations_bbl ON nyc_hpd_violations(bbl);
CREATE INDEX IF NOT EXISTS idx_hpd_violations_status ON nyc_hpd_violations(violation_status);
CREATE INDEX IF NOT EXISTS idx_hpd_violations_date ON nyc_hpd_violations(inspection_date);
CREATE INDEX IF NOT EXISTS idx_hpd_violations_class ON nyc_hpd_violations(violation_class);

-- ============================================================================
-- ELEVATOR INSPECTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS nyc_elevator_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nyc_property_id UUID REFERENCES nyc_properties(id) ON DELETE CASCADE,
    device_number TEXT NOT NULL,
    bin TEXT,
    device_type TEXT,
    device_status TEXT,
    last_inspection_date DATE,
    next_inspection_date DATE,
    inspection_result TEXT,
    borough TEXT,
    house_number TEXT,
    street_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(device_number, last_inspection_date)
);

CREATE INDEX IF NOT EXISTS idx_elevator_inspections_bin ON nyc_elevator_inspections(bin);
CREATE INDEX IF NOT EXISTS idx_elevator_inspections_status ON nyc_elevator_inspections(device_status);
CREATE INDEX IF NOT EXISTS idx_elevator_inspections_date ON nyc_elevator_inspections(last_inspection_date);

-- ============================================================================
-- BOILER INSPECTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS nyc_boiler_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nyc_property_id UUID REFERENCES nyc_properties(id) ON DELETE CASCADE,
    device_number TEXT NOT NULL,
    bin TEXT,
    boiler_type TEXT,
    inspection_date DATE,
    inspection_result TEXT,
    next_inspection_date DATE,
    property_type TEXT,
    borough TEXT,
    house_number TEXT,
    street_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(device_number, inspection_date)
);

CREATE INDEX IF NOT EXISTS idx_boiler_inspections_bin ON nyc_boiler_inspections(bin);
CREATE INDEX IF NOT EXISTS idx_boiler_inspections_result ON nyc_boiler_inspections(inspection_result);
CREATE INDEX IF NOT EXISTS idx_boiler_inspections_date ON nyc_boiler_inspections(inspection_date);

-- ============================================================================
-- 311 COMPLAINTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS nyc_311_complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nyc_property_id UUID REFERENCES nyc_properties(id) ON DELETE CASCADE,
    unique_key TEXT UNIQUE NOT NULL,
    created_date TIMESTAMPTZ,
    closed_date TIMESTAMPTZ,
    complaint_type TEXT,
    descriptor TEXT,
    incident_address TEXT,
    street_name TEXT,
    cross_street_1 TEXT,
    cross_street_2 TEXT,
    city TEXT,
    borough TEXT,
    zip_code TEXT,
    status TEXT,
    resolution_description TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    location_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_311_complaints_address ON nyc_311_complaints USING gin(to_tsvector('english', incident_address));
CREATE INDEX IF NOT EXISTS idx_311_complaints_type ON nyc_311_complaints(complaint_type);
CREATE INDEX IF NOT EXISTS idx_311_complaints_status ON nyc_311_complaints(status);
CREATE INDEX IF NOT EXISTS idx_311_complaints_date ON nyc_311_complaints(created_date);

-- ============================================================================
-- BUILDING COMPLAINTS (DOB)
-- ============================================================================

CREATE TABLE IF NOT EXISTS nyc_building_complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nyc_property_id UUID REFERENCES nyc_properties(id) ON DELETE CASCADE,
    complaint_number TEXT UNIQUE NOT NULL,
    bin TEXT,
    date_entered DATE,
    complaint_category TEXT,
    unit TEXT,
    disposition_code TEXT,
    disposition_date DATE,
    inspection_date DATE,
    house_number TEXT,
    street_name TEXT,
    borough TEXT,
    zip_code TEXT,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_building_complaints_bin ON nyc_building_complaints(bin);
CREATE INDEX IF NOT EXISTS idx_building_complaints_status ON nyc_building_complaints(status);
CREATE INDEX IF NOT EXISTS idx_building_complaints_date ON nyc_building_complaints(date_entered);

-- ============================================================================
-- FIRE SAFETY INSPECTIONS (FDNY)
-- ============================================================================

CREATE TABLE IF NOT EXISTS nyc_fire_safety_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nyc_property_id UUID REFERENCES nyc_properties(id) ON DELETE CASCADE,
    inspection_id TEXT NOT NULL,
    bin TEXT,
    inspection_date DATE,
    inspection_type TEXT,
    inspection_result TEXT,
    violations_found INTEGER DEFAULT 0,
    facility_name TEXT,
    address TEXT,
    borough TEXT,
    zip_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(inspection_id, inspection_date)
);

CREATE INDEX IF NOT EXISTS idx_fire_inspections_bin ON nyc_fire_safety_inspections(bin);
CREATE INDEX IF NOT EXISTS idx_fire_inspections_result ON nyc_fire_safety_inspections(inspection_result);
CREATE INDEX IF NOT EXISTS idx_fire_inspections_date ON nyc_fire_safety_inspections(inspection_date);

-- ============================================================================
-- COOLING TOWER REGISTRATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS nyc_cooling_tower_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nyc_property_id UUID REFERENCES nyc_properties(id) ON DELETE CASCADE,
    tower_id TEXT UNIQUE NOT NULL,
    bin TEXT,
    registration_date DATE,
    status TEXT,
    facility_name TEXT,
    address TEXT,
    borough TEXT,
    zip_code TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cooling_tower_reg_bin ON nyc_cooling_tower_registrations(bin);
CREATE INDEX IF NOT EXISTS idx_cooling_tower_reg_status ON nyc_cooling_tower_registrations(status);

-- ============================================================================
-- COOLING TOWER INSPECTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS nyc_cooling_tower_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nyc_property_id UUID REFERENCES nyc_properties(id) ON DELETE CASCADE,
    tower_registration_id UUID REFERENCES nyc_cooling_tower_registrations(id),
    inspection_id TEXT NOT NULL,
    tower_id TEXT,
    bin TEXT,
    inspection_date DATE,
    inspection_status TEXT,
    compliance_status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(inspection_id, inspection_date)
);

CREATE INDEX IF NOT EXISTS idx_cooling_tower_insp_bin ON nyc_cooling_tower_inspections(bin);
CREATE INDEX IF NOT EXISTS idx_cooling_tower_insp_status ON nyc_cooling_tower_inspections(compliance_status);
CREATE INDEX IF NOT EXISTS idx_cooling_tower_insp_date ON nyc_cooling_tower_inspections(inspection_date);

-- ============================================================================
-- ELECTRICAL PERMITS
-- ============================================================================

CREATE TABLE IF NOT EXISTS nyc_electrical_permits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nyc_property_id UUID REFERENCES nyc_properties(id) ON DELETE CASCADE,
    permit_number TEXT UNIQUE NOT NULL,
    bin TEXT,
    permit_issued_date DATE,
    permit_type TEXT,
    work_type TEXT,
    filing_status TEXT,
    completion_date DATE,
    house_number TEXT,
    street_name TEXT,
    borough TEXT,
    zip_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_electrical_permits_bin ON nyc_electrical_permits(bin);
CREATE INDEX IF NOT EXISTS idx_electrical_permits_status ON nyc_electrical_permits(filing_status);
CREATE INDEX IF NOT EXISTS idx_electrical_permits_date ON nyc_electrical_permits(permit_issued_date);

-- ============================================================================
-- HPD REGISTRATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS nyc_hpd_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nyc_property_id UUID REFERENCES nyc_properties(id) ON DELETE CASCADE,
    registration_id TEXT UNIQUE NOT NULL,
    building_id TEXT,
    bbl TEXT,
    bin TEXT,
    house_number TEXT,
    street_name TEXT,
    borough_id TEXT,
    zip_code TEXT,
    registration_date DATE,
    last_registration_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hpd_registrations_bbl ON nyc_hpd_registrations(bbl);
CREATE INDEX IF NOT EXISTS idx_hpd_registrations_bin ON nyc_hpd_registrations(bin);

-- ============================================================================
-- NYC COMPLIANCE SUMMARY (Materialized View)
-- ============================================================================

CREATE TABLE IF NOT EXISTS nyc_compliance_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nyc_property_id UUID REFERENCES nyc_properties(id) ON DELETE CASCADE UNIQUE,
    compliance_score INTEGER DEFAULT 0,
    risk_level TEXT DEFAULT 'UNKNOWN',
    total_violations INTEGER DEFAULT 0,
    open_violations INTEGER DEFAULT 0,
    dob_violations INTEGER DEFAULT 0,
    hpd_violations INTEGER DEFAULT 0,
    equipment_issues INTEGER DEFAULT 0,
    open_311_complaints INTEGER DEFAULT 0,
    fire_safety_issues INTEGER DEFAULT 0,
    last_analyzed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nyc_compliance_score ON nyc_compliance_summary(compliance_score);
CREATE INDEX IF NOT EXISTS idx_nyc_compliance_risk ON nyc_compliance_summary(risk_level);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE nyc_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE nyc_dob_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE nyc_hpd_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE nyc_elevator_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE nyc_boiler_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE nyc_311_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE nyc_building_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE nyc_fire_safety_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE nyc_cooling_tower_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE nyc_cooling_tower_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE nyc_electrical_permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE nyc_hpd_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE nyc_compliance_summary ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Users can view NYC data for properties they own
CREATE POLICY "Users can view their NYC property data"
    ON nyc_properties FOR SELECT
    USING (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

-- Similar policies for all NYC tables
CREATE POLICY "Users can view their DOB violations"
    ON nyc_dob_violations FOR SELECT
    USING (
        nyc_property_id IN (
            SELECT id FROM nyc_properties WHERE property_id IN (
                SELECT id FROM properties WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can view their HPD violations"
    ON nyc_hpd_violations FOR SELECT
    USING (
        nyc_property_id IN (
            SELECT id FROM nyc_properties WHERE property_id IN (
                SELECT id FROM properties WHERE user_id = auth.uid()
            )
        )
    );

-- Add similar policies for other tables...

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update compliance summary
CREATE OR REPLACE FUNCTION update_nyc_compliance_summary(p_nyc_property_id UUID)
RETURNS VOID AS $$
DECLARE
    v_total_violations INTEGER;
    v_open_violations INTEGER;
    v_dob_violations INTEGER;
    v_hpd_violations INTEGER;
    v_equipment_issues INTEGER;
    v_open_311 INTEGER;
    v_compliance_score INTEGER;
    v_risk_level TEXT;
BEGIN
    -- Count violations
    SELECT COUNT(*) INTO v_total_violations
    FROM (
        SELECT id FROM nyc_dob_violations WHERE nyc_property_id = p_nyc_property_id
        UNION ALL
        SELECT id FROM nyc_hpd_violations WHERE nyc_property_id = p_nyc_property_id
    ) AS all_violations;
    
    -- Count open violations
    SELECT COUNT(*) INTO v_open_violations
    FROM (
        SELECT id FROM nyc_dob_violations 
        WHERE nyc_property_id = p_nyc_property_id 
        AND violation_status IN ('OPEN', 'ACTIVE', 'IN VIOLATION')
        UNION ALL
        SELECT id FROM nyc_hpd_violations 
        WHERE nyc_property_id = p_nyc_property_id 
        AND violation_status IN ('OPEN', 'ACTIVE', 'IN VIOLATION')
    ) AS open_violations;
    
    -- Calculate compliance score
    v_compliance_score := 100 - LEAST(v_open_violations * 5, 100);
    
    -- Determine risk level
    IF v_compliance_score >= 90 THEN
        v_risk_level := 'LOW';
    ELSIF v_compliance_score >= 70 THEN
        v_risk_level := 'MEDIUM';
    ELSIF v_compliance_score >= 50 THEN
        v_risk_level := 'HIGH';
    ELSE
        v_risk_level := 'CRITICAL';
    END IF;
    
    -- Upsert compliance summary
    INSERT INTO nyc_compliance_summary (
        nyc_property_id, compliance_score, risk_level, 
        total_violations, open_violations, last_analyzed_at
    ) VALUES (
        p_nyc_property_id, v_compliance_score, v_risk_level, 
        v_total_violations, v_open_violations, NOW()
    )
    ON CONFLICT (nyc_property_id) 
    DO UPDATE SET
        compliance_score = EXCLUDED.compliance_score,
        risk_level = EXCLUDED.risk_level,
        total_violations = EXCLUDED.total_violations,
        open_violations = EXCLUDED.open_violations,
        last_analyzed_at = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE nyc_properties IS 'Master table for NYC properties with BIN/BBL identifiers';
COMMENT ON TABLE nyc_dob_violations IS 'Department of Buildings violations';
COMMENT ON TABLE nyc_hpd_violations IS 'Housing Preservation & Development violations';
COMMENT ON TABLE nyc_elevator_inspections IS 'Elevator compliance inspections';
COMMENT ON TABLE nyc_boiler_inspections IS 'Boiler inspection records';
COMMENT ON TABLE nyc_311_complaints IS 'Citizen complaints from 311 system';
COMMENT ON TABLE nyc_compliance_summary IS 'Calculated compliance scores and risk levels';

