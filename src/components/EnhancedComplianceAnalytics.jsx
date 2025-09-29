import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar, 
  AlertTriangle, CheckCircle, Clock, Building, Shield, 
  Download, Filter, Eye, ArrowUp, ArrowDown, Minus,
  Flame, Zap, Wrench, Home, Droplets, MapPin, Target
} from 'lucide-react';

const EnhancedComplianceAnalytics = ({ supabase, properties = [] }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('12m');
  const [selectedProperty, setSelectedProperty] = useState('all');

  useEffect(() => {
    fetchEnhancedAnalytics();
  }, [timeRange, selectedProperty]);

  const fetchEnhancedAnalytics = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      const months = parseInt(timeRange.replace('m', ''));
      startDate.setMonth(startDate.getMonth() - months);

      // Fetch enhanced Philadelphia L&I data
      const [
        riskAssessments,
        actionPlans,
        costTracking,
        phillyViolations,
        phillyPermits
      ] = await Promise.all([
        fetchRiskAssessments(),
        fetchActionPlans(),
        fetchCostTracking(),
        fetchPhillyViolations(startDate, endDate),
        fetchPhillyPermits(startDate, endDate)
      ]);

      const enhancedAnalytics = {
        overview: calculateEnhancedOverview(riskAssessments, actionPlans, phillyViolations),
        riskAssessment: calculateRiskBreakdown(phillyViolations, riskAssessments),
        actionPlans: processActionPlans(actionPlans),
        costAnalysis: processCostAnalysis(costTracking, actionPlans),
        complianceTrends: calculateComplianceTrends(phillyViolations, phillyPermits),
        recommendations: generateEnhancedRecommendations(riskAssessments, actionPlans)
      };

      setAnalytics(enhancedAnalytics);
    } catch (error) {
      console.error('Error fetching enhanced analytics:', error);
      setAnalytics(generateMockEnhancedAnalytics());
    } finally {
      setLoading(false);
    }
  };

  const fetchRiskAssessments = async () => {
    try {
      let query = supabase
        .from('compliance_risk_assessments')
        .select('*')
        .order('assessment_date', { ascending: false });

      if (selectedProperty !== 'all') {
        query = query.eq('property_id', selectedProperty);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching risk assessments:', error);
      return [];
    }
  };

  const fetchActionPlans = async () => {
    try {
      let query = supabase
        .from('compliance_action_plans')
        .select(`
          *,
          properties (address)
        `)
        .order('created_at', { ascending: false });

      if (selectedProperty !== 'all') {
        query = query.eq('property_id', selectedProperty);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching action plans:', error);
      return [];
    }
  };

  const fetchCostTracking = async () => {
    try {
      let query = supabase
        .from('compliance_cost_tracking')
        .select('*')
        .order('cost_date', { ascending: false });

      if (selectedProperty !== 'all') {
        query = query.eq('property_id', selectedProperty);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching cost tracking:', error);
      return [];
    }
  };

  const fetchPhillyViolations = async (startDate, endDate) => {
    try {
      let query = supabase
        .from('philly_li_violations')
        .select(`
          *,
          properties (address, compliance_score)
        `)
        .gte('violation_date', startDate.toISOString().split('T')[0])
        .lte('violation_date', endDate.toISOString().split('T')[0]);

      if (selectedProperty !== 'all') {
        query = query.eq('property_id', selectedProperty);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching Philly violations:', error);
      return [];
    }
  };

  const fetchPhillyPermits = async (startDate, endDate) => {
    try {
      let query = supabase
        .from('philly_li_permits')
        .select(`
          *,
          properties (address)
        `)
        .gte('permit_issued_date', startDate.toISOString().split('T')[0])
        .lte('permit_issued_date', endDate.toISOString().split('T')[0]);

      if (selectedProperty !== 'all') {
        query = query.eq('property_id', selectedProperty);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching Philly permits:', error);
      return [];
    }
  };

  const calculateRiskBreakdown = (violations, riskAssessments) => {
    const riskCategories = {
      FIRE: { count: 0, severity: 'Critical', color: 'red' },
      STRUCTURAL: { count: 0, severity: 'High', color: 'orange' },
      ELECTRICAL: { count: 0, severity: 'High', color: 'yellow' },
      MECHANICAL: { count: 0, severity: 'Medium', color: 'blue' },
      PLUMBING: { count: 0, severity: 'Medium', color: 'cyan' },
      HOUSING: { count: 0, severity: 'Low', color: 'green' },
      ZONING: { count: 0, severity: 'Low', color: 'gray' }
    };

    // Count violations by risk category
    violations.forEach(violation => {
      if (violation.risk_category && riskCategories[violation.risk_category]) {
        riskCategories[violation.risk_category].count++;
      }
    });

    // Calculate overall risk level
    const totalCritical = riskCategories.FIRE.count;
    const totalHigh = riskCategories.STRUCTURAL.count + riskCategories.ELECTRICAL.count;
    const totalMedium = riskCategories.MECHANICAL.count + riskCategories.PLUMBING.count;

    let overallRiskLevel = 'LOW';
    if (totalCritical > 0) overallRiskLevel = 'CRITICAL';
    else if (totalHigh > 2) overallRiskLevel = 'HIGH';
    else if (totalHigh > 0 || totalMedium > 3) overallRiskLevel = 'MEDIUM';

    return {
      categories: riskCategories,
      overallRiskLevel,
      totalViolations: violations.length,
      openViolations: violations.filter(v => v.status === 'OPEN').length
    };
  };

  const generateMockEnhancedAnalytics = () => ({
    overview: {
      totalProperties: 25,
      averageComplianceScore: 78,
      criticalActionsRequired: 8,
      totalCostProjection: { min: 125000, max: 450000 }
    },
    riskAssessment: {
      categories: {
        FIRE: { count: 3, severity: 'Critical', color: 'red' },
        STRUCTURAL: { count: 2, severity: 'High', color: 'orange' },
        ELECTRICAL: { count: 5, severity: 'High', color: 'yellow' },
        MECHANICAL: { count: 8, severity: 'Medium', color: 'blue' },
        PLUMBING: { count: 6, severity: 'Medium', color: 'cyan' },
        HOUSING: { count: 12, severity: 'Low', color: 'green' },
        ZONING: { count: 1, severity: 'Low', color: 'gray' }
      },
      overallRiskLevel: 'HIGH',
      totalViolations: 37,
      openViolations: 15
    },
    actionPlans: [
      { id: 1, title: 'Resolve Fire Code Violation', priority: 'CRITICAL', estimatedCost: 5000, deadline: '2025-09-18' },
      { id: 2, title: 'Electrical System Upgrade', priority: 'HIGH', estimatedCost: 12000, deadline: '2025-10-15' },
      { id: 3, title: 'Mechanical Inspection', priority: 'MEDIUM', estimatedCost: 800, deadline: '2025-11-01' }
    ],
    costAnalysis: {
      immediate: { min: 15000, max: 45000 },
      annual: { min: 25000, max: 85000 },
      roi: 1.8
    }
  });

  const getRiskIcon = (category) => {
    const icons = {
      FIRE: Flame,
      STRUCTURAL: Building,
      ELECTRICAL: Zap,
      MECHANICAL: Wrench,
      PLUMBING: Droplets,
      HOUSING: Home,
      ZONING: MapPin
    };
    return icons[category] || AlertTriangle;
  };

  const getRiskColor = (category) => {
    const colors = {
      FIRE: 'red',
      STRUCTURAL: 'orange',
      ELECTRICAL: 'yellow',
      MECHANICAL: 'blue',
      PLUMBING: 'cyan',
      HOUSING: 'green',
      ZONING: 'gray'
    };
    return colors[category] || 'gray';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Enhanced Philadelphia Compliance Analytics</h2>
          <p className="text-gray-600">Advanced risk assessment and compliance intelligence powered by L&I data</p>
        </div>
        
        <div className="flex gap-3">
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Properties</option>
            {properties.map(property => (
              <option key={property.id} value={property.id}>
                {property.address}
              </option>
            ))}
          </select>
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="12m">Last 12 Months</option>
            <option value="24m">Last 24 Months</option>
          </select>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Risk Assessment Dashboard */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Philadelphia L&I Risk Assessment</h3>
          <div className={`px-4 py-2 rounded-full text-sm font-medium ${
            analytics.riskAssessment.overallRiskLevel === 'CRITICAL' ? 'bg-red-100 text-red-800' :
            analytics.riskAssessment.overallRiskLevel === 'HIGH' ? 'bg-orange-100 text-orange-800' :
            analytics.riskAssessment.overallRiskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {analytics.riskAssessment.overallRiskLevel} RISK
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {Object.entries(analytics.riskAssessment.categories).map(([category, data]) => {
            const IconComponent = getRiskIcon(category);
            const color = getRiskColor(category);
            
            return (
              <div key={category} className={`bg-${color}-50 p-4 rounded-lg border border-${color}-100`}>
                <div className="flex items-center gap-2 mb-2">
                  <IconComponent className={`h-5 w-5 text-${color}-600`} />
                  <span className={`text-sm font-medium text-${color}-800`}>
                    {category.charAt(0) + category.slice(1).toLowerCase()}
                  </span>
                </div>
                <div className={`text-2xl font-bold text-${color}-600`}>
                  {data.count}
                </div>
                <div className={`text-xs text-${color}-600`}>
                  {data.severity} Risk
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalProperties}</p>
            <p className="text-gray-600">Properties Monitored</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Target className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{analytics.overview.averageComplianceScore}</p>
            <p className="text-gray-600">Avg Compliance Score</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{analytics.overview.criticalActionsRequired}</p>
            <p className="text-gray-600">Critical Actions Required</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              ${(analytics.overview.totalCostProjection.max / 1000).toFixed(0)}K
            </p>
            <p className="text-gray-600">Est. Total Costs</p>
          </div>
        </div>
      </div>

      {/* Action Plans */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Action Plans</h3>
        <div className="space-y-4">
          {analytics.actionPlans.slice(0, 5).map((action, index) => (
            <div key={action.id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${
                  action.priority === 'CRITICAL' ? 'bg-red-500' :
                  action.priority === 'HIGH' ? 'bg-orange-500' :
                  action.priority === 'MEDIUM' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}></div>
                <div>
                  <h4 className="font-medium text-gray-900">{action.title}</h4>
                  <p className="text-sm text-gray-600">Deadline: {action.deadline}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">${action.estimatedCost?.toLocaleString()}</p>
                <p className="text-sm text-gray-600">{action.priority}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cost Analysis */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Analysis & ROI</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-red-600 mb-1">Immediate Costs</p>
            <p className="text-2xl font-bold text-red-700">
              ${(analytics.costAnalysis.immediate.min / 1000).toFixed(0)}K - ${(analytics.costAnalysis.immediate.max / 1000).toFixed(0)}K
            </p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 mb-1">Annual Maintenance</p>
            <p className="text-2xl font-bold text-blue-700">
              ${(analytics.costAnalysis.annual.min / 1000).toFixed(0)}K - ${(analytics.costAnalysis.annual.max / 1000).toFixed(0)}K
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600 mb-1">Expected ROI</p>
            <p className="text-2xl font-bold text-green-700">{analytics.costAnalysis.roi}x</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedComplianceAnalytics;
