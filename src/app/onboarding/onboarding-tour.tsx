"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Compass,
  CheckCircle2,
  Star,
  Coins,
} from "lucide-react";

interface OnboardingTourProps {
  role: "WORKER" | "RECRUITER" | "ADMIN";
  userName: string;
  onFinishTour: () => void;
}

interface TourSlide {
  id: string;
  badge: string;
  badgeIcon: React.ElementType;
  title: string;
  highlight: string;
  description: string;
  visualType: "discovery" | "proximity" | "trust";
}

const SLIDES: TourSlide[] = [
  {
    id: "discovery",
    badge: "Nepal's Local Gig Platform",
    badgeIcon: Sparkles,
    title: "Find Work or Hire Talent",
    highlight: "Right in Your Neighborhood",
    description:
      "KamGhar brings inDrive-style proximity discovery to Nepal's gig economy. Whether you're an electrician, developer, plumber, or tutor — opportunities are just around the corner.",
    visualType: "discovery",
  },
  {
    id: "proximity",
    badge: "Hyperlocal Proximity",
    badgeIcon: Compass,
    title: "Cut Down Commutes",
    highlight: "With Live GPS Matching",
    description:
      "Filter jobs and workers within your exact district or kilometer radius. See real-time distances, exact locations, and respond before anyone else.",
    visualType: "proximity",
  },
  {
    id: "trust",
    badge: "Zero Middlemen & Direct Pay",
    badgeIcon: ShieldCheck,
    title: "Direct Connect & Fair Pay",
    highlight: "Built on Community Trust",
    description:
      "No commission cuts taking away your hard-earned pay. Call, message, negotiate in NPR, and build your reputation with authentic ratings after every completed job.",
    visualType: "trust",
  },
];

export default function OnboardingTour({
  role,
  userName,
  onFinishTour,
}: OnboardingTourProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);

  const slide = SLIDES[currentSlide];
  const isLast = currentSlide === SLIDES.length - 1;

  const handleNext = () => {
    if (isLast) {
      onFinishTour();
    } else {
      setDirection(1);
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
      scale: 0.98,
    }),
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-black/60 overflow-hidden transition-all duration-300">
        {/* Top Header Navigation */}
        <div className="px-6 pt-6 pb-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="dark:bg-white dark:rounded-lg dark:px-2 dark:py-1 inline-flex">
              <Image
                src="/logo.png"
                alt="KamGhar Logo"
                width={120}
                height={38}
                priority
                className="h-7 w-auto object-contain"
              />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50">
              {role === "WORKER" ? "Worker Guide" : "Recruiter Guide"}
            </span>
          </div>

          <button
            onClick={onFinishTour}
            className="text-xs font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Skip to Setup →
          </button>
        </div>

        {/* Slide Carousel Content */}
        <div className="p-6 sm:p-10 min-h-[460px] flex flex-col justify-between">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={slide.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700">
                <slide.badgeIcon className="w-3.5 h-3.5 text-orange-500" />
                <span>
                  {currentSlide === 0 && userName
                    ? `Namaste, ${userName.split(" ")[0]}! • ${slide.badge}`
                    : slide.badge}
                </span>
              </div>

              {/* Title & Copy */}
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                  {slide.title}{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 dark:from-orange-400 dark:to-amber-300">
                    {slide.highlight}
                  </span>
                </h2>
                <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                  {slide.description}
                </p>
              </div>

              {/* Visual Interactive Graphic per Slide */}
              <div className="pt-2">
                {slide.visualType === "discovery" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-slate-800/40 border border-orange-200/70 dark:border-orange-900/30 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-extrabold text-orange-600 dark:text-orange-400">
                          ELECTRICIAN
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                          1.2 km
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">
                        Home Rewiring in Baneshwor
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Rs. 600/hr • Urgent
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-slate-800/40 border border-blue-200/70 dark:border-blue-900/30 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
                          PLUMBER
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                          0.8 km
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">
                        Pipe Fitting in Lalitpur
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Rs. 1,200 Fixed • Today
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-slate-800/40 border border-emerald-200/70 dark:border-emerald-900/30 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                          WEB DEV
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                          Remote
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">
                        Next.js Landing Page
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Rs. 15,000 • 3 Days
                      </p>
                    </div>
                  </div>
                )}

                {slide.visualType === "proximity" && (
                  <div className="relative p-5 rounded-2xl bg-slate-900 text-white overflow-hidden border border-slate-800">
                    <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-orange-600/20 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Proximity Radar Active</p>
                        <p className="text-xs text-slate-400">
                          Kathmandu Valley & 77 Districts
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          <span>Within 5 km of your pinned pin</span>
                        </span>
                        <span className="font-bold text-orange-400">14 gigs available</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/40 text-slate-400">
                        <span>Average response time</span>
                        <span className="font-semibold text-slate-200">Under 15 minutes</span>
                      </div>
                    </div>
                  </div>
                )}

                {slide.visualType === "trust" && (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border border-orange-200 dark:border-orange-900/40 space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/30">
                        <Coins className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Direct Settlement in NPR
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Cash, eSewa, Khalti, or Bank Transfer agreed directly between parties.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>Verified phone contacts</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                        <Star className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <span>Two-way transparent reviews</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Bottom Bar: Indicators & Controls */}
          <div className="pt-8 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80">
            {/* Step Indicators */}
            <div className="flex items-center gap-2">
              {SLIDES.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setDirection(idx > currentSlide ? 1 : -1);
                    setCurrentSlide(idx);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentSlide
                      ? "w-8 bg-orange-600 dark:bg-orange-500"
                      : "w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-2.5">
              {currentSlide > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/25 flex items-center gap-2 transition-all cursor-pointer"
              >
                {isLast ? (
                  <>
                    Set Up Profile <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Next <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
