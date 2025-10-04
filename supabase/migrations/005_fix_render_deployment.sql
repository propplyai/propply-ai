-- Migration: Fix Render deployment issues
-- This migration fixes data type mismatches and adds RLS bypass policies for service role

-- Fix compliance_score data type to match backend expectations
ALTER TABLE compliance_reports 
ALTER COLUMN compliance_score TYPE DECIMAL(5,2);

-- Add RLS bypass policies for service role
-- These policies allow the backend service role to bypass RLS for database operations

-- Service role can manage compliance reports
CREATE POLICY "Service role can manage compliance reports" ON compliance_reports
    FOR ALL USING (auth.role() = 'service_role');

-- Service role can manage properties  
CREATE POLICY "Service role can manage properties" ON properties
    FOR ALL USING (auth.role() = 'service_role');

-- Service role can manage user profiles
CREATE POLICY "Service role can manage user profiles" ON user_profiles
    FOR ALL USING (auth.role() = 'service_role');

-- Service role can manage payments
CREATE POLICY "Service role can manage payments" ON payments
    FOR ALL USING (auth.role() = 'service_role');

-- Service role can manage vendor quotes
CREATE POLICY "Service role can manage vendor quotes" ON vendor_quotes
    FOR ALL USING (auth.role() = 'service_role');

-- Grant additional permissions to service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Create a function to safely insert compliance reports (handles data type conversion)
CREATE OR REPLACE FUNCTION safe_insert_compliance_report(
    p_user_id UUID,
    p_property_id UUID,
    p_report_type TEXT,
    p_status TEXT,
    p_compliance_score DECIMAL,
    p_risk_level TEXT,
    p_ai_analysis JSONB,
    p_generated_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID AS $$
DECLARE
    report_id UUID;
BEGIN
    -- Generate new UUID for the report
    report_id := uuid_generate_v4();
    
    -- Insert the compliance report
    INSERT INTO compliance_reports (
        id,
        user_id,
        property_id,
        report_type,
        status,
        compliance_score,
        risk_level,
        ai_analysis,
        generated_at,
        created_at,
        updated_at
    ) VALUES (
        report_id,
        p_user_id,
        p_property_id,
        p_report_type,
        p_status,
        p_compliance_score,
        p_risk_level,
        p_ai_analysis,
        p_generated_at,
        NOW(),
        NOW()
    );
    
    RETURN report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION safe_insert_compliance_report TO service_role;
