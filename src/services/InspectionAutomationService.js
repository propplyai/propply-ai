// Inspection Automation Service
// Handles automated deadline tracking, status updates, and NYC Open Data integration

class InspectionAutomationService {
  constructor(supabase) {
    this.supabase = supabase;
    this.nycApiBase = 'https://data.cityofnewyork.us/resource';
  }

  // Main automation runner - call this periodically
  async runAutomatedTasks() {
    try {
      console.log('Running inspection automation tasks...');
      
      await this.updateInspectionStatuses();
      await this.generateNotifications();
      await this.syncNYCData();
      
      console.log('Automation tasks completed successfully');
    } catch (error) {
      console.error('Error running automation tasks:', error);
    }
  }

  // Update inspection statuses based on due dates
  async updateInspectionStatuses() {
    try {
      const { data: inspections, error } = await this.supabase
        .from('inspections')
        .select('*')
        .in('status', ['Scheduled', 'Due Soon']);

      if (error) throw error;

      const today = new Date();
      const updates = [];

      for (const inspection of inspections) {
        const dueDate = new Date(inspection.next_due_date);
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        let newStatus = inspection.status;
        let newUrgencyLevel = inspection.urgency_level;

        if (daysUntilDue < 0) {
          newStatus = 'Overdue';
          newUrgencyLevel = 'Critical';
        } else if (daysUntilDue <= 7) {
          newStatus = 'Due Soon';
          newUrgencyLevel = 'High';
        } else if (daysUntilDue <= 30) {
          newUrgencyLevel = 'Medium';
        } else {
          newUrgencyLevel = 'Normal';
        }

        if (newStatus !== inspection.status || newUrgencyLevel !== inspection.urgency_level) {
          updates.push({
            id: inspection.id,
            status: newStatus,
            urgency_level: newUrgencyLevel
          });
        }
      }

      // Batch update inspections
      if (updates.length > 0) {
        for (const update of updates) {
          await this.supabase
            .from('inspections')
            .update({
              status: update.status,
              urgency_level: update.urgency_level
            })
            .eq('id', update.id);
        }
        
        console.log(`Updated ${updates.length} inspection statuses`);
      }

    } catch (error) {
      console.error('Error updating inspection statuses:', error);
    }
  }

  // Generate automated notifications for due inspections
  async generateNotifications() {
    try {
      const { data: inspections, error } = await this.supabase
        .from('inspections')
        .select(`
          *,
          properties (
            address,
            owner_email,
            contact
          )
        `)
        .in('status', ['Due Soon', 'Overdue'])
        .eq('reminder_sent', false);

      if (error) throw error;

      const notifications = [];

      for (const inspection of inspections) {
        const dueDate = new Date(inspection.next_due_date);
        const daysUntilDue = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
        
        let priority = 'Medium';
        let title = '';
        let message = '';

        if (daysUntilDue < 0) {
          priority = 'Urgent';
          title = `OVERDUE: ${inspection.inspection_type}`;
          message = `${inspection.inspection_type} at ${inspection.properties.address} is ${Math.abs(daysUntilDue)} days overdue. Immediate action required.`;
        } else if (daysUntilDue <= 7) {
          priority = 'High';
          title = `Due Soon: ${inspection.inspection_type}`;
          message = `${inspection.inspection_type} at ${inspection.properties.address} is due in ${daysUntilDue} days. Please schedule immediately.`;
        }

        if (title) {
          notifications.push({
            property_id: inspection.property_id,
            type: 'inspection_due',
            title,
            message,
            priority,
            action_required: true,
            action_url: `/inspections/${inspection.id}`
          });

          // Mark reminder as sent
          await this.supabase
            .from('inspections')
            .update({ reminder_sent: true })
            .eq('id', inspection.id);
        }
      }

      // Insert notifications
      if (notifications.length > 0) {
        const { error: notificationError } = await this.supabase
          .from('notifications')
          .insert(notifications);

        if (notificationError) throw notificationError;
        
        console.log(`Generated ${notifications.length} notifications`);
      }

    } catch (error) {
      console.error('Error generating notifications:', error);
    }
  }

  // Sync with NYC Open Data for historical inspection records
  async syncNYCData() {
    try {
      // Get all properties that need NYC data sync
      const { data: properties, error } = await this.supabase
        .from('properties')
        .select('*');

      if (error) throw error;

      for (const property of properties) {
        await this.syncPropertyWithNYCData(property);
      }

    } catch (error) {
      console.error('Error syncing NYC data:', error);
    }
  }

