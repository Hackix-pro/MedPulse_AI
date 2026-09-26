import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Share2, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle, 
  Printer, 
  Stethoscope 
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { Report, DoctorConnection } from '../../types';
import { ShareModal } from '../../components/modals/ShareModal';
import { useToast } from '../../components/common/Toast';

export const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [report, setReport] = useState<Report | null>(null);
  const [connections, setConnections] = useState<DoctorConnection[]>([]);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'table' | 'original'>('table');

  useEffect(() => {
    if (id) {
      const found = storageService.getReportById(id);
      if (found) {
        setReport(found);
      }
    }
    setConnections(storageService.getConnections());
  }, [id]);

  if (!report) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
        <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-slate-900 mb-1">Report Not Found</h2>
        <p className="text-2xs text-slate-500 mb-4">The medical report with ID "{id}" does not exist in your record vault.</p>
        <button
          onClick={() => navigate('/patient/reports')}
          className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold"
        >
          Back to Reports
        </button>
      </div>
    );
  }

  const abnormalValues = report.extractedValues.filter(v => v.status !== 'normal');

  return (
    <div className="space-y-6">
      {/* Back button & top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/patient/reports')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 self-start"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Reports
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <button
            onClick={() => showToast(`Downloaded ${report.fileName}`, 'success')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Download PDF
          </button>
          <button
            onClick={() => setIsShareOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" /> Share Report
          </button>
        </div>
      </div>

      {/* Report Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-lg font-bold text-slate-900">{report.title}</h1>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-2xs font-mono font-semibold">
              {report.id}
            </span>
            <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 text-2xs font-medium">
              {report.category}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {report.hospitalOrLab} · Collection Date: <span className="font-mono font-semibold text-slate-800">{report.date}</span> · Patient: {report.uploadedBy}
          </p>
        </div>

        <div>
          {abnormalValues.length > 0 ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{abnormalValues.length} Values Outside Reference Range</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>All Lab Biomarkers Normal</span>
            </div>
          )}
        </div>
      </div>

      {/* AI Clinical Summary Banner */}
      <div className="p-4 sm:p-5 bg-teal-50/40 rounded-2xl border border-teal-100 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 mb-1">
              AI Clinical Explanation
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              {report.aiSummary}
            </p>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('table')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'table'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Extracted Lab Biomarkers Table ({report.extractedValues.length})
        </button>

        <button
          onClick={() => setActiveTab('original')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'original'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Original Medical Document Format
        </button>
      </div>

      {/* Extracted Values Table */}
      {activeTab === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 text-2xs uppercase">
                <tr>
                  <th className="py-3 px-4 font-semibold">Test Parameter</th>
                  <th className="py-3 px-4 font-semibold text-right">Measured Value</th>
                  <th className="py-3 px-4 font-semibold">Unit</th>
                  <th className="py-3 px-4 font-semibold">Standard Reference Range</th>
                  <th className="py-3 px-4 font-semibold">Clinical Interpretation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.extractedValues.map(v => {
                  const isNormal = v.status === 'normal';
                  return (
                    <tr key={v.id} className={`hover:bg-slate-50 ${!isNormal ? 'bg-amber-50/20' : ''}`}>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {v.testName}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {v.value}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-2xs">
                        {v.unit}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-2xs">
                        {v.referenceRange}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-2xs font-semibold px-2 py-0.5 rounded ${
                            isNormal
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {isNormal ? (
                            <>
                              <CheckCircle className="w-3 h-3" /> Within Normal Range
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3" />
                              {v.status === 'low' ? 'Below Reference Range' : 'Above Reference Range'}
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Original Document Representation */
        <div className="max-w-2xl mx-auto bg-white border border-slate-300 rounded-xl shadow-md p-8 font-sans text-xs text-slate-800 space-y-6">
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {report.hospitalOrLab.toUpperCase()}
              </h2>
              <p className="text-2xs text-slate-500">
                CLINICAL PATHOLOGY LABORATORY · ACCREDITED REFERENCE CENTER
              </p>
              <p className="text-2xs text-slate-500">
                Reg: LAB-99120-MH · Specimen: Venous Blood
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xs text-slate-400 font-mono">
                REF: {report.id}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded border border-slate-200 text-2xs">
            <div>
              <span className="text-slate-400 uppercase tracking-wider block">Patient</span>
              <span className="font-semibold text-slate-900">{report.uploadedBy}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase tracking-wider block">Date</span>
              <span className="font-semibold text-slate-900 font-mono">{report.date}</span>
            </div>
          </div>

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
      )}

      {/* Doctor & Lab Clinical Notes */}
      {report.notes && (
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-start gap-3">
          <Stethoscope className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">Physician & Lab Annotations</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{report.notes}</p>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        report={report}
        connections={connections}
        onClose={() => setIsShareOpen(false)}
        onSuccess={() => {
          const updated = storageService.getReportById(report.id);
          if (updated) setReport(updated);
        }}
      />
    </div>
  );
};
