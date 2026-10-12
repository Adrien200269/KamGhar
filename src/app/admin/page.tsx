import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ShieldAlert, ArrowLeft, Lock } from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
import LanguageToggle from "@/components/language-toggle";
import {
  getAdminCaller,
  getAdminOverviewStats,
  getAdminUsersList,
  getAdminJobsList,
  getAdminKycSubmissions,
  getAdminTransactionsList,
  getDisputeConversations,
  getAdminReviewsList,
  getGeographicHeatmapData,
  getMarketplaceFunnelAnalytics,
  getAdminAuditLogs,
} from "@/app/actions/admin";
import AdminView from "./admin-view";
import AdminClaimButton from "./admin-claim-button";

export const metadata = {
  title: "Admin Console - KamGhar",
  description: "Platform management, user moderation, KYC verification, and transaction ledger.",
};

export default async function AdminPage() {
  const user = await getAdminCaller();

  // If not logged in, redirect to login
  if (!user) {
    redirect("/login?next=/admin");
  }

  // If logged in, but not yet an ADMIN
  if (user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
        <header className="border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <div className="dark:bg-white dark:rounded-xl dark:px-2.5 dark:py-1">
                <Image src="/logo.png" alt="KamGhar" width={110} height={36} priority className="h-7 w-auto object-contain" />
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <LanguageToggle />
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 mx-auto flex items-center justify-center shadow-xs">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Admin Console Access Required
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                You are currently logged in as <span className="font-semibold text-slate-700 dark:text-slate-300">{user.email}</span> with role <span className="font-bold text-orange-600">{user.role}</span>.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                The Admin Console is reserved for internal platform operators to manage KYC verifications, moderate job listings, and review featured payments.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Are you a platform operator or developer?
              </p>
              <AdminClaimButton />
            </div>

            <div className="pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to User Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fetch initial data in parallel
  const [
    statsRes,
    usersRes,
    jobsRes,
    kycRes,
    txRes,
    disputesRes,
    reviewsRes,
    heatmapRes,
    analyticsRes,
    auditLogs,
  ] = await Promise.all([
    getAdminOverviewStats(),
    getAdminUsersList(),
    getAdminJobsList(),
    getAdminKycSubmissions(),
    getAdminTransactionsList(),
    getDisputeConversations(),
    getAdminReviewsList(),
    getGeographicHeatmapData(),
    getMarketplaceFunnelAnalytics(),
    getAdminAuditLogs(),
  ]);

  const stats = statsRes.success && statsRes.data ? statsRes.data : {
    users: { total: 0, workers: 0, recruiters: 0, admins: 0 },
    jobs: { total: 0, open: 0, boosted: 0 },
    kyc: { pendingTotal: 0, pendingWorkers: 0, pendingRecruiters: 0 },
    monetization: { totalTransactions: 0, completedTransactions: 0, totalRevenue: 0, featuredWorkers: 0 },
  };

  const users = usersRes.success && usersRes.data ? usersRes.data : [];
  const jobs = jobsRes.success && jobsRes.data ? jobsRes.data : [];
  const kycList = kycRes.success && kycRes.data ? kycRes.data : [];
  const transactions = txRes.success && txRes.data ? txRes.data : [];
  const disputes = disputesRes.success && disputesRes.data ? disputesRes.data : [];
  const reviews = reviewsRes.success && reviewsRes.data ? reviewsRes.data : [];
  const heatmapData = heatmapRes.success && heatmapRes.data ? heatmapRes.data : { jobs: [], workers: [], hubs: [] };
  const analyticsData = analyticsRes.success && analyticsRes.data ? analyticsRes.data : null;

  return (
    <AdminView
      currentUser={user}
      stats={stats}
      users={users as any}
      jobs={jobs as any}
      kycList={kycList as any}
      transactions={transactions as any}
      disputes={disputes as any}
      reviews={reviews as any}
      heatmapData={heatmapData as any}
      analyticsData={analyticsData as any}
      auditLogs={auditLogs}
    />
  );
}
