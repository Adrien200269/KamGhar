import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, ArrowLeft, Loader2, Users } from "lucide-react";
import { getPublicWorkers } from "@/app/actions/profile";
import WorkersFeed from "./workers-feed";
import ThemeToggle from "@/components/theme-toggle";

export const metadata = {
  title: "Find Skilled Workers & Technicians in Nepal - KamGhar",
  description: "Browse verified local electricians, plumbers, carpenters, cleaners, and freelance talent across Nepal.",
};

export default async function WorkersPage() {
  const initialWorkers = await getPublicWorkers();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* ── Navbar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center">
              <div className="dark:bg-white dark:rounded-xl dark:px-2.5 dark:py-1 transition-all duration-200">
                <Image src="/logo.png" alt="KamGhar" width={120} height={40} priority className="h-8 w-auto object-contain" />
              </div>
            </Link>
            <span className="hidden sm:inline text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60">
              Worker Directory
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/jobs/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-orange-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Post a Job</span>
            </Link>

            <ThemeToggle />

            <Link
              href="/dashboard"
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

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
