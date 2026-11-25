import { Suspense } from "react";
import HomeView from "@/components/home-view";
import { getActiveAds } from "@/app/actions/ads";

export const dynamic = "force-dynamic";

export default async function Home() {
  const landingAds = await getActiveAds("LANDING", "ALL");

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="h-10 w-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <HomeView ads={landingAds} />
    </Suspense>
  );
}