  async syncPropertyWithNYCData(property) {
    try {
      // Extract address components for NYC API lookup
      const addressComponents = this.parseAddress(property.address);
      
      if (!addressComponents.houseNumber || !addressComponents.streetName) {
        console.log(`Skipping ${property.address} - insufficient address data`);
        return;
      }

      // Fetch various NYC datasets
      await Promise.all([
        this.fetchDOBInspections(property, addressComponents),
        this.fetchFDNYInspections(property, addressComponents),
        this.fetchDOHInspections(property, addressComponents),
        this.fetchViolations(property, addressComponents)
      ]);

    } catch (error) {
      console.error(`Error syncing NYC data for ${property.address}:`, error);
    }
  }

  // Fetch DOB (Department of Buildings) inspections
  async fetchDOBInspections(property, addressComponents) {
    try {
      const url = `${this.nycApiBase}/83x8-shf7.json?` + 
        `house_number=${encodeURIComponent(addressComponents.houseNumber)}&` +
        `street_name=${encodeURIComponent(addressComponents.streetName)}`;

      const response = await fetch(url);
      if (!response.ok) return;

      const data = await response.json();
      
      for (const record of data.slice(0, 10)) { // Limit to recent records
        if (record.inspection_date) {
          await this.createOrUpdateInspectionFromNYC(property.id, {
            inspection_type: 'DOB Building Inspection',
            compliance_system: 'building_systems',
            category: 'Building Systems',
            required_by: 'DOB',
            completed_date: record.inspection_date,
            last_completed_date: record.inspection_date,
            status: 'Completed',
            results: {
              disposition: record.disposition,
              inspection_category: record.inspection_category,
              unit: record.unit
            },
            violations_found: record.violation_count || 0,
            notes: `NYC DOB Inspection - ${record.disposition || 'No disposition'}`
          });
        }
      }

    } catch (error) {
      console.error('Error fetching DOB inspections:', error);
    }
  }

  // Fetch FDNY (Fire Department) inspections
  async fetchFDNYInspections(property, addressComponents) {
    try {
      const url = `${this.nycApiBase}/tb8h-3ar7.json?` + 
        `house_number=${encodeURIComponent(addressComponents.houseNumber)}&` +
        `street_name=${encodeURIComponent(addressComponents.streetName)}`;

      const response = await fetch(url);
      if (!response.ok) return;

      const data = await response.json();
      
      for (const record of data.slice(0, 10)) {
        if (record.inspection_date) {
          await this.createOrUpdateInspectionFromNYC(property.id, {
            inspection_type: 'FDNY Fire Safety Inspection',
            compliance_system: 'fire_safety',
            category: 'Fire Safety',
            required_by: 'FDNY',
            completed_date: record.inspection_date,
            last_completed_date: record.inspection_date,
            status: 'Completed',
            results: {
              result: record.result,
              inspection_type: record.inspection_type
            },
            violations_found: record.violation_count || 0,
            notes: `NYC FDNY Inspection - ${record.result || 'No result'}`
          });
        }
      }

    } catch (error) {
      console.error('Error fetching FDNY inspections:', error);
    }
  }

  // Fetch DOH (Department of Health) inspections
  async fetchDOHInspections(property, addressComponents) {
    try {
      const url = `${this.nycApiBase}/xx67-kt59.json?` + 
        `house_number=${encodeURIComponent(addressComponents.houseNumber)}&` +
        `street_name=${encodeURIComponent(addressComponents.streetName)}`;

      const response = await fetch(url);
      if (!response.ok) return;

      const data = await response.json();
      
      for (const record of data.slice(0, 10)) {
        if (record.inspection_date) {
          await this.createOrUpdateInspectionFromNYC(property.id, {
            inspection_type: 'DOH Health Inspection',
            compliance_system: 'health_safety',
            category: 'Health & Safety',
            required_by: 'DOH',
            completed_date: record.inspection_date,
            last_completed_date: record.inspection_date,
            status: 'Completed',
            results: {
              grade: record.grade,
              score: record.score,
              critical_flag: record.critical_flag
            },
            violations_found: record.violation_count || 0,
            notes: `NYC DOH Inspection - Grade: ${record.grade || 'N/A'}`
          });
        }
      }

    } catch (error) {
      console.error('Error fetching DOH inspections:', error);
    }
  }

  // Fetch violations data
  async fetchViolations(property, addressComponents) {
    try {
      const url = `${this.nycApiBase}/wvxf-dwi5.json?` + 
        `house_number=${encodeURIComponent(addressComponents.houseNumber)}&` +
        `street_name=${encodeURIComponent(addressComponents.streetName)}`;

      const response = await fetch(url);
      if (!response.ok) return;

      const data = await response.json();
      
      for (const record of data.slice(0, 20)) { // More violations to track
        if (record.issue_date) {
          await this.createViolationFromNYC(property.id, {
            violation_code: record.violation_code,
            description: record.violation_description || record.violation_type,
            severity: this.mapViolationSeverity(record.violation_category),
            issued_date: record.issue_date,
            due_date: record.certification_date,
            resolved_date: record.certification_date,
            status: record.certification_date ? 'Resolved' : 'Open',
            fine_amount: record.penalty ? parseFloat(record.penalty) * 100 : null, // Convert to cents
            notes: `NYC Violation - ${record.violation_category || 'General'}`
          });
        }
      }

    } catch (error) {
      console.error('Error fetching violations:', error);
    }
  }

