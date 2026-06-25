export type StateLandingLocale = "en" | "hi";

export type StateLandingFeature = {
  id: string;
  title: string;
  desc: string;
};

export type StateLandingStep = {
  n: string;
  title: string;
  desc: string;
};

export type StateLandingCopy = {
  signIn: string;
  railHint: string;
  heroEyebrow: string;
  heroBody: string;
  pills: { manage: string; train: string; connect: string };
  scrollCue: string;
  mission: string;
  olympic: string;
  vijaybhava: string;
  whyEyebrow: string;
  whyTitle: string;
  whyDesc: string;
  stats: { one: string; districts: string; goal: string };
  portalEyebrow: string;
  portalTitle: string;
  portalDesc: string;
  features: StateLandingFeature[];
  howEyebrow: string;
  howTitle: string;
  howDesc: string;
  steps: StateLandingStep[];
  ctaTitle: string;
  ctaDesc: string;
  footerTagline: string;
  footerOtherPortals: string;
  footerAcademy: string;
  footerCoach: string;
  footerAthlete: string;
  footerGovernance: string;
  footerVerification: string;
  footerFunds: string;
  footerReporting: string;
  footerGetStarted: string;
  footerSignIn: string;
  footerPrepared: string;
  matrubhashaLabel: string;
  matrubhashaSwitchToEnglish: string;
};

