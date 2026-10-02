import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, ShieldCheck, Database, LogOut, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LanguageCode } from '../../services/i18n';
import { useToast } from '../../components/common/Toast';

export const DoctorSettings: React.FC = () => {
  const { language, setLanguage, logout, t } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Workstation Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Workstation language localization, clinical consent governance, and account session controls
        </p>
      </div>

      <div className="space-y-6 text-xs">
        {/* Language */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Globe className="w-4 h-4 text-teal-600" />
            <h2 className="text-xs font-bold text-slate-900">Workstation Display Language</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { code: 'en', label: 'English', desc: 'Standard Clinical Medical English' },
              { code: 'hi', label: 'हिन्दी (Hindi)', desc: 'हिंदी भाषा में क्लिनिकल इंटरफेस' },
              { code: 'mr', label: 'मराठी (Marathi)', desc: 'मराठी भाषेत क्लिनिकल डेटा' }
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

        {/* Clinical Privacy */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <h2 className="text-xs font-bold text-slate-900">Consent & HIPAA / Clinical Privacy Policy</h2>
          </div>

          <p className="text-2xs text-slate-600 leading-relaxed">
            By operating this medical workstation, you agree to access patient records solely for diagnostic and healthcare consultation purposes in accordance with explicit patient consent authorization.
          </p>
        </div>

        {/* Logout */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="font-bold text-slate-900 block">Physician Session</span>
            <span className="text-2xs text-slate-500">End your current clinical session.</span>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold border border-rose-200 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
