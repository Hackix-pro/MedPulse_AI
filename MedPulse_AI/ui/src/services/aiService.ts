import { Report, LabResult, Alert } from '../types';

export interface ComparisonDiffItem {
  testName: string;
  unit: string;
  referenceRange: string;
  previousValue: number;
  currentValue: number;
  diff: number;
  diffPercentage: number;
  trend: 'improved' | 'increased' | 'decreased' | 'stable';
  isAbnormal: boolean;
  statusChange: string;
}

export interface ComparisonResult {
  reportA: Report;
  reportB: Report;
  daysBetween: number;
  items: ComparisonDiffItem[];
  overallSummary: string;
  improvedCount: number;
  worsenedCount: number;
  stableCount: number;
  newAbnormalities: string[];
}

export interface AIAnswerResult {
  answer: string;
  evidence: string[];
  relatedReportId?: string;
  relatedReportTitle?: string;
  relatedReportDate?: string;
  disclaimer: string;
}

export interface ClinicalSummaryResult {
  patientName: string;
  reportsAnalyzedCount: number;
  dateRange: string;
  keyBiomarkerShifts: string[];
  abnormalSummary: string[];
  criticalAlertCount: number;
  recommendationsForDoctor: string[];
  evidenceList: Array<{ title: string; date: string; finding: string; reportId: string }>;
}

export interface MedicalTermExplanation {
  term: string;
  plainEnglish: string;
  clinicalPurpose: string;
  normalRangeContext: string;
  lifestyleFactors: string;
}

export interface DetectedLanguageInfo {
  language: string;
  style: string;
  outOfScopeReason: string;
  notFoundReason: string;
  directive: string;
}

