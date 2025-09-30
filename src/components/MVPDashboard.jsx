import React, { useState, useEffect, useCallback } from 'react';
import { supabase, APP_CONFIG } from '../config/supabase';
import {
  Building, Users, BarChart3, Calendar, Plus, Search, Eye,
  ArrowUpDown, CheckCircle, AlertTriangle, TrendingUp, Bell, Settings,
  Sparkles, MapPin, X, Menu, FileText, Home, Phone, Briefcase,
  ChevronDown, MoreVertical, Award, Globe, User
} from 'lucide-react';
import CompliancePunchList from './CompliancePunchList';
import VendorRFP from './VendorRFP';
import ReportLibrary from './ReportLibrary';
import TodoGenerator from './TodoGenerator';
import UserProfile from './UserProfile';

const MVPDashboard = ({ user, onLogout, initialTab = 'dashboard' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [properties, setProperties] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortField, setSortField] = useState('address');
  const [sortDirection, setSortDirection] = useState('asc');
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProperty, setNewProperty] = useState({
    address: '',
    city: 'NYC',
    type: 'Residential',
    units: '',
    yearBuilt: '',
    contact: '',
    managementCompany: ''
  });

  // Fetch user profile and properties
  useEffect(() => {
    fetchUserProfile();
    fetchProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }, [user.id]);

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  const handleAddProperty = async (e) => {
    e.preventDefault();
    if (!newProperty.address || !newProperty.units) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .insert([{
          ...newProperty,
          user_id: user.id,
          compliance_score: Math.floor(Math.random() * 30) + 70,
          violations: Math.floor(Math.random() * 5),
          next_inspection: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'Active'
        }])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        setProperties(prev => [data[0], ...prev]);
        setNewProperty({
          address: '',
          city: 'NYC',
          type: 'Residential',
          units: '',
          yearBuilt: '',
          contact: '',
          managementCompany: ''
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error adding property:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const dashboardStats = {
    totalProperties: properties.length,
    complianceRate: properties.length > 0 ? Math.round(properties.reduce((acc, p) => acc + (p.compliance_score || 0), 0) / properties.length) : 0,
    totalViolations: properties.reduce((acc, p) => acc + (p.violations || 0), 0),
    upcomingInspections: properties.filter(p => new Date(p.next_inspection) <= new Date(Date.now() + 30*24*60*60*1000)).length
  };

  const navigationTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, gradient: 'from-blue-500 to-cyan-500' },
    { id: 'profile', label: 'My Profile', icon: User, gradient: 'from-pink-500 to-rose-500' },
    { id: 'compliance', label: 'Compliance Punch List', icon: CheckCircle, gradient: 'from-green-500 to-emerald-500' },
    { id: 'vendors', label: 'Vendor RFPs', icon: Users, gradient: 'from-purple-500 to-pink-500' },
    { id: 'reports', label: 'Report Library', icon: FileText, gradient: 'from-orange-500 to-red-500' },
    { id: 'todos', label: 'To-Do Generator', icon: Calendar, gradient: 'from-indigo-500 to-purple-500' }
  ];

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
                    {APP_CONFIG.name}
                  </h1>
                  <p className="text-gray-600 text-sm font-medium">Property Compliance Management</p>
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
              <button 
                onClick={() => setActiveTab('profile')}
                className="p-3 rounded-xl bg-white/60 backdrop-blur-sm border border-white/20 hover:bg-white/80 transition-all duration-300 group"
                title="Settings"
              >
                <Settings className="h-5 w-5 text-gray-700 group-hover:text-blue-600 transition-colors" />
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className="relative cursor-pointer"
                title="View Profile"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-75"></div>
                <div className="relative h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  {userProfile?.avatar_url ? (
                    <img src={userProfile.avatar_url} alt="Avatar" className="h-8 w-8 rounded-lg" />
                  ) : (
                    <User className="h-5 w-5 text-white" />
                  )}
                </div>
              </button>
              <button
                onClick={onLogout}
                className="text-gray-600 hover:text-red-600 transition-colors font-medium"
              >
                Logout
              </button>
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
                  <div className="flex justify-between items-center mt-1">
                    <span>Properties</span>
                    <span className="font-bold text-blue-600">{dashboardStats.totalProperties}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 px-6 space-y-3">
              {navigationTabs.map(tab => {
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
                    <span className="text-sm font-semibold">Current Plan</span>
                  </div>
                  <p className="text-xs text-gray-300 mb-3">
                    {APP_CONFIG.subscriptionTiers[userProfile?.subscription_tier || 'free'].name}
                  </p>
                  <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-medium py-2 px-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300">
                    Upgrade Plan
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
                          Welcome back, {userProfile?.full_name || 'User'}! 👋
                        </h2>
                        <p className="text-gray-600 text-lg">Here's what's happening with your properties today</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <button 
                          onClick={() => setShowAddForm(!showAddForm)}
                          className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg transform hover:scale-105"
                        >
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

                {/* Properties Section */}
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
                  <div className="p-8 border-b border-white/10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                          Your Properties
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
                            <option value="Residential">Residential</option>
                            <option value="Commercial">Commercial</option>
                            <option value="Mixed Use">Mixed Use</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Search */}
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

                  {/* Properties Table */}
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
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">City</th>
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
                                property.city === 'NYC' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {property.city}
                              </span>
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
                                  onClick={() => setActiveTab('compliance')}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="View Compliance"
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
                </div>
              </div>
            )}

            {/* Other Tabs */}
            {activeTab === 'profile' && <UserProfile user={user} onProfileUpdate={fetchUserProfile} />}
            {activeTab === 'compliance' && <CompliancePunchList user={user} properties={properties} />}
            {activeTab === 'vendors' && <VendorRFP user={user} properties={properties} />}
            {activeTab === 'reports' && <ReportLibrary user={user} properties={properties} />}
            {activeTab === 'todos' && <TodoGenerator user={user} properties={properties} />}
          </div>
        </main>
      </div>

      {/* Add Property Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Add New Property</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddProperty} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                    <Globe className="h-4 w-4" />
                    <span>City *</span>
                  </label>
                  <select
                    value={newProperty.city}
                    onChange={(e) => setNewProperty({...newProperty, city: e.target.value})}
                    className="w-full px-4 py-4 bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-700"
                    required
                  >
                    <option value="NYC">New York City</option>
                    <option value="Philadelphia">Philadelphia</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                    <Building className="h-4 w-4" />
                    <span>Property Type *</span>
                  </label>
                  <select
                    value={newProperty.type}
                    onChange={(e) => setNewProperty({...newProperty, type: e.target.value})}
                    className="w-full px-4 py-4 bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-700"
                    required
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
                    required
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
              
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button
                  type="submit"
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
                  type="button"
                  onClick={() => setShowAddForm(false)}
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

export default MVPDashboard;
