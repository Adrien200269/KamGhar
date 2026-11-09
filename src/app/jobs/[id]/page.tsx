import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getJobById } from "@/app/actions/job";
import JobDetailsView from "./job-details-view";

interface JobPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: JobPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getJobById(id);

  if (!result || !result.job) {
    return {
      title: "Gig Listing Not Found - KamGhar",
      description: "This job listing is no longer available on KamGhar.",
    };
  }

  const { job } = result;
  const budgetStr = job.budget ? `Rs. ${job.budget.toLocaleString()}` : "Negotiable";

  return {
    title: `${job.title} in ${job.address} — KamGhar Nepal`,
    description: `Category: ${job.category} • Budget: ${budgetStr} • Urgent gig opportunity in ${job.address}. Apply or contact directly on KamGhar.`,
    openGraph: {
      title: `${job.title} (${job.category})`,
      description: `Budget: ${budgetStr} • Location: ${job.address}. Discover freelance and gig work on KamGhar.`,
      type: "website",
    },
  };
}

export default async function JobPage({ params }: JobPageProps) {
  const { id } = await params;
  const data = await getJobById(id);

  if (!data || !data.job) {
    notFound();
  }

  return <JobDetailsView data={data} />;
}
