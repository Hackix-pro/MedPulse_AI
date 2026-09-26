import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, CheckCheck, FileText, AlertTriangle } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { Notification } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';

export const DoctorNotifications: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadData = () => {
    if (user) {
      setNotifications(storageService.getNotifications(user.id, 'doctor'));
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleMarkRead = (id: string) => {
    storageService.markNotificationRead(id);
    loadData();
  };

  const handleMarkAllRead = () => {
    storageService.markAllNotificationsRead('doctor');
    showToast('All notifications marked as read.', 'success');
    loadData();
  };

  const handleDelete = (id: string) => {
    storageService.deleteNotification(id);
    loadData();
  };

  const handleNotificationClick = (n: Notification) => {
    handleMarkRead(n.id);
    if (n.link) {
      navigate(n.link);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Alerts & Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-2xs font-bold font-mono">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Notifications from connected patients, newly shared test panels, and critical lab alert triggers
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold self-start sm:self-auto transition-colors"
          >
            <CheckCheck className="w-4 h-4 text-teal-600" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-800">No clinical notifications</p>
            <p className="text-2xs text-slate-500 mt-0.5">Your workstation is up to date.</p>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                !n.read ? 'bg-teal-50/20' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  n.type === 'abnormal_alert' ? 'bg-rose-100 text-rose-700' : 'bg-teal-100 text-teal-700'
                }`}>
                  {n.type === 'abnormal_alert' ? <AlertTriangle className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-xs sm:text-sm font-bold ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>
                      {n.title}
                    </h3>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-teal-600 inline-block" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                  <span className="text-3xs text-slate-400 font-mono block mt-1.5">{n.date}</span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(n.id);
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
