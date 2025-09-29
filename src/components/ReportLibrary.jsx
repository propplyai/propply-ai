import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import {
  FileText, Download, Eye, Calendar, DollarSign, Clock, AlertTriangle,
  CheckCircle, X, Plus, Search, Filter, Building, RefreshCw
} from 'lucide-react';

const ReportLibrary = ({ user, properties }) => {
  const [purchasedReports, setPurchasedReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedReportType, setSelectedReportType] = useState('');

  useEffect(() => {
    fetchPurchasedReports();
  }, [user]);

  const fetchPurchasedReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('purchased_reports')
        .select(`
          *,
          properties (
            address,
            city,
            type
          )
        `)
        .eq('user_id', user.id)
        .order('purchase_date', { ascending: false });

      if (error) throw error;
      setPurchasedReports(data || []);
    } catch (error) {
      console.error('Error fetching purchased reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const purchaseReport = async (propertyId, reportType, purchaseType = 'single_report') => {
    try {
      setLoading(true);
      
      // Mock report data - in real implementation, this would generate actual compliance data
      const reportData = {
        property_id: propertyId,
        report_type: reportType,
        generated_at: new Date().toISOString(),
        sections: [
          { name: 'Fire Safety', status: 'Compliant', score: 95, nextInspection: '2025-09-15' },
          { name: 'Elevator Safety', status: 'Minor Issues', score: 78, nextInspection: '2025-08-20' },
          { name: 'Boiler Inspection', status: 'Compliant', score: 88, nextInspection: '2025-10-01' },
          { name: 'Environmental', status: 'Needs Attention', score: 65, nextInspection: '2025-07-30' }
        ],
        overall_score: 82,
        recommendations: [
          'Schedule elevator maintenance within 30 days',
          'Update environmental documentation',
          'Review fire safety equipment quarterly'
        ],
        estimated_costs: {
          elevator_maintenance: '$800 - $1,200',
          environmental_review: '$500 - $800',
          fire_safety_equipment: '$300 - $500'
        }
      };

      const price = purchaseType === 'single_report' ? 49.99 : 0;
      const updateEntitlementUntil = new Date();
      updateEntitlementUntil.setDate(updateEntitlementUntil.getDate() + 30); // 30 days for single reports

      const { data, error } = await supabase
        .from('purchased_reports')
        .insert([{
          property_id: propertyId,
          user_id: user.id,
          report_type: reportType,
          purchase_type: purchaseType,
          price: price,
          update_entitlement_until: updateEntitlementUntil.toISOString(),
          report_data: reportData,
          status: 'active'
        }])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        setPurchasedReports(prev => [data[0], ...prev]);
        setShowPurchaseModal(false);
        setSelectedProperty(null);
        setSelectedReportType('');
      }
    } catch (error) {
      console.error('Error purchasing report:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateReport = async (reportId) => {
    try {
      setLoading(true);
      
      // Mock updated report data
      const updatedReportData = {
        property_id: reportId,
        report_type: 'compliance_report',
        generated_at: new Date().toISOString(),
        sections: [
          { name: 'Fire Safety', status: 'Compliant', score: 98, nextInspection: '2025-10-15' },
          { name: 'Elevator Safety', status: 'Compliant', score: 85, nextInspection: '2025-09-20' },
          { name: 'Boiler Inspection', status: 'Compliant', score: 92, nextInspection: '2025-11-01' },
          { name: 'Environmental', status: 'Compliant', score: 78, nextInspection: '2025-08-30' }
        ],
        overall_score: 88,
        recommendations: [
          'Continue regular elevator maintenance schedule',
          'Environmental compliance improved',
          'Fire safety equipment in excellent condition'
        ],
        estimated_costs: {
          elevator_maintenance: '$600 - $900',
          environmental_review: '$300 - $500',
          fire_safety_equipment: '$200 - $400'
        }
      };

      const { error } = await supabase
        .from('purchased_reports')
        .update({
          report_data: updatedReportData,
          last_updated: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;

      fetchPurchasedReports(); // Refresh reports
    } catch (error) {
      console.error('Error updating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = purchasedReports.filter(report => {
    const matchesSearch = report.report_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.properties?.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isUpdateAvailable = (report) => {
    if (!report.update_entitlement_until) return false;
    return new Date(report.update_entitlement_until) > new Date();
  };

  const getDaysUntilExpiry = (report) => {
    if (!report.update_entitlement_until) return null;
    const expiryDate = new Date(report.update_entitlement_until);
    const today = new Date();
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
              Report Library
            </h2>
            <p className="text-gray-600 text-lg">
              Centralized reports with 30-day updates and 12-month entitlements
            </p>
          </div>
          <button
            onClick={() => setShowPurchaseModal(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg transform hover:scale-105"
          >
            <Plus className="h-5 w-5" />
            <span>Purchase Report</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports..."
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
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-xl font-bold text-gray-900">
            Your Reports
            <span className="text-gray-500 font-normal ml-2">({filteredReports.length})</span>
          </h3>
        </div>

        <div className="divide-y divide-gray-200/50">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
              <p className="text-gray-600">Loading reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full mb-4">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No reports yet</h3>
              <p className="text-gray-600 mb-4">Purchase your first compliance report to get started.</p>
              <button
                onClick={() => setShowPurchaseModal(true)}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg"
              >
                <Plus className="h-5 w-5" />
                <span>Purchase Report</span>
              </button>
            </div>
          ) : (
            filteredReports.map(report => {
              const daysUntilExpiry = getDaysUntilExpiry(report);
              const canUpdate = isUpdateAvailable(report);

              return (
                <div key={report.id} className="p-6 hover:bg-white/50 transition-colors duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {report.report_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h4>
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                        {canUpdate && (
                          <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            Updates Available
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-6 text-sm text-gray-500 mb-3">
                        <div className="flex items-center space-x-1">
                          <Building className="h-4 w-4" />
                          <span>{report.properties?.address}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Purchased {new Date(report.purchase_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-4 w-4" />
                          <span>${report.price}</span>
                        </div>
                        {daysUntilExpiry !== null && (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span className={daysUntilExpiry <= 7 ? 'text-red-600 font-medium' : ''}>
                              {daysUntilExpiry > 0 ? `${daysUntilExpiry} days left` : 'Expired'}
                            </span>
                          </div>
                        )}
                      </div>

                      {report.report_data && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          {report.report_data.sections?.slice(0, 4).map((section, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">{section.name}</span>
                                <span className={`w-2 h-2 rounded-full ${
                                  section.score >= 90 ? 'bg-green-500' :
                                  section.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}></span>
                              </div>
                              <div className="text-xs text-gray-500">{section.score}%</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <Download className="h-4 w-4" />
                      </button>
                      {canUpdate && (
                        <button
                          onClick={() => updateReport(report.id)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Update Report"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Purchase Report Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Purchase Compliance Report</h2>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Property</label>
                <select
                  value={selectedProperty?.id || ''}
                  onChange={(e) => {
                    const property = properties.find(p => p.id === e.target.value);
                    setSelectedProperty(property);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a property...</option>
                  {properties.map(property => (
                    <option key={property.id} value={property.id}>
                      {property.address} ({property.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                <select
                  value={selectedReportType}
                  onChange={(e) => setSelectedReportType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select report type...</option>
                  <option value="compliance_report">Full Compliance Report - $49.99</option>
                  <option value="fire_safety_report">Fire Safety Report - $29.99</option>
                  <option value="elevator_report">Elevator Safety Report - $39.99</option>
                  <option value="environmental_report">Environmental Report - $59.99</option>
                </select>
              </div>

              {selectedReportType && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-medium text-blue-900 mb-2">What's Included:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Comprehensive compliance assessment</li>
                    <li>• 30-day free updates</li>
                    <li>• Priority vendor recommendations</li>
                    <li>• Cost estimates and timelines</li>
                    <li>• PDF download and email delivery</li>
                  </ul>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button
                  onClick={() => {
                    if (selectedProperty && selectedReportType) {
                      purchaseReport(selectedProperty.id, selectedReportType);
                    }
                  }}
                  disabled={loading || !selectedProperty || !selectedReportType}
                  className="flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105 font-medium"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-5 w-5" />
                      <span>Purchase Report</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowPurchaseModal(false)}
                  className="px-8 py-4 bg-white/80 backdrop-blur-sm border border-white/30 text-gray-700 rounded-2xl hover:bg-white/90 transition-all duration-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportLibrary;

