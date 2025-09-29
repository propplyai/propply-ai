import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Building, Users, BarChart3, Calendar, Plus, Search, Eye, Edit, Trash2,
  ArrowUpDown, CheckCircle, AlertTriangle, TrendingUp, Bell, Settings,
  Sparkles, MapPin
} from 'lucide-react';
import EnhancedPropertyForm from './EnhancedPropertyForm';
import InspectionDashboard from './InspectionDashboard';
import InspectionCalendar from './InspectionCalendar';
import VendorIntegration from './VendorIntegration';
import ComplianceAnalytics from './ComplianceAnalytics';

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

const PropplyAI = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [properties, setProperties] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newProperty, setNewProperty] = useState({
    address: '',
    type: 'Residential',
    units: '',
    yearBuilt: '',
    contact: '',
    managementCompany: ''
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [complianceReport, setComplianceReport] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [showInspectionDashboard, setShowInspectionDashboard] = useState(false);
  const [activeView, setActiveView] = useState('portfolio'); // portfolio, calendar, analytics, vendors
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('address');
  const [sortDirection, setSortDirection] = useState('asc');

  // Utility functions for table view
  const filteredAndSortedProperties = () => {
    let filtered = properties.filter(property => {
      const matchesSearch = property.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           property.type?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || property.type === filterType;
      return matchesSearch && matchesFilter;
    });

    return filtered.sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      const comparison = aVal.toString().localeCompare(bVal.toString());
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Supabase API functions
  const supabaseApi = {
    fetchProperties: async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setProperties(data || []);
      } catch (error) {
        console.error('Error fetching properties:', error);
        // Fallback to mock data
        setProperties([
          {
            id: 1,
            address: '123 Broadway, New York, NY 10001',
            type: 'Residential',
            units: 24,
            complianceScore: 85,
            violations: 2,
            nextInspection: '2025-08-15',
            status: 'Active'
          },
          {
            id: 2,
            address: '456 5th Avenue, New York, NY 10018',
            type: 'Commercial',
            units: 12,
            complianceScore: 92,
            violations: 0,
            nextInspection: '2025-09-01',
            status: 'Active'
          }
        ]);
      } finally {
        setLoading(false);
      }
    },

    addProperty: async (property, complianceData = null) => {
      try {
        setLoading(true);
        const propertyData = {
          ...property,
          compliance_score: Math.floor(Math.random() * 30) + 70,
          violations: Math.floor(Math.random() * 5),
          next_inspection: '2025-08-30',
          status: 'Active'
        };

        const { data, error } = await supabase
          .from('properties')
          .insert([propertyData])
          .select();
        
        if (error) throw error;
        
        if (data && data[0]) {
          const newProperty = data[0];
          
          // If compliance data is provided, create compliance system mappings and inspections
          if (complianceData && complianceData.selected_compliance_systems) {
            await this.createPropertyComplianceSystems(newProperty.id, complianceData);
          }
          
          setProperties(prev => [newProperty, ...prev]);
          return newProperty;
        }
      } catch (error) {
        console.error('Error adding property:', error);
        const newProp = {
          id: Date.now(),
          ...property,
          complianceScore: Math.floor(Math.random() * 30) + 70,
          violations: Math.floor(Math.random() * 5),
          nextInspection: '2025-08-30',
          status: 'Active'
        };
        setProperties(prev => [newProp, ...prev]);
        return newProp;
      } finally {
        setLoading(false);
      }
    },

    createPropertyComplianceSystems: async (propertyId, complianceData) => {
      try {
        // Create property compliance system mappings
        const complianceSystemMappings = complianceData.selected_compliance_systems.map(systemKey => ({
          property_id: propertyId,
          compliance_system_key: systemKey,
          selected: true,
          notes: complianceData.inspection_preferences[systemKey]?.notes || null
        }));

        const { error: mappingError } = await supabase
          .from('property_compliance_systems')
          .insert(complianceSystemMappings);

        if (mappingError) throw mappingError;

        // Create initial inspection records
        const { data: complianceSystems, error: systemsError } = await supabase
          .from('compliance_systems')
          .select('*')
          .in('system_key', complianceData.selected_compliance_systems);

        if (systemsError) throw systemsError;

        const inspectionRecords = complianceSystems.map(system => {
          const customDate = complianceData.custom_dates[system.system_key];
          const nextDueDate = customDate ? new Date(customDate) : this.calculateNextDueDate(system.frequency);
          
          return {
            property_id: propertyId,
            inspection_type: system.name,
            compliance_system: system.system_key,
            frequency: system.frequency,
            category: system.category,
            required_by: system.required_by,
            estimated_cost_min: system.estimated_cost_min,
            estimated_cost_max: system.estimated_cost_max,
            scheduled_date: nextDueDate.toISOString().split('T')[0],
            next_due_date: nextDueDate.toISOString().split('T')[0],
            status: 'Scheduled',
            urgency_level: 'Normal'
          };
        });

        const { error: inspectionError } = await supabase
          .from('inspections')
          .insert(inspectionRecords);

        if (inspectionError) throw inspectionError;

        console.log('Successfully created compliance systems and inspections for property');
      } catch (error) {
        console.error('Error creating property compliance systems:', error);
      }
    },

    calculateNextDueDate: (frequency, startDate = new Date()) => {
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
    },

    generateComplianceReport: async (propertyId) => {
      setLoading(true);
      // Mock compliance report
      const report = {
        propertyId,
        generatedAt: new Date().toISOString(),
        sections: [
          { name: 'Fire Safety', status: 'Compliant', score: 95, nextInspection: '2025-09-15' },
          { name: 'Elevator Safety', status: 'Minor Issues', score: 78, nextInspection: '2025-08-20' },
          { name: 'Boiler Inspection', status: 'Compliant', score: 88, nextInspection: '2025-10-01' },
          { name: 'HPD Registration', status: 'Needs Attention', score: 65, nextInspection: '2025-07-30' }
        ],
        overallScore: 82,
        recommendations: [
          'Schedule elevator maintenance within 30 days',
          'Update HPD registration documentation',
          'Review fire safety equipment quarterly'
        ]
      };
      
      setTimeout(() => {
        setComplianceReport(report);
        setLoading(false);
      }, 1500);
      return report;
    },

    generateAiAnalysis: async (propertyId) => {
      setLoading(true);
      const analysis = {
        riskScore: Math.floor(Math.random() * 30) + 70,
        insights: [
          'Property shows strong compliance trends over the past 6 months',
          'Elevator system requires attention based on recent inspection patterns',
          'Fire safety protocols are well-maintained and up to date'
        ],
        predictions: [
          'Next violation likely in elevator system (probability: 65%)',
          'Fire safety inspection will likely pass (probability: 92%)',
          'Estimated compliance costs for Q3: $4,200'
        ],
        priority: 'Medium'
      };
      
      setTimeout(() => {
        setAiAnalysis(analysis);
        setLoading(false);
      }, 2000);
      return analysis;
    },

    searchVendors: async () => {
      setLoading(true);
      const mockVendors = [
        {
          id: 1,
          name: 'NYC Elite Elevators',
          rating: 4.8,
          certifications: ['DOB Licensed', 'FDNY Certified'],
          services: ['Elevator Maintenance', 'Safety Inspections'],
          phone: '(212) 555-0123',
          complianceMatch: 95
        },
        {
          id: 2,
          name: 'Metro Fire Safety Solutions',
          rating: 4.6,
          certifications: ['FDNY Licensed', 'Safety Certified'],
          services: ['Fire Safety', 'Sprinkler Systems'],
          phone: '(212) 555-0456',
          complianceMatch: 88
        }
      ];
      
      setTimeout(() => {
        setVendors(mockVendors);
        setLoading(false);
      }, 1000);
      return mockVendors;
    }
  };

  useEffect(() => {
    supabaseApi.fetchProperties();
  }, []);

  const handleAddProperty = async (propertyData, complianceData) => {
    if (!propertyData.address || !propertyData.units) return;
    
    try {
      await supabaseApi.addProperty(propertyData, complianceData);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding property:', error);
    }
  };

  const handleLegacyAddProperty = async () => {
    if (!newProperty.address || !newProperty.units) return;
    
    await supabaseApi.addProperty(newProperty);
    setNewProperty({
      address: '',
      type: 'Residential',
      units: '',
      yearBuilt: '',
      contact: '',
      managementCompany: ''
    });
    setShowAddForm(false);
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.address?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || property.type?.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const dashboardStats = {
    totalProperties: properties.length,
    complianceRate: properties.length > 0 ? Math.round(properties.reduce((acc, p) => acc + (p.complianceScore || 0), 0) / properties.length) : 0,
    totalViolations: properties.reduce((acc, p) => acc + (p.violations || 0), 0),
    upcomingInspections: properties.filter(p => new Date(p.nextInspection) <= new Date(Date.now() + 30*24*60*60*1000)).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-cyan-600/20 rounded-full blur-3xl"></div>
      </div>
      
      {/* Premium Header */}
      <header className="relative bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-75"></div>
                  <div className="relative p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl">
                    <Building className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                    Propply AI
                  </h1>
                  <p className="text-gray-600 text-sm font-medium">NYC Property Compliance Management</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="relative p-3 rounded-xl bg-white/60 backdrop-blur-sm border border-white/20 hover:bg-white/80 transition-all duration-300 group">
                <Bell className="h-5 w-5 text-gray-700 group-hover:text-blue-600 transition-colors" />
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full text-xs text-white flex items-center justify-center font-bold shadow-lg animate-pulse">
                  3
                </span>
              </button>
              <button className="p-3 rounded-xl bg-white/60 backdrop-blur-sm border border-white/20 hover:bg-white/80 transition-all duration-300 group">
                <Settings className="h-5 w-5 text-gray-700 group-hover:text-blue-600 transition-colors" />
              </button>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-75"></div>
                <div className="relative h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Premium Glassmorphism Sidebar */}
        <nav className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white/70 backdrop-blur-xl border-r border-white/20 shadow-2xl transition-all duration-500 ease-out`}>
          <div className="flex flex-col h-full pt-20 lg:pt-8">
            <div className="px-6 pb-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border border-white/30">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-semibold text-gray-800">Quick Stats</span>
                </div>
                <div className="text-sm text-gray-600">
                  <div className="flex justify-between items-center">
                    <span>Compliance Rate</span>
                    <span className="font-bold text-green-600">{dashboardStats.complianceRate}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 px-6 space-y-3">
              {[
                { id: 'dashboard', label: 'Dashboard & Portfolio', icon: BarChart3, gradient: 'from-blue-500 to-cyan-500' },
                { id: 'compliance', label: 'Compliance Reports', icon: FileText, gradient: 'from-green-500 to-emerald-500' },
                { id: 'vendors', label: 'Vendor Marketplace', icon: Users, gradient: 'from-purple-500 to-pink-500' },
                { id: 'analytics', label: 'AI Analytics', icon: AlertTriangle, gradient: 'from-orange-500 to-red-500' }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSidebarOpen(false);
                    }}
                    className={`group w-full flex items-center space-x-4 px-4 py-4 rounded-2xl font-medium text-sm transition-all duration-300 transform hover:scale-105 ${isActive
                        ? 'bg-white/80 backdrop-blur-sm shadow-lg border border-white/30 text-gray-800'
                        : 'text-gray-600 hover:bg-white/50 hover:backdrop-blur-sm'
                    }`}
                  >
                    <div className={`p-2 rounded-xl transition-all duration-300 ${
                      isActive 
                        ? `bg-gradient-to-r ${tab.gradient} shadow-lg` 
                        : 'bg-gray-100 group-hover:bg-gray-200'
                    }`}>
                      <Icon className={`h-5 w-5 transition-colors ${
                        isActive ? 'text-white' : 'text-gray-600 group-hover:text-gray-700'
                      }`} />
                    </div>
                    <span className="flex-1 text-left">{tab.label}</span>
                    {isActive && (
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
                    )}
                  </button>
                );
              })}
            </div>
            
            <div className="p-6">
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-4 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
                <div className="relative">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="h-4 w-4" />
                    <span className="text-sm font-semibold">Pro Features</span>
                  </div>
                  <p className="text-xs text-gray-300 mb-3">Unlock advanced analytics and automation</p>
                  <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-medium py-2 px-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300">
                    Upgrade Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                {/* Welcome Section */}
                <div className="relative">
                  <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                      <div className="mb-6 lg:mb-0">
                        <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-2">
                          Welcome back! 👋
                        </h2>
                        <p className="text-gray-600 text-lg">Here's what's happening with your properties today</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <button className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg transform hover:scale-105">
                          <Plus className="h-5 w-5" />
                          <span className="font-medium">Add Property</span>
                        </button>
                        <button className="p-3 bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl hover:bg-white/90 transition-all duration-300 group">
                          <MoreVertical className="h-5 w-5 text-gray-600 group-hover:text-gray-800" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Premium Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { 
                      label: 'Total Properties', 
                      value: dashboardStats.totalProperties, 
                      icon: Building, 
                      gradient: 'from-blue-500 to-cyan-500',
                      change: '+2 this month',
                      changeType: 'positive'
                    },
                    { 
                      label: 'Compliance Rate', 
                      value: `${dashboardStats.complianceRate}%`, 
                      icon: CheckCircle, 
                      gradient: 'from-green-500 to-emerald-500',
                      change: '+5% from last month',
                      changeType: 'positive'
                    },
                    { 
                      label: 'Active Violations', 
                      value: dashboardStats.totalViolations, 
                      icon: AlertTriangle, 
                      gradient: 'from-red-500 to-pink-500',
                      change: '-3 resolved this week',
                      changeType: 'positive'
                    },
                    { 
                      label: 'Upcoming Inspections', 
                      value: dashboardStats.upcomingInspections, 
                      icon: Calendar, 
                      gradient: 'from-orange-500 to-amber-500',
                      change: 'Next: Aug 15',
                      changeType: 'neutral'
                    }
                  ].map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <div key={index} className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-300"></div>
                        <div className="relative bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                          <div className="flex items-center justify-between mb-6">
                            <div className="relative">
                              <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} rounded-2xl blur opacity-75`}></div>
                              <div className={`relative p-4 bg-gradient-to-r ${stat.gradient} rounded-2xl`}>
                                <Icon className="h-6 w-6 text-white" />
                              </div>
                            </div>
                            <div className={`flex items-center space-x-1 text-xs font-medium px-3 py-1 rounded-full ${
                              stat.changeType === 'positive' ? 'bg-green-100 text-green-700' :
                              stat.changeType === 'negative' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              <TrendingUp className={`h-3 w-3 ${
                                stat.changeType === 'positive' ? 'text-green-500' :
                                stat.changeType === 'negative' ? 'text-red-500 transform rotate-180' :
                                'text-gray-500'
                              }`} />
                              <span>Trending</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                            <p className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                              {stat.value}
                            </p>
                            <p className="text-xs text-gray-500">{stat.change}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Navigation Tabs */}
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden mb-8">
                  <div className="p-6 border-b border-white/10">
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'portfolio', label: 'Portfolio', icon: Building },
                        { id: 'calendar', label: 'Calendar', icon: Calendar },
                        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                        { id: 'vendors', label: 'Vendors', icon: Users }
                      ].map(tab => {
                        const Icon = tab.icon;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveView(tab.id)}
                            className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-medium transition-all duration-300 ${
                              activeView === tab.id
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                                : 'bg-white/50 text-gray-600 hover:bg-white/80'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
                  {activeView === 'portfolio' && (
                    <>
                      <div className="p-8 border-b border-white/10">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                          <div>
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                              Property Portfolio
                            </h2>
                            <p className="text-gray-600 text-lg">Manage and monitor your property compliance in real-time</p>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative">
                              <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="appearance-none bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl px-6 py-3 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-700 font-medium"
                              >
                                <option value="all">All Property Types</option>
                                <option value="residential">Residential</option>
                                <option value="commercial">Commercial</option>
                                <option value="mixed use">Mixed Use</option>
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                            </div>
                            <button
                              onClick={() => setShowAddForm(!showAddForm)}
                              className="flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg transform hover:scale-105 font-medium"
                            >
                              <Plus className="h-5 w-5" />
                              <span>Add New Property</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Search and Filters */}
                      <div className="p-6 border-b border-white/10 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
                        <div className="flex flex-col lg:flex-row gap-4">
                          <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search properties by address, type, or status..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Professional Table View */}
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50/80 backdrop-blur-sm">
                            <tr>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100/50" onClick={() => handleSort('address')}>
                                <div className="flex items-center space-x-2">
                                  <span>Property Address</span>
                                  <ArrowUpDown className="h-4 w-4 text-gray-400" />
                                </div>
                              </th>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Compliance</th>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Violations</th>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200/50">
                            {filteredAndSortedProperties().map((property) => (
                              <tr key={property.id} className="hover:bg-white/50 transition-colors duration-200">
                                <td className="px-6 py-4">
                                  <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                                      <Building className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                      <div className="font-medium text-gray-900">{property.address}</div>
                                      <div className="text-sm text-gray-500">ID: {property.id}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                                    property.type === 'Residential' ? 'bg-green-100 text-green-800' :
                                    property.type === 'Commercial' ? 'bg-blue-100 text-blue-800' :
                                    'bg-purple-100 text-purple-800'
                                  }`}>
                                    {property.type}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center space-x-2">
                                    <div className={`w-3 h-3 rounded-full ${
                                      property.compliance_score >= 90 ? 'bg-green-500' :
                                      property.compliance_score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}></div>
                                    <span className="font-medium">{property.compliance_score}%</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm ${
                                    property.violations === 0 ? 'bg-green-100 text-green-800' :
                                    property.violations <= 2 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {property.violations} violations
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => {
                                        setSelectedProperty(property);
                                        setShowInspectionDashboard(true);
                                      }}
                                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                      title="View Inspections"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {activeView === 'calendar' && (
                    <div className="p-8">
                      <div className="mb-6">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                          Inspection Calendar
                        </h2>
                        <p className="text-gray-600 text-lg">View and manage all property inspections</p>
                      </div>
                      <InspectionCalendar />
                    </div>
                  )}

                  {activeView === 'analytics' && (
                    <div className="p-8">
                      <div className="mb-6">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                          Compliance Analytics
                        </h2>
                        <p className="text-gray-600 text-lg">Insights and trends across your portfolio</p>
                      </div>
                      <ComplianceAnalytics />
                    </div>
                  )}

                  {activeView === 'vendors' && (
                    <div className="p-8">
                      <div className="mb-6">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                          Vendor Marketplace
                        </h2>
                        <p className="text-gray-600 text-lg">Find and book certified inspection vendors</p>
                      </div>
                      <VendorIntegration />
                    </div>
                  )}
                </div>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900">Add New Property</h3>
                            <p className="text-gray-600">Enter property details to start compliance tracking</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                              <MapPin className="h-4 w-4" />
                              <span>Property Address *</span>
                            </label>
                            <input
                              type="text"
                              placeholder="123 Main Street, New York, NY 10001"
                              value={newProperty.address}
                              onChange={(e) => setNewProperty({...newProperty, address: e.target.value})}
                              className="w-full px-4 py-4 bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-700"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                              <Building className="h-4 w-4" />
                              <span>Property Type</span>
                            </label>
                            <select
                              value={newProperty.type}
                              onChange={(e) => setNewProperty({...newProperty, type: e.target.value})}
                              className="w-full px-4 py-4 bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-700"
                            >
                              <option value="Residential">Residential</option>
                              <option value="Commercial">Commercial</option>
                              <option value="Mixed Use">Mixed Use</option>
                            </select>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                              <Home className="h-4 w-4" />
                              <span>Number of Units *</span>
                            </label>
                            <input
                              type="number"
                              placeholder="24"
                              value={newProperty.units}
                              onChange={(e) => setNewProperty({...newProperty, units: e.target.value})}
                              className="w-full px-4 py-4 bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-700"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                              <Calendar className="h-4 w-4" />
                              <span>Year Built</span>
                            </label>
                            <input
                              type="text"
                              placeholder="1985"
                              value={newProperty.yearBuilt}
                              onChange={(e) => setNewProperty({...newProperty, yearBuilt: e.target.value})}
                              className="w-full px-4 py-4 bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-700"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                              <Phone className="h-4 w-4" />
                              <span>Contact Information</span>
                            </label>
                            <input
                              type="text"
                              placeholder="Phone or Email"
                              value={newProperty.contact}
                              onChange={(e) => setNewProperty({...newProperty, contact: e.target.value})}
                              className="w-full px-4 py-4 bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-700"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                              <Briefcase className="h-4 w-4" />
                              <span>Management Company</span>
                            </label>
                            <input
                              type="text"
                              placeholder="ABC Property Management"
                              value={newProperty.managementCompany}
                              onChange={(e) => setNewProperty({...newProperty, managementCompany: e.target.value})}
                              className="w-full px-4 py-4 bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-700"
                            />
                          </div>
                        </div>
                        
                        <div className="mt-8 flex flex-col sm:flex-row gap-4">
                          <button
                            onClick={handleAddProperty}
                            disabled={loading}
                            className="flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105 font-medium"
                          >
                            {loading ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                <span>Adding Property...</span>
                              </>
                            ) : (
                              <>
                                <Plus className="h-5 w-5" />
                                <span>Add Property</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setShowAddForm(false)}
                            className="px-8 py-4 bg-white/80 backdrop-blur-sm border border-white/30 text-gray-700 rounded-2xl hover:bg-white/90 transition-all duration-300 font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Premium Properties Grid */}
                  <div className="p-8">
                    {loading && filteredProperties.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                        <p className="text-gray-600 text-lg font-medium">Loading properties...</p>
                      </div>
                    ) : filteredProperties.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full mb-4">
                          <Building className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No properties found</h3>
                        <p className="text-gray-600 mb-6">No properties match your current search criteria.</p>
                        <button
                          onClick={() => setShowAddForm(true)}
                          className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg"
                        >
                          <Plus className="h-5 w-5" />
                          <span>Add Your First Property</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredProperties.map(property => (
                          <div key={property.id} className="group relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="relative bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
                              {/* Property Header */}
                              <div className="flex items-start justify-between mb-6">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-3">
                                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                                      <MapPin className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                                        {property.address}
                                      </h3>
                                    </div>
                                  </div>
                                  
                                  {/* Compliance Score */}
                                  <div className="flex items-center space-x-3 mb-4">
                                    <div className={`flex items-center space-x-2 px-4 py-2 rounded-2xl font-medium text-sm ${
                                      property.complianceScore >= 90 
                                        ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800' :
                                      property.complianceScore >= 75 
                                        ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800' :
                                        'bg-gradient-to-r from-red-100 to-pink-100 text-red-800'
                                    }`}>
                                      <CheckCircle className="h-4 w-4" />
                                      <span>{property.complianceScore}% Compliant</span>
                                    </div>
                                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                                      <Clock className="h-3 w-3" />
                                      <span>Updated 2h ago</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <button className="p-2 rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 hover:bg-white/80 transition-all duration-300 group">
                                  <MoreVertical className="h-5 w-5 text-gray-600 group-hover:text-gray-800" />
                                </button>
                              </div>
                              
                              {/* Property Details */}
                              <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="text-center">
                                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-2xl mb-2 mx-auto">
                                    <Building className="h-6 w-6 text-blue-600" />
                                  </div>
                                  <p className="text-sm font-medium text-gray-600">Type</p>
                                  <p className="text-lg font-bold text-gray-900">{property.type}</p>
                                </div>
                                
                                <div className="text-center">
                                  <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-2xl mb-2 mx-auto">
                                    <Home className="h-6 w-6 text-purple-600" />
                                  </div>
                                  <p className="text-sm font-medium text-gray-600">Units</p>
                                  <p className="text-lg font-bold text-gray-900">{property.units}</p>
                                </div>
                                
                                <div className="text-center">
                                  <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-2xl mb-2 mx-auto">
                                    <AlertTriangle className="h-6 w-6 text-red-600" />
                                  </div>
                                  <p className="text-sm font-medium text-gray-600">Violations</p>
                                  <p className="text-lg font-bold text-gray-900">{property.violations}</p>
                                </div>
                              </div>
                              
                              {/* Next Inspection */}
                              <div className="flex items-center space-x-3 mb-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-100">
                                <Calendar className="h-5 w-5 text-orange-600" />
                                <div>
                                  <p className="text-sm font-medium text-gray-600">Next Inspection</p>
                                  <p className="text-lg font-bold text-orange-700">{property.nextInspection}</p>
                                </div>
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex gap-3">
                                <button
                                  onClick={() => supabaseApi.generateComplianceReport(property.id)}
                                  className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-3 rounded-2xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg transform hover:scale-105 font-medium"
                                >
                                  <FileText className="h-4 w-4" />
                                  <span>Report</span>
                                </button>
                                <button
                                  onClick={() => supabaseApi.generateAiAnalysis(property.id)}
                                  className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3 rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg transform hover:scale-105 font-medium"
                                >
                                  <Zap className="h-4 w-4" />
                                  <span>AI Analysis</span>
                                </button>
                                <button className="p-3 bg-white/60 backdrop-blur-sm border border-white/30 rounded-2xl hover:bg-white/80 transition-all duration-300 group">
                                  <Eye className="h-4 w-4 text-gray-600 group-hover:text-gray-800" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Other tabs content would go here */}
            {activeTab === 'compliance' && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-semibold mb-4">Compliance Reports</h2>
                {loading && <div className="text-center py-8">Generating report...</div>}
                {complianceReport && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Report for {selectedProperty?.address}</h3>
                      <span className="text-sm text-gray-500">
                        {new Date(complianceReport.generatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {complianceReport.sections.map((section, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium">{section.name}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              section.status === 'Compliant' ? 'bg-green-100 text-green-800' :
                              section.status === 'Minor Issues' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {section.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">Score: {section.score}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'vendors' && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Vendor Marketplace</h2>
                  <button
                    onClick={supabaseApi.searchVendors}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Search Vendors
                  </button>
                </div>
                {vendors.map(vendor => (
                  <div key={vendor.id} className="border-b py-4 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{vendor.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Star className="h-4 w-4 text-yellow-400" />
                          <span className="text-sm">{vendor.rating}</span>
                          <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                            {vendor.complianceMatch}% Match
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{vendor.phone}</p>
                      </div>
                      <button className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm">
                        Contact
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-semibold mb-4">AI Analytics</h2>
                {loading && <div className="text-center py-8">Generating analysis...</div>}
                {aiAnalysis && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2">
                        <h3 className="font-medium mb-3">AI Insights</h3>
                        <div className="space-y-3">
                          {aiAnalysis.insights.map((insight, index) => (
                            <div key={index} className="p-3 bg-purple-50 rounded-lg">
                              <p className="text-sm">{insight}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium mb-3">Risk Score</h4>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600 mb-2">
                            {aiAnalysis.riskScore}
                          </div>
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                            {aiAnalysis.priority} Priority
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Enhanced Property Form */}
      <EnhancedPropertyForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSubmit={handleAddProperty}
        supabase={supabase}
      />

      {/* Inspection Dashboard Modal */}
      {selectedProperty && activeTab === 'inspections' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Inspection Management</h2>
                  <p className="text-blue-100">{selectedProperty.address}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedProperty(null);
                    setActiveTab('dashboard');
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[75vh]">
              <InspectionDashboard
                propertyId={selectedProperty.id}
                supabase={supabase}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropplyAI;