export const stateLandingCopy: Record<StateLandingLocale, StateLandingCopy> = {
  en: {
    signIn: "Sign in",
    railHint: "State portal access for the Government of Haryana",
    heroEyebrow: "Government of Haryana · The road to 2036",
    heroBody:
      "From the village akhara to the 2036 Olympic podium — one bridge for every academy, athlete and coach in Haryana, governed from a single state command centre.",
    pills: { manage: "Manage", train: "Train", connect: "Connect" },
    scrollCue: "Scroll to explore",
    mission: "Mission",
    olympic: "Olympic",
    vijaybhava: "Vijaybhava",
    whyEyebrow: "Why KhelSetu",
    whyTitle: "One command centre for the entire sporting pipeline",
    whyDesc:
      "Today, talent, infrastructure and grants live in scattered registers and PDFs. KhelSetu replaces them with a single verified system — so the state can see every nursery, athlete and rupee, and act on what the data shows.",
    stats: {
      one: "verified source of truth",
      districts: "districts on one map",
      goal: "the goal everything ladders to",
    },
    portalEyebrow: "Inside the state portal",
    portalTitle: "Everything the directorate needs, in one place",
    portalDesc:
      "Each module of the state portal maps to a real job — from registering nurseries to releasing funds and reporting to leadership.",
    features: [
      {
        id: "overview",
        title: "State overview",
        desc: "A live command centre aggregating every nursery, athlete and rupee across Haryana on one dashboard.",
      },
      {
        id: "nurseries",
        title: "Sports nurseries",
        desc: "One verified registry of every academy and nursery — location, sports offered, capacity and status.",
      },
      {
        id: "athletes",
        title: "Athletes",
        desc: "Track every registered athlete statewide with sport, district and performance history in one roster.",
      },
      {
        id: "scouting",
        title: "Talent scouting",
        desc: "Shortlist athletes by sport, district and rating to build the pipeline for the 2036 Olympic squad.",
      },
      {
        id: "verification",
        title: "Verification",
        desc: "Review verified, pending and flagged records so support only ever follows genuine, audited talent.",
      },
      {
        id: "funds",
        title: "Fund utilisation",
        desc: "Release scheme grants, track disbursement and audit every rupee down to the receiving academy.",
      },
      {
        id: "districts",
        title: "Districts",
        desc: "Compare coverage and performance across all districts to find the gaps that need investment.",
      },
      {
        id: "reports",
        title: "Reports",
        desc: "Generate leadership-ready reports and exports for reviews and budget decisions in a single click.",
      },
    ],
    howEyebrow: "How it works",
    howTitle: "From registration to the podium",
    howDesc: "A single governed flow the state runs end to end.",
    steps: [
      {
        n: "01",
        title: "Register & onboard",
        desc: "Districts and academies submit nurseries; the state approves onboarding requests from one queue.",
      },
      {
        n: "02",
        title: "Verify the ground truth",
        desc: "Infrastructure and athletes are verified, flagged or held — building a base the state can trust.",
      },
      {
        n: "03",
        title: "Track performance",
        desc: "Athlete progress and academy output roll up to a statewide view that updates in real time.",
      },
      {
        n: "04",
        title: "Scout for 2036",
        desc: "Filter the verified pool to shortlist medal prospects and feed the Olympic preparation pathway.",
      },
      {
        n: "05",
        title: "Disburse & audit funds",
        desc: "Scheme grants flow to the right academies with a full, inspectable disbursement trail.",
      },
      {
        n: "06",
        title: "Report to leadership",
        desc: "Every metric is one export away — for cabinet reviews, audits and budget planning.",
      },
    ],
    ctaTitle: "Ready to govern the road to 2036?",
    ctaDesc:
      "Sign in to the Haryana state portal to manage nurseries, verify athletes, scout talent and disburse funds — all from one screen.",
    footerTagline:
      "The bridge from grassroots sport to the Olympic podium for the Government of Haryana.",
    footerOtherPortals: "Other portals",
    footerAcademy: "Academy portal",
    footerCoach: "Coach portal",
    footerAthlete: "Athlete app",
    footerGovernance: "Governance",
    footerVerification: "Verification & audit",
    footerFunds: "Fund utilisation",
    footerReporting: "Statewide reporting",
    footerGetStarted: "Get started",
    footerSignIn: "State portal sign in",
    footerPrepared: "Prepared for the Government of Haryana · Panchkula, Haryana",
    matrubhashaLabel: "मातृभाषा",
    matrubhashaSwitchToEnglish: "English",
  },
  hi: {
    signIn: "प्रवेश करें",
    railHint: "हरियाणा सरकार के लिए राज्य पोर्टल पहुँच",
    heroEyebrow: "हरियाणा सरकार · 2036 की ओर",
    heroBody:
      "गाँव के अखाड़े से 2036 ओलंपिक मंच तक — हरियाणा के हर अकादमी, खिलाड़ी और कोच के लिए एक पुल, जो एक ही राज्य कमान केंद्र से संचालित होता है।",
    pills: { manage: "प्रबंधन", train: "प्रशिक्षण", connect: "जुड़ाव" },
    scrollCue: "और जानने के लिए स्क्रॉल करें",
    mission: "मिशन",
    olympic: "ओलंपिक",
    vijaybhava: "विजयभव",
    whyEyebrow: "खेलसेतु क्यों",
    whyTitle: "पूरे खेल पाइपलाइन के लिए एक कमान केंद्र",
    whyDesc:
      "आज प्रतिभा, अवसंरचना और अनुदान बिखरे रजिस्टरों और PDF में रहते हैं। खेलसेतु उन्हें एक सत्यापित प्रणाली से बदलता है — ताकि राज्य हर नर्सरी, खिलाड़ी और रुपये को देख सके और डेटा के आधार पर निर्णय ले सके।",
    stats: {
      one: "सत्यापित एकमात्र स्रोत",
      districts: "एक मानचित्र पर सभी जिले",
      goal: "जिस लक्ष्य की ओर सब कुछ बढ़ता है",
    },
    portalEyebrow: "राज्य पोर्टल के अंदर",
    portalTitle: "निदेशालय को जो चाहिए, एक ही स्थान पर",
    portalDesc:
      "राज्य पोर्टल का हर मॉड्यूल एक वास्तविक कार्य से जुड़ा है — नर्सरी पंजीकरण से लेकर धन वितरण और नेतृत्व को रिपोर्ट तक।",
    features: [
      {
        id: "overview",
        title: "राज्य अवलोकन",
        desc: "हरियाणा भर की हर नर्सरी, खिलाड़ी और रुपये को एक डैशबोर्ड पर जोड़ने वाला लाइव कमान केंद्र।",
      },
      {
        id: "nurseries",
        title: "खेल नर्सरी",
        desc: "हर अकादमी और नर्सरी का एक सत्यापित रजिस्टर — स्थान, खेल, क्षमता और स्थिति।",
      },
      {
        id: "athletes",
        title: "खिलाड़ी",
        desc: "राज्य भर के हर पंजीकृत खिलाड़ी को खेल, जिला और प्रदर्शन इतिहास के साथ एक रोस्टर में ट्रैक करें।",
      },
      {
        id: "scouting",
        title: "प्रतिभा खोज",
        desc: "खेल, जिला और रेटिंग से खिलाड़ियों की शॉर्टलिस्ट बनाएं और 2036 ओलंपिक दल की तैयारी करें।",
      },
      {
        id: "verification",
        title: "सत्यापन",
        desc: "सत्यापित, लंबित और फ़्लैग किए गए रिकॉर्ड की समीक्षा करें ताकि सहायता केवल वास्तविक, ऑडिटेड प्रतिभा को मिले।",
      },
      {
        id: "funds",
        title: "धन उपयोग",
        desc: "योजना अनुदान जारी करें, वितरण ट्रैक करें और हर रुपये का ऑडिट प्राप्त अकादमी तक करें।",
      },
      {
        id: "districts",
        title: "जिले",
        desc: "सभी जिलों में कवरेज और प्रदर्शन की तुलना करें और निवेश की जरूरत वाले अंतराल पहचानें।",
      },
      {
        id: "reports",
        title: "रिपोर्ट",
        desc: "नेतृत्व के लिए तैयार रिपोर्ट और निर्यात एक क्लिक में — समीक्षा, ऑडिट और बजट निर्णय के लिए।",
      },
    ],
    howEyebrow: "यह कैसे काम करता है",
    howTitle: "पंजीकरण से मंच तक",
    howDesc: "राज्य द्वारा अंत से अंत तक चलाया जाने वाला एक शासित प्रवाह।",
    steps: [
      {
        n: "01",
        title: "पंजीकरण और ऑनबोर्डिंग",
        desc: "जिले और अकादमियाँ नर्सरी जमा करते हैं; राज्य एक ही कतार से ऑनबोर्डिंग अनुरोध स्वीकार करता है।",
      },
      {
        n: "02",
        title: "जमीनी सत्य की पुष्टि",
        desc: "अवसंरचना और खिलाड़ियों का सत्यापन, फ़्लैग या होल्ड — जिस आधार पर राज्य भरोसा कर सके।",
      },
      {
        n: "03",
        title: "प्रदर्शन ट्रैक करें",
        desc: "खिलाड़ी की प्रगति और अकादमी का आउटपुट राज्यव्यापी दृश्य में मिलता है, जो वास्तविक समय में अपडेट होता है।",
      },
      {
        n: "04",
        title: "2036 के लिए खोज",
        desc: "सत्यापित पूल को फ़िल्टर करके पदक की उम्मीद वाले खिलाड़ियों की शॉर्टलिस्ट बनाएं और ओलंपिक तैयारी पथ को खिलाएं।",
      },
      {
        n: "05",
        title: "धन वितरण और ऑडिट",
        desc: "योजना अनुदान सही अकादमियों तक पहुँचते हैं, पूरी जाँच योग्य वितरण ट्रेल के साथ।",
      },
      {
        n: "06",
        title: "नेतृत्व को रिपोर्ट",
        desc: "हर मीट्रिक एक निर्यात दूर — मंत्रिमंडल समीक्षा, ऑडिट और बजट योजना के लिए।",
      },
    ],
    ctaTitle: "2036 की राह पर शासन के लिए तैयार हैं?",
    ctaDesc:
      "हरियाणा राज्य पोर्टल में प्रवेश करें — नर्सरी प्रबंधन, खिलाड़ी सत्यापन, प्रतिभा खोज और धन वितरण, सब एक ही स्क्रीन से।",
    footerTagline:
      "हरियाणा सरकार के लिए जमीनी खेल से ओलंपिक मंच तक का पुल।",
    footerOtherPortals: "अन्य पोर्टल",
    footerAcademy: "अकादमी पोर्टल",
    footerCoach: "कोच पोर्टल",
    footerAthlete: "खिलाड़ी ऐप",
    footerGovernance: "शासन",
    footerVerification: "सत्यापन और ऑडिट",
    footerFunds: "धन उपयोग",
    footerReporting: "राज्यव्यापी रिपोर्टिंग",
    footerGetStarted: "शुरू करें",
    footerSignIn: "राज्य पोर्टल प्रवेश",
    footerPrepared: "हरियाणा सरकार के लिए तैयार · पंचकुला, हरियाणा",
    matrubhashaLabel: "मातृभाषा",
    matrubhashaSwitchToEnglish: "English",
  },
};
