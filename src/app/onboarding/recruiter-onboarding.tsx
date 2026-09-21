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
  Building2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { completeRecruiterOnboarding } from "@/app/actions/profile";
import { NEPAL_DISTRICTS } from "@/lib/constants";

// Dynamically import MapPicker with SSR disabled
const MapPicker = dynamic(() => import("@/components/map-picker"), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading interactive map...
    </div>
  ),
});

interface RecruiterInitialData {
  bio?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  profilePhotoUrl?: string;
  businessName?: string;
}

interface RecruiterOnboardingProps {
  name: string;
  email: string;
  initialData?: RecruiterInitialData;
}

const RECRUITER_LOGOS = [
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1556155092-490a1ba16284?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150&auto=format&fit=crop&q=80",
];

const RECRUITER_TOUR_SLIDES = [
  {
    id: "hire",
    badge: "For Employers & Hirers in Nepal",
    badgeIcon: Sparkles,
    title: "Hire Verified Local Talent",
    highlight: "In Minutes, Not Days",
    description:
      "Stop depending on slow referrals. KamGhar connects your business or home directly with skilled tradespeople, helpers, and digital specialists nearby.",
    highlightBox: {
      tag: "AVAILABLE TALENT NEARBY",
      items: [
        { label: "Licensed Electricians & Technicians", status: "Active Now" },
        { label: "Plumbers & Pipe Mechanics", status: "Active Now" },
        { label: "Carpenters, Painters & Laborers", status: "Active Now" },
      ],
    },
  },
  {
    id: "proximity",
    badge: "Hyperlocal Map Discovery",
    badgeIcon: Compass,
    title: "Discover Nearby Workers",
    highlight: "Mapped in Real-Time",
    description:
      "Filter talent by distance from your worksite or residence. View who is ready to take your job immediately without long transit delays.",
    highlightBox: {
      tag: "SPEED & CONVENIENCE",
      items: [
        { label: "Radius matching around your site", status: "Precision Pin" },
        { label: "Direct contact with nearby workers", status: "Instant Call" },
        { label: "Review portfolio & previous ratings", status: "Verified Reviews" },
      ],
    },
  },
  {
    id: "direct",
    badge: "Zero Hidden Fees",
    badgeIcon: ShieldCheck,
    title: "Direct Pricing & Settle",
    highlight: "Transparent & Flexible",
    description:
      "Negotiate upfront with no platform surcharges. Settle wages directly with workers using cash, eSewa, or Khalti upon satisfactory completion.",
    highlightBox: {
      tag: "RECRUITER ADVANTAGES",
      items: [
        { label: "Post unlimited short-term & emergency jobs", status: "Free" },
        { label: "Direct phone, WhatsApp & chat", status: "Direct" },
        { label: "Boost urgent listings anytime", status: "Boost Option" },
      ],
    },
  },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -50 : 50, opacity: 0 }),
};

