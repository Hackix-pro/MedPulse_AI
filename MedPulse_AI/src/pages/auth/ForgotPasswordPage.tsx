import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, KeyRound, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<'email' | 'otp' | 'new_password'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('482910');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    setLoading(true);
    const res = await resetPassword(email, 'temp');
    setLoading(false);

    if (res.success) {
      showToast('A 6-digit verification code has been dispatched to your email.', 'info');
      setStep('otp');
    } else {
      setError(res.error || 'Failed to locate account.');
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      setError('Please enter the 6-digit code.');
      return;
    }
    setError('');
    setStep('new_password');
  };

  const handleResetFinal = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    showToast('Password reset successfully. Please sign in with your new password.', 'success');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
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
          Reset Your Security Password
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Restore access to your authenticated health records vault
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-sm border border-slate-200 rounded-2xl">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {error}
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-4 text-xs">
              <div>
                <label className="block text-2xs font-semibold text-slate-700 mb-1">
                  Registered Account Email
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
                    placeholder="patient@demo.com or doctor@demo.com"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <span>Searching Account...</span> : <span>Send Reset Verification Code</span>}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
              <div className="p-3 bg-teal-50 rounded-lg text-2xs text-teal-800">
                A simulated verification code has been generated: <span className="font-mono font-bold">482910</span>
              </div>

              <div>
                <label className="block text-2xs font-semibold text-slate-700 mb-1">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-teal-500 font-mono tracking-widest text-center"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Verify Code</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {step === 'new_password' && (
            <form onSubmit={handleResetFinal} className="space-y-4 text-xs">
              <div>
                <label className="block text-2xs font-semibold text-slate-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-semibold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> Save New Password
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-2xs text-slate-500">
            <Link to="/login" className="text-teal-600 font-semibold hover:underline">
              Return to Sign In
            </Link>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-3xs text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>Identity Verification Protocol</span>
        </div>
      </div>
    </div>
  );
};
