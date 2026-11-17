import { Metadata } from "next";
import { getCurrentUserProfile } from "@/app/actions/profile";
import RateGuideView from "./rate-guide-view";
import JobsLayout from "@/app/jobs/jobs-layout";

export const metadata: Metadata = {
  title: "कति पर्ला? Rate Guide - KamGhar",
  description:
    "Standard market price benchmarks for informal trades across Nepal (Electricians, Plumbers, Painters, Carpenters, Cleaners, Technicians).",
  openGraph: {
    title: "कति पर्ला? Nepali Fair Market Rate Estimator",
    description: "Benchmark labor and service rates across Kathmandu Valley and Nepal.",
  },
};

export default async function RateGuidePage() {
  const dbUser = await getCurrentUserProfile();

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
    <JobsLayout user={layoutUser} breadcrumb="कति पर्ला? Rate Guide">
      <RateGuideView />
    </JobsLayout>
  );
}
