import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Globe, 
  ShieldCheck, 
  Bell, 
  Database, 
  RotateCcw, 
  LogOut, 
  Lock, 
  Download,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LanguageCode } from '../../services/i18n';
import { storageService } from '../../services/storageService';
import { useToast } from '../../components/common/Toast';

export const PatientSettings: React.FC = () => {
  const { language, setLanguage, logout, t } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleExportData = () => {
    const backup = {
      reports: storageService.getReports(),
      alerts: storageService.getAlerts(),
      timeline: storageService.getTimeline(),
      connections: storageService.getConnections(),
      notes: storageService.getDoctorNotes(),
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MedPulse_Patient_Health_Vault_Export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported complete health data archive.', 'success');
  };

  const handleResetDemoData = () => {
    if (confirm('Reset demo data back to initial state? This will restore the 6 original sample reports, alerts, and connections.')) {
      storageService.resetDemoData();
      showToast('Demo data restored to initial state.', 'info');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t.settings}</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Localization, consent governance, security preferences, and data vault management
        </p>
      </div>

      <div className="space-y-6 text-xs">
        {/* 1. Language & Localization */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Globe className="w-4 h-4 text-teal-600" />
            <h2 className="text-xs font-bold text-slate-900">Regional Language Selection</h2>
          </div>

          <p className="text-2xs text-slate-500">
            Select your preferred display language for UI labels, biometric navigation, and diagnostic summaries:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { code: 'en', label: 'English', desc: 'Standard Clinical Terminology' },
              { code: 'hi', label: 'हिन्दी (Hindi)', desc: 'हिंदी भाषा में स्वास्थ्य डेटा' },
              { code: 'mr', label: 'मराठी (Marathi)', desc: 'मराठी भाषेत वैद्यकीय माहिती' }
            ].map(lang => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code as LanguageCode);
                  showToast(`Language set to ${lang.label}.`, 'success');
                }}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  language === lang.code
                    ? 'border-teal-600 bg-teal-50/40 text-teal-950 ring-1 ring-teal-600'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{lang.label}</span>
                    {language === lang.code && <Check className="w-4 h-4 text-teal-600" />}
                  </div>
                  <p className="text-2xs text-slate-500 mt-1">{lang.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Privacy & Consent Governance */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <h2 className="text-xs font-bold text-slate-900">Privacy & Consent Governance</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <span className="font-semibold text-slate-900 block">Physician Consent Enforced</span>
                <span className="text-2xs text-slate-500">
                  Medical doctors can only inspect your reports when explicit permission is granted.
                </span>
              </div>
              <span className="text-2xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                Active & Enforced
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <span className="font-semibold text-slate-900 block">AI Grounded Verification</span>
                <span className="text-2xs text-slate-500">
                  All clinical assistant summaries must cite verified test report IDs and exact lab values.
                </span>
              </div>
              <span className="text-2xs font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded">
                Enabled
              </span>
            </div>
          </div>
        </div>

        {/* 3. Data Vault Management */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Database className="w-4 h-4 text-teal-600" />
            <h2 className="text-xs font-bold text-slate-900">Data Management & Prototype Controls</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-900">Export Complete Health Vault</h4>
                <p className="text-2xs text-slate-500 mt-1">
                  Download a complete JSON export of all your indexed reports, lab values, and clinical notes.
                </p>
              </div>
              <button
                onClick={handleExportData}
                className="mt-4 inline-flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Export Data (JSON)
              </button>
            </div>

            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/20 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-rose-900">Reset Initial Demo Data</h4>
                <p className="text-2xs text-slate-600 mt-1">
                  Re-seed all 6 clinical lab reports, alerts, timeline milestones, and Dr. Ananya Mehta connection.
                </p>
              </div>
              <button
                onClick={handleResetDemoData}
                className="mt-4 inline-flex items-center justify-center gap-2 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Re-seed Demo Data
              </button>
            </div>
          </div>
        </div>

        {/* 4. Session & Logout */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="font-bold text-slate-900 block">Session Management</span>
            <span className="text-2xs text-slate-500">Sign out of this browser device securely.</span>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold border border-rose-200 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Log Out
          </button>
        </div>
      </div>
    </div>
  );
};
