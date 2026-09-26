import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  FileText, 
  AlertTriangle, 
  Stethoscope, 
  Share2, 
  CheckCircle2, 
  Filter,
  Calendar
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { TimelineEvent, TimelineEventType } from '../../types';

export const HealthTimeline: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');

  useEffect(() => {
    setEvents(storageService.getTimeline());
  }, []);

  const filteredEvents = useMemo(() => {
    if (filterType === 'ALL') return events;
    return events.filter(e => e.type === filterType);
  }, [events, filterType]);

  const getEventIcon = (type: TimelineEventType, severity?: string) => {
    if (type === 'abnormal_value') {
      return <AlertTriangle className="w-4 h-4 text-rose-600" />;
    }
    if (type === 'doctor_note') {
      return <Stethoscope className="w-4 h-4 text-teal-600" />;
    }
    if (type === 'doctor_connected') {
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    }
    if (type === 'doctor_shared' || type === 'report_shared') {
      return <Share2 className="w-4 h-4 text-blue-600" />;
    }
    return <FileText className="w-4 h-4 text-slate-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Health Timeline</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Chronological log of diagnostic uploads, abnormal biomarker flags, doctor consults, and shared records
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-teal-500"
          >
            <option value="ALL">All Event Types</option>
            <option value="report_uploaded">Reports Uploaded</option>
            <option value="abnormal_value">Abnormal Lab Findings</option>
            <option value="doctor_note">Doctor Notes & Reviews</option>
            <option value="report_shared">Shared Records</option>
            <option value="doctor_connected">Physician Connections</option>
          </select>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p>No timeline events found for this filter.</p>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 space-y-8">
            {filteredEvents.map(event => (
              <div key={event.id} className="relative group">
                {/* Node icon circle */}
                <div className={`absolute -left-[35px] sm:-left-[43px] top-1 w-8 h-8 rounded-full border-2 bg-white flex items-center justify-center shadow-xs ${
                  event.severity === 'alert'
                    ? 'border-rose-400 bg-rose-50'
                    : event.severity === 'warning'
                    ? 'border-amber-400 bg-amber-50'
                    : 'border-slate-300'
                }`}>
                  {getEventIcon(event.type, event.severity)}
                </div>

                {/* Event Card */}
                <div className="bg-slate-50 hover:bg-slate-100/70 p-4 rounded-xl border border-slate-200/80 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-2 text-2xs text-slate-500 font-mono">
                      <span>{event.date}</span>
                      <span>·</span>
                      <span>{event.time}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mt-1">
                    {event.description}
                  </p>

                  {/* Actions / Meta */}
                  <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-slate-200/60 text-2xs">
                    {event.reportId && (
                      <button
                        onClick={() => navigate(`/patient/reports/${event.reportId}`)}
                        className="text-teal-700 hover:text-teal-900 font-semibold inline-flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" /> View Associated Report →
                      </button>
                    )}

                    {event.doctorName && (
                      <span className="text-slate-500 font-medium">
                        Doctor: {event.doctorName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
