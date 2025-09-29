// Philadelphia Inspection Automation Service
// Handles automated deadline tracking, status updates, and Philadelphia Open Data integration

class PhillyInspectionAutomationService {
  constructor(supabase) {
    this.supabase = supabase;
    this.phillyApiBase = 'https://www.opendataphilly.org';
    this.datasets = {
      buildingPermits: 'building-permits',
      buildingViolations: 'building-violations', 
      propertyAssessments: 'property-assessments',
      fireInspections: 'fire-inspections',
      housingViolations: 'housing-violations',
      zoning: 'zoning'
    };
  }

  // Main automation runner - call this periodically
  async runAutomatedTasks() {
    try {
      console.log('Starting Philadelphia automation tasks...');
      
      await Promise.all([
        this.checkUpcomingDeadlines(),
        this.syncPhillyData(),
        this.generateNotifications(),
        this.updateComplianceScores()
      ]);
      
      console.log('Philadelphia automation tasks completed');
    } catch (error) {
      console.error('Error in Philadelphia automation tasks:', error);
    }
  }

  // Check for upcoming compliance deadlines
  async checkUpcomingDeadlines() {
    try {
      const { data: properties, error } = await this.supabase
        .from('properties')
        .select('*')
        .eq('city', 'Philadelphia');

      if (error) throw error;

      for (const property of properties) {
        await this.checkPropertyDeadlines(property);
      }
    } catch (error) {
      console.error('Error checking Philadelphia deadlines:', error);
    }
  }

  async checkPropertyDeadlines(property) {
    try {
      // Get compliance systems for this property
      const { data: complianceSystems, error } = await this.supabase
        .from('property_compliance_systems')
        .select(`
          *,
          compliance_systems (*)
        `)
        .eq('property_id', property.id)
        .eq('is_active', true);

      if (error) throw error;

      for (const system of complianceSystems) {
        const nextDeadline = this.calculateNextDeadline(system.compliance_systems);
        
        if (this.isDeadlineApproaching(nextDeadline)) {
          await this.createDeadlineNotification(property, system, nextDeadline);
        }
      }
    } catch (error) {
      console.error(`Error checking deadlines for ${property.address}:`, error);
    }
  }

  calculateNextDeadline(complianceSystem) {
    const now = new Date();
    const frequency = complianceSystem.frequency;
    
    switch (frequency) {
      case 'Annual':
        return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      case 'Biannual':
        return new Date(now.getFullYear(), now.getMonth() + 6, now.getDate());
      case 'Quarterly':
        return new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
      case 'Monthly':
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      default:
        return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    }
  }

  isDeadlineApproaching(deadline, daysThreshold = 30) {
    const now = new Date();
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= daysThreshold && diffDays > 0;
  }

