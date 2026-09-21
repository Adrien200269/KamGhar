/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
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
  Building,
  Check,
} from "lucide-react";
import {
  completeWorkerOnboarding,
  completeRecruiterOnboarding,
} from "@/app/actions/profile";
import { NEPAL_DISTRICTS, SKILL_CATEGORIES } from "@/lib/constants";
import OnboardingTour from "./onboarding-tour";

// Dynamically import MapPicker with SSR disabled
const MapPicker = dynamic(() => import("@/components/map-picker"), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading interactive map...
    </div>
  ),
});

type Role = "WORKER" | "RECRUITER" | "ADMIN";

interface InitialData {
  bio?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  profilePhotoUrl?: string;
  skills?: string[];
  hourlyRate?: string;
  businessName?: string;
}

interface Props {
  role: Role;
  name: string;
  email: string;
  initialData?: InitialData;
}

const TOTAL_WIZARD_STEPS = 4;

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -50 : 50, opacity: 0 }),
};

export default function OnboardingWizard({
  role,
  name: initialName,
  initialData,
}: Props) {
  const router = useRouter();

  // Mode: "tour" (visual onboarding slides) or "wizard" (setup steps)
  const [viewMode, setViewMode] = useState<"tour" | "wizard">("tour");
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile data
  const [displayName, setDisplayName] = useState(initialName);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(
    initialData?.profilePhotoUrl || AVATAR_PRESETS[0]
  );
  const [customPhotoMode, setCustomPhotoMode] = useState(false);
  const [bio, setBio] = useState(initialData?.bio || "");
  const [selectedDistrict, setSelectedDistrict] = useState(
    initialData?.address?.split(",")[0] || "Kathmandu"
  );
  const [address, setAddress] = useState(initialData?.address || "");

  // Coordinates
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initialData?.latitude ?? 27.7172,
    lng: initialData?.longitude ?? 85.324,
  });
  const [isLocating, setIsLocating] = useState(false);

  // Worker specific
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    initialData?.skills || []
  );
  const [hourlyRate, setHourlyRate] = useState(initialData?.hourlyRate || "");
  const [availability, setAvailability] = useState<string>("Available Now");

  // Recruiter specific
  const [businessName, setBusinessName] = useState(
    initialData?.businessName || ""
  );
  const [hiringUrgency, setHiringUrgency] = useState<string>("Immediate");

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
        setError("Could not retrieve your location. Please pin it on the map.");
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
      let result;
      const finalAddress = address || selectedDistrict;

      if (role === "WORKER") {
        result = await completeWorkerOnboarding({
          bio,
          skills: selectedSkills,
          hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
          address: finalAddress,
          latitude: coords.lat,
          longitude: coords.lng,
          profilePhotoUrl,
        });
      } else {
        result = await completeRecruiterOnboarding({
          bio,
          businessName: businessName || displayName,
          address: finalAddress,
          latitude: coords.lat,
          longitude: coords.lng,
          profilePhotoUrl,
        });
      }

      if (!result.success) {
        setError(result.error ?? "Something went wrong. Please try again.");
        setIsSubmitting(false);
        return;
      }

      setStep(5); // Show success step
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center px-4 py-8 sm:py-12 transition-colors duration-200">
      {/* Background ambient decorative shapes */}
      <div className="pointer-events-none fixed -top-40 -right-40 w-[550px] h-[550px] bg-orange-200/30 dark:bg-orange-600/10 rounded-full blur-3xl" />
      <div className="pointer-events-none fixed -bottom-40 -left-40 w-[550px] h-[550px] bg-blue-200/30 dark:bg-blue-600/10 rounded-full blur-3xl" />

      {/* PHASE 1: TOUR WALKTHROUGH */}
      {viewMode === "tour" ? (
        <div className="w-full max-w-2xl relative z-10">
          <OnboardingTour
            role={role}
            userName={displayName}
            onFinishTour={() => setViewMode("wizard")}
          />
        </div>
      ) : (
        /* PHASE 2: UPGRADED PROFILE SETUP WIZARD */
        <div className="w-full max-w-xl relative z-10">
          {/* Top Progress Bar and Tour Toggle */}
          {step <= TOTAL_WIZARD_STEPS && (
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
                  <HelpCircle className="w-3.5 h-3.5" /> Revisit Tour
                </button>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 px-0.5">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {step === 1 && "Step 1: Identity & Avatar"}
                  {step === 2 && "Step 2: Location & GPS"}
                  {step === 3 &&
                    (role === "WORKER"
                      ? "Step 3: Skills & Pricing"
                      : "Step 3: Business Information")}
                  {step === 4 && "Step 4: Live Card Preview"}
                </span>
                <span>
                  {step} of {TOTAL_WIZARD_STEPS}
                </span>
              </div>
            </div>
          )}

          {/* Wizard Card Container */}
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl shadow-slate-200/40 dark:shadow-black/50 overflow-hidden">
            <AnimatePresence mode="wait" custom={dir}>
              {/* ── STEP 1 ── Avatar, Name & Bio */}
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
                      Profile & Appearance
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Choose an avatar or photo so people recognize you across Nepal.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Avatar Selection */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                        Select an Avatar Preset
                      </label>
                      <div className="grid grid-cols-6 gap-2">
                        {AVATAR_PRESETS.map((avatar, idx) => (
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

                      <div className="mt-3 flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => setCustomPhotoMode(!customPhotoMode)}
                          className="text-orange-600 dark:text-orange-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          {customPhotoMode ? "Hide custom URL input" : "Or use custom image URL"}
                        </button>
                      </div>

                      {customPhotoMode && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-2"
                        >
                          <input
                            type="url"
                            value={profilePhotoUrl}
                            onChange={(e) => setProfilePhotoUrl(e.target.value)}
                            placeholder="https://example.com/my-photo.jpg"
                            className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 dark:text-white"
                          />
                        </motion.div>
                      )}
                    </div>

                    {/* Display Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Full Name / Display Name
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. Bikash Sharma"
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Short Bio */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Tagline / Bio <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={3}
                        maxLength={250}
                        placeholder={
                          role === "WORKER"
                            ? "e.g. Certified residential electrician with 5+ years experience in Kathmandu. Fast service & guaranteed satisfaction."
                            : "e.g. Local business hiring skilled artisans and technicians for commercial and home projects."
                        }
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 resize-none"
                      />
                      <p className="text-[11px] text-slate-400 text-right mt-1">
                        {bio.length}/250 characters
                      </p>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={goNext}
                    className="mt-6 w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
                  >
                    Next: Location & GPS <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              )}

              {/* ── STEP 2 ── Location & Map Pinning */}
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
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                      Pin Your Location
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      KamGhar matches by proximity. Pin where you work or hire.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* District & GPS button */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          District
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
                          Quick GPS
                        </label>
                        <button
                          type="button"
                          onClick={handleUseCurrentLocation}
                          disabled={isLocating}
                          className="w-full py-2.5 px-3 rounded-xl border border-orange-200 dark:border-orange-800/60 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 hover:bg-orange-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isLocating ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Detecting GPS...
                            </>
                          ) : (
                            <>
                              <Compass className="w-3.5 h-3.5 text-orange-500" />
                              Locate My Position
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Street or Area Address */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Area / Landmark / Address
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g. New Baneshwor, near Minbhawan"
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Embedded MapPicker */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-orange-500" /> Click or drag pin on map
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
                      Continue <ArrowRight className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 3 ── Role Details */}
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
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                      {role === "WORKER" ? "Skills & Hourly Rate" : "Business Information"}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {role === "WORKER"
                        ? "Select your core skills so clients can find and hire you directly."
                        : "Tell workers about your business or hiring requirements."}
                    </p>
                  </div>

                  {role === "WORKER" ? (
                    <div className="space-y-5">
                      {/* Skills Selection */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Select Skills You Provide
                          </label>
                          <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                            {selectedSkills.length} selected
                          </span>
                        </div>

                        <div className="max-h-56 overflow-y-auto pr-1 space-y-3 scrollbar-thin border border-slate-100 dark:border-slate-800 p-2.5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30">
                          {SKILL_CATEGORIES.map((cat) => (
                            <div key={cat.group}>
                              <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
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
                          Hourly Rate (NPR) <span className="text-slate-400 font-normal">— optional</span>
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm font-bold text-slate-400 pointer-events-none">
                            Rs.
                          </span>
                          <input
                            type="number"
                            value={hourlyRate}
                            onChange={(e) => setHourlyRate(e.target.value)}
                            placeholder="e.g. 500"
                            className="w-full pl-11 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 dark:text-white"
                          />
                        </div>

                        {/* Quick Presets */}
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="text-[11px] text-slate-400">Quick set:</span>
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

                      {/* Availability status */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Work Availability
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {["Available Now", "Part-Time", "Weekends Only"].map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => setAvailability(status)}
                              className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                availability === status
                                  ? "bg-orange-50 dark:bg-orange-950/50 border-orange-500 text-orange-700 dark:text-orange-300"
                                  : "border-slate-200 dark:border-slate-700 text-slate-500"
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* Recruiter Business Name */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Business / Organization Name
                        </label>
                        <div className="relative">
                          <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            placeholder="e.g. Kathmandu Engineering & Design"
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      {/* Hiring Urgency */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Hiring Frequency
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {["Immediate Gig", "Ongoing Work", "One-off Task"].map((urgency) => (
                            <button
                              key={urgency}
                              type="button"
                              onClick={() => setHiringUrgency(urgency)}
                              className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                hiringUrgency === urgency
                                  ? "bg-orange-50 dark:bg-orange-950/50 border-orange-500 text-orange-700 dark:text-orange-300"
                                  : "border-slate-200 dark:border-slate-700 text-slate-500"
                              }`}
                            >
                              {urgency}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

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
                      Preview Profile Card <ArrowRight className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 4 ── Live Profile Card Preview */}
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
                      <Eye className="w-3.5 h-3.5" /> Live Public Preview
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                      Here Is How You Look to Others
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      This card will be displayed on the interactive map and search listings.
                    </p>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  {/* Mock Card Preview */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-850 border-2 border-orange-500/30 shadow-xl space-y-4">
                    <div className="flex items-start gap-3.5">
                      <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-orange-500 flex-shrink-0 shadow-md">
                        <img
                          src={profilePhotoUrl || AVATAR_PRESETS[0]}
                          alt="Profile Preview"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                            {role === "WORKER" ? displayName : businessName || displayName}
                          </h3>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300">
                            {role === "WORKER" ? "Worker" : "Recruiter"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-bold">
                            <MapPin className="w-3 h-3" />
                            {address || selectedDistrict}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                            <Star className="w-3 h-3 fill-amber-500" /> New (5.0)
                          </span>
                        </div>

                        {role === "WORKER" && hourlyRate && (
                          <p className="text-xs font-black text-slate-900 dark:text-white mt-1">
                            Rs. {hourlyRate} <span className="font-normal text-slate-400">/ hr</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {bio && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 italic bg-slate-100/70 dark:bg-slate-900/60 p-2 rounded-xl">
                        &quot;{bio}&quot;
                      </p>
                    )}

                    {role === "WORKER" && selectedSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {selectedSkills.slice(0, 5).map((s) => (
                          <span
                            key={s}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-100/80 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300"
                          >
                            {s}
                          </span>
                        ))}
                        {selectedSkills.length > 5 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500">
                            +{selectedSkills.length - 5} more
                          </span>
                        )}
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
                          <Loader2 className="w-4 h-4 animate-spin" /> Saving Profile...
                        </>
                      ) : (
                        <>
                          Confirm & Complete Profile <CheckCircle2 className="w-4 h-4" />
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 5 ── Celebration & Done */}
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
                    You&apos;re Officially Live, {displayName.split(" ")[0]}!
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                    Your KamGhar profile has been pinned in{" "}
                    <span className="font-bold text-orange-600 dark:text-orange-400">
                      {address || selectedDistrict}
                    </span>
                    . You can now discover nearby matches with real-time proximity.
                  </p>

                  <div className="mt-8 flex flex-col gap-2.5">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => router.push("/dashboard")}
                      className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Go to Dashboard <ArrowRight className="w-4 h-4" />
                    </motion.button>

                    <button
                      type="button"
                      onClick={() =>
                        router.push(role === "WORKER" ? "/jobs" : "/workers")
                      }
                      className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
                    >
                      {role === "WORKER" ? "Explore Nearby Jobs" : "Find Nearby Workers"}
                    </button>

                    <button
                      type="button"
                      onClick={() => router.push("/")}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 py-1 transition-colors cursor-pointer"
                    >
                      Back to Homepage
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Skip link on steps 1-4 */}
          {step <= TOTAL_WIZARD_STEPS && (
            <p className="text-center mt-4 text-xs text-slate-400 dark:text-slate-500">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
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