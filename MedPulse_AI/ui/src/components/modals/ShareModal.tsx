import React, { useState } from 'react';
import { X, Share2, Check, Shield } from 'lucide-react';
import { Report, DoctorConnection } from '../../types';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  report?: Report | null;
  connections: DoctorConnection[];
  onSuccess?: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  report,
  connections,
  onSuccess
}) => {
  const { user, role } = useAuth();
  const { showToast } = useToast();

  const [selectedDoctorId, setSelectedDoctorId] = useState(
    connections.find(c => c.status === 'connected')?.doctorId || ''
  );
  const [shareNote, setShareNote] = useState('');
  const [permissions, setPermissions] = useState({
    viewLabValues: true,
    viewTrends: true,
    viewAISummary: true
  });

  if (!isOpen || !report) return null;

  const connectedDocs = connections.filter(c => c.status === 'connected');

  const handleShare = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDoctorId) {
      showToast('Please select a connected practitioner to share with.', 'error');
      return;
    }

    const doc = connectedDocs.find(d => d.doctorId === selectedDoctorId);
    if (!doc) {
      showToast('Doctor connection not found.', 'error');
      return;
    }

    storageService.shareReport({
      reportId: report.id,
      reportTitle: report.title,
      patientId: user?.id || '',
      patientName: user?.name || 'Unknown',
      doctorId: doc.doctorId,
      doctorName: doc.doctorName,
      sharedBy: 'patient',
      senderName: user?.name || 'Unknown',
      recipientName: doc.doctorName,
      note: shareNote.trim() || 'Shared for clinical consultation.',
      category: report.category
    });

    showToast(`Shared "${report.title}" with ${doc.doctorName}.`, 'success');
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Share Report with Doctor
              </h3>
              <p className="text-2xs text-slate-500">
                Encrypted consent-based clinical record access
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
        <form onSubmit={handleShare} className="p-6 space-y-4 text-xs">
          {/* Selected Report Summary */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-2xs text-slate-400 uppercase tracking-wider block mb-0.5">
              Target Document
            </span>
            <p className="font-semibold text-slate-900">{report.title}</p>
            <p className="text-2xs text-slate-500 font-mono mt-0.5">
              {report.date} · {report.hospitalOrLab} · {report.extractedValues.length} biomarkers
            </p>
          </div>

          {/* Practitioner Picker */}
          <div>
            <label className="block text-2xs font-semibold text-slate-700 mb-1.5">
              Select Authorized Doctor
            </label>
            {connectedDocs.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-2xs">
                You do not have any connected doctors yet. Connect with a doctor in the "My Doctors" portal first.
              </div>
            ) : (
              <select
                value={selectedDoctorId}
                onChange={e => setSelectedDoctorId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500 font-medium"
              >
                {connectedDocs.map(d => (
                  <option key={d.doctorId} value={d.doctorId}>
                    {d.doctorName} ({d.doctorSpecialty}) - {d.doctorHospital}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Access Scopes */}
          <div>
            <label className="block text-2xs font-semibold text-slate-700 mb-2">
              Permissions Granted for this Document
            </label>
            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions.viewLabValues}
                  onChange={e => setPermissions({ ...permissions, viewLabValues: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="text-slate-800 font-medium">Extract lab test tables & reference values</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions.viewTrends}
                  onChange={e => setPermissions({ ...permissions, viewTrends: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="text-slate-800 font-medium">Include in longitudinal biomarker trend charts</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions.viewAISummary}
                  onChange={e => setPermissions({ ...permissions, viewAISummary: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="text-slate-800 font-medium">Allow AI Clinical Summary aggregation</span>
              </label>
            </div>
          </div>

          {/* Message / Clinical Note */}
          <div>
            <label className="block text-2xs font-semibold text-slate-700 mb-1.5">
              Note or Specific Question for the Doctor (Optional)
            </label>
            <textarea
              rows={3}
              value={shareNote}
              onChange={e => setShareNote(e.target.value)}
              placeholder="e.g. Please review my elevated fasting glucose and advise if prescription adjustments are required..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500"
            />
          </div>

          <div className="flex items-center gap-2 text-2xs text-slate-500">
            <Shield className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span>You may revoke record access anytime from the My Doctors portal.</span>
          </div>

          {/* Footer buttons */}
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
              disabled={connectedDocs.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Check className="w-4 h-4" /> Confirm & Share
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
