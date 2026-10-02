import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Globe, 
  LogOut, 
  User as UserIcon, 
  ShieldCheck, 
  Menu, 
  Check, 
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { Notification } from '../../types';
import { LanguageCode } from '../../services/i18n';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, role, logout, language, setLanguage, t } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Sync notifications
  const reloadNotifs = async () => {
    if (user && role) {
      await storageService.syncNotifications();
      setNotifications(storageService.getNotifications(user.id, role));
    }
  };

  useEffect(() => {
    reloadNotifs();
    const interval = setInterval(reloadNotifs, 2500);
    return () => clearInterval(interval);
  }, [user, role]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    if (role) {
      storageService.markAllNotificationsRead(role);
      reloadNotifs();
    }
  };

  const handleNotificationClick = (n: Notification) => {
    storageService.markNotificationRead(n.id);
    reloadNotifs();
    setShowNotifications(false);
    if (n.link) {
      navigate(n.link);
    } else if (n.type === 'access_request' || n.type === 'connection_accepted') {
      navigate(role === 'doctor' ? '/doctor/requests' : '/patient/doctors');
    } else if (n.type === 'report_shared') {
      navigate(role === 'doctor' ? '/doctor/patients' : '/patient/shared');
    } else if (n.type === 'abnormal_alert') {
      navigate(role === 'doctor' ? '/doctor/alerts' : '/patient/alerts');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="flex items-center justify-between h-14 px-4 sm:px-6">
        {/* Zone 1: Mobile toggle & Wordmark */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md md:hidden hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <Link
            to={role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'}
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:bg-teal-700 transition-colors">
              M+
            </div>
            <span className="text-base font-semibold tracking-tight text-slate-900">
              MedPulse <span className="text-teal-600 font-normal">AI</span>
            </span>
          </Link>
          <span className="hidden sm:inline-flex text-xs text-slate-400 font-mono">
            {role === 'doctor' ? 'Clinical Portal' : 'Health Portal'}
          </span>
        </div>

        {/* Zone 2: Contextual Trust Marker */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>Patient-Consent Protected Health Vault</span>
          <span className="text-slate-300">·</span>
          <span>Prototype v1.0</span>
        </div>

        {/* Zone 3: Actions & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors"
              title="Change language"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="uppercase font-medium text-2xs">{language}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-1.5 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 text-xs">
                {(['en', 'hi', 'mr'] as LanguageCode[]).map(langCode => (
                  <button
                    key={langCode}
                    onClick={() => {
                      setLanguage(langCode);
                      setShowLangMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-50 ${
                      language === langCode ? 'text-teal-600 font-semibold bg-teal-50/50' : 'text-slate-700'
                    }`}
                  >
                    <span>
                      {langCode === 'en' && 'English'}
                      {langCode === 'hi' && 'हिन्दी (Hindi)'}
                      {langCode === 'mr' && 'मराठी (Marathi)'}
                    </span>
                    {language === langCode && <Check className="w-3.5 h-3.5 text-teal-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors"
              title={t.notifications}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-1.5 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden text-xs">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{t.notifications}</span>
                    {unreadCount > 0 && (
                      <span className="text-2xs text-rose-600 font-mono">
                        ({unreadCount} new)
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-2xs text-teal-600 hover:text-teal-700 font-medium"
                    >
                      {t.markAllRead}
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3.5 cursor-pointer hover:bg-slate-50 transition-colors ${
                          !n.read ? 'bg-teal-50/30' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className={`font-medium ${!n.read ? 'text-slate-900' : 'text-slate-600'}`}>
                            {n.title}
                          </p>
                          <span className="text-2xs text-slate-400 whitespace-nowrap">{n.date}</span>
                        </div>
                        <p className="text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-slate-100 bg-slate-50/50 text-center">
                  <Link
                    to={role === 'doctor' ? '/doctor/notifications' : '/patient/notifications'}
                    onClick={() => setShowNotifications(false)}
                    className="text-2xs text-teal-600 hover:text-teal-700 font-medium inline-flex items-center gap-1"
                  >
                    View All Notification History <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-md hover:bg-slate-100 transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-semibold">
                {user?.name.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-medium text-slate-900 leading-none truncate max-w-[120px]">
                  {user?.name || 'User'}
                </p>
                <p className="text-2xs text-slate-500 capitalize mt-0.5 leading-none">
                  {role}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 text-xs">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="font-semibold text-slate-900 truncate">{user?.name}</p>
                  <p className="text-2xs text-slate-500 truncate">{user?.email}</p>
                </div>

                <Link
                  to={role === 'doctor' ? '/doctor/profile' : '/patient/profile'}
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.profile}</span>
                </Link>

                <Link
                  to={role === 'doctor' ? '/doctor/settings' : '/patient/settings'}
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50"
                >
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.settings}</span>
                </Link>

                <div className="border-t border-slate-100 my-1"></div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t.logout}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