export default function RecruiterOnboarding({
  name: initialName,
  initialData,
}: RecruiterOnboardingProps) {
  const router = useRouter();

  // Mode: "tour" or "wizard"
  const [viewMode, setViewMode] = useState<"tour" | "wizard">("tour");
  const [tourSlideIndex, setTourSlideIndex] = useState(0);
  const [tourDir, setTourDir] = useState(1);

  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Recruiter Identity
  const [businessName, setBusinessName] = useState(
    initialData?.businessName || `${initialName.split(" ")[0]}'s Projects`
  );
  const [recruiterType, setRecruiterType] = useState("Homeowner / Individual");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(
    initialData?.profilePhotoUrl || RECRUITER_LOGOS[0]
  );
  const [customPhotoMode, setCustomPhotoMode] = useState(false);
  const [bio, setBio] = useState(initialData?.bio || "");

  // Step 2: Worksite / Office Location
  const [selectedDistrict, setSelectedDistrict] = useState(
    initialData?.address?.split(",")[0] || "Kathmandu"
  );
  const [address, setAddress] = useState(initialData?.address || "");
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initialData?.latitude ?? 27.7172,
    lng: initialData?.longitude ?? 85.324,
  });
  const [isLocating, setIsLocating] = useState(false);

  // Step 3: Hiring Preferences & Needs
  const [selectedTrades, setSelectedTrades] = useState<string[]>([
    "Home Repairs",
    "Electrical",
    "Plumbing",
  ]);
  const [hiringUrgency, setHiringUrgency] = useState("Immediate Tasks");
  const [paymentPreference, setPaymentPreference] = useState("Cash on Completion");

  const goNext = () => {
    setDir(1);
    setStep((s) => s + 1);
  };
  const goPrev = () => {
    setDir(-1);
    setStep((s) => s - 1);
  };

  const toggleTrade = (trade: string) => {
    setSelectedTrades((prev) =>
      prev.includes(trade) ? prev.filter((t) => t !== trade) : [...prev, trade]
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
          // preserve coordinates
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
      const combinedBio = `${recruiterType}. Looking for: ${selectedTrades.join(", ")}. ${bio}`.trim();

      const result = await completeRecruiterOnboarding({
        businessName: businessName || initialName,
        address: finalAddress,
        latitude: coords.lat,
        longitude: coords.lng,
        profilePhotoUrl,
        bio: combinedBio,
      });

      if (!result.success) {
        setError(result.error ?? "Failed to save recruiter profile.");
        setIsSubmitting(false);
        return;
      }

      setStep(5); // Show celebration step
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentTourSlide = RECRUITER_TOUR_SLIDES[tourSlideIndex];
  const isLastTourSlide = tourSlideIndex === RECRUITER_TOUR_SLIDES.length - 1;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center px-4 py-8 sm:py-12 transition-colors duration-200">
      {/* Background Ambience */}
      <div className="pointer-events-none fixed -top-40 -right-40 w-[550px] h-[550px] bg-orange-200/35 dark:bg-orange-600/10 rounded-full blur-3xl" />
      <div className="pointer-events-none fixed -bottom-40 -left-40 w-[550px] h-[550px] bg-amber-200/30 dark:bg-amber-600/10 rounded-full blur-3xl" />

      {/* ── PHASE 1: RECRUITER TOUR ── */}
      {viewMode === "tour" ? (
        <div className="w-full max-w-2xl relative z-10">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl shadow-orange-500/5 overflow-hidden">
            {/* Top Bar */}
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
                  <Building2 className="w-3 h-3 text-orange-500" /> Recruiter Welcome
                </span>
              </div>

              <button
                type="button"
                onClick={() => setViewMode("wizard")}
                className="text-xs font-bold text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Skip to Setup →
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
                        ? `Welcome ${initialName.split(" ")[0]}! • ${currentTourSlide.badge}`
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
                            {it.status}
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
                  {RECRUITER_TOUR_SLIDES.map((s, idx) => (
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
                        Set Up Hiring Profile <ArrowRight className="w-4 h-4" />
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
        /* ── PHASE 2: RECRUITER SETUP WIZARD ── */
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
                  <HelpCircle className="w-3.5 h-3.5" /> Recruiter Guide
                </button>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 px-0.5">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {step === 1 && "Step 1: Business / Household Identity"}
                  {step === 2 && "Step 2: Job Site & Office Location"}
                  {step === 3 && "Step 3: Hiring Needs & Payment Mode"}
                  {step === 4 && "Step 4: Live Recruiter Card Preview"}
                </span>
                <span>{step} of 4</span>
              </div>
            </div>
          )}

          {/* Card Container */}
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl shadow-orange-500/5 overflow-hidden">
            <AnimatePresence mode="wait" custom={dir}>
              {/* ── STEP 1: Business / Household Identity ── */}
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
                      Who Are You Hiring As?
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Set up your profile name, type, and logo to attract reputable workers.
                    </p>
                  </div>

                  <div className="space-y-5">
                    {/* Logo/Avatar Picker */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                        Select a Profile / Company Icon
                      </label>
                      <div className="grid grid-cols-6 gap-2">
                        {RECRUITER_LOGOS.map((avatar, idx) => (
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
                              alt={`Logo ${idx + 1}`}
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
                          {customPhotoMode ? "Hide custom logo URL" : "Or use custom logo URL"}
                        </button>
                      </div>

                      {customPhotoMode && (
                        <div className="mt-2">
                          <input
                            type="url"
                            value={profilePhotoUrl}
                            onChange={(e) => setProfilePhotoUrl(e.target.value)}
                            placeholder="https://example.com/company-logo.png"
                            className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 dark:text-white"
                          />
                        </div>
                      )}
                    </div>

                    {/* Business/Household Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Company, Project or Household Name
                      </label>
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Apex Renovations or Sharma Residence"
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Recruiter Type */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Account Category
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          "Homeowner / Individual",
                          "Small Business / Shop",
                          "General Contractor",
                          "Corporate / Enterprise",
                        ].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setRecruiterType(t)}
                            className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all text-left cursor-pointer ${
                              recruiterType === t
                                ? "bg-orange-50 dark:bg-orange-950/60 border-orange-500 text-orange-700 dark:text-orange-300"
                                : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bio / Description */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        About Your Organization / Needs
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={2}
                        maxLength={220}
                        placeholder="e.g. Regular home maintenance and emergency electrical/plumbing tasks in Patan."
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
                    Next: Job Site & Office Location <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              )}

              {/* ── STEP 2: Job Site / Office Location ── */}
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
                      Where Are You Hiring?
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Pin the location of your site, home, or office where workers report.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Primary District
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
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Locating GPS...
                            </>
                          ) : (
                            <>
                              <Compass className="w-3.5 h-3.5 text-orange-500" /> Pin Current Location
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Street or Area Address */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Area / Landmark / Street
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g. Pulchowk, near Labim Mall"
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Embedded MapPicker */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-orange-500" /> Pin exact job site or office on map
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
                      Next: Hiring Preferences <ArrowRight className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 3: Hiring Preferences & Needs ── */}
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
                      Hiring Preferences
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Specify the work you regularly need so we can surface matching workers.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Common Trades Needed */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                        Common Trades You Hire
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          "Home Repairs",
                          "Electrical",
                          "Plumbing",
                          "Carpentry",
                          "Painting & Masonry",
                          "Cleaning & Maid",
                          "Moving & Loading",
                          "Tech & Digital",
                        ].map((trade) => {
                          const isSelected = selectedTrades.includes(trade);
                          return (
                            <button
                              key={trade}
                              type="button"
                              onClick={() => toggleTrade(trade)}
                              className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? "bg-orange-50 dark:bg-orange-950/60 border-orange-500 text-orange-700 dark:text-orange-300 shadow-sm"
                                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                              }`}
                            >
                              <span>{trade}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 stroke-[3]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Hiring Frequency */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Typical Hiring Urgency
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {["Immediate Tasks", "Scheduled Maintenance", "Long-Term Projects"].map(
                          (urg) => (
                            <button
                              key={urg}
                              type="button"
                              onClick={() => setHiringUrgency(urg)}
                              className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                hiringUrgency === urg
                                  ? "bg-orange-50 dark:bg-orange-950/60 border-orange-500 text-orange-700 dark:text-orange-300"
                                  : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300"
                              }`}
                            >
                              {urg}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Preferred Payment Method */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Preferred Settlement Method
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {["Cash on Completion", "eSewa / Khalti", "Bank Transfer"].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setPaymentPreference(m)}
                            className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                              paymentPreference === m
                                ? "bg-orange-50 dark:bg-orange-950/60 border-orange-500 text-orange-700 dark:text-orange-300"
                                : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300"
                              }`}
                          >
                            {m}
                          </button>
                        ))}
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
                      Preview Recruiter Card <ArrowRight className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 4: Live Recruiter Card Preview ── */}
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
                      <Eye className="w-3.5 h-3.5" /> Public Recruiter Card Preview
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                      Your Hiring Profile Is Ready!
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Workers will see this card when viewing your job posts and contact requests.
                    </p>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  {/* Recruiter Card Live Mock */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-white to-orange-50/30 dark:from-slate-800 dark:to-slate-850 border-2 border-orange-500/30 shadow-xl space-y-3.5">
                    <div className="flex items-start gap-3.5">
                      <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-orange-500 flex-shrink-0 shadow-md">
                        <img
                          src={profilePhotoUrl}
                          alt="Recruiter Preview"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                            {businessName}
                          </h3>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300">
                            Recruiter
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                          {recruiterType}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-orange-500" />
                            {address || selectedDistrict}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                            <Star className="w-3 h-3 fill-amber-500" /> Verified Hirer
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-xl bg-slate-100/70 dark:bg-slate-750/70 border border-slate-200/50 dark:border-slate-700/50">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Frequency</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{hiringUrgency}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-100/70 dark:bg-slate-750/70 border border-slate-200/50 dark:border-slate-700/50">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Payout Mode</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{paymentPreference}</span>
                      </div>
                    </div>

                    {selectedTrades.length > 0 && (
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 block mb-1">Frequently Hiring:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedTrades.map((t) => (
                            <span
                              key={t}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
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
                          <Loader2 className="w-4 h-4 animate-spin" /> Saving Recruiter Profile...
                        </>
                      ) : (
                        <>
                          Confirm & Activate Recruiter Account <CheckCircle2 className="w-4 h-4" />
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 5: Recruiter Celebration ── */}
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
                    <Building2 className="w-10 h-10 stroke-[2.5]" />
                  </motion.div>

                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    Hiring Profile Live, {initialName.split(" ")[0]}!
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                    Your recruiter profile is now registered for{" "}
                    <span className="font-bold text-orange-600 dark:text-orange-400">
                      {businessName}
                    </span>{" "}
                    in {address || selectedDistrict}. You can now post jobs and reach verified workers instantly.
                  </p>

                  <div className="mt-8 flex flex-col gap-2.5">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => router.push("/jobs/new")}
                      className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Post Your First Job Post <ArrowRight className="w-4 h-4" />
                    </motion.button>

                    <button
                      type="button"
                      onClick={() => router.push("/workers")}
                      className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Browse Nearby Workers
                    </button>

                    <button
                      type="button"
                      onClick={() => router.push("/dashboard")}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 py-1 transition-colors cursor-pointer"
                    >
                      Go to Recruiter Dashboard
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
