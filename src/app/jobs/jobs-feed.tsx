"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  Clock,
  Briefcase,
  Users,
  Filter,
  CheckCircle2,
  X,
  Loader2,
  Send,
  AlertCircle,
  Flame,
  ArrowRight,
  RotateCcw,
  Radio,
  LockKeyhole,
  LogIn,
  UserPlus,
} from "lucide-react";
import { applyToJob, getJobs } from "@/app/actions/job";
import { NEPAL_DISTRICTS } from "@/lib/constants";
import { VoiceNoteRecorder, VoiceNotePlayer } from "@/components/voice-note";
import { useLanguage } from "@/components/language-provider";
import { createClient } from "@/lib/supabase/client";

const CATEGORIES = [
  "ALL",
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

const URGENCY_OPTIONS = [
  { value: "ALL", label: "All Urgency" },
  { value: "URGENT", label: "Urgent Only" },
  { value: "HIGH", label: "High Priority" },
  { value: "MEDIUM", label: "Normal" },
  { value: "LOW", label: "Flexible" },
];

type JobItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  urgency: string;
  budget: number | null;
  latitude: number;
  longitude: number;
  address: string;
  audioUrl?: string | null;
  status: string;
  createdAt: Date;
  recruiter: {
    id: string;
    email: string;
    recruiterProfile: {
      name: string;
      businessName: string | null;
      profilePhotoUrl?: string | null;
    } | null;
  };
  applications: { id: string; workerId: string }[];
};

