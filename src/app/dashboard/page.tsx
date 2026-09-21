import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/app/actions/profile";
import DashboardView from "./dashboard-view";

export const metadata = {
  title: "Dashboard - KamGhar",
  description: "Manage your gigs, jobs, and profile on KamGhar.",
};

export default async function DashboardPage(props: {
  searchParams: Promise<{ skipOnboarding?: string }>;
}) {
  const user = await getCurrentUserProfile();
  if (!user) redirect("/login");

  const searchParams = await props.searchParams;
  const skipOnboarding = searchParams?.skipOnboarding === "true";

  if (!skipOnboarding) {
    const isWorker = user.role === "WORKER";
    const isOnboarded = isWorker
      ? Boolean(
          user.workerProfile?.address &&
            user.workerProfile.skills &&
            user.workerProfile.skills.length > 0
        )
      : Boolean(
          user.recruiterProfile?.address &&
            user.recruiterProfile?.businessName
        );

    if (!isOnboarded) {
      redirect("/onboarding");
    }
  }

  return <DashboardView user={user} />;
}