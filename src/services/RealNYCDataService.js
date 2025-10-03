/**
 * Real NYC Data Integration Service
 * Uses the existing Python scripts to fetch actual NYC Open Data
 */

import { supabase } from '../config/supabase';

class RealNYCDataService {
  constructor() {
    this.pythonScriptPath = './complianceNYC.py';
    this.nycDataScriptPath = './NYC_data.py';
  }

  /**
   * Fetch real NYC data for a property using the Python compliance system
   */
  async fetchRealNYCData(property) {
    console.log(`🗽 Fetching real NYC data for: ${property.address}`);
    
    try {
      // Use the comprehensive Python compliance system
      const complianceData = await this.runPythonComplianceScript(property);
      
      if (complianceData && complianceData.bin) {
        // Store the real data in Supabase
        await this.storeRealNYCData(property, complianceData);
        return complianceData;
      } else {
        console.warn('⚠️ No BIN found for property - cannot fetch real NYC data');
        return null;
      }
      
    } catch (error) {
      console.error('❌ Error fetching real NYC data:', error);
      throw error;
    }
  }

  /**
   * Run the Python compliance script to get real NYC data
   */
  async runPythonComplianceScript(property) {
    const { spawn } = require('child_process');
    
    return new Promise((resolve, reject) => {
      console.log('🐍 Running Python compliance script...');
      
      const pythonProcess = spawn('python3', [
        this.pythonScriptPath,
        property.address,
        property.borough || 'NYC'
      ]);

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
        console.log('Python output:', data.toString());
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error('Python error:', data.toString());
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            // Parse the JSON output from the Python script
            const lines = output.split('\n');
            let jsonOutput = '';
            let inJsonSection = false;
            
            for (const line of lines) {
              if (line.includes('{') && line.includes('"address"')) {
                inJsonSection = true;
              }
              if (inJsonSection) {
                jsonOutput += line + '\n';
                if (line.includes('}') && line.includes('"data_sources"')) {
                  break;
                }
              }
            }
            
            if (jsonOutput.trim()) {
              const complianceData = JSON.parse(jsonOutput.trim());
              console.log('✅ Python script completed successfully');
              resolve(complianceData);
            } else {
              console.warn('⚠️ No JSON output from Python script');
              resolve(null);
            }
          } catch (parseError) {
            console.error('❌ Error parsing Python output:', parseError);
            reject(parseError);
          }
        } else {
          console.error(`❌ Python script failed with code ${code}`);
          console.error('Error output:', errorOutput);
          reject(new Error(`Python script failed: ${errorOutput}`));
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('❌ Failed to start Python process:', error);
        reject(error);
      });
    });
  }

  /**
   * Store real NYC data in Supabase tables
   */
  async storeRealNYCData(property, complianceData) {
    console.log('💾 Storing real NYC data in Supabase...');
    
    try {
      // 1. Create/update nyc_properties record
      const { data: nycProperty, error: nycError } = await supabase
        .from('nyc_properties')
        .upsert({
          property_id: property.id,
          bin: complianceData.bin,
          bbl: complianceData.bbl,
          address: complianceData.address,
          borough: complianceData.borough,
          block: complianceData.block,
          lot: complianceData.lot,
          zip_code: complianceData.zip_code,
          last_synced_at: new Date().toISOString()
        }, {
          onConflict: 'property_id'
        })
        .select()
        .single();

      if (nycError) {
        console.error('❌ Error creating NYC property record:', nycError);
        throw nycError;
      }

      console.log('✅ NYC property record created/updated:', nycProperty.id);

      // 2. Store HPD violations
      if (complianceData.hpd_violations_data) {
        const hpdViolations = JSON.parse(complianceData.hpd_violations_data);
        if (hpdViolations.length > 0) {
          await this.storeHPDViolations(nycProperty.id, hpdViolations);
        }
      }

      // 3. Store DOB violations
      if (complianceData.dob_violations_data) {
        const dobViolations = JSON.parse(complianceData.dob_violations_data);
        if (dobViolations.length > 0) {
          await this.storeDOBViolations(nycProperty.id, dobViolations);
        }
      }

      // 4. Store elevator inspections
      if (complianceData.elevator_data) {
        const elevatorData = JSON.parse(complianceData.elevator_data);
        if (elevatorData.length > 0) {
          await this.storeElevatorInspections(nycProperty.id, elevatorData);
        }
      }

      // 5. Store boiler inspections
      if (complianceData.boiler_data) {
        const boilerData = JSON.parse(complianceData.boiler_data);
        if (boilerData.length > 0) {
          await this.storeBoilerInspections(nycProperty.id, boilerData);
        }
      }

      // 6. Store electrical permits
      if (complianceData.electrical_data) {
        const electricalData = JSON.parse(complianceData.electrical_data);
        if (electricalData.length > 0) {
          await this.storeElectricalPermits(nycProperty.id, electricalData);
        }
      }

      // 7. Create compliance summary
      await this.createComplianceSummary(nycProperty.id, complianceData);

      console.log('✅ Real NYC data stored successfully');
      return nycProperty;

    } catch (error) {
      console.error('❌ Error storing real NYC data:', error);
      throw error;
    }
  }

  /**
   * Store HPD violations
   */
  async storeHPDViolations(nycPropertyId, violations) {
    console.log(`📋 Storing ${violations.length} HPD violations...`);
    
    const violationRecords = violations.map(violation => ({
      nyc_property_id: nycPropertyId,
      violation_id: violation.violationid || violation.violation_id,
      building_id: violation.buildingid || violation.building_id,
      bbl: violation.bbl,
      inspection_date: violation.inspectiondate || violation.inspection_date,
      violation_description: violation.novdescription || violation.violation_description,
      violation_class: violation.class || violation.violation_class,
      violation_category: violation.category || violation.violation_category,
      violation_status: violation.violationstatus || violation.violation_status,
      current_status_date: violation.currentstatusdate || violation.current_status_date,
      apartment: violation.apartment,
      story: violation.story,
      house_number: violation.housenumber || violation.house_number,
      street_name: violation.streetname || violation.street_name,
      borough_id: violation.boroid || violation.borough_id
    }));

    const { error } = await supabase
      .from('nyc_hpd_violations')
      .upsert(violationRecords, {
        onConflict: 'violation_id'
      });

    if (error) {
      console.error('❌ Error storing HPD violations:', error);
    } else {
      console.log(`✅ Stored ${violationRecords.length} HPD violations`);
    }
  }

  /**
   * Store DOB violations
   */
  async storeDOBViolations(nycPropertyId, violations) {
    console.log(`📋 Storing ${violations.length} DOB violations...`);
    
    const violationRecords = violations.map(violation => ({
      nyc_property_id: nycPropertyId,
      violation_id: violation.isn_dob_bis_viol || violation.violation_id,
      bin: violation.bin,
      bbl: violation.bbl,
      issue_date: violation.issue_date || violation.issuedate,
      violation_type: violation.violation_type,
      violation_type_code: violation.violation_type_code,
      violation_description: violation.violation_description,
      violation_category: violation.violation_category,
      violation_status: violation.violation_status || violation.status,
      disposition_date: violation.disposition_date || violation.dispositiondate,
      disposition_comments: violation.disposition_comments,
      house_number: violation.house_number,
      street: violation.street,
      borough: violation.borough
    }));

    const { error } = await supabase
      .from('nyc_dob_violations')
      .upsert(violationRecords, {
        onConflict: 'violation_id'
      });

    if (error) {
      console.error('❌ Error storing DOB violations:', error);
    } else {
      console.log(`✅ Stored ${violationRecords.length} DOB violations`);
    }
  }

  /**
   * Store elevator inspections
   */
  async storeElevatorInspections(nycPropertyId, elevatorData) {
    console.log(`🛗 Storing ${elevatorData.length} elevator devices...`);
    
    const inspectionRecords = [];
    
    for (const device of elevatorData) {
      if (device.inspections && device.inspections.length > 0) {
        for (const inspection of device.inspections) {
          inspectionRecords.push({
            nyc_property_id: nycPropertyId,
            device_number: device.device_id || device.device_number,
            bin: device.bin || inspection.bin,
            device_type: device.device_type || inspection.device_type,
            device_status: device.device_status || inspection.device_status,
            last_inspection_date: inspection.status_date || inspection.last_inspection_date,
            next_inspection_date: inspection.next_inspection_date,
            inspection_result: inspection.inspection_result,
            borough: inspection.borough || device.borough,
            house_number: device.house_number || inspection.house_number,
            street_name: device.street_name || inspection.street_name,
            status_date: inspection.status_date,
            bbl: inspection.bbl || device.bbl,
            device_name: device.device_name,
            total_inspections: device.total_inspections,
            latest_inspection_date: device.latest_inspection_date,
            defects_exist: inspection.defects_exist,
            filing_status: inspection.filing_status
          });
        }
      }
    }

    if (inspectionRecords.length > 0) {
      const { error } = await supabase
        .from('nyc_elevator_inspections')
        .upsert(inspectionRecords, {
          onConflict: 'device_number,status_date'
        });

      if (error) {
        console.error('❌ Error storing elevator inspections:', error);
      } else {
        console.log(`✅ Stored ${inspectionRecords.length} elevator inspection records`);
      }
    }
  }

  /**
   * Store boiler inspections
   */
  async storeBoilerInspections(nycPropertyId, boilerData) {
    console.log(`🔥 Storing ${boilerData.length} boiler devices...`);
    
    const inspectionRecords = [];
    
    for (const device of boilerData) {
      if (device.inspections && device.inspections.length > 0) {
        for (const inspection of device.inspections) {
          inspectionRecords.push({
            nyc_property_id: nycPropertyId,
            device_number: device.device_id || device.device_number,
            bin: device.bin || inspection.bin_number,
            boiler_type: inspection.boiler_type,
            inspection_date: inspection.inspection_date,
            inspection_result: inspection.inspection_result,
            next_inspection_date: inspection.next_inspection_date,
            property_type: inspection.property_type,
            borough: inspection.borough,
            house_number: inspection.house_number,
            street_name: inspection.street_name,
            tracking_number: inspection.tracking_number,
            boiler_id: inspection.boiler_id,
            report_type: inspection.report_type,
            boiler_make: inspection.boiler_make,
            pressure_type: inspection.pressure_type,
            defects_exist: inspection.defects_exist,
            lff_45_days: inspection.lff_45_days,
            lff_180_days: inspection.lff_180_days,
            filing_fee: inspection.filing_fee,
            total_amount_paid: inspection.total_amount_paid,
            report_status: inspection.report_status,
            boiler_model: inspection.boiler_model,
            bbl: inspection.bbl
          });
        }
      }
    }

    if (inspectionRecords.length > 0) {
      const { error } = await supabase
        .from('nyc_boiler_inspections')
        .upsert(inspectionRecords, {
          onConflict: 'device_number,inspection_date'
        });

      if (error) {
        console.error('❌ Error storing boiler inspections:', error);
      } else {
        console.log(`✅ Stored ${inspectionRecords.length} boiler inspection records`);
      }
    }
  }

  /**
   * Store electrical permits
   */
  async storeElectricalPermits(nycPropertyId, electricalData) {
    console.log(`⚡ Storing ${electricalData.length} electrical permits...`);
    
    const permitRecords = [];
    
    for (const permit of electricalData) {
      if (permit.inspections && permit.inspections.length > 0) {
        for (const filing of permit.inspections) {
          permitRecords.push({
            nyc_property_id: nycPropertyId,
            permit_number: permit.device_id || permit.permit_number,
            bin: filing.bin || permit.bin,
            permit_issued_date: filing.filing_date || filing.permit_issued_date,
            permit_type: filing.permit_type,
            work_type: filing.work_type,
            filing_status: filing.filing_status,
            completion_date: filing.completion_date,
            house_number: filing.house_number,
            street_name: filing.street_name,
            borough: filing.borough,
            zip_code: filing.zip_code,
            filing_number: filing.filing_number,
            filing_date: filing.filing_date,
            job_description: filing.job_description,
            applicant_first_name: filing.applicant_first_name,
            applicant_last_name: filing.applicant_last_name,
            amount_paid: filing.amount_paid,
            bbl: filing.bbl
          });
        }
      }
    }

    if (permitRecords.length > 0) {
      const { error } = await supabase
        .from('nyc_electrical_permits')
        .upsert(permitRecords, {
          onConflict: 'permit_number'
        });

      if (error) {
        console.error('❌ Error storing electrical permits:', error);
      } else {
        console.log(`✅ Stored ${permitRecords.length} electrical permit records`);
      }
    }
  }

  /**
   * Create compliance summary record
   */
  async createComplianceSummary(nycPropertyId, complianceData) {
    console.log('📊 Creating compliance summary...');
    
    const summaryData = {
      nyc_property_id: nycPropertyId,
      compliance_score: Math.round(complianceData.overall_compliance_score || 0),
      risk_level: this.calculateRiskLevel(complianceData.overall_compliance_score),
      total_violations: (complianceData.hpd_violations_total || 0) + (complianceData.dob_violations_total || 0),
      open_violations: (complianceData.hpd_violations_active || 0) + (complianceData.dob_violations_active || 0),
      dob_violations: complianceData.dob_violations_total || 0,
      hpd_violations: complianceData.hpd_violations_total || 0,
      equipment_issues: (complianceData.elevator_devices_total || 0) + (complianceData.boiler_devices_total || 0),
      open_311_complaints: 0, // Not available in current data
      fire_safety_issues: 0, // Not available in current data
      last_analyzed_at: new Date().toISOString(),
      hpd_compliance_score: complianceData.hpd_compliance_score || 100.0,
      dob_compliance_score: complianceData.dob_compliance_score || 100.0,
      elevator_compliance_score: complianceData.elevator_compliance_score || 100.0,
      electrical_compliance_score: complianceData.electrical_compliance_score || 100.0,
      overall_compliance_score: complianceData.overall_compliance_score || 100.0,
      hpd_violations_total: complianceData.hpd_violations_total || 0,
      hpd_violations_active: complianceData.hpd_violations_active || 0,
      dob_violations_total: complianceData.dob_violations_total || 0,
      dob_violations_active: complianceData.dob_violations_active || 0,
      elevator_devices_total: complianceData.elevator_devices_total || 0,
      elevator_devices_active: complianceData.elevator_devices_active || 0,
      boiler_devices_total: complianceData.boiler_devices_total || 0,
      electrical_permits_total: complianceData.electrical_permits_total || 0,
      electrical_permits_active: complianceData.electrical_permits_active || 0,
      hpd_violations_data: complianceData.hpd_violations_data || '[]',
      dob_violations_data: complianceData.dob_violations_data || '[]',
      elevator_data: complianceData.elevator_data || '[]',
      boiler_data: complianceData.boiler_data || '[]',
      electrical_data: complianceData.electrical_data || '[]',
      processed_at: new Date().toISOString(),
      data_sources: complianceData.data_sources || 'NYC_Open_Data,NYC_Planning_GeoSearch'
    };

    const { error } = await supabase
      .from('nyc_compliance_summary')
      .upsert(summaryData, {
        onConflict: 'nyc_property_id'
      });

    if (error) {
      console.error('❌ Error creating compliance summary:', error);
    } else {
      console.log('✅ Compliance summary created');
    }
  }

  /**
   * Calculate risk level based on compliance score
   */
  calculateRiskLevel(score) {
    if (score >= 90) return 'LOW';
    if (score >= 70) return 'MEDIUM';
    if (score >= 50) return 'HIGH';
    return 'CRITICAL';
  }
}

export default new RealNYCDataService();
