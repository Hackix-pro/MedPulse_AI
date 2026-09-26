import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowRight, 
  Search, 
  Plus, 
  Eye, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { Report, Alert, DoctorConnection, User } from '../../types';
import { AccessRequestModal } from '../../components/modals/AccessRequestModal';

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [reports, setReports] = useState<Report[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [connections, setConnections] = useState<DoctorConnection[]>([]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const loadData = () => {
    setReports(storageService.getReports());
    setAlerts(storageService.getAlerts());
    setConnections(storageService.getConnections());
  };

  useEffect(() => {
    loadData();
  }, []);

  const connectedPatients = connections.filter(c => c.status === 'connected');
  const activeAlerts = alerts.filter(a => a.status === 'active');
  const unreviewedCount = alerts.filter(a => a.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Clinical Workstation · {user?.name}
            </h1>
            <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 text-2xs font-mono font-semibold border border-teal-200/60">
              {user && 'registrationNumber' in user ? user.registrationNumber : 'MCI-MD'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {user && 'specialization' in user ? user.specialization : 'Internal Medicine'} · {user && 'hospital' in user ? user.hospital : 'MetroCare Hospital'}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Request Patient Access</span>
          </button>

          <button
            onClick={() => navigate('/doctor/alerts')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Review Alerts ({unreviewedCount})</span>
          </button>

          <button
            onClick={() => navigate('/doctor/patients')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-slate-600" />
            <span>View All Patients</span>
          </button>
        </div>
      </div>

      {/* Top Clinical Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Authorized Patients</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {connectedPatients.length}
            </span>
            <span className="text-2xs text-emerald-600 font-medium">Active Consent</span>
          </div>
          <p className="text-3xs text-slate-400 mt-2 font-mono">
            {connections.filter(c => c.status === 'pending').length} pending access request(s)
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Diagnostic Reports</span>
            <FileText className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {reports.length}
            </span>
            <span className="text-2xs text-slate-500">Indexed Lab Records</span>
          </div>
          <p className="text-3xs text-slate-400 mt-2 font-mono">
            Latest uploaded: {reports[0]?.date || 'Recent'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Pending Lab Reviews</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {unreviewedCount}
            </span>
            <span className="text-2xs text-amber-700 font-medium">Action Needed</span>
          </div>
          <p className="text-3xs text-slate-400 mt-2 font-mono">
            Flagged biomarkers requiring clinical consultation
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Active Abnormal Alerts</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-rose-600 tabular-nums">
              {activeAlerts.length}
            </span>
            <span className="text-2xs text-rose-700 font-medium">Out of Range</span>
          </div>
          <p className="text-3xs text-slate-400 mt-2 font-mono">
            Glucose, Vitamin D, Hemoglobin deviations
          </p>
        </div>
      </div>

      {/* Main Patients Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Connected Patients Directory ({connectedPatients.length})
            </h2>
            <p className="text-2xs text-slate-500">
              Patients with active consent authorization to share clinical lab reports and longitudinal timelines
            </p>
          </div>

          <button
            onClick={() => navigate('/doctor/patients')}
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 self-start sm:self-auto"
          >
            Manage Directory →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 text-2xs uppercase">
              <tr>
                <th className="py-3 px-4 font-semibold">Patient Name</th>
                <th className="py-3 px-4 font-semibold">Patient ID</th>
                <th className="py-3 px-4 font-semibold">Latest Report</th>
                <th className="py-3 px-4 font-semibold">Active Alerts</th>
                <th className="py-3 px-4 font-semibold">Last Activity</th>
                <th className="py-3 px-4 font-semibold">Granted Access</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {connectedPatients.map(conn => {
                const latestReport = reports[0];
                return (
                  <tr
                    key={conn.id}
                    onClick={() => navigate(`/doctor/patients/${conn.patientId}`)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          A
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">Aarav Sharma</span>
                          <span className="text-3xs text-slate-500 font-mono">34 Y / Male / B+</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                      {conn.patientId}
                    </td>

                    <td className="py-3.5 px-4">
                      {latestReport ? (
                        <div>
                          <span className="font-medium text-slate-900 block truncate max-w-[180px]">
                            {latestReport.title}
                          </span>
                          <span className="text-3xs text-slate-500 font-mono">{latestReport.date}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {activeAlerts.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-2xs font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700">
                          <AlertTriangle className="w-3 h-3" />
                          {activeAlerts.length} Flags
                        </span>
                      ) : (
                        <span className="text-2xs text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> All Normal
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 font-mono text-2xs">
                      {latestReport?.date || 'Recently'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-3xs px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-semibold border border-teal-200/60 font-mono">
                        Reports · Trends · AI
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/doctor/patients/${conn.patientId}`);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-2xs font-semibold shadow-2xs transition-colors"
                      >
                        <Eye className="w-3 h-3" /> Open Chart
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Access Request Modal */}
      <AccessRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={() => loadData()}
      />
    </div>
  );
};
