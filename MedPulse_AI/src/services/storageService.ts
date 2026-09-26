import {
  User,
  PatientUser,
  DoctorUser,
  Report,
  Alert,
  TimelineEvent,
  DoctorConnection,
  SharedReport,
  Notification,
  DoctorNote,
  ChatMessage
} from '../types';

const STORAGE_KEYS = {
  USERS: 'health_users',
  CURRENT_USER: 'health_current_user',
  REPORTS: 'health_reports',
  ALERTS: 'health_alerts',
  TIMELINE: 'health_timeline',
  CONNECTIONS: 'health_connections',
  SHARED: 'health_shared_reports',
  NOTIFICATIONS: 'health_notifications',
  NOTES: 'health_notes',
  CHAT: 'health_chat',
  LANGUAGE: 'health_language'
};

// Seed Users
const SEED_PATIENT: PatientUser = {
  id: 'PID-84920',
  role: 'patient',
  email: 'patient@demo.com',
  name: 'Aarav Sharma',
  mobile: '+91 98201 44521',
  dob: '1992-06-14',
  gender: 'Male',
  bloodGroup: 'B+',
  preferredLanguage: 'en',
  allergies: ['Penicillin', 'Sulfa drugs'],
  medications: ['Metformin 500mg (OD)', 'Vitamin D3 60K weekly'],
  medicalHistory: ['Mild Hypertension', 'Pre-diabetes surveillance'],
  emergencyContact: {
    name: 'Pooja Sharma',
    relationship: 'Spouse',
    phone: '+91 98201 44599'
  }
};

const SEED_DOCTOR: DoctorUser = {
  id: 'DOC-10294',
  role: 'doctor',
  email: 'doctor@demo.com',
  name: 'Dr. Ananya Mehta',
  mobile: '+91 94220 88102',
  qualification: 'MBBS, MD (Internal Medicine)',
  specialization: 'Internal Medicine & Endocrinology',
  registrationNumber: 'MCI-2014-883921',
  hospital: 'MetroCare Superspeciality Hospital, Mumbai',
  preferredLanguage: 'en',
  about: 'Consultant physician with 12+ years in chronic metabolic disease management, preventative health screenings, and longitudinal lab evaluation.'
};

