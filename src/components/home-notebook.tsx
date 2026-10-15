"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pin,
  Sparkles,
  Heart,
  Plus,
  X,
  Volume2,
  VolumeX,
  CheckCircle2,
  Calendar,
  MapPin,
  Star,
  ShieldCheck,
  Zap,
  Bookmark,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";

interface StickyNote {
  id: string;
  author: string;
  location: string;
  text: string;
  textNe?: string;
  color: "yellow" | "peach" | "mint" | "sky";
  sticker: string;
  date: string;
  rotation: number;
}

const INITIAL_NOTES: StickyNote[] = [
  {
    id: "note-1",
    author: "Pradeep Shakya",
    location: "Patan Dhoka, Lalitpur",
    text: "Found an electrician within 20 mins to fix our main circuit breaker. Direct eSewa payment and zero hassle!",
    textNe: "२० मिनेटमै मेन सर्किट ब्रेकर बनाउने इलेक्ट्रीसियन भेटियो। सिधै eSewa बाट भुक्तानी, कुनै झन्झट भएन!",
    color: "yellow",
    sticker: "⚡",
    date: "Today, 10:45 AM",
    rotation: -2,
  },
  {
    id: "note-2",
    author: "Anjali Karki",
    location: "Baluwatar, Ktm",
    text: "Hired Sunita didi for deep home cleaning before Dashain. Arrived on time with proper gear. 5/5 stars!",
    textNe: "दशैं अघि घर सरसफाइको लागि सुनिता दिदीलाई बोलायौं। समयमै आउनुभयो, एकदमै राम्रो काम!",
    color: "peach",
    sticker: "✨",
    date: "Yesterday",
    rotation: 2.5,
  },
  {
    id: "note-3",
    author: "Bikash Shrestha",
    location: "Koteshwor, Ktm",
    text: "Ramesh dai fixed our overhead water tank float valve in 40 mins. Paid directly in cash, no middlemen cut.",
    textNe: "रमेश दाइले पानी ट्याङ्कीको भल्भ ४० मिनेटमै मर्मत गरिदिनुभयो। नगद भुक्तानी, बिचौलिया बिना।",
    color: "mint",
    sticker: "🔧",
    date: "Oct 12",
    rotation: -1.5,
  },
  {
    id: "note-rihanna",
    author: "Rihanna & The Crew",
    location: "Diary Jukebox",
    text: "Work, work, work, work, work, work! 🎶 The ultimate soundtrack for every hard worker across Nepal.",
    textNe: "Work, work, work, work, work, work! 🎶 नेपालभरिका सम्पूर्ण मिहिनेती हातहरूको लागि कामघरको विशेष धुन!",
    color: "peach",
    sticker: "🎵",
    date: "Official Track",
    rotation: -1.2,
  },
  {
    id: "note-4",
    author: "Hari Bahadur",
    location: "Suryabinayak, Bhaktapur",
    text: "As a carpenter, zero commission means I take home every rupee I earned. Got 4 gigs already this week!",
    textNe: "सिकर्मीको रूपमा काम गर्दा ०% कमिसनले गर्दा पुरै कमाइ आफैं राख्न पाएँ। यो हप्ता ४ वटा काम पाएँ!",
    color: "sky",
    sticker: "🔨",
    date: "Oct 11",
    rotation: 1.8,
  },
];

const POLAROIDS = [
  {
    name: "Aregato Shrestha",
    nameNe: "अरेगातो श्रेष्ठ",
    role: "Master Electrician & Pro",
    roleNe: "विद्युत् तथा प्राविधिक विशेषज्ञ",
    location: "Gokarneshwar, Kathmandu",
    locationNe: "गोकर्णेश्वर, काठमाडौं",
    exp: "4 yrs exp · 65 gigs",
    img: "/aregato-shrestha.jpg",
    caption: "Wiring backup solar inverters & emergency home electricals",
    captionNe: "गोकर्णेश्वरमा सोलार इन्भर्टर र आपतकालीन विद्युत् मर्मत",
    rating: "4.9",
    rotation: -2,
  },
  {
    name: "Tulsi Shrestha",
    nameNe: "तुलसी श्रेष्ठ",
    role: "Home Specialist & Designer",
    roleNe: "गृह व्यवस्थापन तथा डिजाइन विशेषज्ञ",
    location: "Gokarneshwar, Kathmandu",
    locationNe: "गोकर्णेश्वर, काठमाडौं",
    exp: "3 yrs exp · 48 gigs",
    img: "/tulsi-shrestha.jpg",
    caption: "Post-renovation deep clean & organization in Kathmandu",
    captionNe: "घर मर्मत पछिको विशेष सरसफाइ र आन्तरिक व्यवस्थापन",
    rating: "5.0",
    rotation: 2,
  },
  {
    name: "Adrien Shrestha",
    nameNe: "एड्रियन श्रेष्ठ",
    role: "Technical Operations Lead",
    roleNe: "प्राविधिक तथा कार्य व्यवस्थापक",
    location: "Kathmandu, Nepal",
    locationNe: "काठमाडौं, नेपाल",
    exp: "5 yrs exp · 92 gigs",
    img: "/adrien-shrestha.jpg",
    caption: "Coordinating on-demand technicians & rapid response dispatches",
    captionNe: "कार्यस्थल प्राविधिक परिचालन र मर्मत कार्य समन्वय गर्दै",
    rating: "4.9",
    rotation: -1.5,
  },
  {
    name: "Sabja Shrestha",
    nameNe: "सब्जा श्रेष्ठ",
    role: "Language & Arts Educator",
    roleNe: "शिक्षा, भाषा तथा कला प्रशिक्षक",
    location: "Kathmandu, Nepal",
    locationNe: "काठमाडौं, नेपाल",
    exp: "4 yrs exp · 76 gigs",
    img: "/sabja-shrestha.png",
    caption: "Interactive learning and personalized home tutoring",
    captionNe: "प्रत्यक्ष गृह शिक्षण र रचनात्मक कला सीप कक्षा सञ्चालन",
    rating: "4.8",
    rotation: 2.5,
  },
];

