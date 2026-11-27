"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Briefcase,
  Users,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Wrench,
  Paintbrush,
  BookOpen,
  Laptop,
  Truck,
  Star,
  Check,
  X,
  LayoutDashboard,
} from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
import LanguageToggle from "@/components/language-toggle";
import NotificationDropdown from "@/components/notification-dropdown";
import ChatModal from "@/components/chat-modal";
import AppHeader from "@/components/app-header";
import HomeNotebook from "@/components/home-notebook";
import SponsoredAdsSection from "@/components/sponsored-ads-section";
import type { PublicAdItem } from "@/app/actions/ads";
import { useLanguage } from "@/components/language-provider";
import { createClient } from "@/lib/supabase/client";

const HERO_SLIDES = [
  {
    src: "/worker-electrician.jpg",
    alt: "Electrician at work",
    label: "Electrician",
    sublabel: "1.2 km away",
    icon: Zap,
    iconBg: "bg-orange-100 dark:bg-orange-950",
    iconColor: "text-orange-600 dark:text-orange-400",
    available: true,
  },
  {
    src: "/worker-digital.webp",
    alt: "Digital freelancer",
    label: "Digital Freelancer",
    sublabel: "0.8 km away",
    icon: Laptop,
    iconBg: "bg-blue-100 dark:bg-blue-950",
    iconColor: "text-blue-600 dark:text-blue-400",
    available: true,
  },
  {
    src: "/worker-plumber.jpg",
    alt: "Plumber at work",
    label: "Plumber",
    sublabel: "2.3 km away",
    icon: Wrench,
    iconBg: "bg-amber-100 dark:bg-amber-950",
    iconColor: "text-amber-600 dark:text-amber-400",
    available: false,
  },
  {
    src: "/worker-cleaner.webp",
    alt: "Home cleaner",
    label: "Home Cleaner",
    sublabel: "1.7 km away",
    icon: Sparkles,
    iconBg: "bg-emerald-100 dark:bg-emerald-950",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    available: true,
  },
];

function HeroPhotoSlider() {
  const [current, setCurrent] = useState(0);
  const total = HERO_SLIDES.length;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % total);
    }, 3500);
    return () => clearInterval(interval);
  }, [total]);

  const slide = HERO_SLIDES[current];
  const Icon = slide.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay: 0.3 }}
      className="relative hidden lg:block h-[590px]"
    >
      {/* Big photo frame */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-[0px_20px_50px_0px_rgba(0,0,0,0.18)] ring-[5px] ring-white dark:ring-slate-800 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              className="object-cover"
              sizes="560px"
              priority={current === 0}
            />
            {/* Gradient overlay at bottom */}
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/50 to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* Rating badge — bottom-left inside photo */}
        <div className="absolute bottom-[88px] left-5 bg-[#f85f0a] rounded-[14px] px-3.5 py-2.5 shadow-lg z-20">
          <div className="flex items-center gap-0.5 mb-0.5">
            {[1,2,3,4,5].map((s) => (
              <Star key={s} className="w-3 h-3 text-white fill-white" />
            ))}
          </div>
          <div className="text-xs font-bold text-white">4.9 avg rating</div>
          <div className="text-[10px] text-[#ffe1cc]">from 1,200+ reviews</div>
        </div>

        {/* Label badge — bottom of photo */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`label-${current}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="absolute bottom-5 left-5 right-5 bg-white dark:bg-slate-900/95 backdrop-blur-sm rounded-[14px] px-3.5 py-3 flex items-center justify-between shadow-xl z-20"
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl ${slide.iconBg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${slide.iconColor}`} />
              </div>
              <div>
                <div className="text-sm font-bold text-[#0f172a] dark:text-white">{slide.label}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-2.5 h-2.5" /> {slide.sublabel}
                </div>
              </div>
            </div>
            {slide.available && (
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full">
                Available
              </span>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Slide dot indicators */}
        <div className="absolute top-4 right-4 flex gap-1.5 z-20">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? "w-6 bg-white" : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Floating workers pill — top-left above photo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="absolute -top-4 -left-4 bg-white dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-700 rounded-2xl px-4 py-2.5 shadow-xl z-30 flex items-center gap-2.5"
      >
        <div className="flex -space-x-2">
          <div className="w-6 h-6 rounded-full bg-orange-400 ring-2 ring-white dark:ring-slate-900" />
          <div className="w-6 h-6 rounded-full bg-amber-400 ring-2 ring-white dark:ring-slate-900" />
          <div className="w-6 h-6 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-900" />
        </div>
        <div>
          <div className="text-xs font-extrabold text-[#0f172a] dark:text-white">2,400+ Workers</div>
          <div className="text-[10px] text-[#64748b] dark:text-slate-400">across Nepal</div>
        </div>
      </motion.div>
    </motion.div>
  );
}

