import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import {
  Calendar, Plus, CheckCircle, Clock, AlertTriangle, Building, Users,
  Search, Edit, Trash2, X, BarChart3, TrendingUp
} from 'lucide-react';

const TodoGenerator = ({ user, properties }) => {
  const [todos, setTodos] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreateTodo, setShowCreateTodo] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    assigned_to: ''
  });

  useEffect(() => {
    fetchTodos();
  }, [user, fetchTodos]);

  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('property_todos')
        .select(`
          *,
          properties (
            address,
            city,
            type
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTodos(data || []);
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  const createTodo = async (e) => {
    e.preventDefault();
    if (!selectedProperty || !newTodo.title) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('property_todos')
        .insert([{
          property_id: selectedProperty.id,
          user_id: user.id,
          title: newTodo.title,
          description: newTodo.description,
          priority: newTodo.priority,
          due_date: newTodo.due_date || null,
          assigned_to: newTodo.assigned_to || null,
          status: 'pending'
        }])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        setTodos(prev => [data[0], ...prev]);
        setNewTodo({
          title: '',
          description: '',
          priority: 'medium',
          due_date: '',
          assigned_to: ''
        });
        setShowCreateTodo(false);
      }
    } catch (error) {
      console.error('Error creating todo:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTodoStatus = async (todoId, newStatus) => {
    try {
      const { error } = await supabase
        .from('property_todos')
        .update({ status: newStatus })
        .eq('id', todoId);

      if (error) throw error;

      setTodos(prev => prev.map(todo => 
        todo.id === todoId ? { ...todo, status: newStatus } : todo
      ));
    } catch (error) {
      console.error('Error updating todo status:', error);
    }
  };

  const deleteTodo = async (todoId) => {
    try {
      const { error } = await supabase
        .from('property_todos')
        .delete()
        .eq('id', todoId);

      if (error) throw error;

      setTodos(prev => prev.filter(todo => todo.id !== todoId));
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const generateQuickTodos = async () => {
    if (!selectedProperty) return;

    try {
      setLoading(true);
      
      // Generate quick todos based on property compliance needs
      const quickTodos = [
        {
          title: 'Schedule Annual Fire Safety Inspection',
          description: 'Annual fire safety inspection required for compliance',
          priority: 'high',
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        {
          title: 'Review Property Insurance Coverage',
          description: 'Annual insurance review and renewal process',
          priority: 'medium',
          due_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        {
          title: 'Update Emergency Contact Information',
          description: 'Ensure all emergency contacts are current and accessible',
          priority: 'low',
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      ];

      const todoRecords = quickTodos.map(todo => ({
        property_id: selectedProperty.id,
        user_id: user.id,
        ...todo,
        status: 'pending'
      }));

      const { data, error } = await supabase
        .from('property_todos')
        .insert(todoRecords)
        .select();

      if (error) throw error;

      if (data) {
        setTodos(prev => [...data, ...prev]);
      }
    } catch (error) {
      console.error('Error generating quick todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTodos = todos.filter(todo => {
    const matchesSearch = todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         todo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         todo.properties?.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || todo.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || todo.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const dashboardStats = {
    total: todos.length,
    pending: todos.filter(t => t.status === 'pending').length,
    inProgress: todos.filter(t => t.status === 'in_progress').length,
    completed: todos.filter(t => t.status === 'completed').length,
    overdue: todos.filter(t => isOverdue(t.due_date)).length
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
              To-Do Generator
            </h2>
            <p className="text-gray-600 text-lg">
              Quick To-Do generation per property with portfolio roll-up
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={generateQuickTodos}
              disabled={!selectedProperty || loading}
              className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BarChart3 className="h-5 w-5" />
              <span>Generate Quick Todos</span>
            </button>
            <button
              onClick={() => setShowCreateTodo(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg transform hover:scale-105"
            >
              <Plus className="h-5 w-5" />
              <span>Add Todo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: 'Total', value: dashboardStats.total, icon: Calendar, gradient: 'from-blue-500 to-cyan-500' },
          { label: 'Pending', value: dashboardStats.pending, icon: Clock, gradient: 'from-yellow-500 to-orange-500' },
          { label: 'In Progress', value: dashboardStats.inProgress, icon: TrendingUp, gradient: 'from-blue-500 to-indigo-500' },
          { label: 'Completed', value: dashboardStats.completed, icon: CheckCircle, gradient: 'from-green-500 to-emerald-500' },
          { label: 'Overdue', value: dashboardStats.overdue, icon: AlertTriangle, gradient: 'from-red-500 to-pink-500' }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-300"></div>
              <div className="relative bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                <div className="flex items-center justify-between mb-4">
                  <div className="relative">
                    <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} rounded-2xl blur opacity-75`}></div>
                    <div className={`relative p-3 bg-gradient-to-r ${stat.gradient} rounded-2xl`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
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

      {/* Filters */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search todos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Todos List */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-xl font-bold text-gray-900">
            Your Todos
            <span className="text-gray-500 font-normal ml-2">({filteredTodos.length})</span>
          </h3>
        </div>

        <div className="divide-y divide-gray-200/50">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
              <p className="text-gray-600">Loading todos...</p>
            </div>
          ) : filteredTodos.length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full mb-4">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No todos yet</h3>
              <p className="text-gray-600 mb-4">Create your first todo or generate quick todos for a property.</p>
              <button
                onClick={() => setShowCreateTodo(true)}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg"
              >
                <Plus className="h-5 w-5" />
                <span>Add Todo</span>
              </button>
            </div>
          ) : (
            filteredTodos.map(todo => (
              <div key={todo.id} className="p-6 hover:bg-white/50 transition-colors duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`p-2 rounded-lg ${getPriorityColor(todo.priority).replace('text-', 'text-').replace('bg-', 'bg-')}`}>
                        {getPriorityIcon(todo.priority)}
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">{todo.title}</h4>
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(todo.priority)}`}>
                        {todo.priority}
                      </span>
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(todo.status)}`}>
                        {todo.status.replace('_', ' ')}
                      </span>
                      {isOverdue(todo.due_date) && (
                        <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          Overdue
                        </span>
                      )}
                    </div>

                    {todo.description && (
                      <p className="text-gray-600 mb-3">{todo.description}</p>
                    )}

                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Building className="h-4 w-4" />
                        <span>{todo.properties?.address}</span>
                      </div>
                      {todo.due_date && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span className={isOverdue(todo.due_date) ? 'text-red-600 font-medium' : ''}>
                            Due {new Date(todo.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {todo.assigned_to && (
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{todo.assigned_to}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>Created {new Date(todo.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {todo.status === 'pending' && (
                      <button
                        onClick={() => updateTodoStatus(todo.id, 'in_progress')}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Start Task"
                      >
                        <TrendingUp className="h-4 w-4" />
                      </button>
                    )}
                    {todo.status === 'in_progress' && (
                      <button
                        onClick={() => updateTodoStatus(todo.id, 'completed')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Complete Task"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    {todo.status === 'completed' && (
                      <button
                        onClick={() => updateTodoStatus(todo.id, 'pending')}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Reopen Task"
                      >
                        <Clock className="h-4 w-4" />
                      </button>
                    )}
                    <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Todo Modal */}
      {showCreateTodo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Create New Todo</h2>
              <button
                onClick={() => setShowCreateTodo(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={createTodo} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Todo Title *</label>
                <input
                  type="text"
                  value={newTodo.title}
                  onChange={(e) => setNewTodo({...newTodo, title: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Schedule fire safety inspection"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newTodo.description}
                  onChange={(e) => setNewTodo({...newTodo, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add any additional details or notes..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={newTodo.priority}
                    onChange={(e) => setNewTodo({...newTodo, priority: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={newTodo.due_date}
                    onChange={(e) => setNewTodo({...newTodo, due_date: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
                <input
                  type="text"
                  value={newTodo.assigned_to}
                  onChange={(e) => setNewTodo({...newTodo, assigned_to: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., John Smith, Maintenance Team"
                />
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
                      <span>Creating Todo...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      <span>Create Todo</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateTodo(false)}
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

export default TodoGenerator;

