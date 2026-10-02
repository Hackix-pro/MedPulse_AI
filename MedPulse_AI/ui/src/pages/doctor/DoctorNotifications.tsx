import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Check, 
  Trash2, 
  CheckCheck, 
  FileText, 
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Stethoscope,
  ExternalLink,
  RefreshCw,
  Eye
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { Notification } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';

export const DoctorNotifications: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'reports' | 'requests' | 'alerts'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    if (user) {
      await storageService.syncNotifications();
      setNotifications(storageService.getNotifications(user.id, 'doctor'));
    }
  };

  useEffect(() => {
    loadData();
    // Real-time polling every 2.5 seconds
    const interval = setInterval(loadData, 2500);
    return () => clearInterval(interval);
  }, [user]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setTimeout(() => setIsRefreshing(false), 400);
    showToast('Notifications refreshed.', 'info');
  };

  const handleMarkRead = (id: string) => {
    storageService.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = () => {
    if (user) {
      storageService.markAllNotificationsRead('doctor');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      showToast('All clinical notifications marked as read.', 'success');
    }
  };

  const handleDelete = (id: string) => {
    storageService.deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    showToast('Notification deleted.', 'info');
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all your clinical notifications?')) {
      if (user) {
        storageService.clearAllNotifications('doctor');
        setNotifications([]);
        showToast('All notifications cleared.', 'info');
      }
    }
  };

  const handleActionClick = (n: Notification) => {
    handleMarkRead(n.id);
    if (n.link) {
      navigate(n.link);
    } else if (n.type === 'access_request') {
      navigate('/doctor/requests');
    } else if (n.type === 'connection_accepted' || n.type === 'report_shared') {
      navigate('/doctor/patients');
    } else if (n.type === 'abnormal_alert') {
      navigate('/doctor/alerts');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (filterType === 'unread') return !n.read;
      if (filterType === 'reports') return n.type === 'report_shared';
      if (filterType === 'requests') return n.type === 'access_request' || n.type === 'connection_accepted';
      if (filterType === 'alerts') return n.type === 'abnormal_alert' || n.type === 'doctor_note';
      return true;
    });
  }, [notifications, filterType]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'report_shared':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'access_request':
        return <ShieldCheck className="w-4 h-4 text-purple-600" />;
      case 'connection_accepted':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'abnormal_alert':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'doctor_note':
        return <Stethoscope className="w-4 h-4 text-teal-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  const getNotificationBadge = (type: Notification['type']) => {
    switch (type) {
      case 'report_shared':
        return <span className="text-3xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 uppercase font-mono">Patient Report</span>;
      case 'access_request':
        return <span className="text-3xs font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 uppercase font-mono">Access Request</span>;
      case 'connection_accepted':
        return <span className="text-3xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 uppercase font-mono">Access Granted</span>;
      case 'abnormal_alert':
        return <span className="text-3xs font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 uppercase font-mono">Biomarker Alert</span>;
      case 'doctor_note':
        return <span className="text-3xs font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700 uppercase font-mono">Clinical Note</span>;
      default:
        return <span className="text-3xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase font-mono">System</span>;
    }
  };

  const getActionButtonText = (n: Notification) => {
    switch (n.type) {
      case 'report_shared':
        return 'Review Patient Report';
      case 'access_request':
        return 'Review Authorization Request';
      case 'connection_accepted':
        return 'Open Patient Chart';
      case 'abnormal_alert':
        return 'Review Biomarker Alert';
      case 'doctor_note':
        return 'View Patient Notes';
      default:
        return 'Open Details';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Alerts & Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-2xs font-bold font-mono">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Notifications from connected patients, newly shared test panels, authorization requests, and biomarker alerts
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            title="Refresh clinical notifications"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-semibold transition-colors"
            >
              <CheckCheck className="w-4 h-4 text-teal-600" />
              <span>Mark All as Read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { key: 'all', label: `All Alerts (${notifications.length})` },
          { key: 'unread', label: `Unread (${unreadCount})` },
          { key: 'reports', label: `Shared Reports (${notifications.filter(n => n.type === 'report_shared').length})` },
          { key: 'requests', label: `Patient Requests (${notifications.filter(n => n.type === 'access_request' || n.type === 'connection_accepted').length})` },
          { key: 'alerts', label: `Lab Alerts (${notifications.filter(n => n.type === 'abnormal_alert' || n.type === 'doctor_note').length})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterType(tab.key as any)}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              filterType === tab.key
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-800">No clinical notifications in this view</p>
            <p className="text-2xs text-slate-500 mt-0.5">
              {filterType === 'all'
                ? 'Your workstation is up to date. When patients send reports or authorization requests, they will show here.'
                : 'No notifications matching the selected filter.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map(n => (
            <div
              key={n.id}
              className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                !n.read ? 'bg-teal-50/30' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  n.type === 'abnormal_alert'
                    ? 'bg-rose-100'
                    : n.type === 'doctor_note'
                    ? 'bg-teal-100'
                    : n.type === 'report_shared'
                    ? 'bg-blue-100'
                    : n.type === 'connection_accepted'
                    ? 'bg-emerald-100'
                    : 'bg-purple-100'
                }`}>
                  {getNotificationIcon(n.type)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`text-sm font-bold ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>
                      {n.title}
                    </h3>
                    {getNotificationBadge(n.type)}
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-teal-600 inline-block" title="Unread" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600">{n.message}</p>
                  <span className="text-3xs text-slate-400 font-mono block">{n.date}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  onClick={() => handleActionClick(n)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                >
                  <span>{getActionButtonText(n)}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>

                {!n.read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => handleDelete(n.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Delete notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

