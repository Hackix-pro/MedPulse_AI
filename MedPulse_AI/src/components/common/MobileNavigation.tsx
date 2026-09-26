import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, TrendingUp, Bot, AlertTriangle, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const MobileNavigation: React.FC = () => {
  const { role } = useAuth();

  const patientTabs = [
    { to: '/patient/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/patient/reports', label: 'Reports', icon: FileText },
    { to: '/patient/trends', label: 'Trends', icon: TrendingUp },
    { to: '/patient/assistant', label: 'Ask AI', icon: Bot },
    { to: '/patient/alerts', label: 'Alerts', icon: AlertTriangle },
  ];

  const doctorTabs = [
    { to: '/doctor/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/doctor/patients', label: 'Patients', icon: Users },
    { to: '/doctor/alerts', label: 'Review', icon: AlertTriangle },
  ];

  const tabs = role === 'doctor' ? doctorTabs : patientTabs;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-3 shadow-lg">
      <div className="flex items-center justify-around">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2.5 rounded-md text-2xs transition-colors ${
                  isActive
                    ? 'text-teal-600 font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`
              }
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
