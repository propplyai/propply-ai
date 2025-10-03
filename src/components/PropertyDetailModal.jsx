import React, { useState, useEffect, useCallback } from 'react';
import { APP_CONFIG, supabase } from '../config/supabase';
import {
  X, Building, MapPin, AlertTriangle, CheckCircle, ChevronDown, ChevronUp,
  Calendar, Flame, Wrench, Home, FileText, Shield, RefreshCw, TrendingUp
} from 'lucide-react';

/**
 * Property Detail Modal - NYC Compliance Analysis
 * Redesigned with improved dark theme and readability
 */
const PropertyDetailModal = ({ property, isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [data, setData] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    elevators: false,
    boilers: false,
    dobViolations: false,
    hpdViolations: false
  });

  const loadPropertyData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading property data from Supabase...');

      // Fetch NYC property record
      const { data: nycProperty, error: nycError } = await supabase
        .from('nyc_properties')
        .select('*')
        .eq('property_id', property.id)
        .single();

      if (nycError || !nycProperty) {
        console.log('No NYC property data found');
        setData(null);
        setLoading(false);
        return;
      }

      console.log('✅ NYC Property found:', nycProperty);

      // Get compliance summary
      const { data: complianceSummary } = await supabase
        .from('nyc_compliance_summary')
        .select('*')
        .eq('nyc_property_id', nycProperty.id)
        .single();

      // Get violations
      const { data: dobViolations } = await supabase
        .from('nyc_dob_violations')
        .select('*')
        .eq('nyc_property_id', nycProperty.id)
        .order('issue_date', { ascending: false });

      const { data: hpdViolations } = await supabase
        .from('nyc_hpd_violations')
        .select('*')
        .eq('nyc_property_id', nycProperty.id)
        .order('inspection_date', { ascending: false });

      // Get equipment data
      const { data: elevatorInspections } = await supabase
        .from('nyc_elevator_inspections')
        .select('*')
        .eq('nyc_property_id', nycProperty.id)
        .order('last_inspection_date', { ascending: false });

      const { data: boilerInspections } = await supabase
        .from('nyc_boiler_inspections')
        .select('*')
        .eq('nyc_property_id', nycProperty.id)
        .order('inspection_date', { ascending: false });

      console.log('📊 Data loaded:', {
        dob: dobViolations?.length || 0,
        hpd: hpdViolations?.length || 0,
        elevators: elevatorInspections?.length || 0,
        boilers: boilerInspections?.length || 0
      });

      setData({
        property: {
          id: property.id,
          address: property.address,
          bin: nycProperty.bin,
          bbl: nycProperty.bbl,
          borough: nycProperty.borough,
          last_synced_at: nycProperty.last_synced_at
        },
        compliance_summary: complianceSummary || {
          compliance_score: 0,
          risk_level: 'UNKNOWN',
          total_violations: (dobViolations?.length || 0) + (hpdViolations?.length || 0),
          open_violations: dobViolations?.length || 0,
          dob_violations: dobViolations?.length || 0,
          hpd_violations: hpdViolations?.length || 0
        },
        violations: {
          dob: dobViolations || [],
          hpd: hpdViolations || []
        },
        equipment: {
          elevators: elevatorInspections || [],
          boilers: boilerInspections || []
        }
      });

    } catch (error) {
      console.error('Error loading property data:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [property?.id, property?.address]);

  const syncPropertyData = useCallback(async () => {
    try {
      setSyncing(true);
      console.log('🔄 Syncing NYC data...');

      const response = await fetch(`${APP_CONFIG.API_URL}/api/properties/${property.id}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        console.log('✅ Sync completed, reloading data...');
        await loadPropertyData();
      }
    } catch (error) {
      console.error('Error syncing property:', error);
    } finally {
      setSyncing(false);
    }
  }, [property?.id, loadPropertyData]);

  useEffect(() => {
    if (isOpen && property) {
      loadPropertyData();
    }
  }, [isOpen, property, loadPropertyData]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getComplianceColor = (score) => {
    if (score >= 90) return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'EXCELLENT' };
    if (score >= 75) return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', label: 'GOOD' };
    if (score >= 60) return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', label: 'CAUTION' };
    return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', label: 'CRITICAL' };
  };

  const getRiskColor = (level) => {
    const colors = {
      'LOW': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
      'MEDIUM': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
      'HIGH': { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
      'CRITICAL': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' }
    };
    return colors[level] || colors['MEDIUM'];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">Property Compliance Report</h2>
              <div className="flex items-center space-x-2 text-blue-100">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{property?.address || 'Loading...'}</span>
              </div>
              {data?.property && (
                <div className="flex items-center space-x-4 mt-2 text-xs text-blue-200">
                  <span>BIN: {data.property.bin}</span>
                  <span>•</span>
                  <span>BBL: {data.property.bbl}</span>
                  {data.property.last_synced_at && (
                    <>
                      <span>•</span>
                      <span>Updated: {new Date(data.property.last_synced_at).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={syncPropertyData}
                disabled={loading || syncing}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                title="Sync NYC Data"
              >
                <RefreshCw className={`h-4 w-4 ${(loading || syncing) ? 'animate-spin' : ''}`} />
                <span className="text-sm">Sync Data</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-slate-300 text-lg">Loading property data...</p>
            </div>
          ) : !data ? (
            <div className="flex flex-col items-center justify-center py-16">
              <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
              <p className="text-slate-300 text-lg mb-4">No NYC data found for this property</p>
              <button
                onClick={syncPropertyData}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Sync NYC Data Now
              </button>
            </div>
          ) : (
            <div className="space-y-6">

              {/* Compliance Score Card */}
              <div className="bg-slate-800 border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-slate-100 mb-6">Compliance Overview</h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                  {/* Score */}
                  <div className={`${getComplianceColor(data.compliance_summary.compliance_score).bg} border ${getComplianceColor(data.compliance_summary.compliance_score).border} rounded-xl p-6 text-center`}>
                    <div className={`text-4xl font-bold ${getComplianceColor(data.compliance_summary.compliance_score).text} mb-2`}>
                      {data.compliance_summary.compliance_score || 0}
                    </div>
                    <div className="text-slate-400 text-sm mb-2">Compliance Score</div>
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getComplianceColor(data.compliance_summary.compliance_score).text}`}>
                      {getComplianceColor(data.compliance_summary.compliance_score).label}
                    </div>
                  </div>

                  {/* Total Violations */}
                  <div className="bg-slate-700/50 border border-slate-600/50 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                      <span className="text-slate-400 text-sm">Total Violations</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-100">
                      {data.compliance_summary.total_violations || 0}
                    </div>
                    <div className="text-sm text-red-400 mt-1">
                      {data.compliance_summary.open_violations || 0} open
                    </div>
                  </div>

                  {/* Risk Level */}
                  <div className={`${getRiskColor(data.compliance_summary.risk_level).bg} border ${getRiskColor(data.compliance_summary.risk_level).border} rounded-xl p-6`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className={`h-5 w-5 ${getRiskColor(data.compliance_summary.risk_level).text}`} />
                      <span className="text-slate-400 text-sm">Risk Level</span>
                    </div>
                    <div className={`text-2xl font-bold ${getRiskColor(data.compliance_summary.risk_level).text}`}>
                      {data.compliance_summary.risk_level || 'UNKNOWN'}
                    </div>
                  </div>

                  {/* Equipment Status */}
                  <div className="bg-slate-700/50 border border-slate-600/50 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Wrench className="h-5 w-5 text-blue-400" />
                      <span className="text-slate-400 text-sm">Equipment</span>
                    </div>
                    <div className="text-lg font-bold text-slate-100 mb-1">
                      {(data.equipment?.elevators?.length || 0) + (data.equipment?.boilers?.length || 0)} Total
                    </div>
                    <div className="text-xs text-slate-400">
                      {data.equipment?.elevators?.length || 0} elevators, {data.equipment?.boilers?.length || 0} boilers
                    </div>
                  </div>

                </div>
              </div>

              {/* DOB Violations */}
              <div className="bg-slate-800 border border-slate-700/50 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection('dobViolations')}
                  className="w-full flex items-center justify-between p-6 hover:bg-slate-750 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-red-400" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-slate-100">DOB Violations</h4>
                      <p className="text-sm text-slate-400">
                        {data.violations?.dob?.length || 0} Department of Buildings violations
                      </p>
                    </div>
                  </div>
                  {expandedSections.dobViolations ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                </button>

                {expandedSections.dobViolations && (
                  <div className="bg-slate-900 p-6 border-t border-slate-700/50">
                    {data.violations?.dob && data.violations.dob.length > 0 ? (
                      <div className="space-y-3">
                        {data.violations.dob.slice(0, 10).map((violation, idx) => (
                          <div key={idx} className="bg-slate-800 border border-slate-700/50 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h5 className="font-semibold text-slate-100 mb-1">{violation.violation_type || 'Building Violation'}</h5>
                                <p className="text-sm text-slate-400">{violation.description || 'No description available'}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                violation.status === 'ACTIVE' || violation.status === 'Open'
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}>
                                {violation.status || 'UNKNOWN'}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span>Issued: {violation.issue_date ? new Date(violation.issue_date).toLocaleDateString() : 'N/A'}</span>
                              {violation.disposition_date && (
                                <span>Resolved: {new Date(violation.disposition_date).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <CheckCircle className="h-12 w-12 mx-auto mb-2 text-emerald-400" />
                        <p>No DOB violations found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* HPD Violations */}
              <div className="bg-slate-800 border border-slate-700/50 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection('hpdViolations')}
                  className="w-full flex items-center justify-between p-6 hover:bg-slate-750 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                      <Home className="h-6 w-6 text-orange-400" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-slate-100">HPD Violations</h4>
                      <p className="text-sm text-slate-400">
                        {data.violations?.hpd?.length || 0} Housing Preservation violations
                      </p>
                    </div>
                  </div>
                  {expandedSections.hpdViolations ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                </button>

                {expandedSections.hpdViolations && (
                  <div className="bg-slate-900 p-6 border-t border-slate-700/50">
                    {data.violations?.hpd && data.violations.hpd.length > 0 ? (
                      <div className="space-y-3">
                        {data.violations.hpd.slice(0, 10).map((violation, idx) => (
                          <div key={idx} className="bg-slate-800 border border-slate-700/50 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h5 className="font-semibold text-slate-100">Class {violation.class || 'N/A'} Violation</h5>
                                  <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded">
                                    {violation.apartment || 'Building-wide'}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-400">{violation.order_number || violation.violation_id}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                violation.violation_status === 'Open'
                                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}>
                                {violation.violation_status || 'UNKNOWN'}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span>Inspection: {violation.inspection_date ? new Date(violation.inspection_date).toLocaleDateString() : 'N/A'}</span>
                              {violation.current_status_date && (
                                <span>Status: {new Date(violation.current_status_date).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <CheckCircle className="h-12 w-12 mx-auto mb-2 text-emerald-400" />
                        <p>No HPD violations found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Elevator Equipment */}
              <div className="bg-slate-800 border border-slate-700/50 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection('elevators')}
                  className="w-full flex items-center justify-between p-6 hover:bg-slate-750 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-slate-100">Elevator Inspections</h4>
                      <p className="text-sm text-slate-400">
                        {data.equipment?.elevators?.length || 0} inspection records
                      </p>
                    </div>
                  </div>
                  {expandedSections.elevators ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                </button>

                {expandedSections.elevators && (
                  <div className="bg-slate-900 p-6 border-t border-slate-700/50">
                    {data.equipment?.elevators && data.equipment.elevators.length > 0 ? (
                      <div className="space-y-3">
                        {data.equipment.elevators.slice(0, 10).map((elevator, idx) => (
                          <div key={idx} className="bg-slate-800 border border-slate-700/50 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h5 className="font-semibold text-slate-100 mb-1">Device #{elevator.device_number}</h5>
                                <p className="text-sm text-slate-400">{elevator.device_type || 'Elevator'}</p>
                                <div className="text-xs text-slate-500 mt-2">
                                  Last Inspection: {elevator.last_inspection_date ? new Date(elevator.last_inspection_date).toLocaleDateString() : 'N/A'}
                                </div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                elevator.device_status === 'ACTIVE'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-slate-600 text-slate-300'
                              }`}>
                                {elevator.device_status || 'UNKNOWN'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400">No elevator data available</div>
                    )}
                  </div>
                )}
              </div>

              {/* Boiler Equipment */}
              <div className="bg-slate-800 border border-slate-700/50 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection('boilers')}
                  className="w-full flex items-center justify-between p-6 hover:bg-slate-750 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                      <Flame className="h-6 w-6 text-orange-400" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-slate-100">Boiler Inspections</h4>
                      <p className="text-sm text-slate-400">
                        {data.equipment?.boilers?.length || 0} inspection records
                      </p>
                    </div>
                  </div>
                  {expandedSections.boilers ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                </button>

                {expandedSections.boilers && (
                  <div className="bg-slate-900 p-6 border-t border-slate-700/50">
                    {data.equipment?.boilers && data.equipment.boilers.length > 0 ? (
                      <div className="space-y-3">
                        {data.equipment.boilers.slice(0, 10).map((boiler, idx) => (
                          <div key={idx} className="bg-slate-800 border border-slate-700/50 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h5 className="font-semibold text-slate-100 mb-1">Device #{boiler.device_number}</h5>
                                <p className="text-sm text-slate-400">{boiler.device_type || 'Boiler'}</p>
                                <div className="text-xs text-slate-500 mt-2">
                                  Inspection: {boiler.inspection_date ? new Date(boiler.inspection_date).toLocaleDateString() : 'N/A'}
                                </div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                boiler.status === 'ACTIVE'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-slate-600 text-slate-300'
                              }`}>
                                {boiler.status || 'UNKNOWN'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400">No boiler data available</div>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailModal;