const CATEGORIES = [
  { name: "Electrician", nameNe: "इलेक्ट्रीसियन", icon: Zap, jobs: "120+ gigs", jobsNe: "१२०+ कामहरू" },
  { name: "Plumbing", nameNe: "प्लम्बिङ", icon: Wrench, jobs: "85+ gigs", jobsNe: "८५+ कामहरू" },
  { name: "Painting & Masonry", nameNe: "पेन्टिङ र डकर्मी", icon: Paintbrush, jobs: "64+ gigs", jobsNe: "६४+ कामहरू" },
  { name: "Carpentry", nameNe: "सिकर्मी / काष्ठकला", icon: Briefcase, jobs: "45+ gigs", jobsNe: "४५+ कामहरू" },
  { name: "Tutoring & Classes", nameNe: "ट्युसन र कक्षाहरू", icon: BookOpen, jobs: "90+ gigs", jobsNe: "९०+ कामहरू" },
  { name: "Digital & Design", nameNe: "डिजिटल र डिजाइन", icon: Laptop, jobs: "110+ gigs", jobsNe: "११०+ कामहरू" },
  { name: "Delivery & Moving", nameNe: "डेलिभरी र ढुवानी", icon: Truck, jobs: "75+ gigs", jobsNe: "७५+ कामहरू" },
  { name: "Home Cleaning", nameNe: "घर सरसफाइ", icon: Sparkles, jobs: "95+ gigs", jobsNe: "९५+ कामहरू" },
];

