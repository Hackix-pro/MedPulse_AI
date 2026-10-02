import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  FileText, 
  Clock, 
  TrendingUp, 
  GitCompare, 
  Sparkles, 
  AlertTriangle, 
  Stethoscope, 
  Share2, 
  Plus, 
  CheckCircle2, 
  Download, 
  Eye, 
  ShieldCheck, 
  Phone, 
  HeartPulse,
  Send,
  MessageSquare
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { aiService, ClinicalSummaryResult } from '../../services/aiService';
import { Report, Alert, TimelineEvent, DoctorNote, DoctorConnection, PatientUser, DirectMessage } from '../../types';
import { HealthChart } from '../../components/charts/HealthChart';
import { DocumentViewerModal } from '../../components/reports/DocumentViewerModal';
import { DoctorShareModal } from '../../components/modals/DoctorShareModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';

import { UploadModal } from '../../components/reports/UploadModal';

type DoctorTab = 'overview' | 'messages' | 'reports' | 'timeline' | 'trends' | 'compare' | 'alerts' | 'ai-summary' | 'notes';

export const DoctorPatientProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<DoctorTab>('overview');
  const [patientUser, setPatientUser] = useState<PatientUser | null>(null);
  const [connection, setConnection] = useState<DoctorConnection | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [notes, setNotes] = useState<DoctorNote[]>([]);

  // Direct Messages State
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Modals & view state
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // New Note Form
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<DoctorNote['category']>('lab_review');
  const [newNoteReportId, setNewNoteReportId] = useState('');
  const [shareWithPatient, setShareWithPatient] = useState(true);

  // Compare Tab State
  const [compareReportAId, setCompareReportAId] = useState('');
  const [compareReportBId, setCompareReportBId] = useState('');

  const fetchMessages = async () => {
    if (!id || !user?.id) return;
    try {
      const msgs = await storageService.getDirectMessages(id, user.id);
      setMessages(msgs);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [id, user?.id]);

  useEffect(() => {
    if (activeTab === 'messages' && id && user?.id) {
      storageService.markMessagesRead(id, user.id, user.id);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, messages.length]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || messageInput).trim();
    if (!text || !id || !user?.id) return;

    setIsSendingMessage(true);
    try {
      const newMsg = await storageService.sendDirectMessage({
        patientId: id,
        doctorId: user.id,
        senderId: user.id,
        senderName: user.name,
        senderRole: 'doctor',
        recipientId: id,
        recipientName: patientUser?.name || 'Patient',
        message: text
      });
      setMessages(prev => [...prev, newMsg]);
      setMessageInput('');
      showToast('Message sent to patient.', 'success');
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } catch (e) {
      console.error(e);
      showToast('Failed to send message.', 'error');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const loadData = () => {
    const patientId = id || '';
    const users = storageService.getUsers();
    const patient = users.find(u => u.id === patientId && u.role === 'patient') as PatientUser | undefined;
    setPatientUser(patient || null);

    const conns = storageService.getConnections();
    const conn = conns.find(c => c.patientId === patientId);
    setConnection(conn || null);

    const allReports = storageService.getReports(patientId);
    setReports(allReports);

    const allAlerts = storageService.getAlerts().filter(a => a.patientId === patientId);
    setAlerts(allAlerts);

    const allTimeline = storageService.getTimeline();
    setTimeline(allTimeline);

    const allNotes = storageService.getDoctorNotes(patientId);
    setNotes(allNotes);

    if (allReports.length >= 2) {
      setCompareReportAId(allReports[allReports.length - 1].id);
      setCompareReportBId(allReports[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Check consent authorization
  const isAuthorized = connection?.status === 'connected';

  // AI Clinical Summary Calculation
  const aiClinicalSummary: ClinicalSummaryResult | null = useMemo(() => {
    if (!isAuthorized || reports.length === 0) return null;
    return aiService.generateClinicalSummary(reports, patientUser?.name || 'Unknown Patient');
  }, [isAuthorized, reports, patientUser]);

  // Comparison Calculation
  const compareResult = useMemo(() => {
    const repA = reports.find(r => r.id === compareReportAId);
    const repB = reports.find(r => r.id === compareReportBId);
    if (!repA || !repB || repA.id === repB.id) return null;
    return aiService.compareReports(repA, repB);
  }, [reports, compareReportAId, compareReportBId]);

  const handleAddDoctorNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const rep = reports.find(r => r.id === newNoteReportId);

    storageService.addDoctorNote({
      patientId: id || '',
      doctorId: user?.id || '',
      doctorName: user?.name || '',
      reportId: rep?.id,
      reportTitle: rep?.title,
      text: newNoteText.trim(),
      category: newNoteCategory,
      sharedWithPatient: shareWithPatient
    });

    setNewNoteText('');
    showToast('Clinical note attached to patient chart.', 'success');
    loadData();
  };

  const handleMarkAlertReviewed = (alertId: string) => {
    storageService.updateAlertStatus(alertId, 'reviewed', 'Reviewed during clinical chart round.');
    showToast('Alert marked reviewed.', 'success');
    loadData();
  };

  if (!isAuthorized) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto space-y-4">
        <ShieldCheck className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">Restricted Medical Record</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          You do not have active consent authorization to inspect this patient's private health records. A consent connection must be accepted by the patient first.
        </p>
        <button
          onClick={() => navigate('/doctor/patients')}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
        >
          Return to Patient Directory
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Patient Lockup */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-start gap-3.5">
          <button
            onClick={() => navigate('/doctor/patients')}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors mt-0.5"
            title="Back to Directory"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-slate-900">
                {patientUser?.name || 'Unknown Patient'}
              </h1>
              <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 text-2xs font-mono font-bold border border-teal-200/60">
                {patientUser?.id || id}
              </span>
              <span className="text-2xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold uppercase">
                Authorized Consent
              </span>
            </div>
            <p className="text-2xs text-slate-500 mt-1">
              DOB: {patientUser?.dob || '1992-06-14'} (Age 34) · Gender: {patientUser?.gender || 'Male'} · Blood Group: <strong className="text-slate-800">{patientUser?.bloodGroup || 'B+'}</strong>
            </p>
          </div>
        </div>

        {/* Doctor Action: Share with Patient */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload Lab Report</span>
          </button>
          
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Report / Notes with Patient</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 text-xs font-semibold">
        {[
          { key: 'overview', label: 'Overview & History', icon: User },
          { key: 'messages', label: `Messages${messages.length > 0 ? ` (${messages.length})` : ''}`, icon: MessageSquare },
          { key: 'reports', label: `Lab Reports (${reports.length})`, icon: FileText },
          { key: 'ai-summary', label: 'AI Clinical Summary', icon: Sparkles },
          { key: 'trends', label: 'Biomarker Trends', icon: TrendingUp },
          { key: 'compare', label: 'Compare Reports', icon: GitCompare },
          { key: 'alerts', label: `Alerts (${alerts.filter(a => a.status === 'active').length})`, icon: AlertTriangle },
          { key: 'timeline', label: 'Timeline', icon: Clock },
          { key: 'notes', label: `Doctor Notes (${notes.length})`, icon: Stethoscope },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as DoctorTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}

      {/* 1. OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Demographics Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
              <span className="font-bold text-slate-900 block border-b border-slate-100 pb-2">
                Patient Demographics
              </span>
              <div className="space-y-1.5 text-2xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact:</span>
                  <span className="font-mono text-slate-800">{patientUser?.mobile}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-mono text-slate-800">{patientUser?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Language:</span>
                  <span className="capitalize text-slate-800">{patientUser?.preferredLanguage || 'English'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-2xs">
                <span className="text-slate-500 block">Emergency Contact:</span>
                <p className="font-medium text-slate-800 mt-0.5">
                  {patientUser?.emergencyContact?.name} ({patientUser?.emergencyContact?.relationship})
                </p>
                <p className="font-mono text-slate-500">{patientUser?.emergencyContact?.phone}</p>
              </div>
            </div>

            {/* Clinical Allergies & Prescriptions */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
              <span className="font-bold text-slate-900 block border-b border-slate-100 pb-2 flex items-center gap-1.5 text-rose-700">
                <HeartPulse className="w-4 h-4" /> Allergies & Protocols
              </span>

              <div>
                <span className="text-2xs font-semibold text-slate-600 block">Known Allergies:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(patientUser?.allergies || ['None']).map(a => (
                    <span key={a} className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 text-3xs font-semibold">
                      {a}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-2xs font-semibold text-slate-600 block">Active Medications:</span>
                <ul className="mt-1 space-y-1 text-2xs text-slate-700">
                  {(patientUser?.medications || ['None']).map(m => (
                    <li key={m}>• {m}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Medical History */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
              <span className="font-bold text-slate-900 block border-b border-slate-100 pb-2">
                Chronic Medical Diagnoses
              </span>
              <ul className="space-y-1.5 text-2xs text-slate-700">
                {(patientUser?.medicalHistory || ['No chronic diseases recorded']).map(h => (
                  <li key={h} className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Quick Biomarker Trajectory Preview */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              Patient Fasting Glycemic Trajectory (Fasting Glucose)
            </h3>
            <HealthChart reports={reports} initialMetric="glucose" />
          </div>
        </div>
      )}

      {/* MESSAGES */}
      {activeTab === 'messages' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[580px]">
          {/* Messages Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                {patientUser?.name.charAt(0) || 'P'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-900">
                    Consultation Messages · {patientUser?.name}
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-3xs font-semibold border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Direct Patient Thread
                  </span>
                </div>
                <p className="text-3xs text-slate-500 font-mono mt-0.5">
                  Patient ID: {id} · {messages.length} messages in database history
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="px-2 py-1 rounded bg-teal-50 text-teal-700 border border-teal-200/60 font-mono text-3xs font-semibold">
                Single Unified Chat
              </span>
            </div>
          </div>

          {/* Quick Doctor Presets / Recommendation Chips */}
          <div className="px-4 py-2 bg-slate-100/60 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-3xs">
            <span className="font-semibold text-slate-500 shrink-0">Quick recommendations:</span>
            {[
              "Please schedule a follow-up appointment next week.",
              "Your recent lab results look stable. Continue current medications.",
              "Please repeat your fasting blood sugar test.",
              "Stay well hydrated and monitor your resting blood pressure daily."
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(preset)}
                className="px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-teal-500 hover:text-teal-700 text-slate-700 whitespace-nowrap transition-colors font-medium shrink-0 shadow-2xs"
              >
                + {preset}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-slate-50/40">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mb-2">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">No Messages Yet</h4>
                <p className="text-2xs text-slate-500 max-w-sm mt-1">
                  Start the direct consultation thread with {patientUser?.name}. All messages and patient replies are saved to the database.
                </p>
              </div>
            ) : (
              messages.map(msg => {
                const isDoctor = msg.senderRole === 'doctor';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isDoctor ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-3xs font-mono text-slate-400">
                      <span className={`font-semibold ${isDoctor ? 'text-teal-700' : 'text-slate-700'}`}>
                        {isDoctor ? `${msg.senderName} (Doctor)` : `${msg.senderName} (Patient)`}
                      </span>
                      <span>·</span>
                      <span>{msg.timestamp || 'Just now'}</span>
                    </div>
                    <div
                      className={`max-w-md rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                        isDoctor
                          ? 'bg-slate-900 text-white rounded-br-xs shadow-xs'
                          : 'bg-white text-slate-900 border border-slate-200 rounded-bl-xs shadow-2xs'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.message}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3.5 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={messageInput}
              onChange={e => setMessageInput(e.target.value)}
              placeholder={`Write a consultation message or clinical guidance to ${patientUser?.name || 'patient'}...`}
              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-teal-500"
            />
            <button
              type="submit"
              disabled={!messageInput.trim() || isSendingMessage}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}

      {/* 2. REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900">
              Diagnostic Documents Authorized for Review ({reports.length})
            </h3>
            <span className="text-2xs text-slate-500 font-mono">
              Patient Verified OCR Extraction
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100">
            {reports.map(report => (
              <div
                key={report.id}
                onClick={() => setViewingReport(report)}
                className="p-4 sm:p-5 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 hover:text-teal-700">
                        {report.title}
                      </h4>
                      <span className="text-2xs font-mono text-slate-400">{report.id}</span>
                      <span className="text-2xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {report.category}
                      </span>
                    </div>
                    <p className="text-2xs text-slate-500 mt-1">
                      {report.hospitalOrLab} · Date: {report.date} · {report.extractedValues.length} biomarkers extracted
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewingReport(report);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. AI CLINICAL SUMMARY */}
      {activeTab === 'ai-summary' && aiClinicalSummary && (
        <div className="space-y-5">
          {/* Header Banner */}
          <div className="p-5 bg-teal-50/50 rounded-2xl border border-teal-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Patient AI Longitudinal Clinical Synthesis
                </h2>
              </div>
              <span className="text-2xs font-mono font-semibold bg-white border border-teal-200 text-teal-800 px-2.5 py-1 rounded-lg">
                {aiClinicalSummary.reportsAnalyzedCount} Verified Reports Synthesized ({aiClinicalSummary.dateRange})
              </span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              Automated synthesis across patient's longitudinal diagnostic archive. Cross-references progressive biomarker shifts, out-of-range deviations, and clinical correlations.
            </p>
          </div>

          {/* Key Biomarker Trajectory Shifts */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-500">
              Significant Biomarker Trajectory Shifts
            </h3>
            <div className="space-y-2">
              {aiClinicalSummary.keyBiomarkerShifts.map((shift, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-800 flex items-start gap-2.5">
                  <TrendingUp className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{shift}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Out of Range Summary with View Evidence Buttons */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-500">
              Out of Reference Range Findings & Grounded Evidence
            </h3>
            <div className="space-y-2">
              {aiClinicalSummary.evidenceList.map((ev, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-rose-50/30 border border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-semibold text-slate-900">{ev.finding}</p>
                    <p className="text-2xs text-slate-500 font-mono mt-0.5">
                      Source: {ev.title} ({ev.date})
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      const rep = storageService.getReportById(ev.reportId);
                      if (rep) setViewingReport(rep);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-lg text-2xs font-semibold shadow-2xs self-start sm:self-auto shrink-0 transition-colors"
                  >
                    <Eye className="w-3 h-3 text-teal-600" /> View Lab Evidence
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Recommendations for Physician Review */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-500">
              Suggested Clinical Correlation Points
            </h3>
            <ul className="space-y-2 text-xs text-slate-700">
              {aiClinicalSummary.recommendationsForDoctor.map((rec, i) => (
                <li key={i} className="p-2.5 rounded-lg bg-teal-50/30 border border-teal-100 flex items-start gap-2">
                  <span className="font-bold text-teal-700 font-mono text-2xs mt-0.5">{i + 1}.</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-3xs text-slate-400 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            AI-generated summary for clinical review · Does not replace clinical diagnosis or clinical judgment
          </div>
        </div>
      )}

      {/* 4. TRENDS */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <HealthChart reports={reports} initialMetric="glucose" />
          <HealthChart reports={reports} initialMetric="hemoglobin" />
        </div>
      )}

      {/* 5. COMPARE */}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Baseline Report (A)
              </label>
              <select
                value={compareReportAId}
                onChange={e => setCompareReportAId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-teal-500"
              >
                {reports.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({r.date})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Follow-up Report (B)
              </label>
              <select
                value={compareReportBId}
                onChange={e => setCompareReportBId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-teal-500"
              >
                {reports.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({r.date})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {compareResult && (
            <div className="space-y-4">
              <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-100 text-xs text-slate-700">
                <span className="font-bold text-teal-900 block mb-1">Comparison Overview:</span>
                {compareResult.overallSummary}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 text-2xs uppercase">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Test</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Previous</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Current</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Diff</th>
                      <th className="py-2.5 px-4 font-semibold">Trend</th>
                      <th className="py-2.5 px-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {compareResult.items.map(item => (
                      <tr key={item.testName}>
                        <td className="py-3 px-4 font-medium text-slate-900">{item.testName}</td>
                        <td className="py-3 px-4 text-right font-mono">{item.previousValue} {item.unit}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{item.currentValue} {item.unit}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-teal-700">{item.diff > 0 ? `+${item.diff}` : item.diff}</td>
                        <td className="py-3 px-4 capitalize font-semibold text-2xs">{item.trend}</td>
                        <td className="py-3 px-4">
                          <span className={`text-2xs font-semibold px-2 py-0.5 rounded ${
                            item.isAbnormal ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {item.statusChange}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. ALERTS */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900">
              Abnormal Biomarker Flags for {patientUser?.name} ({alerts.length})
            </h3>
          </div>

          <div className="space-y-3">
            {alerts.map(a => (
              <div key={a.id} className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{a.metric}</span>
                    <span className="text-2xs px-2 py-0.5 rounded bg-rose-50 text-rose-700 uppercase font-semibold">
                      {a.severity}
                    </span>
                    <span className="text-2xs text-slate-400 font-mono">{a.date}</span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1">
                    Recorded: <strong className="font-mono text-rose-600">{a.value} {a.unit}</strong> (Reference: {a.referenceRange})
                  </p>
                  <p className="text-2xs text-slate-500 font-mono mt-0.5">
                    Source: {a.sourceReportTitle}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {a.status === 'active' ? (
                    <button
                      onClick={() => handleMarkAlertReviewed(a.id)}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-2xs"
                    >
                      Mark Reviewed
                    </button>
                  ) : (
                    <span className="text-2xs text-emerald-700 font-semibold px-2 py-1 bg-emerald-50 rounded">
                      Reviewed on {a.reviewedAt || 'Done'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="relative pl-6 border-l-2 border-slate-200 space-y-6 text-xs">
            {timeline.map(ev => (
              <div key={ev.id} className="relative">
                <div className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center">
                  <Clock className="w-3 h-3 text-slate-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{ev.title}</span>
                    <span className="text-3xs text-slate-400 font-mono">{ev.date} · {ev.time}</span>
                  </div>
                  <p className="text-slate-600 mt-0.5">{ev.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. DOCTOR NOTES */}
      {activeTab === 'notes' && (
        <div className="space-y-6">
          {/* New Note Form */}
          <form onSubmit={handleAddDoctorNote} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-600" />
              Add Clinical Consultation Note
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-2xs font-semibold text-slate-600 mb-1">
                  Category
                </label>
                <select
                  value={newNoteCategory}
                  onChange={e => setNewNoteCategory(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500"
                >
                  <option value="lab_review">Lab Review & Interpretation</option>
                  <option value="prescription">Prescription / Supplement Protocol</option>
                  <option value="followup">Follow-up Recommendation</option>
                  <option value="general">General Clinical Note</option>
                </select>
              </div>

              <div>
                <label className="block text-2xs font-semibold text-slate-600 mb-1">
                  Associate with Specific Report (Optional)
                </label>
                <select
                  value={newNoteReportId}
                  onChange={e => setNewNoteReportId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500"
                >
                  <option value="">No specific document</option>
                  {reports.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.title} ({r.date})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-2xs font-semibold text-slate-600 mb-1">
                Clinical Note Content
              </label>
              <textarea
                rows={3}
                required
                value={newNoteText}
                onChange={e => setNewNoteText(e.target.value)}
                placeholder="Enter clinical assessment, guidance, medication changes, dietary restrictions..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shareWithPatient}
                  onChange={e => setShareWithPatient(e.target.checked)}
                  className="rounded text-teal-600"
                />
                <span className="text-2xs text-slate-700 font-medium">
                  Make visible in Patient's Shared Reports & Timeline
                </span>
              </label>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" /> Post Clinical Note
              </button>
            </div>
          </form>

          {/* Historical Notes */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900">Historical Clinical Notes ({notes.length})</h4>
            {notes.map(note => (
              <div key={note.id} className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{note.doctorName}</span>
                    <span className="text-2xs px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-semibold uppercase">
                      {note.category.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-2xs text-slate-400 font-mono">{note.date} · {note.time}</span>
                </div>

                <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {note.text}
                </p>

                {note.reportTitle && (
                  <p className="text-3xs text-slate-400 font-mono pt-1 border-t border-slate-100">
                    Associated Record: {note.reportTitle}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={!!viewingReport}
        report={viewingReport}
        onClose={() => setViewingReport(null)}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => loadData()}
        patientId={id}
      />

      {/* Doctor Share Modal */}
      <DoctorShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        patientId={id || ''}
        patientName={patientUser?.name || 'Unknown Patient'}
        reports={reports}
        onSuccess={() => loadData()}
      />
    </div>
  );
};
