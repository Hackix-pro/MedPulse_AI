import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  Eye, 
  ShieldCheck, 
  ArrowUpDown 
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { DoctorConnection, Report, Alert } from '../../types';
import { AccessRequestModal } from '../../components/modals/AccessRequestModal';

export const DoctorPatients: React.FC = () => {
  const navigate = useNavigate();
  const [connections, setConnections] = useState<DoctorConnection[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'connected' | 'pending'>('ALL');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const loadData = () => {
    setConnections(storageService.getConnections());
    setReports(storageService.getReports());
    setAlerts(storageService.getAlerts());
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredPatients = useMemo(() => {
    return connections.filter(conn => {
      if (statusFilter !== 'ALL' && conn.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = conn.patientId.toLowerCase().includes(q);
        if (!matchId) return false;
      }
      return true;
    });
  }, [connections, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Patient Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Authorized patient roster with consent-based record review privileges
          </p>
        </div>

        <button
          onClick={() => setIsRequestModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Request Patient Access
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by patient name or ID..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-teal-500"
          >
            <option value="ALL">All Patients</option>
            <option value="connected">Active Authorization</option>
            <option value="pending">Pending Requests</option>
          </select>
        </div>
      </div>

      {/* Patient Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.map(conn => {
          const isConnected = conn.status === 'connected';
          const patientAlerts = alerts.filter(a => a.status === 'active');
          const latestReport = reports[0];

          return (
            <div
              key={conn.id}
              onClick={() => {
                if (isConnected) navigate(`/doctor/patients/${conn.patientId}`);
              }}
              className={`bg-white p-5 rounded-2xl border transition-all ${
                isConnected
                  ? 'border-slate-200 hover:border-teal-400 hover:shadow-xs cursor-pointer'
                  : 'border-amber-200/80 bg-amber-50/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    A
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Patient {conn.patientId}</h3>
                    <span className="text-2xs font-mono font-semibold text-slate-500 block">
                      {conn.patientId}
                    </span>
                    <span className="text-3xs text-slate-400">View Profile Details</span>
                  </div>
                </div>

                <span className={`text-3xs font-semibold px-2 py-0.5 rounded uppercase font-mono ${
                  isConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-100 text-amber-800'
                }`}>
                  {conn.status}
                </span>
              </div>

              {/* Status details */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Active Biomarker Alerts:</span>
                  {patientAlerts.length > 0 ? (
                    <span className="font-bold text-rose-600 flex items-center gap-1 font-mono">
                      <AlertTriangle className="w-3 h-3" /> {patientAlerts.length} Flags
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-medium">None</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Latest Diagnostic Test:</span>
                  <span className="font-mono text-slate-800 truncate max-w-[140px]">
                    {latestReport?.title || 'None'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Last Test Date:</span>
                  <span className="font-mono text-slate-700">{latestReport?.date || '—'}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                {isConnected ? (
                  <span className="text-xs font-semibold text-teal-700 inline-flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> Open Clinical Chart →
                  </span>
                ) : (
                  <span className="text-2xs font-medium text-amber-700">
                    Awaiting Patient Acceptance
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AccessRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={() => loadData()}
      />
    </div>
  );
};
