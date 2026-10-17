export interface QueryPageStrings {
  assistantName: string;
  online: string;
  newConversation: string;
  viewAllConversations: string;
  searchConversations: string;
  recent: string;
  noConversations: string;
  noConversationsMatch: string;
  provenanceNote: string;
  loadingConversation: string;
  emptyTitle: string;
  emptyBody: string;
  suggestedQueries: string[];
  you: string;
  sources: string;
  goodResponse: string;
  poorResponse: string;
  copyAnswer: string;
  searching: string;
  inputPlaceholder: string;
  speakToBhumi: string;
  sendQuestion: string;
  disclaimer: string;
  pageLanguage: string;
  askAQuestion: string;
  toggleThreads: string;
  collapseSidebar: string;
}

// languages with full translated coverage for on-screen text; every other
// VOICE_LANGUAGES entry falls back to English — voice input/output is unaffected,
// since that's driven by Sarvam's auto-detection, not this dictionary
export const QUERY_I18N_SUPPORTED_LOCALES = ["en-IN", "hi-IN", "bn-IN", "ta-IN", "te-IN", "mr-IN"] as const;

export const QUERY_I18N: Record<string, QueryPageStrings> = {
  "en-IN": {
    assistantName: "BHUMI Assistant",
    online: "Online",
    newConversation: "New conversation",
    viewAllConversations: "Conversations",
    searchConversations: "Search conversations…",
    recent: "Recent",
    noConversations: "No conversations yet.",
    noConversationsMatch: "No conversations match.",
    provenanceNote: "Every answer is traced to a source page",
    loadingConversation: "Loading conversation…",
    emptyTitle: "I'm Bhumi, Mining Intelligence Assistant",
    emptyBody:
      "",
    suggestedQueries: [
      "Summarise coal production trends across subsidiaries for FY 2025-26",
      "Which mines reported the highest overburden removal last quarter?",
      "List pending environmental clearance issues by state",
      "Compare washery throughput between SECL and MCL",
    ],
    you: "You",
    sources: "Sources",
    goodResponse: "Good response",
    poorResponse: "Poor response",
    copyAnswer: "Copy answer",
    searching: "Searching the corpus…",
    inputPlaceholder: "Message BHUMI Assistant, or use the mic to speak…",
    speakToBhumi: "Speak to Bhumi",
    sendQuestion: "Send question",
    disclaimer: "Answers are generated from indexed documents only. Verify figures against the cited source before publication.",
    pageLanguage: "Page language",
    askAQuestion: "Ask a question",
    toggleThreads: "Toggle threads",
    collapseSidebar: "Collapse sidebar",
  },

  "hi-IN": {
    assistantName: "भूमि सहायक",
    online: "ऑनलाइन",
    newConversation: "नई बातचीत",
    viewAllConversations: "बातचीत",
    searchConversations: "बातचीत खोजें…",
    recent: "हाल की",
    noConversations: "अभी तक कोई बातचीत नहीं है।",
    noConversationsMatch: "कोई बातचीत मेल नहीं खाती।",
    provenanceNote: "हर उत्तर स्रोत पृष्ठ से जुड़ा है",
    loadingConversation: "बातचीत लोड हो रही है…",
    emptyTitle: "अभिलेखागार के बारे में कुछ भी पूछें",
    emptyBody:
      "नौ सहायक कंपनियों में 18,942 अनुक्रमित दस्तावेज़। हर उत्तर उस स्रोत दस्तावेज़ और पृष्ठ का हवाला देता है जहाँ से वह आया है — 23 भाषाओं में से किसी में भी टाइप करें या बोलें।",
    suggestedQueries: [
      "वित्त वर्ष 2025-26 के लिए सहायक कंपनियों में कोयला उत्पादन के रुझान का सारांश दें",
      "पिछली तिमाही में किन खदानों ने सबसे अधिक ओवरबर्डन हटाने की सूचना दी?",
      "राज्यवार लंबित पर्यावरण मंज़ूरी के मुद्दों की सूची बनाएं",
      "SECL और MCL के बीच वॉशरी थ्रूपुट की तुलना करें",
    ],
    you: "आप",
    sources: "स्रोत",
    goodResponse: "अच्छा उत्तर",
    poorResponse: "खराब उत्तर",
    copyAnswer: "उत्तर कॉपी करें",
    searching: "अभिलेखागार खोजा जा रहा है…",
    inputPlaceholder: "भूमि सहायक को संदेश भेजें, या बोलने के लिए माइक का उपयोग करें…",
    speakToBhumi: "भूमि से बात करें",
    sendQuestion: "प्रश्न भेजें",
    disclaimer: "उत्तर केवल अनुक्रमित दस्तावेज़ों से उत्पन्न होते हैं। प्रकाशन से पहले उद्धृत स्रोत के विरुद्ध आंकड़ों को सत्यापित करें।",
    pageLanguage: "पृष्ठ भाषा",
    askAQuestion: "एक प्रश्न पूछें",
    toggleThreads: "थ्रेड्स टॉगल करें",
    collapseSidebar: "साइडबार संक्षिप्त करें",
  },

  "bn-IN": {
    assistantName: "ভূমি সহায়ক",
    online: "অনলাইন",
    newConversation: "নতুন কথোপকথন",
    viewAllConversations: "কথোপকথনসমূহ",
    searchConversations: "কথোপকথন খুঁজুন…",
    recent: "সাম্প্রতিক",
    noConversations: "এখনও কোনো কথোপকথন নেই।",
    noConversationsMatch: "কোনো কথোপকথন মেলে না।",
    provenanceNote: "প্রতিটি উত্তর একটি উৎস পৃষ্ঠার সাথে যুক্ত",
    loadingConversation: "কথোপকথন লোড হচ্ছে…",
    emptyTitle: "সংগ্রহশালা সম্পর্কে যা কিছু জিজ্ঞাসা করুন",
    emptyBody:
      "নয়টি সহায়ক সংস্থা জুড়ে 18,942টি সূচিত নথি। প্রতিটি উত্তর সেই উৎস নথি এবং পৃষ্ঠা উদ্ধৃত করে যেখান থেকে এটি এসেছে — 23টি ভাষার যেকোনো একটিতে টাইপ করুন বা বলুন।",
    suggestedQueries: [
      "২০২৫-২৬ অর্থবছরের জন্য সহায়ক সংস্থাগুলিতে কয়লা উৎপাদনের প্রবণতার সারসংক্ষেপ দিন",
      "গত ত্রৈমাসিকে কোন খনিগুলি সর্বাধিক ওভারবার্ডেন অপসারণের রিপোর্ট করেছে?",
      "রাজ্য অনুযায়ী মুলতুবি পরিবেশগত ছাড়পত্রের সমস্যাগুলির তালিকা করুন",
      "SECL এবং MCL-এর মধ্যে ওয়াশারি থ্রুপুট তুলনা করুন",
    ],
    you: "আপনি",
    sources: "উৎস",
    goodResponse: "ভালো উত্তর",
    poorResponse: "খারাপ উত্তর",
    copyAnswer: "উত্তর কপি করুন",
    searching: "সংগ্রহশালা অনুসন্ধান করা হচ্ছে…",
    inputPlaceholder: "ভূমি সহায়ককে বার্তা পাঠান, অথবা কথা বলতে মাইক ব্যবহার করুন…",
    speakToBhumi: "ভূমির সাথে কথা বলুন",
    sendQuestion: "প্রশ্ন পাঠান",
    disclaimer: "উত্তরগুলি শুধুমাত্র সূচিত নথি থেকে তৈরি করা হয়। প্রকাশের আগে উদ্ধৃত উৎসের বিরুদ্ধে পরিসংখ্যান যাচাই করুন।",
    pageLanguage: "পৃষ্ঠার ভাষা",
    askAQuestion: "একটি প্রশ্ন জিজ্ঞাসা করুন",
    toggleThreads: "থ্রেড টগল করুন",
    collapseSidebar: "সাইডবার সংকুচিত করুন",
  },

  "ta-IN": {
    assistantName: "பூமி உதவியாளர்",
    online: "ஆன்லைன்",
    newConversation: "புதிய உரையாடல்",
    viewAllConversations: "உரையாடல்கள்",
    searchConversations: "உரையாடல்களைத் தேடு…",
    recent: "சமீபத்தியவை",
    noConversations: "இதுவரை உரையாடல்கள் இல்லை.",
    noConversationsMatch: "பொருந்தும் உரையாடல்கள் இல்லை.",
    provenanceNote: "ஒவ்வொரு பதிலும் மூல பக்கத்துடன் இணைக்கப்பட்டுள்ளது",
    loadingConversation: "உரையாடல் ஏற்றப்படுகிறது…",
    emptyTitle: "தொகுப்பு பற்றி எதையும் கேளுங்கள்",
    emptyBody:
      "ஒன்பது துணை நிறுவனங்களில் 18,942 அட்டவணைப்படுத்தப்பட்ட ஆவணங்கள். ஒவ்வொரு பதிலும் அது வந்த மூல ஆவணத்தையும் பக்கத்தையும் மேற்கோள் காட்டுகிறது — 23 மொழிகளில் ஏதேனும் ஒன்றில் தட்டச்சு செய்யவும் அல்லது பேசவும்.",
    suggestedQueries: [
      "2025-26 நிதியாண்டிற்கான துணை நிறுவனங்களில் நிலக்கரி உற்பத்தி போக்குகளை சுருக்கமாகக் கூறுங்கள்",
      "கடந்த காலாண்டில் எந்த சுரங்கங்கள் அதிக ஓவர்பர்டன் அகற்றலைப் புகாரளித்தன?",
      "மாநிலம் வாரியாக நிலுவையில் உள்ள சுற்றுச்சூழல் அனுமதி பிரச்சினைகளை பட்டியலிடுங்கள்",
      "SECL மற்றும் MCL இடையே வாஷரி த்ரூபுட்டை ஒப்பிடுங்கள்",
    ],
    you: "நீங்கள்",
    sources: "மூலங்கள்",
    goodResponse: "நல்ல பதில்",
    poorResponse: "மோசமான பதில்",
    copyAnswer: "பதிலை நகலெடு",
    searching: "தொகுப்பு தேடப்படுகிறது…",
    inputPlaceholder: "பூமி உதவியாளருக்கு செய்தி அனுப்பவும், அல்லது பேச மைக்கைப் பயன்படுத்தவும்…",
    speakToBhumi: "பூமியிடம் பேசுங்கள்",
    sendQuestion: "கேள்வியை அனுப்பு",
    disclaimer: "பதில்கள் அட்டவணைப்படுத்தப்பட்ட ஆவணங்களில் இருந்து மட்டுமே உருவாக்கப்படுகின்றன. வெளியிடுவதற்கு முன் மேற்கோள் காட்டப்பட்ட மூலத்திற்கு எதிராக புள்ளிவிவரங்களை சரிபார்க்கவும்.",
    pageLanguage: "பக்க மொழி",
    askAQuestion: "ஒரு கேள்வி கேளுங்கள்",
    toggleThreads: "த்ரெட்களை நிலைமாற்று",
    collapseSidebar: "பக்கப்பட்டியை சுருக்கு",
  },

  "te-IN": {
    assistantName: "భూమి సహాయకుడు",
    online: "ఆన్‌లైన్",
    newConversation: "కొత్త సంభాషణ",
    viewAllConversations: "సంభాషణలు",
    searchConversations: "సంభాషణలను వెతకండి…",
    recent: "ఇటీవలివి",
    noConversations: "ఇంకా సంభాషణలు లేవు.",
    noConversationsMatch: "సరిపోలే సంభాషణలు లేవు.",
    provenanceNote: "ప్రతి సమాధానం ఒక మూల పేజీకి ట్రేస్ చేయబడింది",
    loadingConversation: "సంభాషణ లోడ్ అవుతోంది…",
    emptyTitle: "కార్పస్ గురించి ఏదైనా అడగండి",
    emptyBody:
      "తొమ్మిది అనుబంధ సంస్థలలో 18,942 సూచించబడిన పత్రాలు. ప్రతి సమాధానం అది వచ్చిన మూల పత్రం మరియు పేజీని ఉదహరిస్తుంది — 23 భాషలలో దేనిలోనైనా టైప్ చేయండి లేదా మాట్లాడండి.",
    suggestedQueries: [
      "FY 2025-26కి అనుబంధ సంస్థలలో బొగ్గు ఉత్పత్తి ధోరణులను సంగ్రహించండి",
      "గత త్రైమాసికంలో ఏ గనులు అత్యధిక ఓవర్‌బర్డెన్ తొలగింపును నివేదించాయి?",
      "రాష్ట్రాల వారీగా పెండింగ్‌లో ఉన్న పర్యావరణ అనుమతి సమస్యలను జాబితా చేయండి",
      "SECL మరియు MCL మధ్య వాషరీ థ్రూపుట్‌ను పోల్చండి",
    ],
    you: "మీరు",
    sources: "మూలాలు",
    goodResponse: "మంచి సమాధానం",
    poorResponse: "పేలవమైన సమాధానం",
    copyAnswer: "సమాధానాన్ని కాపీ చేయండి",
    searching: "కార్పస్‌ను వెతుకుతోంది…",
    inputPlaceholder: "భూమి సహాయకుడికి సందేశం పంపండి, లేదా మాట్లాడటానికి మైక్‌ను ఉపయోగించండి…",
    speakToBhumi: "భూమితో మాట్లాడండి",
    sendQuestion: "ప్రశ్న పంపండి",
    disclaimer: "సమాధానాలు సూచించబడిన పత్రాల నుండి మాత్రమే రూపొందించబడతాయి. ప్రచురణకు ముందు ఉదహరించిన మూలానికి వ్యతిరేకంగా గణాంకాలను ధృవీకరించండి.",
    pageLanguage: "పేజీ భాష",
    askAQuestion: "ఒక ప్రశ్న అడగండి",
    toggleThreads: "థ్రెడ్‌లను టోగుల్ చేయండి",
    collapseSidebar: "సైడ్‌బార్‌ను కుదించండి",
  },

  "mr-IN": {
    assistantName: "भूमी सहाय्यक",
    online: "ऑनलाइन",
    newConversation: "नवीन संभाषण",
    viewAllConversations: "संभाषणे",
    searchConversations: "संभाषणे शोधा…",
    recent: "अलीकडील",
    noConversations: "अद्याप कोणतीही संभाषणे नाहीत.",
    noConversationsMatch: "कोणतीही संभाषणे जुळत नाहीत.",
    provenanceNote: "प्रत्येक उत्तर स्रोत पृष्ठाशी जोडलेले आहे",
    loadingConversation: "संभाषण लोड होत आहे…",
    emptyTitle: "संग्रहाबद्दल काहीही विचारा",
    emptyBody:
      "नऊ उपकंपन्यांमधील 18,942 अनुक्रमित कागदपत्रे. प्रत्येक उत्तर ते ज्या स्रोत दस्तऐवज आणि पृष्ठावरून आले आहे त्याचा हवाला देते — 23 भाषांपैकी कोणत्याही भाषेत टाइप करा किंवा बोला.",
    suggestedQueries: [
      "आर्थिक वर्ष 2025-26 साठी उपकंपन्यांमधील कोळसा उत्पादन ट्रेंडचा सारांश द्या",
      "मागील तिमाहीत कोणत्या खाणींनी सर्वाधिक ओव्हरबर्डन काढल्याचे नोंदवले?",
      "राज्यनिहाय प्रलंबित पर्यावरण मंजुरी समस्यांची यादी करा",
      "SECL आणि MCL मधील वॉशरी थ्रूपुटची तुलना करा",
    ],
    you: "तुम्ही",
    sources: "स्रोत",
    goodResponse: "चांगले उत्तर",
    poorResponse: "खराब उत्तर",
    copyAnswer: "उत्तर कॉपी करा",
    searching: "संग्रह शोधला जात आहे…",
    inputPlaceholder: "भूमी सहाय्यकाला संदेश पाठवा, किंवा बोलण्यासाठी माइक वापरा…",
    speakToBhumi: "भूमीशी बोला",
    sendQuestion: "प्रश्न पाठवा",
    disclaimer: "उत्तरे केवळ अनुक्रमित दस्तऐवजांमधून तयार केली जातात. प्रकाशित करण्यापूर्वी उद्धृत स्रोताविरुद्ध आकडेवारी सत्यापित करा.",
    pageLanguage: "पृष्ठ भाषा",
    askAQuestion: "प्रश्न विचारा",
    toggleThreads: "थ्रेड्स टॉगल करा",
    collapseSidebar: "साइडबार संक्षिप्त करा",
  },
};

export const QUERY_UI_LANGUAGES = [
  { code: "en-IN", label: "English" },
  { code: "hi-IN", label: "हिन्दी" },
  { code: "bn-IN", label: "বাংলা" },
  { code: "ta-IN", label: "தமிழ்" },
  { code: "te-IN", label: "తెలుగు" },
  { code: "mr-IN", label: "मराठी" },
];

export function getQueryStrings(languageCode: string): QueryPageStrings {
  return QUERY_I18N[languageCode] ?? QUERY_I18N["en-IN"];
}
