"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export type ProfileActionResult = {
  success: boolean;
  error?: string;
};


/* ── Complete Worker Onboarding ─────────────────────────────── */
export async function completeWorkerOnboarding(data: {
  bio: string;
  skills: string[];
  hourlyRate: number | null;
  address: string;
}): Promise<ProfileActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const fallbackName = user.user_metadata?.name || user.email?.split("@")[0] || "Worker";
    await prisma.workerProfile.upsert({
      where: { userId: user.id },
      update: {
        bio: data.bio || null,
        skills: data.skills,
        hourlyRate: data.hourlyRate,
        address: data.address || null,
      },
      create: {
        userId: user.id,
        name: fallbackName,
        bio: data.bio || null,
        skills: data.skills,
        hourlyRate: data.hourlyRate,
        address: data.address || null,
      },
    });
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Database error";
    return { success: false, error: msg };
  }
}

/* ── Complete Recruiter Onboarding ──────────────────────────── */
export async function completeRecruiterOnboarding(data: {
  bio?: string;
  businessName: string;
  address: string;
}): Promise<ProfileActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const fallbackName = user.user_metadata?.name || user.email?.split("@")[0] || "Recruiter";
    await prisma.recruiterProfile.upsert({
      where: { userId: user.id },
      update: {
        businessName: data.businessName || null,
        address: data.address || null,
      },
      create: {
        userId: user.id,
        name: fallbackName,
        businessName: data.businessName || null,
        address: data.address || null,
      },
    });
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Database error";
    return { success: false, error: msg };
  }
}

/* ── Get current user + profile for dashboard ───────────────── */
export async function getCurrentUserProfile() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  let dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      workerProfile: true,
      recruiterProfile: true,
      postedJobs: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      applications: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { job: { select: { title: true, address: true, status: true } } },
      },
    },
  });

  if (!dbUser && user.email) {
    const role = (user.user_metadata?.role as "WORKER" | "RECRUITER") || "WORKER";
    const name = user.user_metadata?.name || user.email.split("@")[0];
    try {
      dbUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          role,
          ...(role === "WORKER"
            ? { workerProfile: { create: { name, skills: [] } } }
            : { recruiterProfile: { create: { name } } }),
        },
        include: {
          workerProfile: true,
          recruiterProfile: true,
          postedJobs: true,
          applications: { include: { job: { select: { title: true, address: true, status: true } } } },
        },
      });
    } catch {
      // Ignore conflict
    }
  }

  return dbUser;
}