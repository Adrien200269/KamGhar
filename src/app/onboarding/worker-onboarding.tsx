/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Star,
  AlertCircle,
  Camera,
  Compass,
  Eye,
  HelpCircle,
  Check,
  Briefcase,
  Sparkles,
  Coins,
  Navigation,
} from "lucide-react";
import { completeWorkerOnboarding } from "@/app/actions/profile";
import { NEPAL_DISTRICTS, SKILL_CATEGORIES } from "@/lib/constants";

// Dynamically import MapPicker with SSR disabled
const MapPicker = dynamic(() => import("@/components/map-picker"), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading interactive map...
    </div>
  ),
});

interface WorkerInitialData {
  bio?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  profilePhotoUrl?: string;
  skills?: string[];
  hourlyRate?: string;
}

interface WorkerOnboardingProps {
  name: string;
  email: string;
  initialData?: WorkerInitialData;
}

const WORKER_AVATARS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
];

const WORKER_TOUR_SLIDES = [
  {
    id: "gigs",
    badge: "For Skilled Workers in Nepal",
    badgeIcon: Sparkles,
    title: "Find High-Paying Local Gigs",
    highlight: "Right at Your Doorstep",
    description:
      "Join thousands of electricians, plumbers, carpenters, technicians, and digital freelancers earning on their own terms across Nepal without waiting for word-of-mouth.",
    highlightBox: {
      tag: "IN-DEMAND RIGHT NOW",
      items: [
        { label: "Home Rewiring (Kathmandu)", rate: "Rs. 700/hr" },
        { label: "Water Pipe Fitting (Lalitpur)", rate: "Rs. 1,500 fixed" },
        { label: "Furniture Repair (Bhaktapur)", rate: "Rs. 850/hr" },
      ],
    },
  },
  {
    id: "radar",
    badge: "Proximity Radar",
    badgeIcon: Compass,
    title: "Cut Down Commuting Time",
    highlight: "Work In Your Neighborhood",
    description:
      "Set your base location and maximum travel radius. Recruiters nearby see you instantly and can book you for urgent or scheduled gigs.",
    highlightBox: {
      tag: "SMART LOCATION MATCHING",
      items: [
        { label: "Instant notification for jobs within 5 km", rate: "Fast Alert" },
        { label: "Pin exact neighborhood or district", rate: "GPS Precise" },
        { label: "Choose jobs that fit your route", rate: "Zero Commute" },
      ],
    },
  },
  {
    id: "pay",
    badge: "Zero Platform Commissions",
    badgeIcon: Coins,
    title: "Keep 100% Of Your Income",
    highlight: "Direct Cash & Digital Pay",
    description:
      "No agency cuts. You set your own hourly rates in NPR, negotiate directly with recruiters, and receive payments straight to your pocket, eSewa, or Khalti.",
    highlightBox: {
      tag: "FAIR & TRANSPARENT",
      items: [
        { label: "Zero cuts on hourly wages", rate: "100% Yours" },
        { label: "Direct phone call & WhatsApp connect", rate: "Direct" },
        { label: "Build verified 5-star ratings", rate: "Build Trust" },
      ],
    },
  },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -50 : 50, opacity: 0 }),
};

