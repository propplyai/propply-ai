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
            
            // Get real violations data from separate tables
            try {
              // Get HPD violations
              const { data: hpdViolations } = await supabase
                .from('nyc_hpd_violations')
                .select('*')
                .eq('nyc_property_id', nycProperty.id)
                .limit(10);

              // Get DOB violations  
              const { data: dobViolations } = await supabase
                .from('nyc_dob_violations')
                .select('*')
                .eq('nyc_property_id', nycProperty.id)
                .limit(10);

              // Get elevator devices
              const { data: elevatorDevices } = await supabase
                .from('nyc_elevator_inspections')
                .select('*')
                .eq('nyc_property_id', nycProperty.id)
                .limit(10);

              // Get boiler devices
              const { data: boilerDevices } = await supabase
                .from('nyc_boiler_inspections')
                .select('*')
                .eq('nyc_property_id', nycProperty.id)
                .limit(10);
              
              violations = {
                hpd: (hpdViolations || []).map(v => ({
                  id: v.violation_id,
                  type: v.violation_class,
                  status: v.violation_status,
                  date: v.inspection_date,
                  description: v.violation_description,
                  apartment: v.apartment,
                  story: v.story
                })),
                dob: (dobViolations || []).map(v => ({
                  id: v.violation_id,
                  type: v.violation_type,
                  status: v.violation_status,
                  date: v.issue_date,
                  description: v.violation_description,
                  category: v.violation_category
                }))
              };

              // Create equipment data
              const equipment = {
                elevators: (elevatorDevices || []).map(e => ({
                  device_number: e.device_number,
                  device_type: e.device_type,
                  status: e.device_status,
                  last_inspection: e.last_inspection_date,
                  result: e.inspection_result,
                  next_inspection: e.next_inspection_date
                })),
                boilers: (boilerDevices || []).map(b => ({
                  device_number: b.device_number,
                  boiler_type: b.boiler_type,
                  last_inspection: b.inspection_date,
                  result: b.inspection_result,
                  next_inspection: b.next_inspection_date
                }))
              };
              
              // Update AI analysis with real data
              const totalViolations = (hpdViolations?.length || 0) + (dobViolations?.length || 0);
              const openViolations = (hpdViolations?.filter(v => v.violation_status === 'OPEN').length || 0) + 
                                   (dobViolations?.filter(v => v.violation_status === 'ACTIVE').length || 0);
              
              aiAnalysis = {
                summary: `Property at ${property.address} has ${totalViolations} total violations with ${openViolations} currently active. ${equipment.elevators.length} elevator(s) and ${equipment.boilers.length} boiler(s) are registered.`,
                key_findings: [
                  `HPD violations: ${hpdViolations?.length || 0} total, ${hpdViolations?.filter(v => v.violation_status === 'OPEN').length || 0} active`,
                  `DOB violations: ${dobViolations?.length || 0} total, ${dobViolations?.filter(v => v.violation_status === 'ACTIVE').length || 0} active`,
                  `Equipment status: ${equipment.elevators.length} elevators, ${equipment.boilers.length} boilers`
                ],
                recommendations: [
                  ...(hpdViolations?.filter(v => v.violation_status === 'OPEN').length > 0 ? 
                    [`Address ${hpdViolations.filter(v => v.violation_status === 'OPEN').length} open HPD violations`] : []),
                  ...(dobViolations?.filter(v => v.violation_status === 'ACTIVE').length > 0 ? 
                    [`Resolve ${dobViolations.filter(v => v.violation_status === 'ACTIVE').length} active DOB violations`] : []),
                  ...(equipment.elevators.length > 0 ? 
                    [`Schedule elevator inspections for ${equipment.elevators.length} device(s)`] : []),
                  ...(equipment.boilers.length > 0 ? 
                    [`Schedule boiler inspections for ${equipment.boilers.length} device(s)`] : []),
                  'Monitor compliance status regularly'
                ],
                risk_factors: [
                  complianceSummary.open_violations > 10 ? 'High number of active violations' : null,
                  complianceSummary.elevator_devices_active < complianceSummary.elevator_devices_total ? 'Some elevator equipment inactive' : null,
                  complianceScore < 70 ? 'Below average compliance score' : null
                ].filter(Boolean),
                equipment: equipment,
                violations_detail: violations
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
      recommendations: JSON.stringify(aiAnalysis.recommendations || [
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
