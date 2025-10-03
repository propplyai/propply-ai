/**
 * Real-Time Data Service
 * 
 * Handles real-time data synchronization between Supabase and frontend components
 * Provides live updates for compliance data, violations, and equipment status
 */

import { supabase } from '../config/supabase';

class RealTimeDataService {
  constructor() {
    this.subscriptions = new Map();
    this.listeners = new Map();
  }

  /**
   * Subscribe to real-time compliance data for a property
   * @param {string} propertyId - Property UUID
   * @param {Function} callback - Callback function for data updates
   * @returns {Function} Unsubscribe function
   */
  subscribeToPropertyCompliance(propertyId, callback) {
    const subscriptionKey = `property_${propertyId}`;
    
    // Store callback
    this.listeners.set(subscriptionKey, callback);
    
    // Subscribe to compliance summary changes
    const complianceSubscription = supabase
      .channel(`compliance_${propertyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nyc_compliance_summary',
          filter: `nyc_property_id=in.(${propertyId})`
        },
        (payload) => {
          console.log('📊 Compliance data updated:', payload);
          this.handleComplianceUpdate(propertyId, payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nyc_dob_violations',
          filter: `nyc_property_id=in.(${propertyId})`
        },
        (payload) => {
          console.log('🚨 DOB violations updated:', payload);
          this.handleViolationsUpdate(propertyId, 'dob', payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nyc_hpd_violations',
          filter: `nyc_property_id=in.(${propertyId})`
        },
        (payload) => {
          console.log('🏠 HPD violations updated:', payload);
          this.handleViolationsUpdate(propertyId, 'hpd', payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nyc_elevator_inspections',
          filter: `nyc_property_id=in.(${propertyId})`
        },
        (payload) => {
          console.log('🏢 Elevator data updated:', payload);
          this.handleEquipmentUpdate(propertyId, 'elevators', payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nyc_boiler_inspections',
          filter: `nyc_property_id=in.(${propertyId})`
        },
        (payload) => {
          console.log('🔥 Boiler data updated:', payload);
          this.handleEquipmentUpdate(propertyId, 'boilers', payload);
        }
      )
      .subscribe();

    // Store subscription
    this.subscriptions.set(subscriptionKey, complianceSubscription);

    // Return unsubscribe function
    return () => {
      this.unsubscribeFromPropertyCompliance(propertyId);
    };
  }

  /**
   * Subscribe to compliance reports for a user
   * @param {string} userId - User UUID
   * @param {Function} callback - Callback function for report updates
   * @returns {Function} Unsubscribe function
   */
  subscribeToUserReports(userId, callback) {
    const subscriptionKey = `user_reports_${userId}`;
    
    // Store callback
    this.listeners.set(subscriptionKey, callback);
    
    // Subscribe to compliance reports changes
    const reportsSubscription = supabase
      .channel(`reports_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'compliance_reports',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('📋 Reports updated:', payload);
          this.handleReportsUpdate(userId, payload);
        }
      )
      .subscribe();

    // Store subscription
    this.subscriptions.set(subscriptionKey, reportsSubscription);