export default function JobsFeed({
  initialJobs,
  appliedJobIds,
  isLoggedIn: initialIsLoggedIn = false,
}: {
  initialJobs: JobItem[];
  appliedJobIds: string[];
  isLoggedIn?: boolean;
}) {
  const { lang, t, tx } = useLanguage();
  const searchParams = useSearchParams();
  const paramCategory = searchParams.get("category") || "ALL";
  const paramDistrict = searchParams.get("district") || "ALL";

  const [jobs, setJobs] = useState<JobItem[]>(initialJobs);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set(appliedJobIds));
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn);

  // Filter states
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(paramCategory);
  const [selectedDistrict, setSelectedDistrict] = useState(paramDistrict);
  const [selectedUrgency, setSelectedUrgency] = useState("ALL");
  const [selectedSort, setSelectedSort] = useState("newest");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (paramCategory !== "ALL" || paramDistrict !== "ALL") {
      handleFilterChange(search, paramCategory, paramDistrict, selectedUrgency, selectedSort);
    }
  }, [paramCategory, paramDistrict]);

  // Application modal state
  const [selectedJobForApply, setSelectedJobForApply] = useState<JobItem | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [targetJobForLogin, setTargetJobForLogin] = useState<JobItem | null>(null);
  const [proposedRate, setProposedRate] = useState("");
  const [coverNote, setCoverNote] = useState("");
  const [audioProposalUrl, setAudioProposalUrl] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccessMessage, setApplySuccessMessage] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (
    newSearch = search,
    newCat = selectedCategory,
    newDist = selectedDistrict,
    newUrg = selectedUrgency,
    newSort = selectedSort
  ) => {
    startTransition(async () => {
      const updated = await getJobs({
        search: newSearch,
        category: newCat,
        district: newDist,
        urgency: newUrg,
        sort: newSort,
      });
      setJobs(updated as unknown as JobItem[]);
    });
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategory("ALL");
    setSelectedDistrict("ALL");
    setSelectedUrgency("ALL");
    setSelectedSort("newest");
    handleFilterChange("", "ALL", "ALL", "ALL", "newest");
  };

  const openApplyModal = (job: JobItem) => {
    if (!isLoggedIn) {
      setTargetJobForLogin(job);
      setShowLoginPrompt(true);
      return;
    }
    setSelectedJobForApply(job);
    setProposedRate(job.budget ? String(job.budget) : "");
    setCoverNote("");
    setAudioProposalUrl(null);
    setApplyError(null);
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobForApply) return;
    setIsApplying(true);
    setApplyError(null);

    try {
      const res = await applyToJob({
        jobId: selectedJobForApply.id,
        proposedRate: proposedRate ? parseFloat(proposedRate) : null,
        coverNote: coverNote.trim(),
        audioUrl: audioProposalUrl,
      });

      if (!res.success) {
        if (
          res.error?.toLowerCase().includes("log in") ||
          res.error?.toLowerCase().includes("login")
        ) {
          setIsLoggedIn(false);
          setTargetJobForLogin(selectedJobForApply);
          setSelectedJobForApply(null);
          setShowLoginPrompt(true);
        } else {
          setApplyError(res.error ?? "Failed to submit application.");
        }
      } else {
        setAppliedIds((prev) => new Set([...prev, selectedJobForApply.id]));
        setApplySuccessMessage(`Application sent for "${selectedJobForApply.title}"!`);
        setSelectedJobForApply(null);
        setTimeout(() => setApplySuccessMessage(null), 4000);
      }
    } catch {
      setApplyError("An unexpected error occurred. Please try again.");
    } finally {
      setIsApplying(false);
    }
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedCategory !== "ALL" ||
    selectedDistrict !== "ALL" ||
    selectedUrgency !== "ALL" ||
    selectedSort !== "newest";

  return (
    <div className="space-y-8">
      {/* ── Success Banner ─────────────────────────────────── */}
      <AnimatePresence>
        {applySuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <p className="font-bold text-sm">{applySuccessMessage}</p>
            </div>
            <button
              onClick={() => setApplySuccessMessage(null)}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero Search & Filters Box ──────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-5">
        <div className="max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {tx("Find Work Near You", "नजिकका कामहरू खोज्नुहोस्")}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {tx(
              "Browse verified job postings and direct requirements across Kathmandu and all districts of Nepal.",
              "काठमाडौं तथा नेपालभरिका प्रमाणित कामहरू र आवश्यकताहरू हेर्नुहोस् र तत्काल आवेदन दिनुहोस्।"
            )}
          </p>
        </div>

        {/* Search Bar + District Dropdown */}
        <div className="grid sm:grid-cols-12 gap-3">
          <div className="sm:col-span-7 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                handleFilterChange(e.target.value);
              }}
              placeholder={tx("Search by role, keyword (e.g. rewiring, painting, plumbing)...", "काम वा सीप खोज्नुहोस् (उदा. वायरिङ, पेन्टिङ, प्लम्बिङ)...")}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          <div className="sm:col-span-3">
            <div className="relative">
              <select
                value={selectedDistrict}
                onChange={(e) => {
                  setSelectedDistrict(e.target.value);
                  handleFilterChange(search, selectedCategory, e.target.value);
                }}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white appearance-none"
              >
                <option value="ALL">{tx("All Districts (Nepal)", "सबै जिल्लाहरू (नेपाल)")}</option>
                {NEPAL_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="sm:col-span-2">
            <select
              value={selectedSort}
              onChange={(e) => {
                setSelectedSort(e.target.value);
                handleFilterChange(search, selectedCategory, selectedDistrict, selectedUrgency, e.target.value);
              }}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white"
            >
              <option value="newest">{tx("Newest First", "नयाँ पहिले")}</option>
              <option value="budget_high">{tx("Highest Budget", "बढी बजेट पहिले")}</option>
              <option value="budget_low">{tx("Lowest Budget", "कम बजेट पहिले")}</option>
            </select>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  handleFilterChange(search, cat);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? "bg-orange-600 text-white shadow-md shadow-orange-500/20"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {cat === "ALL" ? tx("All Categories", "सबै विधाहरू") : cat}
              </button>
            );
          })}
        </div>

        {/* Secondary Filters Bar */}
        {hasActiveFilters && (
          <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400 hover:underline font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{tx("Reset Filters", "फिल्टर रिसेट")}</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Feed Header ────────────────────────────────────── */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>
          Showing <strong className="text-slate-900 dark:text-white">{jobs.length}</strong> available gig{jobs.length === 1 ? "" : "s"}
        </span>
        {isPending && (
          <span className="flex items-center gap-1.5 text-orange-600 font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating feed...
          </span>
        )}
      </div>

      {/* ── Job Cards Grid ─────────────────────────────────── */}
      {jobs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 border-dashed p-12 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-3">
            <Briefcase className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No gigs match your search
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto mb-6">
            Try adjusting your search keywords, clearing your district filter, or broadening the category.
          </p>
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job) => {
            const isApplied = appliedIds.has(job.id);
            const isUrgent = job.urgency === "URGENT";
            const recruiterName =
              job.recruiter?.recruiterProfile?.businessName ||
              job.recruiter?.recruiterProfile?.name ||
              "Verified Client";

            return (
              <motion.div
                key={job.id}
                layout
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-orange-300 dark:hover:border-orange-800/80 transition-all"
              >
                <div className="space-y-3.5">
                  {/* Category + Date + Urgent indicator */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50">
                        {job.category}
                      </span>
                      {isUrgent && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800/60">
                          <Radio className="w-2.5 h-2.5 text-red-600 animate-pulse" />
                          <span>{lang === "ne" ? "आपतकालीन प्रसारण" : "Urgent Broadcast"}</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(job.createdAt).toLocaleDateString("en-NP", { month: "short", day: "numeric" })}</span>
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                    {job.title}
                  </h3>

                  {/* Description snippet */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {job.description}
                  </p>

                  {/* Voice Note Player if client provided audio */}
                  {job.audioUrl && (
                    <div className="pt-0.5">
                      <VoiceNotePlayer audioUrl={job.audioUrl} />
                    </div>
                  )}
                </div>

                {/* Footer Info & Action */}
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                      <span className="truncate max-w-[150px]">{job.address}</span>
                    </span>
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {job.budget ? `Rs. ${job.budget.toLocaleString()}` : "Negotiable"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate max-w-[65%]">
                      {job.recruiter?.recruiterProfile?.profilePhotoUrl ? (
                        <img
                          src={job.recruiter.recruiterProfile.profilePhotoUrl}
                          alt={recruiterName}
                          className="w-4 h-4 rounded-full object-cover border border-orange-200 dark:border-orange-800/50 flex-shrink-0"
                        />
                      ) : null}
                      <span className="truncate">
                        By <strong className="text-slate-600 dark:text-slate-300 font-semibold">{recruiterName}</strong>
                      </span>
                    </div>

                    {isApplied ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{tx("Applied", "आवेदन गरियो")}</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => openApplyModal(job)}
                        className="inline-flex items-center gap-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-orange-500/20 transition-all cursor-pointer"
                      >
                        <span>{tx("Apply Now", "आवेदन दिनुहोस्")}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Apply Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {selectedJobForApply && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-2xl space-y-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50">
                    {selectedJobForApply.category}
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1.5 leading-snug">
                    {selectedJobForApply.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-orange-500" />
                    {selectedJobForApply.address}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedJobForApply(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {applyError && (
                <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center justify-between gap-2.5 font-medium">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600 dark:text-red-400" />
                    <span>{applyError}</span>
                  </div>
                  {(applyError.toLowerCase().includes("log in") ||
                    applyError.toLowerCase().includes("login")) && (
                    <button
                      type="button"
                      onClick={() => {
                        setTargetJobForLogin(selectedJobForApply);
                        setSelectedJobForApply(null);
                        setShowLoginPrompt(true);
                      }}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex-shrink-0"
                    >
                      {tx("Log In", "लग इन")}
                    </button>
                  )}
                </div>
              )}

              <form onSubmit={handleApplySubmit} className="space-y-4">
                {/* Proposed Rate */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {tx("Your Proposed Rate (NPR)", "तपाईंको प्रस्तावित दर (रु.)")}{" "}
                    <span className="text-slate-400 font-normal">— {tx("optional", "ऐच्छिक")}</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm text-slate-400 pointer-events-none">
                      Rs.
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={50}
                      value={proposedRate}
                      onChange={(e) => setProposedRate(e.target.value)}
                      placeholder={selectedJobForApply.budget ? String(selectedJobForApply.budget) : "e.g. 1500"}
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white"
                    />
                  </div>
                  {selectedJobForApply.budget && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      {tx("Client's estimated budget is Rs.", "ग्राहकको अनुमानित बजेट रु.")}{" "}
                      {selectedJobForApply.budget.toLocaleString()}.
                    </p>
                  )}
                </div>

                {/* Pitch / Message */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {tx("Message to Client", "ग्राहकलाई सन्देश")}{" "}
                    <span className="text-slate-400 font-normal">— {tx("optional", "ऐच्छिक")}</span>
                  </label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    placeholder={tx(
                      "Briefly state your relevant experience, tools you bring, or when you can begin work...",
                      "आफ्नो अनुभव, ल्याउने औजारहरू वा कहिले काम सुरु गर्न सक्नुहुन्छ संक्षेपमा लेख्नुहोस्..."
                    )}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white resize-none placeholder:text-slate-400"
                  />
                  <p className="text-[11px] text-slate-400 text-right mt-0.5">{coverNote.length}/500</p>

                  {/* Audio Proposal Recorder */}
                  <div className="pt-1">
                    <VoiceNoteRecorder
                      onAudioRecorded={setAudioProposalUrl}
                      label={tx(
                        "Voice Proposal / Audio Pitch (Hold to Record)",
                        "आवाजमा प्रस्ताव / अडियो रेकर्ड गर्नुहोस्"
                      )}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedJobForApply(null)}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {tx("Cancel", "रद्द गर्नुहोस्")}
                  </button>
                  <button
                    type="submit"
                    disabled={isApplying}
                    className="flex-1 py-3 px-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-70 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isApplying ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{tx("Submitting...", "पठाउँदै...")}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{tx("Send Application", "आवेदन पेश गर्नुहोस्")}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Big Prominent Login Alert Modal ─────────────────── */}
      <AnimatePresence>
        {showLoginPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
              className="relative w-full max-w-md sm:max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-orange-200/80 dark:border-orange-900/50 p-6 sm:p-8 shadow-2xl text-center space-y-5 overflow-hidden"
            >
              {/* Decorative background glows */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Big Animated Lock Icon */}
              <motion.div
                initial={{ scale: 0.7, rotate: -8 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 20 }}
                className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-600 flex items-center justify-center text-white shadow-xl shadow-orange-500/30"
              >
                <LockKeyhole className="w-10 h-10" />
              </motion.div>

              {/* Header Text */}
              <div className="space-y-2">
                <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60">
                  {tx("Sign in to Apply", "आवेदन दिन लग इन गर्नुहोस्")}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {tx("Please Log In to Apply", "काममा आवेदन दिन कृपया लग इन गर्नुहोस्")}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {tx(
                    "You must have an active KamGhar account to submit applications, propose rates, and chat directly with employers.",
                    "काममा आवेदन पेश गर्न, दर प्रस्ताव गर्न र रोजगारदातासँग कुराकानी गर्न कृपया लग इन गर्नुहोस्।"
                  )}
                </p>
              </div>

              {/* Targeted Job Context Card */}
              {targetJobForLogin && (
                <div className="p-3.5 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/40 text-left flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-orange-600 dark:text-orange-400">
                      {targetJobForLogin.category}
                    </p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {targetJobForLogin.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-orange-500" />
                      {targetJobForLogin.address}
                    </p>
                  </div>
                  {targetJobForLogin.budget && (
                    <div className="text-right flex-shrink-0">
                      <span className="text-[10px] text-slate-400 block font-medium">Budget</span>
                      <span className="text-xs font-extrabold text-orange-600 dark:text-orange-400">
                        Rs. {targetJobForLogin.budget.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <Link
                  href="/login?redirect=/jobs"
                  className="w-full py-3.5 px-5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{tx("Log In to Apply", "आवेदन दिन लग इन गर्नुहोस्")}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/register"
                  className="w-full py-3 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-orange-500" />
                  <span>{tx("Don't have an account? Sign Up", "खाता छैन? नयाँ दर्ता हुनुहोस्")}</span>
                </Link>
              </div>

              {/* Dismiss Link */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowLoginPrompt(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium transition-colors cursor-pointer"
                >
                  {tx("Continue browsing jobs", "कामहरू हेरिरहनुहोस्")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}