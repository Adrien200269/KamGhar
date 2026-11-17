import { Suspense } from "react";
import { getPublicWorkers, getCurrentUserProfile } from "@/app/actions/profile";
import WorkersFeed from "./workers-feed";
import JobsLayout from "@/app/jobs/jobs-layout";
import LoadingAnimation from "@/components/loading-animation";

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
            <div className="h-96 flex items-center justify-center">
              <LoadingAnimation
                compact
                label="खोज्दैछ • Loading verified workers in Nepal..."
                sublabel="Connecting with certified electricians, plumbers & trades"
              />
            </div>
          }
        >
          <WorkersFeed initialWorkers={initialWorkers as any} />
        </Suspense>
      </div>
    </JobsLayout>
  );
}
