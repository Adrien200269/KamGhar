"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Sparkles,
  AlertCircle,
  Loader2,
  ArrowRight,
  Navigation,
  Zap,
  Wrench,
  Paintbrush,
  Briefcase,
  BookOpen,
  Laptop,
  Truck,
  CheckCircle2,
} from "lucide-react";
import { createJob } from "@/app/actions/job";
import { NEPAL_DISTRICTS, getDistrictCoordinates } from "@/lib/constants";

const CATEGORIES = [
  { name: "Electrician", icon: Zap },
  { name: "Plumbing", icon: Wrench },
  { name: "Painting & Masonry", icon: Paintbrush },
  { name: "Carpentry", icon: Briefcase },
  { name: "Home Cleaning", icon: Sparkles },
  { name: "Appliance Repair", icon: Wrench },
  { name: "Tutoring & Classes", icon: BookOpen },
  { name: "Delivery & Moving", icon: Truck },
  { name: "Digital & Design", icon: Laptop },
  { name: "Other Services", icon: Briefcase },
];

const BUDGET_PRESETS = [500, 1000, 2000, 5000];

export default function JobPostForm({ defaultDistrict }: { defaultDistrict?: string }) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [district, setDistrict] = useState(defaultDistrict || "Kathmandu");
  const [specificAddress, setSpecificAddress] = useState("");
  const [budget, setBudget] = useState("");
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [description, setDescription] = useState("");

  const [coords, setCoords] = useState<{ lat: number; lng: number }>(
    getDistrictCoordinates(defaultDistrict || "Kathmandu")
  );
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDistrictChange = (d: string) => {
    setDistrict(d);
    setCoords(getDistrictCoordinates(d));
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setDetectingLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        setDetectingLocation(false);
        setLocationSuccess(true);
        setTimeout(() => setLocationSuccess(false), 3000);
      },
      () => {
        setDetectingLocation(false);
        setError("Unable to retrieve your location. You can select your district manually.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const fullAddress = specificAddress.trim()
      ? `${specificAddress.trim()}, ${district}`
      : `${district}, Nepal`;

    if (title.trim().length < 5) {
      setError("Please provide a descriptive job title (at least 5 characters).");
      return;
    }

    if (description.trim().length < 20) {
      setError("Please provide more details in the description (at least 20 characters).");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await createJob({
        title: title.trim(),
        description: description.trim(),
        category,
        budget: isNegotiable || !budget ? null : parseFloat(budget),
        latitude: coords.lat,
        longitude: coords.lng,
        address: fullAddress,
      });

      if (!response.success) {
        setError(response.error ?? "Failed to post job. Please check all fields.");
        setIsSubmitting(false);
      } else {
        router.push("/dashboard?posted=true");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-black/40 p-6 sm:p-10 transition-colors"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 text-orange-600 dark:text-orange-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>New Requirement</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Post a Job Requirement
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto">
            Connect with verified local workers and technicians in your area.
          </p>
        </div>

        {/* Error Alert */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <div className="flex-1 font-medium">{error}</div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Job Title */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                1. What do you need help with? <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">{title.length}/120</span>
            </div>
            <input
              type="text"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Electrician needed to fix circuit breaker & wiring"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          {/* 2. Category Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
              2. Select Service Category <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? "bg-orange-50 dark:bg-orange-950/40 border-orange-500 text-orange-900 dark:text-orange-200 ring-2 ring-orange-500/20 shadow-sm font-bold"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? "text-orange-600 dark:text-orange-400" : "text-slate-400"}`} />
                    <span className="text-[11px] leading-tight line-clamp-1">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Location */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-orange-500" />
                <span>3. Location & Area <span className="text-red-500">*</span></span>
              </label>

              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={detectingLocation}
                className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                {detectingLocation ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Locating...</>
                ) : locationSuccess ? (
                  <><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Location Detected</>
                ) : (
                  <><Navigation className="w-3 h-3" /> Auto-Detect GPS</>
                )}
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <select
                  value={district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white"
                >
                  {NEPAL_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <input
                  type="text"
                  value={specificAddress}
                  onChange={(e) => setSpecificAddress(e.target.value)}
                  placeholder="Street / Landmark (e.g. New Baneshwor)"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* 4. Budget */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                4. Budget (NPR)
              </label>
              <label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNegotiable}
                  onChange={(e) => {
                    setIsNegotiable(e.target.checked);
                    if (e.target.checked) setBudget("");
                  }}
                  className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="font-medium">Negotiable / Open to Offers</span>
              </label>
            </div>

            {!isNegotiable && (
              <div className="space-y-2">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-sm font-semibold text-slate-400 pointer-events-none">
                    Rs.
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="Enter amount (e.g. 1500)"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 font-semibold"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Quick set:</span>
                  {BUDGET_PRESETS.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setBudget(String(val))}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/40 text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer"
                    >
                      Rs. {val.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 5. Description */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                5. Job Description & Requirements <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">{description.length}/2000</span>
            </div>
            <textarea
              required
              rows={4}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the work required, tools needed, materials available, and any preferences..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 resize-none leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex flex-col sm:flex-row gap-3">
            <Link
              href="/dashboard"
              className="py-3.5 px-5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-center cursor-pointer"
            >
              Cancel
            </Link>

            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="flex-1 py-3.5 px-6 bg-orange-600 hover:bg-orange-700 disabled:opacity-70 text-white rounded-2xl font-bold shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing Job...</span>
                </>
              ) : (
                <>
                  <span>Publish Job</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}