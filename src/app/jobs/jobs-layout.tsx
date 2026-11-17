"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import JobsSidebar from "@/components/jobs-sidebar";
import ThemeToggle from "@/components/theme-toggle";
import LanguageToggle from "@/components/language-toggle";
import NotificationDropdown from "@/components/notification-dropdown";
import { Menu } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/components/language-provider";

interface JobsLayoutProps {
  user: {
    id: string;
    email: string;
    role: string;
    name?: string | null;
    photoUrl?: string | null;
  } | null;
  children: React.ReactNode;
}

export default function JobsLayout({ user, children }: JobsLayoutProps) {
  const { tx } = useLanguage();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }, [router]);

  return (
    <div className="h-screen h-[100dvh] overflow-hidden flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* ── Sidebar ── */}
      <JobsSidebar
        user={user}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onSignOut={handleSignOut}
      />

      {/* ── Right Panel (navbar + scrollable content) ── */}
      <div className="flex-1 min-w-0 flex flex-col h-screen h-[100dvh] overflow-hidden">
        {/* ── Top Navbar (fixed, non-scrollable) ── */}
        <header className="shrink-0 h-16 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
          <div className="w-full px-4 sm:px-8 h-16 flex items-center justify-between gap-3">
            {/* Left: mobile menu + breadcrumb */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile hamburger */}
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Breadcrumb */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 hidden sm:block">
                  KamGhar
                </span>
                <span className="text-slate-300 dark:text-slate-700 hidden sm:block">/</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                  {tx("Find Jobs & Gigs", "काम र गिग खोज्नुहोस्")}
                </span>
              </div>
            </div>

            {/* Right: controls */}
            <div className="flex items-center gap-2 shrink-0">
              {user && <NotificationDropdown />}
              <ThemeToggle />
              <LanguageToggle />
            </div>
          </div>
        </header>

        {/* ── Scrollable Main Content ── */}
        <main className="flex-1 overflow-y-auto w-full scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
