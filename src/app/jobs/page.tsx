import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { getJobs, getAppliedJobIds } from "@/app/actions/job";
import { getCurrentUserProfile } from "@/app/actions/profile";
import JobsFeed from "./jobs-feed";
import JobsLayout from "./jobs-layout";

export const metadata = {
  title: "Browse Jobs & Gigs in Nepal - KamGhar",
  description: "Find nearby freelance work, repair jobs, domestic gigs, and trade opportunities across Nepal.",
};

export default async function JobsPage() {
  const [dbUser, initialJobs] = await Promise.all([
    getCurrentUserProfile(),
    getJobs(),
  ]);

  const appliedJobIds = dbUser
    ? await getAppliedJobIds(dbUser.id)
    : [];

  const profile = dbUser?.role === "WORKER"
    ? dbUser.workerProfile
    : dbUser?.recruiterProfile;

  const layoutUser = dbUser
    ? {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        name: profile?.name ?? null,
        photoUrl: profile?.profilePhotoUrl ?? null,
      }
    : null;

  return (
    <JobsLayout user={layoutUser}>
      <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
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
            isLoggedIn={!!dbUser}
          />
        </Suspense>
      </div>
    </JobsLayout>
  );
}