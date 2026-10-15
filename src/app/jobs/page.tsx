import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { getJobs, getAppliedJobIds } from "@/app/actions/job";
import { createClient } from "@/lib/supabase/server";
import JobsFeed from "./jobs-feed";
import AppHeader from "@/components/app-header";

export const metadata = {
  title: "Browse Jobs & Gigs in Nepal - KamGhar",
  description: "Find nearby freelance work, repair jobs, domestic gigs, and trade opportunities across Nepal.",
};

export default async function JobsPage() {
  const supabase = await createClient();
  const [{ data: { user } }, initialJobs, appliedJobIds] = await Promise.all([
    supabase.auth.getUser(),
    getJobs(),
    getAppliedJobIds(),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <AppHeader
        badgeText="Gig Explorer"
        badgeTextNe="गिग खोजकर्ता"
        isLoggedIn={!!user}
      />

      {/* ── Main Content ───────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <Suspense
          fallback={
            <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
              <p className="text-sm font-medium">Loading nearby gigs across Nepal...</p>
            </div>
          }
        >
          <JobsFeed
            initialJobs={initialJobs}
            appliedJobIds={appliedJobIds}
            isLoggedIn={!!user}
          />
        </Suspense>
      </main>
    </div>
  );
}