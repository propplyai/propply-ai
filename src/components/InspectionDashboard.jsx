import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, AlertTriangle, CheckCircle, DollarSign, 
  Users, FileText, Search, Filter, ChevronDown, Eye, 
  ArrowRight, Bell, Zap, Shield, Building
} from 'lucide-react';

const InspectionDashboard = ({ propertyId, supabase }) => {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('next_due_date');
  const [selectedInspection, setSelectedInspection] = useState(null);

  useEffect(() => {
    if (propertyId) {
      fetchInspections();
    }
  }, [propertyId, filterStatus, sortBy]);

  const fetchInspections = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('inspections')
        .select(`
          *,
          vendors (
            name,
            rating,
            phone,
            email
          )
        `)
        .eq('property_id', propertyId);

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      query = query.order(sortBy, { ascending: true });

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Calculate urgency and update status based on dates
      const processedInspections = (data || []).map(inspection => {
        const nextDue = new Date(inspection.next_due_date);
        const today = new Date();
        const daysUntilDue = Math.ceil((nextDue - today) / (1000 * 60 * 60 * 24));
        
        let urgencyLevel = 'Normal';
        let status = inspection.status;
        
        if (daysUntilDue < 0) {
          urgencyLevel = 'Critical';
          status = 'Overdue';
        } else if (daysUntilDue <= 15) {
          urgencyLevel = 'High';
          status = 'Due Soon';
        } else if (daysUntilDue <= 30) {
          urgencyLevel = 'Normal';
        } else {
          urgencyLevel = 'Low';
        }

        return {
          ...inspection,
          days_until_due: daysUntilDue,
          urgency_level: urgencyLevel,
          calculated_status: status
        };
      });

      setInspections(processedInspections);
    } catch (error) {
      console.error('Error fetching inspections:', error);
      // Fallback to mock data for demo
      setInspections([
        {
          id: '1',
          inspection_type: 'Fire Alarm System Inspection',
          compliance_system: 'fire_alarms',
          frequency: 'Annual',
          category: 'Fire Safety',
          required_by: 'FDNY',
          next_due_date: '2025-08-15',
          last_completed_date: '2024-08-10',
          estimated_cost_min: 30000,
          estimated_cost_max: 50000,
          status: 'Scheduled',
          urgency_level: 'High',
          days_until_due: 15,
          calculated_status: 'Due Soon',
          vendors: null
        },
        {
          id: '2',
          inspection_type: 'Elevator Safety Inspection',
          compliance_system: 'elevators',
          frequency: 'Annual',
          category: 'Building Systems',
          required_by: 'DOB',
          next_due_date: '2025-09-01',
          last_completed_date: '2024-09-01',
          estimated_cost_min: 40000,
          estimated_cost_max: 60000,
          status: 'Scheduled',
          urgency_level: 'Normal',
          days_until_due: 32,
          calculated_status: 'Scheduled',
          vendors: null
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status, urgencyLevel) => {
    switch (status) {
      case 'Overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Due Soon':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyIcon = (urgencyLevel) => {
    switch (urgencyLevel) {
      case 'Critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'High':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'Normal':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Fire Safety':
        return <Shield className="h-5 w-5 text-red-500" />;
      case 'Building Systems':
        return <Building className="h-5 w-5 text-blue-500" />;
      case 'Water Systems':
        return <Zap className="h-5 w-5 text-cyan-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatCurrency = (cents) => {
    return `$${(cents / 100).toLocaleString()}`;
  };

  const filteredInspections = inspections.filter(inspection => {
    if (filterStatus === 'all') return true;
    return inspection.calculated_status.toLowerCase().includes(filterStatus.toLowerCase()) ||
           inspection.status.toLowerCase().includes(filterStatus.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inspection Dashboard</h2>
          <p className="text-gray-600">Track and manage property compliance inspections</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-xl px-4 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Inspections</option>
              <option value="overdue">Overdue</option>
              <option value="due soon">Due Soon</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
          </div>
          
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-xl px-4 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="next_due_date">Sort by Due Date</option>
              <option value="urgency_level">Sort by Urgency</option>
              <option value="category">Sort by Category</option>
              <option value="estimated_cost_min">Sort by Cost</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Inspections',
            value: inspections.length,
            icon: FileText,
            color: 'blue'
          },
          {
            label: 'Overdue',
            value: inspections.filter(i => i.calculated_status === 'Overdue').length,
            icon: AlertTriangle,
            color: 'red'
          },
          {
            label: 'Due Soon',
            value: inspections.filter(i => i.calculated_status === 'Due Soon').length,
            icon: Clock,
            color: 'orange'
          },
          {
            label: 'Completed',
            value: inspections.filter(i => i.status === 'Completed').length,
            icon: CheckCircle,
            color: 'green'
          }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <Icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inspection Cards */}
      <div className="space-y-4">
        {filteredInspections.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No inspections found</h3>
            <p className="text-gray-600">No inspections match your current filter criteria.</p>
          </div>
        ) : (
          filteredInspections.map((inspection) => (
            <div
              key={inspection.id}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {getCategoryIcon(inspection.category)}
                    <h3 className="text-lg font-semibold text-gray-900">
                      {inspection.inspection_type}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(inspection.calculated_status, inspection.urgency_level)}`}>
                      {inspection.calculated_status}
                    </span>
                    {getUrgencyIcon(inspection.urgency_level)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Due Date</p>
                      <p className="font-medium text-gray-900">
                        {new Date(inspection.next_due_date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {inspection.days_until_due > 0 
                          ? `${inspection.days_until_due} days left`
                          : `${Math.abs(inspection.days_until_due)} days overdue`
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Last Completed</p>
                      <p className="font-medium text-gray-900">
                        {inspection.last_completed_date 
                          ? new Date(inspection.last_completed_date).toLocaleDateString()
                          : 'Never'
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Required By</p>
                      <p className="font-medium text-gray-900">{inspection.required_by}</p>
                      <p className="text-xs text-gray-500">{inspection.frequency}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Estimated Cost</p>
                      <p className="font-medium text-green-600">
                        {formatCurrency(inspection.estimated_cost_min)} - {formatCurrency(inspection.estimated_cost_max)}
                      </p>
                    </div>
                  </div>

                  {inspection.vendors && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-2">Assigned Vendor</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{inspection.vendors.name}</p>
                          <p className="text-sm text-gray-600">{inspection.vendors.phone}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">{inspection.vendors.rating}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                    Schedule Inspection
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                    Find Vendors
                  </button>
                  <button 
                    onClick={() => setSelectedInspection(inspection)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Inspection Detail Modal */}
      {selectedInspection && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedInspection.inspection_type}
                </h3>
                <button
                  onClick={() => setSelectedInspection(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Inspection Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Category:</span>
                        <span className="font-medium">{selectedInspection.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Frequency:</span>
                        <span className="font-medium">{selectedInspection.frequency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Required By:</span>
                        <span className="font-medium">{selectedInspection.required_by}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Schedule</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Next Due:</span>
                        <span className="font-medium">
                          {new Date(selectedInspection.next_due_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Last Completed:</span>
                        <span className="font-medium">
                          {selectedInspection.last_completed_date 
                            ? new Date(selectedInspection.last_completed_date).toLocaleDateString()
                            : 'Never'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedInspection.calculated_status)}`}>
                          {selectedInspection.calculated_status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Cost Estimate</h4>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedInspection.estimated_cost_min)} - {formatCurrency(selectedInspection.estimated_cost_max)}
                    </p>
                    <p className="text-sm text-gray-600">Estimated inspection cost</p>
                  </div>
                </div>

                {selectedInspection.notes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                    <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">
                      {selectedInspection.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setSelectedInspection(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Schedule Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectionDashboard;
