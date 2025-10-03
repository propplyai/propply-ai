import React, { useState, useEffect } from 'react';
import { 
  X, Building, MapPin, AlertTriangle, CheckCircle, Calendar, 
  FileText, Settings, RefreshCw, Eye, BarChart3, Users, 
  Shield, Wrench, Home, TrendingUp, Clock, Star
} from 'lucide-react';
import { generateSampleReport } from '../utils/generateSampleReport';

const PropertyActionsModal = ({ property, isOpen, onClose, onViewAnalysis, user }) => {
  const [loading, setLoading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  if (!isOpen) return null;

  const handleViewAnalysis = () => {
    onViewAnalysis(property);
    onClose();
  };

  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);
      console.log('📊 Generating compliance report for:', property.address);
      
      await generateSampleReport(property, user.id);
      console.log('✅ Compliance report generated successfully');
      
      // Show success message
      alert('Compliance report generated successfully! Check the Report Library to view it.');
      
    } catch (error) {
      console.error('❌ Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">Property Actions</h2>
              <div className="flex items-center space-x-2 text-blue-100">
                <MapPin className="h-4 w-4" />
                <span>{property?.address || 'Loading...'}</span>
              </div>
              <div className="flex items-center space-x-4 mt-2 text-sm text-blue-100">
                <span>City: {property?.city}</span>
                <span>•</span>
                <span>ID: {property?.id}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Compliance Analysis */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                 onClick={handleViewAnalysis}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Compliance Analysis</h3>
              <p className="text-sm text-gray-600 mb-4">View detailed compliance reports, violations, and inspection history</p>
              <div className="flex items-center text-sm text-green-600 font-medium">
                <Eye className="h-4 w-4 mr-2" />
                View Analysis
              </div>
            </div>

            {/* Property Details */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
                <Settings className="h-5 w-5 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Property Details</h3>
              <p className="text-sm text-gray-600 mb-4">Edit property information, contact details, and management settings</p>
              <div className="flex items-center text-sm text-blue-600 font-medium">
                <Settings className="h-4 w-4 mr-2" />
                Edit Details
              </div>
            </div>

            {/* Inspection Schedule */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-xl group-hover:bg-orange-200 transition-colors">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Inspection Schedule</h3>
              <p className="text-sm text-gray-600 mb-4">Manage upcoming inspections and schedule new ones</p>
              <div className="flex items-center text-sm text-orange-600 font-medium">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </div>
            </div>

            {/* Violations Management */}
            <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-100 rounded-xl group-hover:bg-red-200 transition-colors">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <Shield className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Violations</h3>
              <p className="text-sm text-gray-600 mb-4">View and manage active violations and compliance issues</p>
              <div className="flex items-center text-sm text-red-600 font-medium">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Manage
              </div>
            </div>

            {/* Reports & Documents */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                 onClick={handleGenerateReport}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <Star className="h-5 w-5 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Reports & Documents</h3>
              <p className="text-sm text-gray-600 mb-4">Generate compliance reports and manage property documents</p>
              <div className="flex items-center text-sm text-purple-600 font-medium">
                {generatingReport ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate
                  </>
                )}
              </div>
            </div>

            {/* Maintenance */}
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-teal-100 rounded-xl group-hover:bg-teal-200 transition-colors">
                  <Wrench className="h-6 w-6 text-teal-600" />
                </div>
                <Home className="h-5 w-5 text-teal-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Maintenance</h3>
              <p className="text-sm text-gray-600 mb-4">Track maintenance tasks and property improvements</p>
              <div className="flex items-center text-sm text-teal-600 font-medium">
                <Wrench className="h-4 w-4 mr-2" />
                Track
              </div>
            </div>

          </div>

          {/* Quick Stats */}
          <div className="mt-8 bg-gray-50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">85%</div>
                <div className="text-sm text-gray-600">Compliance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 mb-1">0</div>
                <div className="text-sm text-gray-600">Violations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">2</div>
                <div className="text-sm text-gray-600">Inspections</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">5</div>
                <div className="text-sm text-gray-600">Reports</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyActionsModal;
