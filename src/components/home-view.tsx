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
import { createClient } from "@/lib/supabase/client";

const CATEGORIES = [
  { name: "Electrician", icon: Zap, jobs: "120+ gigs" },
  { name: "Plumbing", icon: Wrench, jobs: "85+ gigs" },
  { name: "Painting & Masonry", icon: Paintbrush, jobs: "64+ gigs" },
  { name: "Carpentry", icon: Briefcase, jobs: "45+ gigs" },
  { name: "Tutoring & Classes", icon: BookOpen, jobs: "90+ gigs" },
  { name: "Digital & Design", icon: Laptop, jobs: "110+ gigs" },
  { name: "Delivery & Moving", icon: Truck, jobs: "75+ gigs" },
  { name: "Home Cleaning", icon: Sparkles, jobs: "95+ gigs" },
];

export default function HomeView() {
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "true";
  const [showBanner, setShowBanner] = useState(justRegistered);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setIsLoggedIn(true);
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-orange-500 selection:text-white transition-colors duration-200">
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

      {/* Header / Navbar */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400 }}>
              <div className="dark:bg-white dark:rounded-xl dark:px-2.5 dark:py-1 transition-all duration-200">
                <Image
                  src="/logo.png"
                  alt="KamGhar Logo"
                  width={160}
                  height={52}
                  priority
                  className="h-9 sm:h-10 w-auto object-contain"
                />
              </div>
            </motion.div>
            <span className="text-xs text-orange-600 dark:text-orange-400 font-medium px-2.5 py-0.5 bg-orange-50 dark:bg-orange-950/50 rounded-full border border-orange-200 dark:border-orange-800/60 hidden sm:inline">
              काम घर
            </span>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3 text-sm font-medium">
            <Link
              href="/jobs"
              className="text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors hidden sm:inline px-2"
            >
              Browse Jobs
            </Link>
            <Link
              href="/workers"
              className="text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors hidden sm:inline px-2"
            >
              Find Workers
            </Link>

            {/* Theme Toggle Button */}
            <ThemeToggle />

            {isLoggedIn ? (
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold shadow-sm shadow-orange-500/20 transition-all flex items-center gap-1.5"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
              </motion.div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Log in
                </Link>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/register"
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold shadow-sm shadow-orange-500/20 transition-all inline-block"
                  >
                    Get Started
                  </Link>
                </motion.div>
              </>
            )}
          </nav>
        </div>
      </motion.header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-14 pb-0 sm:pt-20">
          {/* ── Background decorative orbs ── */}
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-32 -left-24 w-[480px] h-[480px] rounded-full bg-orange-400/20 dark:bg-orange-500/10 blur-[100px]" />
            <div className="absolute top-1/2 -right-32 w-[400px] h-[400px] rounded-full bg-amber-400/15 dark:bg-amber-500/8 blur-[90px]" />
            <div className="absolute bottom-0 left-1/3 w-[300px] h-[300px] rounded-full bg-orange-300/10 dark:bg-orange-600/5 blur-[80px]" />
            {/* Subtle grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
              style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.5) 1px, transparent 1px)`,
                backgroundSize: "48px 48px",
              }}
            />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center min-h-[calc(100vh-4rem)] py-12 lg:py-0">

              {/* ── Left Column: Text & CTAs ── */}
              <div className="flex flex-col items-start">
                {/* Live badge */}
                <motion.div
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800/70 text-orange-800 dark:text-orange-200 text-xs font-semibold mb-7 shadow-sm"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-600" />
                  </span>
                  <MapPin className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                  Nepal&apos;s #1 Local Gig Marketplace
                </motion.div>

                {/* Headline */}
                <motion.h1
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="text-5xl sm:text-6xl xl:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.08]"
                >
                  Find work.{" "}
                  <span className="relative inline-block">
                    <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 bg-clip-text text-transparent">
                      Hire talent.
                    </span>
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
                        stroke="url(#heroUnderline)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        fill="none"
                      />
                      <defs>
                        <linearGradient id="heroUnderline" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#ea580c" />
                          <stop offset="100%" stopColor="#f59e0b" />
                        </linearGradient>
                      </defs>
                    </motion.svg>
                  </span>
                  <br />
                  Near you in Nepal.
                </motion.h1>

                {/* Subheading */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.25 }}
                  className="mt-7 text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg"
                >
                  Electricians, plumbers, tutors, designers — connect with verified local talent or find gigs, all sorted by proximity to your location.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.35 }}
                  className="mt-9 flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
                >
                  <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                    <Link
                      href="/register?role=worker"
                      className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold shadow-xl shadow-orange-500/30 transition-all text-base w-full sm:w-auto"
                    >
                      <Briefcase className="w-5 h-5" />
                      I Want to Work
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                    <Link
                      href="/register?role=recruiter"
                      className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-white dark:bg-slate-900 hover:bg-orange-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-700 rounded-2xl font-bold shadow-sm transition-all text-base w-full sm:w-auto"
                    >
                      <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      I Need to Hire
                    </Link>
                  </motion.div>
                </motion.div>

                {/* Trust pills */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="mt-8 flex flex-wrap gap-2.5"
                >
                  {[
                    { icon: Check, label: "Zero Commission" },
                    { icon: MapPin, label: "GPS Matching" },
                    { icon: ShieldCheck, label: "Verified Profiles" },
                  ].map(({ icon: Icon, label }) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold"
                    >
                      <Icon className="w-3.5 h-3.5 text-emerald-500" />
                      {label}
                    </span>
                  ))}
                </motion.div>

                {/* Stats row */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="mt-10 grid grid-cols-3 gap-6 border-t border-slate-200 dark:border-slate-800 pt-8 w-full max-w-sm"
                >
                  {[
                    { value: "2,400+", label: "Active Workers" },
                    { value: "840+", label: "Open Gigs" },
                    { value: "14+", label: "Skill Categories" },
                  ].map(({ value, label }) => (
                    <div key={label}>
                      <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{value}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{label}</div>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* ── Right Column: Real Photo Collage ── */}
              <div className="relative hidden lg:flex items-center justify-center h-[600px]">

                {/* Soft background glow */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-96 h-96 rounded-full bg-orange-300/20 dark:bg-orange-500/10 blur-[80px]" />
                </div>

                {/* Large main photo — electrician */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                  className="absolute left-0 top-12 w-[280px] h-[340px] rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white dark:ring-slate-800 z-20"
                >
                  <Image
                    src="/worker-electrician.jpg"
                    alt="Electrician at work"
                    fill
                    className="object-cover"
                    sizes="280px"
                  />
                  {/* Label badge */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl px-3 py-2 flex items-center gap-2 shadow-lg">
                    <div className="w-7 h-7 rounded-xl bg-orange-100 dark:bg-orange-950 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Electrician</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" /> 1.2 km away
                      </div>
                    </div>
                    <span className="ml-auto text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded-full">
                      Available
                    </span>
                  </div>
                </motion.div>

                {/* Top-right photo — digital worker */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7, delay: 0.5 }}
                  className="absolute right-0 top-4 w-[220px] h-[200px] rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white dark:ring-slate-800 z-20"
                >
                  <Image
                    src="/worker-digital.webp"
                    alt="Digital worker"
                    fill
                    className="object-cover object-top"
                    sizes="220px"
                  />
                  <div className="absolute bottom-3 left-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl px-2.5 py-1.5 flex items-center gap-2 shadow-md">
                    <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center flex-shrink-0">
                      <Laptop className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-[10px] font-bold text-slate-900 dark:text-white">Digital Freelancer</div>
                  </div>
                </motion.div>

                {/* Bottom-right photo — plumber */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.65 }}
                  className="absolute right-4 bottom-8 w-[210px] h-[220px] rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white dark:ring-slate-800 z-20"
                >
                  <Image
                    src="/worker-plumber.jpg"
                    alt="Plumber at work"
                    fill
                    className="object-cover"
                    sizes="210px"
                  />
                  <div className="absolute bottom-3 left-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl px-2.5 py-1.5 flex items-center gap-2 shadow-md">
                    <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center flex-shrink-0">
                      <Wrench className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="text-[10px] font-bold text-slate-900 dark:text-white">Plumber</div>
                  </div>
                </motion.div>

                {/* Floating stat pill — top center */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                  className="absolute top-0 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 shadow-xl z-30 flex items-center gap-2.5"
                >
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-orange-400 ring-2 ring-white dark:ring-slate-900" />
                    <div className="w-6 h-6 rounded-full bg-amber-400 ring-2 ring-white dark:ring-slate-900" />
                    <div className="w-6 h-6 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-900" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900 dark:text-white">2,400+ Workers</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">across Nepal</div>
                  </div>
                </motion.div>

                {/* Floating rating badge — bottom left */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 1.0 }}
                  className="absolute bottom-4 left-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl px-4 py-3 shadow-xl shadow-orange-500/30 z-30"
                >
                  <div className="flex items-center gap-1 mb-1">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className="w-3 h-3 text-white fill-white" />
                    ))}
                  </div>
                  <div className="text-xs font-bold text-white">4.9 avg rating</div>
                  <div className="text-[10px] text-orange-100">from 1,200+ reviews</div>
                </motion.div>

              </div>
            </div>

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
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Zero commission</span> for workers — keep 100% of earnings
                </div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <MapPin className="w-4 h-4 text-orange-500" />
                  Available across <span className="font-semibold text-slate-700 dark:text-slate-200 mx-1">77 districts</span> of Nepal
                </div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Verified</span> worker profiles
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
              <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-2">Why KamGhar exists</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
                Rohan spent 3 days idle with a fully-charged drill and no one to call him.
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-base mt-4 leading-relaxed">
                He&apos;s a licensed electrician in Lalitpur. Knows his trade cold. But the only way people found workers in his neighborhood was word of mouth — and that week, the word hadn&apos;t reached him. We built KamGhar so that never happens again.
              </p>
            </div>

            {/* Zig-zag steps — alternating text + visual */}
            <div className="space-y-16">

              {/* Step 1 — text left */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                <div>
                  <span className="text-6xl font-black text-slate-100 dark:text-slate-800 select-none leading-none block mb-4">01</span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">You drop a pin, not a form.</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                    No resume uploads. No cover letters. Open the map, drag to your location — Baneshwor, Patan, Bhaktapur, wherever — and workers within your chosen radius appear instantly sorted by distance.
                  </p>
                  <p className="text-slate-500 dark:text-slate-500 text-xs">Average time from signup to first job offer: <strong className="text-slate-700 dark:text-slate-300">23 minutes.</strong></p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Showing workers within 3 km</span>
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
                    <span className="text-xs text-slate-400">4 workers applied within 40 minutes</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">Filled</span>
                  </div>
                </div>
                <div className="md:order-2 order-1">
                  <span className="text-6xl font-black text-slate-100 dark:text-slate-800 select-none leading-none block mb-4">02</span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Post a job in under 2 minutes.</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                    Describe the work, set a budget, drop your location. Workers near you see it immediately — no waiting for a platform to match you, no algorithm deciding who&apos;s &quot;relevant.&quot;
                  </p>
                  <p className="text-slate-500 dark:text-slate-500 text-xs">Most Kathmandu jobs get their first applicant in under <strong className="text-slate-700 dark:text-slate-300">35 minutes.</strong></p>
                </div>
              </div>

              {/* Step 3 — text left */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                <div>
                  <span className="text-6xl font-black text-slate-100 dark:text-slate-800 select-none leading-none block mb-4">03</span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Workers keep everything they earn.</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                    Most platforms take 15–30% per job. We charge workers nothing. Ever. The NPR 850/hr you agree on is the NPR 850/hr they receive. Recruiters pay a small flat fee only when they post a job.
                  </p>
                  <p className="text-slate-500 dark:text-slate-500 text-xs">Suraj — our first electrician — has done <strong className="text-slate-700 dark:text-slate-300">47 jobs since March 2026</strong> without losing a rupee to commission.</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-3xl p-6 shadow-lg shadow-orange-500/20">
                  <div className="text-white/80 text-xs font-semibold mb-3">Monthly earnings breakdown</div>
                  <div className="text-4xl font-extrabold text-white mb-1">NPR 38,400</div>
                  <div className="text-orange-100 text-sm mb-5">earned by Suraj in September 2026</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-orange-100">Gross from jobs</span>
                      <span className="text-white font-bold">NPR 38,400</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-orange-100">KamGhar commission</span>
                      <span className="text-white font-bold">NPR 0</span>
                    </div>
                    <div className="border-t border-white/20 pt-2 flex justify-between text-sm">
                      <span className="text-white font-semibold">Take home</span>
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
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Built for how Nepal actually works.</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 leading-relaxed">
                No phone bank. No call center. Just an app that works in Kathmandu and in Pokhara, with eSewa and with cash.
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
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-black text-slate-400 py-10 text-sm border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <span className="font-bold text-white text-base">
              Kam<span className="text-orange-500">Ghar</span>
            </span>
            <span className="text-xs text-slate-500">© {new Date().getFullYear()} · Built in Kathmandu</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-500">
            <Link href="/jobs" className="hover:text-slate-300 transition-colors">Browse Jobs</Link>
            <Link href="/workers" className="hover:text-slate-300 transition-colors">Find Workers</Link>
            <Link href="/register" className="hover:text-slate-300 transition-colors">Join</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
