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
} from "lucide-react";
import { applyToJob, getJobs } from "@/app/actions/job";
import { NEPAL_DISTRICTS } from "@/lib/constants";

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
  status: string;
  createdAt: Date;
  recruiter: {
    id: string;
    email: string;
    recruiterProfile: {
      name: string;
      businessName: string | null;
    } | null;
  };
  applications: { id: string; workerId: string }[];
};

export default function JobsFeed({
  initialJobs,
  appliedJobIds,
}: {
  initialJobs: JobItem[];
  appliedJobIds: string[];
}) {
  const searchParams = useSearchParams();
  const paramCategory = searchParams.get("category") || "ALL";
  const paramDistrict = searchParams.get("district") || "ALL";

  const [jobs, setJobs] = useState<JobItem[]>(initialJobs);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set(appliedJobIds));

  // Filter states
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(paramCategory);
  const [selectedDistrict, setSelectedDistrict] = useState(paramDistrict);
  const [selectedUrgency, setSelectedUrgency] = useState("ALL");
  const [selectedSort, setSelectedSort] = useState("newest");

  useEffect(() => {
    if (paramCategory !== "ALL" || paramDistrict !== "ALL") {
      handleFilterChange(search, paramCategory, paramDistrict, selectedUrgency, selectedSort);
    }
  }, [paramCategory, paramDistrict]);

  // Application modal state
  const [selectedJobForApply, setSelectedJobForApply] = useState<JobItem | null>(null);
  const [proposedRate, setProposedRate] = useState("");
  const [coverNote, setCoverNote] = useState("");
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
    setSelectedJobForApply(job);
    setProposedRate(job.budget ? String(job.budget) : "");
    setCoverNote("");
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
      });

      if (!res.success) {
        setApplyError(res.error ?? "Failed to submit application.");
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
            Find Work Near You
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse verified job postings and direct requirements across Kathmandu and all districts of Nepal.
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
              placeholder="Search by role, keyword (e.g. rewiring, painting, plumbing)..."
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
                <option value="ALL">All Districts (Nepal)</option>
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
              <option value="newest">Newest First</option>
              <option value="budget_high">Highest Budget</option>
              <option value="budget_low">Lowest Budget</option>
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
                {cat === "ALL" ? "All Categories" : cat}
              </button>
            );
          })}
        </div>

        {/* Secondary Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Urgency:</span>
            {URGENCY_OPTIONS.map((u) => (
              <button
                key={u.value}
                onClick={() => {
                  setSelectedUrgency(u.value);
                  handleFilterChange(search, selectedCategory, selectedDistrict, u.value);
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedUrgency === u.value
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {u.label}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400 hover:underline font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
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
                  {/* Category + Urgency Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50">
                      {job.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        isUrgent
                          ? "bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300 animate-pulse"
                          : job.urgency === "HIGH"
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                      }`}
                    >
                      {isUrgent && <Flame className="w-3 h-3 text-red-600 dark:text-red-400" />}
                      <span>{job.urgency}</span>
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
                    <div className="text-[11px] text-slate-400 truncate">
                      <span>By </span>
                      <strong className="text-slate-600 dark:text-slate-300 font-semibold">{recruiterName}</strong>
                    </div>

                    {isApplied ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Applied</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => openApplyModal(job)}
                        className="inline-flex items-center gap-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-orange-500/20 transition-all cursor-pointer"
                      >
                        <span>Apply Now</span>
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
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {applyError}
                </div>
              )}

              <form onSubmit={handleApplySubmit} className="space-y-4">
                {/* Proposed Rate */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Your Proposed Rate (NPR) <span className="text-slate-400 font-normal">— optional</span>
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
                      Client&apos;s estimated budget is Rs. {selectedJobForApply.budget.toLocaleString()}.
                    </p>
                  )}
                </div>

                {/* Pitch / Message */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Message to Client <span className="text-slate-400 font-normal">— optional</span>
                  </label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    placeholder="Briefly state your relevant experience, tools you bring, or when you can begin work..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white resize-none placeholder:text-slate-400"
                  />
                  <p className="text-[11px] text-slate-400 text-right mt-0.5">{coverNote.length}/500</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedJobForApply(null)}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isApplying}
                    className="flex-1 py-3 px-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-70 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isApplying ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Application</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}