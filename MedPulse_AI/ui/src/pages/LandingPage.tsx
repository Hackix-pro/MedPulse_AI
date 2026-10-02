import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  TrendingUp,
  GitCompare,
  Bot,
  ShieldCheck,
  Stethoscope,
  ArrowRight,
  Upload,
  CheckCircle2,
  Users,
  Lock,
  Globe
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [showRoleSelect, setShowRoleSelect] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              M+
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900">
              MedPulse <span className="text-teal-600 font-normal">AI</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-600">
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How It Works</a>
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#clinical-ai" className="hover:text-slate-900 transition-colors">Clinical Intelligence</a>
            <a href="#privacy" className="hover:text-slate-900 transition-colors">Privacy & Consent</a>
            <a href="#languages" className="hover:text-slate-900 transition-colors">Multilingual</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-2"
            >
              Sign In
            </Link>
            <button
              onClick={() => setShowRoleSelect(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 overflow-hidden bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/60 text-2xs font-semibold text-teal-800 mb-6">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Consent-Governed Longitudinal Health Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 text-balance leading-tight max-w-4xl mx-auto">
            Your Medical Reports. One Intelligent Health Record.
          </h1>

          <p className="mt-5 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Upload diagnostic reports, understand complex biomarkers in plain language, track longitudinal health trajectories, compare consecutive tests, and securely collaborate with your doctors.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setShowRoleSelect(true)}
              className="w-full sm:w-auto px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-md transition-colors inline-flex items-center justify-center gap-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              Login to Demo Account
            </Link>
          </div>

          {/* Quick Demo Credentials Pill */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-2xs text-slate-500 font-mono">
            <span>Patient: patient@demo.com</span>
            <span>·</span>
            <span>Doctor: doctor@demo.com</span>
            <span>·</span>
            <span>Pass: password123</span>
          </div>

          {/* Product Workflow Ribbon */}
          <div className="mt-14 p-4 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-xl max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 text-teal-700 text-xs font-semibold mb-1">
                  <Upload className="w-4 h-4" /> 1. Upload & OCR
                </div>
                <p className="text-2xs text-slate-500">
                  Instant optical extraction of lab tables, units, and clinical reference ranges.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 text-teal-700 text-xs font-semibold mb-1">
                  <TrendingUp className="w-4 h-4" /> 2. Longitudinal Trends
                </div>
                <p className="text-2xs text-slate-500">
                  Interactive charts tracking Hemoglobin, Glucose, BP, Lipids, Vitamin D across time.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 text-teal-700 text-xs font-semibold mb-1">
                  <Bot className="w-4 h-4" /> 3. "Ask My Reports"
                </div>
                <p className="text-2xs text-slate-500">
                  Clinical intelligence answering questions grounded directly in your lab evidence.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 text-teal-700 text-xs font-semibold mb-1">
                  <Users className="w-4 h-4" /> 4. Doctor Sharing
                </div>
                <p className="text-2xs text-slate-500">
                  Two-way consent sharing, clinical note exchange, and automated out-of-range alerts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Selection Modal */}
      {showRoleSelect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-left">
            <h2 className="text-base font-semibold text-slate-900 mb-1">
              Select Your Portal Role
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Choose the role that describes your usage to access specialized workflows:
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowRoleSelect(false);
                  navigate('/signup', { state: { role: 'patient' } });
                }}
                className="w-full p-4 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-slate-900">
                      Patient Portal
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
                </div>
                <p className="text-2xs text-slate-500 pl-10">
                  Upload reports, track biomarker timelines, compare tests, and share records with doctors.
                </p>
              </button>

              <button
                onClick={() => {
                  setShowRoleSelect(false);
                  navigate('/signup', { state: { role: 'doctor' } });
                }}
                className="w-full p-4 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-slate-900">
                      Doctor & Clinical Portal
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
                </div>
                <p className="text-2xs text-slate-500 pl-10">
                  Review patient test panels, analyze shifts, add clinical notes, and receive abnormal alerts.
                </p>
              </button>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-2xs">
              <span className="text-slate-500">Already have an account?</span>
              <Link to="/login" className="text-teal-600 font-semibold hover:underline">
                Sign In Instead
              </Link>
            </div>

            <button
              onClick={() => setShowRoleSelect(false)}
              className="mt-3 w-full py-2 text-xs text-slate-500 hover:text-slate-800 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-2xs font-bold uppercase tracking-wider text-teal-600">
            Engineered Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            From Scanned Lab Paper to Clinical Clarity
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Every step is designed to keep patients informed and give practitioners instantaneous longitudinal context.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              1. Multi-Format Upload & OCR Pipeline
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Drop PDFs, camera snapshots, or lab images. The system optical engine detects table structures, test parameters, numbers, units, and biologic reference ranges.
            </p>
            <div className="text-2xs text-slate-400 font-mono">
              Supported: CBC, Lipid, Metabolic, Diabetic, Thyroid panels
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
              <GitCompare className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              2. Structured Comparison & Timeline
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Select any two historical test dates to see side-by-side diff matrices. Biomarkers that improved, escalated, or crossed outside normal thresholds are highlighted.
            </p>
            <div className="text-2xs text-slate-400 font-mono">
              Auto-calculates delta values, % shifts, and clinical severity
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              3. Connected Physician Collaboration
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Patients explicitly grant access to their doctors. Doctors can review longitudinal biomarker charts, synthesize AI clinical summaries, and attach clinical advice.
            </p>
            <div className="text-2xs text-slate-400 font-mono">
              Granular permission scopes: Reports · Trends · Clinical AI
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="features" className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-2xs font-bold uppercase tracking-wider text-teal-600">
              Platform Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
              Comprehensive Health Intelligence Features
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <FileText className="w-5 h-5 text-teal-600 mb-3" />
              <h4 className="text-xs font-bold text-slate-900 mb-1">Interactive Verification Table</h4>
              <p className="text-2xs text-slate-600 leading-relaxed">
                Review and fine-tune every OCR-extracted test parameter, unit, and reference interval prior to committing to persistent storage.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <TrendingUp className="w-5 h-5 text-teal-600 mb-3" />
              <h4 className="text-xs font-bold text-slate-900 mb-1">Dynamic Recharts Telemetry</h4>
              <p className="text-2xs text-slate-600 leading-relaxed">
                Interactive multi-point line charts featuring shaded normal reference intervals, hover tooltips, and timeframe filters.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <Bot className="w-5 h-5 text-teal-600 mb-3" />
              <h4 className="text-xs font-bold text-slate-900 mb-1">Grounded Clinical Q&A</h4>
              <p className="text-2xs text-slate-600 leading-relaxed">
                "Ask My Reports" delivers responses citing specific test dates, exact numerical delta values, and clickable evidence source links.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <CheckCircle2 className="w-5 h-5 text-teal-600 mb-3" />
              <h4 className="text-xs font-bold text-slate-900 mb-1">Automated Abnormal Alerts</h4>
              <p className="text-2xs text-slate-600 leading-relaxed">
                Real-time alerts triggered whenever a lab result breaches clinical thresholds, complete with review acknowledgment tracking.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <Users className="w-5 h-5 text-teal-600 mb-3" />
              <h4 className="text-xs font-bold text-slate-900 mb-1">Dual-Portal Architecture</h4>
              <p className="text-2xs text-slate-600 leading-relaxed">
                Separate tailored portals for patients and healthcare providers with role-based routing and authorization checks.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <Globe className="w-5 h-5 text-teal-600 mb-3" />
              <h4 className="text-xs font-bold text-slate-900 mb-1">Full Trilingual Localization</h4>
              <p className="text-2xs text-slate-600 leading-relaxed">
                Instant UI switching across English, Hindi (हिन्दी), and Marathi (मराठी) for inclusive regional patient empowerment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Clinical AI & Disclaimers */}
      <section id="clinical-ai" className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-2xs font-bold uppercase tracking-wider text-teal-600">
              Ethical AI Discipline
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
              Grounded Evidence Without Hallucinations
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
              MedPulse AI rejects ungrounded generation. When the AI explains a biomarker shift, it quotes the exact verified lab report, the specimen collection date, and the laboratory reference interval.
            </p>

            <div className="mt-6 space-y-3 text-xs">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-teal-50/50 border border-teal-100">
                <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900">Non-Diagnostic Boundary</span>
                  <p className="text-2xs text-slate-600 mt-0.5">
                    Clear informational labeling. Lab values are presented to enrich physician-patient dialogue, not replace professional diagnosis.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <Lock className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900">Client-Side Data Governance</span>
                  <p className="text-2xs text-slate-600 mt-0.5">
                    Records persist securely in browser storage for this MVP prototype with zero unauthorized third-party telemetry.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Assistant UI Mock Showcase */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl border border-slate-800 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-teal-400" />
                <span className="font-semibold">Ask My Reports · AI Assistant</span>
              </div>
              <span className="text-3xs font-mono text-teal-400">Indexed: 6 Reports</span>
            </div>

            <div className="py-4 space-y-3">
              <div className="bg-slate-800/80 p-3 rounded-xl ml-6 border border-slate-700/60">
                <p className="text-2xs text-slate-300 font-medium">User Prompt:</p>
                <p className="text-xs text-white mt-0.5">"What changed between my June and September blood tests?"</p>
              </div>

              <div className="bg-teal-950/40 border border-teal-800/60 p-3 rounded-xl mr-4">
                <p className="text-2xs text-teal-300 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Grounded Evidence Response
                </p>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                  Your Hemoglobin decreased from 13.8 g/dL (June 10) to 12.1 g/dL (August 18). Concurrently, Fasting Glucose rose from 104 mg/dL to 134 mg/dL (September 20), crossing the standard upper reference limit (99 mg/dL).
                </p>
                <div className="mt-2.5 pt-2 border-t border-teal-900/60 flex items-center gap-2 text-3xs font-mono text-teal-400">
                  <span>Evidence: REP-2026-001</span>
                  <span>·</span>
                  <span>REP-2026-004</span>
                  <span>·</span>
                  <span>REP-2026-006</span>
                </div>
              </div>
            </div>

            <div className="text-3xs text-slate-400 text-center pt-2 border-t border-slate-800">
              Informational summary for physician review · Not a clinical diagnosis
            </div>
          </div>
        </div>
      </section>

      {/* Multilingual Support Banner */}
      <section id="languages" className="py-12 bg-slate-50 border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <Globe className="w-6 h-6 text-teal-600 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900">
            Localized for India: English · हिन्दी · मराठी
          </h3>
          <p className="text-xs text-slate-500 max-w-lg mx-auto mt-1">
            Toggle language instantly anywhere in the app to view diagnostics, lab tables, and clinical alerts in your preferred regional language.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-slate-900 text-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Ready to Explore the Healthcare Assistant?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2">
            Try the live prototype as a Patient or Doctor. Seeded with 6 comprehensive reports, trends, and clinical annotations.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setShowRoleSelect(true)}
              className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-colors"
            >
              Launch Live Prototype
            </button>
            <Link
              to="/login"
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700"
            >
              Sign In with Demo Credentials
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-950 text-slate-400 text-2xs border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">MedPulse AI</span>
            <span>·</span>
            <span>Smart Health Record & Clinical Assistant Prototype</span>
          </div>

          <div className="text-slate-500 text-center sm:text-right">
            Demonstration MVP for Hackathon/SIH · Client-Side Architecture
          </div>
        </div>
      </footer>
    </div>
  );
};
