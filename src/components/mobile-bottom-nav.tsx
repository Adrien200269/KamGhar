"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Briefcase, Plus, Users, LayoutDashboard, User } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { usePostJobModal } from "@/components/post-job-modal-provider";
import { createClient } from "@/lib/supabase/client";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { tx } = useLanguage();
  const { isOpen: isPostModalOpen, openPostJobModal } = usePostJobModal();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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

  // Hide on auth, onboarding & full-screen admin flows
  if (
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register") ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/forgot-password") ||
    pathname?.startsWith("/reset-password") ||
    pathname?.startsWith("/onboarding") ||
    pathname?.startsWith("/admin")
  ) {
    return null;
  }

  const isHomeActive = pathname === "/";
  const isJobsActive = pathname?.startsWith("/jobs") && pathname !== "/jobs/new";
  const isPostActive = isPostModalOpen || pathname === "/jobs/new";
  const isWorkersActive = pathname?.startsWith("/workers");
  const isDashActive = pathname?.startsWith("/dashboard");

  return (
    <nav
      aria-label="Mobile Navigation"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] px-2 py-1 safe-area-pb"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* 1. Home */}
        <Link
          href={isLoggedIn ? "/dashboard" : "/"}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all active:scale-95 ${
            isHomeActive
              ? "text-orange-600 dark:text-orange-400 font-bold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Home className={`w-5 h-5 ${isHomeActive ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
          <span className="text-[10px] mt-0.5">{tx("Home", "गृह")}</span>
        </Link>

        {/* 2. Jobs */}
        <Link
          href="/jobs"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all active:scale-95 ${
            isJobsActive
              ? "text-orange-600 dark:text-orange-400 font-bold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Briefcase className={`w-5 h-5 ${isJobsActive ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
          <span className="text-[10px] mt-0.5">{tx("Jobs", "काम")}</span>
        </Link>

        {/* 3. Post Job Floating Button */}
        <button
          type="button"
          onClick={() => openPostJobModal()}
          title={tx("Post a Job", "काम पोस्ट गर्नुहोस्")}
          className="flex flex-col items-center justify-center -translate-y-3 group active:scale-90 transition-transform cursor-pointer"
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all border-4 border-slate-50 dark:border-slate-950 ${
              isPostActive
                ? "bg-orange-700 text-white ring-4 ring-orange-500/30 shadow-orange-600/40"
                : "bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-orange-500/35 group-hover:scale-105"
            }`}
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-[9px] font-bold text-orange-600 dark:text-orange-400 mt-0.5">
            {tx("Post", "पोस्ट")}
          </span>
        </button>

        {/* 4. Workers */}
        <Link
          href="/workers"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all active:scale-95 ${
            isWorkersActive
              ? "text-orange-600 dark:text-orange-400 font-bold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Users className={`w-5 h-5 ${isWorkersActive ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
          <span className="text-[10px] mt-0.5">{tx("Workers", "कामदार")}</span>
        </Link>

        {/* 5. Dashboard or Login */}
        <Link
          href={isLoggedIn ? "/dashboard" : "/login"}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all active:scale-95 ${
            isDashActive
              ? "text-orange-600 dark:text-orange-400 font-bold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          {isLoggedIn ? (
            <LayoutDashboard className={`w-5 h-5 ${isDashActive ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
          ) : (
            <User className="w-5 h-5 stroke-[1.8]" />
          )}
          <span className="text-[10px] mt-0.5">
            {isLoggedIn ? tx("Dashboard", "ड्यासबोर्ड") : tx("Account", "खाता")}
          </span>
        </Link>
      </div>
    </nav>
  );
}
