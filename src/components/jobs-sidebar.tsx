"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  PlusCircle,
  Users,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  Home,
  Briefcase,
  ShieldCheck,
  Settings,
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { usePostJobModal } from "@/components/post-job-modal-provider";

interface JobsSidebarProps {
  user: {
    id: string;
    email: string;
    role: string;
    name?: string | null;
    photoUrl?: string | null;
  } | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSignOut?: () => void;
}

export default function JobsSidebar({
  user,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  onSignOut,
}: JobsSidebarProps) {
  const { tx } = useLanguage();
  const { openPostJobModal } = usePostJobModal();
  const pathname = usePathname();

  const isWorker = user?.role === "WORKER";
  const displayName = user?.name || user?.email?.split("@")[0] || "Guest";
  const photoUrl = user?.photoUrl;

  const linkClass = (href: string) => {
    const isActive = pathname === href || pathname.startsWith(href + "/");
    return `group flex items-center transition-all cursor-pointer select-none ${
      collapsed
        ? "w-10 h-10 mx-auto justify-center rounded-xl"
        : "w-full gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold"
    } ${
      isActive
        ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold shadow-xs border border-orange-500/20"
        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
    }`;
  };

  const plainLinkClass = `group flex items-center transition-all cursor-pointer ${
    collapsed
      ? "w-10 h-10 mx-auto justify-center rounded-xl"
      : "w-full gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold"
  } text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60`;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-30 h-screen h-[100dvh] flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out shrink-0 ${
          collapsed ? "w-20" : "w-64"
        } ${
          mobileOpen
            ? "translate-x-0 shadow-2xl"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* ── Brand Header ── */}
        <div className="h-16 px-2.5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between shrink-0">
          <Link
            href="/"
            className={`flex items-center gap-2.5 ${collapsed ? "justify-center w-full" : ""}`}
            title="KamGhar"
          >
            {collapsed ? (
              <div className="dark:bg-white dark:rounded-xl dark:px-1.5 dark:py-1 transition-all flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="KamGhar"
                  width={100}
                  height={32}
                  priority
                  className="h-6 w-auto max-w-[50px] object-contain"
                />
              </div>
            ) : (
              <>
                <div className="dark:bg-white dark:rounded-xl dark:px-2 dark:py-1 transition-all">
                  <Image
                    src="/logo.png"
                    alt="KamGhar"
                    width={100}
                    height={32}
                    priority
                    className="h-7 w-auto object-contain"
                  />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                  {tx("Gig Explorer", "गिग खोज")}
                </span>
              </>
            )}
          </Link>

          {/* Mobile Close */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── User Profile Snippet ── */}
        {user && (
          <div
            className={`border-b border-slate-200/80 dark:border-slate-800/80 shrink-0 ${
              collapsed ? "py-3 flex justify-center" : "p-3"
            }`}
          >
            {collapsed ? (
              <Link
                href="/dashboard"
                className="relative cursor-pointer group focus:outline-none"
                title={displayName}
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-orange-100 dark:bg-orange-950/60 border-2 border-orange-200 dark:border-orange-800/80 flex items-center justify-center text-orange-700 dark:text-orange-300 font-bold text-sm shadow-xs transition-transform group-hover:scale-105">
                  {photoUrl ? (
                    <Image
                      src={photoUrl}
                      alt={displayName}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    displayName.charAt(0).toUpperCase()
                  )}
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-orange-100 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 flex items-center justify-center text-orange-700 dark:text-orange-300 font-bold text-sm shrink-0">
                  {photoUrl ? (
                    <Image
                      src={photoUrl}
                      alt={displayName}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    displayName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {displayName}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Navigation ── */}
        <div
          className={`flex-1 overflow-y-auto scrollbar-none ${
            collapsed ? "px-2 py-3 space-y-3" : "px-3 py-3 space-y-5"
          }`}
        >
          {/* Browse */}
          <div>
            {!collapsed && (
              <p className="px-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {tx("Browse", "ब्राउज")}
              </p>
            )}
            <nav className="space-y-1">
              <Link
                href="/jobs"
                onClick={onCloseMobile}
                className={linkClass("/jobs")}
                title={collapsed ? tx("Find Jobs", "काम खोज्नुहोस्") : undefined}
              >
                <Search className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
                {!collapsed && <span>{tx("Find Jobs & Gigs", "काम र गिग खोज्नुहोस्")}</span>}
              </Link>

              <Link
                href="/workers"
                onClick={onCloseMobile}
                className={linkClass("/workers")}
                title={collapsed ? tx("Browse Workers", "कामदार हेर्नुहोस्") : undefined}
              >
                <Users className="w-4 h-4 shrink-0 text-purple-600 dark:text-purple-400" />
                {!collapsed && <span>{tx("Browse Workers", "कामदारहरू हेर्नुहोस्")}</span>}
              </Link>

              <Link
                href="/rate-guide"
                onClick={onCloseMobile}
                className={linkClass("/rate-guide")}
                title={collapsed ? tx("Rate Guide", "दर सूची") : undefined}
              >
                <BookOpen className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                {!collapsed && <span>{tx("Nepal Rate Guide", "नेपाल श्रम दर सूची")}</span>}
              </Link>
            </nav>
          </div>

          {collapsed && (
            <div className="w-8 h-px bg-slate-200 dark:bg-slate-800 mx-auto my-1 shrink-0" />
          )}

          {/* Account */}
          <div>
            {!collapsed && (
              <p className="px-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {tx("Account", "खाता")}
              </p>
            )}
            <nav className="space-y-1">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={onCloseMobile}
                    className={plainLinkClass}
                    title={collapsed ? tx("Dashboard", "ड्यासबोर्ड") : undefined}
                  >
                    <LayoutDashboard className="w-4 h-4 shrink-0 text-orange-600 dark:text-orange-400" />
                    {!collapsed && <span>{tx("My Dashboard", "मेरो ड्यासबोर्ड")}</span>}
                  </Link>

                  {!isWorker && (
                    <button
                      type="button"
                      onClick={() => {
                        onCloseMobile();
                        openPostJobModal();
                      }}
                      className={plainLinkClass}
                      title={collapsed ? tx("Post a Job", "काम पोस्ट गर्नुहोस्") : undefined}
                    >
                      <PlusCircle className="w-4 h-4 shrink-0 text-orange-600 dark:text-orange-400" />
                      {!collapsed && (
                        <span className="font-bold text-orange-600 dark:text-orange-400">
                          {tx("Post a Job", "काम पोस्ट गर्नुहोस्")}
                        </span>
                      )}
                    </button>
                  )}

                  <Link
                    href="/"
                    onClick={onCloseMobile}
                    className={plainLinkClass}
                    title={collapsed ? tx("Home", "गृहपृष्ठ") : undefined}
                  >
                    <Home className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>{tx("Home", "गृहपृष्ठ")}</span>}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/"
                    onClick={onCloseMobile}
                    className={plainLinkClass}
                    title={collapsed ? tx("Home", "गृहपृष्ठ") : undefined}
                  >
                    <Home className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>{tx("Home", "गृहपृष्ठ")}</span>}
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          className={`border-t border-slate-200/80 dark:border-slate-800/80 shrink-0 ${
            collapsed ? "py-3 px-2 flex flex-col items-center gap-2" : "p-3 space-y-2"
          }`}
        >
          {collapsed ? (
            <>
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden lg:flex w-10 h-10 items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Expand sidebar"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {user && onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                  title={tx("Sign out", "लग आउट")}
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                </button>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden lg:flex w-full items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Collapse sidebar"
              >
                <span className="flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  <span>{tx("Collapse Sidebar", "साइडबार बन्द गर्नुहोस्")}</span>
                </span>
              </button>

              {user && onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>{tx("Sign out", "लग आउट")}</span>
                </button>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}
