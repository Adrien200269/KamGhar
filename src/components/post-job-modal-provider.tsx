"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Loader2,
  LogIn,
  UserPlus,
  Briefcase,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getPostJobEligibility, type PostJobEligibility } from "@/app/actions/job";
import { useLanguage } from "@/components/language-provider";
import { LiquidGlassModalShell } from "@/components/liquid-glass-modal-shell";
import JobPostForm, { type JobPostPrefill } from "@/app/jobs/new/job-post-form";

type PostJobModalContextValue = {
  isOpen: boolean;
  openPostJobModal: (prefill?: JobPostPrefill) => void;
  closePostJobModal: () => void;
};

const PostJobModalContext = createContext<PostJobModalContextValue>({
  isOpen: false,
  openPostJobModal: () => {},
  closePostJobModal: () => {},
});

export function usePostJobModal() {
  return useContext(PostJobModalContext);
}

export function PostJobModalProvider({ children }: { children: React.ReactNode }) {
  const { tx } = useLanguage();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [prefill, setPrefill] = useState<JobPostPrefill | undefined>(undefined);
  const [eligibility, setEligibility] = useState<PostJobEligibility | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    broadcastCount?: number;
  } | null>(null);

  // Reset cached eligibility when auth session changes
  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      setEligibility(null);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const closePostJobModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openPostJobModal = useCallback(
    (nextPrefill?: JobPostPrefill) => {
      setPrefill(nextPrefill);
      setIsOpen(true);

      if (!eligibility) {
        setCheckingAccess(true);
        getPostJobEligibility()
          .then((res) => setEligibility(res))
          .catch(() =>
            setEligibility({ status: "ALLOWED", defaultDistrict: "Kathmandu" })
          )
          .finally(() => setCheckingAccess(false));
      } else {
        // Refresh silently in background in case user profile changed
        getPostJobEligibility()
          .then((res) => setEligibility(res))
          .catch(() => {});
      }
    },
    [eligibility]
  );

  // Lock body scroll and listen for Escape while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closePostJobModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closePostJobModal]);

  // Auto-dismiss success toast
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 6500);
    return () => clearTimeout(id);
  }, [toast]);

  const handleSuccess = ({ broadcastCount }: { jobId?: string; broadcastCount?: number }) => {
    setIsOpen(false);
    setToast({
      message: tx(
        "Your job requirement is now live!",
        "तपाईंको काम सफलतापूर्वक पोस्ट भयो!"
      ),
      broadcastCount,
    });
    router.refresh();
  };

  return (
    <PostJobModalContext.Provider
      value={{ isOpen, openPostJobModal, closePostJobModal }}
    >
      {children}

      {/* Floating Liquid Glass Success Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-1.5rem)] max-w-md rounded-2xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-2xl backdrop-saturate-150 border border-white/80 dark:border-white/15 shadow-[0_18px_50px_-10px_rgba(15,23,42,0.28),inset_0_1px_0_rgba(255,255,255,0.9)] px-4 py-3 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                  {toast.message}
                </p>
                {toast.broadcastCount ? (
                  <p className="text-[11px] font-semibold text-orange-600 dark:text-orange-400">
                    {toast.broadcastCount} nearby technicians alerted
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Link
                href="/dashboard"
                onClick={() => setToast(null)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-bold shadow-xs transition"
              >
                <span>{tx("Dashboard", "ड्यासबोर्ड")}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
              <button
                type="button"
                onClick={() => setToast(null)}
                aria-label="Dismiss notification"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Liquid Glass Post Job Card Pop-up */}
      <AnimatePresence>
        {isOpen && (
          <LiquidGlassModalShell
            titleId="liquid-post-job-title"
            badgeText={tx("New Requirement", "नयाँ काम")}
            title={tx("Post a Job Requirement", "कामको विवरण पोस्ट गर्नुहोस्")}
            subtitle={tx(
              "Connect with verified local workers and technicians in your area.",
              "तपाईंको क्षेत्रका प्रमाणित स्थानीय कामदारहरूसँग तुरुन्तै जोडिनुहोस्।"
            )}
            onClose={closePostJobModal}
          >
            {checkingAccess && !eligibility ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
                <Loader2 className="w-7 h-7 animate-spin text-orange-600" />
                <p className="text-xs font-semibold">
                  {tx("Preparing job form...", "फारम खुल्दैछ...")}
                </p>
              </div>
            ) : eligibility?.status === "UNAUTHENTICATED" ? (
              <div className="py-10 px-4 text-center space-y-5">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-500/15 border border-orange-300/60 dark:border-orange-700/50 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <LogIn className="w-7 h-7" />
                </div>
                <div className="space-y-1.5 max-w-sm mx-auto">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {tx("Sign in to post a job", "काम पोस्ट गर्न लग इन गर्नुहोस्")}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {tx(
                      "Log in or create a free recruiter account to publish requirements and receive instant bids from local workers.",
                      "स्थानीय कामदारहरूबाट आवेदन प्राप्त गर्न लग इन गर्नुहोस् वा रोजगारदाता खाता खोल्नुहोस्।"
                    )}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
                  <Link
                    href="/login?redirect=/dashboard"
                    onClick={closePostJobModal}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-lg shadow-orange-500/25 transition"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{tx("Log In", "लग इन गर्नुहोस्")}</span>
                  </Link>
                  <Link
                    href="/register"
                    onClick={closePostJobModal}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-2xl bg-white/75 dark:bg-slate-800/75 border border-white/80 dark:border-white/15 text-slate-800 dark:text-slate-100 text-xs font-bold hover:bg-white dark:hover:bg-slate-800 transition"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{tx("Sign Up", "नयाँ खाता")}</span>
                  </Link>
                </div>
              </div>
            ) : eligibility?.status === "WORKER_RESTRICTED" ? (
              <div className="py-10 px-4 text-center space-y-5">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-300/60 dark:border-amber-700/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Briefcase className="w-7 h-7" />
                </div>
                <div className="space-y-1.5 max-w-sm mx-auto">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {tx("Recruiter Account Required", "रोजगारदाता खाता आवश्यक छ")}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {tx(
                      "Only recruiter accounts can post jobs. As a worker, you can browse and apply to open gigs near you.",
                      "केवल रोजगारदाता खाताबाट मात्र काम पोस्ट गर्न मिल्छ। कामदारका रूपमा तपाईं उपलब्ध कामहरूमा आवेदन दिन सक्नुहुन्छ।"
                    )}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2.5">
                  <Link
                    href="/jobs"
                    onClick={closePostJobModal}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-lg shadow-orange-500/25 transition"
                  >
                    <span>{tx("Explore Open Gigs", "खुला कामहरू हेर्नुहोस्")}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <JobPostForm
                key={`${eligibility?.defaultDistrict || "Kathmandu"}-${prefill?.title || ""}-${prefill?.category || ""}-${prefill?.budget || ""}`}
                isModal
                defaultDistrict={eligibility?.defaultDistrict || "Kathmandu"}
                prefill={prefill}
                onClose={closePostJobModal}
                onSuccess={handleSuccess}
              />
            )}
          </LiquidGlassModalShell>
        )}
      </AnimatePresence>
    </PostJobModalContext.Provider>
  );
}