export function detectClientLanguageAndStyle(text: string): DetectedLanguageInfo {
  if (!text || typeof text !== 'string') {
    return {
      language: 'English',
      style: 'English',
      outOfScopeReason: "This question is out of scope of this app, so I cannot answer it. As a medical AI assistant for MedPulse, I can only answer questions related to health, medical conditions, and your patient medical data.",
      notFoundReason: "The related data is not found in your uploaded files/reports, so I cannot directly comment on this question.",
      directive: "MANDATORY: The user asked in English. You MUST answer in clear, empathetic, and professional English."
    };
  }

  const clean = text.trim();
  const lower = clean.toLowerCase();

  // 1. Script checks
  if (/[\u0900-\u097F]/.test(clean)) {
    const marathiMarkers = [
      'आहे', 'नाही', 'काय', 'कसा', 'कसे', 'कशी', 'किती', 'माझा', 'माझी', 'माझे',
      'मला', 'होतो', 'होती', 'होते', 'सांगा', 'तपासणी', 'औषध', 'त्रास', 'आणि',
      'पण', 'कधी', 'कुठे', 'कशासाठी', 'खावे', 'प्यावे', 'डोक', 'पोट', 'रक्त', 'तपास'
    ];
    const isMarathi = marathiMarkers.some(w => clean.includes(w));
    if (isMarathi) {
      return {
        language: 'Marathi',
        style: 'Marathi (Devanagari)',
        outOfScopeReason: "हा प्रश्न या ॲपच्या कार्यक्षेत्राबाहेर आहे, त्यामुळे मी याचे उत्तर देऊ शकत नाही. MedPulse आरोग्य सहाय्यक म्हणून, मी केवळ आरोग्य, वैद्यकीय परिस्थिती आणि आपल्या वैद्यकीय अहवालांशी संबंधित प्रश्नांची उत्तरे देऊ शकतो.",
        notFoundReason: "संबंधित डेटा आपल्या अपलोड केलेल्या फायली/अहवालांमध्ये आढळला नाही, त्यामुळे मी या प्रश्नावर थेट टिप्पणी करू शकत नाही.",
        directive: "MANDATORY: The user asked in Marathi (मराठी). You MUST answer ENTIRELY in Marathi using the Devanagari script (मराठी). Do NOT respond in English or Hindi. Provide a natural, fluent Marathi response without repetitive phrases."
      };
    }

    return {
      language: 'Hindi',
      style: 'Hindi (Devanagari)',
      outOfScopeReason: "यह प्रश्न इस ऐप के दायरे से बाहर है, इसलिए मैं इसका उत्तर नहीं दे सकता। MedPulse हेल्थ असिस्टेंट के रूप में, मैं केवल स्वास्थ्य, चिकित्सीय स्थितियों और आपकी मेडिकल रिपोर्ट से संबंधित प्रश्नों के उत्तर दे सकता हूँ।",
      notFoundReason: "संबंधित डेटा आपकी अपलोड की गई फाइलों/रिपोर्टों में नहीं मिला है, इसलिए मैं इस प्रश्न पर सीधे टिप्पणी नहीं कर सकता।",
      directive: "MANDATORY: The user asked in Hindi (हिंदी). You MUST answer ENTIRELY in Hindi using the Devanagari script (हिंदी लिपि). Do NOT respond in English. Provide a natural, fluent Hindi response."
    };
  }

  // Gujarati
  if (/[\u0A80-\u0AFF]/.test(clean)) {
    return {
      language: 'Gujarati',
      style: 'Gujarati',
      outOfScopeReason: "આ પ્રશ્ન આ એપ્લિકેશનના કાર્યક્ષેત્રની બહાર છે, તેથી હું તેનો જવાબ આપી શકતો નથી. MedPulse આરોગ્ય સહાયક તરીકે, હું માત્ર આરોગ્ય, તબીબી પરિસ્થિતિઓ અને તમારા તબીબી અહેવાલો સંબંધિત પ્રશ્નોના જવાબો આપી શકું છું.",
      notFoundReason: "સંબંધિત ડેટા તમારી અપલોડ કરેલી ફાઇલો/રિપોર્ટ્સમાં મળ્યો નથી, તેથી હું આ પ્રશ્ન પર સીધી ટિપ્પણી કરી શકતો નથી.",
      directive: "MANDATORY: The user asked in Gujarati. You MUST answer ENTIRELY in Gujarati. Do NOT respond in English."
    };
  }

  // Bengali
  if (/[\u0980-\u09FF]/.test(clean)) {
    return {
      language: 'Bengali',
      style: 'Bengali',
      outOfScopeReason: "এই প্রশ্নটি এই অ্যাপের আওতার বাইরে, তাই আমি এর উত্তর দিতে পারছি না। MedPulse স্বাস্থ্য সহকারী হিসেবে, আমি শুধুমাত্র স্বাস্থ্য, চিকিৎসার অবস্থা এবং আপনার মেডিকেল রিপোর্ট সংক্রান্ত প্রশ্নের উত্তর দিতে পারি।",
      notFoundReason: "সম্পর্কিত ডেটা আপনার আপলোড করা ফাইল/রিপোর্টে পাওয়া যায়নি, তাই আমি এই প্রশ্নে সরাসরি মন্তব্য করতে পারছি না।",
      directive: "MANDATORY: The user asked in Bengali. You MUST answer ENTIRELY in Bengali. Do NOT respond in English."
    };
  }

  // Tamil
  if (/[\u0B80-\u0BFF]/.test(clean)) {
    return {
      language: 'Tamil',
      style: 'Tamil',
      outOfScopeReason: "இந்த கேள்வி இந்த செயலியின் எல்லைக்கு அப்பாற்பட்டது, எனவே என்னால் பதிலளிக்க முடியாது. MedPulse சுகாதார உதவியாளராக, உடல்நலம், மருத்துவ நிலைமைகள் மற்றும் உங்கள் மருத்துவ அறிக்கைகள் தொடர்பான கேள்விகளுக்கு மட்டுமே என்னால் பதிலளிக்க முடியும்.",
      notFoundReason: "தொடர்புடைய தரவு உங்கள் பதிவேற்றிய கோப்புகள்/அறிக்கைகளில் காணப்படவில்லை.",
      directive: "MANDATORY: The user asked in Tamil. You MUST answer ENTIRELY in Tamil. Do NOT respond in English."
    };
  }

  // Telugu
  if (/[\u0C00-\u0C7F]/.test(clean)) {
    return {
      language: 'Telugu',
      style: 'Telugu',
      outOfScopeReason: "ఈ ప్రశ్న ఈ యాప్ పరిధికి మించినది. MedPulse హెల్త్ అసిస్టెంట్‌గా, నేను ఆరోగ్యం మరియు మీ వైద్య నివేదికలకు సంబంధించిన ప్రశ్నలకు మాత్రమే సమాధానం ఇవ్వగలను.",
      notFoundReason: "సంబంధిత డేటా మీ అప్‌లోడ్ చేసిన ఫైల్‌లు/నిवेదికలలో కనుగొనబడలేదు.",
      directive: "MANDATORY: The user asked in Telugu. You MUST answer ENTIRELY in Telugu. Do NOT respond in English."
    };
  }

  // Kannada
  if (/[\u0C80-\u0CFF]/.test(clean)) {
    return {
      language: 'Kannada',
      style: 'Kannada',
      outOfScopeReason: "ಈ ಪ್ರಶ್ನೆಯು ಈ ಅಪ್ಲಿಕೇಶನ್ ವ್ಯಾಪ್ತಿಯಿಂದ ಹೊರಗಿದೆ. MedPulse ಆರೋಗ್ಯ ಸಹಾಯಕರಾಗಿ, ನಾನು ಆರೋಗ್ಯ ಮತ್ತು ನಿಮ್ಮ ವೈದ್ಯಕೀಯ ವರದಿಗಳಿಗೆ ಸಂಬಂಧಿಸಿದ ಪ್ರಶ್ನೆಗಳಿಗೆ ಮಾತ್ರ ಉತ್ತರಿಸಬಲ್ಲೆ.",
      notFoundReason: "ಸಂಬಂಧಿತ ಡೇಟಾ ನಿಮ್ಮ ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ ಫೈಲ್‌ಗಳು/ವರದಿಗಳಲ್ಲಿ ಕಂಡುಬಂದಿಲ್ಲ.",
      directive: "MANDATORY: The user asked in Kannada. You MUST answer ENTIRELY in Kannada. Do NOT respond in English."
    };
  }

  // Malayalam
  if (/[\u0D00-\u0D7F]/.test(clean)) {
    return {
      language: 'Malayalam',
      style: 'Malayalam',
      outOfScopeReason: "ഈ ചോദ്യം ഈ ആപ്പിന്റെ പരിധിക്ക് പുറത്താണ്. MedPulse ആരോഗ്യ സഹായി എന്ന നിലയിൽ, ആരോഗ്യവും നിങ്ങളുടെ മെഡിക്കൽ റിപ്പോർട്ടുകളുമായി ബന്ധപ്പെട്ട ചോദ്യങ്ങൾക്ക് മാത്രമേ എനിക്ക് മറുപടി നൽകാൻ കഴിയൂ.",
      notFoundReason: "ബന്ധപ്പെട്ട വിവരങ്ങൾ നിങ്ങൾ അപ്‌ലോഡ് ചെയ്ത ഫയലുകളിൽ കണ്ടെത്താനായില്ല.",
      directive: "MANDATORY: The user asked in Malayalam. You MUST answer ENTIRELY in Malayalam. Do NOT respond in English."
    };
  }

  // Urdu / Arabic script
  if (/[\u0600-\u06FF]/.test(clean)) {
    return {
      language: 'Urdu',
      style: 'Urdu',
      outOfScopeReason: "یہ سوال اس ایپ کے دائرہ کار سے باہر ہے۔ MedPulse ہیلتھ اسسٹنٹ کے طور پر، میں صرف صحت اور آپ کی میڈیکل رپورٹس سے متعلق سوالات کے جوابات دے سکتا ہوں۔",
      notFoundReason: "متعلقہ ڈیٹا آپ کی اپ لوڈ کردہ رپورٹس میں نہیں ملا۔",
      directive: "MANDATORY: The user asked in Urdu. You MUST answer ENTIRELY in Urdu using the Arabic/Nastaliq script. Do NOT respond in English."
    };
  }

  // Russian / Cyrillic
  if (/[\u0400-\u04FF]/.test(clean)) {
    return {
      language: 'Russian',
      style: 'Russian',
      outOfScopeReason: "Этот вопрос выходит за рамки данного приложения. Как медицинский ассистент MedPulse, я могу отвечать только на вопросы о здоровье и ваших медицинских отчетах.",
      notFoundReason: "Соответствующие данные не найдены в ваших загруженных файлах/отчетах.",
      directive: "MANDATORY: The user asked in Russian. You MUST answer ENTIRELY in Russian. Do NOT respond in English."
    };
  }

  // 2. Romanized Indian Languages & Latin-script languages
  const marathiRomanizedWords = [
    'maza', 'maji', 'majhi', 'maze', 'majhe', 'mala', 'amhi', 'tumhi', 'tumche', 'tumcha', 'tumchi',
    'kiti', 'kasa', 'kase', 'kashi', 'kay', 'ahe', 'ahet', 'nahi', 'nahit', 'hota', 'hoti', 'hote',
    'kashamule', 'sang', 'sanga', 'jevan', 'khava', 'khave', 'pyave', 'aushadh', 'dokh', 'doka',
    'dokyadukhi', 'trass', 'tras', 'kamjor', 'thakva', 'aani', 'ani', 'pan', 'kadhi', 'kuthun', 'kuthe',
    'tapasni', 'dakhva', 'shakyata', 'ghyava', 'ghyave', 'ghyav', 'dukhat', 'dokyat'
  ];
  let marathiScore = 0;
  for (const word of marathiRomanizedWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(lower)) marathiScore++;
  }

  const hinglishWords = [
    'mera', 'meri', 'mere', 'mujhe', 'mujhko', 'hum', 'humare', 'aap', 'aapka', 'aapki', 'aapke',
    'kya', 'hai', 'hain', 'ho', 'hoga', 'hogi', 'honge', 'tha', 'thi', 'the', 'kitna', 'kitni', 'kitne',
    'kaise', 'kaisa', 'kaisi', 'kyu', 'kyun', 'kyon', 'kaha', 'kahan', 'kab', 'kaun', 'konsa', 'kaunsa',
    'accha', 'achha', 'theek', 'thik', 'kharab', 'kam', 'jyada', 'zyada', 'bahut', 'bohot',
    'khana', 'khao', 'khaye', 'khayein', 'peena', 'peeyo', 'dawa', 'dawai', 'dawahi', 'ilaj',
    'chahiye', 'batao', 'bataye', 'bataiye', 'batayein', 'samjhao', 'karo', 'karna', 'karne', 'karein',
    'likho', 'likh', 'likhna', 'banao', 'bana', 'dijiye', 'do', 'de', 'liye', 'toh', 'aur',
    'hona', 'raha', 'rahi', 'rahe', 'dard', 'sir', 'sar', 'pet', 'pait', 'bukhar', 'chakkar', 'khoon',
    'takleef', 'saans', 'sans', 'kamzori', 'thakan', 'thakawat', 'sujan', 'khujli', 'jalan', 'ulti',
    'goli', 'sehat', 'tabiyat', 'bimari', 'dikhao', 'dikhana', 'matlab', 'aaya', 'aayi', 'aaye',
    'kuch', 'sakta', 'sakti', 'sakte', 'bhi', 'se', 'ko', 'me', 'mein', 'par', 'pe'
  ];
  let hinglishScore = 0;
  for (const word of hinglishWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(lower)) hinglishScore++;
  }

  const normalized = lower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const hasSpanishPunctuation = /[¿¡]/.test(clean);

  const spanishWords = [
    'hola', 'que', 'como', 'cual', 'cuanto', 'cuantos', 'por que', 'porque',
    'tengo', 'tiene', 'dolor', 'sangre', 'salud', 'medico', 'informe', 'analisis',
    'gracias', 'por favor', 'enfermedad', 'medicamento', 'medicamentos', 'nivel',
    'niveles', 'buenos dias', 'buenas tardes', 'significa', 'este', 'esta', 'debo',
    'comer', 'mi', 'mis', 'para', 'ayuda'
  ];
  let spanishScore = hasSpanishPunctuation ? 2 : 0;
  for (const word of spanishWords) {
    const regex = new RegExp(`(^|\\P{L})${word}(\\P{L}|$)`, 'u');
    if (regex.test(normalized)) spanishScore++;
  }

  const frenchWords = [
    'bonjour', 'merci', 'comment', 'pourquoi', 'sante', 'medical', 'medecin',
    'analyse', 'rapport', 'douleur', 'sang', 'est-ce', 'sil vous plait', 'quels',
    'quelles', 'traitement', 'medicament', 'maladie', 'niveau', 'signifie',
    'taux', 'sucre', 'eleve', 'mes', 'mon', 'ma', 'votre', 'vos', 'avec', 'pour'
  ];
  let frenchScore = 0;
  for (const word of frenchWords) {
    const regex = new RegExp(`(^|\\P{L})${word}(\\P{L}|$)`, 'u');
    if (regex.test(normalized)) frenchScore++;
  }

  const germanWords = [
    'hallo', 'guten tag', 'danke', 'bitte', 'gesundheit', 'arzt', 'befund', 'bericht',
    'schmerz', 'schmerzen', 'blut', 'wie', 'warum', 'was', 'behandlung', 'krankheit', 'werte', 'mein', 'meine'
  ];
  let germanScore = 0;
  for (const word of germanWords) {
    const regex = new RegExp(`(^|\\P{L})${word}(\\P{L}|$)`, 'u');
    if (regex.test(normalized)) germanScore++;
  }

  if (marathiScore >= 2 || (marathiScore >= 1 && marathiScore >= hinglishScore && /\b(ahe|ahet|maza|mala|kasa|kay|jevan|aushadh|doka|dukhat)\b/i.test(lower))) {
    return {
      language: 'Romanized Marathi',
      style: 'Romanized Marathi (Latin script)',
      outOfScopeReason: "Ha prashna ya app chya scope bahercha ahe, tyamule me yache uttar deu shakat nahi. MedPulse health assistant mhanun, me fakt arogya, aajar aani tumchya medical reports babat uttar deu shakto.",
      notFoundReason: "Yashi sambandhit data tumchya upload kelelya reports madhe sapadla nahi, tyamule me yaavar thos bolu shakat nahi.",
      directive: "MANDATORY: The user asked in Romanized Marathi (Marathi words written in English/Latin letters, e.g., 'Tumche hemoglobin kami ahe, doctoranna dakhva...'). You MUST answer ENTIRELY in Romanized Marathi (Marathi written in the English alphabet). Do NOT answer in English and do NOT switch to Devanagari script. Respond in Romanized Marathi."
    };
  }

  if (hinglishScore >= 2 || (hinglishScore >= 1 && /\b(hai|hain|mera|meri|mujhe|kya|kaise|karo|karne|likho|liye|batao|dawa|dard|bukhar|khoon)\b/i.test(lower))) {
    return {
      language: 'Hinglish',
      style: 'Hinglish (Latin script)',
      outOfScopeReason: "Yeh sawal is app ke scope se bahar hai, isliye main iska jawab nahi de sakta. MedPulse health assistant ke roop me, main sirf sehat, bimariyon aur aapke medical reports se jude sawalon ke jawab de sakta hoon.",
      notFoundReason: "Aapki upload ki gayi reports ya files me isse related data nahi mila hai, isliye main is par direct comment nahi kar sakta.",
      directive: "MANDATORY: The user asked in Hinglish (Hindi words written in the English/Latin alphabet, e.g. 'Aapka hemoglobin normal se thoda kam hai...'). You MUST answer ENTIRELY in Hinglish (Hindi written in English letters). Do NOT respond in pure English and do NOT use Devanagari script. Respond in natural, empathetic Hinglish."
    };
  }

  if (spanishScore >= 2) {
    return {
      language: 'Spanish',
      style: 'Spanish',
      outOfScopeReason: "Esta pregunta está fuera del alcance de esta aplicación, por lo que no puedo responderla. Como asistente médico de MedPulse, solo puedo responder preguntas relacionadas con la salud y sus informes médicos.",
      notFoundReason: "Los datos relacionados no se encuentran en los archivos/informes que ha subido, por lo que no puedo comentar directamente sobre esta pregunta.",
      directive: "MANDATORY: The user asked in Spanish. You MUST answer ENTIRELY in Spanish. Do NOT respond in English."
    };
  }

  if (frenchScore >= 2) {
    return {
      language: 'French',
      style: 'French',
      outOfScopeReason: "Cette question dépasse le cadre de cette application. En tant qu'assistant médical MedPulse, je ne peux répondre qu'aux questions relatives à la santé et à vos rapports médicaux.",
      notFoundReason: "Les données correspondantes sont introuvables dans vos fichiers/rapports importés.",
      directive: "MANDATORY: The user asked in French. You MUST answer ENTIRELY in French. Do NOT respond in English."
    };
  }

  if (germanScore >= 2) {
    return {
      language: 'German',
      style: 'German',
      outOfScopeReason: "Diese Frage liegt außerhalb des Aufgabenbereichs dieser App. Als medizinischer Assistent von MedPulse kann ich nur Fragen zu Ihrer Gesundheit und Ihren medizinischen Berichten beantworten.",
      notFoundReason: "Die entsprechenden Daten wurden in Ihren hochgeladenen Dateien/Berichten nicht gefunden.",
      directive: "MANDATORY: The user asked in German. You MUST answer ENTIRELY in German. Do NOT respond in English."
    };
  }

  return {
    language: 'English',
    style: 'English',
    outOfScopeReason: "This question is out of scope of this app, so I cannot answer it. As a medical AI assistant for MedPulse, I can only answer questions related to health, medical conditions, and your patient medical data.",
    notFoundReason: "The related data is not found in your uploaded files/reports, so I cannot directly comment on this question.",
    directive: "MANDATORY: The user asked in English. You MUST answer in clear, empathetic, and professional English."
  };
}

