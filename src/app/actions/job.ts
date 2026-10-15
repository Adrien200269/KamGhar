"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { CreateJobSchema, JobStatusSchema } from "@/lib/validations";
import { sendHiredEmail } from "@/lib/email";

export type JobActionResult = {
  success: boolean;
  error?: string;
  jobId?: string;
  broadcastCount?: number;
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

  const { title, description, category, urgency, budget, latitude, longitude, address, audioUrl } = parseResult.data;

  try {
    // Ensure user exists in database and has a profile
    let dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { recruiterProfile: true },
    });

    if (dbUser && dbUser.role === "WORKER") {
      return {
        success: false,
        error: "Only recruiter accounts can post jobs. Workers can explore and apply to open gigs.",
      };
    }

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
    } else if (!dbUser.recruiterProfile) {
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
        audioUrl: audioUrl || null,
        status: "OPEN",
      },
    });

    // If urgent broadcast, count nearby available/verified workers within 5km radius
    let broadcastCount = 0;
    if (urgency === "URGENT") {
      const nearbyWorkers = await prisma.workerProfile.findMany({
        where: {
          latitude: { not: null },
          longitude: { not: null },
          OR: [{ isAvailableNow: true }, { kycStatus: "VERIFIED" }],
        },
        select: {
          id: true,
          userId: true,
          latitude: true,
          longitude: true,
        },
      });

      // Filter by 5km radius
      const { calculateHaversineDistanceKm } = await import("@/lib/geo");
      const matchedWorkers = nearbyWorkers.filter((w) => {
        if (!w.latitude || !w.longitude) return false;
        const dist = calculateHaversineDistanceKm(latitude, longitude, w.latitude, w.longitude);
        return dist <= 5;
      });

      broadcastCount = matchedWorkers.length;

      // Dispatch urgent in-app broadcast alerts to nearby workers
      for (const w of matchedWorkers.slice(0, 10)) {
        prisma.notification
          .create({
            data: {
              userId: w.userId,
              type: "URGENT_BROADCAST",
              title: `🚨 Urgent Gig Alert: ${title}`,
              titleNe: `🚨 आपतकालीन काम: ${title}`,
              message: `Urgent requirement in ${address} • Budget Rs. ${budget || "Negotiable"}`,
              messageNe: `${address} मा तत्काल आवश्यक • बजेट रु. ${budget || "सहमति अनुसार"}`,
              link: "/jobs",
              isRead: false,
            },
          })
          .catch(() => {});
      }
    }

    revalidatePath("/dashboard");
    revalidatePath("/jobs");

    return {
      success: true,
      jobId: job.id,
      broadcastCount,
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

/* ── Recruiter Updates Application Status (ACCEPT / DECLINE) ── */
export async function updateApplicationStatus(
  applicationId: string,
  status: "ACCEPTED" | "DECLINED"
): Promise<JobActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          include: {
            recruiter: {
              include: {
                recruiterProfile: true,
              },
            },
          },
        },
        worker: {
          include: {
            workerProfile: true,
          },
        },
      },
    });

    if (!application) {
      return { success: false, error: "Application not found" };
    }

    if (application.job.recruiterId !== user.id) {
      return { success: false, error: "You can only manage applicants for your own jobs." };
    }

    await prisma.application.update({
      where: { id: applicationId },
      data: { status },
    });

    if (status === "ACCEPTED") {
      if (application.job.status === "OPEN") {
        await prisma.job.update({
          where: { id: application.jobId },
          data: { status: "MATCHED" },
        });
      }

      // Auto-dispatch hire notification email to worker's Gmail
      try {
        await sendHiredEmail({
          workerEmail: application.worker.email,
          workerName:
            application.worker.workerProfile?.name ||
            application.worker.email.split("@")[0],
          jobTitle: application.job.title,
          category: application.job.category,
          location: application.job.address,
          budgetOrRate: application.proposedRate ?? application.job.budget,
          recruiterName:
            application.job.recruiter.recruiterProfile?.name ||
            application.job.recruiter.email.split("@")[0],
          recruiterBusiness:
            application.job.recruiter.recruiterProfile?.businessName,
          recruiterEmail: application.job.recruiter.email,
          recruiterPhone: application.job.recruiter.phone,
        });
      } catch (mailError) {
        console.error("Non-blocking error dispatching hire email:", mailError);
      }

      // In-app Notification for worker
      prisma.notification
        .create({
          data: {
            userId: application.workerId,
            type: "APPLICATION_STATUS",
            title: "Application Accepted! 🎉",
            titleNe: "आवेदन स्वीकृत भयो! 🎉",
            message: `Your application for "${application.job.title}" has been accepted! You can now coordinate directly.`,
            messageNe: `"${application.job.title}" को लागि तपाईंको आवेदन स्वीकृत भयो! अब प्रत्यक्ष कुरा गर्न सक्नुहुन्छ।`,
            link: "/dashboard",
            isRead: false,
          },
        })
        .catch(() => {});
    } else if (status === "DECLINED") {
      prisma.notification
        .create({
          data: {
            userId: application.workerId,
            type: "APPLICATION_STATUS",
            title: "Application Update",
            titleNe: "आवेदन जानकारी",
            message: `Your application status for "${application.job.title}" was updated to declined.`,
            messageNe: `"${application.job.title}" को लागि तपाईंको आवेदन अस्वीकृत भयो।`,
            link: "/dashboard",
            isRead: false,
          },
        })
        .catch(() => {});
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error("Update application status error:", err);
    return { success: false, error: "Failed to update application status" };
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
                profilePhotoUrl: true,
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
  audioUrl?: string | null;
}): Promise<JobActionResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Please log in to apply for this job." };
  }

  const { jobId, coverNote, proposedRate, audioUrl } = input;

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
        audioUrl: audioUrl?.trim() || null,
        proposedRate: proposedRate ?? null,
        status: "APPLIED",
      },
    });

    // Notify recruiter of new applicant (non-blocking)
    prisma.notification
      .create({
        data: {
          userId: job.recruiterId,
          type: "JOB_APPLICATION",
          title: "New Job Applicant! 💼",
          titleNe: "नयाँ कामदारको आवेदन! 💼",
          message: `${dbUser.workerProfile?.name || "A worker"} applied for your job with proposed rate Rs. ${proposedRate || "Negotiable"}.`,
          messageNe: `${dbUser.workerProfile?.name || "कामदार"} ले तपाईंको कामको लागि रु. ${proposedRate || "सहमति अनुसार"} मा आवेदन दिनुभयो।`,
          link: "/dashboard",
          isRead: false,
        },
      })
      .catch(() => {});

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

