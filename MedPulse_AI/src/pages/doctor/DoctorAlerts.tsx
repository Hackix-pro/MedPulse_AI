import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Eye, 
  Check, 
  Filter, 
  ShieldCheck, 
  FileText, 
  Stethoscope 
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { Alert, Report } from '../../types';
import { DocumentViewerModal } from '../../components/reports/DocumentViewerModal';
import { useToast } from '../../components/common/Toast';

export const DoctorAlerts: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'reviewed'>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  const [viewingReport, setViewingReport] = useState<Report | null>(null);

  const loadData = () => {
    setAlerts(storageService.getAlerts());
    setReports(storageService.getReports());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkReviewed = (alertId: string) => {
    storageService.updateAlertStatus(alertId, 'reviewed', 'Reviewed by Dr. Ananya Mehta');
    showToast('Alert marked as clinically reviewed.', 'success');
    loadData();
  };

  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
      if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
      return true;
    });
  }, [alerts, statusFilter, severityFilter]);

  const activeCount = alerts.filter(a => a.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Alerts & Review Center</h1>
            {activeCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-2xs font-bold font-mono">
                {activeCount} Actionable Flags
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-patient abnormal biomarker surveillance and clinical review queue
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-teal-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="active">Pending Review</option>
            <option value="reviewed">Reviewed Findings</option>
          </select>

          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-teal-500"
          >
            <option value="ALL">All Severities</option>
            <option value="high">High Severity</option>
            <option value="medium">Medium</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-800">No alerts matching filter</p>
            <p className="text-2xs text-slate-500 mt-0.5">All clinical lab biomarkers are reviewed or within nominal boundaries.</p>
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const isHigh = alert.severity === 'high';
            const isReviewed = alert.status === 'reviewed';

            return (
              <div
                key={alert.id}
                className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  isReviewed ? 'bg-slate-50/50 opacity-80' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isReviewed
                      ? 'bg-slate-100 text-slate-500'
                      : isHigh
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {isReviewed ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900">{alert.metric}</span>
                      <span className="text-2xs font-semibold px-2 py-0.5 rounded uppercase bg-rose-50 text-rose-700">
                        {alert.severity} priority
                      </span>
                      <span className="text-2xs text-slate-400 font-mono">PID-84920 (Aarav Sharma)</span>
                    </div>

                    <p className="text-xs text-slate-700 mt-1">
                      Reported Value:{' '}
                      <strong className="font-mono text-rose-600 font-bold">
                        {alert.value} {alert.unit}
                      </strong>{' '}
                      · Target Interval: <span className="font-mono text-slate-600">{alert.referenceRange}</span>
                    </p>

                    <p className="text-2xs text-slate-500 font-mono mt-0.5">
                      Document: {alert.sourceReportTitle} · Detected: {alert.date}
                    </p>

                    {alert.doctorNote && (
                      <div className="mt-2 p-2 rounded-lg bg-teal-50 border border-teal-100 text-2xs text-teal-900">
                        <span className="font-semibold">Review Annotation:</span> {alert.doctorNote}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => {
                      const rep = reports.find(r => r.id === alert.reportId);
                      if (rep) setViewingReport(rep);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Report
                  </button>

                  <button
                    onClick={() => navigate(`/doctor/patients/${alert.patientId}`)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Stethoscope className="w-3.5 h-3.5" /> Patient Chart
                  </button>

                  {!isReviewed && (
                    <button
                      onClick={() => handleMarkReviewed(alert.id)}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                    >
                      Acknowledge Review
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <DocumentViewerModal
        isOpen={!!viewingReport}
        report={viewingReport}
        onClose={() => setViewingReport(null)}
      />
    </div>
  );
};
