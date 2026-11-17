"use client";

import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Briefcase,
  Wallet,
  Bookmark,
  ShieldCheck,
  Settings,
  Search,
  PlusCircle,
  Users,
  QrCode,
  ShieldAlert,
  BookOpen,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import ThemeToggle from "@/components/theme-toggle";
import LanguageToggle from "@/components/language-toggle";

export type DashboardTab =
  | "overview"
  | "applications"
  | "jobs"
  | "earnings"
  | "kyc"
  | "settings";

interface DashboardSidebarProps {
  user: {
    id: string;
    email: string;
    role: string;
    workerProfile?: {
      name: string;
      profilePhotoUrl?: string | null;
      kycStatus?: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
      isAvailableNow?: boolean;
      skills?: string[];
    } | null;
    recruiterProfile?: {
      name: string;
      businessName?: string | null;
      profilePhotoUrl?: string | null;
      kycStatus?: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
    } | null;
  };
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  isAvailableNow?: boolean;
  togglingAvailability?: boolean;
  onToggleAvailability?: () => void;
  applicationsCount?: number;
  openJobsCount?: number;
  onOpenVisitingCard?: () => void;
  onOpenSafetyModal?: () => void;
  onSignOut: () => void;
}

export default function DashboardSidebar({
  user,
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  isAvailableNow = false,
  togglingAvailability = false,
  onToggleAvailability,
  applicationsCount = 0,
  openJobsCount = 0,
  onOpenVisitingCard,
  onOpenSafetyModal,
  onSignOut,
}: DashboardSidebarProps) {
  const { tx } = useLanguage();
  const isWorker = user.role === "WORKER";
  const profile = isWorker ? user.workerProfile : user.recruiterProfile;
  const displayName = profile?.name || user.email.split("@")[0];
  const photoUrl = profile?.profilePhotoUrl;
  const kycStatus = profile?.kycStatus || "UNVERIFIED";
  const isKycVerified = kycStatus === "VERIFIED";

  const handleSelectTab = (tab: DashboardTab) => {
    onTabChange(tab);
    onCloseMobile();
  };

  const navItemClass = (tab: DashboardTab) => {
    const isActive = activeTab === tab;
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

  const externalLinkClass = `group flex items-center transition-all cursor-pointer ${
    collapsed
      ? "w-10 h-10 mx-auto justify-center rounded-xl"
      : "w-full gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold"
  } text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60`;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out ${
          collapsed ? "w-20" : "w-64"
        } ${
          mobileOpen
            ? "translate-x-0 shadow-2xl"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* ── Brand Header ── */}
        <div className="h-16 px-3 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between shrink-0">
          <Link
            href="/"
            className={`flex items-center gap-2.5 ${
              collapsed ? "justify-center w-full" : ""
            }`}
          >
            {collapsed ? (
              <div
                className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-black text-sm shadow-sm shadow-orange-500/25 shrink-0"
                title="KamGhar"
              >
                KG
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
                  {isWorker ? "Worker" : "Client"}
                </span>
              </>
            )}
          </Link>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── User Profile Card Snippet ── */}
        <div
          className={`border-b border-slate-200/80 dark:border-slate-800/80 shrink-0 ${
            collapsed ? "py-3 flex justify-center" : "p-3"
          }`}
        >
          {collapsed ? (
            <button
              type="button"
              onClick={() => handleSelectTab("settings")}
              className="relative cursor-pointer group focus:outline-none"
              title={`${displayName} (${user.email}) - Settings`}
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
              {isWorker && (
                <span
                  title={isAvailableNow ? "Available Now" : "Off-Duty"}
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                    isAvailableNow
                      ? "bg-emerald-500 ring-2 ring-emerald-500/20"
                      : "bg-slate-400"
                  }`}
                />
              )}
            </button>
          ) : (
            <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
              {/* Avatar with Status Pulse */}
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-orange-100 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 flex items-center justify-center text-orange-700 dark:text-orange-300 font-bold text-sm">
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
                {isWorker && (
                  <span
                    title={isAvailableNow ? "Available Now" : "Off-Duty"}
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                      isAvailableNow
                        ? "bg-emerald-500 ring-2 ring-emerald-500/20"
                        : "bg-slate-400"
                    }`}
                  />
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {displayName}
                  </h4>
                  {isKycVerified && (
                    <span
                      title="KamGhar Verified"
                      className="text-blue-600 dark:text-blue-400 shrink-0"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          )}

          {/* Quick Availability Switch for Workers (Expanded only) */}
          {!collapsed && isWorker && onToggleAvailability && (
            <button
              type="button"
              onClick={onToggleAvailability}
              disabled={togglingAvailability}
              className={`w-full mt-2 py-1.5 px-2.5 rounded-lg text-[11px] font-bold flex items-center justify-between border transition-all cursor-pointer ${
                isAvailableNow
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isAvailableNow
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-slate-400"
                  }`}
                />
                <span>
                  {isAvailableNow
                    ? tx("Available for Gigs", "कामको लागि उपलब्ध")
                    : tx("Off-Duty (Busy)", "अफ-ड्युटी")}
                </span>
              </div>
              {togglingAvailability ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <span className="text-[10px] uppercase tracking-wider opacity-80">
                  {isAvailableNow ? "ON" : "OFF"}
                </span>
              )}
            </button>
          )}
        </div>

        {/* ── Navigation Links ── */}
        <div
          className={`flex-1 overflow-y-auto scrollbar-none ${
            collapsed ? "px-2 py-3 space-y-3" : "px-3 py-3 space-y-5"
          }`}
        >
          {/* Main Dashboard Section */}
          <div>
            {!collapsed && (
              <p className="px-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {tx("Workspace", "कार्यक्षेत्र")}
              </p>
            )}
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => handleSelectTab("overview")}
                className={navItemClass("overview")}
                title={collapsed ? tx("Overview", "अवलोकन") : undefined}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0 text-orange-600 dark:text-orange-400" />
                {!collapsed && <span>{tx("Dashboard Overview", "अवलोकन")}</span>}
              </button>

              {isWorker ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleSelectTab("applications")}
                    className={navItemClass("applications")}
                    title={
                      collapsed
                        ? tx("My Applications", "मेरा आवेदनहरू")
                        : undefined
                    }
                  >
                    <Briefcase className="w-4 h-4 shrink-0" />
                    {!collapsed && (
                      <div className="flex-1 flex items-center justify-between">
                        <span>{tx("My Applications", "मेरा आवेदनहरू")}</span>
                        {applicationsCount > 0 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                            {applicationsCount}
                          </span>
                        )}
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTab("earnings")}
                    className={navItemClass("earnings")}
                    title={
                      collapsed ? tx("Earnings & Ledger", "आम्दानी") : undefined
                    }
                  >
                    <Wallet className="w-4 h-4 shrink-0" />
                    {!collapsed && (
                      <span>{tx("Earnings & Ledger", "आम्दानी र खाता")}</span>
                    )}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSelectTab("jobs")}
                  className={navItemClass("jobs")}
                  title={
                    collapsed ? tx("My Postings", "पोस्ट गरिएका काम") : undefined
                  }
                >
                  <Briefcase className="w-4 h-4 shrink-0" />
                  {!collapsed && (
                    <div className="flex-1 flex items-center justify-between">
                      <span>{tx("My Job Postings", "पोस्ट गरिएका कामहरू")}</span>
                      {openJobsCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                          {openJobsCount}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              )}
            </nav>
          </div>

          {collapsed && (
            <div className="w-8 h-px bg-slate-200 dark:bg-slate-800 mx-auto my-1 shrink-0" />
          )}

          {/* Discovery & Actions Section */}
          <div>
            {!collapsed && (
              <p className="px-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {tx("Quick Actions", "द्रुत कार्यहरू")}
              </p>
            )}
            <div className="space-y-1">
              {isWorker ? (
                <Link
                  href="/jobs"
                  className={externalLinkClass}
                  title={collapsed ? tx("Find Jobs", "काम खोज्नुहोस्") : undefined}
                >
                  <Search className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
                  {!collapsed && (
                    <span>{tx("Explore Nearby Gigs", "नजिकका कामहरू खोज्नुहोस्")}</span>
                  )}
                </Link>
              ) : (
                <>
                  <Link
                    href="/jobs/new"
                    className={externalLinkClass}
                    title={
                      collapsed
                        ? tx("Post a Job", "काम पोस्ट गर्नुहोस्")
                        : undefined
                    }
                  >
                    <PlusCircle className="w-4 h-4 shrink-0 text-orange-600 dark:text-orange-400" />
                    {!collapsed && (
                      <span className="font-bold text-orange-600 dark:text-orange-400">
                        {tx("Post a New Job", "काम पोस्ट गर्नुहोस्")}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/workers"
                    className={externalLinkClass}
                    title={
                      collapsed ? tx("Find Workers", "कामदारहरू") : undefined
                    }
                  >
                    <Users className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
                    {!collapsed && (
                      <span>{tx("Search Skilled Workers", "कामदार खोज्नुहोस्")}</span>
                    )}
                  </Link>
                </>
              )}

              {/* Digital Visiting Card Modal Trigger */}
              {onOpenVisitingCard && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenVisitingCard();
                    onCloseMobile();
                  }}
                  className={externalLinkClass}
                  title={
                    collapsed
                      ? tx("Digital Visiting Card", "भिजिटिङ कार्ड")
                      : undefined
                  }
                >
                  <QrCode className="w-4 h-4 shrink-0 text-purple-600 dark:text-purple-400" />
                  {!collapsed && (
                    <span>
                      {tx("Digital Visiting Card", "डिजिटल भिजिटिङ कार्ड")}
                    </span>
                  )}
                </button>
              )}

              {/* Safety SOS Toolkit Trigger */}
              {onOpenSafetyModal && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenSafetyModal();
                    onCloseMobile();
                  }}
                  className={externalLinkClass}
                  title={
                    collapsed
                      ? tx("Safety SOS Toolkit", "सुरक्षा टुलकिट")
                      : undefined
                  }
                >
                  <ShieldAlert className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                  {!collapsed && (
                    <span>
                      {tx("Safety & SOS Toolkit", "सुरक्षा तथा आपतकालीन टुलकिट")}
                    </span>
                  )}
                </button>
              )}

              {/* Nepal Fair Rate Guide */}
              <Link
                href="/rate-guide"
                className={externalLinkClass}
                title={collapsed ? tx("Rate Guide", "दर सूची") : undefined}
              >
                <BookOpen className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                {!collapsed && (
                  <span>{tx("Nepal Rate Guide", "नेपाल श्रम दर सूची")}</span>
                )}
              </Link>
            </div>
          </div>

          {collapsed && (
            <div className="w-8 h-px bg-slate-200 dark:bg-slate-800 mx-auto my-1 shrink-0" />
          )}

          {/* Verification & Account Settings */}
          <div>
            {!collapsed && (
              <p className="px-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {tx("Account & Trust", "खाता तथा प्रमाणीकरण")}
              </p>
            )}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => handleSelectTab("kyc")}
                className={navItemClass("kyc")}
                title={
                  collapsed
                    ? tx("Citizenship & KYC", "नागरिकता प्रमाणीकरण")
                    : undefined
                }
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between">
                    <span>
                      {tx("Citizenship & KYC", "नागरिकता प्रमाणीकरण")}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                        isKycVerified
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : kycStatus === "PENDING"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                      }`}
                    >
                      {isKycVerified ? "Verified" : kycStatus === "PENDING" ? "Review" : "Required"}
                    </span>
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSelectTab("settings")}
                className={navItemClass("settings")}
                title={collapsed ? tx("Settings", "सेटिङहरू") : undefined}
              >
                <Settings className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{tx("Profile & Settings", "सेटिङहरू")}</span>}
              </button>
            </div>
          </div>
        </div>

        {/* ── Footer Controls ── */}
        <div
          className={`border-t border-slate-200/80 dark:border-slate-800/80 shrink-0 ${
            collapsed ? "py-3 px-2 flex flex-col items-center gap-2" : "p-3 space-y-2"
          }`}
        >
          {collapsed ? (
            <>
              {/* Desktop Expand Toggle Button */}
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden lg:flex w-10 h-10 items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Expand sidebar"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={onSignOut}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                title={tx("Sign out", "लग आउट")}
              >
                <LogOut className="w-4 h-4 shrink-0" />
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ThemeToggle />
                  <LanguageToggle />
                </div>

                {/* Desktop Collapse Button */}
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="hidden lg:flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={onSignOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>{tx("Sign out", "लग आउट")}</span>
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