/* ── Fetch Real Field Logs for Home Notebook ──────────────── */
export type FieldLogItem = {
  time: string;
  category: string;
  title: string;
  titleNe: string;
  location: string;
  fee: string;
  status: string;
  notes: string;
};

export async function getRealFieldLogs(): Promise<FieldLogItem[]> {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        applications: {
          where: { status: "ACCEPTED" },
          select: { proposedRate: true },
        },
      },
    });

    return jobs.map((job) => {
      const created = new Date(job.createdAt);
      const now = new Date();
      const isToday = created.toDateString() === now.toDateString();
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      const isYesterday = yesterday.toDateString() === created.toDateString();

      let timeStr: string;
      if (isToday) {
        timeStr = created.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      } else if (isYesterday) {
        timeStr = "Yesterday";
      } else {
        timeStr = created.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }

      const acceptedApp = job.applications[0];
      const feeAmount = acceptedApp?.proposedRate || job.budget;
      const fee = feeAmount ? `NPR ${feeAmount.toLocaleString()}` : "NPR 1,200";

      let cleanLocation = "Kathmandu";
      if (job.address) {
        const parts = job.address.split(",").map((p) => p.trim()).filter(Boolean);
        cleanLocation = parts.slice(0, 2).join(", ");
      }

      let titleNe = job.title;
      const lower = job.title.toLowerCase();
      if (lower.includes("fridge")) {
        titleNe = "फ्रिज मर्मतका लागि इलेक्ट्रीसियन";
      } else if (lower.includes("painting")) {
        titleNe = "क्याफेको लागि एनिमे थिम भित्ते चित्रकला";
      } else if (lower.includes("teacher") || lower.includes("science")) {
        titleNe = "कक्षा १० को लागि विज्ञान र गणित शिक्षक";
      } else if (lower.includes("plumber") || lower.includes("sink")) {
        titleNe = "भान्साको सिंक ड्रेन सफाइ तथा मर्मत";
      } else if (lower.includes("toilet") || lower.includes("cleaner")) {
        titleNe = "शौचालय तथा बाथरुम विशेष सरसफाइ";
      } else if (lower.includes("electrician")) {
        titleNe = "विद्युत् तथा टिभी उपकरण मर्मत";
      } else if (lower.includes("software")) {
        titleNe = "डिजिटल सफ्टवेयर अपडेट सेवा";
      }

      return {
        time: timeStr,
        category: job.category || "General",
        title: job.title,
        titleNe,
        location: cleanLocation,
        fee,
        status: job.status === "COMPLETED" ? "Completed" : job.status === "MATCHED" ? "Matched" : "Dispatched",
        notes: job.description ? (job.description.length > 85 ? job.description.slice(0, 85) + "..." : job.description) : "On-site service completed.",
      };
    });
  } catch (err) {
    console.error("Error fetching real field logs:", err);
    return [];
  }
}