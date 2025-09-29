-- Enhanced Philadelphia Compliance Database Schema
-- Adds risk assessment, cost tracking, and advanced analytics capabilities

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

-- Create views for common queries
CREATE OR REPLACE VIEW property_compliance_dashboard AS
SELECT 
    p.id,
    p.address,
    p.compliance_score,
    cra.risk_level,
    cra.overall_risk_score,
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
         ca.total_violations, ca.open_violations, ca.critical_violations;

-- Create function to update compliance scores
CREATE OR REPLACE FUNCTION update_property_compliance_score(property_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    new_score INTEGER;
    violation_count INTEGER;
    open_violation_count INTEGER;
    recent_permit_count INTEGER;
BEGIN
    -- Get violation counts
    SELECT COUNT(*) INTO violation_count 
    FROM philly_li_violations 
    WHERE property_id = property_uuid;
    
    SELECT COUNT(*) INTO open_violation_count 
    FROM philly_li_violations 
    WHERE property_id = property_uuid 
    AND status IN ('OPEN', 'ACTIVE', 'IN VIOLATION');
    
    SELECT COUNT(*) INTO recent_permit_count 
    FROM philly_li_permits 
    WHERE property_id = property_uuid 
    AND permit_issued_date > CURRENT_DATE - INTERVAL '365 days';
    
    -- Calculate enhanced score (simplified version for SQL)
    new_score := 100 - (open_violation_count * 10) + (recent_permit_count * 2);
    new_score := GREATEST(0, LEAST(100, new_score));
    
    -- Update property
    UPDATE properties 
    SET compliance_score = new_score, updated_at = NOW()
    WHERE id = property_uuid;
    
    RETURN new_score;
END;
$$ LANGUAGE plpgsql;
