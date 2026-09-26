import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Upload, 
  Search, 
  Filter, 
  Trash2, 
  Share2, 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpDown,
  Download
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { Report, DoctorConnection } from '../../types';
import { UploadModal } from '../../components/reports/UploadModal';
import { DocumentViewerModal } from '../../components/reports/DocumentViewerModal';
import { ShareModal } from '../../components/modals/ShareModal';
import { useToast } from '../../components/common/Toast';

export const PatientReports: React.FC = () => {
  const { t } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [reports, setReports] = useState<Report[]>([]);
  const [connections, setConnections] = useState<DoctorConnection[]>([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'title'>('date_desc');

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [sharingReport, setSharingReport] = useState<Report | null>(null);

  const loadData = () => {
    setReports(storageService.getReports());
    setConnections(storageService.getConnections());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${title}"? This will update your timeline and biomarker alerts.`)) {
      storageService.deleteReport(id);
      showToast(`Report "${title}" removed.`, 'info');
      loadData();
    }
  };

  // Filtered & sorted reports
  const filteredReports = useMemo(() => {
    return reports
      .filter(r => {
        // Query match
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = r.title.toLowerCase().includes(q);
          const matchLab = r.hospitalOrLab.toLowerCase().includes(q);
          const matchBio = r.extractedValues.some(v => v.testName.toLowerCase().includes(q));
          if (!matchTitle && !matchLab && !matchBio) return false;
        }

        // Category filter
        if (selectedCategory !== 'ALL' && r.category !== selectedCategory) {
          return false;
        }

        // Status filter
        if (selectedStatus === 'flagged' && !r.extractedValues.some(v => v.status !== 'normal')) {
          return false;
        }
        if (selectedStatus === 'verified' && r.extractedValues.some(v => v.status !== 'normal')) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (sortBy === 'date_asc') {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        return a.title.localeCompare(b.title);
      });
  }, [reports, searchQuery, selectedCategory, selectedStatus, sortBy]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t.reports}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Indexed clinical lab documents, blood panels, and OCR structured test records
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>{t.uploadReport}</span>
        </button>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search bar */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by test name (Glucose, Hemoglobin), report title, or lab..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500"
            />
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-teal-500"
            >
              <option value="ALL">All Categories</option>
              <option value="Hematology">Hematology</option>
              <option value="Biochemistry">Biochemistry</option>
              <option value="Lipid Panel">Lipid Panel</option>
              <option value="Thyroid">Thyroid Function</option>
              <option value="General">General Wellness</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-teal-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="flagged">Flagged Abnormal Values</option>
              <option value="verified">All Values Within Range</option>
            </select>
          </div>
        </div>

        {/* Sort & Count row */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-2xs text-slate-500">
          <span>
            Showing <strong className="text-slate-800">{filteredReports.length}</strong> of {reports.length} reports
          </span>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 font-medium">
              <ArrowUpDown className="w-3 h-3 text-slate-400" /> Sort by:
            </span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-transparent border-0 text-2xs font-semibold text-slate-700 focus:ring-0 cursor-pointer"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="title">Report Title (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports List / Table */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 mb-1">No matching reports found</h3>
          <p className="text-2xs text-slate-500 max-w-sm mx-auto mb-4">
            Try adjusting your search keywords, category filters, or upload a new medical document.
          </p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" /> Upload Report
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
          {filteredReports.map(report => {
            const abnormalCount = report.extractedValues.filter(v => v.status !== 'normal').length;
            const previewTests = report.extractedValues.slice(0, 3);

            return (
              <div
                key={report.id}
                onClick={() => setViewingReport(report)}
                className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Left: Info */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 hover:text-teal-700 truncate">
                        {report.title}
                      </h3>
                      <span className="text-2xs font-mono text-slate-400">
                        {report.id}
                      </span>
                      <span className="text-2xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        {report.category}
                      </span>
                    </div>

                    <p className="text-2xs text-slate-500 mt-1">
                      {report.hospitalOrLab} · Date: {report.date} · File: {report.fileName} ({report.fileSize})
                    </p>

                    {/* Biomarker sample tags */}
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-2xs">
                      {previewTests.map(tst => (
                        <span
                          key={tst.id}
                          className={`font-mono px-1.5 py-0.5 rounded ${
                            tst.status !== 'normal'
                              ? 'bg-rose-50 text-rose-700 font-semibold'
                              : 'bg-slate-50 text-slate-600'
                          }`}
                        >
                          {tst.testName}: {tst.value} {tst.unit}
                        </span>
                      ))}
                      {report.extractedValues.length > 3 && (
                        <span className="text-slate-400 text-3xs">
                          +{report.extractedValues.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Status & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div>
                    {abnormalCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-2xs font-semibold px-2 py-1 rounded bg-rose-50 text-rose-700">
                        <AlertTriangle className="w-3 h-3" />
                        {abnormalCount} Abnormal
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-2xs font-semibold px-2 py-1 rounded bg-emerald-50 text-emerald-700">
                        <CheckCircle2 className="w-3 h-3" />
                        Normal
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingReport(report);
                      }}
                      className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
                      title="View Report"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSharingReport(report);
                      }}
                      className="p-1.5 text-slate-500 hover:text-teal-600 rounded hover:bg-slate-100 transition-colors"
                      title="Share with Doctor"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => handleDelete(report.id, report.title, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors"
                      title="Delete Report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => loadData()}
      />

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={!!viewingReport}
        report={viewingReport}
        onClose={() => setViewingReport(null)}
        onShare={(rep) => {
          setViewingReport(null);
          setSharingReport(rep);
        }}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={!!sharingReport}
        report={sharingReport}
        connections={connections}
        onClose={() => setSharingReport(null)}
        onSuccess={() => loadData()}
      />
    </div>
  );
};
