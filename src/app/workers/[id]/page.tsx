import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getWorkerById } from "@/app/actions/profile";
import WorkerProfileView from "./worker-profile-view";

interface WorkerPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: WorkerPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getWorkerById(id);

  if (!result || !result.worker || !result.worker.workerProfile) {
    return {
      title: "Worker Profile Not Found - KamGhar",
      description: "This worker profile could not be found on KamGhar.",
    };
  }

  const profile = result.worker.workerProfile!;
  const skills = profile.skills.length > 0 ? profile.skills.slice(0, 3).join(", ") : "Professional Gig Services";

  return {
    title: `${profile.name} — ${skills} on KamGhar`,
    description: `${profile.name} offers ${skills} in ${profile.address || "Nepal"}. Rating: ${profile.rating.toFixed(1)}/5 (${profile.reviewCount} reviews). Hire directly on KamGhar.`,
    openGraph: {
      title: `${profile.name} (${skills})`,
      description: `Verified Freelancer & Skilled Worker on KamGhar. Location: ${profile.address || "Nepal"}.`,
      images: profile.profilePhotoUrl ? [{ url: profile.profilePhotoUrl }] : [],
    },
  };
}

export default async function WorkerPage({ params }: WorkerPageProps) {
  const { id } = await params;
  const data = await getWorkerById(id);

  if (!data || !data.worker || !data.worker.workerProfile) {
    notFound();
  }

  return <WorkerProfileView data={data as any} />;
}
