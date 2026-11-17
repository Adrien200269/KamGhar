import { Suspense } from "react";
import { getJobs, getAppliedJobIds } from "@/app/actions/job";
import { getCurrentUserProfile } from "@/app/actions/profile";
import JobsFeed from "./jobs-feed";
import JobsLayout from "./jobs-layout";
import LoadingAnimation from "@/components/loading-animation";

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
            <div className="h-96 flex items-center justify-center">
              <LoadingAnimation compact />
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