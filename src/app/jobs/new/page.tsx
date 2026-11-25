import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import LiquidGlassNewJobPopup from "./liquid-glass-new-job-popup";

export const metadata = {
  title: "Post a Job - KamGhar",
  description:
    "Post a new gig or job requirement and connect with nearby workers in Nepal.",
};

export default async function NewJobPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/jobs/new");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { recruiterProfile: true, workerProfile: true },
  });

  if (dbUser?.role === "WORKER") {
    redirect("/dashboard?error=worker_post_restricted");
  }

  const defaultDistrict = dbUser?.recruiterProfile?.address || "Kathmandu";

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-slate-50 to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-200">
      <LiquidGlassNewJobPopup defaultDistrict={defaultDistrict} />
    </div>
  );
}
