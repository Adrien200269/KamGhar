import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import WorkerOnboarding from "./worker-onboarding";
import RecruiterOnboarding from "./recruiter-onboarding";

export const metadata = {
  title: "Complete Your Profile - KamGhar",
  description: "Set up your KamGhar profile to start finding work or hiring.",
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      workerProfile: true,
      recruiterProfile: true,
    },
  });

  if (!dbUser) redirect("/login");

  const name =
    (dbUser.role === "WORKER"
      ? dbUser.workerProfile?.name
      : dbUser.recruiterProfile?.name) ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Friend";

  if (dbUser.role === "RECRUITER") {
    const recruiterData = {
      bio: "",
      address: dbUser.recruiterProfile?.address ?? "",
      latitude: dbUser.recruiterProfile?.latitude ?? null,
      longitude: dbUser.recruiterProfile?.longitude ?? null,
      profilePhotoUrl: dbUser.recruiterProfile?.profilePhotoUrl ?? "",
      businessName: dbUser.recruiterProfile?.businessName ?? "",
    };

    return (
      <RecruiterOnboarding
        name={name}
        email={dbUser.email}
        initialData={recruiterData}
      />
    );
  }

  // Default to WORKER
  const workerData = {
    bio: dbUser.workerProfile?.bio ?? "",
    address: dbUser.workerProfile?.address ?? "",
    latitude: dbUser.workerProfile?.latitude ?? null,
    longitude: dbUser.workerProfile?.longitude ?? null,
    profilePhotoUrl: dbUser.workerProfile?.profilePhotoUrl ?? "",
    skills: dbUser.workerProfile?.skills ?? [],
    hourlyRate: dbUser.workerProfile?.hourlyRate ? String(dbUser.workerProfile.hourlyRate) : "",
  };

  return (
    <WorkerOnboarding
      name={name}
      email={dbUser.email}
      initialData={workerData}
    />
  );
}