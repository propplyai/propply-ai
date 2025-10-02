import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import {
  Calendar, Plus, Search, Filter, Building, Clock, CheckCircle,
  AlertTriangle, TrendingUp, Eye, Edit, Trash2, Star, Tag
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const TodoGeneratorPage = ({ user, properties }) => {
  const { theme, isDark } = useTheme();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedProperty, setSelectedProperty] = useState(null);

  useEffect(() => {
    fetchTodos();
  }, [user.id]);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API calls
      const mockTodos = [
        {
          id: 1,
          title: 'Schedule Fire Safety Inspection',
          description: 'Contact NYC Fire Department to schedule annual fire safety inspection',
          property_id: properties[0]?.id,
          property_address: properties[0]?.address || '140 W 28th St, New York, NY 10001',
          status: 'pending',
          priority: 'high',
          due_date: '2024-02-15',
          created_at: '2024-01-15',
          category: 'Safety',
          assigned_to: 'Property Manager',
          tags: ['fire_safety', 'inspection', 'urgent']
        },
        {
          id: 2,
          title: 'Boiler Maintenance',
          description: 'Schedule annual boiler maintenance and inspection',
          property_id: properties[0]?.id,
          property_address: properties[0]?.address || '140 W 28th St, New York, NY 10001',
          status: 'in_progress',
          priority: 'medium',
          due_date: '2024-03-01',
          created_at: '2024-01-10',
          category: 'HVAC',
          assigned_to: 'Maintenance Team',
          tags: ['boiler', 'maintenance', 'hvac']
        },
        {
          id: 3,
          title: 'Elevator Certification',
          description: 'Renew elevator safety certification with NYC DOB',
          property_id: properties[0]?.id,
          property_address: properties[0]?.address || '140 W 28th St, New York, NY 10001',
          status: 'completed',
          priority: 'high',
          due_date: '2024-01-30',
          created_at: '2024-01-05',
          category: 'Safety',
          assigned_to: 'Property Manager',
          tags: ['elevator', 'certification', 'safety']
        }
      ];
      setTodos(mockTodos);
    } catch (error) {
      console.error('Error fetching todos:', error);
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
        return <AlertTriangle className="h-5 w-5 text-gold-500" />;
      case 'overdue':
        return <AlertTriangle className="h-5 w-5 text-ruby-500" />;
      default:
        return <Calendar className="h-5 w-5 text-slate-400" />;
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

  const filteredTodos = todos.filter(todo => {
    const matchesSearch = todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         todo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         todo.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || todo.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || todo.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = {
    total: todos.length,
    pending: todos.filter(t => t.status === 'pending').length,
    inProgress: todos.filter(t => t.status === 'in_progress').length,
    completed: todos.filter(t => t.status === 'completed').length,
    overdue: todos.filter(t => t.status === 'overdue').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="enterprise-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-slate-100 mb-2">To-Do Generator</h1>
            <p className="text-slate-400 text-lg">Quick To-Do generation per property with portfolio roll-up</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="btn-primary">
              <Plus className="h-4 w-4" />
              <span>Generate Quick Todos</span>
            </button>
            <button className="btn-secondary">
              <Plus className="h-4 w-4" />
              <span>Add Todo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: 'Total', value: stats.total, icon: Calendar, color: 'corporate' },
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
          {selectedProperty && (
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-slate-800 border border-slate-600 rounded-xl">
                <div className="flex items-center space-x-3">
                  <Building className="h-5 w-5 text-corporate-400" />
                  <div>
                    <p className="text-slate-200 font-medium">
                      {properties.find(p => p.id === selectedProperty)?.address}
                    </p>
                    <p className="text-slate-400 text-sm">NYC</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="enterprise-card p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search todos..."
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

      {/* Todos List */}
      <div className="enterprise-card overflow-hidden">
        <div className="enterprise-card-header">
          <h2 className="text-xl font-bold text-slate-100">Your Todos ({filteredTodos.length})</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-corporate-500"></div>
              <span className="ml-3 text-slate-400">Loading todos...</span>
            </div>
          ) : filteredTodos.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-400 text-lg">No todos yet</p>
              <p className="text-slate-500 text-sm mt-2">Create your first todo to get started</p>
              <button className="btn-primary mt-4">
                <Plus className="h-4 w-4" />
                <span>Add Todo</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTodos.map((todo) => (
                <div key={todo.id} className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:bg-slate-750 transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        {getStatusIcon(todo.status)}
                        <h3 className="text-lg font-semibold text-slate-100">{todo.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(todo.status)}`}>
                          {todo.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(todo.priority)}`}>
                          {todo.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-slate-400 mb-3">{todo.description}</p>
                      <div className="flex items-center space-x-6 text-sm text-slate-500 mb-4">
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4" />
                          <span>{todo.property_address}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>Due: {new Date(todo.due_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Star className="h-4 w-4" />
                          <span>Assigned to: {todo.assigned_to}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {todo.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-slate-700 text-slate-300 rounded-full text-xs">
                            #{tag}
                          </span>
                        ))}
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

export default TodoGeneratorPage;
