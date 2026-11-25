"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Clock,
  CalendarClock,
  Briefcase,
  Share2,
  Copy,
  Check,
  Flame,
  ShieldCheck,
  ShieldAlert,
  Send,
  Loader2,
  ArrowLeft,
  DollarSign,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  Heart,
  Trash2,
} from "lucide-react";
import AppHeader from "@/components/app-header";
import { applyToJob, deleteJob } from "@/app/actions/job";
import { VoiceNotePlayer, VoiceNoteRecorder } from "@/components/voice-note";
import { useLanguage } from "@/components/language-provider";
import { getApproximateBsDate, extractPreferredTiming } from "@/lib/nepali-date";
import BoostPaymentModal from "@/components/boost-payment-modal";
import BoostPromoCard from "@/components/boost-promo-card";
import SafetyToolkitModal from "@/components/safety-toolkit-modal";
import { getJobWhatsAppUrl } from "@/lib/whatsapp";
import { getRemainingBoostInfo } from "@/lib/boost";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("@/components/map-picker"), { ssr: false });

export default function JobDetailsView({
  data,
}: {
  data: {
    job: any;
    hasApplied: boolean;
    isOwner: boolean;
    currentUserId: string | null;
  };
}) {
  const { job, hasApplied: initialHasApplied, isOwner, currentUserId } = data;
  const { lang, tx } = useLanguage();
  const router = useRouter();

  const jobBoost = getRemainingBoostInfo(job?.boostedUntil, lang);

  const [hasApplied, setHasApplied] = useState(initialHasApplied);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("kg_saved_jobs");
      if (raw) {
        const set = new Set(JSON.parse(raw));
        setIsSaved(set.has(job.id));
      }
    } catch {
      // LocalStorage fallback
    }
  }, [job.id]);

  const toggleSave = () => {
    try {
      const raw = localStorage.getItem("kg_saved_jobs");
      const set = new Set(raw ? JSON.parse(raw) : []);
      if (set.has(job.id)) {
        set.delete(job.id);
        setIsSaved(false);
      } else {
        set.add(job.id);
        setIsSaved(true);
      }
      localStorage.setItem("kg_saved_jobs", JSON.stringify(Array.from(set)));
    } catch {
      // Ignore
    }
  };

  const recruiterWhatsAppUrl = getJobWhatsAppUrl({
    phone: job.recruiter?.phone,
    recruiterName: job.recruiter?.recruiterProfile?.name,
    jobTitle: job.title,
    budget: job.budget,
  });

  // Apply Form State
  const [proposedRate, setProposedRate] = useState<string>(job.budget ? job.budget.toString() : "");
  const [coverNote, setCoverNote] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isApplying, startApplyTransition] = useTransition();
  const [applyError, setApplyError] = useState<string | null>(null);

  const bsDate = getApproximateBsDate(new Date(job.createdAt));
  const shareUrl = typeof window !== "undefined" ? window.location.href : `https://kamghar.com/jobs/${job.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`📢 *${job.title}* on KamGhar\n📍 Location: ${job.address}\n💰 Budget: Rs. ${job.budget || "Negotiable"}\nCheck out or apply: ${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleViber = () => {
    const text = encodeURIComponent(`📢 ${job.title} on KamGhar\nLocation: ${job.address}\nBudget: Rs. ${job.budget || "Negotiable"}\n${shareUrl}`);
    window.open(`viber://forward?text=${text}`, "_blank");
  };

  const handleApply = () => {
    setApplyError(null);
    startApplyTransition(async () => {
      const res = await applyToJob({
        jobId: job.id,
        proposedRate: proposedRate ? parseFloat(proposedRate) : null,
        coverNote,
        audioUrl,
      });

      if (res.success) {
        setHasApplied(true);
        setShowApplyModal(false);
      } else {
        setApplyError(res.error || "Failed to submit application");
      }
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await deleteJob(job.id);
      if (res.success) {
        setShowDeleteModal(false);
        router.push("/dashboard");
        router.refresh();
      } else {
        setDeleteError(res.error || "Failed to delete job");
      }
    } catch (err: any) {
      setDeleteError(err?.message || "An unexpected error occurred while deleting.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <AppHeader />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6 pb-24 sm:pb-8">
        {/* Back Link */}
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-orange-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{tx("Back to All Gigs", "सबै कामहरु हेर्नुहोस्")}</span>
        </Link>

        {/* Main Job Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-8 shadow-sm space-y-6">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800">
                  {job.category}
                </span>

                {job.isBoosted && (
                  <span
                    title={jobBoost?.expiryDateFormatted ? `Boosted until ${jobBoost.expiryDateFormatted}` : undefined}
                    className="text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/80 flex items-center gap-1.5 shadow-xs"
                  >
                    <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
                    <span>
                      {tx("Boosted Priority", "प्राथमिकता बुस्ट")}
                      {jobBoost?.isActive && ` • ${jobBoost.shortFormatted}`}
                    </span>
                  </span>
                )}

                {job.urgency === "URGENT" && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 border border-red-200 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                    <span>Urgent Gig</span>
                  </span>
                )}

                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {bsDate.formattedNe}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {job.title}
              </h1>

              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-orange-600 shrink-0" />
                <span>{job.address}</span>
              </p>
            </div>

            {/* Budget Display */}
            <div className="p-4 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-900/60 shrink-0 text-left sm:text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                {tx("Estimated Budget", "अनुमानित बजेट")}
              </span>
              <p className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-0.5">
                {job.budget ? `Rs. ${job.budget.toLocaleString()}` : tx("Negotiable", "सहमति अनुसार")}
              </p>
            </div>
          </div>

          {/* Description */}
          {(() => {
            const { cleanDescription, preferredTiming } = extractPreferredTiming(
              job.description || ""
            );
            return (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  {tx("Gig Details & Scope", "कामको विवरण")}
                </h3>
                {preferredTiming && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-800/60 text-xs font-bold text-orange-700 dark:text-orange-300">
                    <CalendarClock className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
                    <span>
                      {tx("Scheduled Timing:", "तोकिएको समय:")} {preferredTiming}
                    </span>
                  </div>
                )}
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                  {cleanDescription}
                </p>
              </div>
            );
          })()}

          {/* Voice Note Player if Present */}
          {job.audioUrl && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                🎙️ {tx("Recruiter Audio Instructions", "ग्राहकको अडियो निर्देशन")}
              </span>
              <VoiceNotePlayer audioUrl={job.audioUrl} />
            </div>
          )}

          {/* Recruiter Trust Profile Card */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/70 text-orange-600 border border-orange-200 dark:border-orange-800 flex items-center justify-center font-bold text-lg overflow-hidden shrink-0">
                {job.recruiter.recruiterProfile?.profilePhotoUrl ? (
                  <img src={job.recruiter.recruiterProfile.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  job.recruiter.recruiterProfile?.name?.[0]?.toUpperCase() || "R"
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {job.recruiter.recruiterProfile?.name || "Verified Client"}
                  </h4>
                  {job.recruiter.recruiterProfile?.kycStatus === "VERIFIED" && (
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
                {job.recruiter.recruiterProfile?.businessName && (
                  <p className="text-xs text-orange-600 font-semibold">
                    {job.recruiter.recruiterProfile.businessName}
                  </p>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {job.recruiter._count.postedJobs} gigs posted • {job.recruiter._count.reviewsReceived} reviews
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{job.applications.length}</span> workers applied
            </div>
          </div>

          {/* Share & Quick Safety Bar */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSave}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                  isSaved
                    ? "bg-rose-50 text-rose-600 border-rose-300 dark:bg-rose-950/60 dark:text-rose-400"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isSaved ? "fill-rose-500 text-rose-500" : ""}`} />
                <span>{isSaved ? tx("Saved Gig", "मन परेको") : tx("Save Gig", "सेभ गर्नुहोस्")}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSafetyModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-bold hover:bg-red-100 transition"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                <span>{tx("Work Safety SOS", "सुरक्षा SOS")}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {recruiterWhatsAppUrl && (
                <a
                  href={recruiterWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{tx("WhatsApp", "ह्वाट्सएप")}</span>
                </a>
              )}
              <button
                type="button"
                onClick={handleWhatsApp}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition"
              >
                Share WA
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? tx("Copied!", "प्रतिलिपि भयो!") : tx("Copy Link", "लिङ्क कपी")}</span>
              </button>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
            {isOwner ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full justify-between">
                <span className="text-xs text-slate-500">{tx("You posted this gig listing.", "यो तपाईंले पोस्ट गर्नुभएको काम हो।")}</span>
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setShowBoostModal(true)}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-md transition cursor-pointer ${
                      jobBoost?.isActive
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white ring-2 ring-amber-400/30"
                        : "bg-amber-500 hover:bg-amber-600 text-white"
                    }`}
                  >
                    <Flame className="w-4 h-4" />
                    <span>
                      {jobBoost?.isActive
                        ? tx(`Boost: ${jobBoost.badgeLabel} • Extend`, `बुस्ट: ${jobBoost.badgeLabel} • थप्नुहोस्`)
                        : tx("Boost Job", "काम बुस्ट गर्नुहोस्")}
                    </span>
                  </button>
                  <Link
                    href="/dashboard"
                    className="flex-1 sm:flex-initial text-center px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition"
                  >
                    {tx("Manage in Dashboard", "ड्यासबोर्डमा व्यवस्थापन")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-bold transition cursor-pointer"
                    title={tx("Delete Gig", "काम मेटाउनुहोस्")}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{tx("Delete", "मेटाउनुहोस्")}</span>
                  </button>
                </div>
              </div>
            ) : currentUserId ? (
              hasApplied ? (
                <div className="w-full flex items-center justify-between p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                  <span>✓ {tx("Application Submitted", "तपाईंको आवेदन पठाइयो")}</span>
                  <Link href="/dashboard" className="underline hover:text-emerald-900">
                    {tx("View Status", "स्थिति हेर्नुहोस्")}
                  </Link>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowApplyModal(true)}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-sm shadow-xl shadow-orange-500/25 active:scale-98 transition flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{tx("Apply for this Gig", "यस कामको लागि आवेदन दिनुहोस्")}</span>
                </button>
              )
            ) : (
              <div className="w-full flex items-center justify-between p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900">
                <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                  {tx("Log in as a worker to apply for this gig.", "आवेदन दिनको लागि कामदार लगइन गर्नुहोस्।")}
                </span>
                <Link
                  href={`/login?next=/jobs/${job.id}`}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md transition"
                >
                  {tx("Log In", "लगइन")}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Owner Gig Boost Showcase Card */}
        {isOwner && (
          <BoostPromoCard
            jobId={job.id}
            jobTitle={job.title}
            isBoosted={job.isBoosted}
            boostedUntil={job.boostedUntil}
            onBoostSuccess={() => router.refresh()}
          />
        )}

        {/* Embedded Map Section */}
        {job.latitude && job.longitude && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              {tx("Gig Location on Map", "नक्सामा कामको स्थान")}
            </h3>
            <div className="h-64 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
              <MapPicker
                lat={job.latitude}
                lng={job.longitude}
                onChange={() => {}}
              />
            </div>
          </div>
        )}
      </main>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {tx("Apply to Gig", "कामको लागि आवेदन दिनुहोस्")}
              </h3>
              <button
                onClick={() => setShowApplyModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {tx("Your Proposed Rate (NPR)", "तपाईंको प्रस्तावित दर (रु)")}
                </label>
                <input
                  type="number"
                  value={proposedRate}
                  onChange={(e) => setProposedRate(e.target.value)}
                  placeholder="e.g. 1500"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {tx("Cover Note (Optional)", "छोटो सन्देश (वैकल्पिक)")}
                </label>
                <textarea
                  rows={3}
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  placeholder="Tell the recruiter why you are a great fit..."
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  🎙️ {tx("Optional Voice Note", "अडियो सन्देश")}
                </label>
                <VoiceNoteRecorder onAudioRecorded={(url: string | null) => setAudioUrl(url)} />
              </div>

              {applyError && (
                <p className="text-xs text-red-600 font-semibold">{applyError}</p>
              )}

              <button
                type="button"
                onClick={handleApply}
                disabled={isApplying}
                className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{tx("Submit Application", "आवेदन पठाउनुहोस्")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Boost Payment Modal */}
      {showBoostModal && (
        <BoostPaymentModal
          isOpen={showBoostModal}
          onClose={() => setShowBoostModal(false)}
          type="BOOST_JOB"
          jobId={job.id}
          itemTitle={job.title}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}

      {/* Work Safety SOS Modal */}
      <SafetyToolkitModal
        isOpen={showSafetyModal}
        onClose={() => setShowSafetyModal(false)}
        jobTitle={job.title}
        location={job.address}
        contactName={job.recruiter?.recruiterProfile?.name}
        contactPhone={job.recruiter?.phone}
      />

      {/* Delete Job Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {tx("Delete Job Posting", "कामको विज्ञापन मेटाउनुहोस्")}
                </h4>
                <p className="text-xs text-slate-500">
                  {tx("This action cannot be undone", "यो कार्य उल्टाउन सकिँदैन")}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {tx(
                `Are you sure you want to permanently delete "${job.title}"? All applicants and applications tied to this job listing will be deleted.`,
                `के तपाईं "${job.title}" स्थायी रूपमा मेटाउन निश्चित हुनुहुन्छ? यस विज्ञापनसँग सम्बन्धित सबै आवेदनहरू हटाइनेछ।`
              )}
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-600 font-semibold">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                {tx("Cancel", "रद्द गर्नुहोस्")}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? tx("Deleting...", "मेटाउँदै...") : tx("Delete Job", "काम मेटाउनुहोस्")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
