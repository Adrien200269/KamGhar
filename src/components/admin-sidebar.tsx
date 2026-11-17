"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  Scale,
  Users,
  Briefcase,
  Star,
  Layers,
  BarChart3,
  CreditCard,
  FileSpreadsheet,
  Shield,
  MapPin,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  X,
  LayoutDashboard,
  Home,
  LogOut,
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";

export type AdminTabType =
  | "kyc"
  | "users"
  | "jobs"
  | "disputes"
  | "heatmap"
  | "broadcast"
  | "reviews"
  | "categories"
  | "analytics"
  | "monetization"
  | "reconciliation"
  | "audit";

interface AdminSidebarProps {
  currentUser: {
    id: string;
    email: string;
    role: string;
    name?: string | null;
    profilePhotoUrl?: string | null;
    photoUrl?: string | null;
    workerProfile?: { name?: string | null; profilePhotoUrl?: string | null } | null;
    recruiterProfile?: { name?: string | null; profilePhotoUrl?: string | null } | null;
  };
  activeTab: AdminTabType;
  onTabChange: (tab: AdminTabType) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  pendingKycCount?: number;
  disputesCount?: number;
  usersCount?: number;
  jobsCount?: number;
  reviewsCount?: number;
  onSignOut?: () => void;
}

export default function AdminSidebar({
  currentUser,
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  pendingKycCount = 0,
  disputesCount = 0,
  usersCount = 0,
  jobsCount = 0,
  reviewsCount = 0,
  onSignOut,
}: AdminSidebarProps) {
  const { tx } = useLanguage();

  const photoUrl =
    currentUser.profilePhotoUrl ||
    currentUser.photoUrl ||
    currentUser.workerProfile?.profilePhotoUrl ||
    currentUser.recruiterProfile?.profilePhotoUrl ||
    null;

  const displayName =
    currentUser.name ||
    currentUser.workerProfile?.name ||
    currentUser.recruiterProfile?.name ||
    currentUser.email.split("@")[0];

  const handleSelectTab = (tab: AdminTabType) => {
    onTabChange(tab);
    onCloseMobile();
  };

  const navItemClass = (tab: AdminTabType) => {
    const isActive = activeTab === tab;
    return `group flex items-center transition-all cursor-pointer select-none ${
      collapsed
        ? "w-10 h-10 mx-auto justify-center rounded-xl"
        : "w-full gap-3 px-3 py-2 rounded-xl text-xs font-semibold"
    } ${
      isActive
        ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold shadow-xs border border-orange-500/20"
        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
    }`;
  };

  const externalLinkClass = `group flex items-center transition-all cursor-pointer ${
    collapsed
      ? "w-10 h-10 mx-auto justify-center rounded-xl"
      : "w-full gap-3 px-3 py-2 rounded-xl text-xs font-semibold"
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
        className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-30 h-screen h-[100dvh] flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out shrink-0 select-none ${
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
            className={`flex items-center gap-2.5 ${
              collapsed ? "justify-center w-full" : ""
            }`}
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
                  Admin
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

        {/* ── Operator Info Snippet ── */}
        <div
          className={`border-b border-slate-200/80 dark:border-slate-800/80 shrink-0 ${
            collapsed ? "py-3 flex justify-center" : "p-3"
          }`}
        >
          {collapsed ? (
            <div
              className="relative group cursor-pointer"
              title={`${displayName} (${currentUser.email})`}
            >
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-orange-100 dark:bg-orange-950/60 border-2 border-orange-200 dark:border-orange-800/80 flex items-center justify-center text-orange-700 dark:text-orange-300 font-bold text-sm shadow-xs transition-transform group-hover:scale-105">
                {photoUrl ? (
                  <Image
                    src={photoUrl}
                    alt={displayName}
                    width={40}
                    height={40}
                    unoptimized
                    className="w-full h-full object-cover"
                  />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 bg-emerald-500 ring-2 ring-emerald-500/20" />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-orange-100 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 flex items-center justify-center text-orange-700 dark:text-orange-300 font-bold text-sm">
                  {photoUrl ? (
                    <Image
                      src={photoUrl}
                      alt={displayName}
                      width={40}
                      height={40}
                      unoptimized
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    displayName.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 bg-emerald-500 ring-2 ring-emerald-500/20" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {displayName}
                  </h4>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-md bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300">
                    ADMIN
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
                  {currentUser.email}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Navigation Links ── */}
        <div
          className={`flex-1 overflow-y-auto scrollbar-none ${
            collapsed ? "px-2 py-3 space-y-3" : "px-3 py-3 space-y-4"
          }`}
        >
          {/* Group 1: Verification & Trust */}
          <div>
            {!collapsed && (
              <p className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {tx("Compliance & Trust", "प्रमाणीकरण तथा सुरक्षा")}
              </p>
            )}
            <nav className="space-y-0.5">
              <button
                type="button"
                onClick={() => handleSelectTab("kyc")}
                className={navItemClass("kyc")}
                title={collapsed ? tx("KYC Review", "केवाइसी") : undefined}
              >
                <ShieldCheck className="w-4 h-4 shrink-0 text-amber-500" />
                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between">
                    <span>{tx("KYC Review", "केवाइसी समीक्षा")}</span>
                    {pendingKycCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        {pendingKycCount}
                      </span>
                    )}
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSelectTab("disputes")}
                className={navItemClass("disputes")}
                title={collapsed ? tx("Dispute Center", "विवाद समाधान") : undefined}
              >
                <Scale className="w-4 h-4 shrink-0 text-red-500" />
                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between">
                    <span>{tx("Dispute Center", "विवाद समाधान")}</span>
                    {disputesCount > 0 && (
                      <span className="text-[10px] text-slate-400">({disputesCount})</span>
                    )}
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSelectTab("reviews")}
                className={navItemClass("reviews")}
                title={collapsed ? tx("Reviews", "समीक्षाहरू") : undefined}
              >
                <Star className="w-4 h-4 shrink-0 text-yellow-500" />
                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between">
                    <span>{tx("Reviews & Ratings", "समीक्षाहरू")}</span>
                    {reviewsCount > 0 && (
                      <span className="text-[10px] text-slate-400">({reviewsCount})</span>
                    )}
                  </div>
                )}
              </button>
            </nav>
          </div>

          {collapsed && (
            <div className="w-8 h-px bg-slate-200 dark:bg-slate-800 mx-auto my-1 shrink-0" />
          )}

          {/* Group 2: Platform Directory */}
          <div>
            {!collapsed && (
              <p className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {tx("Marketplace Management", "बजार व्यवस्थापन")}
              </p>
            )}
            <nav className="space-y-0.5">
              <button
                type="button"
                onClick={() => handleSelectTab("users")}
                className={navItemClass("users")}
                title={collapsed ? tx("Users", "उपभोक्ता") : undefined}
              >
                <Users className="w-4 h-4 shrink-0 text-blue-500" />
                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between">
                    <span>{tx("User Accounts", "प्रयोगकर्ता खाताहरू")}</span>
                    {usersCount > 0 && (
                      <span className="text-[10px] text-slate-400">({usersCount})</span>
                    )}
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSelectTab("jobs")}
                className={navItemClass("jobs")}
                title={collapsed ? tx("Jobs", "विज्ञापनहरू") : undefined}
              >
                <Briefcase className="w-4 h-4 shrink-0 text-orange-500" />
                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between">
                    <span>{tx("Job Postings", "कामका विज्ञापनहरू")}</span>
                    {jobsCount > 0 && (
                      <span className="text-[10px] text-slate-400">({jobsCount})</span>
                    )}
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSelectTab("categories")}
                className={navItemClass("categories")}
                title={collapsed ? tx("Categories", "विधाहरू") : undefined}
              >
                <Layers className="w-4 h-4 shrink-0 text-teal-500" />
                {!collapsed && <span>{tx("Service Categories", "सेवा विधाहरू")}</span>}
              </button>
            </nav>
          </div>

          {collapsed && (
            <div className="w-8 h-px bg-slate-200 dark:bg-slate-800 mx-auto my-1 shrink-0" />
          )}

          {/* Group 3: Financial & Transactions */}
          <div>
            {!collapsed && (
              <p className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {tx("Monetization & Ledger", "आर्थिक कारोबार")}
              </p>
            )}
            <nav className="space-y-0.5">
              <button
                type="button"
                onClick={() => handleSelectTab("monetization")}
                className={navItemClass("monetization")}
                title={collapsed ? tx("Payments", "भुक्तानी") : undefined}
              >
                <CreditCard className="w-4 h-4 shrink-0 text-emerald-500" />
                {!collapsed && <span>{tx("Featured & Boosts", "फिचर्ड भुक्तानी")}</span>}
              </button>

              <button
                type="button"
                onClick={() => handleSelectTab("reconciliation")}
                className={navItemClass("reconciliation")}
                title={collapsed ? tx("CSV & Invoicing", "हिसाब मिलान") : undefined}
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0 text-purple-500" />
                {!collapsed && <span>{tx("CSV & Invoicing", "हिसाब मिलान")}</span>}
              </button>
            </nav>
          </div>

          {collapsed && (
            <div className="w-8 h-px bg-slate-200 dark:bg-slate-800 mx-auto my-1 shrink-0" />
          )}

          {/* Group 4: Intelligence & Operations */}
          <div>
            {!collapsed && (
              <p className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {tx("Operations & Intelligence", "विश्लेषण तथा अपरेसन")}
              </p>
            )}
            <nav className="space-y-0.5">
              <button
                type="button"
                onClick={() => handleSelectTab("heatmap")}
                className={navItemClass("heatmap")}
                title={collapsed ? tx("Supply Heatmap", "नक्सा तथा माग") : undefined}
              >
                <MapPin className="w-4 h-4 shrink-0 text-indigo-500" />
                {!collapsed && <span>{tx("Supply & Heatmap", "माग तथा नक्सा")}</span>}
              </button>

              <button
                type="button"
                onClick={() => handleSelectTab("broadcast")}
                className={navItemClass("broadcast")}
                title={collapsed ? tx("Broadcasts", "सूचना सम्प्रेषण") : undefined}
              >
                <Megaphone className="w-4 h-4 shrink-0 text-rose-500" />
                {!collapsed && <span>{tx("Emergency Broadcasts", "आपतकालीन सूचना")}</span>}
              </button>

              <button
                type="button"
                onClick={() => handleSelectTab("analytics")}
                className={navItemClass("analytics")}
                title={collapsed ? tx("Funnel Analytics", "विश्लेषण") : undefined}
              >
                <BarChart3 className="w-4 h-4 shrink-0 text-cyan-500" />
                {!collapsed && <span>{tx("Funnel Analytics", "फनेल विश्लेषण")}</span>}
              </button>

              <button
                type="button"
                onClick={() => handleSelectTab("audit")}
                className={navItemClass("audit")}
                title={collapsed ? tx("Audit Logs", "अडिट लग") : undefined}
              >
                <Shield className="w-4 h-4 shrink-0 text-slate-500" />
                {!collapsed && <span>{tx("Admin Audit Logs", "अडिट लग")}</span>}
              </button>
            </nav>
          </div>

          {collapsed && (
            <div className="w-8 h-px bg-slate-200 dark:bg-slate-800 mx-auto my-1 shrink-0" />
          )}

          {/* Group 5: Quick Shortcuts */}
          <div>
            {!collapsed && (
              <p className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {tx("Quick Links", "द्रुत लिङ्कहरू")}
              </p>
            )}
            <nav className="space-y-0.5">
              <Link
                href="/dashboard"
                onClick={onCloseMobile}
                className={externalLinkClass}
                title={collapsed ? tx("User Dashboard", "ड्यासबोर्ड") : undefined}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0 text-orange-500" />
                {!collapsed && <span>{tx("User Dashboard", "प्रयोगकर्ता ड्यासबोर्ड")}</span>}
              </Link>

              <Link
                href="/"
                onClick={onCloseMobile}
                className={externalLinkClass}
                title={collapsed ? tx("Home", "गृहपृष्ठ") : undefined}
              >
                <Home className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{tx("Platform Home", "गृहपृष्ठ")}</span>}
              </Link>
            </nav>
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

              {onSignOut && (
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
              {/* Desktop Collapse Button */}
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

              {onSignOut && (
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
