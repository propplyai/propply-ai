#!/usr/bin/env node
/**
 * Test script to verify NYC data integration
 * This script tests the Python compliance system integration
 */

const { spawn } = require('child_process');
const path = require('path');

async function testNYCIntegration() {
  console.log('🧪 Testing NYC Data Integration');
  console.log('=' * 50);
  
  const testAddress = '140 West 28th Street, New York, NY 10001';
  
  try {
    console.log(`📍 Testing address: ${testAddress}`);
    console.log('🐍 Running Python compliance script...');
    
    const pythonProcess = spawn('python3', [
      './complianceNYC.py',
      testAddress,
      'Manhattan'
    ]);

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.log('Python output:', text);
    });

    pythonProcess.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      console.error('Python error:', text);
    });

    pythonProcess.on('close', (code) => {
      console.log(`\n🐍 Python process exited with code: ${code}`);
      
      if (code === 0) {
        console.log('✅ Python script completed successfully');
        
        // Try to parse JSON output
        try {
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
            console.log('📊 Compliance Data Summary:');
            console.log(`   Address: ${complianceData.address}`);
            console.log(`   BIN: ${complianceData.bin}`);
            console.log(`   BBL: ${complianceData.bbl}`);
            console.log(`   Borough: ${complianceData.borough}`);
            console.log(`   Overall Score: ${complianceData.overall_compliance_score}/100`);
            console.log(`   HPD Violations: ${complianceData.hpd_violations_total} total, ${complianceData.hpd_violations_active} active`);
            console.log(`   DOB Violations: ${complianceData.dob_violations_total} total, ${complianceData.dob_violations_active} active`);
            console.log(`   Elevator Devices: ${complianceData.elevator_devices_total} total, ${complianceData.elevator_devices_active} active`);
            console.log(`   Boiler Devices: ${complianceData.boiler_devices_total} total`);
            console.log(`   Electrical Permits: ${complianceData.electrical_permits_total} total, ${complianceData.electrical_permits_active} active`);
            
            console.log('\n✅ NYC Data Integration Test PASSED');
            console.log('🎯 Real NYC data is being fetched successfully!');
          } else {
            console.log('⚠️ No JSON output found in Python script');
            console.log('📝 Full output:', output);
          }
        } catch (parseError) {
          console.error('❌ Error parsing Python output:', parseError);
          console.log('📝 Raw output:', output);
        }
      } else {
        console.error(`❌ Python script failed with code ${code}`);
        console.error('Error output:', errorOutput);
        console.log('📝 Full output:', output);
      }
    });

    pythonProcess.on('error', (error) => {
      console.error('❌ Failed to start Python process:', error);
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testNYCIntegration().catch(console.error);