const FIELD_LOGS = [
  {
    time: "11:20 AM",
    category: "Electrical",
    title: "Distribution box short-circuit repair",
    titleNe: "मेन बक्स सर्ट-सर्किट मर्मत",
    location: "New Baneshwor, Ward 10",
    fee: "NPR 1,500",
    status: "Completed",
    notes: "Client needed urgent power restoration for office. Arrived in 18 minutes.",
  },
  {
    time: "09:45 AM",
    category: "Plumbing",
    title: "Kitchen sink drain unclogging",
    titleNe: "भान्साको सिंक ड्रेन सफाइ",
    location: "Jhamsikhel, Lalitpur",
    fee: "NPR 900",
    status: "Completed",
    notes: "Pipe cleared without tearing floor tiles. Direct cash payment.",
  },
  {
    time: "Yesterday",
    category: "Carpentry",
    title: "Balcony wooden railing restoration",
    titleNe: "कौशीको काठे रेलिङ मर्मत",
    location: "Thamel, Kathmandu",
    fee: "NPR 4,200",
    status: "Completed",
    notes: "Weather-proof sealant applied. Client left a glowing handwritten review.",
  },
  {
    time: "Oct 12",
    category: "Appliance",
    title: "Washing machine capacitor replacement",
    titleNe: "वाशिङ मेसिन क्यापासिटर फेर्ने काम",
    location: "Kausaltar, Bhaktapur",
    fee: "NPR 1,800",
    status: "Completed",
    notes: "Diagnosed in 10 mins. Part sourced from local hardware shop.",
  },
];

const PAGES_CONFIG = [
  {
    id: "notes",
    tabLabel: "Sticky Notes",
    tabLabelNe: "नोट बोर्ड",
    icon: Pin,
    pageNumber: "01",
  },
  {
    id: "polaroids",
    tabLabel: "Polaroids",
    tabLabelNe: "तस्बिरहरू",
    icon: Sparkles,
    pageNumber: "02",
  },
  {
    id: "logs",
    tabLabel: "Field Logs",
    tabLabelNe: "दैनिक लगबुक",
    icon: Calendar,
    pageNumber: "03",
  },
  {
    id: "handbook",
    tabLabel: "Charter",
    tabLabelNe: "हाम्रो नियम",
    icon: ShieldCheck,
    pageNumber: "04",
  },
];

