import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DoctorUser } from '../../types';
import { useToast } from '../../components/common/Toast';
import { Stethoscope, Check, ShieldCheck, Building2 } from 'lucide-react';

export const DoctorProfile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  const doctor = user as DoctorUser;

  const [name, setName] = useState(doctor?.name || 'Dr. Ananya Mehta');
  const [mobile, setMobile] = useState(doctor?.mobile || '+91 94220 88102');
  const [qualification, setQualification] = useState(doctor?.qualification || 'MBBS, MD (Internal Medicine)');
  const [specialization, setSpecialization] = useState(doctor?.specialization || 'Internal Medicine & Endocrinology');
  const [registrationNumber, setRegistrationNumber] = useState(doctor?.registrationNumber || 'MCI-2014-883921');
  const [hospital, setHospital] = useState(doctor?.hospital || 'MetroCare Superspeciality Hospital, Mumbai');
  const [about, setAbout] = useState(doctor?.about || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    updateProfile({
      name,
      mobile,
      qualification,
      specialization,
      registrationNumber,
      hospital,
      about
    } as any);

    setSaving(false);
    showToast('Doctor credentials & clinical profile updated.', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Physician Credential Profile</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Medical council credentials, institutional affiliations, and clinical practice bio
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Stethoscope className="w-4 h-4 text-teal-600" />
            <h2 className="text-xs font-bold text-slate-900">Medical Registration & Identity</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-2xs font-semibold text-slate-700 mb-1">
                Doctor Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-2xs font-semibold text-slate-700 mb-1">
                Medical Council Reg. No (MCI/State)
              </label>
              <input
                type="text"
                required
                value={registrationNumber}
                onChange={e => setRegistrationNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-teal-500"
              />
            </div>

            <div>
              <label className="block text-2xs font-semibold text-slate-700 mb-1">
                Clinical Qualifications
              </label>
              <input
                type="text"
                required
                value={qualification}
                onChange={e => setQualification(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500"
              />
            </div>

            <div>
              <label className="block text-2xs font-semibold text-slate-700 mb-1">
                Primary Specialty
              </label>
              <input
                type="text"
                required
                value={specialization}
                onChange={e => setSpecialization(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-4 h-4 text-teal-600" />
            <h2 className="text-xs font-bold text-slate-900">Hospital Affiliation & Practice Overview</h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-2xs font-semibold text-slate-700 mb-1">
                Primary Hospital / Clinic Center
              </label>
              <input
                type="text"
                required
                value={hospital}
                onChange={e => setHospital(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500"
              />
            </div>

            <div>
              <label className="block text-2xs font-semibold text-slate-700 mb-1">
                Clinical Practice Biography & Research Focus
              </label>
              <textarea
                rows={3}
                value={about}
                onChange={e => setAbout(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500 leading-relaxed"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Check className="w-4 h-4" /> Save Doctor Profile
          </button>
        </div>
      </form>
    </div>
  );
};