  async createDeadlineNotification(property, complianceSystem, deadline) {
    try {
      const { error } = await this.supabase
        .from('property_todos')
        .insert({
          property_id: property.id,
          title: `${complianceSystem.compliance_systems.name} Due Soon`,
          description: `${complianceSystem.compliance_systems.name} is due on ${deadline.toDateString()}. Estimated cost: $${complianceSystem.compliance_systems.estimated_cost_min} - $${complianceSystem.compliance_systems.estimated_cost_max}`,
          priority: 'high',
          status: 'pending',
          due_date: deadline.toISOString(),
          category: 'compliance_deadline',
          source: 'automation'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating deadline notification:', error);
    }
  }

  // Sync with Philadelphia Open Data for historical inspection records
  async syncPhillyData() {
    try {
      // Get all Philadelphia properties that need data sync
      const { data: properties, error } = await this.supabase
        .from('properties')
        .select('*')
        .eq('city', 'Philadelphia');

      if (error) throw error;

      for (const property of properties) {
        await this.syncPropertyWithPhillyData(property);
      }
    } catch (error) {
      console.error('Error syncing Philadelphia data:', error);
    }
  }

  async syncPropertyWithPhillyData(property) {
    try {
      // Extract address components for Philadelphia API lookup
      const addressComponents = this.parseAddress(property.address);
      
      if (!addressComponents.houseNumber || !addressComponents.streetName) {
        console.log(`Skipping ${property.address} - insufficient address data`);
        return;
      }

      // Fetch various Philadelphia datasets
      await Promise.all([
        this.fetchBuildingPermits(property, addressComponents),
        this.fetchBuildingViolations(property, addressComponents),
        this.fetchFireInspections(property, addressComponents),
        this.fetchHousingViolations(property, addressComponents),
        this.fetchPropertyAssessments(property, addressComponents)
      ]);

    } catch (error) {
      console.error(`Error syncing Philadelphia data for ${property.address}:`, error);
    }
  }

  // Fetch L&I Building Permits
  async fetchBuildingPermits(property, addressComponents) {
    try {
      const url = `${this.phillyApiBase}/dataset/${this.datasets.buildingPermits}.json`;
      const params = new URLSearchParams({
        '$where': `address ILIKE '%${addressComponents.houseNumber}%${addressComponents.streetName}%'`,
        '$limit': 100
      });

      const response = await fetch(`${url}?${params}`);
      const permits = await response.json();

      // Store permits in database
      for (const permit of permits) {
        await this.storePermitRecord(property.id, permit);
      }
    } catch (error) {
      console.error('Error fetching building permits:', error);
    }
  }

  // Fetch L&I Building Violations
  async fetchBuildingViolations(property, addressComponents) {
    try {
      const url = `${this.phillyApiBase}/dataset/${this.datasets.buildingViolations}.json`;
      const params = new URLSearchParams({
        '$where': `address ILIKE '%${addressComponents.houseNumber}%${addressComponents.streetName}%'`,
        '$limit': 100
      });

      const response = await fetch(`${url}?${params}`);
      const violations = await response.json();

      // Store violations in database
      for (const violation of violations) {
        await this.storeViolationRecord(property.id, violation);
      }
    } catch (error) {
      console.error('Error fetching building violations:', error);
    }
  }

  // Fetch Fire Department Inspections
  async fetchFireInspections(property, addressComponents) {
    try {
      const url = `${this.phillyApiBase}/dataset/${this.datasets.fireInspections}.json`;
      const params = new URLSearchParams({
        '$where': `address ILIKE '%${addressComponents.houseNumber}%${addressComponents.streetName}%'`,
        '$limit': 100
      });

      const response = await fetch(`${url}?${params}`);
      const inspections = await response.json();

      // Store inspections in database
      for (const inspection of inspections) {
        await this.storeInspectionRecord(property.id, inspection);
      }
    } catch (error) {
      console.error('Error fetching fire inspections:', error);
    }
  }

  // Fetch Housing Code Violations
  async fetchHousingViolations(property, addressComponents) {
    try {
      const url = `${this.phillyApiBase}/dataset/${this.datasets.housingViolations}.json`;
      const params = new URLSearchParams({
        '$where': `address ILIKE '%${addressComponents.houseNumber}%${addressComponents.streetName}%'`,
        '$limit': 100
      });

      const response = await fetch(`${url}?${params}`);
      const violations = await response.json();

      // Store housing violations in database
      for (const violation of violations) {
        await this.storeHousingViolationRecord(property.id, violation);
      }
    } catch (error) {
      console.error('Error fetching housing violations:', error);
    }
  }

  // Fetch Property Assessments
  async fetchPropertyAssessments(property, addressComponents) {
    try {
      const url = `${this.phillyApiBase}/dataset/${this.datasets.propertyAssessments}.json`;
      const params = new URLSearchParams({
        '$where': `address ILIKE '%${addressComponents.houseNumber}%${addressComponents.streetName}%'`,
        '$limit': 10
      });

      const response = await fetch(`${url}?${params}`);
      const assessments = await response.json();

      // Update property with assessment data
      if (assessments.length > 0) {
        const assessment = assessments[0];
        await this.updatePropertyAssessment(property.id, assessment);
      }
    } catch (error) {
      console.error('Error fetching property assessments:', error);
    }
  }

  // Store permit record in database
  async storePermitRecord(propertyId, permit) {
    try {
      const { error } = await this.supabase
        .from('philly_permits')
        .upsert({
          property_id: propertyId,
          permit_number: permit.permit_number,
          permit_type: permit.permit_type,
          permit_issued_date: permit.permitissuedate,
          work_type: permit.work_type,
          contractor: permit.contractor,
          address: permit.address,
          raw_data: permit
        }, {
          onConflict: 'property_id,permit_number'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error storing permit record:', error);
    }
  }

  // Store violation record in database
  async storeViolationRecord(propertyId, violation) {
    try {
      const { error } = await this.supabase
        .from('philly_violations')
        .upsert({
          property_id: propertyId,
          violation_number: violation.violation_number,
          violation_date: violation.violation_date,
          violation_type: violation.violation_type,
          status: violation.status,
          description: violation.description,
          address: violation.address,
          raw_data: violation
        }, {
          onConflict: 'property_id,violation_number'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error storing violation record:', error);
    }
  }

  // Store inspection record in database
  async storeInspectionRecord(propertyId, inspection) {
    try {
      const { error } = await this.supabase
        .from('philly_inspections')
        .upsert({
          property_id: propertyId,
          inspection_date: inspection.inspection_date,
          inspection_type: inspection.inspection_type,
          result: inspection.result,
          inspector: inspection.inspector,
          address: inspection.address,
          raw_data: inspection
        }, {
          onConflict: 'property_id,inspection_date,inspection_type'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error storing inspection record:', error);
    }
  }

  // Store housing violation record in database
  async storeHousingViolationRecord(propertyId, violation) {
    try {
      const { error } = await this.supabase
        .from('philly_housing_violations')
        .upsert({
          property_id: propertyId,
          violation_number: violation.violation_number,
          violation_date: violation.violation_date,
          violation_type: violation.violation_type,
          status: violation.status,
          description: violation.description,
          address: violation.address,
          raw_data: violation
        }, {
          onConflict: 'property_id,violation_number'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error storing housing violation record:', error);
    }
  }

  // Update property with assessment data
  async updatePropertyAssessment(propertyId, assessment) {
    try {
      const { error } = await this.supabase
        .from('properties')
        .update({
          market_value: assessment.market_value,
          assessed_value: assessment.assessed_value,
          land_area: assessment.land_area,
          building_area: assessment.building_area,
          year_built: assessment.year_built,
          zoning: assessment.zoning,
          use_code: assessment.use_code,
          opa_account: assessment.opa_account,
          updated_at: new Date().toISOString()
        })
        .eq('id', propertyId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating property assessment:', error);
    }
  }

  // Generate automated notifications
  async generateNotifications() {
    try {
      // Get properties with recent violations
      const { data: violations, error: violationsError } = await this.supabase
        .from('philly_violations')
        .select(`
          *,
          properties (*)
        `)
        .eq('status', 'open')
        .gte('violation_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (violationsError) throw violationsError;

      for (const violation of violations) {
        await this.createViolationNotification(violation);
      }

      // Get properties with upcoming permit expirations
      const { data: permits, error: permitsError } = await this.supabase
        .from('philly_permits')
        .select(`
          *,
          properties (*)
        `)
        .gte('permit_issued_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

      if (permitsError) throw permitsError;

      for (const permit of permits) {
        await this.createPermitNotification(permit);
      }
    } catch (error) {
      console.error('Error generating notifications:', error);
    }
  }

  async createViolationNotification(violation) {
    try {
      const { error } = await this.supabase
        .from('property_todos')
        .insert({
          property_id: violation.property_id,
          title: `Open Violation: ${violation.violation_type}`,
          description: `Violation #${violation.violation_number}: ${violation.description}. Status: ${violation.status}`,
          priority: 'high',
          status: 'pending',
          category: 'violation',
          source: 'automation'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating violation notification:', error);
    }
  }

  async createPermitNotification(permit) {
    try {
      const { error } = await this.supabase
        .from('property_todos')
        .insert({
          property_id: permit.property_id,
          title: `Recent Permit: ${permit.permit_type}`,
          description: `Permit #${permit.permit_number} for ${permit.work_type} issued on ${permit.permit_issued_date}`,
          priority: 'medium',
          status: 'pending',
          category: 'permit',
          source: 'automation'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating permit notification:', error);
    }
  }

  // Update compliance scores based on Philadelphia data
  async updateComplianceScores() {
    try {
      const { data: properties, error } = await this.supabase
        .from('properties')
        .select('*')
        .eq('city', 'Philadelphia');

      if (error) throw error;

      for (const property of properties) {
        await this.calculateComplianceScore(property);
      }
    } catch (error) {
      console.error('Error updating compliance scores:', error);
    }
  }

  async calculateComplianceScore(property) {
    try {
      // Get violation counts
      const { data: violations, error: violationsError } = await this.supabase
        .from('philly_violations')
        .select('*')
        .eq('property_id', property.id)
        .eq('status', 'open');

      if (violationsError) throw violationsError;

      // Get housing violation counts
      const { data: housingViolations, error: housingError } = await this.supabase
        .from('philly_housing_violations')
        .select('*')
        .eq('property_id', property.id)
        .eq('status', 'open');

      if (housingError) throw housingError;

      // Calculate score (start at 100, deduct for violations)
      let score = 100;
      score -= violations.length * 5; // -5 per building violation
      score -= housingViolations.length * 3; // -3 per housing violation
      score = Math.max(0, score); // Don't go below 0

      // Update property compliance score
      const { error: updateError } = await this.supabase
        .from('properties')
        .update({
          compliance_score: score,
          updated_at: new Date().toISOString()
        })
        .eq('id', property.id);

      if (updateError) throw updateError;
    } catch (error) {
      console.error(`Error calculating compliance score for ${property.address}:`, error);
    }
  }

  // Parse address into components
  parseAddress(address) {
    const parts = address.split(',');
    const streetPart = parts[0].trim();
    const streetMatch = streetPart.match(/^(\d+)\s+(.+)$/);
    
    return {
      houseNumber: streetMatch ? streetMatch[1] : null,
      streetName: streetMatch ? streetMatch[2] : streetPart,
      city: 'Philadelphia',
      state: 'PA'
    };
  }
}

export default PhillyInspectionAutomationService;

