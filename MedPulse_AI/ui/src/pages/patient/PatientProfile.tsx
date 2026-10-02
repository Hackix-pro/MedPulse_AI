import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PatientUser } from '../../types';
import { useToast } from '../../components/common/Toast';
import { User, Check, ShieldCheck, HeartPulse, Phone } from 'lucide-react';

export const PatientProfile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  const patient = user as PatientUser;

  const [name, setName] = useState(patient?.name || '');
  const [email] = useState(patient?.email || '');
  const [mobile, setMobile] = useState(patient?.mobile || '');
  const [dob, setDob] = useState(patient?.dob || '1992-06-14');
  const [gender, setGender] = useState(patient?.gender || 'Male');
  const [bloodGroup, setBloodGroup] = useState(patient?.bloodGroup || 'B+');
  const [allergiesText, setAllergiesText] = useState((patient?.allergies || []).join(', '));
  const [medicationsText, setMedicationsText] = useState((patient?.medications || []).join(', '));
  const [historyText, setHistoryText] = useState((patient?.medicalHistory || []).join(', '));
  const [emergencyName, setEmergencyName] = useState(patient?.emergencyContact?.name || '');
  const [emergencyRel, setEmergencyRel] = useState(patient?.emergencyContact?.relationship || '');
  const [emergencyPhone, setEmergencyPhone] = useState(patient?.emergencyContact?.phone || '');

  const [saving, setSaving] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const allergies = allergiesText.split(',').map(s => s.trim()).filter(Boolean);
    const medications = medicationsText.split(',').map(s => s.trim()).filter(Boolean);
    const medicalHistory = historyText.split(',').map(s => s.trim()).filter(Boolean);

    updateProfile({
      name,
      mobile,
      dob,
      gender: gender as any,
      bloodGroup,
      allergies,
      medications,
      medicalHistory,
      emergencyContact: {
        name: emergencyName,
        relationship: emergencyRel,
        phone: emergencyPhone
      }
    } as any);

    setSaving(false);
    showToast('Patient profile updated and persisted.', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Patient Clinical Profile</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Verified demographics, emergency contacts, active prescriptions, and clinical history
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Basic Demographics Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-4 h-4 text-teal-600" />
            <h2 className="text-xs font-bold text-slate-900">Demographic Identifiers</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-2xs font-semibold text-slate-700 mb-1">
                Full Name
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
                Patient Identifier (PID)
              </label>
              <input
                type="text"
                disabled
                value={patient?.id || ''}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-500 font-mono font-bold cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-2xs font-semibold text-slate-700 mb-1">
                Registered Email (Immutable)
              </label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-500 font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-2xs font-semibold text-slate-700 mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-2xs font-semibold text-slate-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={dob}
                onChange={e => setDob(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-2xs font-semibold text-slate-700 mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value as any)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500"
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
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500 font-bold"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Medical History & Allergies */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <HeartPulse className="w-4 h-4 text-rose-600" />
            <h2 className="text-xs font-bold text-slate-900">Clinical History & Medication Protocols</h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-2xs font-semibold text-slate-700 mb-1">
                Allergies & Adverse Drug Reactions (Comma separated)
              </label>
              <input
                type="text"
                value={allergiesText}
                onChange={e => setAllergiesText(e.target.value)}
                placeholder="e.g. Penicillin, Sulfa drugs, Peanuts"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500"
              />
            </div>

            <div>
              <label className="block text-2xs font-semibold text-slate-700 mb-1">
                Active Medications & Dosage (Comma separated)
              </label>
              <input
                type="text"
                value={medicationsText}
                onChange={e => setMedicationsText(e.target.value)}
                placeholder="e.g. Metformin 500mg (OD), Atorvastatin 10mg (HS)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500"
              />
            </div>

            <div>
              <label className="block text-2xs font-semibold text-slate-700 mb-1">
                Chronic Diagnoses & Medical History (Comma separated)
              </label>
              <input
                type="text"
                value={historyText}
                onChange={e => setHistoryText(e.target.value)}
                placeholder="e.g. Mild Hypertension, Pre-diabetes surveillance, Appendectomy (2018)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Phone className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-900">Emergency Contact</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-2xs font-semibold text-slate-700 mb-1">
                Contact Name
              </label>
              <input
                type="text"
                value={emergencyName}
                onChange={e => setEmergencyName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500"
              />
            </div>

            <div>
              <label className="block text-2xs font-semibold text-slate-700 mb-1">
                Relationship
              </label>
              <input
                type="text"
                value={emergencyRel}
                onChange={e => setEmergencyRel(e.target.value)}
                placeholder="e.g. Spouse, Parent, Sibling"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500"
              />
            </div>

            <div>
              <label className="block text-2xs font-semibold text-slate-700 mb-1">
                Emergency Phone Number
              </label>
              <input
                type="tel"
                value={emergencyPhone}
                onChange={e => setEmergencyPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Check className="w-4 h-4" /> Save Profile Changes
          </button>
        </div>
      </form>
    </div>
  );
};
