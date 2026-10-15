import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getPublicWorkers } from "@/app/actions/profile";
import { createClient } from "@/lib/supabase/server";
import WorkersFeed from "./workers-feed";
import AppHeader from "@/components/app-header";

export const metadata = {
  title: "Find Skilled Workers & Technicians in Nepal - KamGhar",
  description: "Browse verified local electricians, plumbers, carpenters, cleaners, and freelance talent across Nepal.",
};

export default async function WorkersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/workers");
  }

  const initialWorkers = await getPublicWorkers();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <AppHeader badgeText="Worker Directory" badgeTextNe="कामदार सूची" isLoggedIn={true} />

      {/* ── Main Content ───────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <Suspense
          fallback={
            <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
              <p className="text-sm font-medium">Loading verified workers in Nepal...</p>
            </div>
          }
        >
          <WorkersFeed initialWorkers={initialWorkers as any} />
        </Suspense>
      </main>
    </div>
  );
}
