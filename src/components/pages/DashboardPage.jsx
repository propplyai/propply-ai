import React, { useState, useEffect } from 'react';
import realTimeDataService from '../../services/RealTimeDataService';
import {
  Building, FileText, TrendingUp, AlertTriangle, CheckCircle,
  Clock, RefreshCw, BarChart3, Shield, MapPin, Calendar,
  Download, Eye, Plus, Filter, Search
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const DashboardPage = ({ user }) => {
  const { theme, isDark } = useTheme();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [realTimeUpdates, setRealTimeUpdates] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      // Subscribe to real-time dashboard updates
      const unsubscribe = realTimeDataService.subscribeToDashboard(
        user.id,
        (update) => {
          console.log('📊 Dashboard update received:', update);
          setRealTimeUpdates(true);
          setLastUpdated(new Date());
          
          // Handle different types of updates
          if (update.type === 'dashboard_update') {
            // Refresh dashboard data
            fetchDashboardData();
          }
        }
      );

      return () => {
        unsubscribe();
      };
    }
  }, [user?.id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await realTimeDataService.getDashboardOverview(user.id);
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await fetchDashboardData();
    setLoading(false);
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const overview = dashboardData?.overview || {};
  const recentActivity = dashboardData?.recent_activity || [];
  const properties = dashboardData?.properties || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="enterprise-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-slate-100 mb-2">Dashboard</h1>
            <p className="text-slate-400 text-lg">Real-time compliance monitoring and property management</p>
            {lastUpdated && (
              <p className="text-slate-500 text-sm mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {realTimeUpdates && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Live Updates</span>
              </div>
            )}
            <button
              onClick={refreshData}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button className="btn-primary">
              <Plus className="h-4 w-4" />
              <span>Add Property</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: 'Total Properties',
            value: overview.total_properties || 0,
            icon: Building,
            color: 'corporate',
            change: '+2 this month'
          },
          {
            label: 'Compliance Reports',
            value: overview.total_reports || 0,
            icon: FileText,
            color: 'emerald',
            change: `${overview.completed_reports || 0} completed`
          },
          {
            label: 'Average Score',
            value: `${overview.average_compliance_score || 0}%`,
            icon: TrendingUp,
            color: 'gold',
            change: '+5% this month'
          },
          {
            label: 'Compliance Rate',
            value: `${overview.compliance_rate || 0}%`,
            icon: Shield,
            color: 'ruby',
            change: 'Above average'
          }
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
                <div className="text-right">
                  <div className="text-xs text-slate-400">{stat.change}</div>
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

      {/* Recent Activity */}
      <div className="enterprise-card">
        <div className="enterprise-card-header">
          <h2 className="text-xl font-bold text-slate-100">Recent Activity</h2>
        </div>
        <div className="p-6">
          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-400 text-lg">No recent activity</p>
              <p className="text-slate-500 text-sm mt-2">Generate your first report to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-750 transition-all duration-300">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-slate-100">
                        {activity.properties?.address || 'Unknown Property'}
                      </h3>
                      <span className="text-sm text-slate-500">
                        {new Date(activity.generated_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-slate-400">
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="h-4 w-4" />
                        <span>Score: {activity.compliance_score}%</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Risk: {activity.risk_level}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4" />
                        <span>Status: {activity.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all duration-300">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-all duration-300">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Properties Overview */}
      <div className="enterprise-card">
        <div className="enterprise-card-header">
          <h2 className="text-xl font-bold text-slate-100">Properties Overview</h2>
        </div>
        <div className="p-6">
          {properties.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-400 text-lg">No properties found</p>
              <p className="text-slate-500 text-sm mt-2">Add your first property to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <div key={property.id} className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:bg-slate-750 transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-corporate-100 rounded-lg">
                        <Building className="h-5 w-5 text-corporate-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-100">{property.address}</h3>
                        <p className="text-sm text-slate-400">{property.city}, {property.state}</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      {property.status}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Units</span>
                      <span className="text-slate-200">{property.units || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Year Built</span>
                      <span className="text-slate-200">{property.year_built || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-4">
                    <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                      View Details
                    </button>
                    <button className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors text-sm">
                      <RefreshCw className="h-4 w-4" />
                    </button>
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

export default DashboardPage;
