import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import {
  FileText, Plus, Search, Building,
  Star, CheckCircle, Clock, DollarSign, Calendar, Eye, Edit, Trash2, X
} from 'lucide-react';

const VendorRFP = ({ user, properties }) => {
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [rfps, setRfps] = useState([]);
  const [complianceSystems, setComplianceSystems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateRFP, setShowCreateRFP] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [newRFP, setNewRFP] = useState({
    title: '',
    description: '',
    compliance_systems: [],
    budget_range: '',
    timeline: ''
  });

  useEffect(() => {
    fetchVendors();
    fetchRfps();
    fetchComplianceSystems();
  }, [fetchVendors, fetchRfps, fetchComplianceSystems]);

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('rating', { ascending: false });

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRfps = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('rfps')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRfps(data || []);
    } catch (error) {
      console.error('Error fetching RFPs:', error);
    }
  }, [user.id]);

  const fetchComplianceSystems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('compliance_systems')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setComplianceSystems(data || []);
    } catch (error) {
      console.error('Error fetching compliance systems:', error);
    }
  }, []);

  const createRFP = async (e) => {
    e.preventDefault();
    if (!selectedProperty || !newRFP.title || !newRFP.description) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rfps')
        .insert([{
          property_id: selectedProperty.id,
          user_id: user.id,
          title: newRFP.title,
          description: newRFP.description,
          compliance_systems: newRFP.compliance_systems,
          budget_range: newRFP.budget_range,
          timeline: newRFP.timeline,
          status: 'draft'
        }])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        setRfps(prev => [data[0], ...prev]);
        setNewRFP({
          title: '',
          description: '',
          compliance_systems: [],
          budget_range: '',
          timeline: ''
        });
        setShowCreateRFP(false);
      }
    } catch (error) {
      console.error('Error creating RFP:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to send RFP to selected vendors
  // eslint-disable-next-line no-unused-vars
  const sendRFPToVendors = async (rfpId, selectedVendors) => {
    try {
      setLoading(true);
      const rfpVendorRecords = selectedVendors.map(vendorId => ({
        rfp_id: rfpId,
        vendor_id: vendorId,
        status: 'sent'
      }));

      const { error } = await supabase
        .from('rfp_vendors')
        .insert(rfpVendorRecords);

      if (error) throw error;

      // Update RFP status
      const { error: updateError } = await supabase
        .from('rfps')
        .update({ status: 'sent' })
        .eq('id', rfpId);

      if (updateError) throw updateError;

      fetchRfps(); // Refresh RFPs
    } catch (error) {
      console.error('Error sending RFP to vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.services.some(service => service.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCity = selectedCity === 'all' || vendor.city === selectedCity || vendor.city === 'Both';
    return matchesSearch && matchesCity;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'responses_received': return 'bg-yellow-100 text-yellow-800';
      case 'awarded': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
              Vendor RFP Management
            </h2>
            <p className="text-gray-600 text-lg">
              Create formal Requests for Proposals and connect with certified vendors
            </p>
          </div>
          <button
            onClick={() => setShowCreateRFP(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg transform hover:scale-105"
          >
            <Plus className="h-5 w-5" />
            <span>Create RFP</span>
          </button>
        </div>
      </div>

      {/* Property Selection */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Property</label>
            <select
              value={selectedProperty?.id || ''}
              onChange={(e) => {
                const property = properties.find(p => p.id === e.target.value);
                setSelectedProperty(property);
              }}
              className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
            >
              <option value="">Choose a property...</option>
              {properties.map(property => (
                <option key={property.id} value={property.id}>
                  {property.address} ({property.city})
                </option>
              ))}
            </select>
          </div>
          {selectedProperty && (
            <div className="flex items-end">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border border-white/30">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                    <Building className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedProperty.address}</p>
                    <p className="text-sm text-gray-600">{selectedProperty.city} • {selectedProperty.type}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Vendor Marketplace */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h3 className="text-xl font-bold text-gray-900">Certified Vendors</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search vendors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                />
              </div>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              >
                <option value="all">All Cities</option>
                <option value="NYC">NYC</option>
                <option value="Philadelphia">Philadelphia</option>
                <option value="Both">Both Cities</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
              <p className="text-gray-600">Loading vendors...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVendors.map(vendor => (
                <div key={vendor.id} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-900 mb-2">{vendor.name}</h4>
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium text-gray-700">{vendor.rating}</span>
                          </div>
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            vendor.city === 'NYC' ? 'bg-blue-100 text-blue-800' :
                            vendor.city === 'Philadelphia' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {vendor.city}
                          </span>
                        </div>
                      </div>
                      {vendor.verified && (
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Services</p>
                        <div className="flex flex-wrap gap-1">
                          {vendor.services.slice(0, 3).map((service, index) => (
                            <span key={index} className="inline-flex px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {service}
                            </span>
                          ))}
                          {vendor.services.length > 3 && (
                            <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{vendor.services.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{vendor.response_time}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-4 w-4" />
                          <span>{vendor.pricing_range}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                        <button className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 text-sm font-medium">
                          Contact
                        </button>
                        <button className="p-2 bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl hover:bg-white/80 transition-all duration-300">
                          <Eye className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RFP History */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-xl font-bold text-gray-900">Your RFPs</h3>
        </div>

        <div className="divide-y divide-gray-200/50">
          {rfps.length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full mb-4">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No RFPs yet</h3>
              <p className="text-gray-600 mb-4">Create your first RFP to start connecting with vendors.</p>
              <button
                onClick={() => setShowCreateRFP(true)}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg"
              >
                <Plus className="h-5 w-5" />
                <span>Create RFP</span>
              </button>
            </div>
          ) : (
            rfps.map(rfp => (
              <div key={rfp.id} className="p-6 hover:bg-white/50 transition-colors duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{rfp.title}</h4>
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(rfp.status)}`}>
                        {rfp.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{rfp.description}</p>
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Building className="h-4 w-4" />
                        <span>{properties.find(p => p.id === rfp.property_id)?.address}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(rfp.created_at).toLocaleDateString()}</span>
                      </div>
                      {rfp.budget_range && (
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-4 w-4" />
                          <span>{rfp.budget_range}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create RFP Modal */}
      {showCreateRFP && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Create New RFP</h2>
              <button
                onClick={() => setShowCreateRFP(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={createRFP} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">RFP Title *</label>
                <input
                  type="text"
                  value={newRFP.title}
                  onChange={(e) => setNewRFP({...newRFP, title: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Fire Safety Inspection Services"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  value={newRFP.description}
                  onChange={(e) => setNewRFP({...newRFP, description: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the services you need, requirements, and any specific details..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Compliance Systems</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-xl p-4">
                  {complianceSystems
                    .filter(system => !selectedProperty || system.applicable_locales.includes(selectedProperty.city))
                    .map(system => (
                    <label key={system.system_key} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={newRFP.compliance_systems.includes(system.system_key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewRFP({
                              ...newRFP,
                              compliance_systems: [...newRFP.compliance_systems, system.system_key]
                            });
                          } else {
                            setNewRFP({
                              ...newRFP,
                              compliance_systems: newRFP.compliance_systems.filter(key => key !== system.system_key)
                            });
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{system.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Budget Range</label>
                  <input
                    type="text"
                    value={newRFP.budget_range}
                    onChange={(e) => setNewRFP({...newRFP, budget_range: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., $500 - $1,500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timeline</label>
                  <input
                    type="text"
                    value={newRFP.timeline}
                    onChange={(e) => setNewRFP({...newRFP, timeline: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Within 2 weeks"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button
                  type="submit"
                  disabled={loading || !selectedProperty}
                  className="flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105 font-medium"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Creating RFP...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="h-5 w-5" />
                      <span>Create RFP</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateRFP(false)}
                  className="px-8 py-4 bg-white/80 backdrop-blur-sm border border-white/30 text-gray-700 rounded-2xl hover:bg-white/90 transition-all duration-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorRFP;

