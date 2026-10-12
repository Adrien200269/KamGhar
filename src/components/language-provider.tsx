"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Language = "en" | "ne";

export const translations: Record<string, { en: string; ne: string }> = {
  // Navigation & Common
  browseJobs: { en: "Browse Jobs", ne: "काम खोज्नुहोस्" },
  findWorkers: { en: "Find Workers", ne: "कामदार खोज्नुहोस्" },
  postJob: { en: "Post a Job", ne: "काम पोस्ट गर्नुहोस्" },
  dashboard: { en: "Dashboard", ne: "ड्यासबोर्ड" },
  login: { en: "Log In", ne: "लग इन" },
  register: { en: "Sign Up", ne: "दर्ता हुनुहोस्" },
  getStarted: { en: "Get Started", ne: "सुरु गर्नुहोस्" },
  signOut: { en: "Sign Out", ne: "लग आउट" },
  search: { en: "Search", ne: "खोजी गर्नुहोस्" },
  filter: { en: "Filter", ne: "फिल्टर" },
  all: { en: "All", ne: "सबै" },
  district: { en: "District", ne: "जिल्ला" },
  category: { en: "Category", ne: "विधा" },

  // Home Hero & Sections
  heroBadge: { en: "Nepal's #1 Local Gig Marketplace", ne: "नेपालको नं. १ स्थानीय गिग बजार" },
  heroTitle1: { en: "Find work.", ne: "काम खोज्नुहोस्।" },
  heroTitle2: { en: "Hire talent.", ne: "जनशक्ति रोज्नुहोस्।" },
  heroTitle3: { en: "Near you in Nepal.", ne: "तपाईंको नजिकै।" },
  heroSubtitle: {
    en: "Electricians, plumbers, tutors, designers — connect with verified local talent or find gigs, all sorted by proximity to your location.",
    ne: "इलेक्ट्रीसियन, प्लम्बर, शिक्षक, डिजाइनर — तपाईंको स्थान नजिकका प्रमाणित कामदारहरूसँग जोडिनुहोस् वा नयाँ काम पाउनुहोस्।",
  },
  searchPlaceholder: { en: "What service do you need? (e.g. Plumber, Painter...)", ne: "कुन सेवा खोज्दै हुनुहुन्छ? (उदा. प्लम्बर, पेन्टर...)" },
  selectDistrict: { en: "Select District", ne: "जिल्ला छान्नुहोस्" },
  allDistricts: { en: "All Nepal", ne: "नेपालभरि" },
  searchGigsBtn: { en: "Search Gigs", ne: "काम खोज्नुहोस्" },
  searchTalentBtn: { en: "Search Talent", ne: "कामदार खोज्नुहोस्" },
  popularServices: { en: "Popular Services", ne: "लोकप्रिय सेवाहरू" },
  howItWorksTitle: { en: "How KamGhar Works", ne: "कामघरले कसरी काम गर्छ?" },
  howItWorksSub: { en: "Find local jobs or hire reliable workers in three simple steps", ne: "तीन सरल चरणमा स्थानीय काम पाउनुहोस् वा कामदार खोज्नुहोस्" },
  step1Title: { en: "Post or Browse Gigs", ne: "काम पोस्ट वा खोजी गर्नुहोस्" },
  step1Desc: { en: "Post urgent requirements with budget & location or browse opportunities near you.", ne: "बजेट र स्थान सहित तुरुन्तै काम पोस्ट गर्नुहोस् वा नजिकका अवसरहरू हेर्नुहोस्।" },
  step2Title: { en: "Connect & In-App Chat", ne: "प्रत्यक्ष कुराकानी र च्याट" },
  step2Desc: { en: "Communicate in Nepali or English, negotiate rates, and verify identity seamlessly.", ne: "नेपाली वा अंग्रेजीमा कुरा गर्नुहोस्, दर तय गर्नुहोस् र सजिलै पहिचान प्रमाणीकरण गर्नुहोस्।" },
  step3Title: { en: "Get Work Done & Review", ne: "काम सम्पन्न र मूल्याङ्कन" },
  step3Desc: { en: "Track live arrival, complete the gig safely, and earn tier badges with 5-star reviews.", ne: "प्रत्यक्ष आगमन हेर्नुहोस्, सुरक्षित काम पूरा गर्नुहोस् र ५-तारे समीक्षा पाउनुहोस्।" },

  // Badges & Statuses
  availableNow: { en: "Available Now", ne: "अहिले उपलब्ध" },
  kamgharVerified: { en: "KamGhar Verified", ne: "कामघर प्रमाणित" },
  verifiedTalent: { en: "Verified Talent", ne: "प्रमाणित जनशक्ति" },
  chatNow: { en: "Chat Now", ne: "च्याट गर्नुहोस्" },
  callNow: { en: "Call", ne: "फोन गर्नुहोस्" },
  whatsAppAlert: { en: "WhatsApp", ne: "ह्वाट्सएप" },
  experience: { en: "Experience", ne: "अनुभव" },
  reviews: { en: "Reviews", ne: "समीक्षाहरू" },
  worksDone: { en: "Works Done", ne: "सम्पन्न काम" },
  hourlyRate: { en: "Hourly Rate", ne: "प्रति घण्टा दर" },
  budget: { en: "Budget", ne: "बजेट" },
  urgent: { en: "Urgent", ne: "आपतकालीन" },

  // Tier System
  kamGharPro: { en: "KamGhar Pro", ne: "कामघर प्रो" },
  goldTier: { en: "Gold Tier", ne: "गोल्ड टियर" },
  silverTier: { en: "Silver Tier", ne: "सिल्भर टियर" },
  bronzeTier: { en: "Bronze Tier", ne: "कांस्य टियर" },

  // Live Route Tracking
  liveRouteTracking: { en: "Live Route Tracking", ne: "प्रत्यक्ष स्थान ट्र्याकिङ" },
  trackLiveArrival: { en: "Track Live Arrival", ne: "प्रत्यक्ष आगमन हेर्नुहोस्" },
  distanceAway: { en: "Distance", ne: "दुरी" },
  estimatedArrival: { en: "Estimated Arrival", ne: "अनुमानित आगमन समय" },

  // Quick Broadcast
  quickBroadcast: { en: "Quick Broadcast (Urgent)", ne: "द्रुत प्रसारण (आपतकालीन)" },
  broadcastActive: { en: "Broadcasting to nearby workers", ne: "नजिकैका कामदारहरूलाई प्रसारण हुँदैछ" },

  // KYC
  citizenshipKYC: { en: "Citizenship & KYC", ne: "नागरिकता र केवाईसी" },
  getVerified: { en: "Get Verified", ne: "प्रमाणित हुनुहोस्" },
  verifiedBadge: { en: "Verified", ne: "प्रमाणित" },
  unverified: { en: "Unverified", ne: "अ-प्रमाणित" },
  pending: { en: "Pending Verification", ne: "प्रमाणीकरण विचाराधीन" },

  // Audio / Voice
  recordVoiceNote: { en: "Hold to Record Voice Note", ne: "अडियो रेकर्ड गर्न थिच्नुहोस्" },
  recording: { en: "Recording...", ne: "रेकर्ड हुँदैछ..." },
  playAudio: { en: "Play Voice Note", ne: "अडियो सुन्नुहोस्" },

  // Feed & Filtering
  openGigs: { en: "Open Jobs & Gigs", ne: "खुला कामहरू र गिगहरू" },
  openWorkers: { en: "Available Local Workers", ne: "उपलब्ध स्थानीय कामदारहरू" },
  searchJobsPlaceholder: { en: "Search gigs by title, skills...", ne: "शीर्षक, सीप अनुसार काम खोज्नुहोस्..." },
  searchWorkersPlaceholder: { en: "Search workers by name, skills...", ne: "नाम, सीप अनुसार कामदार खोज्नुहोस्..." },
  applyNow: { en: "Apply Now", ne: "आवेदन दिनुहोस्" },
  applied: { en: "Applied", ne: "आवेदन पठाइयो" },
  resetFilters: { en: "Reset Filters", ne: "फिल्टर रिसेट" },
  noJobsFound: { en: "No jobs found", ne: "कुनै काम फेला परेन" },
  noWorkersFound: { en: "No workers found", ne: "कुनै कामदार फेला परेन" },
};

type LanguageContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string, fallback?: string) => string;
  tx: (en: string, ne: string) => string;
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  toggleLang: () => {},
  t: (key, fallback) => fallback || key,
  tx: (en) => en,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("kamghar_lang") as Language;
      if (stored === "en" || stored === "ne") {
        setLangState(stored);
      }
    } catch {
      // LocalStorage access failsafe
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem("kamghar_lang", newLang);
    } catch {
      // Ignore
    }
  };

  const toggleLang = () => {
    const nextLang = lang === "en" ? "ne" : "en";
    setLang(nextLang);
  };

  const t = (key: string, fallback?: string): string => {
    const entry = translations[key];
    if (entry && entry[lang]) {
      return entry[lang];
    }
    return fallback || entry?.en || key;
  };

  const tx = (en: string, ne: string): string => {
    return lang === "ne" ? ne : en;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t, tx }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
