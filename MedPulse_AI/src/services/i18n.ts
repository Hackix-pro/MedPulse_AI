import { storageService } from './storageService';

export type LanguageCode = 'en' | 'hi' | 'mr';

export interface Translations {
  // Navigation & General
  appName: string;
  tagline: string;
  dashboard: string;
  reports: string;
  timeline: string;
  trends: string;
  compare: string;
  aiAssistant: string;
  alerts: string;
  doctors: string;
  sharedReports: string;
  notifications: string;
  profile: string;
  settings: string;
  logout: string;
  login: string;
  signup: string;
  patients: string;
  patientRequests: string;
  clinicalReview: string;

  // Actions
  uploadReport: string;
  compareReports: string;
  askAI: string;
  shareReport: string;
  viewReport: string;
  download: string;
  search: string;
  filter: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  accept: string;
  reject: string;
  revoke: string;
  markReviewed: string;
  markAllRead: string;

  // Biomarkers & Dashboard
  hemoglobin: string;
  glucose: string;
  bloodPressure: string;
  cholesterol: string;
  referenceRange: string;
  normal: string;
  aboveRange: string;
  belowRange: string;
  totalReports: string;
  activeAlerts: string;
  connectedDoctors: string;
  recentActivity: string;
  recentReports: string;
  latestTrends: string;

  // Disclaimers
  medicalDisclaimer: string;
  privacyNotice: string;
}

