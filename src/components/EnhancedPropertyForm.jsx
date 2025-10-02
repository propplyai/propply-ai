import React, { useState, useEffect } from 'react';
import { 
  Building, Calendar, DollarSign, CheckCircle, AlertTriangle, 
  Clock, Shield, FileText, ArrowRight, ArrowLeft, X, Info
} from 'lucide-react';
import GooglePlacesAutocomplete from './GooglePlacesAutocomplete';

// Compliance systems mapping - matches your database structure
const COMPLIANCE_SYSTEMS = {
  'fire_alarms': {
    name: 'Fire Alarm System Inspection',
    frequency: 'Annual',
    category: 'Fire Safety',
    estimated_cost_min: 300,
    estimated_cost_max: 500,
    required_by: 'FDNY',
    description: 'Annual inspection of fire alarm systems including smoke detectors, pull stations, and control panels',
    requirements: ['Visual inspection of all devices', 'Functional testing', 'Battery backup testing', 'Documentation review']
  },
  'elevators': {
    name: 'Elevator Safety Inspection',
    frequency: 'Annual',
    category: 'Building Systems',
    estimated_cost_min: 400,
    estimated_cost_max: 600,
    required_by: 'DOB',
    description: 'Comprehensive elevator safety inspection including mechanical systems and safety devices',
    requirements: ['Mechanical inspection', 'Safety device testing', 'Load testing', 'Certificate issuance']
  },
  'boilers': {
    name: 'Boiler Inspection',
    frequency: 'Annual',
    category: 'Building Systems',
    estimated_cost_min: 250,
    estimated_cost_max: 400,
    required_by: 'DOB',
    description: 'Annual boiler inspection for safety and efficiency compliance',
    requirements: ['Pressure testing', 'Safety valve inspection', 'Efficiency testing', 'Emissions compliance']
  },
  'cooling_towers': {
    name: 'Cooling Tower Inspection',
    frequency: 'Quarterly',
    category: 'Water Systems',
    estimated_cost_min: 200,
    estimated_cost_max: 350,
    required_by: 'DOH',
    description: 'Quarterly inspection for Legionella prevention and water quality',
    requirements: ['Water sampling', 'Legionella testing', 'System cleaning verification', 'Maintenance records review']
  },
  'backflow_prevention': {
    name: 'Backflow Prevention Testing',
    frequency: 'Annual',
    category: 'Water Systems',
    estimated_cost_min: 150,
    estimated_cost_max: 250,
    required_by: 'DEP',
    description: 'Annual testing of backflow prevention devices to protect water supply',
    requirements: ['Device testing', 'Pressure testing', 'Valve inspection', 'Certification']
  },
  'sprinkler_systems': {
    name: 'Sprinkler System Inspection',
    frequency: 'Annual',
    category: 'Fire Safety',
    estimated_cost_min: 350,
    estimated_cost_max: 550,
    required_by: 'FDNY',
    description: 'Annual inspection of fire sprinkler systems and water supply',
    requirements: ['System pressure testing', 'Sprinkler head inspection', 'Pump testing', 'Water flow testing']
  },
  'emergency_lighting': {
    name: 'Emergency Lighting Testing',
    frequency: 'Monthly',
    category: 'Fire Safety',
    estimated_cost_min: 100,
    estimated_cost_max: 200,
    required_by: 'FDNY',
    description: 'Monthly testing of emergency lighting and exit signs',
    requirements: ['Battery testing', 'Illumination testing', 'Duration testing', 'Maintenance records']
  }
};

