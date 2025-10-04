import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import realTimeDataService from '../../services/RealTimeDataService';
import {
  FileText, Download, Eye, Share, Calendar, Building, Filter,
  Search, Plus, BarChart3, TrendingUp, AlertTriangle, CheckCircle,
  Clock, Archive, Star, Tag, MapPin, Shield, Flame, Wrench, Home,
  ChevronDown, ChevronUp, RefreshCw, MessageCircle, Bot, Send
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const ComplianceReportPage = ({ reportId, onClose }) => {
  const { theme, isDark } = useTheme();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    hpdViolations: false,
    dobViolations: false,
    elevatorEquipment: false,
    boilerEquipment: false,
    electricalPermits: false
  });
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [realTimeUpdates, setRealTimeUpdates] = useState(false);

  useEffect(() => {
    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  useEffect(() => {
    if (report && report.properties) {
      // Subscribe to real-time updates for this property
      const unsubscribe = realTimeDataService.subscribeToPropertyCompliance(
        report.properties.id,
        (update) => {
          console.log('📊 Real-time update received:', update);
          setRealTimeUpdates(true);
          
          // Handle different types of updates
          switch (update.type) {
            case 'compliance_update':
              // Update the report with new compliance data
              if (update.data && update.data.compliance_summary) {
                setReport(prevReport => ({
                  ...prevReport,
                  compliance_score: update.data.compliance_summary.compliance_score,
                  risk_level: update.data.compliance_summary.risk_level,
                  ai_analysis: {
                    ...prevReport.ai_analysis,
                    violations: update.data.violations,
                    equipment: update.data.equipment
                  }
                }));
              }
              break;
            case 'violations_update':
              // Update violations data
              setReport(prevReport => ({
                ...prevReport,
                ai_analysis: {
                  ...prevReport.ai_analysis,
                  violations: {
                    ...prevReport.ai_analysis?.violations,
                    [update.violationType]: update.payload.new || update.payload.old
                  }
                }
              }));
              break;
            case 'equipment_update':
              // Update equipment data
              setReport(prevReport => ({
                ...prevReport,
                ai_analysis: {
                  ...prevReport.ai_analysis,
                  equipment: {
                    ...prevReport.ai_analysis?.equipment,
                    [update.equipmentType]: update.payload.new || update.payload.old
                  }
                }
              }));
              break;
          }
        }
      );

      return () => {
        unsubscribe();
      };
    }
  }, [report]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      
      // Fetch report from backend API
      const apiUrl = process.env.REACT_APP_API_URL || '';
      const response = await fetch(`${apiUrl}/api/compliance-reports/${reportId}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch report');
      }
      
      setReport(result.report);
    } catch (error) {
      console.error('Error fetching report:', error);
      // Fallback to direct Supabase query if API fails
      try {
        const { data, error } = await supabase
          .from('compliance_reports')
          .select(`
            *,
            properties (
              id,
              address,
              city,
              state,
              zip_code,
              property_type,
              units,
              year_built,
              square_footage
            )
          `)
          .eq('id', reportId)
          .single();

        if (error) throw error;
        setReport(data);
      } catch (fallbackError) {
        console.error('Fallback fetch also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getComplianceColor = (score) => {
    if (score >= 90) return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', label: 'EXCELLENT' };
    if (score >= 75) return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', label: 'GOOD' };
    if (score >= 60) return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', label: 'CAUTION' };
    return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', label: 'CRITICAL' };
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

  const handleAiQuestion = async () => {
    if (!aiQuestion.trim()) return;
    
    try {
      setAiLoading(true);
      // TODO: Integrate with AI service
      const response = await fetch('/api/ai-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: aiQuestion,
          reportId: reportId,
          context: report?.ai_analysis
        })
      });
      
      const data = await response.json();
      setAiResponse(data.response);
    } catch (error) {
      console.error('Error asking AI question:', error);
      setAiResponse('Sorry, I encountered an error. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const downloadReport = async () => {
    try {
      const response = await fetch(`/api/reports/${reportId}/download`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-report-${report?.properties?.address?.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const syncPropertyData = async () => {
    try {
      if (!report?.properties?.id) return;
      
      setLoading(true);
      const result = await realTimeDataService.syncPropertyData(report.properties.id);
      
      if (result.success) {
        console.log('✅ Property data synced successfully');
        // Refresh the report data
        await fetchReport();
      } else {
        console.error('❌ Sync failed:', result.error);
      }
    } catch (error) {
      console.error('Error syncing property data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Report Not Found</h3>
          <p className="text-gray-600 mb-4">The requested compliance report could not be found.</p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Parse the detailed compliance data from the API response
  const complianceData = report.ai_analysis || {};
  const violations = complianceData.violations || {};
  const equipment = complianceData.equipment || {};
  
  // Parse detailed data from the API response if available
  const hpdViolationsData = report.hpd_violations_data ? JSON.parse(report.hpd_violations_data) : [];
  const dobViolationsData = report.dob_violations_data ? JSON.parse(report.dob_violations_data) : [];
  const elevatorData = report.elevator_data ? JSON.parse(report.elevator_data) : [];
  const boilerData = report.boiler_data ? JSON.parse(report.boiler_data) : [];
  const electricalData = report.electrical_data ? JSON.parse(report.electrical_data) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronDown className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Compliance Report</h1>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{report.properties?.address}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {realTimeUpdates && (
                <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Live Updates</span>
                </div>
              )}
              <button
                onClick={syncPropertyData}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Sync Data</span>
              </button>
              <button
                onClick={downloadReport}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Download PDF</span>
              </button>
              <button
                onClick={fetchReport}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overall Compliance Score */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Overall Compliance Score</h2>
                <div className="text-sm text-gray-500">
                  Generated: {new Date(report.generated_at).toLocaleDateString()}
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className={`relative w-48 h-48 rounded-full flex items-center justify-center ${getComplianceColor(report.compliance_score).bg} ${getComplianceColor(report.compliance_score).border} border-4`}>
                  <div className="text-center">
                    <div className={`text-6xl font-bold ${getComplianceColor(report.compliance_score).text}`}>
                      {report.compliance_score}
                    </div>
                    <div className="text-lg text-gray-600 font-medium">Score</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <div className={`inline-flex px-6 py-3 rounded-full ${getComplianceColor(report.compliance_score).bg} ${getComplianceColor(report.compliance_score).text} font-bold text-lg`}>
                  {getComplianceColor(report.compliance_score).label}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="text-sm text-gray-600">Total Violations</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {(report.hpd_violations_total || 0) + (report.dob_violations_total || 0)}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className={`h-5 w-5 ${getRiskColor(report.risk_level).text}`} />
                    <span className="text-sm text-gray-600">Risk Level</span>
                  </div>
                  <div className={`text-3xl font-bold ${getRiskColor(report.risk_level).text}`}>
                    {report.risk_level || 'MEDIUM'}
                  </div>
                </div>
              </div>

              {/* Detailed Compliance Scores */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <Home className="h-5 w-5 text-blue-600" />
                    <span className="text-sm text-gray-600">HPD Score</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {report.hpd_compliance_score || 0}%
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="text-sm text-gray-600">DOB Score</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {report.dob_compliance_score || 0}%
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <Building className="h-5 w-5 text-blue-600" />
                    <span className="text-sm text-gray-600">Elevator Score</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {report.elevator_compliance_score || 0}%
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <Wrench className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm text-gray-600">Electrical Score</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {report.electrical_compliance_score || 0}%
                  </div>
                </div>
              </div>
            </div>

            {/* Property Map */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Property Location</h3>
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Map integration coming soon</p>
                  <p className="text-sm text-gray-500">{report.properties?.address}</p>
                </div>
              </div>
            </div>

            {/* Ask Compliance Questions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Bot className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">Ask Compliance Questions</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    placeholder="Ask about violations, equipment, or compliance requirements..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && handleAiQuestion()}
                  />
                  <button
                    onClick={handleAiQuestion}
                    disabled={aiLoading || !aiQuestion.trim()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {aiLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {aiResponse && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Bot className="h-5 w-5 text-blue-600 mt-1" />
                      <div>
                        <p className="text-gray-800">{aiResponse}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Property Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-100">
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">Property Summary</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-gray-600">BIN</div>
                  <div className="font-bold">{report.bin || 'N/A'}</div>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-gray-600">BBL</div>
                  <div className="font-bold">{report.bbl || 'N/A'}</div>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-gray-600">Borough</div>
                  <div className="font-bold">{report.borough || 'N/A'}</div>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-gray-600">Zip Code</div>
                  <div className="font-bold">{report.zip_code || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Detailed Compliance Analysis */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border-2 border-green-100">
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-bold text-gray-900">Detailed Compliance Analysis</h3>
              </div>
              <p className="text-gray-600 text-sm">Click on any category to view detailed information</p>
            </div>

            {/* HPD Violations */}
            <div className="border-2 border-gray-200 rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleSection('hpdViolations')}
                className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Home className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-gray-900">HPD Violations</h4>
                    <p className="text-sm text-gray-600">
                      {report.hpd_violations_total || 0} total, {report.hpd_violations_active || 0} active
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500">Housing Preservation & Development violations</span>
                  {expandedSections.hpdViolations ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </button>

              {expandedSections.hpdViolations && (
                <div className="bg-gray-50 p-6 border-t-2 border-gray-200">
                  {hpdViolationsData && hpdViolationsData.length > 0 ? (
                    <div className="space-y-3">
                      {hpdViolationsData.slice(0, 10).map((violation, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-lg border border-purple-100">
                          <div className="flex items-start justify-between mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              violation.violation_class === 'A' ? 'bg-red-100 text-red-800' :
                              violation.violation_class === 'B' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              Class {violation.violation_class || 'N/A'}
                            </span>
                            <span className="text-xs text-gray-500">{violation.inspection_date || 'N/A'}</span>
                          </div>
                          <div className="text-sm text-gray-700">
                            Status: {violation.violation_status || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            ID: {violation.violation_id || 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      {report.hpd_violations_total === 0 ? 'No HPD violations found' : 'HPD violation details not available'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* DOB Violations */}
            <div className="border-2 border-gray-200 rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleSection('dobViolations')}
                className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-gray-900">DOB Violations</h4>
                    <p className="text-sm text-gray-600">
                      {report.dob_violations_total || 0} total, {report.dob_violations_active || 0} active
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500">Building code and construction violations</span>
                  {expandedSections.dobViolations ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </button>

              {expandedSections.dobViolations && (
                <div className="bg-gray-50 p-6 border-t-2 border-gray-200">
                  {dobViolationsData && dobViolationsData.length > 0 ? (
                    <div className="space-y-3">
                      {dobViolationsData.slice(0, 10).map((violation, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-lg border border-red-100">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                violation.violation_category === 'FIRE' ? 'bg-red-100 text-red-800' :
                                violation.violation_category === 'STRUCTURAL' ? 'bg-orange-100 text-orange-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {violation.violation_category || 'GENERAL'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">{violation.issue_date || 'N/A'}</span>
                          </div>
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {violation.violation_type || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-600">
                            ID: {violation.violation_number || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Status: {violation.status || 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      {report.dob_violations_total === 0 ? 'No DOB violations found' : 'DOB violation details not available'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Elevator Equipment */}
            <div className="border-2 border-gray-200 rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleSection('elevatorEquipment')}
                className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Building className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-gray-900">Elevator Equipment</h4>
                    <p className="text-sm text-gray-600">
                      {report.elevator_devices_total || 0} total, {report.elevator_devices_active || 0} active
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500">Elevator inspection records</span>
                  {expandedSections.elevatorEquipment ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </button>

              {expandedSections.elevatorEquipment && (
                <div className="bg-gray-50 p-6 border-t-2 border-gray-200">
                  {elevatorData && elevatorData.length > 0 ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-4 gap-4 px-4 py-2 bg-white rounded-lg font-semibold text-sm text-gray-700">
                        <div>Device ID</div>
                        <div>Latest Inspection</div>
                        <div>Status</div>
                        <div>Type</div>
                      </div>
                      {elevatorData.slice(0, 10).map((elevator, idx) => (
                        <div key={idx} className="grid grid-cols-4 gap-4 px-4 py-3 bg-white rounded-lg hover:bg-blue-50 transition-colors">
                          <div>
                            <div className="font-bold text-gray-900">{elevator.device_id}</div>
                            <div className="text-xs text-gray-500">{elevator.device_name}</div>
                          </div>
                          <div className="text-gray-700">{elevator.latest_inspection_date || 'N/A'}</div>
                          <div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              elevator.device_status === 'Active' ? 'bg-green-100 text-green-800' : 
                              elevator.device_status === 'Removed' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {elevator.device_status || 'UNKNOWN'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {elevator.device_type || 'Elevator'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      {report.elevator_devices_total === 0 ? 'No elevator data available' : 'Elevator details not available'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Boiler Equipment */}
            <div className="border-2 border-gray-200 rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleSection('boilerEquipment')}
                className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <Flame className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-gray-900">Boiler Equipment</h4>
                    <p className="text-sm text-gray-600">
                      {report.boiler_devices_total || 0} total, {report.boiler_devices_total || 0} active
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500">Boiler inspection records</span>
                  {expandedSections.boilerEquipment ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </button>

              {expandedSections.boilerEquipment && (
                <div className="bg-gray-50 p-6 border-t-2 border-gray-200">
                  {boilerData && boilerData.length > 0 ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-4 gap-4 px-4 py-2 bg-white rounded-lg font-semibold text-sm text-gray-700">
                        <div>Device ID</div>
                        <div>Latest Inspection</div>
                        <div>Status</div>
                        <div>Defects</div>
                      </div>
                      {boilerData.slice(0, 10).map((boiler, idx) => (
                        <div key={idx} className="grid grid-cols-4 gap-4 px-4 py-3 bg-white rounded-lg hover:bg-orange-50 transition-colors">
                          <div>
                            <div className="font-bold text-gray-900">{boiler.device_id}</div>
                            <div className="text-xs text-gray-500">{boiler.device_name}</div>
                          </div>
                          <div className="text-gray-700">{boiler.latest_inspection_date || 'N/A'}</div>
                          <div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              boiler.device_status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {boiler.device_status || 'UNKNOWN'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-600">
                              {boiler.defects_exist === 'No' ? 'No' : 'Yes'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      {report.boiler_devices_total === 0 ? 'No boiler data available' : 'Boiler details not available'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Electrical Permits */}
            <div className="border-2 border-gray-200 rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleSection('electricalPermits')}
                className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <Wrench className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-gray-900">Electrical Permits</h4>
                    <p className="text-sm text-gray-600">
                      {report.electrical_permits_total || 0} total, {report.electrical_permits_active || 0} active
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500">Electrical permit applications</span>
                  {expandedSections.electricalPermits ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </button>

              {expandedSections.electricalPermits && (
                <div className="bg-gray-50 p-6 border-t-2 border-gray-200">
                  {electricalData && electricalData.length > 0 ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-4 gap-4 px-4 py-2 bg-white rounded-lg font-semibold text-sm text-gray-700">
                        <div>Filing Number</div>
                        <div>Filing Date</div>
                        <div>Status</div>
                        <div>Job Description</div>
                      </div>
                      {electricalData.slice(0, 10).map((permit, idx) => (
                        <div key={idx} className="grid grid-cols-4 gap-4 px-4 py-3 bg-white rounded-lg hover:bg-yellow-50 transition-colors">
                          <div className="font-bold text-gray-900">{permit.filing_number || 'N/A'}</div>
                          <div className="text-gray-700">{permit.filing_date || 'N/A'}</div>
                          <div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              permit.filing_status === 'Complete' ? 'bg-green-100 text-green-800' : 
                              permit.filing_status === 'Permit Issued' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {permit.filing_status || 'UNKNOWN'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 truncate">
                            {permit.job_description || 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      {report.electrical_permits_total === 0 ? 'No electrical permit data available' : 'Electrical permit details not available'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Report Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Report Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Report ID</span>
                  <div className="font-mono text-sm text-gray-900">{report.id}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Generated</span>
                  <div className="text-sm text-gray-900">{new Date(report.generated_at).toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Status</span>
                  <div className="text-sm text-gray-900">{report.status}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Downloads</span>
                  <div className="text-sm text-gray-900">{report.download_count || 0}</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={downloadReport}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Download className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-900">Download PDF</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                  <Share className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-900">Share Report</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                  <Star className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-900">Add to Favorites</span>
                </button>
              </div>
            </div>

            {/* Recommendations */}
            {report.recommendations && report.recommendations.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Recommendations</h3>
                <div className="space-y-3">
                  {report.recommendations.slice(0, 5).map((rec, idx) => (
                    <div key={idx} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm text-gray-800">{rec}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceReportPage;