export default function HomeNotebook() {
  const { lang, tx } = useLanguage();
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = turning forward, -1 = turning backward
  const [notes, setNotes] = useState<StickyNote[]>(INITIAL_NOTES);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isPlayingVinyl, setIsPlayingVinyl] = useState(false);
  const [selectedPolaroid, setSelectedPolaroid] = useState<number | null>(null);

  // New Note Form State
  const [authorName, setAuthorName] = useState("");
  const [authorLocation, setAuthorLocation] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteColor, setNoteColor] = useState<"yellow" | "peach" | "mint" | "sky">("yellow");
  const [selectedSticker, setSelectedSticker] = useState("⚡");

  // Load user pinned notes from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("kamghar_notebook_notes");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNotes([...parsed, ...INITIAL_NOTES.slice(parsed.length)]);
        }
      }
    } catch {
      // fallback
    }
  }, []);

  // Audio player for Rihanna - Work
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio("/notebook/rihanna-work.m4a");
    audio.preload = "auto";
    const handleEnded = () => setIsPlayingVinyl(false);
    audio.addEventListener("ended", handleEnded);
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlayVinyl = () => {
    if (!audioRef.current) return;
    if (isPlayingVinyl) {
      audioRef.current.pause();
      setIsPlayingVinyl(false);
    } else {
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .then(() => {
          setIsPlayingVinyl(true);
        })
        .catch((err) => {
          console.warn("Audio play prevented:", err);
          setIsPlayingVinyl(false);
        });
    }
  };

  // Subtle tactile paper flip audio feedback (Web Audio API)
  const playPageTurnSound = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const bufferSize = Math.floor(ctx.sampleRate * 0.09);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 850;
      filter.Q.value = 1.0;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch {
      // Ignore
    }
  };

  const goToPage = (newIndex: number) => {
    if (newIndex === currentPage) return;
    playPageTurnSound();
    setDirection(newIndex > currentPage ? 1 : -1);
    setCurrentPage(newIndex);
  };

  const handleNextPage = () => {
    if (currentPage < PAGES_CONFIG.length - 1) {
      goToPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      goToPage(currentPage - 1);
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !noteContent.trim()) return;

    const newNote: StickyNote = {
      id: `user-note-${Date.now()}`,
      author: authorName.trim(),
      location: authorLocation.trim() || (lang === "ne" ? "काठमाडौं" : "Kathmandu"),
      text: noteContent.trim(),
      color: noteColor,
      sticker: selectedSticker,
      date: lang === "ne" ? "भर्खरै" : "Just now",
      rotation: Math.floor(Math.random() * 6) - 3,
    };

    const updated = [newNote, ...notes];
    setNotes(updated);
    try {
      localStorage.setItem("kamghar_notebook_notes", JSON.stringify(updated.slice(0, 10)));
    } catch {
      // ignore
    }

    setAuthorName("");
    setAuthorLocation("");
    setNoteContent("");
    setIsNoteModalOpen(false);
  };

  const getNoteColorClasses = (color: StickyNote["color"]) => {
    switch (color) {
      case "yellow":
        return "bg-amber-100 text-amber-950 border-amber-300/80 shadow-amber-900/10";
      case "peach":
        return "bg-rose-100 text-rose-950 border-rose-300/80 shadow-rose-900/10";
      case "mint":
        return "bg-emerald-100 text-emerald-950 border-emerald-300/80 shadow-emerald-900/10";
      case "sky":
        return "bg-sky-100 text-sky-950 border-sky-300/80 shadow-sky-900/10";
    }
  };

  // ── Authentic Taliahhh-inspired Framer Spring Motion Variants ──
  // The outer binder and spine rings stay 100% stationary.
  // Only the paper leaf turns with realistic paper leaf curl & spring physics!
  const leftPageVariants = {
    initial: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? -18 : 18,
    }),
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 28,
        mass: 0.8,
      },
    },
    exit: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? 18 : -18,
      transition: { duration: 0.2, ease: "easeOut" as const },
    }),
  };

  const rightPageLeafVariants = {
    initial: (dir: number) => ({
      rotateY: dir > 0 ? 55 : -55,
      opacity: 0,
      transformOrigin: dir > 0 ? "left center" : "right center",
      scale: 0.98,
      filter: "brightness(0.95)",
    }),
    animate: {
      rotateY: 0,
      opacity: 1,
      scale: 1,
      filter: "brightness(1)",
      transformOrigin: "left center",
      transition: {
        type: "spring" as const,
        stiffness: 280,
        damping: 26,
        mass: 0.85,
        bounce: 0.2,
      },
    },
    exit: (dir: number) => ({
      rotateY: dir > 0 ? -55 : 55,
      opacity: 0,
      scale: 0.98,
      transformOrigin: dir > 0 ? "left center" : "right center",
      filter: "brightness(0.92)",
      transition: {
        duration: 0.25,
        ease: "easeInOut" as const,
      },
    }),
  };

  return (
    <section className="py-12 bg-[#f4efe6] dark:bg-[#0c1017] transition-colors duration-300 relative overflow-hidden border-t border-amber-900/10 dark:border-slate-800">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-400/10 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-400/10 dark:bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-xs font-semibold uppercase tracking-wider mb-1 border border-amber-300/50 dark:border-amber-800/60">
              <Bookmark className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>{tx("Field Notes & Community Journal", "कामघर दैनिक डायरी र जन-समीक्षा")}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
              {tx("The KamGhar Field Notebook", "कामघर खुला डायरी र संस्मरण")}
            </h2>
          </div>

          {/* Taliahhh-style Desktop Book Navigation (Arrow Left & Arrow Right) */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-stone-500 dark:text-stone-400 bg-stone-200/60 dark:bg-slate-800 px-3 py-1 rounded-full">
              {PAGES_CONFIG[currentPage].pageNumber} / 04
            </span>

            <div className="flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 p-1 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-sm">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                title={tx("Previous Page", "अघिल्लो पृष्ठ")}
                className={`p-2 rounded-xl transition-all ${
                  currentPage === 0
                    ? "opacity-30 cursor-not-allowed text-stone-400"
                    : "hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-800 dark:text-stone-200 hover:scale-105 active:scale-95 cursor-pointer"
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-stone-200 dark:bg-slate-800" />

              <button
                onClick={handleNextPage}
                disabled={currentPage === PAGES_CONFIG.length - 1}
                title={tx("Turn Next Page", "अर्को पृष्ठ पल्टाउनुहोस्")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  currentPage === PAGES_CONFIG.length - 1
                    ? "opacity-30 cursor-not-allowed text-stone-400"
                    : "bg-orange-600 hover:bg-orange-700 text-white shadow-sm shadow-orange-600/30 hover:scale-105 active:scale-95 cursor-pointer"
                }`}
              >
                <span>{tx("Turn Page", "पल्टाउनुहोस्")}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Outer Notebook Binder Container (Fixed Compact Height: ~500px) ── */}
        <div className="relative mx-auto max-w-5xl">
          {/* Index Tabs Protruding on Top (Like Taliahhh's notebook tabs) */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-8 overflow-x-auto pb-1 scrollbar-none z-20">
            {PAGES_CONFIG.map((cfg, idx) => {
              const Icon = cfg.icon;
              const isActive = currentPage === idx;
              return (
                <button
                  key={cfg.id}
                  onClick={() => goToPage(idx)}
                  className={`relative px-3.5 sm:px-5 py-2 rounded-t-xl font-bold text-xs tracking-wide transition-all duration-200 border-t border-x flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-[#fffdf9] dark:bg-[#151c27] text-amber-950 dark:text-amber-200 border-amber-300 dark:border-slate-700 shadow-md -translate-y-1"
                      : "bg-amber-100/70 dark:bg-slate-800/80 text-stone-600 dark:text-stone-400 border-amber-200 dark:border-slate-700/60 hover:bg-amber-100 hover:text-stone-900"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                  <span>{lang === "ne" ? cfg.tabLabelNe : cfg.tabLabel}</span>
                  <span className="text-[10px] px-1 py-0.2 bg-black/5 dark:bg-white/10 rounded font-mono">
                    {cfg.pageNumber}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Main Leather Binder Shell (Anchored & Stationary) ── */}
          <div className="relative rounded-3xl p-3 sm:p-5 bg-[#1f242d] dark:bg-[#080b11] shadow-2xl border-4 border-[#323946] dark:border-slate-800 overflow-hidden">
            {/* Leather texture stitches around border */}
            <div className="absolute inset-2 border-2 border-dashed border-amber-700/25 dark:border-slate-700/40 rounded-2xl pointer-events-none" />

            {/* Leather Binder Closure Strap on right edge (Inspired by taliahhh) */}
            <div
              onClick={handleNextPage}
              title={tx("Turn page", "पल्टाउनुहोस्")}
              className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 w-8 h-28 bg-[#2a303c] dark:bg-[#131822] rounded-l-2xl border-y-2 border-l-2 border-[#414b5c] dark:border-slate-700 shadow-xl items-center justify-center z-40 cursor-pointer group hover:w-9 transition-all"
            >
              <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-inner border border-amber-300 group-hover:scale-125 transition-transform" />
            </div>

            {/* Center Metal Spine & 6 Binder Rings (Fixed & Grounded) */}
            <div className="hidden lg:flex absolute left-1/2 top-0 bottom-0 -translate-x-1/2 flex-col justify-around py-6 z-30 pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="relative flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-[#1f242d] dark:bg-black shadow-inner -mr-1" />
                  <div className="w-7 h-3.5 rounded-full bg-gradient-to-r from-stone-400 via-stone-100 to-stone-400 shadow-md border border-stone-400 flex items-center justify-center">
                    <div className="w-5 h-0.5 bg-white/70 rounded-full" />
                  </div>
                  <div className="w-3 h-3 rounded-full bg-[#1f242d] dark:bg-black shadow-inner -ml-1" />
                </div>
              ))}
            </div>

            {/* ── Fixed Dual-Page Book Container (Height: 480px) ── */}
            <div className="relative rounded-2xl overflow-hidden min-h-[480px] max-h-[500px] bg-[#fffdfa] dark:bg-[#151c27] shadow-inner grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-stone-300/80 dark:divide-slate-800">
              {/* Center spine gutter gradient */}
              <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-10 bg-gradient-to-r from-stone-900/10 via-transparent to-stone-900/10 pointer-events-none z-20" />

              {/* ───────────────────────────────────────────────────────────── */}
              {/* ── LEFT SPREAD PAGE: Smooth Spring Content Crossfade ── */}
              {/* ───────────────────────────────────────────────────────────── */}
              <div className="p-5 sm:p-6 flex flex-col justify-between relative notebook-ruled-bg overflow-hidden">
                {/* Authentic silver paperclip pinned on left corner */}
                <div className="absolute -top-1 left-7 w-5 h-11 pointer-events-none z-20 drop-shadow">
                  <Image
                    src="/notebook/paperclip.png"
                    alt="Paperclip"
                    width={20}
                    height={44}
                    className="w-full h-full object-contain"
                  />
                </div>

                <AnimatePresence custom={direction} mode="wait">
                  <motion.div
                    key={`left-${currentPage}`}
                    custom={direction}
                    variants={leftPageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="flex flex-col justify-between h-full"
                  >
                    <div>
                      {/* Top Header bar */}
                      <div className="flex items-center justify-between mb-3 pt-1">
                        <span className="font-schoolbell text-xs text-stone-500 dark:text-stone-400 uppercase tracking-widest pl-5">
                          {tx("KamGhar Journal", "कामघर डायरी")} · {PAGES_CONFIG[currentPage].tabLabel}
                        </span>
                        <span className="font-mono text-[10px] text-stone-400">
                          {tx("NEPAL DISPATCH", "नेपाल रोजगार खाता")}
                        </span>
                      </div>

                      {/* TAB 1: STICKY NOTES LEFT */}
                      {currentPage === 0 && (
                        <div className="space-y-3">
                          <h3 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 font-kalam leading-snug">
                            {tx("Neighborhood Memos & Recommendations", "छिमेकीका नोटहरू र सिफारिस")}
                          </h3>
                          <p className="text-stone-700 dark:text-stone-300 text-sm leading-relaxed font-handwriting text-base sm:text-lg">
                            {tx(
                              "Pin a note onto the community board! Recommend an honest plumber, request an electrician for your tole, or share your work experience.",
                              "आफ्नो टोलको कामदार सिफारिस गर्नुहोस्, नयाँ काम खोज्नुहोस् वा आफ्ना अनुभव साझा गर्नुहोस्। सबै नोटहरू खुला रूपमा पढ्न सकिन्छ।"
                            )}
                          </p>

                          <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-2 mt-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                                {tx("Community Pinned Notes", "टाँसिएका नोटहरू:")}
                              </span>
                              <span className="text-xs font-mono font-bold text-orange-600">
                                {notes.length} {tx("active", "सक्रिय")}
                              </span>
                            </div>
                            <button
                              onClick={() => setIsNoteModalOpen(true)}
                              className="w-full py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium text-xs shadow-sm flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{tx("Write New Sticky Note", "नयाँ नोट लेख्नुहोस्")}</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* TAB 2: POLAROIDS LEFT */}
                      {currentPage === 1 && (
                        <div className="space-y-3">
                          <h3 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 font-kalam leading-snug">
                            {tx("Faces Behind the Craft", "हातको सीप र भरोसा")}
                          </h3>
                          <p className="text-stone-700 dark:text-stone-300 text-sm leading-relaxed font-handwriting text-base sm:text-lg">
                            {tx(
                              "Hundreds of skilled plumbers, electricians, cleaners, and mechanics restore warmth to Nepali homes every day. Honest labor with zero cuts.",
                              "काठमाडौंदेखि पोखरासम्म, घर–घर पुगेर सेवा दिने हाम्रा भरपर्दो कामदार साथीहरूको वास्तविक तस्बिर र संस्मरण।"
                            )}
                          </p>

                          <div className="p-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 mt-3">
                            <div className="flex items-center gap-1.5 text-rose-900 dark:text-rose-200 font-bold text-xs mb-1">
                              <ShieldCheck className="w-4 h-4 text-rose-600" />
                              <span>{tx("100% Identity Verified", "१००% पहिचान र सीप प्रमाणित")}</span>
                            </div>
                            <p className="text-xs text-stone-600 dark:text-stone-400">
                              {tx("Citizenship and trade skill verified before profiles go live.", "नागरिकता र सीप जाँचिएका कामदारहरू।")}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* TAB 3: DAILY LOGS LEFT */}
                      {currentPage === 2 && (
                        <div className="space-y-3">
                          <h3 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 font-kalam leading-snug">
                            {tx("Real-Time Dispatch Ledger", "दैनिक काम र आम्दानी लग")}
                          </h3>
                          <p className="text-stone-700 dark:text-stone-300 text-sm leading-relaxed font-handwriting text-base sm:text-lg">
                            {tx(
                              "A transparent ledger of recently completed service calls. No hidden commission, direct peer settlement via eSewa or cash.",
                              "भर्खरै सम्पन्न भएका कामहरूको खुला खाता। कुनै बिचौलिया शुल्क छैन, पूरा रकम कामदारकै हातमा।"
                            )}
                          </p>

                          <div className="grid grid-cols-2 gap-2 mt-3">
                            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                              <div className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">23 min</div>
                              <div className="text-[10px] text-stone-500">{tx("Avg. Arrival", "औसत पुग्ने समय")}</div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/40">
                              <div className="text-lg font-extrabold text-orange-700 dark:text-orange-400">NPR 0</div>
                              <div className="text-[10px] text-stone-500">{tx("Commission Taken", "कमिसन कटौति")}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 4: CHARTER LEFT */}
                      {currentPage === 3 && (
                        <div className="space-y-3">
                          <h3 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 font-kalam leading-snug">
                            {tx("The KamGhar Promise", "हाम्रो खुला प्रतिबद्धता")}
                          </h3>
                          <p className="text-stone-700 dark:text-stone-300 text-sm leading-relaxed font-handwriting text-base sm:text-lg">
                            {tx(
                              "Founded on simple principles: work dignity, fair compensation, and radical transparency for every worker in Nepal.",
                              "श्रमको सम्मान, उचित ज्याला र बिचौलियामुक्त नेपाल — यही सोचका साथ कामघर निर्माण गरिएको हो।"
                            )}
                          </p>

                          <div className="inline-block p-2.5 rounded-xl border-2 border-red-700/80 -rotate-3 text-red-700 dark:text-red-400 font-mono text-[11px] font-bold uppercase tracking-wider bg-red-50/50 dark:bg-red-950/20 mt-2">
                            ✓ {tx("APPROVED DIRECT PEER-TO-PEER", "प्रमाणित प्रत्यक्ष रोजगार")}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Vinyl Player (Work by Rihanna) */}
                    <div className="pt-2 border-t border-stone-200 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={togglePlayVinyl}
                          title={isPlayingVinyl ? "Pause Rihanna - Work" : "Play Work by Rihanna"}
                          className="relative group focus:outline-none cursor-pointer"
                        >
                          <motion.div
                            animate={{ rotate: isPlayingVinyl ? 360 : 0 }}
                            transition={{ repeat: Infinity, duration: 2.8, ease: "linear" }}
                            className="w-11 h-11 relative flex-shrink-0 drop-shadow group-hover:scale-105 transition-transform"
                          >
                            <Image
                              src="/notebook/vinyl-record.png"
                              alt="Vinyl Record"
                              width={44}
                              height={44}
                              className="w-full h-full object-contain"
                            />
                            {/* Vinyl Center Label */}
                            <div className="absolute inset-0 m-auto w-3.5 h-3.5 rounded-full bg-orange-600 border border-amber-200 flex items-center justify-center pointer-events-none">
                              <span className="text-[6px] text-white font-bold leading-none">R</span>
                            </div>
                          </motion.div>
                          {isPlayingVinyl && (
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500" />
                            </span>
                          )}
                        </button>

                        <div>
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-800 dark:text-stone-200">
                            {isPlayingVinyl ? (
                              <Volume2 className="w-3.5 h-3.5 text-orange-600 animate-pulse flex-shrink-0" />
                            ) : (
                              <VolumeX className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                            )}
                            <span className="truncate max-w-[140px] sm:max-w-[190px]">
                              Work — Rihanna ft. Drake
                            </span>
                            {isPlayingVinyl && (
                              <div className="flex items-end gap-0.5 h-3 flex-shrink-0">
                                <motion.span
                                  animate={{ height: ["3px", "12px", "5px", "13px", "3px"] }}
                                  transition={{ repeat: Infinity, duration: 0.55 }}
                                  className="w-0.5 bg-orange-500 rounded-full inline-block"
                                />
                                <motion.span
                                  animate={{ height: ["9px", "4px", "13px", "7px", "9px"] }}
                                  transition={{ repeat: Infinity, duration: 0.65 }}
                                  className="w-0.5 bg-orange-500 rounded-full inline-block"
                                />
                                <motion.span
                                  animate={{ height: ["5px", "13px", "4px", "11px", "5px"] }}
                                  transition={{ repeat: Infinity, duration: 0.5 }}
                                  className="w-0.5 bg-orange-500 rounded-full inline-block"
                                />
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] text-stone-500 dark:text-stone-400 font-schoolbell truncate max-w-[180px] sm:max-w-[220px]">
                            {isPlayingVinyl
                              ? tx("Work, work, work... 🎶 (Playing)", "Work, work, work... 🎶 (बज्दैछ)")
                              : tx("Tap vinyl to play Work by Rihanna", "रिहानाको 'Work' बजाउन क्लिक गर्नुहोस्")}
                          </p>
                        </div>
                      </div>

                      <span className="font-mono text-[10px] text-stone-400">
                        {PAGES_CONFIG[currentPage].pageNumber} / 04
                      </span>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* ───────────────────────────────────────────────────────────── */}
              {/* ── RIGHT SPREAD PAGE: 3D Paper Leaf Turn Around Spine ── */}
              {/* ───────────────────────────────────────────────────────────── */}
              <div
                style={{ perspective: 1400 }}
                className="p-5 sm:p-6 flex flex-col justify-between relative notebook-grid-bg bg-[#fffdfa]/70 dark:bg-[#151c27]/70 overflow-hidden"
              >
                {/* Washi tape sticker in top corner */}
                <div className="absolute -top-1 right-6 w-20 h-5 bg-rose-300/60 dark:bg-rose-600/30 backdrop-blur-sm rotate-2 shadow-sm border border-rose-400/40 pointer-events-none z-10" />

                <AnimatePresence custom={direction} mode="wait">
                  <motion.div
                    key={`right-${currentPage}`}
                    custom={direction}
                    variants={rightPageLeafVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    style={{ transformStyle: "preserve-3d" }}
                    className="flex flex-col justify-between h-full"
                  >
                    {/* Content Body */}
                    <div className="overflow-y-auto max-h-[380px] pr-1 scrollbar-none">
                      {/* TAB 1: STICKY NOTES BOARD */}
                      {currentPage === 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {notes.slice(0, 4).map((note) => (
                            <motion.div
                              key={note.id}
                              whileHover={{ scale: 1.02, rotate: 0 }}
                              style={{ rotate: `${note.rotation}deg` }}
                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                              className={`p-3 rounded-xl border relative shadow-sm flex flex-col justify-between ${getNoteColorClasses(
                                note.color
                              )}`}
                            >
                              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-3 bg-amber-400/40 rounded-sm pointer-events-none border border-amber-500/20" />
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-base">{note.sticker}</span>
                                  <span className="text-[9px] font-mono opacity-60">{note.date}</span>
                                </div>
                                <p className="font-kalam text-xs sm:text-sm leading-snug line-clamp-3">
                                  &ldquo;{lang === "ne" && note.textNe ? note.textNe : note.text}&rdquo;
                                </p>
                              </div>

                              <div className="mt-2 pt-1.5 border-t border-black/10 flex items-center justify-between text-[11px]">
                                <span className="font-bold font-schoolbell truncate max-w-[90px]">{note.author}</span>
                                <span className="text-[9px] opacity-75 truncate max-w-[90px]">{note.location}</span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* TAB 2: POLAROIDS */}
                      {currentPage === 1 && (
                        <div className="grid grid-cols-2 gap-3">
                          {POLAROIDS.map((worker, idx) => (
                            <motion.div
                              key={idx}
                              whileHover={{ scale: 1.04, rotate: 0, zIndex: 20 }}
                              style={{ rotate: `${worker.rotation}deg` }}
                              transition={{ type: "spring", stiffness: 300 }}
                              onClick={() => setSelectedPolaroid(idx)}
                              className="bg-white dark:bg-stone-900 p-2 rounded-lg shadow border border-stone-200 dark:border-stone-800 cursor-pointer group"
                            >
                              <div className="relative aspect-square w-full rounded overflow-hidden bg-stone-100 dark:bg-stone-800 mb-1.5">
                                <Image
                                  src={worker.img}
                                  alt={worker.name}
                                  fill
                                  unoptimized
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute top-1 right-1 px-1 py-0.2 rounded bg-black/60 text-white text-[9px] font-bold flex items-center gap-0.5">
                                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                  {worker.rating}
                                </div>
                              </div>
                              <div className="text-center">
                                <h4 className="font-bold text-xs text-stone-900 dark:text-stone-100 truncate">
                                  {lang === "ne" && worker.nameNe ? worker.nameNe : worker.name}
                                </h4>
                                <p className="text-[10px] text-orange-600 dark:text-orange-400 font-medium truncate">
                                  {lang === "ne" ? worker.roleNe : worker.role}
                                </p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* TAB 3: DAILY FIELD LOGS */}
                      {currentPage === 2 && (
                        <div className="space-y-2">
                          {FIELD_LOGS.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-xl bg-white/80 dark:bg-stone-900/60 border border-stone-200 dark:border-slate-800 flex items-start justify-between gap-2 shadow-sm text-xs"
                            >
                              <div>
                                <div className="flex items-center gap-1.5 font-bold text-stone-900 dark:text-stone-100">
                                  <span className="font-mono text-[9px] px-1 py-0.2 bg-stone-100 dark:bg-slate-800 rounded">
                                    {item.time}
                                  </span>
                                  <span>{lang === "ne" ? item.titleNe : item.title}</span>
                                </div>
                                <p className="text-[11px] text-stone-500 font-schoolbell mt-0.5">{item.notes}</p>
                                <span className="text-[10px] text-stone-400 flex items-center gap-0.5 mt-0.5">
                                  <MapPin className="w-2.5 h-2.5 text-orange-500" />
                                  {item.location}
                                </span>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <span className="font-mono font-bold text-emerald-600 text-xs block">{item.fee}</span>
                                <span className="text-[9px] text-stone-400 flex items-center gap-0.5 justify-end">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                                  {item.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* TAB 4: CHARTER RULES */}
                      {currentPage === 3 && (
                        <div className="space-y-2.5">
                          <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-slate-900/70 border border-stone-300 dark:border-slate-700">
                            <div className="flex items-center gap-1.5 text-stone-900 dark:text-white font-bold text-xs mb-1">
                              <Zap className="w-3.5 h-3.5 text-orange-600" />
                              <span>{tx("Rule 1: 100% Direct Pay", "नियम १: १००% पुरै कमाइ कामदारकै")}</span>
                            </div>
                            <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
                              {tx("Zero commission cuts. Every rupee paid by client goes straight to the technician.", "कुनै कमिसन कटौति छैन। पूरा रकम कामदारकै हातमा।")}
                            </p>
                          </div>

                          <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-slate-900/70 border border-stone-300 dark:border-slate-700">
                            <div className="flex items-center gap-1.5 text-stone-900 dark:text-white font-bold text-xs mb-1">
                              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{tx("Rule 2: Proximity First", "नियम २: नजिकको कामदार पहिलो प्राथमिकता")}</span>
                            </div>
                            <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
                              {tx("Ranked by walking & road distance, never by sponsored pay-to-win boosts.", "दूरीका आधारमा कामदार देखाइन्छ, स्पोन्सर विज्ञापनबाट होइन।")}
                            </p>
                          </div>

                          <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-slate-900/70 border border-stone-300 dark:border-slate-700">
                            <div className="flex items-center gap-1.5 text-stone-900 dark:text-white font-bold text-xs mb-1">
                              <Heart className="w-3.5 h-3.5 text-rose-600" />
                              <span>{tx("Rule 3: Work Dignity", "नियम ३: श्रमको सम्मान र सुरक्षा")}</span>
                            </div>
                            <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
                              {tx("Hourly rates posted upfront. Workers set their own schedule and prices.", "दर सुरुमै प्रष्ट। आफ्नो कामको मूल्य कामदार आफैंले तोक्छन्।")}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Page Bottom with Navigation Arrows */}
                    <div className="pt-2 border-t border-stone-200 dark:border-slate-800 flex items-center justify-between text-xs text-stone-400">
                      <span className="font-schoolbell text-stone-500 text-[11px]">
                        {tx("Turn the pages anytime", "पाना पल्टाउनुहोस्")}
                      </span>

                      <div className="flex items-center gap-2">
                        {currentPage < PAGES_CONFIG.length - 1 && (
                          <button
                            onClick={handleNextPage}
                            className="font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 flex items-center gap-1 text-xs transition-colors cursor-pointer"
                          >
                            <span>{tx("Next Page", "अर्को पृष्ठ")}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Bottom Binder Navigation & Pagination Controls */}
            <div className="flex items-center justify-between pt-3 px-2 text-stone-400 text-xs">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                className={`flex items-center gap-1 transition-colors ${
                  currentPage === 0 ? "opacity-30 cursor-not-allowed" : "hover:text-stone-200 cursor-pointer"
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{tx("Previous Page", "अघिल्लो पृष्ठ")}</span>
              </button>

              <div className="flex items-center gap-1.5">
                {PAGES_CONFIG.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToPage(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      currentPage === idx
                        ? "w-6 bg-orange-500"
                        : "w-2 bg-stone-600 hover:bg-stone-400"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage === PAGES_CONFIG.length - 1}
                className={`flex items-center gap-1 transition-colors ${
                  currentPage === PAGES_CONFIG.length - 1
                    ? "opacity-30 cursor-not-allowed"
                    : "hover:text-stone-200 text-orange-400 font-medium cursor-pointer"
                }`}
              >
                <span>{tx("Next Page", "अर्को पृष्ठ")}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky Note Creator Modal ── */}
      <AnimatePresence>
        {isNoteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="w-full max-w-md bg-[#fffdfa] dark:bg-stone-900 rounded-3xl p-6 shadow-2xl border-2 border-amber-300 dark:border-slate-700 relative overflow-hidden"
            >
              <div className="w-24 h-5 bg-amber-300/80 mx-auto -mt-3 mb-4 rounded-sm rotate-1 shadow-sm" />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Pin className="w-5 h-5 text-orange-600" />
                  <h3 className="font-bold text-lg text-stone-900 dark:text-white font-kalam">
                    {tx("Write Your Memo / नोट लेख्नुहोस्", "तपाईंको नोट लेख्नुहोस्")}
                  </h3>
                </div>
                <button
                  onClick={() => setIsNoteModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddNote} className="space-y-4">
                {/* Note Color Picker */}
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1.5">
                    {tx("Sticky Note Paper Color", "कागजको रङ्ग:")}
                  </label>
                  <div className="flex items-center gap-2">
                    {[
                      { key: "yellow", name: "Yellow", bg: "bg-amber-200 border-amber-400" },
                      { key: "peach", name: "Peach", bg: "bg-rose-200 border-rose-400" },
                      { key: "mint", name: "Mint", bg: "bg-emerald-200 border-emerald-400" },
                      { key: "sky", name: "Sky", bg: "bg-sky-200 border-sky-400" },
                    ].map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setNoteColor(c.key as StickyNote["color"])}
                        className={`w-8 h-8 rounded-xl border-2 transition-transform cursor-pointer ${c.bg} ${
                          noteColor === c.key ? "scale-110 shadow-md ring-2 ring-orange-500" : "opacity-70 hover:opacity-100"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Sticker Picker */}
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1.5">
                    {tx("Pick an Emblem Sticker", "स्टिकर रोज्नुहोस्:")}
                  </label>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {["⚡", "🔧", "🎨", "🔨", "☕", "✨", "🇳🇵", "⭐", "❤️"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedSticker(s)}
                        className={`text-lg p-1 rounded-xl border transition-all cursor-pointer ${
                          selectedSticker === s
                            ? "bg-amber-100 dark:bg-amber-950/60 border-orange-500 scale-110"
                            : "border-transparent hover:bg-stone-100 dark:hover:bg-stone-800"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Note Text */}
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1.5">
                    {tx("Your Note / Message", "तपाईंको सन्देश:")}
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder={
                      lang === "ne"
                        ? "जस्तै: पाटनमा घरको तार फेर्न राम्रो इलेक्ट्रीसियन खोज्दैछु..."
                        : "e.g. Highly recommend Ramesh dai for plumbing repair! Arrived in 20 mins..."
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-kalam"
                  />
                </div>

                {/* Author Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                      {tx("Your Name", "तपाईंको नाम:")}
                    </label>
                    <input
                      required
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="e.g. Suman S."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                      {tx("Location / Tole", "स्थान वा टोल:")}
                    </label>
                    <input
                      type="text"
                      value={authorLocation}
                      onChange={(e) => setAuthorLocation(e.target.value)}
                      placeholder="e.g. Jhamsikhel"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Pin className="w-4 h-4" />
                    <span>{tx("Pin Memo to Notebook", "डायरीमा टाँस्नुहोस्")}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Polaroid Enlarged Preview Modal ── */}
      <AnimatePresence>
        {selectedPolaroid !== null && (
          <div
            onClick={() => setSelectedPolaroid(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-2xl max-w-sm w-full shadow-2xl border border-stone-300 dark:border-stone-700 relative text-center"
            >
              <button
                onClick={() => setSelectedPolaroid(null)}
                className="absolute top-3 right-3 p-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="relative aspect-square w-full rounded-lg overflow-hidden mb-3 shadow-inner">
                <Image
                  src={POLAROIDS[selectedPolaroid].img}
                  alt={POLAROIDS[selectedPolaroid].name}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>

              <h3 className="font-bold text-base text-stone-900 dark:text-white">
                {lang === "ne" && POLAROIDS[selectedPolaroid].nameNe
                  ? POLAROIDS[selectedPolaroid].nameNe
                  : POLAROIDS[selectedPolaroid].name}
              </h3>
              <p className="text-orange-600 dark:text-orange-400 font-semibold text-xs">
                {lang === "ne"
                  ? POLAROIDS[selectedPolaroid].roleNe
                  : POLAROIDS[selectedPolaroid].role}
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                📍 {lang === "ne" && POLAROIDS[selectedPolaroid].locationNe
                  ? POLAROIDS[selectedPolaroid].locationNe
                  : POLAROIDS[selectedPolaroid].location} · {POLAROIDS[selectedPolaroid].exp}
              </p>
              <p className="font-schoolbell text-stone-700 dark:text-stone-300 text-sm mt-2 italic">
                &ldquo;
                {lang === "ne"
                  ? POLAROIDS[selectedPolaroid].captionNe
                  : POLAROIDS[selectedPolaroid].caption}
                &rdquo;
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
