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