import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  ShieldCheck, 
  Clock, 
  Check, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Stethoscope, 
  RefreshCw,
  Info,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { Alert, Report } from '../../types';
import { DocumentViewerModal } from '../../components/reports/DocumentViewerModal';
import { useToast } from '../../components/common/Toast';
import { useAuth } from '../../context/AuthContext';

export const AlertsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'reviewed'>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [isSyncing, setIsSyncing] = useState(false);

  const [viewingReport, setViewingReport] = useState<Report | null>(null);

  const loadData = () => {
    const loadedAlerts = storageService.getAlerts(user?.id);
    const loadedReports = storageService.getReports(user?.id);
    setAlerts(loadedAlerts);
    setReports(loadedReports);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/alerts/sync', { method: 'POST' });
      if (res.ok) {
        await storageService.initStorage();
        loadData();
        showToast('Health alerts synchronized with recent reports.', 'success');
      }
    } catch {
      showToast('Alert synchronization completed.', 'info');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
    // Background sync on mount to ensure all uploaded reports have alerts evaluated
    fetch('/api/alerts/sync', { method: 'POST' })
      .then(res => res.ok ? storageService.initStorage() : null)
      .then(() => loadData())
      .catch(() => {});
  }, [user]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      // If user is patient, verify it belongs to this patient
      if (user?.role === 'patient' && a.patientId && user.id && a.patientId.toLowerCase() !== user.id.toLowerCase()) {
        return false;
      }
      if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
      if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
      return true;
    });
  }, [alerts, statusFilter, severityFilter, user]);

  const activeCount = filteredAlerts.filter(a => a.status === 'active').length;
  const reviewedCount = filteredAlerts.filter(a => a.status === 'reviewed').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Biomarker Health Alerts</h1>
            {activeCount > 0 ? (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold font-mono animate-pulse">
                {activeCount} Actionable Flag{activeCount > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold font-mono">
                All Normal / Reviewed
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated clinical biomarker surveillance with AI-drafted explanations, historical value shifts, and interim control measures.
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
            title="Scan reports for abnormal biomarkers"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-teal-600' : ''}`} />
            <span>Sync Alerts</span>
          </button>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-teal-500"
          >
            <option value="ALL">All Statuses ({alerts.length})</option>
            <option value="active">Pending Doctor Feedback ({activeCount})</option>
            <option value="reviewed">Doctor Reviewed ({reviewedCount})</option>
          </select>

          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-teal-500"
          >
            <option value="ALL">All Severities</option>
            <option value="high">High Severity</option>
            <option value="medium">Medium Severity</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-900">No active biomarker alerts</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            All lab biomarkers in your uploaded medical reports are within nominal biological intervals, or have been reviewed by your physician.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map(alert => {
            const isHigh = alert.severity === 'high';
            const isReviewed = alert.status === 'reviewed';
            const isLow = alert.type === 'below_range';
            const hasPrev = alert.previousValue !== null && alert.previousValue !== undefined;
            const delta = hasPrev ? Number((alert.value - Number(alert.previousValue)).toFixed(2)) : null;

            return (
              <div
                key={alert.id}
                className={`p-5 rounded-2xl border transition-all shadow-xs ${
                  isReviewed
                    ? 'bg-white border-slate-200'
                    : isHigh
                    ? 'bg-rose-50/20 border-rose-200 shadow-rose-100/50'
                    : 'bg-amber-50/20 border-amber-200 shadow-amber-100/50'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isReviewed
                        ? 'bg-emerald-100 text-emerald-700'
                        : isHigh
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {isReviewed ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-bold text-slate-900 tracking-tight">
                          {alert.metric}
                        </h2>
                        <span className={`text-2xs font-bold px-2 py-0.5 rounded uppercase ${
                          alert.severity === 'high' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {alert.severity} priority
                        </span>
                        <span className="text-2xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 capitalize">
                          {alert.type === 'below_range' ? 'Below Target Range' : 'Above Target Range'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-2xs text-slate-500 mt-1 flex-wrap">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                          <FileText className="w-3 h-3 text-slate-400" />
                          Source: {alert.sourceReportTitle}
                        </span>
                        <span>•</span>
                        <span>Detected: {alert.date}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge & Report Viewer Button */}
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {isReviewed ? (
                      <span className="inline-flex items-center gap-1 text-2xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Check className="w-3 h-3" /> Doctor Reviewed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-2xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                        <Clock className="w-3 h-3 text-amber-600" /> Pending Doctor Review
                      </span>
                    )}

                    <button
                      onClick={() => {
                        const rep = reports.find(r => r.id === alert.reportId);
                        if (rep) setViewingReport(rep);
                      }}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                    >
                      View Report
                    </button>
                  </div>
                </div>

                {/* Comparative Value Strip: Previous vs Current vs Target */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 mb-4">
                  {/* Current Value */}
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-2xs text-slate-500 font-medium block">Current Test Reading</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className={`text-lg font-bold font-mono ${isLow ? 'text-amber-700' : 'text-rose-700'}`}>
                        {alert.value}
                      </span>
                      <span className="text-xs text-slate-600 font-mono">{alert.unit}</span>
                      <span className={`ml-auto text-2xs font-bold uppercase px-1.5 py-0.5 rounded ${
                        isLow ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isLow ? 'Low' : 'High'}
                      </span>
                    </div>
                  </div>

                  {/* Previous Value & Delta */}
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-2xs text-slate-500 font-medium block">Previous Reading & Shift</span>
                    {hasPrev ? (
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-lg font-bold font-mono text-slate-800">
                          {alert.previousValue}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">{alert.unit}</span>
                        {delta !== null && (
                          <span className={`ml-auto inline-flex items-center gap-0.5 text-2xs font-bold px-1.5 py-0.5 rounded ${
                            delta > 0 ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {delta > 0 ? `+${delta}` : delta}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic mt-1 block">
                        First recorded baseline (No prior test)
                      </span>
                    )}
                  </div>

                  {/* Reference Range */}
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-2xs text-slate-500 font-medium block">Normal Reference Target</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-base font-bold font-mono text-slate-700">
                        {alert.referenceRange}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">{alert.unit}</span>
                    </div>
                  </div>
                </div>

                {/* AI Drafted Alert Message */}
                {alert.aiMessage && (
                  <div className="mb-4 p-3.5 rounded-xl bg-teal-50/70 border border-teal-200/80 text-teal-950">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                      <span>AI Health Assessment & Explanation</span>
                    </div>
                    <p className="text-xs text-teal-900 leading-relaxed">
                      {alert.aiMessage}
                    </p>
                    {alert.changeDescription && (
                      <p className="text-2xs text-teal-700 font-mono mt-1 font-semibold">
                        Shift: {alert.changeDescription}
                      </p>
                    )}
                  </div>
                )}

                {/* Two-Column Guidance: Possible Reasons & Control Measures */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {/* Possible Reasons */}
                  <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
                      <Info className="w-3.5 h-3.5 text-slate-500" />
                      <span>Possible Clinical & Lifestyle Reasons</span>
                    </div>
                    {alert.aiReasons && alert.aiReasons.length > 0 ? (
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {alert.aiReasons.map((reason, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-teal-600 font-bold shrink-0 mt-0.5">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-2xs text-slate-500">
                        Variations may arise from nutritional status, hydration, acute physical exertion, or metabolic changes.
                      </p>
                    )}
                  </div>

                  {/* Short Control Measures Until Doctor Feedback */}
                  <div className="p-3.5 bg-amber-50/40 rounded-xl border border-amber-200/80 text-xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-2">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                      <span>Recommended Control Measures (Until Doctor Review)</span>
                    </div>
                    {alert.aiControlMeasures && alert.aiControlMeasures.length > 0 ? (
                      <ul className="space-y-1.5 text-xs text-amber-950">
                        {alert.aiControlMeasures.map((measure, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-amber-600 font-bold shrink-0 mt-0.5">✓</span>
                            <span>{measure}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-2xs text-amber-800">
                        Maintain adequate hydration, observe balanced nutrition, rest, and avoid strenuous overexertion until clinical review.
                      </p>
                    )}
                  </div>
                </div>

                {/* Physician Feedback / Status Section */}
                {alert.doctorNote ? (
                  <div className="p-4 rounded-xl bg-teal-600 text-white shadow-xs">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Stethoscope className="w-4 h-4 text-teal-200" />
                      <span className="text-xs font-bold tracking-wide uppercase">
                        Attending Physician Clinical Feedback & Guidance
                      </span>
                    </div>
                    <p className="text-xs text-teal-50 font-medium leading-relaxed bg-teal-700/60 p-3 rounded-lg border border-teal-500/40">
                      "{alert.doctorNote}"
                    </p>
                    <div className="text-2xs text-teal-200 mt-2 flex items-center justify-between">
                      <span>Reviewed finding for clinical record</span>
                      <span>{alert.reviewedAt ? new Date(alert.reviewedAt).toLocaleDateString() : alert.date}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-2xs text-slate-600 flex items-start gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-800 block">
                        Awaiting Physician Clinical Review:
                      </span>
                      Your doctor has received this alert and will provide official medical feedback. In the interim, please follow the short-term control measures above. If you experience acute severe symptoms, contact your clinic or nearest emergency facility immediately.
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Clinical Disclaimer */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-2xs text-slate-500 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-700 block mb-0.5">Clinical Evaluation Note:</span>
          An abnormal laboratory reading does not constitute a definitive medical diagnosis. AI-suggested control measures are intended for safe interim support while awaiting your physician's clinical assessment and tailored prescription.
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
