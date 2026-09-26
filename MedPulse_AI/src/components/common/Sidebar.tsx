import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Clock,
  TrendingUp,
  GitCompare,
  Bot,
  AlertTriangle,
  Users,
  Share2,
  Bell,
  User,
  Settings,
  Shield,
  Stethoscope
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { role, t, user } = useAuth();

  const patientLinks = [
    { to: '/patient/dashboard', label: t.dashboard, icon: LayoutDashboard },
    { to: '/patient/reports', label: t.reports, icon: FileText },
    { to: '/patient/timeline', label: t.timeline, icon: Clock },
    { to: '/patient/trends', label: t.trends, icon: TrendingUp },
    { to: '/patient/compare', label: t.compare, icon: GitCompare },
    { to: '/patient/assistant', label: t.aiAssistant, icon: Bot },
    { to: '/patient/alerts', label: t.alerts, icon: AlertTriangle },
    { to: '/patient/doctors', label: t.doctors, icon: Stethoscope },
    { to: '/patient/shared', label: t.sharedReports, icon: Share2 },
    { to: '/patient/notifications', label: t.notifications, icon: Bell },
    { to: '/patient/profile', label: t.profile, icon: User },
    { to: '/patient/settings', label: t.settings, icon: Settings },
  ];

  const doctorLinks = [
    { to: '/doctor/dashboard', label: t.dashboard, icon: LayoutDashboard },
    { to: '/doctor/patients', label: t.patients, icon: Users },
    { to: '/doctor/requests', label: t.patientRequests, icon: Shield },
    { to: '/doctor/alerts', label: t.clinicalReview, icon: AlertTriangle },
    { to: '/doctor/notifications', label: t.notifications, icon: Bell },
    { to: '/doctor/profile', label: t.profile, icon: User },
    { to: '/doctor/settings', label: t.settings, icon: Settings },
  ];

  const links = role === 'doctor' ? doctorLinks : patientLinks;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 md:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-30 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Area */}
        <div className="h-14 flex items-center justify-between px-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-teal-500 flex items-center justify-center text-slate-950 font-bold text-xs">
              M+
            </div>
            <span className="font-semibold tracking-tight text-white text-sm">
              MedPulse <span className="text-teal-400 font-normal">AI</span>
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white md:hidden text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          <div className="px-3 pb-2 text-2xs uppercase tracking-wider text-slate-500 font-medium">
            {role === 'doctor' ? 'Clinical Navigation' : 'Patient Health Vault'}
          </div>

          {links.map(link => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-600/15 text-teal-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Identity Box */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5 p-2 rounded-md bg-slate-900/80 border border-slate-800">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200 shrink-0">
              {user?.name.charAt(0) || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white truncate">{user?.name}</p>
              <p className="text-2xs text-slate-400 truncate font-mono">
                {user ? ('registrationNumber' in user ? user.specialization : user.id) : ''}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
