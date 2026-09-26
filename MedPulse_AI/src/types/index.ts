export type Role = 'patient' | 'doctor';

export type LabStatus = 'normal' | 'low' | 'high' | 'critical';

export interface LabResult {
  id: string;
  testName: string;
  value: number;
  unit: string;
  referenceRange: string;
  minRange: number;
  maxRange: number;
  status: LabStatus;
  category: string;
}

export interface Report {
  id: string;
  title: string;
  category: 'Hematology' | 'Biochemistry' | 'Lipid Panel' | 'Thyroid' | 'Radiology' | 'General';
  date: string; // YYYY-MM-DD
  uploadedBy: string;
  doctorName?: string;
  hospitalOrLab: string;
  fileName: string;
  fileSize: string;
  extractedValues: LabResult[];
  status: 'verified' | 'processing' | 'flagged';
  notes?: string;
  aiSummary: string;
  isSharedWithDoctor?: boolean;
  sharedDoctorIds?: string[];
}

export type TimelineEventType = 
  | 'report_uploaded' 
  | 'test_performed' 
  | 'doctor_shared' 
  | 'doctor_note' 
  | 'abnormal_value' 
  | 'doctor_connected' 
  | 'report_shared';

export interface TimelineEvent {
  id: string;
  date: string;
  time: string;
  type: TimelineEventType;
  title: string;
  description: string;
  reportId?: string;
  doctorName?: string;
  severity?: 'normal' | 'warning' | 'alert';
}

export type AlertSeverity = 'high' | 'medium' | 'info';
export type AlertType = 
  | 'below_range' 
  | 'above_range' 
  | 'repeated_abnormal' 
  | 'significant_change' 
  | 'review_requested';

export interface Alert {
  id: string;
  patientId: string;
  reportId: string;
  sourceReportTitle: string;
  metric: string;
  value: number;
  unit: string;
  referenceRange: string;
  date: string;
  severity: AlertSeverity;
  type: AlertType;
  status: 'active' | 'reviewed';
  reviewedAt?: string;
  doctorNote?: string;
}

export interface AccessPermission {
  reports: boolean;
  timeline: boolean;
  trends: boolean;
  aiSummary: boolean;
}

export interface DoctorConnection {
  id: string;
  doctorId: string;
  patientId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorHospital: string;
  doctorAvatar?: string;
  status: 'connected' | 'pending' | 'rejected' | 'revoked';
  permissions: AccessPermission;
  connectedAt?: string;
  requestedAt: string;
  requestedBy: 'doctor' | 'patient';
}

export interface SharedReport {
  id: string;
  reportId: string;
  reportTitle: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  sharedBy: 'patient' | 'doctor';
  senderName: string;
  recipientName: string;
  sharedAt: string;
  note?: string;
  category: string;
  status: 'active' | 'revoked';
}

export interface Notification {
  id: string;
  userId: string;
  role: Role;
  title: string;
  message: string;
  date: string;
  read: boolean;
  link?: string;
  type: 
    | 'access_request' 
    | 'report_shared' 
    | 'doctor_note' 
    | 'abnormal_alert' 
    | 'processing_complete' 
    | 'connection_accepted';
}

export interface DoctorNote {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  reportId?: string;
  reportTitle?: string;
  date: string;
  time: string;
  text: string;
  category: 'general' | 'prescription' | 'followup' | 'lab_review';
  sharedWithPatient: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  relatedReportId?: string;
  relatedReportTitle?: string;
  relatedReportDate?: string;
  evidence?: string;
}

export interface PatientUser {
  id: string;
  role: 'patient';
  email: string;
  name: string;
  mobile: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  preferredLanguage: 'en' | 'hi' | 'mr';
  allergies?: string[];
  medications?: string[];
  medicalHistory?: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface DoctorUser {
  id: string;
  role: 'doctor';
  email: string;
  name: string;
  mobile: string;
  qualification: string;
  specialization: string;
  registrationNumber: string;
  hospital: string;
  preferredLanguage: 'en' | 'hi' | 'mr';
  about?: string;
}

export type User = PatientUser | DoctorUser;
