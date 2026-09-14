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
                <p className="font-bold text-sm">Welcome to KamGhar! 🎉</p>
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
              href="/register?role=recruiter"
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
        <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28">
          {/* Subtle background glow effect */}
          <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-orange-400/20 dark:from-orange-500/10 to-blue-400/10 dark:to-blue-500/5 rounded-full blur-3xl -z-10" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
            {/* Animated Pill Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100/90 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800/80 text-orange-950 dark:text-orange-200 text-xs font-semibold mb-6 shadow-sm shadow-orange-500/10"
            >
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <MapPin className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              <span>Location-Based Gig Marketplace in Nepal</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.12]"
            >
              Connect with nearby work, <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                just like hailing a ride.
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-base sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed"
            >
              From electricians and plumbers to tutors and digital freelancers — find gigs and hire reliable talent right around your neighborhood in Kathmandu and beyond.
            </motion.p>

            {/* Interactive Call-to-Action Cards */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto"
            >
              <motion.div
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto"
              >
                <Link
                  href="/register?role=worker"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold shadow-lg shadow-orange-500/25 transition-all text-base"
                >
                  <Briefcase className="w-5 h-5" />
                  <span>I Want to Work</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto"
              >
                <Link
                  href="/register?role=recruiter"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl font-bold shadow-sm transition-all text-base"
                >
                  <Users className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                  <span>I Need to Hire</span>
                </Link>
              </motion.div>
            </motion.div>

            {/* Trust Markers */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-500 dark:text-slate-400 font-medium"
            >
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Zero Commission for Workers</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Real-Time Proximity Matching</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Verified Nepali Profiles</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Popular Categories Grid */}
        <section className="py-16 bg-white dark:bg-slate-900/50 border-y border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                All Sectors of Gig Work
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Discover skilled independent service providers near your coordinates
              </p>
            </div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.08 },
                },
              }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4"
            >
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <motion.div
                    key={cat.name}
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 350 }}
                  >
                    <Link
                      href={`/jobs?category=${encodeURIComponent(cat.name)}`}
                      className="block p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-50/40 dark:hover:bg-orange-950/20 border border-slate-200/80 dark:border-slate-700/80 hover:border-orange-300 dark:hover:border-orange-600/50 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/80 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-3 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{cat.jobs}</p>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-14">
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400 tracking-wider uppercase">
                Simple & Direct
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1.5">
                How KamGhar Works
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                Designed for the Nepali gig economy with location-first convenience
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <motion.div
                whileHover={{ y: -5 }}
                className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden transition-colors"
              >
                <div className="text-5xl font-black text-slate-100 dark:text-slate-800 absolute top-4 right-6 select-none">
                  01
                </div>
                <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/80 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-6">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Location Detection</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Set or detect your neighborhood coordinates. See jobs and available workers mapped by exact driving or walking distance.
                </p>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                whileHover={{ y: -5 }}
                className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden transition-colors"
              >
                <div className="text-5xl font-black text-slate-100 dark:text-slate-800 absolute top-4 right-6 select-none">
                  02
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Direct Matching</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Apply to jobs with a tap or browse worker skill profiles directly. No complex middlemen or delayed interview cycles.
                </p>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                whileHover={{ y: -5 }}
                className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden transition-colors"
              >
                <div className="text-5xl font-black text-slate-100 dark:text-slate-800 absolute top-4 right-6 select-none">
                  03
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6">
                  <Star className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Review & Build Trust</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Rate and leave verified feedback after every job completion, fostering a reliable community of Nepali gig professionals.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="py-16 bg-white dark:bg-slate-900/50 border-t border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-950/80 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-4">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Hyperlocal Distance Matching</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Smart location matching sorts gigs and available talent precisely from 1 km to 20 km around you in real time.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Bank-Grade Security</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Enterprise identity and session encryption ensure your private details and transactions stay safe.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/80 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Boosted Visibility</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Promote urgent jobs or spotlight your worker profile with integrated Nepali payments (Khalti & eSewa).
                </p>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-black text-slate-400 py-10 text-sm border-t border-slate-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white text-base">
              Kam<span className="text-orange-500">Ghar</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400">© {new Date().getFullYear()} All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>Built for Nepal 🇳🇵</span>
            <span>•</span>
            <span>Find work. Post jobs. Grow.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
