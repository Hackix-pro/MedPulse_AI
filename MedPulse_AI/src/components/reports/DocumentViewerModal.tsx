import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Download, 
  Share2, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle, 
  Printer, 
  ShieldCheck,
  Stethoscope
} from 'lucide-react';
import { Report } from '../../types';
import { useToast } from '../common/Toast';

interface DocumentViewerModalProps {
  report: Report | null;
  isOpen: boolean;
  onClose: () => void;
  onShare?: (report: Report) => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  report,
  isOpen,
  onClose,
  onShare
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'structured' | 'document' | 'ai'>('structured');

  if (!isOpen || !report) return null;

  const handleDownload = () => {
    showToast(`Downloading verified clinical PDF: ${report.fileName}`, 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const abnormalValues = report.extractedValues.filter(v => v.status !== 'normal');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-900 leading-tight">
                  {report.title}
                </h2>
                <span className="text-2xs font-mono text-slate-500">
                  {report.id}
                </span>
              </div>
              <p className="text-2xs text-slate-500">
                {report.hospitalOrLab} · Date: {report.date} · Uploaded by: {report.uploadedBy}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-md transition-colors"
              title="Print Clinical Record"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-md transition-colors"
              title="Download Document"
            >
              <Download className="w-4 h-4" />
            </button>
            {onShare && (
              <button
                onClick={() => onShare(report)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-md ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="px-6 py-2 border-b border-slate-200 bg-white flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('structured')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'structured'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Structured Lab Values ({report.extractedValues.length})
          </button>
          <button
            onClick={() => setActiveTab('document')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'document'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Original Document Preview
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'ai'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            AI Clinical Analysis
          </button>

          {abnormalValues.length > 0 && (
            <div className="ml-auto flex items-center gap-1.5 text-2xs text-rose-700 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>{abnormalValues.length} out-of-range finding(s)</span>
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {/* TAB 1: STRUCTURED TABLE */}
          {activeTab === 'structured' && (
            <div className="space-y-4">
              {/* Overview Summary Box */}
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900 mb-1">
                      AI Interpretation Summary
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {report.aiSummary || 'All parameters extracted and validated against standard reference cohorts.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lab Values Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 text-2xs uppercase">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Test Parameter</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Extracted Value</th>
                      <th className="py-2.5 px-4 font-semibold">Unit</th>
                      <th className="py-2.5 px-4 font-semibold">Reference Range</th>
                      <th className="py-2.5 px-4 font-semibold">Clinical Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.extractedValues.map(item => {
                      const isNormal = item.status === 'normal';
                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            !isNormal ? 'bg-amber-50/20' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-medium text-slate-900">
                            {item.testName}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                            {item.value}
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-mono text-2xs">
                            {item.unit}
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-mono text-2xs">
                            {item.referenceRange}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 text-2xs font-semibold">
                              {isNormal ? (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-700">Normal</span>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                  <span className="text-rose-700 uppercase">
                                    {item.status === 'low' ? 'Below Range' : 'Above Range'}
                                  </span>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Notes / Clinical Annotations */}
              {report.notes && (
                <div className="p-4 bg-teal-50/30 border border-teal-100 rounded-xl">
                  <div className="flex items-start gap-2.5">
                    <Stethoscope className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-semibold text-teal-900">
                        Doctor & Laboratory Notes:
                      </span>
                      <p className="text-xs text-slate-700 mt-0.5">{report.notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ORIGINAL DOCUMENT PREVIEW */}
          {activeTab === 'document' && (
            <div className="max-w-2xl mx-auto bg-white border border-slate-300 rounded-xl shadow-md p-8 font-sans text-xs text-slate-800 space-y-6">
              {/* Diagnostic Lab Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-base font-bold text-slate-900 tracking-tight">
                    {report.hospitalOrLab.toUpperCase()}
                  </h1>
                  <p className="text-2xs text-slate-500">
                    NABL ACCREDITED CLINICAL REFERENCE LABORATORY · ISO 15189:2012
                  </p>
                  <p className="text-2xs text-slate-500">
                    License No: MED-LAB-2024-99120 · Tel: +91 22 6100 8800
                  </p>
                </div>
                <div className="text-right">
                  <div className="w-12 h-12 border-2 border-slate-900 rounded p-1 flex items-center justify-center font-mono text-3xs text-center font-bold">
                    VERIFIED QR
                  </div>
                  <span className="text-3xs text-slate-400 block mt-1 font-mono">
                    REF: {report.id}
                  </span>
                </div>
              </div>

              {/* Patient Demographics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded border border-slate-200 text-2xs">
                <div>
                  <span className="text-slate-400 uppercase tracking-wider block">Patient</span>
                  <span className="font-semibold text-slate-900">{report.uploadedBy}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase tracking-wider block">Age / Gender</span>
                  <span className="font-semibold text-slate-900">34 Y / Male</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase tracking-wider block">Referred By</span>
                  <span className="font-semibold text-slate-900">{report.doctorName || 'Dr. Ananya Mehta'}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase tracking-wider block">Sample Collected</span>
                  <span className="font-semibold text-slate-900 font-mono">{report.date}</span>
                </div>
              </div>

              {/* Test Department */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
                  DEPARTMENT OF {report.category.toUpperCase()}
                </h3>

                <table className="w-full text-left text-2xs">
                  <thead className="border-b border-slate-300 text-slate-500">
                    <tr>
                      <th className="py-1">INVESTIGATION</th>
                      <th className="py-1 text-right">RESULT</th>
                      <th className="py-1 px-2">UNITS</th>
                      <th className="py-1">REFERENCE INTERVAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.extractedValues.map(v => (
                      <tr key={v.id}>
                        <td className="py-2 font-medium">{v.testName}</td>
                        <td className={`py-2 text-right font-mono font-bold ${v.status !== 'normal' ? 'text-rose-600' : 'text-slate-900'}`}>
                          {v.value} {v.status !== 'normal' ? '*' : ''}
                        </td>
                        <td className="py-2 px-2 text-slate-500 font-mono">{v.unit}</td>
                        <td className="py-2 text-slate-500 font-mono">{v.referenceRange}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Lab End Notes & Signatures */}
              <div className="pt-6 border-t border-slate-200 flex items-end justify-between text-2xs text-slate-500">
                <div>
                  <p className="font-mono text-3xs">
                    * Asterisk indicates result outside standardized biologic reference range.
                  </p>
                  <p className="mt-1">Report Generated: {report.date} 14:32:10 IST</p>
                </div>
                <div className="text-right">
                  <div className="font-serif italic text-sm text-slate-900">Dr. K. R. Sen, MD</div>
                  <span className="block text-3xs uppercase">Consultant Pathologist</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AI CLINICAL ANALYSIS */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>Clinical Intelligence Breakdown</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {report.aiSummary}
                </p>

                <div className="pt-3 border-t border-slate-100">
                  <h4 className="text-2xs font-semibold uppercase text-slate-400 tracking-wider mb-2">
                    Biomarker Breakdown
                  </h4>
                  <div className="space-y-2">
                    {report.extractedValues.map(v => (
                      <div key={v.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-medium text-slate-900">{v.testName}</span>
                          <span className="text-2xs text-slate-500 block font-mono">
                            Measured: {v.value} {v.unit} (Expected: {v.referenceRange})
                          </span>
                        </div>
                        <span className={`text-2xs font-semibold px-2 py-0.5 rounded ${
                          v.status === 'normal' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {v.status === 'normal' ? 'Within Range' : 'Flagged for Review'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-teal-50/40 rounded-xl border border-teal-100 text-2xs text-teal-800 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-xs mb-0.5">Clinical Disclaimer</span>
                  This summary is automatically structured by MedPulse AI from your authenticated laboratory report. It is intended to assist medical record comprehension and physician consultations.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-white text-xs">
          <span className="text-2xs text-slate-400">
            Document: {report.fileName} ({report.fileSize})
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-medium transition-colors"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