const EnhancedPropertyForm = ({ isOpen, onClose, onSubmit, supabase }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Basic Property Info
    address: '',
    type: 'Residential',
    units: '',
    year_built: '',
    square_footage: '',
    contact: '',
    management_company: '',
    owner_name: '',
    owner_email: '',
    
    // Step 2: Property Details
    property_details: {
      has_elevator: false,
      has_boiler: false,
      has_cooling_tower: false,
      has_fire_alarm: true,
      has_sprinkler: false,
      has_emergency_lighting: true,
      building_height: '',
      occupancy_type: ''
    },
    
    // Step 3: Compliance Systems Selection
    selected_compliance_systems: [],
    
    // Step 4: Inspection Schedule
    inspection_preferences: {},
    custom_dates: {}
  });

  const [availableComplianceSystems, setAvailableComplianceSystems] = useState([]);
  const [totalAnnualCost, setTotalAnnualCost] = useState({ min: 0, max: 0 });
  const [loading, setLoading] = useState(false);
  const [addressError, setAddressError] = useState(null);
  const [addressComponents, setAddressComponents] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchComplianceSystems();
    }
  }, [isOpen]);

  useEffect(() => {
    // Auto-select compliance systems based on property features
    const autoSelected = [];
    const details = formData.property_details;
    
    if (details.has_fire_alarm) autoSelected.push('fire_alarms');
    if (details.has_elevator) autoSelected.push('elevators');
    if (details.has_boiler) autoSelected.push('boilers');
    if (details.has_cooling_tower) autoSelected.push('cooling_towers');
    if (details.has_sprinkler) autoSelected.push('sprinkler_systems');
    if (details.has_emergency_lighting) autoSelected.push('emergency_lighting');
    
    // Always include backflow prevention for most properties
    if (formData.type !== 'Residential' || parseInt(formData.units) > 6) {
      autoSelected.push('backflow_prevention');
    }

    setFormData(prev => ({
      ...prev,
      selected_compliance_systems: autoSelected
    }));
  }, [formData.property_details, formData.type, formData.units]);

  useEffect(() => {
    // Calculate total annual costs
    const costs = formData.selected_compliance_systems.reduce((acc, systemKey) => {
      const system = COMPLIANCE_SYSTEMS[systemKey];
      if (system) {
        const multiplier = system.frequency === 'Quarterly' ? 4 : 
                          system.frequency === 'Monthly' ? 12 : 1;
        acc.min += system.estimated_cost_min * multiplier;
        acc.max += system.estimated_cost_max * multiplier;
      }
      return acc;
    }, { min: 0, max: 0 });
    
    setTotalAnnualCost(costs);
  }, [formData.selected_compliance_systems]);

  const fetchComplianceSystems = async () => {
    try {
      const { data, error } = await supabase
        .from('compliance_systems')
        .select('*')
        .eq('active', true);
      
      if (error) throw error;
      setAvailableComplianceSystems(data || []);
    } catch (error) {
      console.error('Error fetching compliance systems:', error);
      // Fallback to static data
      setAvailableComplianceSystems(Object.entries(COMPLIANCE_SYSTEMS).map(([key, value]) => ({
        system_key: key,
        ...value
      })));
    }
  };

  const handleInputChange = (field, value, section = null) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Handle Google Places address selection
  const handleAddressSelect = (placeData) => {
    setAddressError(null);
    setAddressComponents(placeData.components);
    
    // Check for validation errors
    if (placeData.validation && !placeData.validation.isValid) {
      setAddressError(placeData.validation.errors.join(', '));
      return;
    }
    
    // Check for warnings (like unsupported cities)
    if (placeData.validation && placeData.validation.warnings && placeData.validation.warnings.length > 0) {
      console.warn('Address warnings:', placeData.validation.warnings);
      // You could show warnings to the user if needed
    }
  };

  // Handle address input changes
  const handleAddressChange = (value) => {
    setFormData(prev => ({
      ...prev,
      address: value
    }));
    setAddressError(null);
  };

  const toggleComplianceSystem = (systemKey) => {
    setFormData(prev => ({
      ...prev,
      selected_compliance_systems: prev.selected_compliance_systems.includes(systemKey)
        ? prev.selected_compliance_systems.filter(s => s !== systemKey)
        : [...prev.selected_compliance_systems, systemKey]
    }));
  };

  const calculateNextDueDate = (frequency, startDate = new Date()) => {
    const date = new Date(startDate);
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
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Create property with compliance systems
      const propertyData = {
        address: formData.address,
        type: formData.type,
        units: parseInt(formData.units),
        year_built: parseInt(formData.year_built),
        square_footage: parseInt(formData.square_footage),
        contact: formData.contact,
        management_company: formData.management_company,
        owner_name: formData.owner_name,
        owner_email: formData.owner_email,
        compliance_score: 85, // Initial score
        status: 'Active'
      };

      await onSubmit(propertyData, {
        selected_compliance_systems: formData.selected_compliance_systems,
        property_details: formData.property_details,
        inspection_preferences: formData.inspection_preferences,
        custom_dates: formData.custom_dates
      });

      // Reset form
      setFormData({
        address: '',
        type: 'Residential',
        units: '',
        year_built: '',
        square_footage: '',
        contact: '',
        management_company: '',
        owner_name: '',
        owner_email: '',
        property_details: {
          has_elevator: false,
          has_boiler: false,
          has_cooling_tower: false,
          has_fire_alarm: true,
          has_sprinkler: false,
          has_emergency_lighting: true,
          building_height: '',
          occupancy_type: ''
        },
        selected_compliance_systems: [],
        inspection_preferences: {},
        custom_dates: {}
      });
      setCurrentStep(1);
      onClose();
    } catch (error) {
      console.error('Error submitting property:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.address && formData.units && formData.type && !addressError;
      case 2:
        return true; // Property details are optional
      case 3:
        return formData.selected_compliance_systems.length > 0;
      case 4:
        return true; // Review step
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Add New Property</h2>
              <p className="text-blue-100">Step {currentStep} of 4</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center space-x-4">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep ? 'bg-white text-blue-600' : 'bg-blue-500 text-white'
                  }`}>
                    {step}
                  </div>
                  {step < 4 && (
                    <div className={`w-12 h-1 mx-2 ${
                      step < currentStep ? 'bg-white' : 'bg-blue-500'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm text-blue-100">
              <span>Basic Info</span>
              <span>Property Details</span>
              <span>Compliance Systems</span>
              <span>Review & Schedule</span>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Step 1: Basic Property Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Basic Property Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Address *
                  </label>
                  <GooglePlacesAutocomplete
                    value={formData.address}
                    onChange={handleAddressChange}
                    onPlaceSelect={handleAddressSelect}
                    placeholder="123 Main Street, New York, NY 10001"
                    className="w-full"
                    required={true}
                    error={addressError}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Mixed Use">Mixed Use</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Units *
                  </label>
                  <input
                    type="number"
                    value={formData.units}
                    onChange={(e) => handleInputChange('units', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="24"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year Built
                  </label>
                  <input
                    type="number"
                    value={formData.year_built}
                    onChange={(e) => handleInputChange('year_built', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1985"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Square Footage
                  </label>
                  <input
                    type="number"
                    value={formData.square_footage}
                    onChange={(e) => handleInputChange('square_footage', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="12000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) => handleInputChange('contact', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Smith"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Management Company
                  </label>
                  <input
                    type="text"
                    value={formData.management_company}
                    onChange={(e) => handleInputChange('management_company', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ABC Property Management"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Property Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Property Systems & Features</h3>
              <p className="text-gray-600 mb-6">
                Select the systems and features present in your property. This will help us determine the required compliance inspections.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { key: 'has_fire_alarm', label: 'Fire Alarm System', icon: Shield },
                  { key: 'has_elevator', label: 'Elevator(s)', icon: Building },
                  { key: 'has_boiler', label: 'Boiler System', icon: Clock },
                  { key: 'has_cooling_tower', label: 'Cooling Tower', icon: Building },
                  { key: 'has_sprinkler', label: 'Sprinkler System', icon: Shield },
                  { key: 'has_emergency_lighting', label: 'Emergency Lighting', icon: Shield }
                ].map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div key={feature.key} className="flex items-center p-4 border border-gray-200 rounded-xl hover:border-blue-300 transition-colors">
                      <Icon className="h-6 w-6 text-blue-600 mr-3" />
                      <label className="flex-1 text-sm font-medium text-gray-700">
                        {feature.label}
                      </label>
                      <input
                        type="checkbox"
                        checked={formData.property_details[feature.key]}
                        onChange={(e) => handleInputChange(feature.key, e.target.checked, 'property_details')}
                        className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Compliance Systems Selection */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Required Compliance Systems</h3>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Estimated Annual Cost</p>
                  <p className="text-lg font-semibold text-green-600">
                    ${totalAnnualCost.min.toLocaleString()} - ${totalAnnualCost.max.toLocaleString()}
                  </p>
                </div>
              </div>
              
              <p className="text-gray-600">
                Based on your property features, we've pre-selected the required compliance systems. You can adjust these selections as needed.
              </p>

              <div className="space-y-4">
                {Object.entries(COMPLIANCE_SYSTEMS).map(([systemKey, system]) => {
                  const isSelected = formData.selected_compliance_systems.includes(systemKey);
                  const annualCost = system.frequency === 'Quarterly' ? 
                    { min: system.estimated_cost_min * 4, max: system.estimated_cost_max * 4 } :
                    system.frequency === 'Monthly' ?
                    { min: system.estimated_cost_min * 12, max: system.estimated_cost_max * 12 } :
                    { min: system.estimated_cost_min, max: system.estimated_cost_max };

                  return (
                    <div
                      key={systemKey}
                      className={`p-6 border-2 rounded-xl transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleComplianceSystem(systemKey)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleComplianceSystem(systemKey)}
                              className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 mr-3"
                            />
                            <h4 className="text-lg font-semibold text-gray-900">{system.name}</h4>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                            <div>
                              <span className="text-gray-500">Frequency:</span>
                              <p className="font-medium">{system.frequency}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Category:</span>
                              <p className="font-medium">{system.category}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Required by:</span>
                              <p className="font-medium">{system.required_by}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Annual Cost:</span>
                              <p className="font-medium text-green-600">
                                ${annualCost.min} - ${annualCost.max}
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-3">{system.description}</p>
                          
                          <div className="flex flex-wrap gap-2">
                            {system.requirements.map((req, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                              >
                                {req}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Review & Schedule */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Review & Initial Schedule</h3>
              
              {/* Property Summary */}
              <div className="bg-gray-50 p-6 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-4">Property Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Address:</span>
                    <p className="font-medium">{formData.address}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <p className="font-medium">{formData.type}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Units:</span>
                    <p className="font-medium">{formData.units}</p>
                  </div>
                </div>
              </div>

              {/* Compliance Budget */}
              <div className="bg-green-50 p-6 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-4">Annual Compliance Budget</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      ${totalAnnualCost.min.toLocaleString()} - ${totalAnnualCost.max.toLocaleString()}
                    </p>
                    <p className="text-gray-600">Estimated annual compliance costs</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </div>

              {/* Inspection Schedule Preview */}
              <div className="bg-blue-50 p-6 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-4">Initial Inspection Schedule</h4>
                <div className="space-y-3">
                  {formData.selected_compliance_systems.map((systemKey) => {
                    const system = COMPLIANCE_SYSTEMS[systemKey];
                    const nextDue = calculateNextDueDate(system.frequency);
                    
                    return (
                      <div key={systemKey} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{system.name}</p>
                          <p className="text-sm text-gray-600">{system.frequency} • {system.required_by}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-blue-600">
                            Next Due: {nextDue.toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            ${system.estimated_cost_min} - ${system.estimated_cost_max}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center px-4 py-2 rounded-xl transition-colors ${
              currentStep === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </button>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            
            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                disabled={!isStepValid()}
                className={`flex items-center px-6 py-2 rounded-xl transition-colors ${
                  isStepValid()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Property'}
                <CheckCircle className="h-4 w-4 ml-2" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPropertyForm;
