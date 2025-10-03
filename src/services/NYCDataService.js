/**
 * NYC Data Service - Frontend compatible version
 * Makes API calls to backend for NYC data integration
 */

class NYCDataService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || window.location.origin;
  }

  /**
   * Fetch real NYC data for a property using existing backend API
   */
  async fetchRealNYCData(property) {
    console.log(`🗽 Fetching real NYC data for: ${property.address}`);
    
    try {
      // Use the existing backend API endpoint
      const response = await fetch(`${this.baseUrl}/api/sync-nyc-property`, {
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        console.log('✅ Real NYC data synced successfully');
        console.log('📊 Sync results:', data.data);
        
        // Return the sync result data
        return data.data;
      } else {
        console.warn('⚠️ NYC sync completed with warnings:', data.message);
        return null;
      }
      
    } catch (error) {
      console.error('❌ Error syncing NYC data:', error);
      // Don't throw - let the fallback handle it
      return null;
    }
  }

  /**
   * Get comprehensive NYC data for a property
   */
  async getComprehensiveNYCData(property) {
    console.log(`📊 Getting comprehensive NYC data for: ${property.address}`);
    
    try {
      const response = await fetch(`${this.baseUrl}/api/nyc-comprehensive-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: property.address,
          borough: property.borough || 'NYC'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        console.log('✅ Comprehensive NYC data retrieved');
        return data.data;
      } else {
        console.warn('⚠️ No comprehensive data available:', data.message);
        return null;
      }
      
    } catch (error) {
      console.error('❌ Error getting comprehensive NYC data:', error);
      return null;
    }
  }

  /**
   * Sync property data with city APIs
   */
  async syncPropertyData(propertyId) {
    console.log(`🔄 Syncing property data for ID: ${propertyId}`);
    
    try {
      const response = await fetch(`${this.baseUrl}/api/properties/${propertyId}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Property data synced successfully');
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to sync property data');
      }
      
    } catch (error) {
      console.error('❌ Error syncing property data:', error);
      throw error;
    }
  }
}

export default new NYCDataService();
