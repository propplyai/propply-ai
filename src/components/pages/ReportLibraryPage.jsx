import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import {
  FileText, Download, Eye, Share, Calendar, Building, Filter,
  Search, Plus, BarChart3, TrendingUp, AlertTriangle, CheckCircle,
  Clock, Archive, Star, Tag
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const ReportLibraryPage = ({ user, properties }) => {
  const { theme, isDark } = useTheme();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedProperty, setSelectedProperty] = useState(null);

  useEffect(() => {
    fetchReports();
  }, [user.id]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API calls
      const mockReports = [
        {
          id: 1,
          title: 'Monthly Compliance Report',
          type: 'compliance',
          status: 'completed',
          property_address: '140 W 28th St, New York, NY 10001',
          created_at: '2024-01-15',
          updated_at: '2024-01-20',
          file_size: '2.3 MB',
          format: 'PDF',
          description: 'Comprehensive monthly compliance report covering all property requirements',
          tags: ['compliance', 'monthly', 'inspection'],
          downloads: 15,
          shared: 3
        },
        {
          id: 2,
          title: 'Fire Safety Inspection Report',
          type: 'inspection',
          status: 'completed',
          property_address: '140 W 28th St, New York, NY 10001',
          created_at: '2024-01-10',
          updated_at: '2024-01-10',
          file_size: '1.8 MB',
          format: 'PDF',
          description: 'Annual fire safety inspection report from NYC Fire Department',
          tags: ['fire_safety', 'inspection', 'annual'],
          downloads: 8,
          shared: 1
        },
        {
          id: 3,
          title: 'Violation Analysis Report',
          type: 'analysis',
          status: 'in_progress',
          property_address: '140 W 28th St, New York, NY 10001',
          created_at: '2024-01-12',
          updated_at: '2024-01-18',
          file_size: '1.5 MB',
          format: 'Excel',
          description: 'Detailed analysis of property violations and resolution strategies',
          tags: ['violations', 'analysis', 'strategy'],
          downloads: 5,
          shared: 0
        },
        {
          id: 4,
          title: 'Boiler Inspection Certificate',
          type: 'certificate',
          status: 'completed',
          property_address: '140 W 28th St, New York, NY 10001',
          created_at: '2024-01-05',
          updated_at: '2024-01-05',
          file_size: '0.9 MB',
          format: 'PDF',
          description: 'Annual boiler inspection certificate and compliance documentation',
          tags: ['boiler', 'certificate', 'hvac'],
          downloads: 12,
          shared: 2
        }
      ];
      setReports(mockReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
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

  const stats = {
    total: reports.length,
    completed: reports.filter(r => r.status === 'completed').length,
    inProgress: reports.filter(r => r.status === 'in_progress').length,
    totalDownloads: reports.reduce((sum, r) => sum + r.downloads, 0),
    totalSize: reports.reduce((sum, r) => sum + parseFloat(r.file_size), 0).toFixed(1)
  };

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
            <button className="btn-primary">
              <Plus className="h-4 w-4" />
              <span>Generate Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: 'Total Reports', value: stats.total, icon: FileText, color: 'corporate' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'emerald' },
          { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'gold' },
          { label: 'Downloads', value: stats.totalDownloads, icon: Download, color: 'corporate' },
          { label: 'Total Size', value: `${stats.totalSize} MB`, icon: Archive, color: 'ruby' }
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
                      <button className="p-2 text-corporate-400 hover:bg-corporate-500/20 rounded-lg transition-all duration-300">
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
