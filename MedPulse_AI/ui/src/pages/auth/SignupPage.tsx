import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Role } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { Stethoscope, User, ArrowRight, ShieldCheck } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signup } = useAuth();
  const { showToast } = useToast();

  const [role, setRole] = useState<Role>(
    (location.state as any)?.role || 'patient'
  );

  // Common fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<'en' | 'hi' | 'mr'>('en');
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Patient specific
  const [dob, setDob] = useState('1994-05-12');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [bloodGroup, setBloodGroup] = useState('B+');

  // Doctor specific
  const [qualification, setQualification] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [hospital, setHospital] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!name.trim()) return setError('Please enter your full name.');
    if (!email.trim() || !email.includes('@')) return setError('Please enter a valid email address.');
    if (!mobile.trim() || mobile.length < 10) return setError('Please enter a valid 10-digit mobile number.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    if (!acceptTerms) return setError('Please accept the Terms of Service & Privacy Policy.');

    if (role === 'doctor') {
      if (!qualification.trim()) return setError('Please specify your medical qualifications (e.g. MBBS, MD).');
      if (!specialization.trim()) return setError('Please enter your clinical specialization.');
      if (!registrationNumber.trim()) return setError('Please provide your medical council registration number.');
      if (!hospital.trim()) return setError('Please enter your primary hospital or clinic affiliation.');
    }

    setLoading(true);

    const formData = {
      role,
      name: name.trim(),
      email: email.trim(),
      mobile: mobile.trim(),
      password,
      preferredLanguage,
      dob,
      gender,
      bloodGroup,
      qualification: qualification.trim(),
      specialization: specialization.trim(),
      registrationNumber: registrationNumber.trim(),
      hospital: hospital.trim()
    };

    const res = await signup(formData);
    setLoading(false);

    if (res.success) {
      showToast(`Account created successfully! Welcome to MedPulse AI.`, 'success');
      if (role === 'doctor') {
        navigate('/doctor/dashboard');
      } else {
        navigate('/patient/dashboard');
      }
    } else {
      setError(res.error || 'Registration failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <Link to="/" className="inline-flex items-center gap-2 group mb-3">
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
            M+
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            MedPulse <span className="text-teal-600 font-normal">AI</span>
          </span>
        </Link>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Create Your {role === 'doctor' ? 'Clinical Practitioner' : 'Patient'} Account
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Join the consent-governed intelligent medical record platform
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-sm border border-slate-200 rounded-2xl">
          {/* Role Toggle */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setRole('patient');
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors ${
                role === 'patient'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5 text-teal-600" />
              <span>PATIENT REGISTRATION</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole('doctor');
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors ${
                role === 'doctor'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
              <span>DOCTOR REGISTRATION</span>
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-2xs font-semibold text-slate-700 mb-1">
                  {role === 'doctor' ? 'Doctor Full Name' : 'Patient Full Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={role === 'doctor' ? 'Dr. Vikram Seth' : 'Aarav Sharma'}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500"
                />
              </div>
            </div>

            {/* Mobile & Preferred Language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-2xs font-semibold text-slate-700 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  placeholder="+91 98200 12345"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-slate-700 mb-1">
                  Preferred Language
                </label>
                <select
                  value={preferredLanguage}
                  onChange={e => setPreferredLanguage(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500 font-medium"
                >
                  <option value="en">English</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="mr">मराठी (Marathi)</option>
                </select>
              </div>
            </div>

            {/* ROLE-SPECIFIC FIELDS: PATIENT */}
            {role === 'patient' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-2xs font-semibold text-slate-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={e => setDob(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-semibold text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-2xs font-semibold text-slate-700 mb-1">
                    Blood Group
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={e => setBloodGroup(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500 font-semibold"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* ROLE-SPECIFIC FIELDS: DOCTOR */}
            {role === 'doctor' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-2xs font-semibold text-slate-700 mb-1">
                    Qualifications (e.g. MBBS, MD) *
                  </label>
                  <input
                    type="text"
                    required
                    value={qualification}
                    onChange={e => setQualification(e.target.value)}
                    placeholder="MBBS, MD (Medicine)"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-semibold text-slate-700 mb-1">
                    Specialization *
                  </label>
                  <input
                    type="text"
                    required
                    value={specialization}
                    onChange={e => setSpecialization(e.target.value)}
                    placeholder="Internal Medicine, Cardiology, etc."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-semibold text-slate-700 mb-1">
                    Medical Council Reg. Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={registrationNumber}
                    onChange={e => setRegistrationNumber(e.target.value)}
                    placeholder="MCI-2015-89410"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-semibold text-slate-700 mb-1">
                    Primary Hospital / Clinic *
                  </label>
                  <input
                    type="text"
                    required
                    value={hospital}
                    onChange={e => setHospital(e.target.value)}
                    placeholder="Lilavati Hospital / Independent OPD"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500"
                  />
                </div>
              </div>
            )}

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-2xs font-semibold text-slate-700 mb-1">
                  Password (min 6 characters) *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-slate-700 mb-1">
                  Confirm Password *
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
            </div>

            {/* Terms checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={acceptTerms}
                  onChange={e => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="text-2xs text-slate-600 leading-normal">
                  I agree to the MedPulse AI Health Data Consent terms and acknowledge that this prototype is designed for clinical demonstration and longitudinal record management.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <span>Registering Account...</span>
              ) : (
                <>
                  <span>Complete {role.toUpperCase()} Registration</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-2xs text-slate-500">
            <span>Already have an account? </span>
            <Link to="/login" state={{ role }} className="text-teal-600 font-semibold hover:underline">
              Sign In Instead
            </Link>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-3xs text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>Patient-Consent Compliant Architecture</span>
        </div>
      </div>
    </div>
  );
};
