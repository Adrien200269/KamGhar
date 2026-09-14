import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import OnboardingWizard from "./onboarding-wizard";

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
    dbUser.role === "WORKER"
      ? dbUser.workerProfile?.name ?? ""
      : dbUser.recruiterProfile?.name ?? "";

  return (
    <OnboardingWizard
      role={dbUser.role}
      name={name}
      email={dbUser.email}
    />
  );
}