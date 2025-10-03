/**
 * NYC Data Service - Frontend compatible version
 * Makes API calls to backend for NYC data integration
 */

class NYCDataService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || window.location.origin;
  }

  /**
   * Fetch real NYC data for a property
   * For now, this creates a basic record and logs that real data integration is needed
   */
  async fetchRealNYCData(property) {
    console.log(`🗽 NYC data integration for: ${property.address}`);
    console.log('⚠️ Real NYC data integration requires backend API with Python scripts');
    console.log('📝 For now, creating basic property record');
    
    // Return null to indicate no real data available
    // This will trigger the fallback to basic record creation
    return null;
  }

  /**
   * Store real NYC data in Supabase via backend API
   */
  async storeRealNYCData(property, complianceData) {
    console.log('💾 Storing real NYC data via backend API...');
    
    try {
      const response = await fetch(`${this.baseUrl}/api/nyc-data/store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          property_id: property.id,
          compliance_data: complianceData
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Real NYC data stored successfully');
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to store NYC data');
      }
      
    } catch (error) {
      console.error('❌ Error storing real NYC data:', error);
      throw error;
    }
  }
}

export default new NYCDataService();