// Seed Reports
const SEED_REPORTS: Report[] = [
  {
    id: 'REP-2026-001',
    title: 'Complete Blood Count (CBC) Panel',
    category: 'Hematology',
    date: '2026-06-10',
    uploadedBy: 'Aarav Sharma',
    doctorName: 'Dr. Ananya Mehta',
    hospitalOrLab: 'Metropolis Diagnostics Lab, Bandra',
    fileName: 'CBC_Report_June_2026.pdf',
    fileSize: '1.4 MB',
    status: 'verified',
    notes: 'Routine baseline screening. Hemoglobin and platelet indices fully balanced.',
    aiSummary: 'All hematological parameters within healthy clinical thresholds. Hemoglobin at 13.8 g/dL is optimal for age and gender.',
    isSharedWithDoctor: true,
    sharedDoctorIds: ['DOC-10294'],
    extractedValues: [
      { id: 't1', testName: 'Hemoglobin', value: 13.8, unit: 'g/dL', referenceRange: '13.0 - 17.0', minRange: 13.0, maxRange: 17.0, status: 'normal', category: 'Hematology' },
      { id: 't2', testName: 'Total WBC Count', value: 7200, unit: '/cumm', referenceRange: '4000 - 11000', minRange: 4000, maxRange: 11000, status: 'normal', category: 'Hematology' },
      { id: 't3', testName: 'Platelet Count', value: 245000, unit: '/mcL', referenceRange: '150000 - 450000', minRange: 150000, maxRange: 450000, status: 'normal', category: 'Hematology' },
      { id: 't4', testName: 'RBC Count', value: 4.8, unit: 'million/mcL', referenceRange: '4.5 - 5.9', minRange: 4.5, maxRange: 5.9, status: 'normal', category: 'Hematology' },
      { id: 't5', testName: 'Packed Cell Volume (PCV)', value: 42.1, unit: '%', referenceRange: '40.0 - 50.0', minRange: 40.0, maxRange: 50.0, status: 'normal', category: 'Hematology' }
    ]
  },
  {
    id: 'REP-2026-002',
    title: 'Comprehensive Lipid & Cholesterol Profile',
    category: 'Lipid Panel',
    date: '2026-07-02',
    uploadedBy: 'Aarav Sharma',
    doctorName: 'Dr. Ananya Mehta',
    hospitalOrLab: 'Suburban Diagnostics Centre',
    fileName: 'Lipid_Profile_July_2026.pdf',
    fileSize: '1.8 MB',
    status: 'verified',
    notes: 'Fasting 12 hours prior to venipuncture.',
    aiSummary: 'Total cholesterol is slightly elevated at 208 mg/dL (borderline). Triglycerides at 165 mg/dL reflect mild dietary elevation.',
    isSharedWithDoctor: true,
    sharedDoctorIds: ['DOC-10294'],
    extractedValues: [
      { id: 't6', testName: 'Total Cholesterol', value: 208, unit: 'mg/dL', referenceRange: '< 200', minRange: 120, maxRange: 200, status: 'high', category: 'Lipid Panel' },
      { id: 't7', testName: 'Triglycerides', value: 165, unit: 'mg/dL', referenceRange: '< 150', minRange: 50, maxRange: 150, status: 'high', category: 'Lipid Panel' },
      { id: 't8', testName: 'HDL Cholesterol (Good)', value: 46, unit: 'mg/dL', referenceRange: '> 40', minRange: 40, maxRange: 60, status: 'normal', category: 'Lipid Panel' },
      { id: 't9', testName: 'LDL Cholesterol (Calculated)', value: 129, unit: 'mg/dL', referenceRange: '< 100', minRange: 60, maxRange: 100, status: 'high', category: 'Lipid Panel' },
      { id: 't10', testName: 'VLDL Cholesterol', value: 33, unit: 'mg/dL', referenceRange: '< 30', minRange: 5, maxRange: 30, status: 'high', category: 'Lipid Panel' }
    ]
  },
  {
    id: 'REP-2026-003',
    title: 'Fasting Blood Glucose & HbA1c Glycemic Test',
    category: 'Biochemistry',
    date: '2026-07-28',
    uploadedBy: 'Aarav Sharma',
    doctorName: 'Dr. Ananya Mehta',
    hospitalOrLab: 'Metropolis Diagnostics Lab, Bandra',
    fileName: 'HbA1c_July_2026.pdf',
    fileSize: '950 KB',
    status: 'verified',
    notes: 'Quarterly glycemic assessment.',
    aiSummary: 'Fasting blood glucose recorded at 104 mg/dL indicates borderline impaired fasting glycaemia. Glycated Hemoglobin (HbA1c) is 5.7% (prediabetic threshold).',
    isSharedWithDoctor: true,
    sharedDoctorIds: ['DOC-10294'],
    extractedValues: [
      { id: 't11', testName: 'Fasting Blood Glucose', value: 104, unit: 'mg/dL', referenceRange: '70 - 99', minRange: 70, maxRange: 99, status: 'high', category: 'Biochemistry' },
      { id: 't12', testName: 'HbA1c (Glycated Hemoglobin)', value: 5.7, unit: '%', referenceRange: '< 5.7', minRange: 4.0, maxRange: 5.6, status: 'high', category: 'Biochemistry' },
      { id: 't13', testName: 'Serum Creatinine', value: 0.95, unit: 'mg/dL', referenceRange: '0.7 - 1.3', minRange: 0.7, maxRange: 1.3, status: 'normal', category: 'Biochemistry' },
      { id: 't14', testName: 'Blood Urea Nitrogen (BUN)', value: 14.2, unit: 'mg/dL', referenceRange: '7.0 - 20.0', minRange: 7.0, maxRange: 20.0, status: 'normal', category: 'Biochemistry' }
    ]
  },
  {
    id: 'REP-2026-004',
    title: 'Follow-up Complete Blood Count (CBC)',
    category: 'Hematology',
    date: '2026-08-18',
    uploadedBy: 'Aarav Sharma',
    doctorName: 'Dr. Ananya Mehta',
    hospitalOrLab: 'Apollo Diagnostic Clinic',
    fileName: 'CBC_Followup_August_2026.pdf',
    fileSize: '1.2 MB',
    status: 'flagged',
    notes: 'Patient noted mild fatigue during the monsoon weeks.',
    aiSummary: 'Hemoglobin dropped from 13.8 g/dL to 12.1 g/dL, crossing below the standard reference range (13.0 - 17.0 g/dL). Recommend iron studies and dietary follow-up.',
    isSharedWithDoctor: true,
    sharedDoctorIds: ['DOC-10294'],
    extractedValues: [
      { id: 't15', testName: 'Hemoglobin', value: 12.1, unit: 'g/dL', referenceRange: '13.0 - 17.0', minRange: 13.0, maxRange: 17.0, status: 'low', category: 'Hematology' },
      { id: 't16', testName: 'Total WBC Count', value: 6800, unit: '/cumm', referenceRange: '4000 - 11000', minRange: 4000, maxRange: 11000, status: 'normal', category: 'Hematology' },
      { id: 't17', testName: 'Platelet Count', value: 230000, unit: '/mcL', referenceRange: '150000 - 450000', minRange: 150000, maxRange: 450000, status: 'normal', category: 'Hematology' },
      { id: 't18', testName: 'RBC Count', value: 4.1, unit: 'million/mcL', referenceRange: '4.5 - 5.9', minRange: 4.5, maxRange: 5.9, status: 'low', category: 'Hematology' },
      { id: 't19', testName: 'Mean Corpuscular Volume (MCV)', value: 81.2, unit: 'fL', referenceRange: '80.0 - 100.0', minRange: 80.0, maxRange: 100.0, status: 'normal', category: 'Hematology' }
    ]
  },
  {
    id: 'REP-2026-005',
    title: 'Vitamin D & Thyroid Stimulating Hormone (TSH)',
    category: 'Thyroid',
    date: '2026-09-04',
    uploadedBy: 'Aarav Sharma',
    doctorName: 'Dr. Ananya Mehta',
    hospitalOrLab: 'Thyrocare Technologies',
    fileName: 'VitaminD_TSH_Sep_2026.pdf',
    fileSize: '880 KB',
    status: 'flagged',
    notes: 'Ordered following reported fatigue and low sunlight exposure.',
    aiSummary: 'Vitamin D 25-Hydroxy is severely deficient at 14.8 ng/mL (Deficiency < 20 ng/mL). Thyroid function (TSH 2.65 uIU/mL) remains within normal euthyroid range.',
    isSharedWithDoctor: true,
    sharedDoctorIds: ['DOC-10294'],
    extractedValues: [
      { id: 't20', testName: 'Vitamin D (25-Hydroxy)', value: 14.8, unit: 'ng/mL', referenceRange: '30.0 - 100.0', minRange: 30.0, maxRange: 100.0, status: 'low', category: 'General' },
      { id: 't21', testName: 'Thyroid Stimulating Hormone (TSH)', value: 2.65, unit: 'uIU/mL', referenceRange: '0.40 - 4.50', minRange: 0.40, maxRange: 4.50, status: 'normal', category: 'Thyroid' },
      { id: 't22', testName: 'Free Triiodothyronine (FT3)', value: 3.1, unit: 'pg/mL', referenceRange: '2.0 - 4.4', minRange: 2.0, maxRange: 4.4, status: 'normal', category: 'Thyroid' },
      { id: 't23', testName: 'Free Thyroxine (FT4)', value: 1.15, unit: 'ng/dL', referenceRange: '0.8 - 1.8', minRange: 0.8, maxRange: 1.8, status: 'normal', category: 'Thyroid' }
    ]
  },
  {
    id: 'REP-2026-006',
    title: 'Quarterly Metabolic & Blood Pressure Review',
    category: 'Biochemistry',
    date: '2026-09-20',
    uploadedBy: 'Aarav Sharma',
    doctorName: 'Dr. Ananya Mehta',
    hospitalOrLab: 'MetroCare Superspeciality Hospital OPD',
    fileName: 'Metabolic_Review_Sep_2026.pdf',
    fileSize: '1.6 MB',
    status: 'flagged',
    notes: 'Clinical consultation in OPD Room 204. Vitals and venous blood recorded.',
    aiSummary: 'Fasting glucose spiked to 134 mg/dL (above reference threshold). Systolic Blood Pressure recorded at 138 mmHg. Requires active clinical management.',
    isSharedWithDoctor: true,
    sharedDoctorIds: ['DOC-10294'],
    extractedValues: [
      { id: 't24', testName: 'Fasting Blood Glucose', value: 134, unit: 'mg/dL', referenceRange: '70 - 99', minRange: 70, maxRange: 99, status: 'high', category: 'Biochemistry' },
      { id: 't25', testName: 'Blood Pressure Systolic', value: 138, unit: 'mmHg', referenceRange: '90 - 120', minRange: 90, maxRange: 120, status: 'high', category: 'Biochemistry' },
      { id: 't26', testName: 'Blood Pressure Diastolic', value: 88, unit: 'mmHg', referenceRange: '60 - 80', minRange: 60, maxRange: 80, status: 'high', category: 'Biochemistry' },
      { id: 't27', testName: 'Serum Uric Acid', value: 6.4, unit: 'mg/dL', referenceRange: '3.5 - 7.2', minRange: 3.5, maxRange: 7.2, status: 'normal', category: 'Biochemistry' },
      { id: 't28', testName: 'Serum Creatinine', value: 0.98, unit: 'mg/dL', referenceRange: '0.7 - 1.3', minRange: 0.7, maxRange: 1.3, status: 'normal', category: 'Biochemistry' }
    ]
  }
];

