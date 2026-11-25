import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/app/actions/profile";
import { getActiveAds } from "@/app/actions/ads";
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

  if (!skipOnboarding && user.role !== "ADMIN") {
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

  const adAudience =
    user.role === "WORKER"
      ? "WORKER"
      : user.role === "RECRUITER"
      ? "RECRUITER"
      : "ALL";
  const dashboardAds = await getActiveAds("DASHBOARD", adAudience);

  return <DashboardView user={user} ads={dashboardAds} />;
}
