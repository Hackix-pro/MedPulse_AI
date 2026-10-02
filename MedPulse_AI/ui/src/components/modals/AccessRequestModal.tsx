import React, { useState } from 'react';
import { X, Send, ShieldCheck } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';

interface AccessRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AccessRequestModal: React.FC<AccessRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [patientIdInput, setPatientIdInput] = useState('');
  const [purpose, setPurpose] = useState('Comprehensive outpatient evaluation and longitudinal biomarker review');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientIdInput.trim()) {
      showToast('Please enter a valid Patient ID.', 'error');
      return;
    }

    storageService.requestDoctorConnection({
      doctorId: user?.id || '',
      doctorName: user?.name || 'Unknown Doctor',
      doctorSpecialty: user && 'specialization' in user ? user.specialization : 'Internal Medicine',
      doctorHospital: user && 'hospital' in user ? user.hospital : 'MetroCare Hospital',
      patientId: patientIdInput.trim().toUpperCase(),
      requestedBy: 'doctor'
    });

    showToast(`Access request dispatched to patient ${patientIdInput.trim().toUpperCase()}.`, 'success');
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Request Patient Health Record Access
              </h3>
              <p className="text-2xs text-slate-500">
                Consent-governed clinical data sharing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-2xs font-semibold text-slate-700 mb-1">
              Patient Identification Number (PID)
            </label>
            <input
              type="text"
              value={patientIdInput}
              onChange={e => setPatientIdInput(e.target.value)}
              placeholder="e.g. PID-65374"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-900 focus:outline-teal-500 uppercase"
            />
            {/* Quick Suggestions */}
            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
              <span className="text-3xs text-slate-400">Quick select:</span>
              {storageService.getUsers().filter(u => u.role === 'patient').map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPatientIdInput(p.id)}
                  className={`text-3xs font-mono px-2 py-0.5 rounded border transition-colors ${
                    patientIdInput === p.id
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-slate-50 hover:bg-teal-50 text-slate-700 border-slate-200 hover:border-teal-300'
                  }`}
                >
                  {p.name} ({p.id})
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-2xs font-semibold text-slate-700 mb-1">
              Clinical Justification / Purpose
            </label>
            <textarea
              rows={3}
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-2xs text-slate-600">
            <p className="font-semibold text-slate-800">Requested Permission Scopes:</p>
            <p>✓ Historical Lab Reports & PDFs</p>
            <p>✓ Diagnostic Health Timeline</p>
            <p>✓ Biomarker Trajectory & Longitudinal Trends</p>
            <p>✓ Clinical AI Synthesis for Diagnostic Decision Support</p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" /> Dispatch Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
