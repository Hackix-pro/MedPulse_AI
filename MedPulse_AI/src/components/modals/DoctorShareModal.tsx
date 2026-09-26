import React, { useState } from 'react';
import { X, Share2, Check, Stethoscope } from 'lucide-react';
import { Report } from '../../types';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';

interface DoctorShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  reports: Report[];
  onSuccess?: () => void;
}

export const DoctorShareModal: React.FC<DoctorShareModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  reports,
  onSuccess
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [selectedReportId, setSelectedReportId] = useState(reports[0]?.id || '');
  const [clinicalAdvice, setClinicalAdvice] = useState('');
  const [noteCategory, setNoteCategory] = useState<'lab_review' | 'prescription' | 'followup'>('lab_review');

  if (!isOpen) return null;

  const handleShare = (e: React.FormEvent) => {
    e.preventDefault();

    const targetReport = reports.find(r => r.id === selectedReportId);
    if (!targetReport) {
      showToast('Please select a valid report to annotate and share.', 'error');
      return;
    }

    // 1. Create shared report entry
    storageService.shareReport({
      reportId: targetReport.id,
      reportTitle: targetReport.title,
      patientId,
      patientName,
      doctorId: user?.id || 'DOC-10294',
      doctorName: user?.name || 'Dr. Ananya Mehta',
      sharedBy: 'doctor',
      senderName: user?.name || 'Dr. Ananya Mehta',
      recipientName: patientName,
      note: clinicalAdvice.trim() || 'Reviewed by physician with clinical annotations.',
      category: targetReport.category
    });

    // 2. Add doctor note linked to this report
    if (clinicalAdvice.trim()) {
      storageService.addDoctorNote({
        patientId,
        doctorId: user?.id || 'DOC-10294',
        doctorName: user?.name || 'Dr. Ananya Mehta',
        reportId: targetReport.id,
        reportTitle: targetReport.title,
        text: clinicalAdvice.trim(),
        category: noteCategory,
        sharedWithPatient: true
      });
    }

    showToast(`Shared "${targetReport.title}" and clinical note with ${patientName}.`, 'success');
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Share Annotated Report with Patient
              </h3>
              <p className="text-2xs text-slate-500">
                Patient: {patientName} ({patientId})
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
        <form onSubmit={handleShare} className="p-6 space-y-4">
          <div>
            <label className="block text-2xs font-semibold text-slate-700 mb-1">
              Select Patient's Report to Annotate
            </label>
            <select
              value={selectedReportId}
              onChange={e => setSelectedReportId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500 font-medium"
            >
              {reports.map(r => (
                <option key={r.id} value={r.id}>
                  {r.title} ({r.date}) · {r.category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-2xs font-semibold text-slate-700 mb-1">
              Clinical Category
            </label>
            <select
              value={noteCategory}
              onChange={e => setNoteCategory(e.target.value as any)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500"
            >
              <option value="lab_review">Lab Review & Interpretation</option>
              <option value="prescription">Prescription / Supplement Protocol</option>
              <option value="followup">Follow-up Recommendation</option>
            </select>
          </div>

          <div>
            <label className="block text-2xs font-semibold text-slate-700 mb-1">
              Doctor's Clinical Advice & Notes for Patient
            </label>
            <textarea
              rows={4}
              value={clinicalAdvice}
              onChange={e => setClinicalAdvice(e.target.value)}
              placeholder="e.g. Reviewed elevated fasting glucose. Start 30 min daily walking, reduce simple carbs, and repeat fasting test in 6 weeks."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500"
            />
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
              <Share2 className="w-3.5 h-3.5" /> Share with Patient
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