    // Return unsubscribe function
    return () => {
      this.unsubscribeFromUserReports(userId);
    };
  }

  /**
   * Subscribe to dashboard overview data
   * @param {string} userId - User UUID
   * @param {Function} callback - Callback function for dashboard updates
   * @returns {Function} Unsubscribe function
   */
  subscribeToDashboard(userId, callback) {
    const subscriptionKey = `dashboard_${userId}`;
    
    // Store callback
    this.listeners.set(subscriptionKey, callback);
    
    // Subscribe to multiple tables for dashboard data
    const dashboardSubscription = supabase
      .channel(`dashboard_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'properties',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('🏢 Properties updated:', payload);
          this.handleDashboardUpdate(userId, 'properties', payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'compliance_reports',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('📊 Reports updated:', payload);
          this.handleDashboardUpdate(userId, 'reports', payload);
        }
      )
      .subscribe();

    // Store subscription
    this.subscriptions.set(subscriptionKey, dashboardSubscription);

    // Return unsubscribe function
    return () => {
      this.unsubscribeFromDashboard(userId);
    };
  }

  /**
   * Handle compliance summary updates
   */
  async handleComplianceUpdate(propertyId, payload) {
    try {
      // Fetch updated compliance data
      const response = await fetch(`/api/properties/${propertyId}/compliance-data`);
      const result = await response.json();
      
      if (result.success) {
        const callback = this.listeners.get(`property_${propertyId}`);
        if (callback) {
          callback({
            type: 'compliance_update',
            data: result,
            payload
          });
        }
      }
    } catch (error) {
      console.error('Error handling compliance update:', error);
    }
  }

  /**
   * Handle violations updates
   */
  async handleViolationsUpdate(propertyId, violationType, payload) {
    try {
      const callback = this.listeners.get(`property_${propertyId}`);
      if (callback) {
        callback({
          type: 'violations_update',
          violationType,
          payload
        });
      }
    } catch (error) {
      console.error('Error handling violations update:', error);
    }
  }

  /**
   * Handle equipment updates
   */
  async handleEquipmentUpdate(propertyId, equipmentType, payload) {
    try {
      const callback = this.listeners.get(`property_${propertyId}`);
      if (callback) {
        callback({
          type: 'equipment_update',
          equipmentType,
          payload
        });
      }
    } catch (error) {
      console.error('Error handling equipment update:', error);
    }
  }

  /**
   * Handle reports updates
   */
  async handleReportsUpdate(userId, payload) {
    try {
      const callback = this.listeners.get(`user_reports_${userId}`);
      if (callback) {
        callback({
          type: 'reports_update',
          payload
        });
      }
    } catch (error) {
      console.error('Error handling reports update:', error);
    }
  }

  /**
   * Handle dashboard updates
   */
  async handleDashboardUpdate(userId, dataType, payload) {
    try {
      const callback = this.listeners.get(`dashboard_${userId}`);
      if (callback) {
        callback({
          type: 'dashboard_update',
          dataType,
          payload
        });
      }
    } catch (error) {
      console.error('Error handling dashboard update:', error);
    }
  }

  /**
   * Unsubscribe from property compliance updates
   */
  unsubscribeFromPropertyCompliance(propertyId) {
    const subscriptionKey = `property_${propertyId}`;
    const subscription = this.subscriptions.get(subscriptionKey);
    
    if (subscription) {
      supabase.removeChannel(subscription);
      this.subscriptions.delete(subscriptionKey);
    }
    
    this.listeners.delete(subscriptionKey);
  }

  /**
   * Unsubscribe from user reports updates
   */
  unsubscribeFromUserReports(userId) {
    const subscriptionKey = `user_reports_${userId}`;
    const subscription = this.subscriptions.get(subscriptionKey);
    
    if (subscription) {
      supabase.removeChannel(subscription);
      this.subscriptions.delete(subscriptionKey);
    }
    
    this.listeners.delete(subscriptionKey);
  }

  /**
   * Unsubscribe from dashboard updates
   */
  unsubscribeFromDashboard(userId) {
    const subscriptionKey = `dashboard_${userId}`;
    const subscription = this.subscriptions.get(subscriptionKey);
    
    if (subscription) {
      supabase.removeChannel(subscription);
      this.subscriptions.delete(subscriptionKey);
    }
    
    this.listeners.delete(subscriptionKey);
  }

  /**
   * Clean up all subscriptions
   */
  cleanup() {
    this.subscriptions.forEach((subscription) => {
      supabase.removeChannel(subscription);
    });
    this.subscriptions.clear();
    this.listeners.clear();
  }

  /**
   * Get real-time compliance data for a property
   * @param {string} propertyId - Property UUID
   * @returns {Promise<Object>} Compliance data
   */
  async getPropertyComplianceData(propertyId) {
    try {
      const response = await fetch(`/api/properties/${propertyId}/compliance-data`);
      const result = await response.json();
      
      if (result.success) {
        return result;
      } else {
        throw new Error(result.error || 'Failed to fetch compliance data');
      }
    } catch (error) {
      console.error('Error fetching property compliance data:', error);
      throw error;
    }
  }

  /**
   * Sync property data with city APIs
   * @param {string} propertyId - Property UUID
   * @returns {Promise<Object>} Sync result
   */
  async syncPropertyData(propertyId) {
    try {
      const response = await fetch(`/api/properties/${propertyId}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        return result;
      } else {
        throw new Error(result.error || 'Failed to sync property data');
      }
    } catch (error) {
      console.error('Error syncing property data:', error);
      throw error;
    }
  }

  /**
   * Get dashboard overview data
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} Dashboard data
   */
  async getDashboardOverview(userId) {
    try {
      const response = await fetch(`/api/dashboard/overview?user_id=${userId}`);
      const result = await response.json();
      
      if (result.success) {
        return result;
      } else {
        throw new Error(result.error || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      throw error;
    }
  }
}

// Create singleton instance
const realTimeDataService = new RealTimeDataService();

export default realTimeDataService;
