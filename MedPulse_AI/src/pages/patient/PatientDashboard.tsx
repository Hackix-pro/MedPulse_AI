import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  GitCompare, 
  Bot, 
  Share2, 
  FileText, 
  AlertTriangle, 
  Stethoscope, 
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { Report, Alert, DoctorConnection, DoctorNote } from '../../types';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { UploadModal } from '../../components/reports/UploadModal';
import { DocumentViewerModal } from '../../components/reports/DocumentViewerModal';
import { ShareModal } from '../../components/modals/ShareModal';
import { useToast } from '../../components/common/Toast';

export const PatientDashboard: React.FC = () => {
  const { user, t } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [reports, setReports] = useState<Report[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [connections, setConnections] = useState<DoctorConnection[]>([]);
  const [notes, setNotes] = useState<DoctorNote[]>([]);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [sharingReport, setSharingReport] = useState<Report | null>(null);

  const loadData = () => {
    setReports(storageService.getReports());
    setAlerts(storageService.getAlerts());
    setConnections(storageService.getConnections());
    setNotes(storageService.getDoctorNotes(user?.id));
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Derive latest biomarker readings
  const getLatestBiomarker = (nameSub: string, defaultUnit: string, defaultRange: string) => {
    const sorted = [...reports].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    for (const r of sorted) {
      for (const v of r.extractedValues) {
        if (v.testName.toLowerCase().includes(nameSub.toLowerCase())) {
          return {
            value: v.value,
            unit: v.unit || defaultUnit,
            referenceRange: v.referenceRange || defaultRange,
            status: v.status,
            date: r.date
          };
        }
      }
    }
    return null;
  };

  const hb = getLatestBiomarker('hemoglobin', 'g/dL', '13.0 - 17.0');
  const glucose = getLatestBiomarker('glucose', 'mg/dL', '70 - 99');
  const bp = getLatestBiomarker('systolic', 'mmHg', '90 - 120');
  const cholesterol = getLatestBiomarker('cholesterol', 'mg/dL', '< 200');

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const connectedDoctor = connections.find(c => c.status === 'connected');

  const handleMarkAlertReviewed = (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    storageService.updateAlertStatus(alertId, 'reviewed');
    showToast('Alert marked as reviewed.', 'success');
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Welcome, {user?.name}
            </h1>
            <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 text-2xs font-mono font-semibold border border-teal-200/60">
              {user?.id}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Personal Health Vault · {reports.length} verified diagnostic documents on file
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{t.uploadReport}</span>
          </button>

          <button
            onClick={() => navigate('/patient/compare')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium transition-colors"
          >
            <GitCompare className="w-3.5 h-3.5 text-slate-600" />
            <span>{t.compareReports}</span>
          </button>

          <button
            onClick={() => navigate('/patient/assistant')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium transition-colors"
          >
            <Bot className="w-3.5 h-3.5 text-teal-600" />
            <span>{t.askAI}</span>
          </button>
        </div>
      </div>

      {/* Core Health Biomarker Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={t.hemoglobin}
          value={hb ? hb.value : '12.1'}
          unit={hb ? hb.unit : 'g/dL'}
          referenceRange={hb ? hb.referenceRange : '13.0 - 17.0'}
          status={hb ? hb.status : 'low'}
          lastUpdated={hb ? hb.date : 'Recent'}
          trend="down"
          trendDelta="-1.7 g/dL"
          onClick={() => navigate('/patient/trends')}
        />

        <MetricCard
          title={t.glucose}
          value={glucose ? glucose.value : '134'}
          unit={glucose ? glucose.unit : 'mg/dL'}
          referenceRange={glucose ? glucose.referenceRange : '70 - 99'}
          status={glucose ? glucose.status : 'high'}
          lastUpdated={glucose ? glucose.date : 'Recent'}
          trend="up"
          trendDelta="+30 mg/dL"
          onClick={() => navigate('/patient/trends')}
        />

        <MetricCard
          title={t.bloodPressure}
          value={bp ? `${bp.value}/88` : '138/88'}
          unit="mmHg"
          referenceRange="90-120 / 60-80"
          status={bp ? bp.status : 'high'}
          lastUpdated={bp ? bp.date : 'Recent'}
          trend="up"
          trendDelta="Elevated"
          onClick={() => navigate('/patient/trends')}
        />

        <MetricCard
          title={t.cholesterol}
          value={cholesterol ? cholesterol.value : '208'}
          unit={cholesterol ? cholesterol.unit : 'mg/dL'}
          referenceRange={cholesterol ? cholesterol.referenceRange : '< 200'}
          status={cholesterol ? cholesterol.status : 'high'}
          lastUpdated={cholesterol ? cholesterol.date : 'Recent'}
          trend="up"
          trendDelta="Borderline"
          onClick={() => navigate('/patient/trends')}
        />
      </div>

      {/* Active Alerts Banner (if any) */}
      {activeAlerts.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-amber-900">
                Active Biomarker Alerts ({activeAlerts.length})
              </h2>
            </div>
            <button
              onClick={() => navigate('/patient/alerts')}
              className="text-2xs font-semibold text-amber-800 hover:text-amber-950 inline-flex items-center gap-1"
            >
              View All Alerts <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeAlerts.slice(0, 2).map(alert => (
              <div
                key={alert.id}
                onClick={() => {
                  const rep = reports.find(r => r.id === alert.reportId);
                  if (rep) setViewingReport(rep);
                }}
                className="bg-white p-3.5 rounded-xl border border-amber-200 hover:border-amber-300 cursor-pointer shadow-2xs flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <span className="text-xs font-semibold text-slate-900">{alert.metric}</span>
                    <p className="text-2xs text-slate-500 font-mono mt-0.5">
                      Measured: <span className="font-bold text-rose-600">{alert.value} {alert.unit}</span> (Ref: {alert.referenceRange})
                    </p>
                  </div>
                  <span className="text-2xs px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold uppercase">
                    {alert.type.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2 text-2xs">
                  <span className="text-slate-400 font-mono">{alert.date}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleMarkAlertReviewed(alert.id, e)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded transition-colors"
                    >
                      Mark Reviewed
                    </button>
                    <span className="text-teal-600 font-medium hover:underline">
                      View Report →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Recent Reports & Doctor Collaboration Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Lab Reports (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900">{t.recentReports}</h2>
            </div>
            <button
              onClick={() => navigate('/patient/reports')}
              className="text-2xs font-semibold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1"
            >
              See All ({reports.length}) <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {reports.slice(0, 4).map(report => {
              const abnormalCount = report.extractedValues.filter(v => v.status !== 'normal').length;
              return (
                <div
                  key={report.id}
                  onClick={() => setViewingReport(report)}
                  className="bg-white p-4 rounded-xl border border-slate-200 hover:border-teal-300 hover:shadow-xs cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-semibold text-slate-900 hover:text-teal-700">
                          {report.title}
                        </h4>
                        <span className="text-2xs font-mono text-slate-400">
                          {report.id}
                        </span>
                      </div>
                      <p className="text-2xs text-slate-500 mt-0.5">
                        {report.hospitalOrLab} · Date: {report.date} · {report.extractedValues.length} biomarkers
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {abnormalCount > 0 ? (
                      <span className="text-2xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-medium">
                        {abnormalCount} flagged
                      </span>
                    ) : (
                      <span className="text-2xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                        All normal
                      </span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSharingReport(report);
                      }}
                      className="p-1.5 text-slate-400 hover:text-teal-600 rounded hover:bg-slate-100"
                      title="Share with Doctor"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Connected Doctor & Recent Activity (1 col) */}
        <div className="space-y-6">
          {/* Connected Practitioner Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-teal-600" />
                {t.connectedDoctors}
              </span>
              <button
                onClick={() => navigate('/patient/doctors')}
                className="text-2xs text-teal-600 font-semibold hover:underline"
              >
                Manage
              </button>
            </div>

            {connectedDoctor ? (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {connectedDoctor.doctorName.charAt(4) || 'D'}
                  </div>
                  <div>
                    <h5 className="font-semibold text-slate-900 leading-tight">
                      {connectedDoctor.doctorName}
                    </h5>
                    <p className="text-2xs text-slate-500">{connectedDoctor.doctorSpecialty}</p>
                  </div>
                </div>
                <p className="text-2xs text-slate-600 border-t border-slate-200/60 pt-2 font-mono">
                  {connectedDoctor.doctorHospital}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (reports.length > 0) setSharingReport(reports[0]);
                    }}
                    className="flex-1 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-2xs font-semibold rounded-lg shadow-xs transition-colors"
                  >
                    Share New Report
                  </button>
                  <button
                    onClick={() => navigate('/patient/shared')}
                    className="py-1.5 px-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-2xs font-medium rounded-lg"
                  >
                    History
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-slate-400 text-xs">
                <p>No practitioner connected yet.</p>
                <button
                  onClick={() => navigate('/patient/doctors')}
                  className="mt-2 text-teal-600 text-2xs font-semibold hover:underline"
                >
                  Connect with a doctor →
                </button>
              </div>
            )}
          </div>

          {/* Recent Doctor Notes */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                Doctor's Clinical Notes
              </span>
              <button
                onClick={() => navigate('/patient/timeline')}
                className="text-2xs text-teal-600 font-semibold hover:underline"
              >
                Timeline
              </button>
            </div>

            <div className="space-y-2.5">
              {notes.length === 0 ? (
                <p className="text-xs text-slate-400">No clinical notes recorded yet.</p>
              ) : (
                notes.slice(0, 2).map(n => (
                  <div key={n.id} className="p-3 rounded-lg bg-teal-50/40 border border-teal-100 text-xs">
                    <div className="flex items-center justify-between text-2xs text-slate-500 mb-1">
                      <span className="font-semibold text-teal-900">{n.doctorName}</span>
                      <span className="font-mono">{n.date}</span>
                    </div>
                    <p className="text-2xs text-slate-700 leading-relaxed line-clamp-3">
                      {n.text}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => loadData()}
      />

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={!!viewingReport}
        report={viewingReport}
        onClose={() => setViewingReport(null)}
        onShare={(rep) => {
          setViewingReport(null);
          setSharingReport(rep);
        }}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={!!sharingReport}
        report={sharingReport}
        connections={connections}
        onClose={() => setSharingReport(null)}
        onSuccess={() => loadData()}
      />
    </div>
  );
};
