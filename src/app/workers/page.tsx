import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { getPublicWorkers, getCurrentUserProfile } from "@/app/actions/profile";
import WorkersFeed from "./workers-feed";
import JobsLayout from "@/app/jobs/jobs-layout";

export const metadata = {
  title: "Find Skilled Workers & Technicians in Nepal - KamGhar",
  description: "Browse verified local electricians, plumbers, carpenters, cleaners, and freelance talent across Nepal.",
};

export default async function WorkersPage() {
  const [dbUser, initialWorkers] = await Promise.all([
    getCurrentUserProfile(),
    getPublicWorkers(),
  ]);

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
    <JobsLayout user={layoutUser} breadcrumb="Worker Directory">
      <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
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
      </div>
    </JobsLayout>
  );
}
