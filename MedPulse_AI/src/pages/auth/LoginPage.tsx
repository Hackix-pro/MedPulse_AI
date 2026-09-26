import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Role } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Stethoscope, User } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [role, setRole] = useState<Role>(
    (location.state as any)?.role || 'patient'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1-Click demo credential fill
  const fillDemo = (targetRole: Role) => {
    setRole(targetRole);
    setErrorMessage('');
    if (targetRole === 'patient') {
      setEmail('patient@demo.com');
      setPassword('password123');
    } else {
      setEmail('doctor@demo.com');
      setPassword('password123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);
    const result = await login(email, password, role);
    setLoading(false);

    if (result.success) {
      showToast(`Welcome back! Logged in as ${role.toUpperCase()}.`, 'success');
      if (role === 'doctor') {
        navigate('/doctor/dashboard');
      } else {
        navigate('/patient/dashboard');
      }
    } else {
      setErrorMessage(result.error || 'Authentication failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 group mb-3">
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
            M+
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            MedPulse <span className="text-teal-600 font-normal">AI</span>
          </span>
        </Link>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Sign In to Your Health Vault
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Access your verified reports, biomarker trends, and physician consults
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-sm border border-slate-200 rounded-2xl">
          {/* Role Switcher Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setRole('patient');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors ${
                role === 'patient'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5 text-teal-600" />
              <span>PATIENT PORTAL</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole('doctor');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors ${
                role === 'doctor'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
              <span>DOCTOR PORTAL</span>
            </button>
          </div>

          {/* Quick Demo Credentials Box */}
          <div className="mb-6 p-3 bg-teal-50/50 border border-teal-200/70 rounded-xl text-2xs text-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-teal-900 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                Quick Demo Credentials:
              </span>
              <span className="text-3xs text-teal-700 uppercase font-mono">1-Click Auto Fill</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                onClick={() => fillDemo('patient')}
                className="p-1.5 rounded-lg bg-white border border-teal-200 hover:bg-teal-50 text-left transition-colors"
              >
                <span className="font-bold text-slate-900 block">Patient Demo</span>
                <span className="text-3xs text-slate-500 font-mono">patient@demo.com</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('doctor')}
                className="p-1.5 rounded-lg bg-white border border-teal-200 hover:bg-teal-50 text-left transition-colors"
              >
                <span className="font-bold text-slate-900 block">Doctor Demo</span>
                <span className="text-3xs text-slate-500 font-mono">doctor@demo.com</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-2xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-2xs font-semibold text-slate-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-2xs font-medium text-teal-600 hover:text-teal-700"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="text-2xs text-slate-600">Remember this browser session</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In as {role.toUpperCase()}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-2xs text-slate-500">
            <span>Don't have an account yet? </span>
            <Link
              to="/signup"
              state={{ role }}
              className="text-teal-600 font-semibold hover:underline"
            >
              Create {role === 'doctor' ? 'Doctor' : 'Patient'} Account
            </Link>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-3xs text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>Encrypted Local Storage Vault · Hackathon MVP Architecture</span>
        </div>
      </div>
    </div>
  );
};
