import { supabase } from '../config/supabase';

/**
 * Generate a compliance report for a property using real NYC data when available
 */
export const generateSampleReport = async (property, userId) => {
  try {
    console.log('📊 Generating compliance report for:', property.address);
    
    // Try to get real NYC data first
    let realNYCData = null;
    let complianceScore = Math.floor(Math.random() * 30) + 70; // Default 70-100
    let riskLevel = Math.random() > 0.7 ? 'HIGH' : Math.random() > 0.4 ? 'MEDIUM' : 'LOW';
    let violations = { hpd: [], dob: [] };
    let aiAnalysis = {
      summary: `Property at ${property.address} shows moderate compliance with some areas needing attention.`,
      key_findings: [
        'Heat and hot water systems need maintenance',
        'Recent construction work requires permits',
        'Overall building structure is sound'
      ],
      recommendations: [
        'Schedule heating system inspection',
        'Obtain proper permits for construction work',
        'Implement regular maintenance schedule'
      ],
      risk_factors: [
        'Older building systems',
        'Recent construction activity',
        'Seasonal heating requirements'
      ]
    };

    // Check if we have real NYC data for this property
    if (property.city === 'NYC') {
      try {
        console.log('🔍 Checking for real NYC data...');
        const { data: nycProperty } = await supabase
          .from('nyc_properties')
          .select('*')
          .eq('property_id', property.id)
          .single();

        if (nycProperty) {
          console.log('✅ Found NYC property record with BIN:', nycProperty.bin);
          
          // Get compliance summary if available
          const { data: complianceSummary } = await supabase
            .from('nyc_compliance_summary')
            .select('*')
            .eq('nyc_property_id', nycProperty.id)
            .single();

          if (complianceSummary) {
            console.log('📊 Using real compliance data');
            realNYCData = complianceSummary;
            complianceScore = Math.round(complianceSummary.overall_compliance_score || complianceScore);
            riskLevel = complianceSummary.risk_level || riskLevel;
            
            // Parse real violations data
            try {
              const hpdViolations = JSON.parse(complianceSummary.hpd_violations_data || '[]');
              const dobViolations = JSON.parse(complianceSummary.dob_violations_data || '[]');
              
              violations = {
                hpd: hpdViolations.slice(0, 5).map(v => ({
                  id: v.violation_id || v.violationid,
                  type: v.violation_class || v.class,
                  status: v.violation_status || v.violationstatus,
                  date: v.inspection_date || v.inspectiondate,
                  description: v.violation_description || v.novdescription
                })),
                dob: dobViolations.slice(0, 5).map(v => ({
                  id: v.violation_id,
                  type: v.violation_type,
                  status: v.violation_status,
                  date: v.issue_date,
                  description: v.violation_description
                }))
              };
              
              // Update AI analysis with real data
              aiAnalysis = {
                summary: `Property at ${property.address} has ${complianceSummary.total_violations || 0} total violations with ${complianceSummary.open_violations || 0} currently active.`,
                key_findings: [
                  `HPD violations: ${complianceSummary.hpd_violations || 0} total, ${complianceSummary.hpd_violations_active || 0} active`,
                  `DOB violations: ${complianceSummary.dob_violations || 0} total, ${complianceSummary.dob_violations_active || 0} active`,
                  `Equipment status: ${complianceSummary.elevator_devices_total || 0} elevators, ${complianceSummary.boiler_devices_total || 0} boilers`
                ],
                recommendations: [
                  'Review active violations and create remediation plan',
                  'Schedule equipment inspections as needed',
                  'Monitor compliance status regularly'
                ],
                risk_factors: [
                  complianceSummary.open_violations > 10 ? 'High number of active violations' : null,
                  complianceSummary.elevator_devices_active < complianceSummary.elevator_devices_total ? 'Some elevator equipment inactive' : null,
                  complianceScore < 70 ? 'Below average compliance score' : null
                ].filter(Boolean)
              };
              
            } catch (parseError) {
              console.warn('⚠️ Error parsing real violations data:', parseError);
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Error fetching real NYC data:', error);
      }
    }

    // Create compliance data
    const complianceData = {
      property_id: property.id,
      user_id: userId,
      report_type: 'full_compliance', // Required field
      status: 'completed',
      compliance_score: complianceScore,
      risk_level: riskLevel,
      violations: JSON.stringify(violations),
      ai_analysis: JSON.stringify(aiAnalysis),
      recommendations: JSON.stringify([
        'Schedule heating system inspection within 30 days',
        'Obtain proper permits for any construction work',
        'Implement quarterly maintenance checks',
        'Consider upgrading heating systems for efficiency'
      ]),
      generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert the compliance report
    const { data, error } = await supabase
      .from('compliance_reports')
      .insert([complianceData])
      .select();

    if (error) {
      console.error('❌ Error creating compliance report:', error);
      throw error;
    }

    console.log('✅ Sample compliance report generated:', data[0]);
    return data[0];

  } catch (error) {
    console.error('❌ Error generating sample report:', error);
    throw error;
  }
};

/**
 * Generate multiple sample reports for a property
 */
export const generateMultipleSampleReports = async (property, userId) => {
  try {
    const reports = [];
    
    // Generate different types of reports
    const reportTypes = [
      { type: 'compliance', title: 'Compliance Report' },
      { type: 'inspection', title: 'Inspection Report' },
      { type: 'violation', title: 'Violation Analysis' }
    ];

    for (const reportType of reportTypes) {
      const report = await generateSampleReport(property, userId);
      reports.push({ ...report, report_type: reportType.type, title: reportType.title });
    }

    return reports;
  } catch (error) {
    console.error('❌ Error generating multiple sample reports:', error);
    throw error;
  }
};
