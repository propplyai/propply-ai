import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import {
  CheckCircle, X, RotateCcw, Building, Calendar, DollarSign, AlertTriangle,
  ChevronDown, Search, Eye, EyeOff
} from 'lucide-react';

const CompliancePunchList = ({ user, properties }) => {
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [complianceSystems, setComplianceSystems] = useState([]);
  const [propertyComplianceSystems, setPropertyComplianceSystems] = useState([]);
  const [filteredSystems, setFilteredSystems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showRemoved, setShowRemoved] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragCurrentX, setDragCurrentX] = useState(0);

  const fetchPropertyComplianceSystems = useCallback(async () => {
    if (!selectedProperty) return;

    try {
      const { data, error } = await supabase
        .from('property_compliance_systems')
        .select('*')
        .eq('property_id', selectedProperty.id);

      if (error) throw error;
      setPropertyComplianceSystems(data || []);
    } catch (error) {
      console.error('Error fetching property compliance systems:', error);
    }
  }, [selectedProperty]);

  const filterSystems = useCallback(() => {
    let filtered = complianceSystems.filter(system => {
      // Filter by property city
      if (selectedProperty && !system.applicable_locales.includes(selectedProperty.city)) {
        return false;
      }

      // Filter by search term
      if (searchTerm && !system.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !system.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      if (selectedCategory !== 'all' && system.category !== selectedCategory) {
        return false;
      }

      // Filter by selection status
      const propertySystem = propertyComplianceSystems.find(pcs => pcs.compliance_system_key === system.system_key);
      const isSelected = propertySystem ? propertySystem.selected : true;
      
      if (showRemoved) {
        return !isSelected;
      } else {
        return isSelected;
      }
    });

  useEffect(() => {
    if (selectedProperty) {
      fetchPropertyComplianceSystems();
    }
  }, [selectedProperty, fetchPropertyComplianceSystems]);

  useEffect(() => {
    filterSystems();
  }, [complianceSystems, propertyComplianceSystems, searchTerm, selectedCategory, showRemoved, filterSystems]);

  const fetchComplianceSystems = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('compliance_systems')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setComplianceSystems(data || []);
    } catch (error) {
      console.error('Error fetching compliance systems:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch compliance systems and property-specific selections
  useEffect(() => {
    fetchComplianceSystems();
  }, [fetchComplianceSystems]);

  const toggleComplianceSystem = async (systemKey, selected) => {
    if (!selectedProperty) return;

    try {
      const existingRecord = propertyComplianceSystems.find(pcs => pcs.compliance_system_key === systemKey);

      if (existingRecord) {
        // Update existing record
        const { error } = await supabase
          .from('property_compliance_systems')
          .update({ selected })
          .eq('id', existingRecord.id);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('property_compliance_systems')
          .insert([{
            property_id: selectedProperty.id,
            compliance_system_key: systemKey,
            selected
          }]);

        if (error) throw error;
      }

      // Update local state
      setPropertyComplianceSystems(prev => {
        const existing = prev.find(pcs => pcs.compliance_system_key === systemKey);
        if (existing) {
          return prev.map(pcs => 
            pcs.compliance_system_key === systemKey 
              ? { ...pcs, selected }
              : pcs
          );
        } else {
          return [...prev, {
            property_id: selectedProperty.id,
            compliance_system_key: systemKey,
            selected
          }];
        }
      });
    } catch (error) {
      console.error('Error updating compliance system:', error);
    }
  };

  const handleDragStart = (e, systemKey) => {
    setDraggedItem(systemKey);
    setDragStartX(e.clientX);
    setDragCurrentX(e.clientX);
  };

  const handleDragMove = (e) => {
    if (draggedItem) {
      setDragCurrentX(e.clientX);
    }
  };

  const handleDragEnd = () => {
    if (draggedItem) {
      const dragDistance = dragCurrentX - dragStartX;
      const threshold = 100; // Minimum distance to trigger swipe

      if (Math.abs(dragDistance) > threshold) {
        const propertySystem = propertyComplianceSystems.find(pcs => pcs.compliance_system_key === draggedItem);
        const isCurrentlySelected = propertySystem ? propertySystem.selected : true;
        toggleComplianceSystem(draggedItem, !isCurrentlySelected);
      }

      setDraggedItem(null);
      setDragStartX(0);
      setDragCurrentX(0);
    }
  };

  const categories = ['all', ...new Set(complianceSystems.map(system => system.category))];

  const getFrequencyColor = (frequency) => {
    switch (frequency) {
      case 'Monthly': return 'bg-red-100 text-red-800';
      case 'Quarterly': return 'bg-orange-100 text-orange-800';
      case 'Biannual': return 'bg-yellow-100 text-yellow-800';
      case 'Annual': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Registration': return <Building className="h-4 w-4" />;
      case 'Permits': return <CheckCircle className="h-4 w-4" />;
      case 'Fire Safety': return <AlertTriangle className="h-4 w-4" />;
      case 'Elevator Safety': return <Building className="h-4 w-4" />;
      case 'HVAC': return <Building className="h-4 w-4" />;
      case 'Environmental': return <AlertTriangle className="h-4 w-4" />;
      case 'Water Systems': return <Building className="h-4 w-4" />;
      case 'Licensing': return <CheckCircle className="h-4 w-4" />;
      case 'Maintenance': return <Building className="h-4 w-4" />;
      case 'Security': return <AlertTriangle className="h-4 w-4" />;
      case 'Insurance': return <CheckCircle className="h-4 w-4" />;
      default: return <Building className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
              Compliance Punch List
            </h2>
            <p className="text-gray-600 text-lg">
              Swipe away non-applicable items and customize your compliance requirements
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowRemoved(!showRemoved)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                showRemoved 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-white/80 backdrop-blur-sm border border-white/30 text-gray-700 hover:bg-white/90'
              }`}
            >
              {showRemoved ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              <span>{showRemoved ? 'Show Removed' : 'Hide Removed'}</span>
            </button>
          </div>
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

      {selectedProperty && (
        <>
          {/* Filters */}
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search compliance items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                />
              </div>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl px-6 py-3 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-700 font-medium"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Compliance Systems List */}
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-gray-900">
                {showRemoved ? 'Removed Items' : 'Active Compliance Items'} 
                <span className="text-gray-500 font-normal ml-2">({filteredSystems.length})</span>
              </h3>
            </div>

            <div className="divide-y divide-gray-200/50">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                  <p className="text-gray-600">Loading compliance systems...</p>
                </div>
              ) : filteredSystems.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full mb-4">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {showRemoved ? 'No removed items' : 'No compliance items found'}
                  </h3>
                  <p className="text-gray-600">
                    {showRemoved 
                      ? 'All compliance items are currently active for this property.'
                      : 'Try adjusting your search or filter criteria.'
                    }
                  </p>
                </div>
              ) : (
                filteredSystems.map((system) => {
                  const propertySystem = propertyComplianceSystems.find(pcs => pcs.compliance_system_key === system.system_key);
                  const isSelected = propertySystem ? propertySystem.selected : true;
                  const isDragging = draggedItem === system.system_key;
                  const dragDistance = isDragging ? dragCurrentX - dragStartX : 0;

                  return (
                    <div
                      key={system.system_key}
                      className={`group relative transition-all duration-300 ${
                        isDragging ? 'z-10' : ''
                      }`}
                      style={{
                        transform: isDragging ? `translateX(${dragDistance}px)` : 'translateX(0)',
                        opacity: isDragging ? 0.8 : 1
                      }}
                      onMouseDown={(e) => handleDragStart(e, system.system_key)}
                      onMouseMove={handleDragMove}
                      onMouseUp={handleDragEnd}
                      onMouseLeave={handleDragEnd}
                    >
                      <div className="p-6 hover:bg-white/50 transition-colors duration-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className={`p-2 rounded-lg ${
                                isSelected ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                              }`}>
                                {getCategoryIcon(system.category)}
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900">{system.name}</h4>
                                <div className="flex items-center space-x-4 mt-1">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getFrequencyColor(system.frequency)}`}>
                                    {system.frequency}
                                  </span>
                                  <span className="text-sm text-gray-500">{system.required_by}</span>
                                </div>
                              </div>
                            </div>

                            {system.description && (
                              <p className="text-gray-600 mb-4">{system.description}</p>
                            )}

                            <div className="flex items-center space-x-6 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{system.frequency}</span>
                              </div>
                              {system.estimated_cost_min && system.estimated_cost_max && (
                                <div className="flex items-center space-x-1">
                                  <DollarSign className="h-4 w-4" />
                                  <span>${system.estimated_cost_min} - ${system.estimated_cost_max}</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-1">
                                <Building className="h-4 w-4" />
                                <span>{system.applicable_locales.join(', ')}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            {isSelected ? (
                              <button
                                onClick={() => toggleComplianceSystem(system.system_key, false)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove from compliance list"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => toggleComplianceSystem(system.system_key, true)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Add back to compliance list"
                              >
                                <RotateCcw className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Swipe indicator */}
                      {isDragging && (
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-transparent pointer-events-none flex items-center justify-start pl-6">
                          <div className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
                            {isSelected ? 'Remove' : 'Restore'}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-6 border border-white/30">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">How to use the Compliance Punch List</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Swipe left</strong> on any item to remove it from your compliance requirements</li>
                  <li>• <strong>Click the X button</strong> to quickly remove non-applicable items</li>
                  <li>• <strong>Toggle "Show Removed"</strong> to see and restore previously removed items</li>
                  <li>• <strong>Use filters</strong> to find specific compliance categories or search by name</li>
                  <li>• <strong>Items are automatically filtered</strong> by your property's city (NYC or Philadelphia)</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {!selectedProperty && (
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-12 border border-white/20 shadow-2xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full mb-6">
            <Building className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Select a Property</h3>
          <p className="text-gray-600 text-lg max-w-md mx-auto">
            Choose a property from the dropdown above to view and customize its compliance requirements.
          </p>
        </div>
      )}
    </div>
  );
};

export default CompliancePunchList;
