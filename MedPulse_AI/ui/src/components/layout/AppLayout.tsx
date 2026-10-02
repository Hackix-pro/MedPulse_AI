import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../common/Navbar';
import { Sidebar } from '../common/Sidebar';
import { MobileNavigation } from '../common/MobileNavigation';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { DoctorChatPanel } from '../chat/DoctorChatPanel';
import { MessageSquare, X } from 'lucide-react';
import { DoctorConnection } from '../../types';

export const AppLayout: React.FC = () => {
  const { role, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [connectedDoctor, setConnectedDoctor] = useState<DoctorConnection | null>(null);

  useEffect(() => {
    if (role === 'patient') {
      const updateConn = () => {
        const conns = storageService.getConnections();
        const active = conns.find(c => c.status === 'connected');
        setConnectedDoctor(active || null);
      };
      updateConn();
      const interval = setInterval(updateConn, 4000);
      return () => clearInterval(interval);
    }
  }, [role]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Patient Right-Side Panel: Doctor Consultation Chat */}
      {role === 'patient' && connectedDoctor && (
        <>
          {/* Floating Right-Side Button */}
          <button
            onClick={() => setChatDrawerOpen(prev => !prev)}
            className="fixed right-4 bottom-20 md:bottom-6 z-40 bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2.5 rounded-full shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95 border-2 border-white"
            title="Open Doctor Messages Panel"
          >
            <div className="relative">
              <MessageSquare className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
            </div>
            <span className="text-xs font-semibold">Doctor Messages</span>
          </button>

          {/* Slide-out Right-Side Drawer */}
          {chatDrawerOpen && (
            <>
              <div
                onClick={() => setChatDrawerOpen(false)}
                className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-2xs transition-opacity"
              />
              <div className="fixed top-0 right-0 z-50 h-full w-full max-w-sm sm:max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
                <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-bold">Doctor Consultation Chat</span>
                  </div>
                  <button
                    onClick={() => setChatDrawerOpen(false)}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 p-3 overflow-hidden flex flex-col">
                  <DoctorChatPanel
                    patientId={user?.id || ''}
                    patientName={user?.name || 'Patient'}
                    doctorId={connectedDoctor?.doctorId}
                    doctorName={connectedDoctor?.doctorName}
                    doctorSpecialty={connectedDoctor?.doctorSpecialty}
                    doctorHospital={connectedDoctor?.doctorHospital}
                    className="h-full border-0 shadow-none"
                    isDrawer
                    onClose={() => setChatDrawerOpen(false)}
                  />
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Mobile Navigation */}
      <MobileNavigation />
    </div>
  );
};