export default function HomeView({ ads = [] }: { ads?: PublicAdItem[] }) {
  const { lang, tx, t } = useLanguage();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "true";
  const [showBanner, setShowBanner] = useState(justRegistered);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [activeChat, setActiveChat] = useState<{
    conversationId: string;
    recipientName: string;
    recipientPhoto?: string | null;
    recipientPhone?: string | null;
    recipientRole?: string;
    recipientVerified?: boolean;
  } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setIsLoggedIn(true);
        setCurrentUserId(data.user.id);
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-orange-500 selection:text-white transition-colors duration-200 pb-16 sm:pb-0">
      {/* Registration Success Banner Toast */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md bg-emerald-600 dark:bg-emerald-700 text-white rounded-2xl shadow-xl shadow-emerald-600/30 p-4 flex items-center justify-between gap-3 border border-emerald-500"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-sm">Welcome to KamGhar</p>
                <p className="text-xs text-emerald-100">Your account is ready. Explore nearby jobs or post work.</p>
              </div>
            </div>
            <button
              onClick={() => setShowBanner(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-emerald-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global App Header with Responsive Mobile Navigation */}
      <AppHeader fixed badgeText="काम घर" badgeTextNe="काम घर" isLoggedIn={isLoggedIn} />

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-[#f8fafc] dark:bg-slate-950 pt-4 pb-0 sm:pt-6">

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center py-8 lg:py-10">

              {/* ── Left Column: Text & CTAs ── */}
              <div className="flex flex-col items-start">
                {/* Live badge */}
                <motion.div
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ffebd8] dark:bg-orange-950/60 border border-[#fbd1ae] dark:border-orange-800/70 text-[#b43f00] dark:text-orange-200 text-xs font-bold mb-5 shadow-sm"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-600" />
                  </span>
                  <MapPin className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                  {tx("Nepal's #1 Local Gig Marketplace", "नेपालको नं. १ स्थानीय गिग बजार")}
                </motion.div>

                {/* Headline */}
                <motion.h1
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="text-4xl sm:text-5xl xl:text-[72px] font-extrabold text-[#0f172a] dark:text-white tracking-[-0.02em] leading-[1.06]"
                >
                  <span className="block">{tx("Find work.", "काम खोज्नुहोस्।")}</span>
                  <span className="relative block text-[#f85f0a]">
                    {tx("Hire talent.", "जनशक्ति रोज्नुहोस्।")}
                    <motion.svg
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
                      className="absolute -bottom-2 left-0 w-full"
                      viewBox="0 0 300 12"
                      fill="none"
                      preserveAspectRatio="none"
                    >
                      <motion.path
                        d="M2 9 Q75 3 150 7 Q225 11 298 5"
                        stroke="#f85f0a"
                        strokeWidth="3"
                        strokeLinecap="round"
                        fill="none"
                      />
                    </motion.svg>
                  </span>
                  <span className="block">{tx("Near you in Nepal.", "तपाईंको नजिकै नेपालमा।")}</span>
                </motion.h1>

                {/* Subheading */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.25 }}
                  className="mt-5 sm:mt-6 text-base sm:text-[18px] text-[#475569] dark:text-slate-400 leading-[1.65] max-w-[520px]"
                >
                  {tx(
                    "Electricians, plumbers, tutors, designers — connect with verified local talent or find gigs, all sorted by proximity to your location.",
                    "इलेक्ट्रीसियन, प्लम्बर, शिक्षक, डिजाइनर — तपाईंको स्थान नजिकका प्रमाणित कामदारहरूसँग जोडिनुहोस् वा नयाँ काम पाउनुहोस्।"
                  )}
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.35 }}
                  className="mt-7 sm:mt-8 flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
                >
                  <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                    <Link
                      href="/register?role=worker"
                      className="inline-flex items-center justify-center gap-2.5 px-7 py-4 bg-[#f85f0a] hover:bg-orange-600 text-white rounded-[14px] font-bold shadow-[0px_10px_30px_0px_rgba(0,0,0,0.1)] transition-all text-base w-full sm:w-auto"
                    >
                      <Briefcase className="w-5 h-5" />
                      {tx("I Want to Work", "म काम गर्न चाहन्छु")}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                    <Link
                      href="/register?role=recruiter"
                      className="inline-flex items-center justify-center gap-2.5 px-7 py-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#0f172a] dark:text-white border border-[#e2e8f0] dark:border-slate-700 rounded-[14px] font-bold transition-all text-base w-full sm:w-auto"
                    >
                      <Users className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      {tx("I Need to Hire", "मलाई कामदार चाहिन्छ")}
                    </Link>
                  </motion.div>
                </motion.div>

                {/* Trust pills */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="mt-5 flex flex-wrap gap-2 sm:gap-3"
                >
                  {[
                    { icon: Check, label: tx("Zero Commission", "शून्य कमिसन"), color: "text-emerald-500" },
                    { icon: MapPin, label: tx("GPS Matching", "जीपीएस म्याचिङ"), color: "text-emerald-500" },
                    { icon: ShieldCheck, label: tx("Verified Profiles", "प्रमाणित प्रोफाइलहरू"), color: "text-emerald-500" },
                  ].map(({ icon: Icon, label, color }) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white dark:bg-slate-800/80 border border-[#e2e8f0] dark:border-slate-700 text-[#475569] dark:text-slate-300 text-xs font-semibold"
                    >
                      <Icon className={`w-3.5 h-3.5 ${color}`} />
                      {label}
                    </span>
                  ))}
                </motion.div>
              </div>

              {/* ── Right Column: Auto-cycling hero photo ── */}
              <HeroPhotoSlider />
            </div>

            {/* ── Hero Sponsored Ad Slot (shown directly in Hero when active) ── */}
            <SponsoredAdsSection ads={ads} variant="landing" />

            {/* ── Stats / Social Proof Bar ── */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-4 lg:mt-0 border-t border-slate-200/80 dark:border-slate-800 py-6"
            >
              <div className="flex flex-wrap items-center justify-center lg:justify-between gap-6 text-sm">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{tx("Zero commission", "शून्य कमिसन")}</span> {tx("for workers — keep 100% of earnings", "कामदारका लागि — १००% कमाइ आफ्नै")}
                </div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <MapPin className="w-4 h-4 text-orange-500" />
                  {tx("Available across", "उपलब्ध")} <span className="font-semibold text-slate-700 dark:text-slate-200 mx-1">{tx("77 districts", "७७ जिल्ला")}</span> {tx("of Nepal", "नेपालभरि")}
                </div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{tx("Verified", "प्रमाणित")}</span> {tx("worker profiles", "कामदार प्रोफाइलहरू")}
                </div>
              </div>
            </motion.div>
          </div>
        </section>


        {/* ── Origin story / zig-zag ── */}
        <section className="py-20 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Left-anchored heading */}
            <div className="max-w-lg mb-16">
              <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-2">
                {tx("Why KamGhar exists", "कामघर किन बनाइयो?")}
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {tx("Rohan spent 3 days idle with a fully-charged drill and no one to call him.", "रोहनसँग काम गर्ने उपकरण थियो, तर काम बोलाउने कोही थिएन।")}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-base mt-4 leading-relaxed">
                {tx(
                  "He's a licensed electrician in Lalitpur. Knows his trade cold. But the only way people found workers in his neighborhood was word of mouth — and that week, the word hadn't reached him. We built KamGhar so that never happens again.",
                  "ललितपुरका दक्ष कामदारहरूले पनि कहिलेकाहीँ काम पाउन मुस्किल हुन्थ्यो। कामघरले सीप भएका कामदार र काम दिने ग्राहकलाई सिधै जोड्छ ताकि कोही पनि खाली बस्न नपरोस्।"
                )}
              </p>
            </div>

            {/* Zig-zag steps — alternating text + visual */}
            <div className="space-y-16">

              {/* Step 1 — text left */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                <div>
                  <span className="text-6xl font-black text-slate-100 dark:text-slate-800 select-none leading-none block mb-4">01</span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                    {tx("You drop a pin, not a form.", "फारम होइन, सिधै नक्सामा स्थान छान्नुहोस्।")}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                    {tx(
                      "No resume uploads. No cover letters. Open the map, drag to your location — Baneshwor, Patan, Bhaktapur, wherever — and workers within your chosen radius appear instantly sorted by distance.",
                      "बायोडाटा भर्नु पर्दैन। आफ्नो स्थान छान्नुहोस् र नजिकैका कामदारहरूलाई दुरी अनुसार तत्काल सम्पर्क गर्नुहोस्।"
                    )}
                  </p>
                  <p className="text-slate-500 dark:text-slate-500 text-xs">
                    {tx("Average time from signup to first job offer:", "साइनअप देखि पहिलो कामको प्रस्ताव सम्म औसत समय:")}{" "}
                    <strong className="text-slate-700 dark:text-slate-300">{tx("23 minutes.", "२३ मिनेट।")}</strong>
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {tx("Showing workers within 3 km", "३ किमी भित्रका कामदारहरू")}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: "Suraj Tamang", trade: "Electrician", dist: "0.8 km", rate: "NPR 900/hr" },
                      { name: "Bikash Rai", trade: "Plumber", dist: "1.4 km", rate: "NPR 750/hr" },
                      { name: "Sunita Shrestha", trade: "Home Cleaning", dist: "2.1 km", rate: "NPR 600/hr" },
                    ].map((w) => (
                      <div key={w.name} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">{w.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{w.trade} · {w.dist}</div>
                        </div>
                        <div className="text-xs font-semibold text-orange-600 dark:text-orange-400">{w.rate}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 2 — text right */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm md:order-1 order-2">
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Posted on KamGhar · Sept 14, 2026</p>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Electrical wiring for new flat — Chabahil</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">2-bedroom flat, full wiring needed. Must have own tools. Budget NPR 4,500.</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{tx("4 workers applied within 40 minutes", "४ जना कामदारले ४० मिनेटमै आवेदन दिए")}</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">{tx("Filled", "सम्पन्न")}</span>
                  </div>
                </div>
                <div className="md:order-2 order-1">
                  <span className="text-6xl font-black text-slate-100 dark:text-slate-800 select-none leading-none block mb-4">02</span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                    {tx("Post a job in under 2 minutes.", "२ मिनेटमै नयाँ काम पोस्ट गर्नुहोस्।")}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                    {tx(
                      "Describe the work, set a budget, drop your location. Workers near you see it immediately — no waiting for a platform to match you, no algorithm deciding who's 'relevant.'",
                      "कामको विवरण लेख्नुहोस्, बजेट तोक्नुहोस् र स्थान राख्नुहोस्। नजिकका दक्ष कामदारहरूले तुरुन्तै देख्नेछन् र आवेदन दिन सक्नेछन्।"
                    )}
                  </p>
                  <p className="text-slate-500 dark:text-slate-500 text-xs">
                    {tx("Most Kathmandu jobs get their first applicant in under", "काठमाडौंका अधिकांश काममा पहिलो आवेदन आउन लाग्ने समय:")}{" "}
                    <strong className="text-slate-700 dark:text-slate-300">{tx("35 minutes.", "३५ मिनेट।")}</strong>
                  </p>
                </div>
              </div>

              {/* Step 3 — text left */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                <div>
                  <span className="text-6xl font-black text-slate-100 dark:text-slate-800 select-none leading-none block mb-4">03</span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                    {tx("Workers keep everything they earn.", "कामदारले आफ्नो सबै कमाइ आफै राख्छन्।")}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                    {tx(
                      "Most platforms take 15–30% per job. We charge workers nothing. Ever. The NPR 850/hr you agree on is the NPR 850/hr they receive. Recruiters pay a small flat fee only when they post a job.",
                      "अन्य प्लेटफर्महरूले १५-३०% कमिसन काट्छन्। कामघरमा कामदारहरूको कुनै पनि कमिसन काटिँदैन। सम्पूर्ण पारिश्रमिक आफ्नै।"
                    )}
                  </p>
                  <p className="text-slate-500 dark:text-slate-500 text-xs">
                    {tx("Suraj — our first electrician — has done 47 jobs without losing a rupee to commission.", "हाम्रो पहिलो कामदार सुरजले कमिसन बिना ४७ भन्दा बढी काम सफलतापूर्वक पूरा गरिसकेका छन्।")}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-3xl p-6 shadow-lg shadow-orange-500/20">
                  <div className="text-white/80 text-xs font-semibold mb-3">{tx("Monthly earnings breakdown", "मासिक आम्दानी विवरण")}</div>
                  <div className="text-4xl font-extrabold text-white mb-1">NPR 38,400</div>
                  <div className="text-orange-100 text-sm mb-5">{tx("earned by Suraj in September 2026", "सुरजले आर्जन गरेको आम्दानी")}</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-orange-100">{tx("Gross from jobs", "कुल आम्दानी")}</span>
                      <span className="text-white font-bold">NPR 38,400</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-orange-100">{tx("KamGhar commission", "कामघर कमिसन")}</span>
                      <span className="text-white font-bold">NPR 0</span>
                    </div>
                    <div className="border-t border-white/20 pt-2 flex justify-between text-sm">
                      <span className="text-white font-semibold">{tx("Take home", "आफ्नो बचत")}</span>
                      <span className="text-white font-extrabold">NPR 38,400</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Bento features grid ── */}
        <section className="py-16 bg-white dark:bg-slate-900/50 border-t border-slate-200/80 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mb-12">
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {tx("Built for how Nepal actually works.", "नेपालको वास्तविक आवश्यकता अनुसार निर्मित।")}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 leading-relaxed">
                {tx(
                  "No phone bank. No call center. Just an app that works in Kathmandu and in Pokhara, with eSewa and with cash.",
                  "काठमाडौं होस् वा पोखरा, eSewa, Khalti वा नगद — नेपाली परिवेश अनुसार पूर्णतया उपयोगी।"
                )}
              </p>
            </div>

            {/* Bento grid — unequal cells */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">

              {/* Large cell — GPS */}
              <div className="lg:col-span-2 bg-slate-900 dark:bg-slate-800 rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-52 h-52 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
                <MapPin className="w-8 h-8 text-orange-400 mb-5" />
                <h3 className="text-xl font-bold mb-2">GPS-first, not keyword-first.</h3>
                <p className="text-slate-300 text-sm leading-relaxed max-w-md">
                  Other platforms sort by &quot;relevance&quot; — a black box. We sort by how far the worker has to walk. A plumber 900 metres away shows up before a plumber 15 km away, every time.
                </p>
                <div className="mt-6 flex items-center gap-6 text-sm">
                  <div>
                    <div className="text-2xl font-extrabold text-white">77</div>
                    <div className="text-slate-400 text-xs">districts covered</div>
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-white">1–20 km</div>
                    <div className="text-slate-400 text-xs">search radius</div>
                  </div>
                </div>
              </div>

              {/* Tall cell — no commission */}
              <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/60 rounded-3xl p-7 flex flex-col justify-between">
                <div>
                  <ShieldCheck className="w-7 h-7 text-orange-600 dark:text-orange-400 mb-4" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Zero cuts. Not &quot;low fees.&quot; Zero.</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    We decided early that taking a slice of every payment would just recreate the same problem Rohan had. Workers on KamGhar earn full rate.
                  </p>
                </div>
                <div className="mt-6 text-xs text-slate-400 dark:text-slate-500">
                  Recruiters pay NPR 0–299 to post. That&apos;s the only money we make.
                </div>
              </div>

              {/* Small cell — response time */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-7">
                <div className="text-4xl font-extrabold text-slate-900 dark:text-white mb-1">23 min</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mb-3">average time from posting to first applicant</div>
                <p className="text-xs text-slate-400 dark:text-slate-500">Measured across 847 jobs in September 2026.</p>
              </div>

              {/* Small cell — payment */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-7">
                <Zap className="w-6 h-6 text-amber-500 mb-3" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Pay how you pay.</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  eSewa, Khalti, or cash on completion. No forced digital wallet, no minimum balance.
                </p>
              </div>

              {/* Wide cell — verified profiles */}
              <div className="bg-slate-900 dark:bg-slate-800 rounded-3xl p-7 text-white">
                <Users className="w-6 h-6 text-emerald-400 mb-4" />
                <h3 className="text-base font-bold mb-2">Profiles that actually tell you something.</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Every worker profile shows their trade, hourly rate, exact location on a map, completed job count, and real reviews — not a generic star average, but what the client wrote word for word.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Notebook / Journal Section (Field Notes & Community Sticky Notes) ── */}
        <HomeNotebook />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-black text-slate-400 pt-10 pb-24 sm:pb-10 text-sm border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <span className="font-bold text-white text-base">
              Kam<span className="text-orange-500">Ghar</span>
            </span>
            <span className="text-xs text-slate-500">© {new Date().getFullYear()} · {tx("Built in Kathmandu", "काठमाडौंमा निर्मित")}</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-500">
            <Link href="/jobs" className="hover:text-slate-300 transition-colors">{tx("Browse Jobs", "काम खोज्नुहोस्")}</Link>
            <Link href="/workers" className="hover:text-slate-300 transition-colors">{tx("Find Workers", "कामदार खोज्नुहोस्")}</Link>
            <Link href="/register" className="hover:text-slate-300 transition-colors">{tx("Join", "दर्ता हुनुहोस्")}</Link>
          </div>
        </div>
      </footer>

      {/* In-App Direct Chat Modal when triggered from a message notification */}
      {activeChat && (
        <ChatModal
          isOpen={!!activeChat}
          onClose={() => setActiveChat(null)}
          conversationId={activeChat.conversationId}
          recipientName={activeChat.recipientName}
          recipientRole={activeChat.recipientRole}
          recipientPhoto={activeChat.recipientPhoto}
          recipientPhone={activeChat.recipientPhone}
          recipientVerified={activeChat.recipientVerified}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}