export default function WorkerOnboarding({
  name: initialName,
  initialData,
}: WorkerOnboardingProps) {
  const router = useRouter();

  // Mode: "tour" (visual intro) or "wizard" (setup steps)
  const [viewMode, setViewMode] = useState<"tour" | "wizard">("tour");
  const [tourSlideIndex, setTourSlideIndex] = useState(0);
  const [tourDir, setTourDir] = useState(1);

  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Worker Identity
  const [displayName, setDisplayName] = useState(initialName);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(
    initialData?.profilePhotoUrl || WORKER_AVATARS[0]
  );
  const [customPhotoMode, setCustomPhotoMode] = useState(false);
  const [tradeTitle, setTradeTitle] = useState("Skilled Professional");
  const [experienceLevel, setExperienceLevel] = useState("3-5 years");
  const [bio, setBio] = useState(initialData?.bio || "");

  // Step 2: Location & Service Radius
  const [selectedDistrict, setSelectedDistrict] = useState(
    initialData?.address?.split(",")[0] || "Kathmandu"
  );
  const [address, setAddress] = useState(initialData?.address || "");
  const [travelRadius, setTravelRadius] = useState("Within 10 km");
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initialData?.latitude ?? 27.7172,
    lng: initialData?.longitude ?? 85.324,
  });
  const [isLocating, setIsLocating] = useState(false);

  // Step 3: Skills, Rate & Availability
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    initialData?.skills || ["Electrician"]
  );
  const [hourlyRate, setHourlyRate] = useState(initialData?.hourlyRate || "500");
  const [availability, setAvailability] = useState("Available Now");

  const goNext = () => {
    setDir(1);
    setStep((s) => s + 1);
  };
  const goPrev = () => {
    setDir(-1);
    setStep((s) => s - 1);
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        setIsLocating(false);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          if (data?.display_name) {
            setAddress(data.display_name.split(",").slice(0, 3).join(","));
          }
        } catch {
          // keep coords even if geocoding fails
        }
      },
      () => {
        setIsLocating(false);
        setError("Could not retrieve GPS position. Please pin your area on the map.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleMapChange = (lat: number, lng: number, addr?: string) => {
    setCoords({ lat, lng });
    if (addr) {
      setAddress(addr.split(",").slice(0, 3).join(","));
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const finalAddress = address || selectedDistrict;
      const combinedBio = `${tradeTitle} (${experienceLevel} exp). ${bio}`.trim();

      const result = await completeWorkerOnboarding({
        bio: combinedBio,
        skills: selectedSkills,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        address: finalAddress,
        latitude: coords.lat,
        longitude: coords.lng,
        profilePhotoUrl,
      });

      if (!result.success) {
        setError(result.error ?? "Failed to save profile. Please try again.");
        setIsSubmitting(false);
        return;
      }

      setStep(5); // Show success step
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentTourSlide = WORKER_TOUR_SLIDES[tourSlideIndex];
  const isLastTourSlide = tourSlideIndex === WORKER_TOUR_SLIDES.length - 1;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center px-4 py-8 sm:py-12 transition-colors duration-200">
      {/* Background Ambience */}
      <div className="pointer-events-none fixed -top-40 -right-40 w-[550px] h-[550px] bg-orange-200/35 dark:bg-orange-600/10 rounded-full blur-3xl" />
      <div className="pointer-events-none fixed -bottom-40 -left-40 w-[550px] h-[550px] bg-amber-200/30 dark:bg-amber-600/10 rounded-full blur-3xl" />

      {/* ── PHASE 1: WORKER TOUR ── */}
      {viewMode === "tour" ? (
        <div className="w-full max-w-2xl relative z-10">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl shadow-orange-500/5 overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="dark:bg-white dark:rounded-lg dark:px-2 dark:py-1 inline-flex">
                  <Image
                    src="/logo.png"
                    alt="KamGhar Logo"
                    width={115}
                    height={36}
                    priority
                    className="h-7 w-auto object-contain"
                  />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60 flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-orange-500" /> Worker Welcome
                </span>
              </div>

              <button
                type="button"
                onClick={() => setViewMode("wizard")}
                className="text-xs font-bold text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Skip to Profile Setup →
              </button>
            </div>

            {/* Slide Content */}
            <div className="p-6 sm:p-10 min-h-[460px] flex flex-col justify-between">
              <AnimatePresence mode="wait" custom={tourDir}>
                <motion.div
                  key={currentTourSlide.id}
                  custom={tourDir}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-6"
                >
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 text-xs font-bold border border-orange-200 dark:border-orange-900/50">
                    <currentTourSlide.badgeIcon className="w-3.5 h-3.5 text-orange-500" />
                    <span>
                      {tourSlideIndex === 0
                        ? `Namaste ${displayName.split(" ")[0]}! • ${currentTourSlide.badge}`
                        : currentTourSlide.badge}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                      {currentTourSlide.title}{" "}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">
                        {currentTourSlide.highlight}
                      </span>
                    </h2>
                    <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                      {currentTourSlide.description}
                    </p>
                  </div>

                  {/* Highlights Grid */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-50/60 to-amber-50/40 dark:from-slate-800/60 dark:to-slate-850/60 border border-orange-200/70 dark:border-slate-700">
                    <p className="text-[11px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-3">
                      {currentTourSlide.highlightBox.tag}
                    </p>
                    <div className="space-y-2">
                      {currentTourSlide.highlightBox.items.map((it, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-xs"
                        >
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {it.label}
                          </span>
                          <span className="font-extrabold text-orange-600 dark:text-orange-400">
                            {it.rate}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Bottom Navigation */}
              <div className="pt-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  {WORKER_TOUR_SLIDES.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setTourDir(idx > tourSlideIndex ? 1 : -1);
                        setTourSlideIndex(idx);
                      }}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        idx === tourSlideIndex
                          ? "w-8 bg-orange-600 dark:bg-orange-500"
                          : "w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300"
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2.5">
                  {tourSlideIndex > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setTourDir(-1);
                        setTourSlideIndex((i) => i - 1);
                      }}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => {
                      if (isLastTourSlide) {
                        setViewMode("wizard");
                      } else {
                        setTourDir(1);
                        setTourSlideIndex((i) => i + 1);
                      }
                    }}
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/25 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    {isLastTourSlide ? (
                      <>
                        Set Up Worker Profile <ArrowRight className="w-4 h-4" />
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
      ) : (
        /* ── PHASE 2: WORKER SETUP WIZARD ── */
        <div className="w-full max-w-xl relative z-10">
          {/* Progress Indicator */}
          {step <= 4 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4].map((s) => (
                    <div key={s} className="flex items-center gap-1.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                          step > s
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : step === s
                            ? "bg-orange-600 border-orange-600 text-white shadow-md shadow-orange-500/30"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                        }`}
                      >
                        {step > s ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s}
                      </div>
                      {s < 4 && (
                        <div className="h-0.5 w-8 sm:w-16 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-500 transition-all duration-300"
                            style={{ width: step > s ? "100%" : "0%" }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setViewMode("tour")}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400 transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" /> Worker Guide
                </button>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 px-0.5">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {step === 1 && "Step 1: Trade Title & Worker Avatar"}
                  {step === 2 && "Step 2: Service Location & Travel Radius"}
                  {step === 3 && "Step 3: Skills & Hourly Rate (NPR)"}
                  {step === 4 && "Step 4: Live Worker Card Preview"}
                </span>
                <span>{step} of 4</span>
              </div>
            </div>
          )}

          {/* Wizard Card Container */}
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl shadow-orange-500/5 overflow-hidden">
            <AnimatePresence mode="wait" custom={dir}>
              {/* ── STEP 1: Trade & Avatar ── */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  custom={dir}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="p-6 sm:p-8"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                      Your Worker Profile
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Choose your avatar and trade headline so recruiters hire you faster.
                    </p>
                  </div>

                  <div className="space-y-5">
                    {/* Avatar Picker */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                        Select an Avatar Preset
                      </label>
                      <div className="grid grid-cols-6 gap-2">
                        {WORKER_AVATARS.map((avatar, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setProfilePhotoUrl(avatar);
                              setCustomPhotoMode(false);
                            }}
                            className={`relative rounded-2xl overflow-hidden aspect-square border-2 transition-all p-0.5 cursor-pointer ${
                              profilePhotoUrl === avatar && !customPhotoMode
                                ? "border-orange-600 ring-2 ring-orange-500/30 scale-105"
                                : "border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100"
                            }`}
                          >
                            <img
                              src={avatar}
                              alt={`Preset ${idx + 1}`}
                              className="w-full h-full object-cover rounded-xl"
                            />
                            {profilePhotoUrl === avatar && !customPhotoMode && (
                              <div className="absolute top-1 right-1 w-4 h-4 bg-orange-600 rounded-full flex items-center justify-center text-white text-[10px]">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => setCustomPhotoMode(!customPhotoMode)}
                          className="text-orange-600 dark:text-orange-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          {customPhotoMode ? "Hide custom photo input" : "Or use custom image URL"}
                        </button>
                      </div>

                      {customPhotoMode && (
                        <div className="mt-2">
                          <input
                            type="url"
                            value={profilePhotoUrl}
                            onChange={(e) => setProfilePhotoUrl(e.target.value)}
                            placeholder="https://example.com/worker-photo.jpg"
                            className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 dark:text-white"
                          />
                        </div>
                      )}
                    </div>

                    {/* Name & Trade Title */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="e.g. Bikash Thapa"
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Professional Title / Trade
                        </label>
                        <input
                          type="text"
                          value={tradeTitle}
                          onChange={(e) => setTradeTitle(e.target.value)}
                          placeholder="e.g. Master Electrician"
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Experience Level */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Years of Experience
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {["< 1 year", "1-3 years", "3-5 years", "5+ years"].map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setExperienceLevel(lvl)}
                            className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                              experienceLevel === lvl
                                ? "bg-orange-50 dark:bg-orange-950/60 border-orange-500 text-orange-700 dark:text-orange-300"
                                : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300"
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Short Bio */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Worker Bio / Summary
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={2}
                        maxLength={220}
                        placeholder="e.g. Specializing in domestic wiring, DB box setup, and fault repairs across Kathmandu Valley."
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 dark:text-white placeholder:text-slate-400 resize-none"
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={goNext}
                    className="mt-6 w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
                  >
                    Next: Location & Travel Radius <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              )}

              {/* ── STEP 2: Service Location & Travel Radius ── */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  custom={dir}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="p-6 sm:p-8"
                >
                  <div className="text-center mb-5">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                      Where Do You Work?
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Set your base location and how far you can travel for gigs.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Base District
                        </label>
                        <select
                          value={selectedDistrict}
                          onChange={(e) => {
                            setSelectedDistrict(e.target.value);
                            if (!address) setAddress(e.target.value);
                          }}
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 dark:text-white"
                        >
                          {NEPAL_DISTRICTS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          One-Tap GPS
                        </label>
                        <button
                          type="button"
                          onClick={handleUseCurrentLocation}
                          disabled={isLocating}
                          className="w-full py-2.5 px-3 rounded-xl border border-orange-200 dark:border-orange-800/60 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 hover:bg-orange-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isLocating ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Locating...
                            </>
                          ) : (
                            <>
                              <Compass className="w-3.5 h-3.5 text-orange-500" /> Pin My Current GPS
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Travel Radius Chips */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        <span className="flex items-center gap-1">
                          <Navigation className="w-3.5 h-3.5 text-orange-500" /> Maximum Travel Radius
                        </span>
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {["Within 5 km", "Within 10 km", "Within 25 km", "Anywhere"].map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setTravelRadius(r)}
                            className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                              travelRadius === r
                                ? "bg-orange-50 dark:bg-orange-950/60 border-orange-500 text-orange-700 dark:text-orange-300"
                                : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300"
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Area Address Input */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Area / Landmark / Neighborhood
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g. Tinkune, near Koteshwor Chowk"
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Embedded MapPicker */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-orange-500" /> Pin exact workshop or home base
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                        </span>
                      </div>
                      <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner">
                        <MapPicker
                          lat={coords.lat}
                          lng={coords.lng}
                          onChange={handleMapChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={goPrev}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="button"
                      onClick={goNext}
                      className="flex-1 py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      Next: Skills & Rates <ArrowRight className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 3: Skills & Hourly Rate ── */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  custom={dir}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="p-6 sm:p-8"
                >
                  <div className="text-center mb-5">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                      Your Skills & Hourly Pay
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Choose all the services you offer. Clients search by these skills.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Skills Checklist */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Select Trade Skills
                        </label>
                        <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                          {selectedSkills.length} selected
                        </span>
                      </div>

                      <div className="max-h-52 overflow-y-auto pr-1 space-y-3 scrollbar-thin border border-slate-100 dark:border-slate-800 p-2.5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30">
                        {SKILL_CATEGORIES.map((cat) => (
                          <div key={cat.group}>
                            <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                              {cat.group}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {cat.skills.map((skill) => {
                                const isSelected = selectedSkills.includes(skill);
                                return (
                                  <button
                                    key={skill}
                                    type="button"
                                    onClick={() => toggleSkill(skill)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                      isSelected
                                        ? "bg-orange-600 border-orange-600 text-white shadow-sm shadow-orange-500/30"
                                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-orange-400"
                                    }`}
                                  >
                                    {isSelected && (
                                      <Check className="w-3 h-3 inline mr-1 stroke-[3]" />
                                    )}
                                    {skill}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Hourly Rate */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Target Hourly Rate (NPR)
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm font-bold text-slate-400 pointer-events-none">
                          Rs.
                        </span>
                        <input
                          type="number"
                          value={hourlyRate}
                          onChange={(e) => setHourlyRate(e.target.value)}
                          placeholder="500"
                          className="w-full pl-11 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 dark:text-white"
                        />
                      </div>

                      {/* Quick Presets */}
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[11px] text-slate-400">Presets:</span>
                        {["350", "500", "800", "1200"].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setHourlyRate(amt)}
                            className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-orange-100 hover:text-orange-600 cursor-pointer"
                          >
                            Rs. {amt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Availability */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Working Availability
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {["Available Now", "Part-Time", "Weekends Only", "Emergency Call"].map(
                          (status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => setAvailability(status)}
                              className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                availability === status
                                  ? "bg-orange-50 dark:bg-orange-950/60 border-orange-500 text-orange-700 dark:text-orange-300"
                                  : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300"
                              }`}
                            >
                              {status}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={goPrev}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="button"
                      onClick={goNext}
                      className="flex-1 py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      Preview Worker Card <ArrowRight className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 4: Live Worker Card Preview ── */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  custom={dir}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="p-6 sm:p-8"
                >
                  <div className="text-center mb-5">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 text-xs font-bold mb-2">
                      <Eye className="w-3.5 h-3.5" /> Public Worker Card Preview
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                      Ready to Receive Direct Gigs!
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      This is how recruiters will see your card when browsing workers in Nepal.
                    </p>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  {/* Worker Card Live Mock */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-white to-orange-50/30 dark:from-slate-800 dark:to-slate-850 border-2 border-orange-500/30 shadow-xl space-y-3.5">
                    <div className="flex items-start gap-3.5">
                      <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-orange-500 flex-shrink-0 shadow-md">
                        <img
                          src={profilePhotoUrl}
                          alt="Worker Preview"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                            {displayName}
                          </h3>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300">
                            {availability}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                          {tradeTitle} • {experienceLevel}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-orange-500" />
                            {address || selectedDistrict}
                          </span>
                          <span>•</span>
                          <span className="text-slate-400">{travelRadius}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                            <Star className="w-3 h-3 fill-amber-500" /> New (5.0)
                          </span>
                        </div>
                      </div>
                    </div>

                    {hourlyRate && (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-orange-50/70 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-900/40">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Standard Hourly Wage:
                        </span>
                        <span className="text-sm font-black text-orange-600 dark:text-orange-400">
                          Rs. {hourlyRate} <span className="text-xs font-normal text-slate-400">/ hour</span>
                        </span>
                      </div>
                    )}

                    {selectedSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {selectedSkills.map((s) => (
                          <span
                            key={s}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={goPrev}
                      disabled={isSubmitting}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Adjust
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-1 py-3 px-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Saving Worker Profile...
                        </>
                      ) : (
                        <>
                          Confirm & Launch Worker Profile <CheckCircle2 className="w-4 h-4" />
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 5: Worker Celebration ── */}
              {step === 5 && (
                <motion.div
                  key="step5"
                  custom={dir}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="p-6 sm:p-10 text-center"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 280, damping: 16, delay: 0.1 }}
                    className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-orange-100 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800/60 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-xl shadow-orange-500/20"
                  >
                    <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                  </motion.div>

                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    Congratulations, {displayName.split(" ")[0]}!
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                    Your worker profile is active in{" "}
                    <span className="font-bold text-orange-600 dark:text-orange-400">
                      {address || selectedDistrict}
                    </span>
                    . Recruiters searching within {travelRadius.toLowerCase()} can now view and contact you.
                  </p>

                  <div className="mt-8 flex flex-col gap-2.5">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => router.push("/jobs")}
                      className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Browse Nearby Gigs Now <ArrowRight className="w-4 h-4" />
                    </motion.button>

                    <button
                      type="button"
                      onClick={() => router.push("/dashboard")}
                      className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Go to Worker Dashboard
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Skip link */}
          {step <= 4 && (
            <p className="text-center mt-4 text-xs text-slate-400 dark:text-slate-500">
              <button
                type="button"
                onClick={() => router.push("/dashboard?skipOnboarding=true")}
                className="hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2 transition-colors cursor-pointer"
              >
                Skip for now — I&apos;ll complete my profile details later
              </button>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
