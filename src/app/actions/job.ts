"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { CreateJobSchema, JobStatusSchema } from "@/lib/validations";

export type JobActionResult = {
  success: boolean;
  error?: string;
  jobId?: string;
};

/* ── Create a new Job ─────────────────────────────────────── */
export async function createJob(rawInput: unknown): Promise<JobActionResult> {
  const parseResult = CreateJobSchema.safeParse(rawInput);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.issues[0]?.message ?? "Invalid job details provided",
    };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Please log in to post a job." };
  }

  const { title, description, category, urgency, budget, latitude, longitude, address } = parseResult.data;

  try {
    // Ensure user exists in database and has a profile
    let dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { recruiterProfile: true },
    });

    if (!dbUser) {
      const name = user.user_metadata?.name || user.email?.split("@")[0] || "Recruiter";
      dbUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email!,
          role: "RECRUITER",
          recruiterProfile: {
            create: { name, address },
          },
        },
        include: { recruiterProfile: true },
      });
    } else if (dbUser.role !== "RECRUITER" && !dbUser.recruiterProfile) {
      // Create recruiter profile if they previously only had a worker profile
      const name = user.user_metadata?.name || user.email?.split("@")[0] || "Recruiter";
      await prisma.recruiterProfile.create({
        data: {
          userId: user.id,
          name,
          address,
        },
      });
    }

    const job = await prisma.job.create({
      data: {
        recruiterId: user.id,
        title,
        description,
        category,
        urgency,
        budget: budget ?? null,
        latitude,
        longitude,
        address,
        status: "OPEN",
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/jobs");

    return {
      success: true,
      jobId: job.id,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create job";
    console.error("Job creation error:", message);
    return { success: false, error: "An unexpected database error occurred. Please try again." };
  }
}

/* ── Update Job Status (OPEN, MATCHED, COMPLETED, CLOSED) ──── */
export async function updateJobStatus(
  jobId: string,
  rawStatus: unknown
): Promise<JobActionResult> {
  const parseResult = JobStatusSchema.safeParse(rawStatus);
  if (!parseResult.success) {
    return { success: false, error: "Invalid status" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return { success: false, error: "Job not found" };
    if (job.recruiterId !== user.id) return { success: false, error: "Not authorized to edit this job" };

    await prisma.job.update({
      where: { id: jobId },
      data: { status: parseResult.data },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update job status" };
  }
}

/* ── Delete a Job ─────────────────────────────────────────── */
export async function deleteJob(jobId: string): Promise<JobActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return { success: false, error: "Job not found" };
    if (job.recruiterId !== user.id) return { success: false, error: "Not authorized to delete this job" };

    await prisma.job.delete({ where: { id: jobId } });

    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete job" };
  }
}

/* ── Fetch Public Jobs with Filters ────────────────────────── */
export async function getJobs(filters?: {
  search?: string;
  category?: string;
  district?: string;
  urgency?: string;
  sort?: string;
}) {
  const where: any = {
    status: "OPEN",
  };

  if (filters?.category && filters.category !== "ALL") {
    where.category = filters.category;
  }

  if (filters?.urgency && filters.urgency !== "ALL") {
    where.urgency = filters.urgency;
  }

  if (filters?.district && filters.district !== "ALL") {
    where.address = {
      contains: filters.district,
      mode: "insensitive",
    };
  }

  if (filters?.search && filters.search.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { address: { contains: q, mode: "insensitive" } },
    ];
  }

  let orderBy: any = { createdAt: "desc" };
  if (filters?.sort === "budget_high") {
    orderBy = { budget: "desc" };
  } else if (filters?.sort === "budget_low") {
    orderBy = { budget: "asc" };
  }

  try {
    const jobs = await prisma.job.findMany({
      where,
      orderBy,
      include: {
        recruiter: {
          select: {
            id: true,
            email: true,
            recruiterProfile: {
              select: {
                name: true,
                businessName: true,
              },
            },
          },
        },
        applications: {
          select: {
            id: true,
            workerId: true,
          },
        },
      },
    });

    return jobs;
  } catch (err) {
    console.error("Failed to fetch jobs:", err);
    return [];
  }
}

/* ── Apply to a Job ────────────────────────────────────────── */
export async function applyToJob(input: {
  jobId: string;
  coverNote?: string;
  proposedRate?: number | null;
}): Promise<JobActionResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Please log in to apply for this job." };
  }

  const { jobId, coverNote, proposedRate } = input;

  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, recruiterId: true, status: true },
    });

    if (!job) {
      return { success: false, error: "Job not found." };
    }

    if (job.status !== "OPEN") {
      return { success: false, error: "This job is no longer accepting applications." };
    }

    if (job.recruiterId === user.id) {
      return { success: false, error: "You cannot apply to your own posted job." };
    }

    // Ensure user exists in database
    let dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { workerProfile: true },
    });

    if (!dbUser) {
      const name = user.user_metadata?.name || user.email?.split("@")[0] || "Worker";
      dbUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email!,
          role: "WORKER",
          workerProfile: {
            create: { name, skills: [] },
          },
        },
        include: { workerProfile: true },
      });
    }

    // Check if already applied
    const existing = await prisma.application.findUnique({
      where: {
        jobId_workerId: {
          jobId,
          workerId: user.id,
        },
      },
    });

    if (existing) {
      return { success: false, error: "You have already applied for this job." };
    }

    await prisma.application.create({
      data: {
        jobId,
        workerId: user.id,
        coverNote: coverNote?.trim() || null,
        proposedRate: proposedRate ?? null,
        status: "APPLIED",
      },
    });

    revalidatePath("/jobs");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Application error";
    console.error("Apply to job error:", msg);
    return { success: false, error: "Failed to submit application. Please try again." };
  }
}

/* ── Get Applied Job IDs for Current User ──────────────────── */
export async function getAppliedJobIds(): Promise<string[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    const applications = await prisma.application.findMany({
      where: { workerId: user.id },
      select: { jobId: true },
    });
    return applications.map((a) => a.jobId);
  } catch {
    return [];
  }
}