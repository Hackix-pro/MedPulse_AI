import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Check, Clock, X, User } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { DoctorConnection } from '../../types';
import { AccessRequestModal } from '../../components/modals/AccessRequestModal';

export const DoctorRequests: React.FC = () => {
  const [connections, setConnections] = useState<DoctorConnection[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = () => {
    setConnections(storageService.getConnections());
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Patient Access Requests</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit log of clinical authorization requests dispatched to patients for health records review
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Request New Patient Access
        </button>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 text-2xs uppercase">
              <tr>
                <th className="py-3 px-4 font-semibold">Patient Name & ID</th>
                <th className="py-3 px-4 font-semibold">Request Initiated</th>
                <th className="py-3 px-4 font-semibold">Granted Scopes</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 text-right font-semibold">Connected Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {connections.map(conn => {
                const isConn = conn.status === 'connected';
                const isPending = conn.status === 'pending';

                return (
                  <tr key={conn.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                          A
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">Aarav Sharma</span>
                          <span className="text-3xs text-slate-500 font-mono">{conn.patientId}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {conn.requestedAt}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-3xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        Reports · Timeline · Trends · AI
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 text-2xs font-semibold px-2 py-0.5 rounded uppercase ${
                        isConn
                          ? 'bg-emerald-50 text-emerald-700'
                          : isPending
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {isConn && <Check className="w-3 h-3" />}
                        {isPending && <Clock className="w-3 h-3" />}
                        {conn.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                      {conn.connectedAt || 'Pending Consent'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AccessRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => loadData()}
      />
    </div>
  );
};
