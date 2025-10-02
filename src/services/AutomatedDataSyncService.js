/**
 * Automated Data Sync Service
 * Automatically syncs NYC/Philadelphia compliance data when properties are added
 */

import { supabase } from '../config/supabase';

class AutomatedDataSyncService {
  constructor() {
    this.syncQueue = new Set();
    this.isProcessing = false;
  }

  /**
   * Automatically sync data for a newly added property
   * @param {Object} property - The property object with id, address, city, etc.
   */
  async autoSyncProperty(property) {
    console.log(`🔄 Auto-syncing data for property: ${property.address}`);
    
    try {
      if (property.city === 'NYC') {
        await this.syncNYCProperty(property);
      } else if (property.city === 'Philadelphia') {
        await this.syncPhiladelphiaProperty(property);
      } else {
        console.log(`⚠️ Unknown city "${property.city}" - skipping auto-sync`);
      }
    } catch (error) {
      console.error('❌ Auto-sync failed:', error);
      // Don't throw - this shouldn't break property creation
    }
  }

  /**
   * Sync NYC compliance data for a property
   */
  async syncNYCProperty(property) {
    console.log(`🗽 Syncing NYC data for: ${property.address}`);
    
    try {
      // Call the backend API to sync NYC data
      const response = await fetch('/api/sync-nyc-property', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          property_id: property.id,
          address: property.address,
          bin: property.bin_number,
          bbl: property.opa_account
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ NYC data synced successfully');
        return result;
      } else {
        console.warn('⚠️ NYC sync completed with errors:', result.message);
        return result;
      }
    } catch (error) {
      console.error('❌ NYC sync failed:', error);
      
      // Fallback: Try to create basic NYC property record
      await this.createBasicNYCProperty(property);
      throw error;
    }
  }

  /**
   * Sync Philadelphia compliance data for a property
   */
  async syncPhiladelphiaProperty(property) {
    console.log(`🏛️ Syncing Philadelphia data for: ${property.address}`);
    
    try {
      // Call the backend API to sync Philly data
      const response = await fetch('/api/sync-philly-property', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          property_id: property.id,
          address: property.address,
          opa_account: property.opa_account
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Philadelphia data synced successfully');
        return result;
      } else {
        console.warn('⚠️ Philadelphia sync completed with errors:', result.message);
        return result;
      }
    } catch (error) {
      console.error('❌ Philadelphia sync failed:', error);
      throw error;
    }
  }

  /**
   * Create a basic NYC property record as fallback
   */
  async createBasicNYCProperty(property) {
    try {
      console.log('📝 Creating basic NYC property record...');
      
      const { data, error } = await supabase
        .from('nyc_properties')
        .insert({
          property_id: property.id,
          address: property.address,
          bin: property.bin_number,
          bbl: property.opa_account,
          borough: this.detectBorough(property.address),
          last_synced_at: new Date().toISOString()
        });

      if (error) throw error;
      
      console.log('✅ Basic NYC property record created');
      return data;
    } catch (error) {
      console.error('❌ Failed to create basic NYC property record:', error);
      throw error;
    }
  }

  /**
   * Detect borough from address
   */
  detectBorough(address) {
    const upperAddress = address.toUpperCase();
    if (upperAddress.includes('MANHATTAN') || upperAddress.includes('NYC')) return 'Manhattan';
    if (upperAddress.includes('BROOKLYN')) return 'Brooklyn';
    if (upperAddress.includes('QUEENS')) return 'Queens';
    if (upperAddress.includes('BRONX')) return 'Bronx';
    if (upperAddress.includes('STATEN')) return 'Staten Island';
    return 'Manhattan'; // Default
  }

  /**
   * Queue a property for background sync
   */
  queueSync(property) {
    this.syncQueue.add(property.id);
    this.processQueue();
  }

  /**
   * Process the sync queue in background
   */
  async processQueue() {
    if (this.isProcessing || this.syncQueue.size === 0) return;
    
    this.isProcessing = true;
    
    try {
      for (const propertyId of this.syncQueue) {
        // Get property details
        const { data: property } = await supabase
          .from('properties')
          .select('*')
          .eq('id', propertyId)
          .single();

        if (property) {
          await this.autoSyncProperty(property);
        }
        
        this.syncQueue.clear();
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Check if property has compliance data
   */
  async hasComplianceData(propertyId) {
    try {
      const { data: nycProperty } = await supabase
        .from('nyc_properties')
        .select('id')
        .eq('property_id', propertyId)
        .single();

      return !!nycProperty;
    } catch {
      return false;
    }
  }

  /**
   * Get sync status for a property
   */
  async getSyncStatus(propertyId) {
    try {
      const { data: nycProperty } = await supabase
        .from('nyc_properties')
        .select('last_synced_at, bin, bbl')
        .eq('property_id', propertyId)
        .single();

      return {
        hasData: !!nycProperty,
        lastSynced: nycProperty?.last_synced_at,
        bin: nycProperty?.bin,
        bbl: nycProperty?.bbl
      };
    } catch {
      return {
        hasData: false,
        lastSynced: null,
        bin: null,
        bbl: null
      };
    }
  }
}

// Export singleton instance
export const automatedSyncService = new AutomatedDataSyncService();
export default automatedSyncService;