// Seed Alerts
const SEED_ALERTS: Alert[] = [
  {
    id: 'ALT-101',
    patientId: 'PID-84920',
    reportId: 'REP-2026-006',
    sourceReportTitle: 'Quarterly Metabolic & Blood Pressure Review',
    metric: 'Fasting Blood Glucose',
    value: 134,
    unit: 'mg/dL',
    referenceRange: '70 - 99 mg/dL',
    date: '2026-09-20',
    severity: 'high',
    type: 'above_range',
    status: 'active'
  },
  {
    id: 'ALT-102',
    patientId: 'PID-84920',
    reportId: 'REP-2026-005',
    sourceReportTitle: 'Vitamin D & Thyroid Stimulating Hormone (TSH)',
    metric: 'Vitamin D (25-Hydroxy)',
    value: 14.8,
    unit: 'ng/mL',
    referenceRange: '30.0 - 100.0 ng/mL',
    date: '2026-09-04',
    severity: 'high',
    type: 'below_range',
    status: 'active'
  },
  {
    id: 'ALT-103',
    patientId: 'PID-84920',
    reportId: 'REP-2026-004',
    sourceReportTitle: 'Follow-up Complete Blood Count (CBC)',
    metric: 'Hemoglobin',
    value: 12.1,
    unit: 'g/dL',
    referenceRange: '13.0 - 17.0 g/dL',
    date: '2026-08-18',
    severity: 'medium',
    type: 'significant_change',
    status: 'reviewed',
    reviewedAt: '2026-08-20',
    doctorNote: 'Recommended iron-rich dietary intake and repeat test after 60 days.'
  }
];

