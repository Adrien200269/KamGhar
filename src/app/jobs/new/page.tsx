import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import JobPostForm from "./job-post-form";
import ThemeToggle from "@/components/theme-toggle";

export const metadata = {
  title: "Post a Job - KamGhar",
  description: "Post a new gig or job requirement and connect with nearby workers in Nepal.",
};

export default async function NewJobPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/jobs/new");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { recruiterProfile: true, workerProfile: true },
  });

  if (dbUser?.role === "WORKER") {
    redirect("/dashboard?error=worker_post_restricted");
  }

  const defaultDistrict = dbUser?.recruiterProfile?.address || "Kathmandu";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Background glow effects */}
      <div className="pointer-events-none fixed -top-40 -right-40 w-96 h-96 bg-orange-200/30 dark:bg-orange-500/5 rounded-full blur-3xl" />
      <div className="pointer-events-none fixed -bottom-40 -left-40 w-96 h-96 bg-blue-200/30 dark:bg-blue-500/5 rounded-full blur-3xl" />

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        <JobPostForm defaultDistrict={defaultDistrict} />
      </main>
    </div>
  );
}