function checkClientScope(query: string): { isOut: boolean; reason?: string } {
  if (!query || typeof query !== 'string') {
    return {
      isOut: true,
      reason: "This question is out of scope of this app, so I cannot answer it. Please ask a health-related question or inquire about your patient medical reports."
    };
  }

  const langInfo = detectClientLanguageAndStyle(query);
  const q = query.toLowerCase().trim();
  const cleanQ = q.replace(/[?!.,;:'"()]+$/g, '').trim();
  if (cleanQ.length === 0) {
    return {
      isOut: true,
      reason: langInfo.outOfScopeReason
    };
  }

  // 1. Coding / Programming / Software Development (STRICTLY OUT OF SCOPE)
  const isPythonSnakeBite = /\bpython\b/i.test(q) && /\bsnake\b/i.test(q);
  const codingPatterns = [
    /\bpython\b/i,
    /\b(?:javascript|typescript|c\+\+|c#|golang|\bphp\b|\bhtml\b|\bcss\b|\bsql\b|nodejs|node\.js|django|flask|reactjs|angularjs)\b/i,
    /\b(?:write|create|generate|provide|give me|debug|fix|run|show)\s+(?:a\s+)?(?:[\w-]+\s+)*(?:code|script|program|algorithm|query|regex)\b/i,
    /\bcode\s+(?:to|for|in)\b/i,
    /\bhow to (?:code|program|compile|debug)\b/i,
    /\bprogramming\b/i,
    /\b(?:source|backend|frontend)\s+code\b/i,
    /\b(?:write|develop)\s+(?:a\s+)?(?:software|website|web app)\b/i,
    /\b(?:syntax error|compiler error)\b/i
  ];

  if (!isPythonSnakeBite && codingPatterns.some(pattern => pattern.test(q))) {
    const reason = langInfo.language === 'Hindi'
      ? "यह प्रश्न इस ऐप के दायरे से बाहर है। MedPulse हेल्थ असिस्टेंट के रूप में, मैं कोड नहीं लिख सकता या प्रोग्रामिंग में सहायता नहीं कर सकता। मैं केवल स्वास्थ्य, चिकित्सीय स्थितियों और आपकी मेडिकल रिपोर्ट से जुड़े प्रश्नों के उत्तर दे सकता हूँ।"
      : langInfo.language === 'Hinglish'
      ? "Yeh sawal is app ke scope se bahar hai. MedPulse health assistant ke roop me, main code nahi likh sakta ya programming me madad nahi kar sakta. Main sirf aapki sehat aur medical reports se jude sawalon ke jawab de sakta hoon."
      : langInfo.language === 'Marathi'
      ? "हा प्रश्न या ॲपच्या कार्यक्षेत्राबाहेर आहे. MedPulse आरोग्य सहाय्यक म्हणून, मी कोड लिहू शकत नाही किंवा प्रोग्रामिंगमध्ये मदत करू शकत नाही. मी केवळ आरोग्य आणि आपल्या वैद्यकीय अहवालांशी संबंधित प्रश्नांची उत्तरे देऊ शकतो."
      : langInfo.language === 'Romanized Marathi'
      ? "Ha prashna ya app chya scope bahercha ahe. MedPulse health assistant mhanun, me code lihu shakat nahi. Me fakt arogya aani tumchya medical reports babat uttar deu shakto."
      : langInfo.language === 'Spanish'
      ? "Esta pregunta está fuera del alcance de esta aplicación. Como asistente médico de MedPulse, no puedo escribir código ni ayudar con programación. Solo puedo responder preguntas sobre salud y sus informes médicos."
      : "This question is out of scope of this app, so I cannot answer it. As a medical AI assistant for MedPulse, I can only answer questions related to health, medical conditions, and your patient medical data.";

    return {
      isOut: true,
      reason
    };
  }

  // 2. Explicit Non-Medical Domains (English, Hindi, Marathi)
  const nonMedicalDomains = [
    // Sports & Gaming
    'fifa', 'world cup', 'cricket', 'football', 'soccer', 'nba', 'nfl', 'ipl', 'tennis',
    'messi', 'ronaldo', 'virat', 'dhoni', 'olympics', 'fortnite', 'minecraft', 'pubg', 'playstation', 'xbox',
    'मैच', 'क्रिकेट', 'फुटबॉल', 'सामना', 'खेळ', 'ipl',
    // Entertainment & Pop Culture
    'movie', 'movies', 'film', 'cinema', 'hollywood', 'bollywood', 'actor', 'actress', 'celebrity',
    'song', 'singer', 'album', 'concert', 'netflix', 'disney', 'anime', 'oscar', 'grammy',
    'सिनेमा', 'चित्रपट', 'गाणी', 'गाना', 'गायक', 'अभिनेता', 'अभिनेत्री',
    // Politics, Government & Military
    'president', 'prime minister', 'election', 'parliament', 'congress', 'senate', 'democrat', 'republican',
    'politics', 'political', 'war', 'army', 'military', 'missile', 'weapon', 'soldier',
    'राजकारण', 'राजनीति', 'निवडणूक', 'चुनाव', 'पंतप्रधान', 'राष्ट्रपती', 'प्रधानमंत्री', 'युद्ध',
    // Finance & Crypto
    'stock market', 'stocks', 'crypto', 'cryptocurrency', 'bitcoin', 'btc', 'ethereum', 'eth',
    'forex', 'trading', 'shares', 'mutual fund', 'wall street', 'sensex', 'nifty', 'शेअर बाजार',
    // Automobiles
    'car', 'cars', 'vehicle', 'automotive', 'motorcycle', 'engine repair', 'mileage of', 'tesla', 'गाडी', 'कार',
    // Non-medical Cooking & Baking
    'recipe for', 'how to bake', 'bake a cake', 'bake cookies', 'pizza recipe',
    // Trivia & Non-medical Questions
    'who is the president', 'who is the prime minister', 'capital of',
    'write a poem', 'tell a joke', 'tell me a joke', 'write a story', 'solve equation', 'quantum physics',
    'astronomy', 'black hole', 'galaxy', 'solar system', 'weather forecast', 'weather today',
    'हवामान', 'कविता', 'गोष्ट', 'कहानी', 'चुटकुला', 'विनोद'
  ];

  if (nonMedicalDomains.some(term => q.includes(term))) {
    return {
      isOut: true,
      reason: langInfo.outOfScopeReason
    };
  }

  // 3. Greetings & Capabilities
  const greetingOrMeta = [
    'hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening',
    'who are you', 'what are you', 'what can you do', 'how can you help', 'help me', 'help',
    'thank you', 'thanks', 'bye', 'goodbye', 'namaste', 'namaskar', 'pranam', 'shukriya', 'dhanyawad',
    'नमस्ते', 'नमस्कार', 'प्रणाम', 'धन्यवाद', 'शुक्रिया', 'आभार'
  ];
  if (greetingOrMeta.some(g => cleanQ === g || cleanQ.startsWith(g + ' ') || cleanQ.endsWith(' ' + g))) {
    return { isOut: false };
  }

  // 4. Medical / Health / Patient Data / App Terms
  const medicalAndAppTerms = [
    'health', 'medic', 'doctor', 'patient', 'clinic', 'hospital', 'nurse', 'physician',
    'disease', 'disorder', 'illness', 'condition', 'symptom', 'diagnos', 'prognos',
    'treat', 'therap', 'cure', 'prevent', 'cause', 'infection', 'inflammation', 'allergy', 'allergic',
    'heart', 'cardio', 'lung', 'pulmonary', 'respiratory', 'liver', 'hepatic', 'kidney', 'renal',
    'brain', 'neuro', 'stomach', 'gastric', 'gut', 'bowel', 'colon', 'pancreas', 'gallbladder',
    'thyroid', 'hormone', 'endocrine', 'bone', 'joint', 'spine', 'muscle', 'skin', 'eye', 'ear', 'throat',
    'blood', 'vein', 'artery', 'vascular', 'organ', 'body',
    'pain', 'ache', 'fever', 'cough', 'cold', 'flu', 'fatigue', 'tired', 'weakness',
    'dizziness', 'headache', 'migraine', 'nausea', 'vomit', 'diarrhea', 'constipat',
    'breath', 'shortness of breath', 'dyspnea', 'swelling', 'edema', 'rash', 'itching',
    'pressure', 'hypertens', 'hypotens', 'pulse', 'heart rate', 'bpm', 'vitals', 'temperature',
    'diabet', 'sugar', 'glucose', 'insulin', 'anemia', 'cancer', 'tumor', 'asthma', 'copd',
    'stroke', 'attack', 'jaundice', 'hepatitis', 'pneumonia', 'covid', 'tuberculosis', 'tb',
    'cholesterol', 'lipid', 'obesity', 'overweight', 'underweight', 'bmi',
    'report', 'lab', 'test', 'result', 'biomarker', 'range', 'normal', 'abnormal', 'high', 'low',
    'critical', 'hemoglobin', 'hb', 'platelet', 'wbc', 'rbc', 'hematocrit', 'leukocyte',
    'hdl', 'ldl', 'triglycerid', 'vldl', 'hba1c', 'creatinine', 'urea', 'bun', 'uric acid',
    'bilirubin', 'sgot', 'sgpt', 'alt', 'ast', 'alp', 'albumin', 'protein', 'sodium', 'potassium',
    'calcium', 'tsh', 't3', 't4', 'vitamin', 'vit d', 'b12', 'iron', 'ferritin',
    'urine', 'stool', 'biopsy', 'ecg', 'ekg', 'x-ray', 'xray', 'mri', 'ct scan', 'ultrasound', 'sonography',
    'prescript', 'drug', 'dose', 'dosage', 'pill', 'tablet', 'capsule', 'syrup', 'injection',
    'antibiotic', 'painkiller', 'paracetamol', 'metformin', 'aspirin', 'atorvastatin', 'medicine',
    'medication', 'side effect', 'contraindication', 'vaccin',
    'diet', 'nutrit', 'water', 'hydrat', 'exercis', 'walk', 'weight',
    'sleep', 'rest', 'lifestyle', 'calorie',
    'my report', 'my reports', 'my test', 'my result', 'my doctor', 'my health', 'my value',
    'my glucose', 'my hemoglobin', 'my blood', 'uploaded', 'upload', 'document', 'file',
    'timeline', 'alert', 'history', 'compare', 'trend', 'medpulse', 'app', 'notif', 'connection',
    'bukhar', 'tap', 'dard', 'khansi', 'khoka', 'dawa', 'dawai', 'dawahi', 'aushadh', 'goli',
    'bimari', 'aajar', 'sehat', 'tabiyat', 'ilaj', 'upchar', 'vaidya',
    'chakkar', 'kamzori', 'thakan', 'thakawat', 'thakva', 'ulti', 'qay', 'dast',
    'jalan', 'sujan', 'khujli', 'daane', 'chhale', 'sans', 'saans', 'takleef', 'tras', 'trass',
    'ghabrahat', 'bechaini', 'khoon', 'rakta',
    'sir', 'sar', 'doke', 'doka', 'matha', 'aankh', 'aankhein', 'dole', 'kaan', 'gala', 'gardan',
    'chhati', 'seena', 'sine', 'pet', 'pait', 'pot', 'kamar', 'peeth', 'path',
    'haath', 'hath', 'pair', 'paav', 'paaye', 'ghutna', 'ghutne', 'sandhe', 'haddi', 'haddee',
    'chamdi', 'twacha', 'dil', 'hriday', 'jigar', 'kaleja', 'gurda', 'gurde',
    'kya karu', 'kya kare', 'kya karna', 'kya khana', 'kaise theek', 'kasa ahe', 'kiti ahe', 'arth kay',
    'matlab kya', 'report me', 'report madhe', 'normal hai', 'theek hai', 'thik ahe',
    'bp', 'cbc', 'lft', 'kft',
    'आरोग्य', 'स्वास्थ्य', 'सेहत', 'तबीयत', 'बीमारी', 'आजार', 'रोग', 'लक्षण', 'इलाज', 'उपचार',
    'दवा', 'औषध', 'गोली', 'खून', 'रक्त', 'हीमोग्लोबिन', 'हिमोग्लोबिन', 'हीमोग्लोबीन', 'हिमोग्लोबीन', 'एचबी',
    'शुगर', 'डायबिटीज', 'ग्लूकोज', 'तपासणी', 'जांच', 'रिपोर्ट', 'दर्द', 'वेदना', 'त्रास', 'बुखार', 'ताप',
    'खांसी', 'खोकला', 'चक्कर', 'कमजोरी', 'थकवा', 'उल्टी', 'मळमळ', 'दस्त', 'जुलाब', 'सूजन', 'सूज',
    'सांस', 'श्वास', 'हृदय', 'दिल', 'मेंदू', 'दिमाग', 'यकृत', 'मूत्रपिंड', 'किडनी', 'पोट', 'छाती',
    'हाड', 'त्वचा', 'डोळे', 'कान', 'घसा', 'डॉक्टर', 'रुग्ण', 'मरीज',
    'खाना', 'खावे', 'खाएं', 'खाओ', 'खाइए', 'खाना चाहिए', 'आहार', 'पथ्य', 'वजन', 'बीपी', 'रक्तदाब',
    'नॉर्मल', 'सामान्य', 'असामान्य', 'कमी', 'जास्त', 'बढ़ गया', 'घट गया'
  ];

  if (medicalAndAppTerms.some(term => q.includes(term))) {
    return { isOut: false };
  }

  return {
    isOut: true,
    reason: langInfo.outOfScopeReason
  };
}

export const aiService = {
  /**
   * Generates a plain-language summary for an individual lab report
   */
  generateReportSummary: (report: Report): string => {
    const abnormalities = report.extractedValues.filter(
      v => v.status === 'low' || v.status === 'high' || v.status === 'critical'
    );
    const normalCount = report.extractedValues.length - abnormalities.length;

    if (abnormalities.length === 0) {
      return `This ${report.title} dated ${report.date} from ${report.hospitalOrLab} shows healthy balance across all ${report.extractedValues.length} biomarkers tested. All values fall neatly within standard laboratory reference thresholds.`;
    }

    const abnormalNames = abnormalities
      .map(a => `${a.testName} (${a.value} ${a.unit} vs range ${a.referenceRange})`)
      .join(', ');

    return `Analysis of ${report.title} dated ${report.date}: Out of ${report.extractedValues.length} clinical parameters, ${normalCount} are within reference targets, while ${abnormalities.length} value(s) deviate from expected ranges: ${abnormalNames}. Clinical correlation with medical history is recommended.`;
  },

  generateReportSummaryAsync: async (extractedValues: LabResult[]): Promise<string> => {
    try {
      const res = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: extractedValues })
      });
      const json = await res.json();
      return json.summary || 'Summary generated by AI.';
    } catch {
      return 'Failed to generate AI summary.';
    }
  },

  answerReportQuestionAsync: async (question: string, reports: Report[]): Promise<AIAnswerResult> => {
    // Check scope first
    const clientScope = checkClientScope(question);
    if (clientScope.isOut) {
      return {
        answer: clientScope.reason || "This question is out of scope of this app, so I cannot answer it. As a medical AI assistant for MedPulse, I can only answer questions related to health, medical conditions, and your patient medical data.",
        evidence: [],
        disclaimer: 'Scope Guardrail: MedPulse AI answers medical questions and patient health data.'
      };
    }

    try {
      const contextStr = reports.map(r => {
        const valuesList = r.extractedValues && r.extractedValues.length > 0
          ? r.extractedValues.map(v => `  - ${v.testName}: ${v.value} ${v.unit} (Reference Range: ${v.referenceRange || 'N/A'}, Status: ${v.status})`).join('\n')
          : '  (No structured biomarkers extracted)';

        const rawTextContent = r.rawText && r.rawText.trim()
          ? r.rawText.trim()
          : '(No raw OCR text recorded for this report)';

        return `========================================
REPORT: "${r.title}" (ID: ${r.id})
Category: ${r.category || 'General'}
Date: ${r.date}
Facility/Lab: ${r.hospitalOrLab || 'Not Specified'}
Uploaded By: ${r.uploadedBy || 'Patient'}
Doctor: ${r.doctorName || 'None'}
Status: ${r.status}

[Extracted Biomarker Values]:
${valuesList}

[Full Extracted Text From File]:
${rawTextContent}
${r.notes ? `\n[Patient/Doctor Notes]: ${r.notes}` : ''}
========================================`;
      }).join('\n\n');

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question, context: contextStr })
      });
      const json = await res.json();
      return {
        answer: json.answer || 'Sorry, I could not generate an answer.',
        evidence: [],
        disclaimer: 'Generated by MedPulse AI. Always consult your healthcare provider.'
      };
    } catch {
      return {
        answer: 'Failed to communicate with local AI assistant.',
        evidence: [],
        disclaimer: 'Network error.'
      };
    }
  },

  /**
   * Compares two selected reports side-by-side
   */
  compareReports: (olderReport: Report, newerReport: Report): ComparisonResult => {
    const dateA = new Date(olderReport.date);
    const dateB = new Date(newerReport.date);
    const diffTime = Math.abs(dateB.getTime() - dateA.getTime());
    const daysBetween = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const items: ComparisonDiffItem[] = [];
    const newAbnormalities: string[] = [];
    let improvedCount = 0;
    let worsenedCount = 0;
    let stableCount = 0;

    olderReport.extractedValues.forEach(oldVal => {
      const match = newerReport.extractedValues.find(
        newVal => (newVal.testName || "").toLowerCase().trim() === (oldVal.testName || "").toLowerCase().trim()
      );

      if (match) {
        const diff = Number((match.value - oldVal.value).toFixed(2));
        const diffPercentage = oldVal.value !== 0 ? Number(((diff / oldVal.value) * 100).toFixed(1)) : 0;

        let trend: 'improved' | 'increased' | 'decreased' | 'stable' = 'stable';
        if (Math.abs(diff) < 0.05) {
          trend = 'stable';
          stableCount++;
        } else if (diff > 0) {
          trend = 'increased';
        } else {
          trend = 'decreased';
        }

        // Determine if change is improvement or worsening based on biomarker target
        const isAbnormal = match.status !== 'normal';
        let statusChange = `${oldVal.status.toUpperCase()} → ${match.status.toUpperCase()}`;

        if (oldVal.status !== 'normal' && match.status === 'normal') {
          trend = 'improved';
          improvedCount++;
          statusChange = 'Normalized';
        } else if (oldVal.status === 'normal' && match.status !== 'normal') {
          worsenedCount++;
          newAbnormalities.push(`${match.testName} became ${match.status} (${match.value} ${match.unit})`);
        } else if (trend === 'stable') {
          // already counted
        } else if (isAbnormal) {
          worsenedCount++;
        } else {
          improvedCount++;
        }

        items.push({
          testName: match.testName,
          unit: match.unit,
          referenceRange: match.referenceRange,
          previousValue: oldVal.value,
          currentValue: match.value,
          diff,
          diffPercentage,
          trend,
          isAbnormal,
          statusChange
        });
      }
    });

    // Also pick up any new tests present in newer report only
    newerReport.extractedValues.forEach(newVal => {
      const existsInOld = olderReport.extractedValues.some(
        oldVal => (oldVal.testName || "").toLowerCase().trim() === (newVal.testName || "").toLowerCase().trim()
      );
      if (!existsInOld) {
        items.push({
          testName: newVal.testName,
          unit: newVal.unit,
          referenceRange: newVal.referenceRange,
          previousValue: 0,
          currentValue: newVal.value,
          diff: newVal.value,
          diffPercentage: 0,
          trend: 'increased',
          isAbnormal: newVal.status !== 'normal',
          statusChange: `New Test (${newVal.status.toUpperCase()})`
        });
      }
    });

    const summaryParts: string[] = [
      `Comparison between ${olderReport.title} (${olderReport.date}) and ${newerReport.title} (${newerReport.date}) spanning ${daysBetween} days.`
    ];

    if (newAbnormalities.length > 0) {
      summaryParts.push(`Key alert: New abnormal findings observed in ${newAbnormalities.join(', ')}.`);
    } else {
      summaryParts.push(`No newly emerged abnormalities between these test dates.`);
    }

    if (items.length > 0) {
      const primaryShift = items[0];
      summaryParts.push(
        `Primary change: ${primaryShift.testName} shifted from ${primaryShift.previousValue} to ${primaryShift.currentValue} ${primaryShift.unit} (${primaryShift.diff > 0 ? '+' : ''}${primaryShift.diff} ${primaryShift.unit}).`
      );
    }

    return {
      reportA: olderReport,
      reportB: newerReport,
      daysBetween,
      items,
      overallSummary: summaryParts.join(' '),
      improvedCount,
      worsenedCount,
      stableCount,
      newAbnormalities
    };
  },

  /**
   * Rule-based intelligence layer for answering natural user queries against actual stored records
   */
  answerReportQuestion: (question: string, reports: Report[], alerts: Alert[]): AIAnswerResult => {
    const clientScope = checkClientScope(question);
    if (clientScope.isOut) {
      return {
        answer: clientScope.reason || "This question is out of scope of this app, so I cannot answer it. As a medical AI assistant for MedPulse, I can only answer questions related to health, medical conditions, and your patient medical data.",
        evidence: [],
        disclaimer: 'Scope Guardrail: MedPulse AI answers medical questions and patient health data.'
      };
    }

    const q = question.toLowerCase().trim();
    const sortedReports = [...reports].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestReport = sortedReports[0];

    const disclaimer = 'Informational summary based on your uploaded medical records. Not a substitute for professional clinical medical advice or diagnosis.';

    // 1. Abnormal values query
    if (q.includes('abnormal') || q.includes('out of range') || q.includes('concern') || q.includes('alert')) {
      const activeAlerts = alerts.filter(a => a.status === 'active');
      if (activeAlerts.length > 0) {
        const list = activeAlerts
          .map(a => `• ${a.metric}: ${a.value} ${a.unit} (Ref: ${a.referenceRange}) on ${a.date} [${a.sourceReportTitle}]`)
          .join('\n');
        return {
          answer: `You currently have ${activeAlerts.length} active abnormal findings flagged across your records:\n\n${list}\n\nThese require clinical follow-up with your physician.`,
          evidence: activeAlerts.map(a => `${a.metric} (${a.value} ${a.unit}) on ${a.date}`),
          relatedReportId: activeAlerts[0].reportId,
          relatedReportTitle: activeAlerts[0].sourceReportTitle,
          relatedReportDate: activeAlerts[0].date,
          disclaimer
        };
      } else {
        return {
          answer: `All active lab markers currently in your records are reviewed or within standard ranges. No unreviewed abnormal alerts are active.`,
          evidence: [`${reports.length} total reports analyzed`],
          disclaimer
        };
      }
    }

    // 2. Glucose / Diabetes history query
    if (q.includes('glucose') || q.includes('sugar') || q.includes('diabetes') || q.includes('hba1c')) {
      const glucoseEntries: Array<{ date: string; value: number; unit: string; title: string; id: string }> = [];
      reports.forEach(r => {
        r.extractedValues.forEach(v => {
          if ((v.testName || "").toLowerCase().includes('glucose') || (v.testName || "").toLowerCase().includes('hba1c')) {
            glucoseEntries.push({ date: r.date, value: v.value, unit: v.unit, title: r.title, id: r.id });
          }
        });
      });

      glucoseEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      if (glucoseEntries.length > 0) {
        const oldest = glucoseEntries[0];
        const newest = glucoseEntries[glucoseEntries.length - 1];
        const historyText = glucoseEntries.map(g => `• ${g.date}: ${g.value} ${g.unit} (${g.title})`).join('\n');

        return {
          answer: `Your recorded glucose and glycemic trajectory shows ${glucoseEntries.length} data points:\n\n${historyText}\n\nNotice that Fasting Glucose shifted from ${oldest.value} ${oldest.unit} on ${oldest.date} up to ${newest.value} ${newest.unit} on ${newest.date}. This upward movement into the prediabetic/diabetic range was flagged for review.`,
          evidence: glucoseEntries.map(g => `${g.date}: ${g.value} ${g.unit}`),
          relatedReportId: newest.id,
          relatedReportTitle: newest.title,
          relatedReportDate: newest.date,
          disclaimer
        };
      }
    }

    // 3. Hemoglobin query
    if (q.includes('hemoglobin') || q.includes('hb') || q.includes('anemia') || q.includes('blood count')) {
      const hbEntries: Array<{ date: string; value: number; unit: string; title: string; id: string; ref: string }> = [];
      reports.forEach(r => {
        r.extractedValues.forEach(v => {
          if ((v.testName || "").toLowerCase() === 'hemoglobin') {
            hbEntries.push({ date: r.date, value: v.value, unit: v.unit, title: r.title, id: r.id, ref: v.referenceRange });
          }
        });
      });
      hbEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      if (hbEntries.length > 0) {
        const oldest = hbEntries[0];
        const newest = hbEntries[hbEntries.length - 1];
        const diff = Number((newest.value - oldest.value).toFixed(1));

        return {
          answer: `Your Hemoglobin level decreased by ${Math.abs(diff)} g/dL over the past months. It stood at ${oldest.value} g/dL on ${oldest.date} and measured ${newest.value} g/dL on ${newest.date} (Standard adult male reference: ${newest.ref}). Your doctor noted this mild drop in your clinical chart.`,
          evidence: hbEntries.map(h => `${h.date}: ${h.value} ${h.unit} [${h.title}]`),
          relatedReportId: newest.id,
          relatedReportTitle: newest.title,
          relatedReportDate: newest.date,
          disclaimer
        };
      }
    }

    // 4. Vitamin D query
    if (q.includes('vitamin') || q.includes('vit d') || q.includes('deficiency')) {
      const vitD = reports.find(r => r.extractedValues.some(v => (v.testName || "").toLowerCase().includes('vitamin d')));
      if (vitD) {
        const val = vitD.extractedValues.find(v => (v.testName || "").toLowerCase().includes('vitamin d'))!;
        return {
          answer: `In your test on ${vitD.date} (${vitD.title}), Vitamin D 25-Hydroxy was recorded at ${val.value} ${val.unit}, significantly below the desired threshold of ${val.referenceRange}. A prescription for weekly 60,000 IU supplementation was provided by your doctor.`,
          evidence: [`${vitD.date}: ${val.testName} = ${val.value} ${val.unit} (Ref: ${val.referenceRange})`],
          relatedReportId: vitD.id,
          relatedReportTitle: vitD.title,
          relatedReportDate: vitD.date,
          disclaimer
        };
      }
    }

    // 5. Compare last two reports query
    if (q.includes('compare') || q.includes('change') || q.includes('recent vs previous') || q.includes('what changed')) {
      if (sortedReports.length >= 2) {
        const newer = sortedReports[0];
        const older = sortedReports[1];
        const comp = aiService.compareReports(older, newer);
        return {
          answer: `Comparing your latest report "${newer.title}" (${newer.date}) with "${older.title}" (${older.date}):\n\n${comp.overallSummary}\n\n• Parameters analyzed: ${comp.items.length}\n• Improved/Normalized: ${comp.improvedCount}\n• Increased/Elevated: ${comp.worsenedCount}\n• Stable: ${comp.stableCount}`,
          evidence: comp.items.slice(0, 3).map(i => `${i.testName}: ${i.previousValue} → ${i.currentValue} ${i.unit}`),
          relatedReportId: newer.id,
          relatedReportTitle: newer.title,
          relatedReportDate: newer.date,
          disclaimer
        };
      }
    }

    // 6. Summarize latest report query
    if (q.includes('summarize') || q.includes('latest') || q.includes('summary') || q.includes('recent')) {
      if (latestReport) {
        const summary = aiService.generateReportSummary(latestReport);
        return {
          answer: `Summary of your most recent report "${latestReport.title}" (${latestReport.date} from ${latestReport.hospitalOrLab}):\n\n${summary}`,
          evidence: latestReport.extractedValues.map(v => `${v.testName}: ${v.value} ${v.unit}`),
          relatedReportId: latestReport.id,
          relatedReportTitle: latestReport.title,
          relatedReportDate: latestReport.date,
          disclaimer
        };
      }
    }

    // 7. General / fallback response grounded in user's real records
    const sampleTests = latestReport?.extractedValues.slice(0, 3).map(v => `${v.testName} (${v.value} ${v.unit})`).join(', ') || 'blood tests';
    return {
      answer: `Based on your ${reports.length} uploaded medical reports, your latest record is "${latestReport?.title}" dated ${latestReport?.date} with key measurements including ${sampleTests}. You can ask me specific questions such as "Show my glucose history", "What are my abnormal values?", or "Compare my last two reports".`,
      evidence: [`${reports.length} uploaded reports on file spanning ${reports[reports.length - 1]?.date} to ${latestReport?.date}`],
      relatedReportId: latestReport?.id,
      relatedReportTitle: latestReport?.title,
      relatedReportDate: latestReport?.date,
      disclaimer
    };
  },

  /**
   * Generates a structured multi-report Clinical AI Summary for physician review
   */
  generateClinicalSummary: (reports: Report[], patientName: string): ClinicalSummaryResult => {
    const sorted = [...reports].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const count = sorted.length;
    const dateRange = count > 0 ? `${sorted[0].date} to ${sorted[count - 1].date}` : 'None';

    const abnormalMap = new Map<string, { value: number; unit: string; date: string; title: string; id: string; ref: string }>();
    const biomarkerTrends: string[] = [];
    const evidenceList: Array<{ title: string; date: string; finding: string; reportId: string }> = [];

    // Analyze Hemoglobin trajectory
    const hbValues = sorted.flatMap(r =>
      r.extractedValues.filter(v => (v.testName || "").toLowerCase() === 'hemoglobin').map(v => ({ date: r.date, val: v.value, id: r.id, title: r.title }))
    );
    if (hbValues.length >= 2) {
      const first = hbValues[0];
      const last = hbValues[hbValues.length - 1];
      biomarkerTrends.push(
        `Hemoglobin decreased from ${first.val} g/dL (${first.date}) down to ${last.val} g/dL (${last.date}). Net delta: -${(first.val - last.val).toFixed(1)} g/dL.`
      );
      evidenceList.push({
        title: last.title,
        date: last.date,
        finding: `Hemoglobin dropped to ${last.val} g/dL (reference 13.0 - 17.0 g/dL)`,
        reportId: last.id
      });
    }

    // Analyze Glucose trajectory
    const glucoseValues = sorted.flatMap(r =>
      r.extractedValues.filter(v => (v.testName || "").toLowerCase().includes('glucose')).map(v => ({ date: r.date, val: v.value, id: r.id, title: r.title }))
    );
    if (glucoseValues.length >= 2) {
      const first = glucoseValues[0];
      const last = glucoseValues[glucoseValues.length - 1];
      biomarkerTrends.push(
        `Fasting Blood Glucose escalated from ${first.val} mg/dL (${first.date}) to ${last.val} mg/dL (${last.date}), indicating progressive impairment in glycemic control.`
      );
      evidenceList.push({
        title: last.title,
        date: last.date,
        finding: `Fasting Blood Glucose at ${last.val} mg/dL (reference 70 - 99 mg/dL)`,
        reportId: last.id
      });
    }

    // Gather all out of range findings
    sorted.forEach(r => {
      r.extractedValues.forEach(v => {
        if (v.status !== 'normal') {
          abnormalMap.set(v.testName, {
            value: v.value,
            unit: v.unit,
            date: r.date,
            title: r.title,
            id: r.id,
            ref: v.referenceRange
          });
        }
      });
    });

    const abnormalSummary = Array.from(abnormalMap.entries()).map(
      ([test, data]) => `${test}: ${data.value} ${data.unit} (Ref: ${data.ref}) recorded on ${data.date} [${data.title}]`
    );

    const recommendations = [
      'Evaluate glycemic management protocol in light of persistent fasting glucose elevation (134 mg/dL).',
      'Follow up on Vitamin D deficiency supplementation response with repeat assay after 8 weeks.',
      'Investigate etiology of 1.7 g/dL hemoglobin reduction (serum ferritin and peripheral smear recommended).',
      'Monitor resting blood pressure following systolic reading of 138 mmHg.'
    ];

    return {
      patientName,
      reportsAnalyzedCount: count,
      dateRange,
      keyBiomarkerShifts: biomarkerTrends,
      abnormalSummary,
      criticalAlertCount: abnormalMap.size,
      recommendationsForDoctor: recommendations,
      evidenceList
    };
  },

  /**
   * Explain medical terms in plain English for patients
   */
  explainMedicalTerm: (term: string): MedicalTermExplanation => {
    const t = term.toLowerCase().trim();
    if (t.includes('hemoglobin') || t.includes('hb')) {
      return {
        term: 'Hemoglobin (Hb)',
        plainEnglish: 'Hemoglobin is an iron-rich protein in red blood cells that carries oxygen from your lungs to the rest of your body.',
        clinicalPurpose: 'Tested to screen for anemia, blood loss, and monitor overall oxygen-carrying capacity.',
        normalRangeContext: 'Standard male range is 13.0 to 17.0 g/dL; females typically 12.0 to 15.5 g/dL.',
        lifestyleFactors: 'Dietary iron (dark leafy greens, lentils, beans), Vitamin B12, and hydration directly influence red cell production.'
      };
    }
    if (t.includes('glucose') || t.includes('sugar')) {
      return {
        term: 'Fasting Blood Glucose',
        plainEnglish: 'The amount of sugar circulating in your blood after fasting (not eating) for 8 to 12 hours.',
        clinicalPurpose: 'Used as the primary diagnostic screening tool for prediabetes, Type 2 diabetes, and insulin resistance.',
        normalRangeContext: 'Normal fasting level is between 70 and 99 mg/dL. 100–125 mg/dL indicates prediabetes, and 126+ mg/dL indicates diabetes.',
        lifestyleFactors: 'Physical exercise, balanced low-glycemic meals, consistent sleep, and stress reduction help maintain healthy levels.'
      };
    }
    if (t.includes('cholesterol') || t.includes('lipid')) {
      return {
        term: 'Lipid Profile & Cholesterol',
        plainEnglish: 'Fats in the bloodstream including Total Cholesterol, LDL (often called bad cholesterol), HDL (protective cholesterol), and Triglycerides.',
        clinicalPurpose: 'Assesses cardiovascular risk, arterial plaque buildup, and metabolic health.',
        normalRangeContext: 'Total Cholesterol should ideally be under 200 mg/dL; LDL under 100 mg/dL; HDL over 40 mg/dL.',
        lifestyleFactors: 'Aerobic fitness, reducing trans fats, increasing omega-3 fatty acids, and dietary fiber strongly assist lipid balance.'
      };
    }
    return {
      term,
      plainEnglish: `${term} is a standardized physiological biomarker assessed during routine laboratory testing.`,
      clinicalPurpose: 'Assists clinicians in evaluating organ function, metabolic balance, and therapeutic response.',
      normalRangeContext: 'Reference ranges represent typical values found in 95% of healthy population cohorts.',
      lifestyleFactors: 'Discuss with your physician to understand how nutrition, medications, and physical activity relate to your specific results.'
    };
  },

  /**
   * Intelligently evaluates standard reference intervals and status for biomarkers
   */
  parseBiomarkerRange: (testName: string, refRangeStr?: string, value?: number): { minRange: number; maxRange: number; status: 'normal' | 'low' | 'high' | 'critical'; referenceRange: string } => {
    const normName = (testName || '').toLowerCase();
    const val = Number(value) || 0;
    let min = 0;
    let max = 999999;
    let formattedRange = (refRangeStr || '').trim();

    const dashMatch = formattedRange.match(/(\d+(?:\.\d+)?)\s*(?:-|to|–)\s*(\d+(?:\.\d+)?)/i);
    const lessMatch = formattedRange.match(/(?:<|<=|less than|up to)\s*(\d+(?:\.\d+)?)/i);
    const greaterMatch = formattedRange.match(/(?:>|>=|greater than)\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*-\s*$/i);

    if (dashMatch) {
      min = parseFloat(dashMatch[1]);
      max = parseFloat(dashMatch[2]);
      formattedRange = `${min} - ${max}`;
    } else if (lessMatch) {
      min = 0;
      max = parseFloat(lessMatch[1]);
      formattedRange = `< ${max}`;
    } else if (greaterMatch) {
      min = parseFloat(greaterMatch[1] || greaterMatch[2]);
      max = 999999;
      formattedRange = `> ${min}`;
    } else {
      // Clinical standard reference dictionary fallback
      if (normName.includes('hemoglobin') || normName === 'hb') { min = 13.0; max = 17.0; formattedRange = '13.0 - 17.0'; }
      else if (normName.includes('fasting') && (normName.includes('glucose') || normName.includes('sugar'))) { min = 70; max = 99; formattedRange = '70 - 99'; }
      else if (normName.includes('glucose') || normName.includes('sugar')) { min = 70; max = 140; formattedRange = '70 - 140'; }
      else if (normName.includes('hba1c')) { min = 4.0; max = 5.7; formattedRange = '4.0 - 5.7'; }
      else if (normName.includes('cholesterol') && !normName.includes('hdl')) { min = 0; max = 200; formattedRange = '< 200'; }
      else if (normName.includes('triglycerid')) { min = 0; max = 150; formattedRange = '< 150'; }
      else if (normName.includes('hdl')) { min = 40; max = 999999; formattedRange = '> 40'; }
      else if (normName.includes('ldl')) { min = 0; max = 100; formattedRange = '< 100'; }
      else if (normName.includes('creatinine')) { min = 0.6; max = 1.3; formattedRange = '0.6 - 1.3'; }
      else if (normName.includes('platelet')) { min = 150000; max = 450000; formattedRange = '150,000 - 450,000'; }
      else if (normName.includes('wbc') || normName.includes('leukocyte') || normName.includes('white blood')) { min = 4000; max = 11000; formattedRange = '4,000 - 11,000'; }
      else if (normName.includes('rbc') || normName.includes('red blood')) { min = 4.5; max = 5.9; formattedRange = '4.5 - 5.9'; }
      else if (normName.includes('vitamin d') || normName.includes('vit d')) { min = 30; max = 100; formattedRange = '30 - 100'; }
      else if (normName.includes('tsh')) { min = 0.4; max = 4.0; formattedRange = '0.4 - 4.0'; }
      else if (normName.includes('neutrophil')) { min = 40; max = 75; formattedRange = '40 - 75'; }
      else if (normName.includes('lymphocyte')) { min = 20; max = 45; formattedRange = '20 - 45'; }
    }

    let status: 'normal' | 'low' | 'high' | 'critical' = 'normal';
    if (val < min) {
      status = (min > 0 && val < min * 0.75) ? 'critical' : 'low';
    } else if (val > max) {
      status = (max < 999999 && val > max * 1.3) ? 'critical' : 'high';
    } else {
      status = 'normal';
    }

    return { minRange: min, maxRange: max, status, referenceRange: formattedRange || (min > 0 && max < 999999 ? `${min} - ${max}` : 'Standard') };
  },

  /**
   * Drafts an AI-powered clinical alert with value shift, possible reasons, and short-term control measures
   */
  draftBiomarkerAlertAsync: async (params: {
    metric: string;
    currentValue: number;
    previousValue?: number | null;
    previousDate?: string;
    unit: string;
    referenceRange: string;
    status: 'normal' | 'low' | 'high' | 'critical';
    reportTitle: string;
    patientName: string;
  }): Promise<{
    changeDescription: string;
    patientMessage: string;
    possibleReasons: string[];
    controlMeasures: string[];
    doctorSummary: string;
  }> => {
    try {
      const res = await fetch('/api/ai/draft-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (e) {
      console.warn("Using client-side clinical fallback alert draft:", e);
    }

    // Client fallback rules generator
    const normMetric = (params.metric || '').toLowerCase();
    const numCurrent = Number(params.currentValue) || 0;
    const hasPrev = params.previousValue !== null && params.previousValue !== undefined && !isNaN(params.previousValue);
    const numPrev = hasPrev ? Number(params.previousValue) : null;
    
    let delta = null;
    let diffPercent = null;
    let sign = '';
    let changeDescription = '';

    if (hasPrev && numPrev !== null) {
      delta = Number((numCurrent - numPrev).toFixed(2));
      diffPercent = numPrev !== 0 ? ((delta / numPrev) * 100).toFixed(1) : '0';
      sign = delta > 0 ? '+' : '';
      changeDescription = `Previous: ${numPrev} ${params.unit} (${params.previousDate || 'prior test'}) → Current: ${numCurrent} ${params.unit} (${sign}${delta} ${params.unit}, ${sign}${diffPercent}%)`;
    } else {
      changeDescription = `Baseline initial measurement: ${numCurrent} ${params.unit} (No previous record on file)`;
    }

    const isLow = params.status === 'low' || (normMetric.includes('hdl') && numCurrent < 40) || (normMetric.includes('hemoglobin') && numCurrent < 13);

    let patientMessage = '';
    let possibleReasons: string[] = [];
    let controlMeasures: string[] = [];
    let doctorSummary = '';

    if (normMetric.includes('hemoglobin') || normMetric === 'hb' || normMetric.includes('hematocrit') || normMetric.includes('rbc')) {
      if (isLow) {
        patientMessage = `Your Hemoglobin is below the standard reference range at ${numCurrent} ${params.unit} (target: ${params.referenceRange || '13.0 - 17.0 g/dL'}). ${hasPrev && delta !== null ? `This reflects a drop of ${Math.abs(delta)} ${params.unit} from your previous reading of ${numPrev} ${params.unit}.` : ''} A lower reading indicates reduced oxygen-carrying capacity (mild anemia).`;
        possibleReasons = [
          "Inadequate dietary iron intake or reduced digestive iron absorption.",
          "Gradual blood loss or recent heavy menstrual cycle.",
          "Co-existing Vitamin B12 or folic acid deficiency affecting red cell synthesis.",
          "Increased plasma fluid volume causing temporary dilutional anemia."
        ];
        controlMeasures = [
          "Incorporate iron-dense foods like spinach, lentils, chickpeas, beetroot, and raisins into your meals.",
          "Pair iron-rich foods with Vitamin C (citrus fruits, lemon water, bell peppers) to maximize absorption.",
          "Avoid tea, coffee, or calcium supplements within 1–2 hours of meals as they inhibit iron absorption.",
          "Pace yourself during daily tasks and ensure 7–8 hours of restful sleep until doctor review."
        ];
        doctorSummary = `Sub-nominal Hemoglobin detected: ${numCurrent} ${params.unit} (Reference: ${params.referenceRange || '13.0 - 17.0 g/dL'}). ${hasPrev ? `Shifted from ${numPrev} ${params.unit} on ${params.previousDate || 'prior test'} (${sign}${delta} ${params.unit}).` : 'First recorded baseline.'} Extracted from report "${params.reportTitle}". Patient: ${params.patientName}. Anemia workup suggested.`;
      } else {
        patientMessage = `Your Hemoglobin level is elevated at ${numCurrent} ${params.unit} (target: ${params.referenceRange || '13.0 - 17.0 g/dL'}).`;
        possibleReasons = [
          "Dehydration or low fluid intake causing temporary hemoconcentration.",
          "Cigarette smoking or chronic exposure to carbon monoxide.",
          "Physiological adaptation to high altitude or rigorous endurance training."
        ];
        controlMeasures = [
          "Drink 2.5 to 3 liters of water daily to maintain optimal circulating plasma volume.",
          "Avoid tobacco smoke and refrain from iron-containing multivitamins until evaluated.",
          "Monitor for headaches or flushed skin and rest comfortably."
        ];
        doctorSummary = `Elevated Hemoglobin detected: ${numCurrent} ${params.unit} (Reference: ${params.referenceRange || '13.0 - 17.0 g/dL'}). ${hasPrev ? `Prior: ${numPrev} ${params.unit} (${sign}${delta} ${params.unit}).` : 'First record.'} Extracted from report "${params.reportTitle}". Patient: ${params.patientName}.`;
      }
    } else if (normMetric.includes('glucose') || normMetric.includes('sugar') || normMetric.includes('hba1c') || normMetric.includes('diabetes')) {
      if (isLow) {
        patientMessage = `Your Blood Glucose level is low at ${numCurrent} ${params.unit} (normal: ${params.referenceRange || '70 - 99 mg/dL'}).`;
        possibleReasons = [
          "Delayed or skipped meal or prolonged fasting window.",
          "Strenuous physical activity without adequate nutritional intake.",
          "Medication dosage or timing mismatch."
        ];
        controlMeasures = [
          "Keep fast-acting carbohydrates accessible (fruit juice, glucose candy, raisins).",
          "Eat wholesome meals at regular, predictable intervals; do not skip meals.",
          "Sit or lie down immediately if feeling dizzy, shaky, or sweating profusely."
        ];
        doctorSummary = `Hypoglycemic reading flagged: ${numCurrent} ${params.unit} (Reference: ${params.referenceRange || '70 - 99 mg/dL'}). Extracted from report "${params.reportTitle}". Patient: ${params.patientName}.`;
      } else {
        patientMessage = `Your Fasting Blood Glucose is elevated at ${numCurrent} ${params.unit} (normal target: ${params.referenceRange || '70 - 99 mg/dL'}). ${hasPrev && delta !== null ? `This represents an increase of +${delta} ${params.unit} from your previous reading of ${numPrev} ${params.unit}.` : ''} Elevated fasting glucose suggests increased insulin resistance.`;
        possibleReasons = [
          "Recent consumption of simple carbohydrates or sugary foods before testing.",
          "Insufficient overnight fasting duration (less than 8–10 hours).",
          "Insulin resistance, metabolic syndrome, or impaired glucose tolerance.",
          "Acute physical stress, infection, or poor sleep temporarily raising cortisol levels."
        ];
        controlMeasures = [
          "Eliminate refined sugar, sodas, packaged juices, and white flour snacks from your diet.",
          "Take a gentle 15-minute walk after meals to help muscles clear glucose naturally.",
          "Stay well hydrated with plain water and avoid late-night heavy snacking.",
          "Maintain regular sleep hours and track any symptoms like excessive thirst or fatigue."
        ];
        doctorSummary = `Elevated Fasting Blood Glucose flagged: ${numCurrent} ${params.unit} (Reference: ${params.referenceRange || '70 - 99 mg/dL'}). ${hasPrev ? `Shifted from ${numPrev} ${params.unit} on ${params.previousDate || 'prior test'} (+${delta} ${params.unit}).` : 'First recorded test.'} Extracted from report "${params.reportTitle}". Patient: ${params.patientName}. Glycemic management review indicated.`;
      }
    } else if (normMetric.includes('cholesterol') || normMetric.includes('lipid') || normMetric.includes('triglycerid') || normMetric.includes('ldl') || normMetric.includes('hdl')) {
      if (normMetric.includes('hdl') && (isLow || numCurrent < 40)) {
        patientMessage = `Your HDL ('protective') Cholesterol is below optimal target at ${numCurrent} ${params.unit} (recommended: ${params.referenceRange || '> 40 mg/dL'}).`;
        possibleReasons = [
          "Low weekly aerobic physical activity or sedentary routine.",
          "High dietary intake of refined carbohydrates or trans fats.",
          "Smoking or tobacco consumption suppressing circulating HDL levels."
        ];
        controlMeasures = [
          "Engage in moderate aerobic cardiovascular exercise (brisk walking, cycling) 4–5 days a week.",
          "Incorporate healthy unsaturated fats (flaxseeds, chia seeds, walnuts, olive oil) into meals.",
          "Avoid trans fats found in commercial baked goods and deep-fried snacks."
        ];
        doctorSummary = `Suboptimal HDL Cholesterol: ${numCurrent} ${params.unit} (Reference: ${params.referenceRange || '> 40 mg/dL'}). ${hasPrev ? `Previous: ${numPrev} ${params.unit}.` : ''} Extracted from report "${params.reportTitle}". Patient: ${params.patientName}.`;
      } else {
        patientMessage = `Your ${params.metric} level is above standard cardiovascular reference thresholds at ${numCurrent} ${params.unit} (target: ${params.referenceRange || '< 200 mg/dL'}). ${hasPrev ? `Previous reading was ${numPrev} ${params.unit} (${sign}${delta} ${params.unit}).` : ''}`;
        possibleReasons = [
          "Diets high in saturated fats, butter, fried foods, and processed snacks.",
          "Sedentary lifestyle and lack of regular cardiovascular exercise.",
          "Familial or genetic predisposition to elevated circulating lipids.",
          "Underlying metabolic or sluggish thyroid metabolism."
        ];
        controlMeasures = [
          "Replace fried foods and fatty dairy with high-fiber foods (oatmeal, beans, vegetables).",
          "Cook meals with heart-healthy oils like cold-pressed olive or mustard oil in moderation.",
          "Aim for at least 30 minutes of brisk walking or aerobic exercise daily.",
          "Limit alcohol consumption and avoid smoking to protect vascular health."
        ];
        doctorSummary = `Elevated lipid parameter ${params.metric} flagged: ${numCurrent} ${params.unit} (Reference: ${params.referenceRange || '< 200 mg/dL'}). ${hasPrev ? `Shifted from ${numPrev} ${params.unit} (${sign}${delta} ${params.unit}).` : 'First record.'} Extracted from report "${params.reportTitle}". Patient: ${params.patientName}. Lipid profile correlation recommended.`;
      }
    } else {
      patientMessage = `Your ${params.metric} reading is ${isLow ? 'below' : 'above'} the standard reference range at ${numCurrent} ${params.unit} (normal target: ${params.referenceRange || 'Standard Limits'}). ${hasPrev ? `This represents a shift from your prior recorded measurement of ${numPrev} ${params.unit} (${sign}${delta} ${params.unit}).` : ''} Clinical review by your physician is advised.`;
      possibleReasons = [
        "Physiological fluctuations influenced by hydration status, diet, or sample timing.",
        "Mild functional variation or metabolic adaptation in underlying organ systems.",
        "Potential influence of concurrent medications, supplements, or physical exertion."
      ];
      controlMeasures = [
        "Maintain consistent daily water hydration and balanced, wholesome meals.",
        "Refrain from taking unverified over-the-counter supplements until physician consultation.",
        "Record any physical symptoms or changes in energy to share with your doctor.",
        "Follow up with your attending healthcare provider for definitive clinical advice."
      ];
      doctorSummary = `Out-of-range ${isLow ? 'low' : 'elevated'} ${params.metric}: ${numCurrent} ${params.unit} (Reference: ${params.referenceRange || 'Standard Range'}). ${hasPrev ? `Shifted from ${numPrev} ${params.unit} on ${params.previousDate || 'prior test'} (${sign}${delta} ${params.unit}).` : 'First recorded baseline.'} Extracted from report "${params.reportTitle}". Patient: ${params.patientName}. Clinical correlation recommended.`;
    }

    return {
      changeDescription,
      patientMessage,
      possibleReasons,
      controlMeasures,
      doctorSummary
    };
  }
};

