import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Eye, 
  Check, 
  FileText, 
  Stethoscope,
  RefreshCw,
  Search,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  User,
  X,
  Send,
  Sparkles
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { Alert, Report, User as UserType } from '../../types';
import { DocumentViewerModal } from '../../components/reports/DocumentViewerModal';
import { useToast } from '../../components/common/Toast';
import { useAuth } from '../../context/AuthContext';

export const DoctorAlerts: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'reviewed'>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [patientFilter, setPatientFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Document Viewer state
  const [viewingReport, setViewingReport] = useState<Report | null>(null);

  // Feedback Modal state
  const [feedbackAlert, setFeedbackAlert] = useState<Alert | null>(null);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const loadData = () => {
    setAlerts(storageService.getAlerts());
    setReports(storageService.getReports());
    setUsers(storageService.getUsers());
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/alerts/sync', { method: 'POST' });
      if (res.ok) {
        await storageService.initStorage();
        loadData();
        showToast('Clinical alerts synchronized with patient reports.', 'success');
      }
    } catch {
      showToast('Synchronization completed.', 'info');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
    // Background sync on mount
    fetch('/api/alerts/sync', { method: 'POST' })
      .then(res => res.ok ? storageService.initStorage() : null)
      .then(() => loadData())
      .catch(() => {});
  }, []);

  const openFeedbackModal = (alert: Alert) => {
    setFeedbackAlert(alert);
    setFeedbackNote(alert.doctorNote || '');
  };

  const handleSaveFeedback = async () => {
    if (!feedbackAlert) return;
    if (!feedbackNote.trim()) {
      showToast('Please enter your clinical feedback note for the patient.', 'error');
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      storageService.updateAlertStatus(feedbackAlert.id, 'reviewed', feedbackNote.trim());
      showToast(`Clinical feedback sent to patient for ${feedbackAlert.metric}.`, 'success');
      setFeedbackAlert(null);
      setFeedbackNote('');
      loadData();
    } catch {
      showToast('Failed to save feedback.', 'error');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const quickRecommendations = [
    'Prescribed iron supplementation (100mg daily) with Vitamin C. Repeat Complete Blood Count in 4 weeks.',
    'Strict low-glycemic dietary regimen recommended. Keep daily fasting sugar log; follow up in 2 weeks.',
    'Increase water hydration to 2.5-3L daily. Avoid OTC NSAID pain relievers. Recheck renal function in 3 weeks.',
    'Dietary lipid modifications advised (reduce saturated fats, increase fiber). Repeat lipid profile in 8 weeks.',
    'Mild finding within acceptable physiological variance. Continue routine lifestyle and annual observation.',
    'Schedule clinical consultation for comprehensive physical evaluation and repeat diagnostic panel.'
  ];

  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
      if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
      if (patientFilter !== 'ALL' && a.patientId !== patientFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesMetric = a.metric.toLowerCase().includes(q);
        const matchesReport = a.sourceReportTitle.toLowerCase().includes(q);
        const matchesPatient = (a.patientName || '').toLowerCase().includes(q) || a.patientId.toLowerCase().includes(q);
        if (!matchesMetric && !matchesReport && !matchesPatient) return false;
      }
      return true;
    });
  }, [alerts, statusFilter, severityFilter, patientFilter, searchQuery]);

  const activeCount = alerts.filter(a => a.status === 'active').length;
  const reviewedCount = alerts.filter(a => a.status === 'reviewed').length;

  // Unique patients in alerts
  const uniquePatients = useMemo(() => {
    const map = new Map<string, string>();
    alerts.forEach(a => {
      if (a.patientId) {
        map.set(a.patientId, a.patientName || `Patient ${a.patientId}`);
      }
    });
    return Array.from(map.entries());
  }, [alerts]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Alerts & Review Center</h1>
            {activeCount > 0 ? (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold font-mono">
                {activeCount} Pending Review
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold font-mono">
                All Cleared
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Surveillance queue of patient out-of-range biomarkers, comparative historical readings, and clinical feedback management.
          </p>
        </div>

        {/* Sync & Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
            title="Scan patient reports for abnormal biomarkers"
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
            <option value="active">Pending Review ({activeCount})</option>
            <option value="reviewed">Reviewed Findings ({reviewedCount})</option>
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

          {uniquePatients.length > 1 && (
            <select
              value={patientFilter}
              onChange={e => setPatientFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-teal-500"
            >
              <option value="ALL">All Patients ({uniquePatients.length})</option>
              {uniquePatients.map(([pid, name]) => (
                <option key={pid} value={pid}>{name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by biomarker name, report name, or patient..."
          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-teal-500 shadow-2xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
          >
            Clear
          </button>
        )}
      </div>

      {/* Alerts Table / Cards */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900">No alerts matching filter</h3>
            <p className="text-xs text-slate-500 mt-1">
              All clinical lab biomarkers are reviewed or within nominal boundaries.
            </p>
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const isHigh = alert.severity === 'high';
            const isReviewed = alert.status === 'reviewed';
            const isLow = alert.type === 'below_range';
            const hasPrev = alert.previousValue !== null && alert.previousValue !== undefined;
            const delta = hasPrev ? Number((alert.value - Number(alert.previousValue)).toFixed(2)) : null;

            // Resolve patient display name
            const patientName = alert.patientName || 
              users.find(u => u.id === alert.patientId)?.name || 
              `Patient ${alert.patientId}`;

            return (
              <div
                key={alert.id}
                className={`p-5 bg-white rounded-2xl border shadow-xs transition-colors ${
                  isReviewed ? 'border-slate-200 opacity-90' : isHigh ? 'border-rose-200 bg-rose-50/10' : 'border-amber-200 bg-amber-50/10'
                }`}
              >
                {/* Top Row: Biomarker, Priority, Patient, and Report Badge */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isReviewed
                        ? 'bg-emerald-100 text-emerald-700'
                        : isHigh
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {isReviewed ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-base text-slate-900">{alert.metric}</span>
                        <span className={`text-2xs font-bold px-2 py-0.5 rounded uppercase ${
                          isHigh ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {alert.severity} priority
                        </span>
                        <span className="text-2xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 capitalize">
                          {isLow ? 'Below Range' : 'Above Range'}
                        </span>
                      </div>

                      {/* Patient & Report Metadata */}
                      <div className="flex items-center gap-3 text-xs text-slate-600 mt-1 flex-wrap">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                          <User className="w-3.5 h-3.5 text-teal-600" />
                          {patientName} ({alert.patientId})
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          Source Report: <strong className="font-semibold text-slate-900">"{alert.sourceReportTitle}"</strong>
                        </span>
                        <span>•</span>
                        <span className="text-2xs text-slate-400 font-mono">Detected: {alert.date}</span>
                      </div>
                    </div>
                  </div>

                  {/* Top Right Review State */}
                  <div>
                    {isReviewed ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-2xs font-bold">
                        <Check className="w-3 h-3" /> Clinically Reviewed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-full text-2xs font-bold">
                        <AlertTriangle className="w-3 h-3 text-rose-600" /> Action Required
                      </span>
                    )}
                  </div>
                </div>

                {/* Values Comparison Strip: Out of Range Values & Differing Values */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50/90 rounded-xl border border-slate-200/80 mb-3 text-xs">
                  {/* Measured Value */}
                  <div>
                    <span className="text-2xs text-slate-500 font-medium block">Reported Value (Out of Range)</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <strong className={`text-base font-mono font-bold ${isLow ? 'text-amber-700' : 'text-rose-700'}`}>
                        {alert.value}
                      </strong>
                      <span className="text-xs text-slate-500 font-mono">{alert.unit}</span>
                      <span className={`ml-auto text-2xs font-bold uppercase px-1.5 py-0.5 rounded ${
                        isLow ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isLow ? 'Low' : 'High'}
                      </span>
                    </div>
                  </div>

                  {/* Previous Reading & Shift */}
                  <div>
                    <span className="text-2xs text-slate-500 font-medium block">Previous Measured Value</span>
                    {hasPrev ? (
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <strong className="text-base font-mono text-slate-800">
                          {alert.previousValue}
                        </strong>
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
                        No prior baseline on record
                      </span>
                    )}
                  </div>

                  {/* Reference Interval */}
                  <div>
                    <span className="text-2xs text-slate-500 font-medium block">Nominal Reference Interval</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <strong className="text-sm font-mono text-slate-700">
                        {alert.referenceRange}
                      </strong>
                      <span className="text-xs text-slate-500 font-mono">{alert.unit}</span>
                    </div>
                  </div>
                </div>

                {/* Normal Alert Message Drafted for Physician */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 text-xs text-slate-800 mb-3 leading-relaxed">
                  <div className="flex items-center gap-1.5 text-2xs font-bold uppercase text-slate-500 mb-1">
                    <Sparkles className="w-3 h-3 text-teal-600" />
                    <span>Clinical Surveillance Summary:</span>
                  </div>
                  <p>
                    {alert.aiDoctorSummary || `Out-of-range ${alert.metric} reading recorded at ${alert.value} ${alert.unit} (Reference Range: ${alert.referenceRange}). ${alert.changeDescription ? `Observed Shift: ${alert.changeDescription}.` : ''} Extracted from report "${alert.sourceReportTitle}".`}
                  </p>
                </div>

                {/* Doctor Feedback / Review Note if present */}
                {alert.doctorNote && (
                  <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-950 mb-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-teal-900">
                        <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
                        <span>Physician Clinical Feedback (Visible to Patient)</span>
                      </div>
                      <span className="text-2xs text-teal-700 font-mono">
                        {alert.reviewedAt ? new Date(alert.reviewedAt).toLocaleDateString() : alert.date}
                      </span>
                    </div>
                    <p className="text-xs text-teal-900 italic font-medium">
                      "{alert.doctorNote}"
                    </p>
                  </div>
                )}

                {/* Bottom Actions Row */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const rep = reports.find(r => r.id === alert.reportId);
                        if (rep) setViewingReport(rep);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" /> View Report
                    </button>

                    <button
                      onClick={() => navigate(`/doctor/patients/${alert.patientId}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Stethoscope className="w-3.5 h-3.5 text-teal-600" /> Patient Chart
                    </button>
                  </div>

                  <div>
                    <button
                      onClick={() => openFeedbackModal(alert)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-xs ${
                        isReviewed
                          ? 'bg-white border border-teal-300 text-teal-800 hover:bg-teal-50'
                          : 'bg-teal-600 hover:bg-teal-700 text-white'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{isReviewed ? 'Edit Clinical Feedback' : 'Provide Clinical Feedback'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={!!viewingReport}
        report={viewingReport}
        onClose={() => setViewingReport(null)}
      />

      {/* Physician Clinical Feedback Modal */}
      {feedbackAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Clinical Guidance & Feedback
                  </h3>
                  <p className="text-2xs text-slate-500">
                    Patient: {feedbackAlert.patientName || feedbackAlert.patientId} · {feedbackAlert.metric}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFeedbackAlert(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Finding Snapshot */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center justify-between text-2xs text-slate-500 mb-1">
                  <span>Source: "{feedbackAlert.sourceReportTitle}"</span>
                  <span>Target: {feedbackAlert.referenceRange} {feedbackAlert.unit}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">{feedbackAlert.metric}:</span>
                  <span className="font-mono font-bold text-rose-600">{feedbackAlert.value} {feedbackAlert.unit}</span>
                  {feedbackAlert.previousValue !== null && feedbackAlert.previousValue !== undefined && (
                    <span className="text-2xs text-slate-500">
                      (Previous: {feedbackAlert.previousValue} {feedbackAlert.unit})
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Template Recommendation Chips */}
              <div>
                <label className="block text-2xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Quick Clinical Guidance Templates
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {quickRecommendations.map((rec, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFeedbackNote(rec)}
                      className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-teal-50 hover:border-teal-200 border border-slate-200 text-2xs text-slate-700 transition-colors block"
                    >
                      {rec}
                    </button>
                  ))}
                </div>
              </div>

              {/* Doctor Guidance Input */}
              <div>
                <label className="block text-2xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Physician Feedback & Prescription Advice
                </label>
                <textarea
                  rows={4}
                  value={feedbackNote}
                  onChange={e => setFeedbackNote(e.target.value)}
                  placeholder="Enter medical evaluation, prescription instructions, diet advice, or follow-up schedule for the patient..."
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-teal-500 resize-none shadow-2xs leading-relaxed"
                />
                <p className="text-2xs text-slate-400 mt-1">
                  This advice will be prominently displayed in the patient's alert center and recorded in clinical audit history.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setFeedbackAlert(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveFeedback}
                disabled={isSubmittingFeedback || !feedbackNote.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmittingFeedback ? 'Sending...' : 'Send Feedback to Patient'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
