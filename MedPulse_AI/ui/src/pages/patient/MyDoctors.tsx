import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Check, 
  X, 
  Shield, 
  UserPlus, 
  Search, 
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { DoctorConnection, AccessPermission } from '../../types';
import { useToast } from '../../components/common/Toast';
import { useAuth } from '../../context/AuthContext';

const DOCTOR_DIRECTORY = [
  { id: 'DOC-10294', name: 'Dr. Ananya Mehta', specialty: 'Internal Medicine & Endocrinology', hospital: 'MetroCare Superspeciality Hospital' },
  { id: 'DOC-50119', name: 'Dr. Rajesh Deshmukh', specialty: 'Cardiology', hospital: 'Lilavati Hospital & Research Centre' },
  { id: 'DOC-77201', name: 'Dr. Priya Varma', specialty: 'Pathology & Lab Medicine', hospital: 'Apollo Reference Laboratories' },
  { id: 'DOC-99412', name: 'Dr. Sunil Kulkarni', specialty: 'Diabetology & Metabolic Health', hospital: 'Hinduja Healthcare Surgical' }
];

export const MyDoctors: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [connections, setConnections] = useState<DoctorConnection[]>([]);
  const [searchDocQuery, setSearchDocQuery] = useState('');

  const loadData = () => {
    setConnections(storageService.getConnections());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAccept = (connId: string) => {
    storageService.updateConnectionStatus(connId, 'connected');
    showToast('Doctor access request approved.', 'success');
    loadData();
  };

  const handleReject = (connId: string) => {
    storageService.updateConnectionStatus(connId, 'rejected');
    showToast('Doctor access request rejected.', 'info');
    loadData();
  };

  const handleRevoke = (connId: string, doctorName: string) => {
    if (confirm(`Revoke all health record access permissions for ${doctorName}?`)) {
      storageService.updateConnectionStatus(connId, 'revoked');
      showToast(`Access revoked for ${doctorName}.`, 'info');
      loadData();
    }
  };

  const handleTogglePermission = (conn: DoctorConnection, key: keyof AccessPermission) => {
    const updated = { ...conn.permissions, [key]: !conn.permissions[key] };
    storageService.updateConnectionStatus(conn.id, conn.status, updated);
    showToast(`Permissions updated for ${conn.doctorName}.`, 'success');
    loadData();
  };

  const handleConnectNew = (doc: typeof DOCTOR_DIRECTORY[0]) => {
    const exists = connections.some(c => c.doctorId === doc.id && (c.status === 'connected' || c.status === 'pending'));
    if (exists) {
      showToast(`A connection or request already exists for ${doc.name}.`, 'info');
      return;
    }

    storageService.requestDoctorConnection({
      doctorId: doc.id,
      doctorName: doc.name,
      doctorSpecialty: doc.specialty,
      doctorHospital: doc.hospital,
      requestedBy: 'patient',
      patientId: user?.id || 'PID-65374'
    });

    showToast(`Access request dispatched to ${doc.name}.`, 'success');
    loadData();
  };

  const pendingRequests = connections.filter(c => c.status === 'pending');
  const connectedDoctors = connections.filter(c => c.status === 'connected');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Connected Healthcare Providers</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage physician access permissions, review connection requests, and control clinical data sharing
        </p>
      </div>

      {/* Pending Access Requests Banner */}
      {pendingRequests.length > 0 && (
        <div className="p-5 bg-teal-50/60 border border-teal-200 rounded-2xl space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-teal-700" />
            <h2 className="text-sm font-bold text-teal-950">
              Pending Doctor Access Requests ({pendingRequests.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingRequests.map(req => (
              <div key={req.id} className="p-4 bg-white rounded-xl border border-teal-200/80 shadow-2xs">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{req.doctorName}</h3>
                    <p className="text-2xs text-slate-500">{req.doctorSpecialty}</p>
                    <p className="text-3xs text-slate-400 font-mono mt-0.5">{req.doctorHospital}</p>
                  </div>
                  <span className="text-3xs text-teal-800 bg-teal-100 px-2 py-0.5 rounded font-mono">
                    Req: {req.requestedAt}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleReject(req.id)}
                    className="px-2.5 py-1 text-2xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleAccept(req.id)}
                    className="inline-flex items-center gap-1 px-3 py-1 text-2xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md shadow-2xs transition-colors"
                  >
                    <Check className="w-3 h-3" /> Grant Access
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Connected Doctors */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-teal-600" />
          Active Physician Connections ({connectedDoctors.length})
        </h2>

        {connectedDoctors.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
            <Stethoscope className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p>No active doctor connections.</p>
            <p className="text-2xs text-slate-500 mt-1">Connect with a verified practitioner below to share diagnostic records.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connectedDoctors.map(doc => (
              <div key={doc.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {doc.doctorName.charAt(4) || 'D'}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{doc.doctorName}</h3>
                      <p className="text-xs text-teal-700 font-medium">{doc.doctorSpecialty}</p>
                      <p className="text-2xs text-slate-500 font-mono mt-0.5">{doc.doctorHospital}</p>
                      <span className="text-3xs text-slate-400 font-mono block mt-1">
                        Connected on {doc.connectedAt || 'Recently'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevoke(doc.id, doc.doctorName)}
                    className="px-2.5 py-1 text-2xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                  >
                    Revoke
                  </button>
                </div>

                {/* Granular Permission Toggles */}
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-2xs font-bold uppercase text-slate-400 tracking-wider block mb-2">
                    Authorized Scope of Health Records
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-2xs">
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={doc.permissions.reports}
                        onChange={() => handleTogglePermission(doc, 'reports')}
                        className="rounded text-teal-600"
                      />
                      <span className="font-medium text-slate-800">Lab Reports</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={doc.permissions.timeline}
                        onChange={() => handleTogglePermission(doc, 'timeline')}
                        className="rounded text-teal-600"
                      />
                      <span className="font-medium text-slate-800">Timeline Events</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={doc.permissions.trends}
                        onChange={() => handleTogglePermission(doc, 'trends')}
                        className="rounded text-teal-600"
                      />
                      <span className="font-medium text-slate-800">Biomarker Trends</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={doc.permissions.aiSummary}
                        onChange={() => handleTogglePermission(doc, 'aiSummary')}
                        className="rounded text-teal-600"
                      />
                      <span className="font-medium text-slate-800">AI Clinical Summary</span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Directory to Connect New Practitioner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Hospital & Clinic Directory</h2>
            <p className="text-2xs text-slate-500">
              Find practitioners in your network to securely grant medical record review privileges
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2 text-slate-400" />
            <input
              type="text"
              value={searchDocQuery}
              onChange={e => setSearchDocQuery(e.target.value)}
              placeholder="Search by doctor or hospital..."
              className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-teal-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {DOCTOR_DIRECTORY.filter(d => 
            !searchDocQuery || d.name.toLowerCase().includes(searchDocQuery.toLowerCase()) || d.specialty.toLowerCase().includes(searchDocQuery.toLowerCase())
          ).map(doc => {
            const isConn = connections.some(c => c.doctorId === doc.id && c.status === 'connected');
            const isPending = connections.some(c => c.doctorId === doc.id && c.status === 'pending');

            return (
              <div key={doc.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between text-xs">
                <div>
                  <h4 className="font-bold text-slate-900">{doc.name}</h4>
                  <p className="text-2xs text-teal-700 font-medium">{doc.specialty}</p>
                  <p className="text-3xs text-slate-500 font-mono mt-0.5">{doc.hospital}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60">
                  {isConn ? (
                    <span className="text-2xs text-emerald-700 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Connected
                    </span>
                  ) : isPending ? (
                    <span className="text-2xs text-amber-700 font-semibold">
                      Request Pending
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConnectNew(doc)}
                      className="w-full py-1.5 px-2 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-400 text-slate-800 hover:text-teal-800 rounded-lg text-2xs font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      <UserPlus className="w-3 h-3" /> Connect Doctor
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
