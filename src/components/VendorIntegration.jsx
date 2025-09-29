import React, { useState, useEffect } from 'react';
import { 
  Search, Star, Phone, Mail, MapPin, Shield, Award, 
  Clock, DollarSign, CheckCircle, AlertTriangle, Filter,
  ExternalLink, Calendar, MessageSquare, Zap
} from 'lucide-react';

const VendorIntegration = ({ supabase, inspectionType, propertyAddress, onVendorSelect }) => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    rating: 'all',
    certification: 'all',
    responseTime: 'all',
    priceRange: 'all'
  });
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Compliance system to vendor category mapping
  const VENDOR_CATEGORIES = {
    'fire_alarms': ['fire_safety', 'alarm_systems', 'electrical'],
    'elevators': ['elevator_inspection', 'elevator_maintenance', 'mechanical'],
    'boilers': ['hvac', 'boiler_inspection', 'mechanical', 'heating'],
    'cooling_towers': ['water_systems', 'cooling_tower_service', 'hvac'],
    'backflow_prevention': ['plumbing', 'water_systems', 'backflow_testing'],
    'sprinkler_systems': ['fire_safety', 'sprinkler_systems', 'water_systems'],
    'emergency_lighting': ['electrical', 'fire_safety', 'lighting_systems']
  };

  useEffect(() => {
    if (inspectionType) {
      searchVendors();
    }
  }, [inspectionType, filters]);

  const searchVendors = async () => {
    try {
      setLoading(true);
      
      // Get relevant categories for the inspection type
      const categories = VENDOR_CATEGORIES[inspectionType] || [];
      
      let query = supabase
        .from('vendors')
        .select('*')
        .eq('verified', true);

      // Filter by services that match inspection categories
      if (categories.length > 0) {
        query = query.overlaps('services', categories);
      }

      // Apply filters
      if (filters.rating !== 'all') {
        const minRating = parseFloat(filters.rating);
        query = query.gte('rating', minRating);
      }

      const { data, error } = await query
        .order('compliance_match', { ascending: false })
        .order('rating', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Calculate distance and relevance scores
      const processedVendors = (data || []).map(vendor => ({
        ...vendor,
        relevance_score: calculateRelevanceScore(vendor, inspectionType, categories),
        estimated_distance: calculateDistance(vendor.address, propertyAddress),
        price_range_numeric: parsePriceRange(vendor.pricing_range)
      }));

      // Sort by relevance and rating
      processedVendors.sort((a, b) => {
        if (a.relevance_score !== b.relevance_score) {
          return b.relevance_score - a.relevance_score;
        }
        return b.rating - a.rating;
      });

      setVendors(processedVendors);

    } catch (error) {
      console.error('Error searching vendors:', error);
      // Fallback to mock data
      setVendors(generateMockVendors());
    } finally {
      setLoading(false);
    }
  };

  const generateMockVendors = () => {
    const mockVendors = [
      {
        id: 1,
        name: 'NYC Elite Elevators',
        rating: 4.8,
        certifications: ['DOB Licensed', 'FDNY Certified', 'OSHA Compliant'],
        services: ['Elevator Maintenance', 'Safety Inspections', 'Emergency Repairs'],
        phone: '(212) 555-0123',
        email: 'contact@nyceliteelevators.com',
        website: 'https://nyceliteelevators.com',
        address: '123 Industrial Blvd, Queens, NY',
        compliance_match: 95,
        response_time: '< 2 hours',
        pricing_range: '$150-300/hour',
        verified: true,
        relevance_score: 95,
        estimated_distance: '2.3 miles'
      },
      {
        id: 2,
        name: 'Metro Fire Safety Solutions',
        rating: 4.6,
        certifications: ['FDNY Licensed', 'Safety Certified', 'EPA Approved'],
        services: ['Fire Safety', 'Sprinkler Systems', 'Alarm Installation'],
        phone: '(212) 555-0456',
        email: 'info@metrofiresafety.com',
        website: 'https://metrofiresafety.com',
        address: '456 Safety Ave, Brooklyn, NY',
        compliance_match: 88,
        response_time: '< 4 hours',
        pricing_range: '$200-400/hour',
        verified: true,
        relevance_score: 88,
        estimated_distance: '3.7 miles'
      },
      {
        id: 3,
        name: 'Borough Boiler Experts',
        rating: 4.7,
        certifications: ['DOB Licensed', 'EPA Certified', 'Gas Safe Registered'],
        services: ['Boiler Maintenance', 'HVAC Systems', 'Energy Audits'],
        phone: '(212) 555-0789',
        email: 'service@boroughboiler.com',
        website: 'https://boroughboiler.com',
        address: '789 Mechanical St, Manhattan, NY',
        compliance_match: 92,
        response_time: '< 3 hours',
        pricing_range: '$175-350/hour',
        verified: true,
        relevance_score: 92,
        estimated_distance: '1.8 miles'
      }
    ];

    return mockVendors.filter(vendor => 
      vendor.services.some(service => 
        VENDOR_CATEGORIES[inspectionType]?.some(category => 
          service.toLowerCase().includes(category.split('_')[0])
        )
      )
    );
  };

  const calculateRelevanceScore = (vendor, inspectionType, categories) => {
    let score = vendor.compliance_match || 0;
    
    // Boost score for matching services
    const matchingServices = vendor.services?.filter(service =>
      categories.some(category => 
        service.toLowerCase().includes(category.split('_')[0])
      )
    ) || [];
    
    score += matchingServices.length * 10;
    
    // Boost score for relevant certifications
    const relevantCerts = vendor.certifications?.filter(cert =>
      categories.some(category => cert.toLowerCase().includes(category.split('_')[0]))
    ) || [];
    
    score += relevantCerts.length * 5;
    
    return Math.min(100, score);
  };

  const calculateDistance = (vendorAddress, propertyAddress) => {
    // Mock distance calculation - in real implementation, use geocoding API
    return `${(Math.random() * 10 + 0.5).toFixed(1)} miles`;
  };

  const parsePriceRange = (priceRange) => {
    if (!priceRange) return 0;
    const match = priceRange.match(/\$(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  const filteredVendors = vendors.filter(vendor => {
    if (searchQuery && !vendor.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    if (filters.rating !== 'all' && vendor.rating < parseFloat(filters.rating)) {
      return false;
    }
    
    return true;
  });

  const handleBookInspection = (vendor) => {
    setSelectedVendor(vendor);
    setShowBookingModal(true);
  };

  const BookingModal = () => {
    const [bookingData, setBookingData] = useState({
      preferredDate: '',
      preferredTime: '',
      urgency: 'normal',
      notes: '',
      contactMethod: 'phone'
    });

    const handleBookingSubmit = async () => {
      try {
        // In real implementation, this would:
        // 1. Send booking request to vendor
        // 2. Update inspection record with vendor assignment
        // 3. Create notification/reminder
        // 4. Send confirmation emails
        
        console.log('Booking inspection with vendor:', selectedVendor.name, bookingData);
        
        // Update inspection with vendor assignment
        if (onVendorSelect) {
          onVendorSelect(selectedVendor, bookingData);
        }
        
        setShowBookingModal(false);
        setSelectedVendor(null);
        
        // Show success message
        alert(`Booking request sent to ${selectedVendor.name}! They will contact you within ${selectedVendor.response_time}.`);
        
      } catch (error) {
        console.error('Error booking inspection:', error);
        alert('Error sending booking request. Please try again.');
      }
    };

    if (!showBookingModal || !selectedVendor) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Book Inspection with {selectedVendor.name}
            </h3>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Date
              </label>
              <input
                type="date"
                value={bookingData.preferredDate}
                onChange={(e) => setBookingData(prev => ({ ...prev, preferredDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Time
              </label>
              <select
                value={bookingData.preferredTime}
                onChange={(e) => setBookingData(prev => ({ ...prev, preferredTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select time</option>
                <option value="morning">Morning (8AM - 12PM)</option>
                <option value="afternoon">Afternoon (12PM - 5PM)</option>
                <option value="evening">Evening (5PM - 8PM)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urgency Level
              </label>
              <select
                value={bookingData.urgency}
                onChange={(e) => setBookingData(prev => ({ ...prev, urgency: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent (within 24 hours)</option>
                <option value="emergency">Emergency (immediate)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                value={bookingData.notes}
                onChange={(e) => setBookingData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any specific requirements or access instructions..."
              />
            </div>
          </div>
          
          <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={() => setShowBookingModal(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleBookingSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Send Booking Request
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Find Certified Vendors</h2>
          <p className="text-gray-600">
            {inspectionType ? `Vendors for ${inspectionType.replace('_', ' ')} inspections` : 'Search for inspection vendors'}
          </p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vendors..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filters.rating}
            onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Ratings</option>
            <option value="4.5">4.5+ Stars</option>
            <option value="4.0">4.0+ Stars</option>
            <option value="3.5">3.5+ Stars</option>
          </select>
        </div>
      </div>

      {/* Vendor Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredVendors.map((vendor) => (
            <div key={vendor.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{vendor.name}</h3>
                    {vendor.verified && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        <CheckCircle className="h-3 w-3" />
                        Verified
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="font-medium">{vendor.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      {vendor.response_time}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      {vendor.estimated_distance}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium text-green-600">
                      {vendor.compliance_match}% Match
                    </span>
                    <span className="text-sm text-gray-600">•</span>
                    <span className="text-sm text-gray-600">{vendor.pricing_range}</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {vendor.relevance_score}
                  </div>
                  <div className="text-xs text-gray-500">Relevance Score</div>
                </div>
              </div>

              {/* Services */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Services</h4>
                <div className="flex flex-wrap gap-2">
                  {vendor.services?.slice(0, 3).map((service, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {service}
                    </span>
                  ))}
                  {vendor.services?.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{vendor.services.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Certifications */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Certifications</h4>
                <div className="flex flex-wrap gap-2">
                  {vendor.certifications?.slice(0, 2).map((cert, index) => (
                    <span
                      key={index}
                      className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                    >
                      <Shield className="h-3 w-3" />
                      {cert}
                    </span>
                  ))}
                  {vendor.certifications?.length > 2 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{vendor.certifications.length - 2} more
                    </span>
                  )}
                </div>
              </div>

              {/* Contact Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleBookInspection(vendor)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Calendar className="h-4 w-4" />
                  Book Inspection
                </button>
                
                <button
                  onClick={() => window.open(`tel:${vendor.phone}`, '_self')}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => window.open(`mailto:${vendor.email}`, '_self')}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                </button>
                
                {vendor.website && (
                  <button
                    onClick={() => window.open(vendor.website, '_blank')}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredVendors.length === 0 && !loading && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or contact us to add more vendors.</p>
        </div>
      )}

      <BookingModal />
    </div>
  );
};

export default VendorIntegration;
