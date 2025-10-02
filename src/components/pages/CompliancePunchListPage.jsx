import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import {
  CheckCircle, AlertTriangle, AlertCircle, Clock, Calendar,
  Building, MapPin, Filter, Search, Plus, Eye, Edit, Trash2,
  TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const CompliancePunchListPage = ({ user, properties }) => {
  const { theme, isDark } = useTheme();
  const [complianceItems, setComplianceItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedProperty, setSelectedProperty] = useState(null);

  useEffect(() => {
    fetchComplianceItems();
  }, [user.id]);

  const fetchComplianceItems = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API calls
      const mockItems = [
        {
          id: 1,
          property_id: properties[0]?.id,
          property_address: properties[0]?.address || '140 W 28th St, New York, NY 10001',
          title: 'Fire Safety Inspection',
          description: 'Annual fire safety inspection required by NYC Fire Department',
          status: 'pending',
          priority: 'high',
          due_date: '2024-02-15',
          created_at: '2024-01-15',
          category: 'Safety'
        },
        {
          id: 2,
          property_id: properties[0]?.id,
          property_address: properties[0]?.address || '140 W 28th St, New York, NY 10001',
          title: 'Boiler Inspection',
          description: 'Annual boiler inspection and certification',
          status: 'in_progress',
          priority: 'medium',
          due_date: '2024-03-01',
          created_at: '2024-01-10',
          category: 'HVAC'
        },
        {
          id: 3,
          property_id: properties[0]?.id,
          property_address: properties[0]?.address || '140 W 28th St, New York, NY 10001',
          title: 'Elevator Certification',
          description: 'Annual elevator safety inspection and certification',
          status: 'completed',
          priority: 'high',
          due_date: '2024-01-30',
          created_at: '2024-01-05',
          category: 'Safety'
        }
      ];
      setComplianceItems(mockItems);
    } catch (error) {
      console.error('Error fetching compliance items:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-corporate-500" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-gold-500" />;
      case 'overdue':
        return <AlertTriangle className="h-5 w-5 text-ruby-500" />;
      default:
        return <Minus className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'in_progress':
        return 'bg-corporate-100 text-corporate-800 border-corporate-200';
      case 'pending':
        return 'bg-gold-100 text-gold-800 border-gold-200';
      case 'overdue':
        return 'bg-ruby-100 text-ruby-800 border-ruby-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-ruby-100 text-ruby-800 border-ruby-200';
      case 'medium':
        return 'bg-gold-100 text-gold-800 border-gold-200';
      case 'low':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const filteredItems = complianceItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || item.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = {
    total: complianceItems.length,
    pending: complianceItems.filter(item => item.status === 'pending').length,
    inProgress: complianceItems.filter(item => item.status === 'in_progress').length,
    completed: complianceItems.filter(item => item.status === 'completed').length,
    overdue: complianceItems.filter(item => item.status === 'overdue').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="enterprise-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-slate-100 mb-2">Compliance Punch List</h1>
            <p className="text-slate-400 text-lg">Track and manage property compliance requirements</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="btn-primary">
              <Plus className="h-4 w-4" />
              <span>Add Compliance Item</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: 'Total', value: stats.total, icon: Building, color: 'corporate' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'gold' },
          { label: 'In Progress', value: stats.inProgress, icon: TrendingUp, color: 'corporate' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'emerald' },
          { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, color: 'ruby' }
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

      {/* Filters */}
      <div className="enterprise-card p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search compliance items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-xl focus:ring-2 focus:ring-corporate-500 focus:border-corporate-500 transition-all duration-300 text-slate-200 placeholder-slate-400 hover:bg-slate-700"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl focus:ring-2 focus:ring-corporate-500 focus:border-corporate-500 transition-all duration-300 text-slate-200 hover:bg-slate-700"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl focus:ring-2 focus:ring-corporate-500 focus:border-corporate-500 transition-all duration-300 text-slate-200 hover:bg-slate-700"
          >
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Compliance Items List */}
      <div className="enterprise-card overflow-hidden">
        <div className="enterprise-card-header">
          <h2 className="text-xl font-bold text-slate-100">Compliance Items ({filteredItems.length})</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-corporate-500"></div>
              <span className="ml-3 text-slate-400">Loading compliance items...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-400 text-lg">No compliance items found</p>
              <p className="text-slate-500 text-sm mt-2">Add your first compliance item to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <div key={item.id} className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:bg-slate-750 transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        {getStatusIcon(item.status)}
                        <h3 className="text-lg font-semibold text-slate-100">{item.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                          {item.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(item.priority)}`}>
                          {item.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-slate-400 mb-3">{item.description}</p>
                      <div className="flex items-center space-x-6 text-sm text-slate-500">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>{item.property_address}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>Due: {new Date(item.due_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4" />
                          <span>{item.category}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button className="p-2 text-corporate-400 hover:bg-corporate-500/20 rounded-lg transition-all duration-300">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:bg-slate-700 rounded-lg transition-all duration-300">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-ruby-400 hover:bg-ruby-500/20 rounded-lg transition-all duration-300">
                        <Trash2 className="h-4 w-4" />
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
  );
};

export default CompliancePunchListPage;
