import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  FileText, 
  Download, 
  Eye, 
  Stethoscope, 
  ArrowUpRight, 
  ArrowDownLeft,
  Calendar
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { SharedReport, Report } from '../../types';
import { DocumentViewerModal } from '../../components/reports/DocumentViewerModal';
import { useToast } from '../../components/common/Toast';

export const SharedReports: React.FC = () => {
  const { showToast } = useToast();
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const [sharedList, setSharedList] = useState<SharedReport[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);

  const loadData = () => {
    setSharedList(storageService.getSharedReports());
    setReports(storageService.getReports());
  };

  useEffect(() => {
    loadData();
  }, []);

  const receivedFromDoctors = sharedList.filter(s => s.sharedBy === 'doctor');
  const sharedWithDoctors = sharedList.filter(s => s.sharedBy === 'patient');

  const currentItems = tab === 'received' ? receivedFromDoctors : sharedWithDoctors;

  const handleOpenReport = (reportId: string) => {
    const rep = reports.find(r => r.id === reportId);
    if (rep) {
      setViewingReport(rep);
    } else {
      showToast('Document record loaded.', 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Shared Clinical Reports</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          History of medical documents exchanged between you and your healthcare providers
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit text-xs font-semibold">
        <button
          onClick={() => setTab('received')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            tab === 'received'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 text-teal-600" />
          <span>Received from Doctors ({receivedFromDoctors.length})</span>
        </button>

        <button
          onClick={() => setTab('sent')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            tab === 'sent'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-blue-600" />
          <span>Shared with Doctors ({sharedWithDoctors.length})</span>
        </button>
      </div>

      {/* List */}
      {currentItems.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
          <Share2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No records found</h3>
          <p className="text-2xs text-slate-500 mt-1">
            {tab === 'received'
              ? 'No annotated documents received from your physician yet.'
              : 'You have not shared any test documents with doctors yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100">
          {currentItems.map(item => (
            <div
              key={item.id}
              className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  tab === 'received' ? 'bg-teal-50 text-teal-700' : 'bg-blue-50 text-blue-700'
                }`}>
                  <FileText className="w-5 h-5" />
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900">{item.reportTitle}</h3>
                    <span className="text-2xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      {item.category}
                    </span>
                    <span className="text-2xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold uppercase">
                      {item.status}
                    </span>
                  </div>

                  <p className="text-2xs text-slate-500 mt-1">
                    {tab === 'received' ? (
                      <>Annotated by: <strong className="text-slate-800">{item.doctorName}</strong></>
                    ) : (
                      <>Shared with: <strong className="text-slate-800">{item.doctorName}</strong></>
                    )}
                    {' · '}
                    <span className="font-mono">{item.sharedAt}</span>
                  </p>

                  {/* Doctor or Patient Note */}
                  {item.note && (
                    <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-2xs text-slate-700">
                      <span className="font-semibold text-slate-900">
                        {tab === 'received' ? 'Doctor Clinical Advice:' : 'Your Accompanying Note:'}
                      </span>{' '}
                      {item.note}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  onClick={() => handleOpenReport(item.reportId)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> View Report
                </button>
                <button
                  onClick={() => showToast(`Downloading ${item.reportTitle}...`, 'success')}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={!!viewingReport}
        report={viewingReport}
        onClose={() => setViewingReport(null)}
      />
    </div>
  );
};
