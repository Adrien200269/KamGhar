"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  MapPin,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Navigation,
  Eye,
} from "lucide-react";
import { createJob } from "@/app/actions/job";
import { NEPAL_DISTRICTS, getDistrictCoordinates } from "@/lib/constants";

const POPULAR_CATEGORIES = [
  "Electrician",
  "Plumbing",
  "Painting & Masonry",
  "Carpentry",
  "Home Cleaning",
  "Appliance Repair",
  "Tutoring & Classes",
  "Delivery & Moving",
  "Digital & Design",
  "Other Services",
];

const URGENCY_LEVELS = [
  { value: "LOW", label: "Flexible", desc: "Within a week or two", color: "border-slate-300 dark:border-slate-700" },
  { value: "MEDIUM", label: "Normal", desc: "Within 2-3 days", color: "border-blue-400 dark:border-blue-700" },
  { value: "HIGH", label: "High", desc: "Within 24 hours", color: "border-orange-500 dark:border-orange-600" },
  { value: "URGENT", label: "Urgent", desc: "Immediate / Emergency", color: "border-red-500 dark:border-red-600" },
] as const;

export default function JobPostForm({ defaultDistrict }: { defaultDistrict?: string }) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(POPULAR_CATEGORIES[0]);
  const [district, setDistrict] = useState(defaultDistrict || "Kathmandu");
  const [specificAddress, setSpecificAddress] = useState("");
  const [urgency, setUrgency] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
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
        urgency,
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
    <div className="grid lg:grid-cols-12 gap-8 items-start">
      {/* ── Form Section ──────────────────────────────────── */}
      <div className="lg:col-span-7 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl shadow-slate-200/40 dark:shadow-black/40 p-6 sm:p-8 transition-colors">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 text-orange-600 dark:text-orange-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Post a Requirement</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Create a New Job
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Describe the work you need done to reach skilled workers nearby.
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

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Title */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Job Title <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">{title.length}/120</span>
            </div>
            <input
              type="text"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Urgent Electrician needed for home wiring"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          {/* 2. Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white"
            >
              {POPULAR_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Urgency Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Urgency Level
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {URGENCY_LEVELS.map((u) => {
                const active = urgency === u.value;
                return (
                  <button
                    key={u.value}
                    type="button"
                    onClick={() => setUrgency(u.value)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      active
                        ? "bg-orange-50 dark:bg-orange-950/40 border-orange-500 text-orange-900 dark:text-orange-200 ring-2 ring-orange-500/20 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                    }`}
                  >
                    <p className="font-bold text-xs">{u.label}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{u.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Location & District */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-orange-500" />
                <span>Job Location <span className="text-red-500">*</span></span>
              </label>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={detectingLocation}
                className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                {detectingLocation ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Detecting GPS...</>
                ) : locationSuccess ? (
                  <><CheckCircle2 className="w-3 h-3 text-emerald-500" /> GPS Located</>
                ) : (
                  <><Navigation className="w-3 h-3" /> Detect My GPS</>
                )}
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <select
                  value={district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white"
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
                  placeholder="Street / Area (e.g. New Baneshwor)"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* 5. Budget */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Estimated Budget (NPR)
              </label>
              <label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNegotiable}
                  onChange={(e) => setIsNegotiable(e.target.checked)}
                  className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                />
                <span>Negotiable / Open to Offers</span>
              </label>
            </div>
            {!isNegotiable && (
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm text-slate-400 pointer-events-none">
                  Rs.
                </span>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g. 1500"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
            )}
          </div>

          {/* 6. Description */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Job Description <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">{description.length}/2000</span>
            </div>
            <textarea
              required
              rows={4}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the job scope, requirements, tools needed, and ideal completion time..."
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-3.5 px-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-70 text-white rounded-xl font-bold shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publishing Job...</span>
              </>
            ) : (
              <>
                <span>Publish Job Now</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>
      </div>

      {/* ── Live Preview Card ──────────────────────────────── */}
      <div className="lg:col-span-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          <Eye className="w-4 h-4 text-orange-500" />
          <span>Live Worker Preview</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-md shadow-slate-200/30 dark:shadow-black/30 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50">
              {category}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              urgency === "URGENT"
                ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                : urgency === "HIGH"
                ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
            }`}>
              {urgency}
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
              {title.trim() || "Your Job Title Will Appear Here"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
              <span>
                {specificAddress.trim() ? `${specificAddress.trim()}, ` : ""}
                {district}, Nepal
              </span>
            </p>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
            {description.trim() ||
              "Write a clear description so workers understand the project scope, tools required, and schedule."}
          </p>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400">Budget: </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {isNegotiable || !budget ? "Negotiable" : `Rs. ${budget}`}
              </span>
            </div>
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Just now
            </span>
          </div>
        </div>

        {/* Tip banner */}
        <div className="p-4 rounded-2xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/40 text-xs text-slate-600 dark:text-slate-400 space-y-1">
          <p className="font-bold text-orange-800 dark:text-orange-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            Quick Posting Tip
          </p>
          <p className="leading-relaxed">
            Specific addresses and clear timelines attract the highest-rated nearby technicians and speed up response times by up to 2x.
          </p>
        </div>
      </div>
    </div>
  );
}