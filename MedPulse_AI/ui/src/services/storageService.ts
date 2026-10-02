import {
  User,
  Report,
  Alert,
  TimelineEvent,
  DoctorConnection,
  SharedReport,
  Notification,
  DoctorNote,
  DirectMessage
} from '../types';

const API_BASE = '/api';

// In-memory cache for synchronous reads
let cache = {
  users: [] as User[],
  reports: [] as Report[],
  alerts: [] as Alert[],
  timeline: [] as TimelineEvent[],
  connections: [] as DoctorConnection[],
  shared: [] as SharedReport[],
  notifications: [] as Notification[],
  notes: [] as DoctorNote[]
};

const deduplicateNotifications = (notifs: Notification[]): Notification[] => {
  const seenIds = new Set<string>();
  const map = new Map<string, Notification>();

  for (const n of notifs) {
    if (!n || !n.id) continue;
    if (seenIds.has(n.id)) continue;
    seenIds.add(n.id);

    const userKey = (n.userId || n.role || '').trim().toLowerCase();
    const titleKey = (n.title || '').trim().toLowerCase();
    const msgKey = (n.message || '').trim().toLowerCase();
    const dateKey = (n.date || '').trim();
    const signature = `${userKey}__${titleKey}__${msgKey}__${dateKey}`;

    if (map.has(signature)) {
      const existing = map.get(signature)!;
      if (n.read) existing.read = true;
    } else {
      map.set(signature, { ...n });
    }
  }
  return Array.from(map.values());
};

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `API Error: ${res.status}`);
  }
  return res.json();
}

