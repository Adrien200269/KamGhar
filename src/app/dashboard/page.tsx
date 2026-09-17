import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/app/actions/profile";
import DashboardView from "./dashboard-view";

export const metadata = {
  title: "Dashboard - KamGhar",
  description: "Manage your gigs, jobs, and profile on KamGhar.",
};

export default async function DashboardPage() {
  const user = await getCurrentUserProfile();
  if (!user) redirect("/login");

  return <DashboardView user={user} />;
}