// Seed Timeline
const SEED_TIMELINE: TimelineEvent[] = [
  {
    id: 'EVT-001',
    date: '2026-09-21',
    time: '11:30 AM',
    type: 'doctor_note',
    title: 'Clinical Note Added by Dr. Ananya Mehta',
    description: 'Reviewed latest fasting glucose and blood pressure parameters. Initiated lifestyle counseling and scheduled 4-week check.',
    doctorName: 'Dr. Ananya Mehta',
    severity: 'normal'
  },
  {
    id: 'EVT-002',
    date: '2026-09-20',
    time: '04:15 PM',
    type: 'abnormal_value',
    title: 'Abnormal Fasting Glucose Detected',
    description: 'Fasting Blood Glucose of 134 mg/dL exceeds upper clinical limit (99 mg/dL). Alert generated.',
    reportId: 'REP-2026-006',
    severity: 'alert'
  },
  {
    id: 'EVT-003',
    date: '2026-09-20',
    time: '03:45 PM',
    type: 'report_uploaded',
    title: 'Metabolic & Blood Pressure Review Uploaded',
    description: '5 lab biomarkers extracted via OCR analysis and verified by patient.',
    reportId: 'REP-2026-006',
    severity: 'normal'
  },
  {
    id: 'EVT-004',
    date: '2026-09-05',
    time: '02:10 PM',
    type: 'doctor_shared',
    title: 'Report Shared with Dr. Ananya Mehta',
    description: 'Shared Vitamin D and Thyroid panel with full clinical permission.',
    reportId: 'REP-2026-005',
    doctorName: 'Dr. Ananya Mehta',
    severity: 'normal'
  },
  {
    id: 'EVT-005',
    date: '2026-09-04',
    time: '10:00 AM',
    type: 'abnormal_value',
    title: 'Low Vitamin D (14.8 ng/mL) Detected',
    description: 'Serum 25-hydroxy vitamin D falls under clinical insufficiency range.',
    reportId: 'REP-2026-005',
    severity: 'warning'
  },
  {
    id: 'EVT-006',
    date: '2026-08-19',
    time: '09:20 AM',
    type: 'doctor_connected',
    title: 'Connected with Dr. Ananya Mehta',
    description: 'Patient approved doctor access permissions for Reports, Timeline, and Biomarker Trends.',
    doctorName: 'Dr. Ananya Mehta',
    severity: 'normal'
  }
];

// Seed Doctor Connections
const SEED_CONNECTIONS: DoctorConnection[] = [
  {
    id: 'CONN-001',
    doctorId: 'DOC-10294',
    patientId: 'PID-84920',
    doctorName: 'Dr. Ananya Mehta',
    doctorSpecialty: 'Internal Medicine & Endocrinology',
    doctorHospital: 'MetroCare Superspeciality Hospital, Mumbai',
    status: 'connected',
    permissions: {
      reports: true,
      timeline: true,
      trends: true,
      aiSummary: true
    },
    connectedAt: '2026-08-19',
    requestedAt: '2026-08-18',
    requestedBy: 'doctor'
  },
  {
    id: 'CONN-002',
    doctorId: 'DOC-50119',
    patientId: 'PID-84920',
    doctorName: 'Dr. Rajesh Deshmukh',
    doctorSpecialty: 'Cardiology',
    doctorHospital: 'Lilavati Hospital & Research Centre',
    status: 'pending',
    permissions: {
      reports: true,
      timeline: true,
      trends: true,
      aiSummary: false
    },
    requestedAt: '2026-09-22',
    requestedBy: 'doctor'
  }
];

