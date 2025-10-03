import { supabase } from '../config/supabase';

/**
 * Generate a sample compliance report for a property
 * This is used to populate the Report Library with initial data
 */
export const generateSampleReport = async (property, userId) => {
  try {
    console.log('📊 Generating sample compliance report for:', property.address);
    
    // Create sample compliance data
    const complianceData = {
      property_id: property.id,
      user_id: userId,
      report_type: 'full_compliance', // Required field
      status: 'completed',
      compliance_score: Math.floor(Math.random() * 30) + 70, // 70-100
      risk_level: Math.random() > 0.7 ? 'HIGH' : Math.random() > 0.4 ? 'MEDIUM' : 'LOW',
      violations: JSON.stringify({
        hpd: [
          {
            id: 'HPD-001',
            type: 'Heat/Hot Water',
            status: 'Open',
            date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Insufficient heat during winter months'
          }
        ],
        dob: [
          {
            id: 'DOB-001', 
            type: 'Construction',
            status: 'Open',
            date: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Unpermitted construction work'
          }
        ]
      }),
      ai_analysis: JSON.stringify({
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
      }),
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
