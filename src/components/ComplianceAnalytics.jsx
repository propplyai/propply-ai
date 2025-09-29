import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar, 
  AlertTriangle, CheckCircle, Clock, Building, Shield, 
  Download, Filter, Eye, ArrowUp, ArrowDown, Minus,
  Flame, Zap, Wrench, Home, Droplets, MapPin
} from 'lucide-react';

const ComplianceAnalytics = ({ supabase, properties = [] }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('12m'); // 3m, 6m, 12m, 24m
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, selectedProperty]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      const months = parseInt(timeRange.replace('m', ''));
      startDate.setMonth(startDate.getMonth() - months);

      // Fetch comprehensive analytics data
      const [
        inspectionsData,
        violationsData,
        costsData,
        complianceData
      ] = await Promise.all([
        fetchInspectionAnalytics(startDate, endDate),
        fetchViolationAnalytics(startDate, endDate),
        fetchCostAnalytics(startDate, endDate),
        fetchComplianceAnalytics(startDate, endDate)
      ]);

      const analyticsData = {
        overview: calculateOverviewMetrics(inspectionsData, violationsData, costsData),
        trends: calculateTrends(inspectionsData, violationsData, costsData),
        compliance: complianceData,
        costs: costsData,
        inspections: inspectionsData,
        violations: violationsData,
        riskAssessment: calculateRiskAssessment(inspectionsData, violationsData),
        recommendations: generateRecommendations(inspectionsData, violationsData, costsData)
      };

      setAnalytics(analyticsData);
      setChartData(prepareChartData(analyticsData));

    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Fallback to mock data
      setAnalytics(generateMockAnalytics());
      setChartData(generateMockChartData());
    } finally {
      setLoading(false);
    }
  };

  const fetchInspectionAnalytics = async (startDate, endDate) => {
    try {
      let query = supabase
        .from('inspections')
        .select(`
          *,
          properties (
            id,
            address,
            type,
            compliance_score
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (selectedProperty !== 'all') {
        query = query.eq('property_id', selectedProperty);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching inspection analytics:', error);
      return [];
    }
  };

  const fetchViolationAnalytics = async (startDate, endDate) => {
    try {
      // Fetch both regular violations and Philadelphia L&I violations
      const [violationsQuery, phillyViolationsQuery] = await Promise.all([
        supabase
          .from('violations')
          .select(`
            *,
            properties (
              id,
              address,
              type,
              compliance_score
            )
          `)
          .gte('issued_date', startDate.toISOString().split('T')[0])
          .lte('issued_date', endDate.toISOString().split('T')[0]),
        
        supabase
          .from('philly_li_violations')
          .select(`
            *,
            properties (
              id,
              address,
              type,
              compliance_score
            )
          `)
          .gte('violation_date', startDate.toISOString().split('T')[0])
          .lte('violation_date', endDate.toISOString().split('T')[0])
      ]);

      let allViolations = [];
      
      if (violationsQuery.data) {
        allViolations = allViolations.concat(violationsQuery.data);
      }
      
      if (phillyViolationsQuery.data) {
        // Transform Philadelphia violations to match standard format
        const phillyViolations = phillyViolationsQuery.data.map(v => ({
          ...v,
          severity: getRiskSeverity(v.risk_category),
          violation_type: v.violation_type || v.risk_category,
          description: v.violation_description,
          issued_date: v.violation_date,
          source: 'Philadelphia L&I',
          risk_category: v.risk_category,
          estimated_cost_min: v.estimated_cost_min,
          estimated_cost_max: v.estimated_cost_max
        }));
        allViolations = allViolations.concat(phillyViolations);
      }

      if (selectedProperty !== 'all') {
        allViolations = allViolations.filter(v => v.property_id === selectedProperty);
      }

      return allViolations;
    } catch (error) {
      console.error('Error fetching violation analytics:', error);
      return [];
    }
  };

  const getRiskSeverity = (riskCategory) => {
    const severityMap = {
      'FIRE': 'Critical',
      'STRUCTURAL': 'High',
      'ELECTRICAL': 'High', 
      'MECHANICAL': 'Medium',
      'PLUMBING': 'Medium',
      'HOUSING': 'Low',
      'ZONING': 'Low'
    };
    return severityMap[riskCategory] || 'Medium';
  };

  const fetchCostAnalytics = async (startDate, endDate) => {
    try {
      let query = supabase
        .from('inspections')
        .select('actual_cost, estimated_cost_min, estimated_cost_max, completed_date')
        .not('completed_date', 'is', null)
        .gte('completed_date', startDate.toISOString().split('T')[0])
        .lte('completed_date', endDate.toISOString().split('T')[0]);

      if (selectedProperty !== 'all') {
        query = query.eq('property_id', selectedProperty);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching cost analytics:', error);
      return [];
    }
  };

  const fetchComplianceAnalytics = async (startDate, endDate) => {
    try {
      let query = supabase
        .from('properties')
        .select('compliance_score, type, created_at');

      if (selectedProperty !== 'all') {
        query = query.eq('id', selectedProperty);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching compliance analytics:', error);
      return [];
    }
  };

  const calculateOverviewMetrics = (inspections, violations, costs) => {
    const totalInspections = inspections.length;
    const completedInspections = inspections.filter(i => i.status === 'Completed').length;
    const overdueInspections = inspections.filter(i => i.status === 'Overdue').length;
    const dueSoonInspections = inspections.filter(i => i.status === 'Due Soon').length;
    
    const totalViolations = violations.length;
    const openViolations = violations.filter(v => v.status === 'Open').length;
    const criticalViolations = violations.filter(v => v.severity === 'Critical').length;
    
    const totalCosts = costs.reduce((sum, cost) => sum + (cost.actual_cost || 0), 0);
    const avgCost = costs.length > 0 ? totalCosts / costs.length : 0;
    
    const complianceRate = totalInspections > 0 ? (completedInspections / totalInspections) * 100 : 0;

    return {
      totalInspections,
      completedInspections,
      overdueInspections,
      dueSoonInspections,
      totalViolations,
      openViolations,
      criticalViolations,
      totalCosts,
      avgCost,
      complianceRate
    };
  };

  const calculateTrends = (inspections, violations, costs) => {
    // Calculate month-over-month trends
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const lastMonthInspections = inspections.filter(i => 
      new Date(i.created_at) >= lastMonth && new Date(i.created_at) < thisMonth
    ).length;
    
    const thisMonthInspections = inspections.filter(i => 
      new Date(i.created_at) >= thisMonth
    ).length;

    const lastMonthViolations = violations.filter(v => 
      new Date(v.issued_date) >= lastMonth.toISOString().split('T')[0] && 
      new Date(v.issued_date) < thisMonth.toISOString().split('T')[0]
    ).length;
    
    const thisMonthViolations = violations.filter(v => 
      new Date(v.issued_date) >= thisMonth.toISOString().split('T')[0]
    ).length;

    const inspectionTrend = lastMonthInspections > 0 
      ? ((thisMonthInspections - lastMonthInspections) / lastMonthInspections) * 100 
      : 0;
    
    const violationTrend = lastMonthViolations > 0 
      ? ((thisMonthViolations - lastMonthViolations) / lastMonthViolations) * 100 
      : 0;

    return {
      inspectionTrend,
      violationTrend,
      complianceTrend: -violationTrend // Inverse of violation trend
    };
  };

  const calculateRiskAssessment = (inspections, violations) => {
    const overdueCount = inspections.filter(i => i.status === 'Overdue').length;
    const criticalViolations = violations.filter(v => v.severity === 'Critical' && v.status === 'Open').length;
    const dueSoonCount = inspections.filter(i => i.status === 'Due Soon').length;

    let riskLevel = 'Low';
    let riskScore = 0;

    // Calculate risk score
    riskScore += overdueCount * 25;
    riskScore += criticalViolations * 30;
    riskScore += dueSoonCount * 10;

    if (riskScore >= 80) riskLevel = 'Critical';
    else if (riskScore >= 50) riskLevel = 'High';
    else if (riskScore >= 25) riskLevel = 'Medium';

    return {
      riskLevel,
      riskScore: Math.min(100, riskScore),
      factors: {
        overdueInspections: overdueCount,
        criticalViolations,
        dueSoonInspections: dueSoonCount
      }
    };
  };

  const generateRecommendations = (inspections, violations, costs) => {
    const recommendations = [];

    const overdueInspections = inspections.filter(i => i.status === 'Overdue');
    if (overdueInspections.length > 0) {
      recommendations.push({
        type: 'urgent',
        title: 'Address Overdue Inspections',
        description: `${overdueInspections.length} inspections are overdue and require immediate attention.`,
        action: 'Schedule immediately',
        priority: 'High'
      });
    }

    const criticalViolations = violations.filter(v => v.severity === 'Critical' && v.status === 'Open');
    if (criticalViolations.length > 0) {
      recommendations.push({
        type: 'urgent',
        title: 'Resolve Critical Violations',
        description: `${criticalViolations.length} critical violations need immediate resolution.`,
        action: 'Contact vendors',
        priority: 'Critical'
      });
    }

    const dueSoonInspections = inspections.filter(i => i.status === 'Due Soon');
    if (dueSoonInspections.length > 0) {
      recommendations.push({
        type: 'planning',
        title: 'Schedule Upcoming Inspections',
        description: `${dueSoonInspections.length} inspections are due within the next 30 days.`,
        action: 'Plan ahead',
        priority: 'Medium'
      });
    }

    // Cost optimization recommendations
    const avgCost = costs.length > 0 ? costs.reduce((sum, c) => sum + (c.actual_cost || 0), 0) / costs.length : 0;
    const highCostInspections = costs.filter(c => (c.actual_cost || 0) > avgCost * 1.5);
    
    if (highCostInspections.length > 0) {
      recommendations.push({
        type: 'optimization',
        title: 'Review High-Cost Inspections',
        description: `${highCostInspections.length} inspections exceeded average costs by 50%+.`,
        action: 'Compare vendors',
        priority: 'Low'
      });
    }

    return recommendations;
  };

  const generateMockAnalytics = () => ({
    overview: {
      totalInspections: 45,
      completedInspections: 38,
      overdueInspections: 3,
      dueSoonInspections: 4,
      totalViolations: 12,
      openViolations: 5,
      criticalViolations: 2,
      totalCosts: 185000,
      avgCost: 4500,
      complianceRate: 84.4
    },
    trends: {
      inspectionTrend: 12.5,
      violationTrend: -8.3,
      complianceTrend: 8.3
    },
    riskAssessment: {
      riskLevel: 'Medium',
      riskScore: 45,
      factors: {
        overdueInspections: 3,
        criticalViolations: 2,
        dueSoonInspections: 4
      }
    },
    recommendations: [
      {
        type: 'urgent',
        title: 'Address Overdue Inspections',
        description: '3 inspections are overdue and require immediate attention.',
        action: 'Schedule immediately',
        priority: 'High'
      }
    ]
  });

  const generateMockChartData = () => ({
    complianceOverTime: [
      { month: 'Jan', score: 82 },
      { month: 'Feb', score: 85 },
      { month: 'Mar', score: 83 },
      { month: 'Apr', score: 87 },
      { month: 'May', score: 84 },
      { month: 'Jun', score: 88 }
    ],
    inspectionsByType: [
      { type: 'Fire Safety', count: 15, completed: 12 },
      { type: 'Elevator', count: 8, completed: 7 },
      { type: 'Boiler', count: 12, completed: 11 },
      { type: 'Water Systems', count: 10, completed: 8 }
    ],
    costTrends: [
      { month: 'Jan', actual: 28000, estimated: 32000 },
      { month: 'Feb', actual: 31000, estimated: 35000 },
      { month: 'Mar', actual: 27000, estimated: 30000 },
      { month: 'Apr', actual: 33000, estimated: 38000 },
      { month: 'May', actual: 29000, estimated: 32000 },
      { month: 'Jun', actual: 35000, estimated: 40000 }
    ]
  });

  const prepareChartData = (analyticsData) => {
    // In real implementation, this would process the actual data
    return generateMockChartData();
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <ArrowDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = (trend) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const exportReport = () => {
    // Generate comprehensive PDF report
    const reportData = {
      generatedAt: new Date().toISOString(),
      timeRange,
      selectedProperty,
      analytics,
      chartData
    };
    
    console.log('Exporting report:', reportData);
    // In real implementation, this would generate and download a PDF
    alert('Report export functionality would be implemented here');
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
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Compliance Analytics</h2>
          <p className="text-gray-600">Comprehensive insights into your property compliance performance</p>
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
          
          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: 'Compliance Rate',
            value: `${analytics.overview.complianceRate.toFixed(1)}%`,
            trend: analytics.trends.complianceTrend,
            icon: CheckCircle,
            color: 'green'
          },
          {
            label: 'Total Inspections',
            value: analytics.overview.totalInspections,
            trend: analytics.trends.inspectionTrend,
            icon: Calendar,
            color: 'blue'
          },
          {
            label: 'Open Violations',
            value: analytics.overview.openViolations,
            trend: analytics.trends.violationTrend,
            icon: AlertTriangle,
            color: 'red'
          },
          {
            label: 'Total Costs',
            value: `$${(analytics.overview.totalCosts / 100).toLocaleString()}`,
            trend: 0,
            icon: DollarSign,
            color: 'purple'
          }
        ].map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${metric.color}-100`}>
                  <Icon className={`h-6 w-6 text-${metric.color}-600`} />
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(metric.trend)}
                  <span className={`text-sm font-medium ${getTrendColor(metric.trend)}`}>
                    {Math.abs(metric.trend).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Risk Assessment */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                analytics.riskAssessment.riskLevel === 'Critical' ? 'bg-red-100 text-red-800' :
                analytics.riskAssessment.riskLevel === 'High' ? 'bg-orange-100 text-orange-800' :
                analytics.riskAssessment.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {analytics.riskAssessment.riskLevel} Risk
              </span>
              <span className="text-2xl font-bold text-gray-900">
                {analytics.riskAssessment.riskScore}/100
              </span>
            </div>
            <p className="text-gray-600">Overall compliance risk score</p>
          </div>
          
          <div className="text-right">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-red-600">{analytics.riskAssessment.factors.overdueInspections}</p>
                <p className="text-gray-500">Overdue</p>
              </div>
              <div>
                <p className="font-medium text-orange-600">{analytics.riskAssessment.factors.criticalViolations}</p>
                <p className="text-gray-500">Critical</p>
              </div>
              <div>
                <p className="font-medium text-yellow-600">{analytics.riskAssessment.factors.dueSoonInspections}</p>
                <p className="text-gray-500">Due Soon</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Risk Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              analytics.riskAssessment.riskLevel === 'Critical' ? 'bg-red-500' :
              analytics.riskAssessment.riskLevel === 'High' ? 'bg-orange-500' :
              analytics.riskAssessment.riskLevel === 'Medium' ? 'bg-yellow-500' :
              'bg-green-500'
            }`}
            style={{ width: `${analytics.riskAssessment.riskScore}%` }}
          ></div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
        <div className="space-y-4">
          {analytics.recommendations.map((rec, index) => (
            <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className={`p-2 rounded-lg ${
                rec.priority === 'Critical' ? 'bg-red-100' :
                rec.priority === 'High' ? 'bg-orange-100' :
                rec.priority === 'Medium' ? 'bg-yellow-100' :
                'bg-blue-100'
              }`}>
                {rec.type === 'urgent' ? (
                  <AlertTriangle className={`h-5 w-5 ${
                    rec.priority === 'Critical' ? 'text-red-600' :
                    rec.priority === 'High' ? 'text-orange-600' :
                    'text-yellow-600'
                  }`} />
                ) : (
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900">{rec.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    rec.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                    rec.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                    rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {rec.priority}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-2">{rec.description}</p>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  {rec.action} →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inspection Status Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inspections by Type</h3>
          <div className="space-y-3">
            {chartData.inspectionsByType.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{item.type}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(item.completed / item.count) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-16 text-right">
                    {item.completed}/{item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cost Trends */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Trends</h3>
          <div className="space-y-3">
            {chartData.costTrends.slice(-6).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{item.month}</span>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      ${(item.actual / 100).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      Est: ${(item.estimated / 100).toLocaleString()}
                    </div>
                  </div>
                  <div className={`w-2 h-8 rounded ${
                    item.actual <= item.estimated ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceAnalytics;