export const storageService = {
  // Initialization - fetch everything into cache
  initStorage: async () => {
    try {
      const [users, reports, alerts, timeline, connections, shared, notifications, notes] = await Promise.all([
        fetchApi<User[]>('/users').catch(() => []),
        fetchApi<Report[]>('/reports').catch(() => []),
        fetchApi<Alert[]>('/alerts').catch(() => []),
        fetchApi<TimelineEvent[]>('/timeline').catch(() => []),
        fetchApi<DoctorConnection[]>('/connections').catch(() => []),
        fetchApi<SharedReport[]>('/shared').catch(() => []),
        fetchApi<Notification[]>('/notifications').catch(() => []),
        fetchApi<DoctorNote[]>('/notes').catch(() => [])
      ]);
      cache.users = users;
      cache.reports = reports;
      cache.alerts = alerts;
      cache.timeline = timeline;
      cache.connections = connections;
      cache.shared = shared;
      cache.notifications = deduplicateNotifications(notifications);
      cache.notes = notes;
    } catch (err) {
      console.error("Failed to sync with backend:", err);
    }
  },

  resetDemoData: () => {
    // No-op, managed by backend
  },

  // Auth & Users
  getUsers: (): User[] => {
    return cache.users;
  },
  
  saveUser: (user: User) => {
    fetchApi('/users', { method: 'POST', body: JSON.stringify(user) }).catch(console.error);
    const index = cache.users.findIndex(u => u.email === user.email);
    if (index >= 0) cache.users[index] = user;
    else cache.users.push(user);
  },

  getCurrentUser: (): User | null => {
    try {
      const u = sessionStorage.getItem('current_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  
  setCurrentUser: (user: User | null) => {
    if (user) {
      sessionStorage.setItem('current_user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('current_user');
    }
  },

  // Login remains async because AuthContext expects it
  login: async (email: string): Promise<User> => {
    return fetchApi<User>('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  // Reports
  getReports: (patientId?: string): Report[] => {
    if (patientId) {
      return cache.reports.filter(r => r.patientId === patientId);
    }
    const current = storageService.getCurrentUser();
    if (current?.role === 'patient') {
      return cache.reports.filter(r => r.patientId === current.id);
    }
    return cache.reports;
  },
  
  getReportById: (id: string): Report | undefined => {
    return cache.reports.find(r => r.id === id);
  },
  
  saveReport: (report: Report): Report => {
    fetchApi('/reports', { method: 'POST', body: JSON.stringify(report) }).catch(console.error);
    const index = cache.reports.findIndex(r => r.id === report.id);
    if (index >= 0) cache.reports[index] = report;
    else cache.reports.unshift(report);

    // Auto-generate notification is handled by server route POST /reports

    return report;
  },
  
  deleteReport: (id: string) => {
    fetchApi(`/reports/${id}`, { method: 'DELETE' }).catch(console.error);
    cache.reports = cache.reports.filter(r => r.id !== id);
    cache.alerts = cache.alerts.filter(a => a.reportId !== id);
    cache.timeline = cache.timeline.filter(t => t.reportId !== id);
    cache.shared = cache.shared.filter(s => s.reportId !== id);
  },

  // Alerts
  getAlerts: (patientId?: string): Alert[] => {
    if (patientId) {
      return cache.alerts.filter(a => a.patientId === patientId);
    }
    const current = storageService.getCurrentUser();
    if (current?.role === 'patient') {
      return cache.alerts.filter(a => a.patientId === current.id);
    }
    return cache.alerts;
  },
  
  addAlert: (alert: Alert) => {
    fetchApi('/alerts', { method: 'POST', body: JSON.stringify(alert) }).catch(console.error);
    cache.alerts.unshift(alert);
  },
  
  updateAlertStatus: (id: string, status: 'active' | 'reviewed', note?: string) => {
    const alert = cache.alerts.find(a => a.id === id);
    if (alert) {
      const prevStatus = alert.status;
      alert.status = status;
      if (status === 'reviewed') alert.reviewedAt = new Date().toISOString();
      if (note) alert.doctorNote = note;
      fetchApi(`/alerts/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status, doctorNote: note, reviewedAt: alert.reviewedAt })
      }).catch(console.error);

      // Auto-generate notification is handled by server route PUT /alerts/:id
    }
  },

  // Timeline
  getTimeline: (): TimelineEvent[] => cache.timeline,
  
  addTimelineEvent: (event: TimelineEvent) => {
    fetchApi('/timeline', { method: 'POST', body: JSON.stringify(event) }).catch(console.error);
    cache.timeline.unshift(event);
  },

  // Doctor Connections
  getConnections: (): DoctorConnection[] => cache.connections,
  
  updateConnectionStatus: (id: string, status: DoctorConnection['status'], permissions?: any) => {
    const conn = cache.connections.find(c => c.id === id);
    if (conn) {
      const prevStatus = conn.status;
      conn.status = status;
      if (status === 'connected') conn.connectedAt = new Date().toISOString();
      if (permissions) conn.permissions = permissions;
      
      const body: any = { status };
      if (status === 'connected') body.connectedAt = conn.connectedAt;
      if (permissions) body.permissions = permissions;
      fetchApi(`/connections/${id}`, { method: 'PUT', body: JSON.stringify(body) }).catch(console.error);

      // Auto-generate notification is handled by server route PUT /connections/:id
    }
  },
  
  requestDoctorConnection: (doc: { doctorId: string; doctorName: string; doctorSpecialty: string; doctorHospital: string; requestedBy: 'patient' | 'doctor'; patientId?: string }) => {
    const newConn: DoctorConnection = {
      id: `CONN-${Date.now()}`,
      doctorId: doc.doctorId,
      patientId: doc.patientId || '',
      doctorName: doc.doctorName,
      doctorSpecialty: doc.doctorSpecialty,
      doctorHospital: doc.doctorHospital,
      status: 'pending',
      permissions: { reports: true, timeline: true, trends: true, aiSummary: true },
      requestedAt: new Date().toISOString(),
      requestedBy: doc.requestedBy
    };
    cache.connections.unshift(newConn);
    fetchApi('/connections', { method: 'POST', body: JSON.stringify(newConn) }).catch(console.error);

    // Auto-generate notification is handled by server route POST /connections

    return newConn;
  },

  // Shared Reports
  getSharedReports: (): SharedReport[] => {
    const current = storageService.getCurrentUser();
    if (current?.role === 'patient') {
      return cache.shared.filter(s => s.patientId === current.id);
    }
    return cache.shared;
  },
  
  shareReport: (shared: Omit<SharedReport, 'id' | 'sharedAt' | 'status'>) => {
    const newShare: SharedReport = {
      ...shared,
      id: `SHR-${Date.now()}`,
      sharedAt: new Date().toISOString(),
      status: 'active'
    };
    cache.shared.unshift(newShare);
    fetchApi('/shared', { method: 'POST', body: JSON.stringify(newShare) }).catch(console.error);

    // Auto-generate notification is handled by server route POST /shared
  },

  // Notifications
  getNotifications: (userId: string, role?: string): Notification[] => {
    const list = cache.notifications.filter(n => {
      if (n.userId && userId && n.userId.toLowerCase() === userId.toLowerCase()) return true;
      if (role && n.role === role) {
        if (!n.userId) return true;
        if (userId && n.userId.toLowerCase() === userId.toLowerCase()) return true;
      }
      return false;
    });
    return deduplicateNotifications(list);
  },

  syncNotifications: async (): Promise<Notification[]> => {
    try {
      const notifs = await fetchApi<Notification[]>('/notifications');
      if (Array.isArray(notifs)) {
        cache.notifications = deduplicateNotifications(notifs);
      }
      return cache.notifications;
    } catch (err) {
      return cache.notifications;
    }
  },
  
  addNotification: (notif: Notification) => {
    const notifKey = `${(notif.userId || notif.role || '').toLowerCase()}__${(notif.title || '').toLowerCase()}__${(notif.message || '').toLowerCase()}__${(notif.date || '').toLowerCase()}`;
    const exists = cache.notifications.some(n => 
      n.id === notif.id || 
      `${(n.userId || n.role || '').toLowerCase()}__${(n.title || '').toLowerCase()}__${(n.message || '').toLowerCase()}__${(n.date || '').toLowerCase()}` === notifKey
    );
    if (!exists) {
      cache.notifications.unshift(notif);
      fetchApi('/notifications', { method: 'POST', body: JSON.stringify(notif) }).catch(console.error);
    }
  },
  
  markNotificationRead: (id: string) => {
    const n = cache.notifications.find(x => x.id === id);
    if (n) {
      n.read = true;
      fetchApi(`/notifications/${id}/read`, { method: 'PUT' }).catch(console.error);
    }
  },
  
  markAllNotificationsRead: (userIdOrRole: string) => {
    cache.notifications.forEach(n => {
      if (
        (n.userId && n.userId.toLowerCase() === userIdOrRole.toLowerCase()) ||
        (n.role && n.role.toLowerCase() === userIdOrRole.toLowerCase())
      ) {
        n.read = true;
      }
    });
    fetchApi(`/notifications/read-all`, {
      method: 'PUT',
      body: JSON.stringify({ userId: userIdOrRole, role: userIdOrRole })
    }).catch(console.error);
  },
  
  deleteNotification: (id: string) => {
    cache.notifications = cache.notifications.filter(n => n.id !== id);
    fetchApi(`/notifications/${id}`, { method: 'DELETE' }).catch(console.error);
  },

  clearAllNotifications: (userIdOrRole: string) => {
    cache.notifications = cache.notifications.filter(n => 
      !(
        (n.userId && n.userId.toLowerCase() === userIdOrRole.toLowerCase()) ||
        (n.role && n.role.toLowerCase() === userIdOrRole.toLowerCase())
      )
    );
    fetchApi(`/notifications?userId=${encodeURIComponent(userIdOrRole)}`, { method: 'DELETE' }).catch(console.error);
  },

  // Doctor Notes
  getDoctorNotes: (patientId?: string): DoctorNote[] => {
    if (patientId) return cache.notes.filter(n => n.patientId === patientId);
    return cache.notes;
  },

  addDoctorNote: (note: Omit<DoctorNote, 'id' | 'date' | 'time'>) => {
    const newNote: DoctorNote = {
      ...note,
      id: `NOTE-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString()
    };
    cache.notes.unshift(newNote);
    fetchApi('/notes', { method: 'POST', body: JSON.stringify(newNote) }).catch(console.error);

    // Auto-generate notification is handled by server route POST /notes
  },

  // Direct Patient-Doctor Messages
  getDirectMessages: async (patientId?: string, doctorId?: string): Promise<DirectMessage[]> => {
    try {
      const params = new URLSearchParams();
      if (patientId) params.append('patientId', patientId);
      if (doctorId) params.append('doctorId', doctorId);
      const url = `/messages${params.toString() ? `?${params.toString()}` : ''}`;
      return await fetchApi<DirectMessage[]>(url);
    } catch (err) {
      console.error('Failed to get direct messages:', err);
      return [];
    }
  },

  sendDirectMessage: async (msg: Omit<DirectMessage, 'id' | 'timestamp' | 'read' | 'createdAt'>): Promise<DirectMessage> => {
    const newMsg: DirectMessage = {
      ...msg,
      id: `MSG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      createdAt: new Date().toISOString()
    };
    return await fetchApi<DirectMessage>('/messages', {
      method: 'POST',
      body: JSON.stringify(newMsg)
    });
  },

  markMessagesRead: async (patientId: string, doctorId: string, readerId: string): Promise<void> => {
    try {
      await fetchApi('/messages/read', {
        method: 'PUT',
        body: JSON.stringify({ patientId, doctorId, readerId })
      });
    } catch (err) {
      console.error('Failed to mark messages read:', err);
    }
  },

  // AI Chat History
  getChatHistory: (): any[] => {
    try {
      const data = sessionStorage.getItem('ai_chat_history');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  saveChatMessage: (msg: any) => {
    try {
      const history = storageService.getChatHistory();
      history.push(msg);
      sessionStorage.setItem('ai_chat_history', JSON.stringify(history));
    } catch (e) {
      console.error(e);
    }
  },
  clearChatHistory: () => {
    sessionStorage.removeItem('ai_chat_history');
  },

  // Language - Keep local for now
  getLanguage: (): any => {
    return (localStorage.getItem('language') as any) || 'en';
  },
  setLanguage: (lang: string) => {
    localStorage.setItem('language', lang);
  }
};
