import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { getJobs, getAppliedJobIds } from "@/app/actions/job";
import { createClient } from "@/lib/supabase/server";
import JobsFeed from "./jobs-feed";
import JobsLayout from "./jobs-layout";

export const metadata = {
  title: "Browse Jobs & Gigs in Nepal - KamGhar",
  description: "Find nearby freelance work, repair jobs, domestic gigs, and trade opportunities across Nepal.",
};

export default async function JobsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch worker/recruiter profile name & photo if logged in
  let profileName: string | null = null;
  let profilePhoto: string | null = null;
  let userRole = "WORKER";

  if (user) {
    const { data: dbUser } = await supabase
      .from("User")
      .select(`
        role,
        workerProfile:WorkerProfile(name, profilePhotoUrl),
        recruiterProfile:RecruiterProfile(name, profilePhotoUrl)
      `)
      .eq("id", user.id)
      .single();

    if (dbUser) {
      userRole = dbUser.role;
      const wp = Array.isArray(dbUser.workerProfile) ? dbUser.workerProfile[0] : dbUser.workerProfile;
      const rp = Array.isArray(dbUser.recruiterProfile) ? dbUser.recruiterProfile[0] : dbUser.recruiterProfile;
      const profile = dbUser.role === "WORKER" ? wp : rp;
      profileName = profile?.name ?? null;
      profilePhoto = profile?.profilePhotoUrl ?? null;
    }
  }

  const [initialJobs, appliedJobIds] = await Promise.all([
    getJobs(),
    user ? getAppliedJobIds(user.id) : Promise.resolve([]),
  ]);

  const layoutUser = user
    ? {
        id: user.id,
        email: user.email ?? "",
        role: userRole,
        name: profileName,
        photoUrl: profilePhoto,
      }
    : null;

  return (
    <JobsLayout user={layoutUser}>
      <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <Suspense
          fallback={
            <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
              <p className="text-sm font-medium">Loading nearby gigs across Nepal...</p>
            </div>
          }
        >
          <JobsFeed
            initialJobs={initialJobs}
            appliedJobIds={appliedJobIds}
            isLoggedIn={!!user}
          />
        </Suspense>
      </div>
    </JobsLayout>
  );
}