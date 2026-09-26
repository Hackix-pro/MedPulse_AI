import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Filter, 
  ShieldCheck, 
  Clock, 
  Check 
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { Alert, Report } from '../../types';
import { DocumentViewerModal } from '../../components/reports/DocumentViewerModal';
import { useToast } from '../../components/common/Toast';

export const AlertsPage: React.FC = () => {
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
    storageService.updateAlertStatus(alertId, 'reviewed');
    showToast('Alert marked as reviewed.', 'success');
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
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Biomarker Health Alerts</h1>
            {activeCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-2xs font-bold">
                {activeCount} Active
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated alerts generated when lab values deviate from biologic reference intervals
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
            <option value="active">Active Alerts Only</option>
            <option value="reviewed">Reviewed Alerts</option>
          </select>

          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-teal-500"
          >
            <option value="ALL">All Severities</option>
            <option value="high">High Severity</option>
            <option value="medium">Medium Severity</option>
            <option value="info">Informational</option>
          </select>
        </div>
      </div>

      {/* Alerts Grid */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-900">No alerts found</h3>
          <p className="text-2xs text-slate-500 mt-1">
            All lab biomarker results are within normal limits or have been reviewed.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map(alert => {
            const isHigh = alert.severity === 'high';
            const isReviewed = alert.status === 'reviewed';

            return (
              <div
                key={alert.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isReviewed
                    ? 'bg-slate-50/70 border-slate-200 opacity-80'
                    : isHigh
                    ? 'bg-rose-50/30 border-rose-200 shadow-2xs'
                    : 'bg-amber-50/20 border-amber-200 shadow-2xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isReviewed
                        ? 'bg-slate-200 text-slate-600'
                        : isHigh
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {isReviewed ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900">
                          {alert.metric}
                        </h3>
                        <span className={`text-2xs font-semibold px-2 py-0.5 rounded uppercase ${
                          alert.severity === 'high' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {alert.severity} priority
                        </span>
                        <span className="text-2xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 capitalize">
                          {alert.type.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Measured vs Ref */}
                      <p className="text-xs text-slate-700 mt-1">
                        Measured value:{' '}
                        <strong className="font-mono text-slate-900">
                          {alert.value} {alert.unit}
                        </strong>{' '}
                        · Reference Target: <span className="font-mono text-slate-600">{alert.referenceRange}</span>
                      </p>

                      <p className="text-2xs text-slate-500 font-mono mt-0.5">
                        Source Report: {alert.sourceReportTitle} · Detected: {alert.date}
                      </p>

                      {/* Doctor annotation note if reviewed */}
                      {alert.doctorNote && (
                        <div className="mt-2.5 p-2 rounded-lg bg-teal-50 border border-teal-100 text-2xs text-teal-900">
                          <span className="font-semibold">Physician Clinical Comment:</span> {alert.doctorNote}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => {
                        const rep = reports.find(r => r.id === alert.reportId);
                        if (rep) setViewingReport(rep);
                      }}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      View Report
                    </button>

                    {!isReviewed ? (
                      <button
                        onClick={() => handleMarkReviewed(alert.id)}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                      >
                        Mark as Reviewed
                      </button>
                    ) : (
                      <span className="text-2xs text-slate-400 font-medium px-2 py-1">
                        Reviewed ({alert.reviewedAt || 'Done'})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Non-Diagnostic Disclaimer */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-2xs text-slate-500 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-700 block mb-0.5">Clinical Evaluation Note:</span>
          An abnormal laboratory reading does not constitute a definitive medical diagnosis. Values outside standardized reference cohorts should be correlated with clinical history, symptoms, and repeat evaluations by your attending physician.
        </div>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={!!viewingReport}
        report={viewingReport}
        onClose={() => setViewingReport(null)}
      />
    </div>
  );
};
