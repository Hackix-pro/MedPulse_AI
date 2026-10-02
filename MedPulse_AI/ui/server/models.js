import mongoose from 'mongoose';
import { Schema } from 'mongoose';

// User Schema (Base)
const UserSchema = new Schema({
  id: { type: String, required: true, unique: true },
  role: { type: String, enum: ['patient', 'doctor'], required: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  preferredLanguage: { type: String, default: 'en' },

  // Patient Specific
  dob: String,
  gender: String,
  bloodGroup: String,
  allergies: [String],
  medications: [String],
  medicalHistory: [String],
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },

  // Doctor Specific
  qualification: String,
  specialization: String,
  registrationNumber: String,
  hospital: String,
  about: String
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

// Report Schema
const ReportSchema = new Schema({
  id: { type: String, required: true, unique: true },
  patientId: String,
  title: String,
  category: String,
  date: String,
  uploadedBy: String,
  doctorName: String,
  hospitalOrLab: String,
  fileName: String,
  fileSize: String,
  status: String,
  notes: String,
  aiSummary: String,
  isSharedWithDoctor: Boolean,
  sharedDoctorIds: [String],
  rawText: String,
  extractedValues: [{
    id: String,
    testName: String,
    value: Number,
    unit: String,
    referenceRange: String,
    minRange: Number,
    maxRange: Number,
    status: String,
    category: String
  }]
}, { timestamps: true });

const Report = mongoose.model('Report', ReportSchema);

// Alert Schema
const AlertSchema = new Schema({
  id: { type: String, required: true, unique: true },
  patientId: String,
  patientName: String,
  reportId: String,
  sourceReportTitle: String,
  metric: String,
  value: Number,
  previousValue: Number,
  previousDate: String,
  changeDescription: String,
  unit: String,
  referenceRange: String,
  date: String,
  severity: String,
  type: { type: String },
  status: { type: String, default: 'active' },
  reviewedAt: String,
  doctorNote: String,
  aiMessage: String,
  aiReasons: [String],
  aiControlMeasures: [String],
  aiDoctorSummary: String
}, { timestamps: true });

const Alert = mongoose.model('Alert', AlertSchema);

// Timeline Event Schema
const TimelineEventSchema = new Schema({
  id: { type: String, required: true, unique: true },
  date: String,
  time: String,
  type: { type: String },
  title: String,
  description: String,
  reportId: String,
  doctorName: String,
  severity: String
}, { timestamps: true });

const TimelineEvent = mongoose.model('TimelineEvent', TimelineEventSchema);

// Doctor Connection Schema
const DoctorConnectionSchema = new Schema({
  id: { type: String, required: true, unique: true },
  doctorId: String,
  patientId: String,
  doctorName: String,
  doctorSpecialty: String,
  doctorHospital: String,
  status: String,
  permissions: {
    reports: Boolean,
    timeline: Boolean,
    trends: Boolean,
    aiSummary: Boolean
  },
  connectedAt: String,
  requestedAt: String,
  requestedBy: String
}, { timestamps: true });

const DoctorConnection = mongoose.model('DoctorConnection', DoctorConnectionSchema);

// Shared Report Schema
const SharedReportSchema = new Schema({
  id: { type: String, required: true, unique: true },
  reportId: String,
  reportTitle: String,
  patientId: String,
  patientName: String,
  doctorId: String,
  doctorName: String,
  sharedBy: String,
  senderName: String,
  recipientName: String,
  sharedAt: String,
  note: String,
  category: String,
  status: String
}, { timestamps: true });

const SharedReport = mongoose.model('SharedReport', SharedReportSchema);

// Notification Schema
const NotificationSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: String,
  role: String,
  title: String,
  message: String,
  date: String,
  read: { type: Boolean, default: false },
  link: String,
  type: { type: String }
}, { timestamps: true });

const Notification = mongoose.model('Notification', NotificationSchema);

// Doctor Note Schema
const DoctorNoteSchema = new Schema({
  id: { type: String, required: true, unique: true },
  patientId: String,
  doctorId: String,
  doctorName: String,
  reportId: String,
  reportTitle: String,
  date: String,
  time: String,
  text: String,
  category: String,
  sharedWithPatient: Boolean
}, { timestamps: true });

const DoctorNote = mongoose.model('DoctorNote', DoctorNoteSchema);

// Message Schema (Direct Patient-Doctor Communication)
const MessageSchema = new Schema({
  id: { type: String, required: true, unique: true },
  patientId: { type: String, required: true },
  doctorId: { type: String, required: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  senderRole: { type: String, enum: ['patient', 'doctor'], required: true },
  recipientId: { type: String, required: true },
  recipientName: { type: String },
  message: { type: String, required: true },
  timestamp: { type: String },
  read: { type: Boolean, default: false }
}, { timestamps: true });

const Message = mongoose.model('Message', MessageSchema);

export {
  User,
  Report,
  Alert,
  TimelineEvent,
  DoctorConnection,
  SharedReport,
  Notification,
  DoctorNote,
  Message
};