const translations: Record<LanguageCode, Translations> = {
  en: {
    appName: 'MedPulse AI',
    tagline: 'Your Medical Reports. One Intelligent Health Record.',
    dashboard: 'Dashboard',
    reports: 'My Reports',
    timeline: 'Health Timeline',
    trends: 'Health Trends',
    compare: 'Compare Reports',
    aiAssistant: 'Ask My Reports',
    alerts: 'Alerts',
    doctors: 'My Doctors',
    sharedReports: 'Shared Reports',
    notifications: 'Notifications',
    profile: 'Profile',
    settings: 'Settings',
    logout: 'Log Out',
    login: 'Sign In',
    signup: 'Create Account',
    patients: 'My Patients',
    patientRequests: 'Access Requests',
    clinicalReview: 'Alerts & Review',

    uploadReport: 'Upload Report',
    compareReports: 'Compare Reports',
    askAI: 'Ask AI Assistant',
    shareReport: 'Share Report',
    viewReport: 'View Report',
    download: 'Download',
    search: 'Search reports, tests, doctors...',
    filter: 'Filter',
    save: 'Save Changes',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    accept: 'Accept',
    reject: 'Reject',
    revoke: 'Revoke Access',
    markReviewed: 'Mark as Reviewed',
    markAllRead: 'Mark All Read',

    hemoglobin: 'Hemoglobin',
    glucose: 'Fasting Glucose',
    bloodPressure: 'Blood Pressure',
    cholesterol: 'Total Cholesterol',
    referenceRange: 'Reference Range',
    normal: 'Normal',
    aboveRange: 'Above Range',
    belowRange: 'Below Range',
    totalReports: 'Total Reports',
    activeAlerts: 'Active Alerts',
    connectedDoctors: 'Connected Doctors',
    recentActivity: 'Recent Clinical Activity',
    recentReports: 'Recent Lab Reports',
    latestTrends: 'Biomarker Trends',

    medicalDisclaimer: 'Informational MVP prototype for clinical demonstration. Does not provide medical diagnosis or treatment.',
    privacyNotice: 'Your health records are encrypted and shared only with authorized clinical practitioners with your explicit consent.'
  },
  hi: {
    appName: 'मेडपल्स एआई',
    tagline: 'आपकी मेडिकल रिपोर्ट्स। एक बुद्धिमान स्वास्थ्य रिकॉर्ड।',
    dashboard: 'डैशबोर्ड',
    reports: 'मेरी रिपोर्ट्स',
    timeline: 'स्वास्थ्य समयरेखा',
    trends: 'स्वास्थ्य रुझान',
    compare: 'रिपोर्ट्स की तुलना करें',
    aiAssistant: 'रिपोर्ट्स से पूछें (AI)',
    alerts: 'अलर्ट एवं चेतावनियाँ',
    doctors: 'मेरे डॉक्टर्स',
    sharedReports: 'साझा की गई रिपोर्ट्स',
    notifications: 'सूचनाएं',
    profile: 'प्रोफ़ाइल',
    settings: 'सेटिंग्स',
    logout: 'लॉग आउट',
    login: 'साइन इन करें',
    signup: 'खाता बनाएं',
    patients: 'मेरे मरीज',
    patientRequests: 'एक्सेस अनुरोध',
    clinicalReview: 'अलर्ट एवं समीक्षा',

    uploadReport: 'रिपोर्ट अपलोड करें',
    compareReports: 'रिपोर्ट्स की तुलना करें',
    askAI: 'एआई से पूछें',
    shareReport: 'रिपोर्ट साझा करें',
    viewReport: 'रिपोर्ट देखें',
    download: 'डाउनलोड',
    search: 'रिपोर्ट, परीक्षण, डॉक्टर खोजें...',
    filter: 'फ़िल्टर',
    save: 'परिवर्तन सहेजें',
    cancel: 'रद्द करें',
    delete: 'हटाएं',
    edit: 'संपादित करें',
    accept: 'स्वीकार करें',
    reject: 'अस्वीकार करें',
    revoke: 'पहुंच रद्द करें',
    markReviewed: 'समीक्षित चिह्नित करें',
    markAllRead: 'सभी पढ़े हुए चिह्नित करें',

    hemoglobin: 'हीमोग्लोबिन',
    glucose: 'फास्टिंग ग्लूकोज',
    bloodPressure: 'रक्तचाप (BP)',
    cholesterol: 'कुल कोलेस्ट्रॉल',
    referenceRange: 'संदर्भ सीमा',
    normal: 'सामान्य',
    aboveRange: 'सीमा से अधिक',
    belowRange: 'सीमा से कम',
    totalReports: 'कुल रिपोर्ट्स',
    activeAlerts: 'सक्रिय अलर्ट',
    connectedDoctors: 'जुड़े हुए डॉक्टर्स',
    recentActivity: 'हालिया चिकित्सकीय गतिविधि',
    recentReports: 'हालिया लैब रिपोर्ट्स',
    latestTrends: 'बायोमार्कर रुझान',

    medicalDisclaimer: 'यह एक सूचनात्मक प्रोटोटाइप है। यह चिकित्सा निदान या उपचार प्रदान नहीं करता है।',
    privacyNotice: 'आपकी स्वास्थ्य जानकारी सुरक्षित है और आपकी सहमति से केवल अधिकृत डॉक्टरों के साथ साझा की जाती है।'
  },
  mr: {
    appName: 'मेडपल्स एआय',
    tagline: 'तुमचे वैद्यकीय अहवाल. एक सुसंबद्ध आरोग्य नोंद.',
    dashboard: 'डॅशबोर्ड',
    reports: 'माझे अहवाल',
    timeline: 'आरोग्य टाइमलाइन',
    trends: 'आरोग्य कल (ट्रेंड्स)',
    compare: 'अहवालांची तुलना',
    aiAssistant: 'अहवाल सहाय्यक (AI)',
    alerts: 'सतर्कता आणि अलर्ट',
    doctors: 'माझे डॉक्टर्स',
    sharedReports: 'सामायिक केलेले अहवाल',
    notifications: 'सूचना',
    profile: 'माहिती (प्रोफाइल)',
    settings: 'सेटिंग्ज',
    logout: 'बाहेर पडा (लॉगआउट)',
    login: 'लॉगिन करा',
    signup: 'नवीन खाते',
    patients: 'माझे रुग्ण',
    patientRequests: 'प्रवेश विनंत्या',
    clinicalReview: 'सतर्कता आणि पुनरावलोकन',

    uploadReport: 'अहवाल अपलोड करा',
    compareReports: 'अहवाल तुलना करा',
    askAI: 'एआय सहाय्यक विचारा',
    shareReport: 'अहवाल शेअर करा',
    viewReport: 'अहवाल पहा',
    download: 'डाउनलोड',
    search: 'अहवाल, चाचण्या, डॉक्टर शोधा...',
    filter: 'फिल्टर',
    save: 'बदल जतन करा',
    cancel: 'रद्द करा',
    delete: 'हटवा',
    edit: 'संपादित करा',
    accept: 'स्वीकारा',
    reject: 'नाकारा',
    revoke: 'प्रवेश मागे घ्या',
    markReviewed: 'तपासलेले म्हणून खूण करा',
    markAllRead: 'सर्व वाचलेले म्हणून खूण करा',

    hemoglobin: 'हिमोग्लोबिन',
    glucose: 'रक्तातील साखर (ग्लुकोज)',
    bloodPressure: 'रक्तदाब (बीपी)',
    cholesterol: 'एकूण कोलेस्टेरॉल',
    referenceRange: 'संदर्भ मर्यादा',
    normal: 'सामान्य',
    aboveRange: 'मर्यादेपेक्षा जास्त',
    belowRange: 'मर्यादेपेक्षा कमी',
    totalReports: 'एकूण अहवाल',
    activeAlerts: 'सक्रिय सतर्कता',
    connectedDoctors: 'जोडलेले डॉक्टर्स',
    recentActivity: 'वैद्यकीय हालचाली',
    recentReports: 'अलीकडील अहवाल',
    latestTrends: 'आरोग्य निर्देशक ट्रेंड',

    medicalDisclaimer: 'हा एक प्रात्यक्षिक प्रोटोटाइप आहे. हा कोणत्याही वैद्यकीय निदानासाठी किंवा उपचारांसाठी पर्याय नाही.',
    privacyNotice: 'तुमची माहिती सुरक्षित असून तुमच्या संमतीनेच अधिकृत डॉक्टरांशी सामायिक केली जाते.'
  }
};

let currentLang: LanguageCode = storageService.getLanguage();
const listeners = new Set<(lang: LanguageCode) => void>();

export const i18n = {
  getLanguage: (): LanguageCode => currentLang,
  setLanguage: (lang: LanguageCode) => {
    currentLang = lang;
    storageService.setLanguage(lang);
    listeners.forEach(fn => fn(lang));
  },
  t: (): Translations => translations[currentLang] || translations.en,
  subscribe: (fn: (lang: LanguageCode) => void) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }
};
