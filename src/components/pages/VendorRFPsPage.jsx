import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import {
  Users, Building, Star, Clock, DollarSign, Eye, MessageCircle,
  Search, Filter, Plus, MapPin, Phone, Mail, Award, CheckCircle
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const VendorRFPsPage = ({ user, properties }) => {
  const { theme, isDark } = useTheme();
  const [vendors, setVendors] = useState([]);
  const [rfps, setRfps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterService, setFilterService] = useState('all');
  const [selectedProperty, setSelectedProperty] = useState(null);

  useEffect(() => {
    fetchVendors();
    fetchRFPs();
  }, [user.id]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API calls
      const mockVendors = [
        {
          id: 1,
          name: 'David Chen',
          rating: 4.9,
          services: ['comprehensive_inspection', 'violation_resolution'],
          response_time: '2 hours',
          price_range: '$150-300',
          verified: true,
          location: 'New York, NY',
          phone: '+1 (555) 123-4567',
          email: 'david@example.com'
        },
        {
          id: 2,
          name: 'John Smith',
          rating: 4.8,
          services: ['boiler_inspection', 'elevator_inspection', 'fire_safety'],
          response_time: '4 hours',
          price_range: '$200-400',
          verified: true,
          location: 'Brooklyn, NY',
          phone: '+1 (555) 234-5678',
          email: 'john@example.com'
        },
        {
          id: 3,
          name: 'Sarah Johnson',
          rating: 4.7,
          services: ['general_contracting', 'renovation', 'compliance_upgrades'],
          response_time: '6 hours',
          price_range: '$300-600',
          verified: true,
          location: 'Queens, NY',
          phone: '+1 (555) 345-6789',
          email: 'sarah@example.com'
        },
        {
          id: 4,
          name: 'Maria Rodriguez',
          rating: 4.6,
          services: ['electrical_inspection', 'plumbing', 'hvac'],
          response_time: '8 hours',
          price_range: '$100-250',
          verified: false,
          location: 'Bronx, NY',
          phone: '+1 (555) 456-7890',
          email: 'maria@example.com'
        }
      ];
      setVendors(mockVendors);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRFPs = async () => {
    try {
      // Mock RFP data
      const mockRFPs = [
        {
          id: 1,
          title: 'Fire Safety Inspection',
          property_address: '140 W 28th St, New York, NY 10001',
          status: 'open',
          due_date: '2024-02-15',
          budget: '$500-1000',
          responses: 3,
          created_at: '2024-01-15'
        }
      ];
      setRfps(mockRFPs);
    } catch (error) {
      console.error('Error fetching RFPs:', error);
    }
  };

  const getServiceColor = (service) => {
    const colors = {
      'comprehensive_inspection': 'bg-corporate-100 text-corporate-800 border-corporate-200',
      'violation_resolution': 'bg-ruby-100 text-ruby-800 border-ruby-200',
      'boiler_inspection': 'bg-gold-100 text-gold-800 border-gold-200',
      'elevator_inspection': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'fire_safety': 'bg-ruby-100 text-ruby-800 border-ruby-200',
      'general_contracting': 'bg-slate-100 text-slate-800 border-slate-200',
      'renovation': 'bg-purple-100 text-purple-800 border-purple-200',
      'compliance_upgrades': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'electrical_inspection': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'plumbing': 'bg-blue-100 text-blue-800 border-blue-200',
      'hvac': 'bg-cyan-100 text-cyan-800 border-cyan-200'
    };
    return colors[service] || 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.services.some(service => service.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesService = filterService === 'all' || vendor.services.includes(filterService);
    return matchesSearch && matchesService;
  });

  const stats = {
    totalVendors: vendors.length,
    verifiedVendors: vendors.filter(v => v.verified).length,
    avgRating: vendors.reduce((sum, v) => sum + v.rating, 0) / vendors.length,
    totalRFPs: rfps.length,
    openRFPs: rfps.filter(r => r.status === 'open').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="enterprise-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-slate-100 mb-2">Vendor RFP Management</h1>
            <p className="text-slate-400 text-lg">Create formal Requests for Proposals and connect with certified vendors</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="btn-primary">
              <Plus className="h-4 w-4" />
              <span>Create RFP</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: 'Total Vendors', value: stats.totalVendors, icon: Users, color: 'corporate' },
          { label: 'Verified', value: stats.verifiedVendors, icon: CheckCircle, color: 'emerald' },
          { label: 'Avg Rating', value: stats.avgRating.toFixed(1), icon: Star, color: 'gold' },
          { label: 'Total RFPs', value: stats.totalRFPs, icon: Building, color: 'corporate' },
          { label: 'Open RFPs', value: stats.openRFPs, icon: Clock, color: 'gold' }
        ].map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            corporate: 'from-corporate-500 to-corporate-600',
            emerald: 'from-emerald-500 to-emerald-600',
            ruby: 'from-ruby-500 to-ruby-600',
            gold: 'from-gold-500 to-gold-600'
          };
          return (
            <div key={index} className="metric-card group">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-gradient-to-r ${colorClasses[stat.color]} rounded-xl shadow-enterprise group-hover:shadow-glow transition-all duration-300`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="metric-value text-4xl mb-1">
                {stat.value}
              </div>
              <div className="metric-label">
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Property Selection */}
      <div className="enterprise-card p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-200 mb-2">Select Property</label>
            <select
              value={selectedProperty || ''}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl focus:ring-2 focus:ring-corporate-500 focus:border-corporate-500 transition-all duration-300 text-slate-200 hover:bg-slate-700"
            >
              <option value="">Choose a property...</option>
              {properties.map(property => (
                <option key={property.id} value={property.id}>
                  {property.address}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Certified Vendors */}
      <div className="enterprise-card overflow-hidden">
        <div className="enterprise-card-header">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between">
            <h2 className="text-xl font-bold text-primary mb-4 lg:mb-0">Certified Vendors</h2>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-tertiary" />
                <input
                  type="text"
                  placeholder="Search vendors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 bg-card border border-primary rounded-xl focus:ring-2 focus:ring-corporate-500 focus:border-corporate-500 transition-all duration-300 text-primary placeholder-tertiary hover:bg-secondary"
                />
              </div>
              <select
                value={filterService}
                onChange={(e) => setFilterService(e.target.value)}
                className="px-4 py-3 bg-card border border-primary rounded-xl focus:ring-2 focus:ring-corporate-500 focus:border-corporate-500 transition-all duration-300 text-primary hover:bg-secondary"
              >
                <option value="all">All Services</option>
                <option value="comprehensive_inspection">Comprehensive Inspection</option>
                <option value="violation_resolution">Violation Resolution</option>
                <option value="boiler_inspection">Boiler Inspection</option>
                <option value="elevator_inspection">Elevator Inspection</option>
                <option value="fire_safety">Fire Safety</option>
              </select>
            </div>
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-corporate-500"></div>
              <span className="ml-3 text-slate-400">Loading vendors...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVendors.map((vendor) => (
                <div key={vendor.id} className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:bg-slate-750 transition-all duration-300 group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-slate-100">{vendor.name}</h3>
                        {vendor.verified && (
                          <div className="p-1 bg-emerald-500 rounded-full">
                            <CheckCircle className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-gold-400 fill-current" />
                          <span className="text-slate-200 font-medium">{vendor.rating}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-slate-400">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">{vendor.response_time}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-slate-400">
                          <DollarSign className="h-4 w-4" />
                          <span className="text-sm">{vendor.price_range}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-400 text-sm mb-4">
                        <MapPin className="h-4 w-4" />
                        <span>{vendor.location}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {vendor.services.map((service, index) => (
                        <span key={index} className={`px-2 py-1 rounded-full text-xs font-medium border ${getServiceColor(service)}`}>
                          {service.replace('_', ' ').toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="flex-1 btn-primary text-sm py-2">
                      <MessageCircle className="h-4 w-4" />
                      <span>Contact</span>
                    </button>
                    <button className="p-2 text-slate-400 hover:bg-slate-700 rounded-lg transition-all duration-300">
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorRFPsPage;