  async createOrUpdateInspectionFromNYC(propertyId, inspectionData) {
    try {
      // Check if inspection already exists
      const { data: existing } = await this.supabase
        .from('inspections')
        .select('id')
        .eq('property_id', propertyId)
        .eq('inspection_type', inspectionData.inspection_type)
        .eq('completed_date', inspectionData.completed_date)
        .single();

      if (existing) {
        // Update existing inspection
        await this.supabase
          .from('inspections')
          .update(inspectionData)
          .eq('id', existing.id);
      } else {
        // Create new inspection record
        await this.supabase
          .from('inspections')
          .insert({
            property_id: propertyId,
            ...inspectionData,
            frequency: 'Annual', // Default frequency
            estimated_cost_min: 25000, // Default cost estimates
            estimated_cost_max: 50000,
            urgency_level: 'Normal'
          });
      }

    } catch (error) {
      console.error('Error creating/updating inspection from NYC data:', error);
    }
  }

  async createViolationFromNYC(propertyId, violationData) {
    try {
      // Check if violation already exists
      const { data: existing } = await this.supabase
        .from('violations')
        .select('id')
        .eq('property_id', propertyId)
        .eq('violation_code', violationData.violation_code)
        .eq('issued_date', violationData.issued_date)
        .single();

      if (!existing) {
        await this.supabase
          .from('violations')
          .insert({
            property_id: propertyId,
            ...violationData
          });
      }

    } catch (error) {
      console.error('Error creating violation from NYC data:', error);
    }
  }

  parseAddress(address) {
    // Simple address parsing - can be enhanced with more sophisticated parsing
    const parts = address.split(',')[0].trim().split(' ');
    const houseNumber = parts[0];
    const streetName = parts.slice(1).join(' ');
    
    return {
      houseNumber: houseNumber.replace(/[^\d]/g, ''), // Extract numbers only
      streetName: streetName.replace(/[^\w\s]/g, '').trim() // Clean street name
    };
  }

  mapViolationSeverity(category) {
    if (!category) return 'Medium';
    
    const severityMap = {
      'IMMEDIATELY HAZARDOUS': 'Critical',
      'HAZARDOUS': 'High',
      'NON-HAZARDOUS': 'Medium',
      'ADMINISTRATIVE': 'Low'
    };
    
    return severityMap[category.toUpperCase()] || 'Medium';
  }

  // Calculate next due date based on frequency and last completion
  calculateNextDueDate(frequency, lastCompletedDate) {
    const date = new Date(lastCompletedDate || new Date());
    
    switch (frequency) {
      case 'Monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'Quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'Biannual':
        date.setMonth(date.getMonth() + 6);
        break;
      case 'Annual':
      default:
        date.setFullYear(date.getFullYear() + 1);
        break;
    }
    
    return date;
  }

  // Update property compliance scores based on recent inspections and violations
  async updateComplianceScores() {
    try {
      const { data: properties, error } = await this.supabase
        .from('properties')
        .select(`
          *,
          inspections (status, urgency_level),
          violations (status, severity)
        `);

      if (error) throw error;

      for (const property of properties) {
        const score = this.calculateComplianceScore(property);
        
        await this.supabase
          .from('properties')
          .update({ compliance_score: score })
          .eq('id', property.id);
      }

    } catch (error) {
      console.error('Error updating compliance scores:', error);
    }
  }

  calculateComplianceScore(property) {
    let score = 100;
    
    // Deduct points for overdue inspections
    const overdueInspections = property.inspections?.filter(i => i.status === 'Overdue') || [];
    score -= overdueInspections.length * 15;
    
    // Deduct points for due soon inspections
    const dueSoonInspections = property.inspections?.filter(i => i.status === 'Due Soon') || [];
    score -= dueSoonInspections.length * 5;
    
    // Deduct points for open violations
    const openViolations = property.violations?.filter(v => v.status === 'Open') || [];
    score -= openViolations.length * 10;
    
    // Deduct extra points for critical violations
    const criticalViolations = openViolations.filter(v => v.severity === 'Critical');
    score -= criticalViolations.length * 20;
    
    return Math.max(0, Math.min(100, score));
  }
}

export default InspectionAutomationService;
