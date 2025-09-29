import React, { useState, useEffect } from 'react';
import { 
  Calendar, ChevronLeft, ChevronRight, Clock, AlertTriangle, 
  CheckCircle, Filter, Download, Bell, Plus, Eye, MapPin
} from 'lucide-react';

const InspectionCalendar = ({ supabase, properties = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [inspections, setInspections] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // month, week, day
  const [filterProperty, setFilterProperty] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInspections();
  }, [currentDate, filterProperty, filterStatus]);

  const fetchInspections = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on view mode
      const startDate = getViewStartDate();
      const endDate = getViewEndDate();

      let query = supabase
        .from('inspections')
        .select(`
          *,
          properties (
            id,
            address,
            type
          )
        `)
        .gte('next_due_date', startDate.toISOString().split('T')[0])
        .lte('next_due_date', endDate.toISOString().split('T')[0]);

      if (filterProperty !== 'all') {
        query = query.eq('property_id', filterProperty);
      }

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query.order('next_due_date', { ascending: true });
      
      if (error) throw error;
      
      // Process inspections with urgency calculations
      const processedInspections = (data || []).map(inspection => {
        const nextDue = new Date(inspection.next_due_date);
        const today = new Date();
        const daysUntilDue = Math.ceil((nextDue - today) / (1000 * 60 * 60 * 24));
        
        let urgencyLevel = 'Normal';
        let calculatedStatus = inspection.status;
        
        if (daysUntilDue < 0) {
          urgencyLevel = 'Critical';
          calculatedStatus = 'Overdue';
        } else if (daysUntilDue <= 7) {
          urgencyLevel = 'High';
          calculatedStatus = 'Due Soon';
        } else if (daysUntilDue <= 30) {
          urgencyLevel = 'Medium';
        }

        return {
          ...inspection,
          days_until_due: daysUntilDue,
          urgency_level: urgencyLevel,
          calculated_status: calculatedStatus
        };
      });

      setInspections(processedInspections);
    } catch (error) {
      console.error('Error fetching inspections:', error);
      // Fallback to mock data for demo
      setInspections(generateMockInspections());
    } finally {
      setLoading(false);
    }
  };

  const generateMockInspections = () => {
    const mockData = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + (Math.random() * 90 - 30)); // Random date within 3 months
      
      const inspectionTypes = [
        'Fire Alarm System Inspection',
        'Elevator Safety Inspection',
        'Boiler Inspection',
        'Cooling Tower Inspection',
        'Backflow Prevention Testing'
      ];
      
      const statuses = ['Scheduled', 'Due Soon', 'Overdue', 'Completed'];
      const urgencyLevels = ['Low', 'Normal', 'High', 'Critical'];
      
      mockData.push({
        id: `mock-${i}`,
        inspection_type: inspectionTypes[Math.floor(Math.random() * inspectionTypes.length)],
        next_due_date: date.toISOString().split('T')[0],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        urgency_level: urgencyLevels[Math.floor(Math.random() * urgencyLevels.length)],
        properties: {
          id: `prop-${i}`,
          address: `${123 + i} Sample St, NYC`,
          type: 'Residential'
        },
        estimated_cost_min: 20000 + Math.random() * 30000,
        estimated_cost_max: 40000 + Math.random() * 40000
      });
    }
    
    return mockData;
  };

  const getViewStartDate = () => {
    const date = new Date(currentDate);
    switch (viewMode) {
      case 'week':
        date.setDate(date.getDate() - date.getDay());
        break;
      case 'month':
        date.setDate(1);
        break;
      case 'day':
        break;
    }
    return date;
  };

  const getViewEndDate = () => {
    const date = new Date(currentDate);
    switch (viewMode) {
      case 'week':
        date.setDate(date.getDate() - date.getDay() + 6);
        break;
      case 'month':
        date.setMonth(date.getMonth() + 1, 0);
        break;
      case 'day':
        break;
    }
    return date;
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + direction);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction * 7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + direction);
        break;
    }
    setCurrentDate(newDate);
  };

  const getInspectionsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return inspections.filter(inspection => inspection.next_due_date === dateStr);
  };

  const getUrgencyColor = (urgencyLevel, status) => {
    if (status === 'Completed') return 'bg-green-500';
    switch (urgencyLevel) {
      case 'Critical': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const renderMonthView = () => {
    const startDate = getViewStartDate();
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfWeek = startDate.getDay();
    
    const days = [];
    const today = new Date();
    
    // Previous month's trailing days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(startDate);
      date.setDate(date.getDate() - i - 1);
      days.push({ date, isCurrentMonth: false });
    }
    
    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Next month's leading days
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, day);
      days.push({ date, isCurrentMonth: false });
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 border-b">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {days.map((dayInfo, index) => {
          const dayInspections = getInspectionsForDate(dayInfo.date);
          const isToday = dayInfo.date.toDateString() === today.toDateString();
          const isSelected = selectedDate && dayInfo.date.toDateString() === selectedDate.toDateString();
          
          return (
            <div
              key={index}
              className={`min-h-[100px] p-2 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                !dayInfo.isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
              } ${isToday ? 'bg-blue-50 border-blue-300' : ''} ${
                isSelected ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedDate(dayInfo.date)}
            >
              <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                {dayInfo.date.getDate()}
              </div>
              
              <div className="space-y-1">
                {dayInspections.slice(0, 3).map((inspection, idx) => (
                  <div
                    key={idx}
                    className={`text-xs p-1 rounded text-white truncate ${getUrgencyColor(inspection.urgency_level, inspection.status)}`}
                    title={`${inspection.inspection_type} - ${inspection.properties?.address}`}
                  >
                    {inspection.inspection_type.split(' ')[0]}
                  </div>
                ))}
                {dayInspections.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayInspections.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSelectedDateDetails = () => {
    if (!selectedDate) return null;
    
    const dayInspections = getInspectionsForDate(selectedDate);
    
    return (
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">
          Inspections for {selectedDate.toLocaleDateString()}
        </h3>
        
        {dayInspections.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No inspections scheduled for this date</p>
        ) : (
          <div className="space-y-4">
            {dayInspections.map((inspection, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{inspection.inspection_type}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{inspection.properties?.address}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        inspection.calculated_status === 'Overdue' ? 'bg-red-100 text-red-800' :
                        inspection.calculated_status === 'Due Soon' ? 'bg-orange-100 text-orange-800' :
                        inspection.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {inspection.calculated_status || inspection.status}
                      </span>
                      <span className="text-gray-500">
                        ${(inspection.estimated_cost_min / 100).toLocaleString()} - ${(inspection.estimated_cost_max / 100).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                      Schedule
                    </button>
                    <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const exportCalendar = () => {
    // Generate ICS file for calendar export
    const icsContent = generateICSContent();
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'property-inspections.ics';
    link.click();
    URL.revokeObjectURL(url);
  };

  const generateICSContent = () => {
    const now = new Date();
    const icsEvents = inspections.map(inspection => {
      const startDate = new Date(inspection.next_due_date);
      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + 2); // 2-hour duration
      
      return `BEGIN:VEVENT
UID:${inspection.id}@propply.ai
DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${inspection.inspection_type}
DESCRIPTION:Property: ${inspection.properties?.address || 'Unknown'}\\nStatus: ${inspection.status}\\nEstimated Cost: $${(inspection.estimated_cost_min / 100).toLocaleString()} - $${(inspection.estimated_cost_max / 100).toLocaleString()}
LOCATION:${inspection.properties?.address || ''}
END:VEVENT`;
    }).join('\n');

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Propply AI//Property Inspections//EN
${icsEvents}
END:VCALENDAR`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inspection Calendar</h2>
          <p className="text-gray-600">Schedule and track property compliance inspections</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['month', 'week', 'day'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          
          {/* Filters */}
          <select
            value={filterProperty}
            onChange={(e) => setFilterProperty(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Properties</option>
            {properties.map(property => (
              <option key={property.id} value={property.id}>
                {property.address}
              </option>
            ))}
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Due Soon">Due Soon</option>
            <option value="Overdue">Overdue</option>
            <option value="Completed">Completed</option>
          </select>
          
          <button
            onClick={exportCalendar}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4">
        <button
          onClick={() => navigateDate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        <h3 className="text-lg font-semibold">
          {currentDate.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric',
            ...(viewMode === 'day' && { day: 'numeric' })
          })}
        </h3>
        
        <button
          onClick={() => navigateDate(1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          renderMonthView()
        )}
      </div>

      {/* Selected Date Details */}
      {renderSelectedDateDetails()}

      {/* Legend */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h4 className="font-medium text-gray-900 mb-3">Status Legend</h4>
        <div className="flex flex-wrap gap-4">
          {[
            { label: 'Overdue', color: 'bg-red-500' },
            { label: 'Due Soon', color: 'bg-orange-500' },
            { label: 'Scheduled', color: 'bg-blue-500' },
            { label: 'Completed', color: 'bg-green-500' }
          ].map((status) => (
            <div key={status.label} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
              <span className="text-sm text-gray-600">{status.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InspectionCalendar;