// Seed Shared Reports
const SEED_SHARED: SharedReport[] = [
  {
    id: 'SHR-001',
    reportId: 'REP-2026-006',
    reportTitle: 'Quarterly Metabolic & Blood Pressure Review',
    patientId: 'PID-84920',
    patientName: 'Aarav Sharma',
    doctorId: 'DOC-10294',
    doctorName: 'Dr. Ananya Mehta',
    sharedBy: 'patient',
    senderName: 'Aarav Sharma',
    recipientName: 'Dr. Ananya Mehta',
    sharedAt: '2026-09-20 16:30',
    note: 'Sharing recent OPD glucose and BP readings for medication adjustment review.',
    category: 'Biochemistry',
    status: 'active'
  },
  {
    id: 'SHR-002',
    reportId: 'REP-2026-005',
    reportTitle: 'Vitamin D & Thyroid Stimulating Hormone (TSH)',
    patientId: 'PID-84920',
    patientName: 'Aarav Sharma',
    doctorId: 'DOC-10294',
    doctorName: 'Dr. Ananya Mehta',
    sharedBy: 'patient',
    senderName: 'Aarav Sharma',
    recipientName: 'Dr. Ananya Mehta',
    sharedAt: '2026-09-05 14:10',
    note: 'Please review low Vitamin D levels.',
    category: 'Thyroid',
    status: 'active'
  },
  {
    id: 'SHR-003',
    reportId: 'REP-2026-004',
    reportTitle: 'Follow-up Complete Blood Count (CBC)',
    patientId: 'PID-84920',
    patientName: 'Aarav Sharma',
    doctorId: 'DOC-10294',
    doctorName: 'Dr. Ananya Mehta',
    sharedBy: 'doctor',
    senderName: 'Dr. Ananya Mehta',
    recipientName: 'Aarav Sharma',
    sharedAt: '2026-08-20 11:00',
    note: 'Annotated copy with hemoglobin drop observations and diet advice.',
    category: 'Hematology',
    status: 'active'
  }
];

// Seed Notifications
const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: 'NOTIF-001',
    userId: 'PID-84920',
    role: 'patient',
    title: 'Clinical Review Note Added',
    message: 'Dr. Ananya Mehta commented on your Metabolic Review report.',
    date: '2026-09-21 11:30 AM',
    read: false,
    link: '/patient/reports/REP-2026-006',
    type: 'doctor_note'
  },
  {
    id: 'NOTIF-002',
    userId: 'PID-84920',
    role: 'patient',
    title: 'Biomarker Alert Triggered',
    message: 'Fasting Blood Glucose (134 mg/dL) was flagged above range in your latest test.',
    date: '2026-09-20 04:15 PM',
    read: false,
    link: '/patient/alerts',
    type: 'abnormal_alert'
  },
  {
    id: 'NOTIF-003',
    userId: 'PID-84920',
    role: 'patient',
    title: 'Doctor Access Request',
    message: 'Dr. Rajesh Deshmukh (Cardiology) requested access to your health records.',
    date: '2026-09-22 09:10 AM',
    read: false,
    link: '/patient/doctors',
    type: 'access_request'
  },
  {
    id: 'NOTIF-004',
    userId: 'DOC-10294',
    role: 'doctor',
    title: 'New Patient Report Shared',
    message: 'Aarav Sharma shared "Quarterly Metabolic & Blood Pressure Review".',
    date: '2026-09-20 04:30 PM',
    read: false,
    link: '/doctor/patients/PID-84920/reports',
    type: 'report_shared'
  },
  {
    id: 'NOTIF-005',
    userId: 'DOC-10294',
    role: 'doctor',
    title: 'Biomarker Alert for Connected Patient',
    message: 'Aarav Sharma has an active High Fasting Glucose alert (134 mg/dL).',
    date: '2026-09-20 04:15 PM',
    read: false,
    link: '/doctor/alerts',
    type: 'abnormal_alert'
  }
];

// Seed Doctor Notes
const SEED_NOTES: DoctorNote[] = [
  {
    id: 'NOTE-001',
    patientId: 'PID-84920',
    doctorId: 'DOC-10294',
    doctorName: 'Dr. Ananya Mehta',
    reportId: 'REP-2026-006',
    reportTitle: 'Quarterly Metabolic & Blood Pressure Review',
    date: '2026-09-21',
    time: '11:30 AM',
    text: 'Patient shows upward trend in fasting glucose (104 -> 134 mg/dL) and mild systolic rise (138 mmHg). Reinforce 30 min daily brisk walking, restrict refined carbohydrates. Advised fasting lipid + HbA1c re-test in 8 weeks.',
    category: 'lab_review',
    sharedWithPatient: true
  },
  {
    id: 'NOTE-002',
    patientId: 'PID-84920',
    doctorId: 'DOC-10294',
    doctorName: 'Dr. Ananya Mehta',
    reportId: 'REP-2026-005',
    reportTitle: 'Vitamin D & Thyroid Stimulating Hormone (TSH)',
    date: '2026-09-06',
    time: '03:15 PM',
    text: 'Prescribed Cholecalciferol (Vitamin D3) 60,000 IU sachet weekly with warm milk for 8 consecutive weeks, then monthly maintenance.',
    category: 'prescription',
    sharedWithPatient: true
  },
  {
    id: 'NOTE-003',
    patientId: 'PID-84920',
    doctorId: 'DOC-10294',
    doctorName: 'Dr. Ananya Mehta',
    reportId: 'REP-2026-004',
    reportTitle: 'Follow-up Complete Blood Count (CBC)',
    date: '2026-08-20',
    time: '04:00 PM',
    text: 'Mild drop in hemoglobin from baseline 13.8 to 12.1 g/dL. No evidence of macrocytosis or bleeding. Increase dietary iron (spinach, legumes, beetroot) and monitor.',
    category: 'followup',
    sharedWithPatient: true
  }
];

// Helper to get from LocalStorage with fallback
function getStored<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return defaultVal;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

