import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import realTimeDataService from '../../services/RealTimeDataService';
import {
  FileText, Download, Eye, Share, Calendar, Building, Filter,
  Search, Plus, BarChart3, TrendingUp, AlertTriangle, CheckCircle,
  Star, Tag
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import ComplianceReportPage from './ComplianceReportPage';

const ReportLibraryPage = ({ user, properties }) => {
  const { theme, isDark } = useTheme();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [realTimeUpdates, setRealTimeUpdates] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [user.id]);

  useEffect(() => {
    if (user?.id) {
      // Subscribe to real-time updates for user reports
      const unsubscribe = realTimeDataService.subscribeToUserReports(
        user.id,
        (update) => {
          console.log('📋 Reports update received:', update);
          setRealTimeUpdates(true);
          
          // Handle reports updates
          if (update.type === 'reports_update') {
            // Refresh reports list
            fetchReports();
          }
        }
      );

      return () => {
        unsubscribe();
      };
    }
  }, [user?.id]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // Fetch reports from backend API
      const response = await fetch(`/api/compliance-reports?user_id=${user.id}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch reports');
      }
      
      // Transform reports for display
      const transformedReports = (result.reports || []).map(report => ({
        id: report.id,
        title: `Compliance Report - ${report.properties?.address || 'Unknown Property'}`,
        type: 'compliance',
        status: report.status,
        property_address: report.properties?.address,
        property_id: report.property_id,
        compliance_score: report.compliance_score,
        risk_level: report.risk_level,
        violations_count: report.violations ? JSON.parse(report.violations).hpd?.length + JSON.parse(report.violations).dob?.length : 0,
        created_at: report.generated_at,
        updated_at: report.updated_at,
        file_size: '2.3 MB',
        format: 'PDF',
        description: `Comprehensive compliance analysis with ${report.compliance_score}% score`,
        tags: ['compliance', 'ai-generated', report.risk_level?.toLowerCase()],
        downloads: report.download_count || 0,
        shared: 0,
        ai_analysis: report.ai_analysis,
        recommendations: report.recommendations
      }));
      
      setReports(transformedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      // Fallback to direct Supabase query if API fails
      try {
        const { data: reports, error } = await supabase
          .from('compliance_reports')
          .select(`
            *,
            properties (
              id,
              address,
              city,
              state,
              zip_code,
              property_type
            )
          `)
          .eq('user_id', user.id)
          .order('generated_at', { ascending: false });

        if (error) throw error;
        
        // Transform reports for display
        const transformedReports = reports.map(report => ({
          id: report.id,
          title: `Compliance Report - ${report.properties?.address || 'Unknown Property'}`,
          type: 'compliance',
          status: report.status,
          property_address: report.properties?.address,
          property_id: report.property_id,
          compliance_score: report.compliance_score,
          risk_level: report.risk_level,
          violations_count: report.violations ? JSON.parse(report.violations).hpd?.length + JSON.parse(report.violations).dob?.length : 0,
          created_at: report.generated_at,
          updated_at: report.updated_at,
          file_size: '2.3 MB',
          format: 'PDF',
          description: `Comprehensive compliance analysis with ${report.compliance_score}% score`,
          tags: ['compliance', 'ai-generated', report.risk_level?.toLowerCase()],
          downloads: report.download_count || 0,
          shared: 0,
          ai_analysis: report.ai_analysis,
          recommendations: report.recommendations
        }));
        
        setReports(transformedReports);
      } catch (fallbackError) {
        console.error('Fallback fetch also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'compliance':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'inspection':
        return <Building className="h-5 w-5 text-corporate-500" />;
      case 'analysis':
        return <BarChart3 className="h-5 w-5 text-gold-500" />;
      case 'certificate':
        return <FileText className="h-5 w-5 text-purple-500" />;
      default:
        return <FileText className="h-5 w-5 text-slate-400" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'compliance':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'inspection':
        return 'bg-corporate-100 text-corporate-800 border-corporate-200';
      case 'analysis':
        return 'bg-gold-100 text-gold-800 border-gold-200';
      case 'certificate':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const viewReport = (report) => {
    setSelectedReport(report);
  };

  const closeReport = () => {
    setSelectedReport(null);
  };

  const getComplianceColor = (score) => {
    if (score >= 90) return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' };
    if (score >= 75) return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' };
    if (score >= 60) return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' };
    return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' };
  };

  const getRiskColor = (level) => {
    const colors = {
      'LOW': { bg: 'bg-green-100', text: 'text-green-700' },
      'MEDIUM': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      'HIGH': { bg: 'bg-orange-100', text: 'text-orange-700' },
      'CRITICAL': { bg: 'bg-red-100', text: 'text-red-700' }
    };
    return colors[level] || colors['MEDIUM'];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'in_progress':
        return 'bg-corporate-100 text-corporate-800 border-corporate-200';
      case 'pending':
        return 'bg-gold-100 text-gold-800 border-gold-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || report.type === filterType;
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });


  // If a report is selected, show the detailed report page
  if (selectedReport) {
    return (
      <ComplianceReportPage 
        reportId={selectedReport.id} 
        onClose={closeReport}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="enterprise-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-slate-100 mb-2">Report Library</h1>
            <p className="text-slate-400 text-lg">Access and manage all your property compliance reports and documents</p>
          </div>
          <div className="flex items-center space-x-3">
            {realTimeUpdates && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Live Updates</span>
              </div>
            )}
            <button className="btn-primary">
              <Plus className="h-4 w-4" />
              <span>Generate Report</span>
            </button>
          </div>
        </div>
      </div>


      {/* Filters */}
      <div className="enterprise-card p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-xl focus:ring-2 focus:ring-corporate-500 focus:border-corporate-500 transition-all duration-300 text-slate-200 placeholder-slate-400 hover:bg-slate-700"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl focus:ring-2 focus:ring-corporate-500 focus:border-corporate-500 transition-all duration-300 text-slate-200 hover:bg-slate-700"
          >
            <option value="all">All Types</option>
            <option value="compliance">Compliance</option>
            <option value="inspection">Inspection</option>
            <option value="analysis">Analysis</option>
            <option value="certificate">Certificate</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl focus:ring-2 focus:ring-corporate-500 focus:border-corporate-500 transition-all duration-300 text-slate-200 hover:bg-slate-700"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="enterprise-card overflow-hidden">
        <div className="enterprise-card-header">
          <h2 className="text-xl font-bold text-slate-100">Reports ({filteredReports.length})</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-corporate-500"></div>
              <span className="ml-3 text-slate-400">Loading reports...</span>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-400 text-lg">No reports found</p>
              <p className="text-slate-500 text-sm mt-2">Generate your first report to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <div key={report.id} className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:bg-slate-750 transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        {getTypeIcon(report.type)}
                        <h3 className="text-lg font-semibold text-slate-100">{report.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(report.type)}`}>
                          {report.type.toUpperCase()}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
                          {report.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-slate-400 mb-3">{report.description}</p>
                      <div className="flex items-center space-x-6 text-sm text-slate-500 mb-4">
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4" />
                          <span>{report.property_address}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>Created: {new Date(report.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span>{report.format} • {report.file_size}</span>
                        </div>
                      </div>
                      
                      {/* Compliance Score and Risk Level */}
                      {report.compliance_score !== undefined && (
                        <div className="flex items-center space-x-4 mb-4">
                          <div className={`px-3 py-2 rounded-lg border ${getComplianceColor(report.compliance_score).bg} ${getComplianceColor(report.compliance_score).text} ${getComplianceColor(report.compliance_score).border}`}>
                            <div className="flex items-center space-x-2">
                              <BarChart3 className="h-4 w-4" />
                              <span className="font-semibold">Score: {report.compliance_score}%</span>
                            </div>
                          </div>
                          {report.risk_level && (
                            <div className={`px-3 py-2 rounded-lg border ${getRiskColor(report.risk_level).bg} ${getRiskColor(report.risk_level).text}`}>
                              <div className="flex items-center space-x-2">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="font-semibold">Risk: {report.risk_level}</span>
                              </div>
                            </div>
                          )}
                          {report.violations_count > 0 && (
                            <div className="px-3 py-2 rounded-lg border bg-red-100 text-red-800 border-red-200">
                              <div className="flex items-center space-x-2">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="font-semibold">{report.violations_count} Violations</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <div className="flex items-center space-x-1">
                          <Download className="h-4 w-4" />
                          <span>{report.downloads} downloads</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Share className="h-4 w-4" />
                          <span>{report.shared} shared</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {report.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-slate-700 text-slate-300 rounded-full text-xs">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button 
                        onClick={() => viewReport(report)}
                        className="p-2 text-corporate-400 hover:bg-corporate-500/20 rounded-lg transition-all duration-300"
                        title="View Report"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-all duration-300">
                        <Download className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:bg-slate-700 rounded-lg transition-all duration-300">
                        <Share className="h-4 w-4" />
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

export default ReportLibraryPage;
