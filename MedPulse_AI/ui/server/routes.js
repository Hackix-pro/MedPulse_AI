import express from 'express';
import {
  User,
  Report,
  Alert,
  TimelineEvent,
  DoctorConnection,
  SharedReport,
  Notification,
  DoctorNote,
  Message
} from './models.js';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import Tesseract from 'tesseract.js';
import { LlamaChatSession } from 'node-llama-cpp';
import { getAI } from './aiContext.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});
const upload = multer({ storage: storage });

// Helper: Create notification only if an identical notification does not already exist
async function createNotificationIfNotExists({ id, userId, role, title, message, date, link, type }) {
  try {
    const cleanUser = (userId || '').trim();
    const cleanRole = (role || '').trim();
    const cleanTitle = (title || '').trim();
    const cleanMsg = (message || '').trim();

    // Check if duplicate exists within the last 5 minutes OR with same date+title+msg+user
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existing = await Notification.findOne({
      $or: [
        ...(id ? [{ id }] : []),
        {
          userId: cleanUser,
          title: cleanTitle,
          message: cleanMsg,
          createdAt: { $gte: fiveMinutesAgo }
        },
        {
          userId: cleanUser,
          role: cleanRole,
          title: cleanTitle,
          message: cleanMsg,
          date: date || new Date().toISOString().split('T')[0]
        }
      ]
    });

    if (existing) {
      return existing;
    }

    const notif = new Notification({
      id: id || `NOTIF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      userId: cleanUser,
      role: cleanRole,
      title: cleanTitle,
      message: cleanMsg,
      date: date || new Date().toISOString().split('T')[0],
      read: false,
      link,
      type
    });
    await notif.save();
    return notif;
  } catch (err) {
    console.error('Error in createNotificationIfNotExists:', err);
    return null;
  }
}

// Cleanup any existing duplicate notifications
async function cleanupDuplicateNotifications() {
  try {
    const allNotifs = await Notification.find().sort({ createdAt: 1 });
    const seen = new Map();
    const toDeleteIds = [];

    for (const n of allNotifs) {
      const userKey = (n.userId || n.role || '').trim().toLowerCase();
      const titleKey = (n.title || '').trim().toLowerCase();
      const msgKey = (n.message || '').trim().toLowerCase();
      const dateKey = (n.date || '').trim();
      const key = `${userKey}__${titleKey}__${msgKey}__${dateKey}`;

      if (seen.has(key)) {
        const prev = seen.get(key);
        // If current one was marked read by user, keep the read state
        if (n.read && !prev.read) {
          toDeleteIds.push(prev._id);
          seen.set(key, n);
        } else {
          toDeleteIds.push(n._id);
        }
      } else {
        seen.set(key, n);
      }
    }

    if (toDeleteIds.length > 0) {
      const result = await Notification.deleteMany({ _id: { $in: toDeleteIds } });
      console.log(`[Notification Cleanup] Purged ${result.deletedCount} duplicate notifications.`);
    }
  } catch (err) {
    console.error('Notification cleanup error:', err);
  }
}

// Get User by email
router.post('/users/login', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/users', async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Language and script detection helper to guarantee AI answers in user's language
function detectLanguageAndStyle(text) {
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
  // Devanagari script: Marathi or Hindi
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
      notFoundReason: "సంబంధిత డేటా మీ అప్‌లోడ్ చేసిన ఫైల్‌లు/నివేదికలలో కనుగొనబడలేదు.",
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

  // Normalized lowercase text without diacritics for robust European language matching
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

// Scope guardrail to prevent hallucination on non-medical/non-app queries and reject out-of-scope requests
function checkScope(query) {
  if (!query || typeof query !== 'string') {
    return {
      isOut: true,
      reason: "This question is out of scope of this app, so I cannot answer it. Please ask a health-related question or inquire about your patient medical reports."
    };
  }

  const langInfo = detectLanguageAndStyle(query);
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

  // 3. Greetings & Assistant Identity / Capabilities (IN SCOPE)
  const greetingOrMeta = [
    'hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening',
    'who are you', 'what are you', 'what can you do', 'how can you help', 'help me', 'help',
    'thank you', 'thanks', 'bye', 'goodbye', 'namaste', 'namaskar', 'pranam', 'shukriya', 'dhanyawad',
    'नमस्ते', 'नमस्कार', 'प्रणाम', 'धन्यवाद', 'शुक्रिया', 'आभार'
  ];
  if (greetingOrMeta.some(g => cleanQ === g || cleanQ.startsWith(g + ' ') || cleanQ.endsWith(' ' + g))) {
    return { isOut: false };
  }

  // 4. Medical, Biological, Health, Patient Data, and App Terms (IN SCOPE)
  const medicalAndAppTerms = [
    // General Medical & Health
    'health', 'medic', 'doctor', 'patient', 'clinic', 'hospital', 'nurse', 'physician',
    'disease', 'disorder', 'illness', 'condition', 'symptom', 'diagnos', 'prognos',
    'treat', 'therap', 'cure', 'prevent', 'cause', 'infection', 'inflammation', 'allergy', 'allergic',
    // Anatomy & Organs
    'heart', 'cardio', 'lung', 'pulmonary', 'respiratory', 'liver', 'hepatic', 'kidney', 'renal',
    'brain', 'neuro', 'stomach', 'gastric', 'gut', 'bowel', 'colon', 'pancreas', 'gallbladder',
    'thyroid', 'hormone', 'endocrine', 'bone', 'joint', 'spine', 'muscle', 'skin', 'eye', 'ear', 'throat',
    'blood', 'vein', 'artery', 'vascular', 'organ', 'body',
    // Symptoms & Vitals (English)
    'pain', 'ache', 'fever', 'cough', 'cold', 'flu', 'fatigue', 'tired', 'weakness',
    'dizziness', 'headache', 'migraine', 'nausea', 'vomit', 'diarrhea', 'constipat',
    'breath', 'shortness of breath', 'dyspnea', 'swelling', 'edema', 'rash', 'itching',
    'pressure', 'hypertens', 'hypotens', 'pulse', 'heart rate', 'bpm', 'vitals', 'temperature',
    // Common Diseases & Conditions
    'diabet', 'sugar', 'glucose', 'insulin', 'anemia', 'cancer', 'tumor', 'asthma', 'copd',
    'stroke', 'attack', 'jaundice', 'hepatitis', 'pneumonia', 'covid', 'tuberculosis', 'tb',
    'cholesterol', 'lipid', 'obesity', 'overweight', 'underweight', 'bmi',
    // Biomarkers & Lab Tests
    'report', 'lab', 'test', 'result', 'biomarker', 'range', 'normal', 'abnormal', 'high', 'low',
    'critical', 'hemoglobin', 'hb', 'platelet', 'wbc', 'rbc', 'hematocrit', 'leukocyte',
    'hdl', 'ldl', 'triglycerid', 'vldl', 'hba1c', 'creatinine', 'urea', 'bun', 'uric acid',
    'bilirubin', 'sgot', 'sgpt', 'alt', 'ast', 'alp', 'albumin', 'protein', 'sodium', 'potassium',
    'calcium', 'tsh', 't3', 't4', 'vitamin', 'vit d', 'b12', 'iron', 'ferritin',
    'urine', 'stool', 'biopsy', 'ecg', 'ekg', 'x-ray', 'xray', 'mri', 'ct scan', 'ultrasound', 'sonography',
    // Drugs & Treatments
    'prescript', 'drug', 'dose', 'dosage', 'pill', 'tablet', 'capsule', 'syrup', 'injection',
    'antibiotic', 'painkiller', 'paracetamol', 'metformin', 'aspirin', 'atorvastatin', 'medicine',
    'medication', 'side effect', 'contraindication', 'vaccin',
    // Nutrition, Diet & Lifestyle
    'diet', 'nutrit', 'water', 'hydrat', 'exercis', 'walk', 'weight',
    'sleep', 'rest', 'lifestyle', 'calorie',
    // Patient Data / App Context
    'my report', 'my reports', 'my test', 'my result', 'my doctor', 'my health', 'my value',
    'my glucose', 'my hemoglobin', 'my blood', 'uploaded', 'upload', 'document', 'file',
    'timeline', 'alert', 'history', 'compare', 'trend', 'medpulse', 'app', 'notif', 'connection',
    // Comprehensive Regional / Hinglish / Marathi / Urdu health vocabulary
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
    // Devanagari Health & Medical Terms (Hindi & Marathi)
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

  // 5. If no medical, health, patient report, or app context -> OUT OF SCOPE
  return {
    isOut: true,
    reason: langInfo.outOfScopeReason
  };
}

function isOutOfScope(query) {
  return checkScope(query).isOut;
}

// AI
router.post('/ai/chat', async (req, res) => {
  try {
    const { message, context: reportContext } = req.body;

    // Check scope first
    const scopeCheck = checkScope(message);
    if (scopeCheck.isOut) {
      return res.json({
        answer: scopeCheck.reason
      });
    }

    const { context } = getAI();
    if (!context) return res.status(503).json({ error: 'AI not initialized' });

    const langInfo = detectLanguageAndStyle(message);

    const systemPrompt = `You are MedPulse AI, an intelligent, empathetic, and professional clinical medical assistant for the MedPulse healthcare application.

You must follow these strict rules:

1. MANDATORY LANGUAGE AND SCRIPT MATCHING (TOP PRIORITY):
- You MUST answer the question in the EXACT same language, script, and writing style in which the user asked the question.
- If the user asks in Hindi (Devanagari script), you MUST answer entirely in Hindi using the Devanagari script (हिंदी लिपि).
- If the user asks in Hinglish (Hindi written in the English / Roman alphabet, e.g., "Mera hemoglobin 11.2 hai, iska kya matlab hai?"), you MUST answer entirely in natural Hinglish (Hindi words written in the English alphabet). DO NOT answer in pure English and DO NOT use Devanagari script.
- If the user asks in Marathi (Devanagari script), you MUST answer entirely in fluent Marathi using the Devanagari script (मराठी). DO NOT answer in English or Hindi, and do not repeat repetitive phrases.
- If the user asks in Romanized Marathi (Marathi written in the English / Roman alphabet, e.g., "Maza hemoglobin 11.2 ahe, yacha kay arth ahe?"), you MUST answer entirely in Romanized Marathi (Marathi words written in English letters). DO NOT answer in English and DO NOT use Devanagari script.
- If the user asks in Spanish, French, German, Gujarati, Bengali, Tamil, Telugu, Kannada, Malayalam, Urdu, or any other language, you MUST answer entirely in that exact language and script.
- If the user asks in English, answer in clear, empathetic English.
- CRITICAL: Even if the clinical reports, lab test names, and biomarker numbers in the Clinical Context are written in English, you must translate all your clinical explanations, dietary advice, reasons, and instructions into the user's question language and writing style. Never revert to English when the user communicates in another language or style.

2. SCOPE RESTRICTION:
- Questions about medicine, diseases, health, bodily symptoms, biological parameters, wellness, clinical lab tests, medications, or the MedPulse app are IN SCOPE.
- Questions about the patient's medical data and uploaded laboratory reports are IN SCOPE.
- ABSOLUTE PROHIBITION ON CODING OR PROGRAMMING: If the user asks you to write code in any programming language (Python, JavaScript, C++, HTML, SQL, etc.), create scripts, solve algorithms, or debug software—EVEN IF IT MENTIONS MEDICINE, PATIENTS, OR HEALTH—you MUST refuse.
- If a question is completely unrelated to health, medicine, biology, wellness, patient medical records, or the MedPulse app (such as sports, movies, politics, weather, recipes, trivia), decline to answer in the user's language.

3. PERSONAL DATA NOT FOUND IN FILES (ANTI-HALLUCINATION):
- If the user asks about their personal medical records, personal lab values, or specific file details, BUT that specific test or data is NOT present in the provided reports/files in the Clinical Context:
- State clearly that the data was not found in the uploaded reports, in the user's language:
  * English: "The related data is not found in your uploaded files/reports, so I cannot directly comment on this question."
  * Hindi: "संबंधित डेटा आपकी अपलोड की गई फाइलों/रिपोर्टों में नहीं मिला है, इसलिए मैं इस प्रश्न पर सीधे टिप्पणी नहीं कर सकता।"
  * Hinglish: "Aapki upload ki gayi reports ya files me isse related data nahi mila hai, isliye main is par direct comment nahi kar sakta."
  * Marathi: "संबंधित डेटा आपल्या अपलोड केलेल्या फायली/अहवालांमध्ये आढळला नाही, त्यामुळे मी या प्रश्नावर थेट टिप्पणी करू शकत नाही."
  * Romanized Marathi: "Yashi sambandhit data tumchya upload kelelya reports madhe sapadla nahi, tyamule me yaavar thos bolu shakat nahi."
- Do NOT guess, assume, fabricate, or hallucinate any numbers, dates, or findings.

4. GENERAL DISEASE & HEALTH INQUIRIES:
- If the user asks a general or educational question about a disease, condition, illness, symptom, diet, physiology, or treatment:
- Answer informatively, compassionately, and accurately in the user's language and style.

5. REPORT-RELATED QUESTIONS:
- When the user asks questions related to their uploaded reports:
- Answer accurately using the document text and biomarker values provided in the Clinical Context, translating the explanation into the user's question language and style.`;

    const sequence = context.getSequence();
    const session = new LlamaChatSession({ 
      contextSequence: sequence,
      systemPrompt: systemPrompt
    });
    
    try {
      const userPrompt = `${reportContext ? `Clinical Context (User's Uploaded Reports & Documents):\n${reportContext}\n\n` : ''}User Question: ${message}

[CRITICAL INSTRUCTION - LANGUAGE & STYLE REQUIREMENT]:
${langInfo.directive}
Answer in ${langInfo.style}:`;

      const aiResponse = await session.prompt(userPrompt, { 
        maxTokens: 500,
        temperature: 0.25,
        topP: 0.85,
        repeatPenalty: {
          penalty: 1.25,
          frequencyPenalty: 0.18,
          presencePenalty: 0.18
        }
      });
      res.json({ answer: aiResponse });
    } finally {
      sequence.dispose();
    }
  } catch (err) {
    console.error("AI Chat Error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/ai/summary', async (req, res) => {
  try {
    const { data } = req.body;
    const { context } = getAI();
    if (!context) return res.status(503).json({ error: 'AI not initialized' });

    const sequence = context.getSequence();
    const session = new LlamaChatSession({ contextSequence: sequence });
    
    try {
      const prompt = `You are a professional medical AI. Provide a clear, well-formatted 2-sentence clinical summary for the patient based on these lab results:
${JSON.stringify(data)}
`;

      const aiResponse = await session.prompt(prompt, { 
        maxTokens: 400,
        temperature: 0.3,
        topP: 0.8,
        repeatPenalty: {
          penalty: 1.2,
          frequencyPenalty: 0.05,
          presencePenalty: 0.05
        }
      });
      res.json({ summary: aiResponse });
    } finally {
      sequence.dispose();
    }
  } catch (err) {
    console.error("AI Summary Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Helper: Determine reference ranges and status for biomarkers
function parseBiomarkerStatus(testName, refRangeStr, value) {
  const normName = (testName || '').toLowerCase();
  const val = Number(value) || 0;
  let min = 0;
  let max = 999999;
  let status = 'normal';

  const range = (refRangeStr || '').trim();
  const dashMatch = range.match(/(\d+(?:\.\d+)?)\s*(?:-|to|–)\s*(\d+(?:\.\d+)?)/i);
  const lessMatch = range.match(/(?:<|<=|less than|up to)\s*(\d+(?:\.\d+)?)/i);
  const greaterMatch = range.match(/(?:>|>=|greater than)\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*-\s*$/i);

  if (dashMatch) {
    min = parseFloat(dashMatch[1]);
    max = parseFloat(dashMatch[2]);
  } else if (lessMatch) {
    min = 0;
    max = parseFloat(lessMatch[1]);
  } else if (greaterMatch) {
    min = parseFloat(greaterMatch[1] || greaterMatch[2]);
    max = 999999;
  } else {
    // Clinical dictionary fallback
    if (normName.includes('hemoglobin') || normName === 'hb') { min = 13.0; max = 17.0; }
    else if (normName.includes('glucose') || normName.includes('sugar')) { min = 70; max = 99; }
    else if (normName.includes('hba1c')) { min = 4.0; max = 5.7; }
    else if (normName.includes('cholesterol') && !normName.includes('hdl')) { min = 0; max = 200; }
    else if (normName.includes('triglycerid')) { min = 0; max = 150; }
    else if (normName.includes('hdl')) { min = 40; max = 999999; }
    else if (normName.includes('ldl')) { min = 0; max = 100; }
    else if (normName.includes('creatinine')) { min = 0.6; max = 1.3; }
    else if (normName.includes('platelet')) { min = 150000; max = 450000; }
    else if (normName.includes('wbc') || normName.includes('leukocyte')) { min = 4000; max = 11000; }
    else if (normName.includes('rbc')) { min = 4.5; max = 5.9; }
    else if (normName.includes('vitamin d') || normName.includes('vit d')) { min = 30; max = 100; }
    else if (normName.includes('tsh')) { min = 0.4; max = 4.0; }
  }

  if (val < min) {
    status = (min > 0 && val < min * 0.75) ? 'critical' : 'low';
  } else if (val > max) {
    status = (max < 999999 && val > max * 1.3) ? 'critical' : 'high';
  } else {
    status = 'normal';
  }

  return { minRange: min, maxRange: max, status };
}

// Medical rules engine generating personalized alert explanation, reasons, control measures, and doctor summary
function generateClinicalAlertDraft({
  metric,
  currentValue,
  previousValue,
  previousDate,
  unit = '',
  referenceRange = '',
  status = 'high',
  reportTitle = 'Diagnostic Report',
  patientName = 'Patient'
}) {
  const normMetric = (metric || '').toLowerCase();
  const numCurrent = Number(currentValue) || 0;
  const hasPrev = previousValue !== null && previousValue !== undefined && !isNaN(previousValue);
  const numPrev = hasPrev ? Number(previousValue) : null;
  
  let delta = null;
  let diffPercent = null;
  let sign = '';
  let changeDescription = '';

  if (hasPrev) {
    delta = Number((numCurrent - numPrev).toFixed(2));
    diffPercent = numPrev !== 0 ? ((delta / numPrev) * 100).toFixed(1) : '0';
    sign = delta > 0 ? '+' : '';
    changeDescription = `Previous: ${numPrev} ${unit} (${previousDate || 'prior test'}) → Current: ${numCurrent} ${unit} (${sign}${delta} ${unit}, ${sign}${diffPercent}%)`;
  } else {
    changeDescription = `Baseline initial measurement: ${numCurrent} ${unit} (No previous record on file)`;
  }

  const isLow = status === 'low' || (normMetric.includes('hdl') && numCurrent < 40) || (normMetric.includes('hemoglobin') && numCurrent < 13);

  let patientMessage = '';
  let possibleReasons = [];
  let controlMeasures = [];
  let doctorSummary = '';

  if (normMetric.includes('hemoglobin') || normMetric === 'hb' || normMetric.includes('hematocrit') || normMetric.includes('rbc')) {
    if (isLow) {
      patientMessage = `Your Hemoglobin is below the standard reference range at ${numCurrent} ${unit} (target: ${referenceRange || '13.0 - 17.0 g/dL'}). ${hasPrev ? `This reflects a drop of ${Math.abs(delta)} ${unit} from your previous reading of ${numPrev} ${unit}.` : ''} A lower reading indicates reduced oxygen-carrying red blood cells (mild anemia).`;
      possibleReasons = [
        "Inadequate dietary iron intake or reduced digestive iron absorption.",
        "Gradual or occult blood loss (e.g., heavy menstrual cycles, gastrointestinal loss).",
        "Co-existing Vitamin B12 or folic acid deficiency affecting red cell synthesis.",
        "Increased plasma fluid volume causing temporary dilutional anemia."
      ];
      controlMeasures = [
        "Incorporate iron-dense foods such as spinach, lentils, chickpeas, beetroot, beans, and raisins into your daily meals.",
        "Pair iron-rich foods with Vitamin C (citrus fruits, lemon water, bell peppers) to maximize absorption.",
        "Avoid tea, coffee, or calcium supplements within 1–2 hours of meals as they inhibit iron absorption.",
        "Pace yourself during daily tasks and get 7–8 hours of restful sleep; avoid strenuous physical overexertion until doctor evaluation."
      ];
      doctorSummary = `Sub-nominal Hemoglobin detected: ${numCurrent} ${unit} (Reference: ${referenceRange || '13.0 - 17.0 g/dL'}). ${hasPrev ? `Shifted from ${numPrev} ${unit} on ${previousDate || 'prior test'} (${sign}${delta} ${unit}).` : 'First recorded baseline.'} Extracted from report "${reportTitle}". Patient: ${patientName}. Anemia workup and iron indices suggested.`;
    } else {
      patientMessage = `Your Hemoglobin level is elevated at ${numCurrent} ${unit} (target: ${referenceRange || '13.0 - 17.0 g/dL'}).`;
      possibleReasons = [
        "Dehydration or low fluid intake causing temporary hemoconcentration.",
        "Cigarette smoking or chronic exposure to carbon monoxide.",
        "Physiological compensation for high altitude or vigorous endurance training."
      ];
      controlMeasures = [
        "Drink 2.5 to 3 liters of water daily to maintain optimal circulating plasma volume.",
        "Avoid tobacco smoke and refrain from iron-containing multivitamins until cleared by your doctor.",
        "Monitor for symptoms like headaches or flushed skin and rest comfortably."
      ];
      doctorSummary = `Elevated Hemoglobin detected: ${numCurrent} ${unit} (Reference: ${referenceRange || '13.0 - 17.0 g/dL'}). ${hasPrev ? `Prior: ${numPrev} ${unit} (${sign}${delta} ${unit}).` : 'First record.'} Extracted from report "${reportTitle}". Patient: ${patientName}. Clinical correlation indicated.`;
    }
  } else if (normMetric.includes('glucose') || normMetric.includes('sugar') || normMetric.includes('hba1c') || normMetric.includes('diabetes')) {
    if (isLow) {
      patientMessage = `Your Blood Glucose level is low at ${numCurrent} ${unit} (normal: ${referenceRange || '70 - 99 mg/dL'}).`;
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
      doctorSummary = `Hypoglycemic reading flagged: ${numCurrent} ${unit} (Reference: ${referenceRange || '70 - 99 mg/dL'}). ${hasPrev ? `Prior: ${numPrev} ${unit}.` : ''} Extracted from report "${reportTitle}". Patient: ${patientName}.`;
    } else {
      patientMessage = `Your Fasting Blood Glucose is elevated at ${numCurrent} ${unit} (normal target: ${referenceRange || '70 - 99 mg/dL'}). ${hasPrev ? `This represents an increase of +${delta} ${unit} from your previous reading of ${numPrev} ${unit}.` : ''} Elevated fasting glucose suggests increased insulin resistance.`;
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
      doctorSummary = `Elevated Fasting Blood Glucose flagged: ${numCurrent} ${unit} (Reference: ${referenceRange || '70 - 99 mg/dL'}). ${hasPrev ? `Shifted from ${numPrev} ${unit} on ${previousDate || 'prior test'} (+${delta} ${unit}).` : 'First recorded test.'} Extracted from report "${reportTitle}". Patient: ${patientName}. Glycemic management review indicated.`;
    }
  } else if (normMetric.includes('cholesterol') || normMetric.includes('lipid') || normMetric.includes('triglycerid') || normMetric.includes('ldl') || normMetric.includes('hdl') || normMetric.includes('vldl')) {
    if (normMetric.includes('hdl') && (isLow || numCurrent < 40)) {
      patientMessage = `Your HDL ('protective') Cholesterol is below optimal target at ${numCurrent} ${unit} (recommended: ${referenceRange || '> 40 mg/dL'}).`;
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
      doctorSummary = `Suboptimal HDL Cholesterol: ${numCurrent} ${unit} (Reference: ${referenceRange || '> 40 mg/dL'}). ${hasPrev ? `Previous: ${numPrev} ${unit}.` : ''} Extracted from report "${reportTitle}". Patient: ${patientName}.`;
    } else {
      patientMessage = `Your ${metric} level is above standard cardiovascular reference thresholds at ${numCurrent} ${unit} (target: ${referenceRange || '< 200 mg/dL'}). ${hasPrev ? `Previous reading was ${numPrev} ${unit} (${sign}${delta} ${unit}).` : ''}`;
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
      doctorSummary = `Elevated lipid parameter ${metric} flagged: ${numCurrent} ${unit} (Reference: ${referenceRange || '< 200 mg/dL'}). ${hasPrev ? `Shifted from ${numPrev} ${unit} (${sign}${delta} ${unit}).` : 'First record.'} Extracted from report "${reportTitle}". Patient: ${patientName}. Lipid profile correlation recommended.`;
    }
  } else if (normMetric.includes('creatinine') || normMetric.includes('urea') || normMetric.includes('bun') || normMetric.includes('uric')) {
    patientMessage = `Your ${metric} level is elevated at ${numCurrent} ${unit} (normal range: ${referenceRange || '0.6 - 1.3 mg/dL'}). ${hasPrev ? `Prior measurement was ${numPrev} ${unit} (${sign}${delta} ${unit}).` : ''} This biomarker reflects kidney filtration function.`;
    possibleReasons = [
      "Inadequate water hydration causing concentrated kidney filtration.",
      "High dietary protein intake or heavy strenuous resistance training.",
      "Temporary kidney stress from over-the-counter NSAID pain relievers (ibuprofen/naproxen).",
      "Underlying renal microvascular strain from elevated blood pressure or glucose."
    ];
    controlMeasures = [
      "Drink 2.5 to 3 liters of plain water daily unless under medical fluid restrictions.",
      "Avoid taking unprescribed painkiller medications (NSAIDs) such as ibuprofen.",
      "Temporarily pause high-protein supplements or creatine powders until doctor consultation.",
      "Monitor blood pressure and note any swelling in ankles, feet, or face."
    ];
    doctorSummary = `Elevated renal marker ${metric}: ${numCurrent} ${unit} (Reference: ${referenceRange || '0.6 - 1.3 mg/dL'}). ${hasPrev ? `Previous: ${numPrev} ${unit} on ${previousDate || 'prior test'}.` : 'Initial baseline.'} Extracted from report "${reportTitle}". Patient: ${patientName}. Renal function panel review indicated.`;
  } else if (normMetric.includes('alt') || normMetric.includes('sgpt') || normMetric.includes('ast') || normMetric.includes('sgot') || normMetric.includes('bilirubin') || normMetric.includes('alp')) {
    patientMessage = `Your liver enzyme (${metric}) is elevated at ${numCurrent} ${unit} (reference interval: ${referenceRange || '7 - 56 U/L'}). ${hasPrev ? `Previous level was ${numPrev} ${unit} (${sign}${delta} ${unit}).` : ''}`;
    possibleReasons = [
      "Fatty liver changes associated with diet, weight, or metabolic stress.",
      "Recent consumption of alcohol or heavy, greasy restaurant meals.",
      "Medication side-effects (antibiotics, statins, paracetamol, pain relievers).",
      "Recent viral infection or systemic inflammatory response."
    ];
    controlMeasures = [
      "Strictly avoid all alcohol and alcoholic beverages until your liver enzymes normalize.",
      "Consume freshly prepared, home-cooked light meals with minimal oil and spices.",
      "Refrain from taking unnecessary over-the-counter medicines or unverified herbal products.",
      "Stay well hydrated with clean water and prioritize 8 hours of sleep."
    ];
    doctorSummary = `Elevated hepatic biomarker ${metric}: ${numCurrent} ${unit} (Reference: ${referenceRange || '7 - 56 U/L'}). ${hasPrev ? `Shifted from ${numPrev} ${unit} (${sign}${delta} ${unit}).` : 'First record.'} Extracted from report "${reportTitle}". Patient: ${patientName}. Hepatic profile follow-up recommended.`;
  } else if (normMetric.includes('platelet')) {
    if (isLow) {
      patientMessage = `Your Platelet Count is below reference threshold at ${numCurrent} ${unit} (normal: ${referenceRange || '150,000 - 450,000 /mcL'}). ${hasPrev ? `Previous reading was ${numPrev} ${unit}.` : ''}`;
      possibleReasons = [
        "Recent viral illness (dengue, viral fevers, flu) causing temporary marrow suppression.",
        "Immune-mediated platelet clearance or peripheral destruction.",
        "Nutritional deficiencies (Vitamin B12, folate, or iron)."
      ];
      controlMeasures = [
        "Avoid contact sports or activities with fall/injury risks to prevent bleeding.",
        "Do not consume blood-thinning painkillers like aspirin unless expressly prescribed.",
        "Seek immediate medical care if you notice pinpoint red spots (petechiae) or gum bleeding."
      ];
      doctorSummary = `Thrombocytopenia flagged: ${numCurrent} ${unit} (Reference: ${referenceRange || '150,000 - 450,000 /mcL'}). ${hasPrev ? `Prior: ${numPrev} ${unit}.` : ''} Extracted from report "${reportTitle}". Patient: ${patientName}. Bleeding precautions and repeat CBC suggested.`;
    } else {
      patientMessage = `Your Platelet Count is above the standard range at ${numCurrent} ${unit} (normal: ${referenceRange || '150,000 - 450,000 /mcL'}).`;
      possibleReasons = [
        "Reactive thrombocytosis due to recent infection, injury, or inflammation.",
        "Compensatory response to low iron stores or recent blood loss."
      ];
      controlMeasures = [
        "Drink plenty of fluids to maintain healthy blood hydration and circulation.",
        "Avoid prolonged seated immobility; stand and walk around every hour."
      ];
      doctorSummary = `Reactive thrombocytosis: ${numCurrent} ${unit} (Reference: ${referenceRange || '150,000 - 450,000 /mcL'}). Extracted from report "${reportTitle}". Patient: ${patientName}.`;
    }
  } else if (normMetric.includes('wbc') || normMetric.includes('leukocyte') || normMetric.includes('white blood')) {
    if (isLow) {
      patientMessage = `Your White Blood Cell (WBC) count is low at ${numCurrent} ${unit} (normal: ${referenceRange || '4,000 - 11,000 /cumm'}).`;
      possibleReasons = [
        "Post-viral temporary bone marrow suppression following an acute infection.",
        "Severe nutritional deficiencies or medication side-effects."
      ];
      controlMeasures = [
        "Maintain careful hand hygiene to guard against opportunistic bacterial infections.",
        "Avoid crowded spaces and eat freshly prepared, well-washed food.",
        "Immediately seek medical evaluation if you develop chills or fever."
      ];
      doctorSummary = `Leukopenia flagged: ${numCurrent} ${unit} (Reference: ${referenceRange || '4,000 - 11,000 /cumm'}). Extracted from report "${reportTitle}". Patient: ${patientName}.`;
    } else {
      patientMessage = `Your White Blood Cell (WBC) count is elevated at ${numCurrent} ${unit} (normal: ${referenceRange || '4,000 - 11,000 /cumm'}). ${hasPrev ? `Prior measurement was ${numPrev} ${unit} (${sign}${delta} ${unit}).` : ''} WBCs increase as part of the immune response.`;
      possibleReasons = [
        "Active bacterial, viral, or fungal infection in the body.",
        "Recent bodily injury, tissue trauma, or systemic inflammation.",
        "Acute physical stress, vigorous workout, or smoking before the test."
      ];
      controlMeasures = [
        "Get plenty of rest and drink warm fluids, water, and broths.",
        "Check and record your body temperature twice daily to detect fever.",
        "Avoid intense workouts until your body finishes resolving the immune response."
      ];
      doctorSummary = `Leukocytosis flagged: ${numCurrent} ${unit} (Reference: ${referenceRange || '4,000 - 11,000 /cumm'}). ${hasPrev ? `Previous: ${numPrev} ${unit} (${sign}${delta} ${unit}).` : ''} Extracted from report "${reportTitle}". Patient: ${patientName}. Clinical infection/inflammation evaluation indicated.`;
    }
  } else if (normMetric.includes('vitamin d') || normMetric.includes('vit d')) {
    patientMessage = `Your Vitamin D (25-OH) level is deficient at ${numCurrent} ${unit} (optimal: ${referenceRange || '30 - 100 ng/mL'}). ${hasPrev ? `Previous level was ${numPrev} ${unit}.` : ''}`;
    possibleReasons = [
      "Limited direct daily sunlight exposure due to indoor lifestyle or sunscreen.",
      "Low dietary intake of Vitamin D enriched foods.",
      "Impaired intestinal absorption or metabolic breakdown."
    ];
    controlMeasures = [
      "Spend 15–20 minutes in direct morning sunlight (before 10 AM) with arms/face exposed.",
      "Include Vitamin D fortified milk, eggs, and mushrooms in your daily diet.",
      "Await and follow your doctor's specific prescription for therapeutic weekly Vitamin D supplementation."
    ];
    doctorSummary = `Vitamin D deficiency detected: ${numCurrent} ${unit} (Reference: ${referenceRange || '30 - 100 ng/mL'}). Extracted from report "${reportTitle}". Patient: ${patientName}. Therapeutic high-dose replenishment indicated.`;
  } else if (normMetric.includes('tsh') || normMetric.includes('thyroid')) {
    if (isLow) {
      patientMessage = `Your TSH is below standard reference range at ${numCurrent} ${unit} (normal: ${referenceRange || '0.4 - 4.0 uIU/mL'}), indicating increased thyroid hormone activity.`;
      possibleReasons = [
        "Overactive thyroid gland producing excessive circulating thyroid hormones.",
        "Thyroiditis or excessive dose of thyroid hormone replacement medication."
      ];
      controlMeasures = [
        "Limit caffeine, energy drinks, and stimulants which worsen heart palpitations.",
        "Avoid hot environments and ensure adequate rest and cool hydration.",
        "Track resting heart rate twice daily and note any trembling or nervousness."
      ];
      doctorSummary = `Suppressed TSH flagged: ${numCurrent} ${unit} (Reference: ${referenceRange || '0.4 - 4.0 uIU/mL'}). Extracted from report "${reportTitle}". Patient: ${patientName}. Free T3/T4 workup indicated.`;
    } else {
      patientMessage = `Your TSH is elevated at ${numCurrent} ${unit} (normal: ${referenceRange || '0.4 - 4.0 uIU/mL'}), suggesting an underactive thyroid response.`;
      possibleReasons = [
        "Sluggish thyroid hormone production (primary hypothyroidism or Hashimoto's).",
        "Recovery phase following systemic illness or thyroid inflammation.",
        "Inadequate thyroid replacement medication dosage if already on treatment."
      ];
      controlMeasures = [
        "Ensure adequate dietary iodine (iodized salt) and selenium (nuts, seeds).",
        "Avoid eating large amounts of raw cruciferous vegetables (cabbage, cauliflower).",
        "Take prescribed thyroid tablets strictly on an empty stomach with plain water if on therapy."
      ];
      doctorSummary = `Elevated TSH flagged: ${numCurrent} ${unit} (Reference: ${referenceRange || '0.4 - 4.0 uIU/mL'}). ${hasPrev ? `Prior: ${numPrev} ${unit}.` : ''} Extracted from report "${reportTitle}". Patient: ${patientName}. Free T4 evaluation recommended.`;
    }
  } else {
    // Universal adaptive fallback for any other biomarker
    patientMessage = `Your ${metric} reading is ${isLow ? 'below' : 'above'} the standard reference range at ${numCurrent} ${unit} (normal target: ${referenceRange || 'Standard Cohort Limits'}). ${hasPrev ? `This represents a shift from your prior recorded measurement of ${numPrev} ${unit} (${sign}${delta} ${unit}).` : ''} Clinical review by your physician is advised.`;
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
    doctorSummary = `Out-of-range ${isLow ? 'low' : 'elevated'} ${metric}: ${numCurrent} ${unit} (Reference: ${referenceRange || 'Standard Range'}). ${hasPrev ? `Shifted from ${numPrev} ${unit} on ${previousDate || 'prior test'} (${sign}${delta} ${unit}).` : 'First recorded baseline.'} Extracted from report "${reportTitle}". Patient: ${patientName}. Clinical correlation recommended.`;
  }

  return {
    changeDescription,
    patientMessage,
    possibleReasons,
    controlMeasures,
    doctorSummary
  };
}

router.post('/ai/draft-alert', async (req, res) => {
  try {
    const params = req.body;
    const fallbackDraft = generateClinicalAlertDraft(params);

    const { context } = getAI();
    if (!context) {
      return res.json(fallbackDraft);
    }

    // Try AI generation with tight timeout so user interface stays responsive
    const aiPromise = (async () => {
      const sequence = context.getSequence();
      const session = new LlamaChatSession({ contextSequence: sequence });
      try {
        const prompt = `You are a clinical diagnostic medical AI. Generate structured alert messages for this flagged lab result:
Biomarker: ${params.metric}
Current Value: ${params.currentValue} ${params.unit || ''}
Previous Value: ${params.previousValue !== null && params.previousValue !== undefined ? `${params.previousValue} ${params.unit || ''}` : 'No previous test'}
Reference Range: ${params.referenceRange || 'Standard'} (Status: ${params.status || 'abnormal'})
Report Title: ${params.reportTitle}
Patient: ${params.patientName}

Return ONLY a valid JSON object matching this schema:
{
  "changeDescription": "Brief comparison of previous vs current reading with delta",
  "patientMessage": "Clear 2-sentence alert for the patient explaining the result and value change",
  "possibleReasons": ["Short plausible clinical/lifestyle reason 1", "Short reason 2", "Short reason 3"],
  "controlMeasures": ["Short safe home/dietary measure 1 until doctor review", "Short measure 2", "Short measure 3"],
  "doctorSummary": "Concise physician alert including report name, differing values, and normal interval"
}
`;
        const response = await session.prompt(prompt, {
          maxTokens: 380,
          temperature: 0.1,
          topP: 0.85
        });

        let cleanJson = response.trim();
        const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            changeDescription: parsed.changeDescription || fallbackDraft.changeDescription,
            patientMessage: parsed.patientMessage || fallbackDraft.patientMessage,
            possibleReasons: Array.isArray(parsed.possibleReasons) && parsed.possibleReasons.length > 0 ? parsed.possibleReasons : fallbackDraft.possibleReasons,
            controlMeasures: Array.isArray(parsed.controlMeasures) && parsed.controlMeasures.length > 0 ? parsed.controlMeasures : fallbackDraft.controlMeasures,
            doctorSummary: parsed.doctorSummary || fallbackDraft.doctorSummary
          };
        }
        return fallbackDraft;
      } finally {
        sequence.dispose();
      }
    })();

    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(fallbackDraft), 4500));
    const result = await Promise.race([aiPromise, timeoutPromise]);
    res.json(result);
  } catch (err) {
    console.error("AI Alert Draft Error:", err);
    res.json(generateClinicalAlertDraft(req.body));
  }
});

router.post('/reports/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    console.log("File uploaded:", req.file.path);
    // 1. OCR with Tesseract
    console.log("Starting OCR...");
    const worker = await Tesseract.createWorker('eng');
    const { data: { text } } = await worker.recognize(req.file.path);
    await worker.terminate();
    console.log("OCR finished. Extracted text length:", text.length);

    // 2. Qwen Model Parsing
    const { context } = getAI();
    if (!context) {
      throw new Error("Local AI Model is not initialized yet.");
    }
    
    console.log("Sending text to Qwen...");
    const sequence = context.getSequence();
    const session = new LlamaChatSession({ contextSequence: sequence });
    
    let extracted = [];
    let aiResponse = "";
    
    try {
      const prompt = `Extract the lab test results from the following OCR text.
Return ONLY a valid JSON array of objects. Do not add markdown blocks or explanations. Do NOT wrap the objects in extra quotes.
Correct format:
[
  { "testName": "Hemoglobin", "value": 13.0, "unit": "g/dL", "referenceRange": "13.0-17.0" }
]

OCR TEXT:
${text}
`;
      
      aiResponse = await session.prompt(prompt, { 
        maxTokens: 800,
        temperature: 0.1,
        topP: 0.9,
        repeatPenalty: {
          penalty: 1.1,
          frequencyPenalty: 0.02,
          presencePenalty: 0.02
        }
      });
      console.log("Qwen response:", aiResponse);
    } finally {
      sequence.dispose();
    }
    try {
      let cleanJson = aiResponse.trim();
      
      // Attempt to clean up malformed Qwen output like ["{...}"]
      if (cleanJson.startsWith('["{') && cleanJson.endsWith('}"]')) {
        cleanJson = cleanJson.replace('["{', '[{').replace('}"]', '}]');
      } else if (cleanJson.startsWith('["{') && cleanJson.endsWith('}]')) {
        cleanJson = cleanJson.replace('["{', '[{');
      }

      const match = cleanJson.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (match) {
        cleanJson = match[0];
      }
      extracted = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse JSON from AI:", e.message);
      // Fallback: try to manually extract using regex if JSON parse completely fails
      const regex = /"testName"\s*:\s*"([^"]+)"\s*,\s*"value"\s*:\s*([\d.]+)\s*,\s*"unit"\s*:\s*"([^"]*)"\s*,\s*"referenceRange"\s*:\s*"([^"]*)"/g;
      let m;
      while ((m = regex.exec(aiResponse)) !== null) {
        extracted.push({
          testName: m[1],
          value: parseFloat(m[2]) || 0,
          unit: m[3],
          referenceRange: m[4]
        });
      }
    }

    res.json({
      text,
      extractedValues: extracted,
      filePath: `/uploads/${req.file.filename}`
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/reports', async (req, res) => {
  try {
    const reports = await Report.find().sort({ date: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reports', async (req, res) => {
  try {
    const report = new Report(req.body);
    await report.save();

    // If report was uploaded by a doctor for a patient
    if (report.doctorName && report.patientId) {
      await createNotificationIfNotExists({
        id: `NOTIF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        userId: report.patientId,
        role: 'patient',
        title: 'New Medical Report Uploaded by Doctor',
        message: `${report.doctorName} uploaded report "${report.title}" to your health records.`,
        date: report.date || new Date().toISOString().split('T')[0],
        read: false,
        link: '/patient/reports',
        type: 'report_shared'
      });
    }

    setTimeout(syncReportAlerts, 300);
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/reports/:id', async (req, res) => {
  try {
    await Report.deleteOne({ id: req.params.id });
    await Alert.deleteMany({ reportId: req.params.id });
    await TimelineEvent.deleteMany({ reportId: req.params.id });
    await SharedReport.deleteMany({ reportId: req.params.id });
    res.json({ message: 'Report deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Alerts
router.get('/alerts', async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/alerts', async (req, res) => {
  try {
    const alert = new Alert(req.body);
    await alert.save();
    res.status(201).json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/alerts/:id', async (req, res) => {
  try {
    const prev = await Alert.findOne({ id: req.params.id });
    const updateData = { ...req.body };
    if (updateData.status === 'reviewed' && !updateData.reviewedAt) {
      updateData.reviewedAt = new Date().toISOString();
    }
    const alert = await Alert.findOneAndUpdate({ id: req.params.id }, updateData, { new: true });

    if (alert && alert.patientId && ((prev && prev.status !== 'reviewed' && alert.status === 'reviewed') || (alert.doctorNote && alert.doctorNote !== prev?.doctorNote))) {
      const docFeedback = alert.doctorNote ? `: "${alert.doctorNote}"` : '.';
      await createNotificationIfNotExists({
        id: `NOTIF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        userId: alert.patientId,
        role: 'patient',
        title: 'Physician Feedback on Biomarker Alert',
        message: `Your doctor reviewed the ${alert.metric} alert (${alert.sourceReportTitle})${docFeedback}`,
        date: new Date().toISOString().split('T')[0],
        read: false,
        link: '/patient/alerts',
        type: 'doctor_note'
      });
    }

    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/alerts/sync', async (req, res) => {
  try {
    await syncReportAlerts();
    const alerts = await Alert.find().sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Automatic synchronization of reports to generate alerts for any out-of-range values
async function syncReportAlerts() {
  try {
    const reports = await Report.find().sort({ date: 1 });
    const users = await User.find();
    const userMap = new Map(users.map(u => [u.id, u.name]));

    for (let i = 0; i < reports.length; i++) {
      const rep = reports[i];
      if (!rep.extractedValues || rep.extractedValues.length === 0) continue;

      const patientName = userMap.get(rep.patientId) || rep.uploadedBy || 'Patient';

      for (let k = 0; k < rep.extractedValues.length; k++) {
        const val = rep.extractedValues[k];
        let isAbnormal = val.status === 'low' || val.status === 'high' || val.status === 'critical';

        // Check reference range if status was left as normal
        if (!isAbnormal) {
          const parsed = parseBiomarkerStatus(val.testName, val.referenceRange, val.value);
          if (parsed.status !== 'normal') {
            isAbnormal = true;
            val.status = parsed.status;
            val.minRange = parsed.minRange;
            val.maxRange = parsed.maxRange;
            if (val._id) {
              await Report.updateOne(
                { _id: rep._id, "extractedValues._id": val._id },
                {
                  $set: {
                    "extractedValues.$.status": parsed.status,
                    "extractedValues.$.minRange": parsed.minRange,
                    "extractedValues.$.maxRange": parsed.maxRange
                  }
                }
              );
            }
          }
        }

        if (isAbnormal) {
          // Check if alert already exists for this report and metric
          const existingAlert = await Alert.findOne({ reportId: rep.id, metric: val.testName });
          if (!existingAlert) {
            // Find chronological previous value for this patient and test
            let prevValue = null;
            let prevDate = null;
            const normMetric = (val.testName || '').toLowerCase().replace(/[^a-z0-9]/g, '');

            for (let j = i - 1; j >= 0; j--) {
              const prevRep = reports[j];
              if (prevRep.patientId === rep.patientId) {
                const match = (prevRep.extractedValues || []).find(v => {
                  const vm = (v.testName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                  return vm === normMetric || vm.includes(normMetric) || normMetric.includes(vm);
                });
                if (match) {
                  prevValue = match.value;
                  prevDate = prevRep.date;
                  break;
                }
              }
            }

            const draft = generateClinicalAlertDraft({
              metric: val.testName,
              currentValue: val.value,
              previousValue: prevValue,
              previousDate: prevDate,
              unit: val.unit,
              referenceRange: val.referenceRange,
              status: val.status,
              reportTitle: rep.title,
              patientName
            });

            const isCritical = val.status === 'critical';
            const alertId = `ALT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

            const newAlert = new Alert({
              id: alertId,
              patientId: rep.patientId,
              patientName,
              reportId: rep.id,
              sourceReportTitle: rep.title,
              metric: val.testName,
              value: val.value,
              previousValue: prevValue,
              previousDate: prevDate,
              changeDescription: draft.changeDescription,
              unit: val.unit,
              referenceRange: val.referenceRange,
              date: rep.date,
              severity: isCritical ? 'high' : 'medium',
              type: val.status === 'low' ? 'below_range' : 'above_range',
              status: 'active',
              aiMessage: draft.patientMessage,
              aiReasons: draft.possibleReasons,
              aiControlMeasures: draft.controlMeasures,
              aiDoctorSummary: draft.doctorSummary
            });

            await newAlert.save();
            console.log(`[Alert Sync] Generated alert ${newAlert.id} for ${val.testName} (${rep.title})`);
          }
        }
      }
    }
  } catch (err) {
    console.error('syncReportAlerts error:', err);
  }
}

// Timeline
router.get('/timeline', async (req, res) => {
  try {
    const events = await TimelineEvent.find().sort({ createdAt: -1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/timeline', async (req, res) => {
  try {
    const event = new TimelineEvent(req.body);
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Connections
router.get('/connections', async (req, res) => {
  try {
    const connections = await DoctorConnection.find().sort({ createdAt: -1 });
    res.json(connections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/connections', async (req, res) => {
  try {
    const conn = new DoctorConnection(req.body);
    await conn.save();

    // Auto-generate notification for recipient
    if (conn.requestedBy === 'doctor' && conn.patientId) {
      await createNotificationIfNotExists({
        id: `NOTIF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        userId: conn.patientId,
        role: 'patient',
        title: 'New Doctor Connection Request',
        message: `${conn.doctorName || 'A physician'} (${conn.doctorSpecialty || 'Specialist'}) requested access to your medical records.`,
        date: new Date().toISOString().split('T')[0],
        read: false,
        link: '/patient/doctors',
        type: 'access_request'
      });
    } else if (conn.requestedBy === 'patient' && conn.doctorId) {
      await createNotificationIfNotExists({
        id: `NOTIF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        userId: conn.doctorId,
        role: 'doctor',
        title: 'New Patient Connection Request',
        message: `Patient ${conn.patientId || 'A patient'} requested to connect and share medical records.`,
        date: new Date().toISOString().split('T')[0],
        read: false,
        link: '/doctor/requests',
        type: 'access_request'
      });
    }

    res.status(201).json(conn);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/connections/:id', async (req, res) => {
  try {
    const prev = await DoctorConnection.findOne({ id: req.params.id });
    const conn = await DoctorConnection.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });

    if (prev && prev.status !== 'connected' && conn && conn.status === 'connected') {
      if (conn.requestedBy === 'doctor' && conn.doctorId) {
        // Patient approved doctor's request -> notify doctor
        await createNotificationIfNotExists({
          id: `NOTIF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
          userId: conn.doctorId,
          role: 'doctor',
          title: 'Connection Request Approved',
          message: `Patient ${conn.patientId} approved your request for medical record access.`,
          date: new Date().toISOString().split('T')[0],
          read: false,
          link: `/doctor/patients/${conn.patientId}`,
          type: 'connection_accepted'
        });
      } else if (conn.requestedBy === 'patient' && conn.patientId) {
        // Doctor approved patient's request -> notify patient
        await createNotificationIfNotExists({
          id: `NOTIF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
          userId: conn.patientId,
          role: 'patient',
          title: 'Doctor Connection Approved',
          message: `${conn.doctorName || 'Doctor'} approved your connection request.`,
          date: new Date().toISOString().split('T')[0],
          read: false,
          link: '/patient/doctors',
          type: 'connection_accepted'
        });
      }
    }

    res.json(conn);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Shared Reports
router.get('/shared', async (req, res) => {
  try {
    const shared = await SharedReport.find().sort({ createdAt: -1 });
    res.json(shared);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/shared', async (req, res) => {
  try {
    const shared = new SharedReport(req.body);
    await shared.save();

    // Auto-generate notification for recipient
    if (shared.sharedBy === 'doctor' && shared.patientId) {
      await createNotificationIfNotExists({
        id: `NOTIF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        userId: shared.patientId,
        role: 'patient',
        title: 'New Clinical Report Received',
        message: `${shared.doctorName || 'Your doctor'} shared annotated report "${shared.reportTitle}" with you.`,
        date: new Date().toISOString().split('T')[0],
        read: false,
        link: '/patient/shared',
        type: 'report_shared'
      });
    } else if (shared.sharedBy === 'patient' && shared.doctorId) {
      await createNotificationIfNotExists({
        id: `NOTIF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        userId: shared.doctorId,
        role: 'doctor',
        title: 'New Patient Report Received',
        message: `Patient ${shared.patientName || shared.senderName || shared.patientId} shared report "${shared.reportTitle}" with you.`,
        date: new Date().toISOString().split('T')[0],
        read: false,
        link: `/doctor/patients/${shared.patientId}`,
        type: 'report_shared'
      });
    }

    res.status(201).json(shared);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Notifications
router.get('/notifications', async (req, res) => {
  try {
    const notifs = await Notification.find().sort({ createdAt: -1 });
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/notifications', async (req, res) => {
  try {
    const notif = await createNotificationIfNotExists(req.body);
    res.status(201).json(notif);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/notifications/:id/read', async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate({ id: req.params.id }, { read: true }, { new: true });
    res.json(notif);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/notifications/read-all', async (req, res) => {
  try {
    const { userId, role } = req.body || {};
    const query = {};
    if (userId && role) {
      query.$or = [{ userId: new RegExp(`^${userId}$`, 'i') }, { role }];
    } else if (userId) {
      query.$or = [{ userId: new RegExp(`^${userId}$`, 'i') }, { role: userId }];
    } else if (role) {
      query.role = role;
    }
    await Notification.updateMany(query, { read: true });
    res.json({ message: 'All read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/notifications/:id', async (req, res) => {
  try {
    await Notification.deleteOne({ id: req.params.id });
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/notifications', async (req, res) => {
  try {
    const { userId, role } = req.query || {};
    const query = {};
    if (userId && role) {
      query.$or = [{ userId: new RegExp(`^${userId}$`, 'i') }, { role }];
    } else if (userId) {
      query.$or = [{ userId: new RegExp(`^${userId}$`, 'i') }, { role: userId }];
    } else if (role) {
      query.role = role;
    }
    await Notification.deleteMany(query);
    res.json({ message: 'All cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Doctor Notes
router.get('/notes', async (req, res) => {
  try {
    const notes = await DoctorNote.find().sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/notes', async (req, res) => {
  try {
    const note = new DoctorNote(req.body);
    await note.save();

    if (note.sharedWithPatient && note.patientId) {
      await createNotificationIfNotExists({
        id: `NOTIF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        userId: note.patientId,
        role: 'patient',
        title: 'New Clinical Note from Doctor',
        message: `${note.doctorName || 'Your doctor'} added a clinical note: "${note.text.substring(0, 70)}${note.text.length > 70 ? '...' : ''}"`,
        date: new Date().toISOString().split('T')[0],
        read: false,
        link: '/patient/timeline',
        type: 'doctor_note'
      });
    }

    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Messages (Direct Patient-Doctor Communication)
router.get('/messages', async (req, res) => {
  try {
    const { patientId, doctorId } = req.query;
    let query = {};
    if (patientId && doctorId) {
      query = { patientId, doctorId };
    } else if (patientId) {
      query = { patientId };
    } else if (doctorId) {
      query = { doctorId };
    }
    const messages = await Message.find(query).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/messages', async (req, res) => {
  try {
    const msg = new Message(req.body);
    await msg.save();

    // Auto-create notification for the recipient
    const recipientRole = msg.senderRole === 'patient' ? 'doctor' : 'patient';
    await createNotificationIfNotExists({
      id: `NOTIF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      userId: msg.recipientId,
      role: recipientRole,
      title: msg.senderRole === 'patient' ? 'New Message from Patient' : 'New Message from Doctor',
      message: `${msg.senderName}: "${msg.message.substring(0, 60)}${msg.message.length > 60 ? '...' : ''}"`,
      date: new Date().toISOString().split('T')[0],
      read: false,
      link: msg.senderRole === 'patient' ? `/doctor/patients/${msg.patientId}` : '/patient/dashboard',
      type: 'doctor_note'
    });

    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/messages/read', async (req, res) => {
  try {
    const { patientId, doctorId, readerId } = req.body || {};
    const query = {};
    if (patientId) query.patientId = patientId;
    if (doctorId) query.doctorId = doctorId;
    if (readerId) query.recipientId = readerId;
    await Message.updateMany(query, { read: true });
    res.json({ message: 'Messages marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seed initial consultation messages between connected doctor and patient
async function seedInitialMessages() {
  try {
    const count = await Message.countDocuments();
    if (count === 0) {
      const conn = await DoctorConnection.findOne({ status: 'connected' });
      const patientId = conn?.patientId || 'PID-65374';
      const doctorId = conn?.doctorId || 'DOC-85787';
      const doctorName = conn?.doctorName || 'Dr. doctor';
      const patient = await User.findOne({ id: patientId });
      const patientName = patient?.name || 'Aarav Sharma';

      const initialMsgs = [
        {
          id: `MSG-${Date.now() - 3600000 * 24}`,
          patientId,
          doctorId,
          senderId: doctorId,
          senderName: doctorName,
          senderRole: 'doctor',
          recipientId: patientId,
          recipientName: patientName,
          message: 'Hello, I have reviewed your latest blood test results. Your hemoglobin levels look stable, but please keep an eye on your fasting glucose levels.',
          timestamp: 'Yesterday 10:30 AM',
          read: true,
          createdAt: new Date(Date.now() - 3600000 * 24)
        },
        {
          id: `MSG-${Date.now() - 3600000 * 18}`,
          patientId,
          doctorId,
          senderId: patientId,
          senderName: patientName,
          senderRole: 'patient',
          recipientId: doctorId,
          recipientName: doctorName,
          message: 'Thank you Doctor! Should I continue taking the vitamin supplements prescribed last month?',
          timestamp: 'Yesterday 04:15 PM',
          read: true,
          createdAt: new Date(Date.now() - 3600000 * 18)
        },
        {
          id: `MSG-${Date.now() - 3600000 * 2}`,
          patientId,
          doctorId,
          senderId: doctorId,
          senderName: doctorName,
          senderRole: 'doctor',
          recipientId: patientId,
          recipientName: patientName,
          message: 'Yes, please continue the weekly Vitamin D dosage as directed. Feel free to message here if you experience any symptoms.',
          timestamp: 'Today 09:00 AM',
          read: false,
          createdAt: new Date(Date.now() - 3600000 * 2)
        }
      ];

      for (const m of initialMsgs) {
        await Message.create(m);
      }
      console.log('Seeded initial patient-doctor consultation messages.');
    }
  } catch (err) {
    console.error('Seed messages error:', err);
  }
}
setTimeout(seedInitialMessages, 1500);

// Initial seed helper for existing records
async function seedInitialNotifications() {
  try {
    const notifCount = await Notification.countDocuments();
    if (notifCount === 0) {
      const sharedReports = await SharedReport.find();
      for (const s of sharedReports) {
        if (s.sharedBy === 'doctor' && s.patientId) {
          await Notification.create({
            id: `NOTIF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
            userId: s.patientId,
            role: 'patient',
            title: 'New Clinical Report Received',
            message: `${s.doctorName || 'Dr. doctor'} shared annotated report "${s.reportTitle}" with you.`,
            date: s.sharedAt ? s.sharedAt.split('T')[0] : new Date().toISOString().split('T')[0],
            read: false,
            link: '/patient/shared',
            type: 'report_shared'
          });
        } else if (s.sharedBy === 'patient' && s.doctorId) {
          await Notification.create({
            id: `NOTIF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
            userId: s.doctorId,
            role: 'doctor',
            title: 'New Patient Report Received',
            message: `Patient ${s.patientName || s.patientId} shared report "${s.reportTitle}" with you.`,
            date: s.sharedAt ? s.sharedAt.split('T')[0] : new Date().toISOString().split('T')[0],
            read: false,
            link: `/doctor/patients/${s.patientId}`,
            type: 'report_shared'
          });
        }
      }

      const connections = await DoctorConnection.find();
      for (const c of connections) {
        if (c.status === 'connected') {
          await Notification.create({
            id: `NOTIF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
            userId: c.doctorId,
            role: 'doctor',
            title: 'Connection Active',
            message: `Connected with Patient ${c.patientId} for medical record access.`,
            date: c.connectedAt ? c.connectedAt.split('T')[0] : new Date().toISOString().split('T')[0],
            read: false,
            link: `/doctor/patients/${c.patientId}`,
            type: 'connection_accepted'
          });
          await Notification.create({
            id: `NOTIF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
            userId: c.patientId,
            role: 'patient',
            title: 'Doctor Connected',
            message: `Connected with ${c.doctorName} (${c.doctorSpecialty || 'Physician'}).`,
            date: c.connectedAt ? c.connectedAt.split('T')[0] : new Date().toISOString().split('T')[0],
            read: false,
            link: '/patient/doctors',
            type: 'connection_accepted'
          });
        }
      }
    }
  } catch (err) {
    console.error('Initial notification seeding error:', err);
  }
}
setTimeout(seedInitialNotifications, 1000);
setTimeout(cleanupDuplicateNotifications, 1400);

// Backfill rawText on existing reports if empty
async function backfillExistingReports() {
  try {
    const cbcText = `METROCARE DIAGNOSTICS\nReport Title: Complete Blood Count\nPatient: Aarav Sharma\nDate: 2023-10-15\n\nTEST NAME RESULT UNITS REF. RANGE\nHemoglobin 11.2 g/dL 13.0-17.0\nWBC Count 8500 /cumm 4000-11000\nPlatelet Count 220000 /mcL 150000-450000\nRBC Count 4.2 mil/mcL 4.5-5.9\nAuthorized Signatory: Dr. Ananya Mehta\n*** End of Report ***`;

    const lipidText = `METROCARE DIAGNOSTICS\nReport Title: Lipid Panel\nPatient: Aarav Sharma\nDate: 2023-10-20\n\nTEST NAME RESULT UNITS REF. RANGE\nTotal Cholesterol 240 mg/dL < 200\nTriglycerides 180 mg/dL < 150\nHDL Cholesterol 35 mg/dL > 40\nLDL Cholesterol 160 mg/dL < 100\nAuthorized Signatory: Dr. Ananya Mehta\n*** End of Report ***`;

    const reports = await Report.find();
    for (const r of reports) {
      if (!r.rawText || r.rawText.trim() === '') {
        if (r.title && r.title.toLowerCase().includes('lipid')) {
          r.rawText = lipidText;
        } else {
          r.rawText = cbcText;
        }
        await r.save();
        console.log(`Backfilled rawText for report ${r.id} (${r.title})`);
      }
    }
  } catch (err) {
    console.error('Backfill reports error:', err);
  }
}
setTimeout(backfillExistingReports, 1200);
setTimeout(syncReportAlerts, 1600);

export default router;