// Storage Service API
export const storageService = {
  // Initialization
  initStorage: () => {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      setStored(STORAGE_KEYS.USERS, [SEED_PATIENT, SEED_DOCTOR]);
    }
    if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
      setStored(STORAGE_KEYS.REPORTS, SEED_REPORTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ALERTS)) {
      setStored(STORAGE_KEYS.ALERTS, SEED_ALERTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.TIMELINE)) {
      setStored(STORAGE_KEYS.TIMELINE, SEED_TIMELINE);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CONNECTIONS)) {
      setStored(STORAGE_KEYS.CONNECTIONS, SEED_CONNECTIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SHARED)) {
      setStored(STORAGE_KEYS.SHARED, SEED_SHARED);
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      setStored(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTES)) {
      setStored(STORAGE_KEYS.NOTES, SEED_NOTES);
    }
  },

  resetDemoData: () => {
    setStored(STORAGE_KEYS.USERS, [SEED_PATIENT, SEED_DOCTOR]);
    setStored(STORAGE_KEYS.REPORTS, SEED_REPORTS);
    setStored(STORAGE_KEYS.ALERTS, SEED_ALERTS);
    setStored(STORAGE_KEYS.TIMELINE, SEED_TIMELINE);
    setStored(STORAGE_KEYS.CONNECTIONS, SEED_CONNECTIONS);
    setStored(STORAGE_KEYS.SHARED, SEED_SHARED);
    setStored(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    setStored(STORAGE_KEYS.NOTES, SEED_NOTES);
    setStored(STORAGE_KEYS.CHAT, []);
  },

  // Auth & Users
  getUsers: (): User[] => getStored<User[]>(STORAGE_KEYS.USERS, [SEED_PATIENT, SEED_DOCTOR]),
  saveUser: (user: User) => {
    const users = storageService.getUsers();
    const index = users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    setStored(STORAGE_KEYS.USERS, users);
  },
  getCurrentUser: (): User | null => getStored<User | null>(STORAGE_KEYS.CURRENT_USER, null),
  setCurrentUser: (user: User | null) => setStored(STORAGE_KEYS.CURRENT_USER, user),

  // Reports
  getReports: (): Report[] => getStored<Report[]>(STORAGE_KEYS.REPORTS, SEED_REPORTS),
  getReportById: (id: string): Report | undefined => {
    return storageService.getReports().find(r => r.id === id);
  },
  saveReport: (report: Report): Report => {
    const reports = storageService.getReports();
    const index = reports.findIndex(r => r.id === report.id);
    let isNew = false;
    if (index >= 0) {
      reports[index] = report;
    } else {
      isNew = true;
      reports.unshift(report);
    }
    setStored(STORAGE_KEYS.REPORTS, reports);

    // If new report, generate timeline event and auto-detect abnormal alerts
    if (isNew) {
      // Add timeline event
      storageService.addTimelineEvent({
        id: `EVT-${Date.now()}`,
        date: report.date,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'report_uploaded',
        title: `${report.title} Uploaded`,
        description: `Verified extraction containing ${report.extractedValues.length} lab biomarkers from ${report.hospitalOrLab}.`,
        reportId: report.id,
        severity: 'normal'
      });

      // Check abnormal lab values and spawn alerts
      report.extractedValues.forEach(val => {
        if (val.status === 'high' || val.status === 'low' || val.status === 'critical') {
          storageService.addAlert({
            id: `ALT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            patientId: 'PID-84920',
            reportId: report.id,
            sourceReportTitle: report.title,
            metric: val.testName,
            value: val.value,
            unit: val.unit,
            referenceRange: val.referenceRange,
            date: report.date,
            severity: val.status === 'critical' ? 'high' : (val.status === 'low' ? 'high' : 'medium'),
            type: val.status === 'low' ? 'below_range' : 'above_range',
            status: 'active'
          });

          // Abnormal timeline event
          storageService.addTimelineEvent({
            id: `EVT-AB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            date: report.date,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'abnormal_value',
            title: `Abnormal ${val.testName} Detected`,
            description: `${val.testName} level of ${val.value} ${val.unit} is outside reference range (${val.referenceRange}).`,
            reportId: report.id,
            severity: val.status === 'critical' || val.status === 'low' ? 'alert' : 'warning'
          });
        }
      });

      // Notification
      storageService.addNotification({
        id: `NOTIF-${Date.now()}`,
        userId: 'PID-84920',
        role: 'patient',
        title: 'Report Processed Successfully',
        message: `"${report.title}" extracted and ready for trend analysis.`,
        date: 'Just now',
        read: false,
        link: `/patient/reports/${report.id}`,
        type: 'processing_complete'
      });
    }

    return report;
  },
  deleteReport: (id: string) => {
    const reports = storageService.getReports().filter(r => r.id !== id);
    setStored(STORAGE_KEYS.REPORTS, reports);
    // Also remove associated alerts
    const alerts = storageService.getAlerts().filter(a => a.reportId !== id);
    setStored(STORAGE_KEYS.ALERTS, alerts);
    // Also remove associated timeline events
    const timeline = storageService.getTimeline().filter(t => t.reportId !== id);
    setStored(STORAGE_KEYS.TIMELINE, timeline);
    // Also remove shared references
    const shared = storageService.getSharedReports().filter(s => s.reportId !== id);
    setStored(STORAGE_KEYS.SHARED, shared);
  },

  // Alerts
  getAlerts: (): Alert[] => getStored<Alert[]>(STORAGE_KEYS.ALERTS, SEED_ALERTS),
  addAlert: (alert: Alert) => {
    const alerts = storageService.getAlerts();
    alerts.unshift(alert);
    setStored(STORAGE_KEYS.ALERTS, alerts);
  },
  updateAlertStatus: (id: string, status: 'active' | 'reviewed', note?: string) => {
    const alerts = storageService.getAlerts();
    const alert = alerts.find(a => a.id === id);
    if (alert) {
      alert.status = status;
      if (status === 'reviewed') {
        alert.reviewedAt = new Date().toISOString().split('T')[0];
        if (note) alert.doctorNote = note;
      }
      setStored(STORAGE_KEYS.ALERTS, alerts);
    }
  },

  // Timeline
  getTimeline: (): TimelineEvent[] => getStored<TimelineEvent[]>(STORAGE_KEYS.TIMELINE, SEED_TIMELINE),
  addTimelineEvent: (event: TimelineEvent) => {
    const timeline = storageService.getTimeline();
    timeline.unshift(event);
    setStored(STORAGE_KEYS.TIMELINE, timeline);
  },

  // Doctor Connections
  getConnections: (): DoctorConnection[] => getStored<DoctorConnection[]>(STORAGE_KEYS.CONNECTIONS, SEED_CONNECTIONS),
  updateConnectionStatus: (id: string, status: DoctorConnection['status'], permissions?: any) => {
    const conns = storageService.getConnections();
    const conn = conns.find(c => c.id === id);
    if (conn) {
      conn.status = status;
      if (status === 'connected') {
        conn.connectedAt = new Date().toISOString().split('T')[0];
      }
      if (permissions) {
        conn.permissions = { ...conn.permissions, ...permissions };
      }
      setStored(STORAGE_KEYS.CONNECTIONS, conns);

      // Notification to doctor/patient
      if (status === 'connected') {
        storageService.addNotification({
          id: `NOTIF-${Date.now()}`,
          userId: conn.doctorId,
          role: 'doctor',
          title: 'Patient Connection Approved',
          message: `Aarav Sharma accepted your connection request with full permission.`,
          date: 'Just now',
          read: false,
          link: `/doctor/patients/${conn.patientId}`,
          type: 'connection_accepted'
        });

        storageService.addTimelineEvent({
          id: `EVT-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'doctor_connected',
          title: `Connected with ${conn.doctorName}`,
          description: `Access permissions granted for health records review.`,
          doctorName: conn.doctorName,
          severity: 'normal'
        });
      }
    }
  },
  requestDoctorConnection: (doc: { doctorId: string; doctorName: string; doctorSpecialty: string; doctorHospital: string; requestedBy: 'patient' | 'doctor'; patientId?: string }) => {
    const conns = storageService.getConnections();
    const newConn: DoctorConnection = {
      id: `CONN-${Date.now()}`,
      doctorId: doc.doctorId,
      patientId: doc.patientId || 'PID-84920',
      doctorName: doc.doctorName,
      doctorSpecialty: doc.doctorSpecialty,
      doctorHospital: doc.doctorHospital,
      status: 'pending',
      permissions: { reports: true, timeline: true, trends: true, aiSummary: true },
      requestedAt: new Date().toISOString().split('T')[0],
      requestedBy: doc.requestedBy
    };
    conns.unshift(newConn);
    setStored(STORAGE_KEYS.CONNECTIONS, conns);

    if (doc.requestedBy === 'doctor') {
      storageService.addNotification({
        id: `NOTIF-${Date.now()}`,
        userId: doc.patientId || 'PID-84920',
        role: 'patient',
        title: 'New Doctor Access Request',
        message: `${doc.doctorName} (${doc.doctorSpecialty}) requested access to your medical records.`,
        date: 'Just now',
        read: false,
        link: '/patient/doctors',
        type: 'access_request'
      });
    }
    return newConn;
  },

  // Shared Reports
  getSharedReports: (): SharedReport[] => getStored<SharedReport[]>(STORAGE_KEYS.SHARED, SEED_SHARED),
  shareReport: (shared: Omit<SharedReport, 'id' | 'sharedAt' | 'status'>) => {
    const all = storageService.getSharedReports();
    const newShare: SharedReport = {
      ...shared,
      id: `SHR-${Date.now()}`,
      sharedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'active'
    };
    all.unshift(newShare);
    setStored(STORAGE_KEYS.SHARED, all);

    // Update report flag
    const reports = storageService.getReports();
    const rep = reports.find(r => r.id === shared.reportId);
    if (rep) {
      rep.isSharedWithDoctor = true;
      if (!rep.sharedDoctorIds) rep.sharedDoctorIds = [];
      if (!rep.sharedDoctorIds.includes(shared.doctorId)) rep.sharedDoctorIds.push(shared.doctorId);
      setStored(STORAGE_KEYS.REPORTS, reports);
    }

    // Add notification
    const recipientRole = shared.sharedBy === 'patient' ? 'doctor' : 'patient';
    const recipientUserId = shared.sharedBy === 'patient' ? shared.doctorId : shared.patientId;
    storageService.addNotification({
      id: `NOTIF-${Date.now()}`,
      userId: recipientUserId,
      role: recipientRole,
      title: 'Report Shared With You',
      message: `${shared.senderName} shared "${shared.reportTitle}". Note: ${shared.note || 'None'}`,
      date: 'Just now',
      read: false,
      link: recipientRole === 'patient' ? '/patient/shared' : `/doctor/patients/${shared.patientId}/reports`,
      type: 'report_shared'
    });

    // Timeline event
    storageService.addTimelineEvent({
      id: `EVT-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'report_shared',
      title: `Report Shared: ${shared.reportTitle}`,
      description: `Shared with ${shared.recipientName} (${shared.note || 'No notes'})`,
      reportId: shared.reportId,
      severity: 'normal'
    });

    return newShare;
  },

  // Doctor Notes
  getDoctorNotes: (patientId?: string): DoctorNote[] => {
    const notes = getStored<DoctorNote[]>(STORAGE_KEYS.NOTES, SEED_NOTES);
    if (patientId) return notes.filter(n => n.patientId === patientId);
    return notes;
  },
  addDoctorNote: (note: Omit<DoctorNote, 'id' | 'date' | 'time'>) => {
    const notes = storageService.getDoctorNotes();
    const newNote: DoctorNote = {
      ...note,
      id: `NOTE-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    notes.unshift(newNote);
    setStored(STORAGE_KEYS.NOTES, notes);

    // If shared with patient, send notification and timeline event
    if (newNote.sharedWithPatient) {
      storageService.addNotification({
        id: `NOTIF-${Date.now()}`,
        userId: newNote.patientId,
        role: 'patient',
        title: 'New Clinical Note from Doctor',
        message: `${newNote.doctorName} added a clinical note regarding your records.`,
        date: 'Just now',
        read: false,
        link: newNote.reportId ? `/patient/reports/${newNote.reportId}` : '/patient/shared',
        type: 'doctor_note'
      });

      storageService.addTimelineEvent({
        id: `EVT-${Date.now()}`,
        date: newNote.date,
        time: newNote.time,
        type: 'doctor_note',
        title: `Clinical Note: ${newNote.doctorName}`,
        description: newNote.text,
        reportId: newNote.reportId,
        doctorName: newNote.doctorName,
        severity: 'normal'
      });
    }

    return newNote;
  },

  // Notifications
  getNotifications: (userId?: string, role?: 'patient' | 'doctor'): Notification[] => {
    const list = getStored<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    if (userId && role) {
      return list.filter(n => n.role === role);
    }
    return list;
  },
  addNotification: (notif: Notification) => {
    const list = getStored<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    list.unshift(notif);
    setStored(STORAGE_KEYS.NOTIFICATIONS, list);
  },
  markNotificationRead: (id: string) => {
    const list = getStored<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    const item = list.find(n => n.id === id);
    if (item) {
      item.read = true;
      setStored(STORAGE_KEYS.NOTIFICATIONS, list);
    }
  },
  markAllNotificationsRead: (role: 'patient' | 'doctor') => {
    const list = getStored<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
    list.forEach(n => {
      if (n.role === role) n.read = true;
    });
    setStored(STORAGE_KEYS.NOTIFICATIONS, list);
  },
  deleteNotification: (id: string) => {
    const list = getStored<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS).filter(n => n.id !== id);
    setStored(STORAGE_KEYS.NOTIFICATIONS, list);
  },

  // Chat History
  getChatHistory: (): ChatMessage[] => {
    return getStored<ChatMessage[]>(STORAGE_KEYS.CHAT, [
      {
        id: 'msg-seed-1',
        sender: 'assistant',
        text: 'Hello Aarav. I am your Medical Report Assistant. I have indexed your 6 verified lab reports (June–September 2026). You can ask me to track specific biomarker trends, identify abnormal findings, or compare consecutive reports.',
        timestamp: '10:00 AM'
      }
    ]);
  },
  saveChatMessage: (msg: ChatMessage) => {
    const history = storageService.getChatHistory();
    history.push(msg);
    setStored(STORAGE_KEYS.CHAT, history);
  },
  clearChatHistory: () => {
    setStored(STORAGE_KEYS.CHAT, []);
  },

  // Language
  getLanguage: (): 'en' | 'hi' | 'mr' => getStored<'en' | 'hi' | 'mr'>(STORAGE_KEYS.LANGUAGE, 'en'),
  setLanguage: (lang: 'en' | 'hi' | 'mr') => setStored(STORAGE_KEYS.LANGUAGE, lang)
};

// Auto initialize on first module load
storageService.initStorage();
