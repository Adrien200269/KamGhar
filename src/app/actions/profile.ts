"use server";

import { revalidatePath } from "next/cache";
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

/* ── Update Profile Settings (Photo, Phone, Details) ────────── */
export async function updateUserProfileSettings(data: {
  name?: string;
  phone?: string;
  profilePhotoUrl?: string;
  address?: string;
  bio?: string;
  hourlyRate?: number | null;
  skills?: string[];
  businessName?: string;
}): Promise<ProfileActionResult> {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { success: false, error: "Not authenticated" };

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { workerProfile: true, recruiterProfile: true },
    });

    if (!dbUser) return { success: false, error: "User not found" };

    // Update phone on User model if provided
    if (data.phone !== undefined) {
      const trimmedPhone = data.phone.trim();
      if (trimmedPhone) {
        const existing = await prisma.user.findFirst({
          where: {
            phone: trimmedPhone,
            NOT: { id: user.id },
          },
        });
        if (existing) {
          return {
            success: false,
            error: "This phone number is already in use by another account.",
          };
        }
        await prisma.user.update({
          where: { id: user.id },
          data: { phone: trimmedPhone },
        });
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { phone: null },
        });
      }
    }

    const fallbackName = data.name?.trim() || user.user_metadata?.name || user.email?.split("@")[0] || "User";

    if (dbUser.role === "WORKER") {
      await prisma.workerProfile.upsert({
        where: { userId: user.id },
        update: {
          ...(data.name ? { name: data.name.trim() } : {}),
          ...(data.profilePhotoUrl !== undefined ? { profilePhotoUrl: data.profilePhotoUrl || null } : {}),
          ...(data.address !== undefined ? { address: data.address || null } : {}),
          ...(data.bio !== undefined ? { bio: data.bio || null } : {}),
          ...(data.hourlyRate !== undefined ? { hourlyRate: data.hourlyRate } : {}),
          ...(data.skills !== undefined ? { skills: data.skills } : {}),
        },
        create: {
          userId: user.id,
          name: fallbackName,
          profilePhotoUrl: data.profilePhotoUrl || null,
          address: data.address || null,
          bio: data.bio || null,
          hourlyRate: data.hourlyRate || null,
          skills: data.skills || [],
        },
      });
    } else {
      await prisma.recruiterProfile.upsert({
        where: { userId: user.id },
        update: {
          ...(data.name ? { name: data.name.trim() } : {}),
          ...(data.profilePhotoUrl !== undefined ? { profilePhotoUrl: data.profilePhotoUrl || null } : {}),
          ...(data.address !== undefined ? { address: data.address || null } : {}),
          ...(data.businessName !== undefined ? { businessName: data.businessName || null } : {}),
        },
        create: {
          userId: user.id,
          name: fallbackName,
          profilePhotoUrl: data.profilePhotoUrl || null,
          address: data.address || null,
          businessName: data.businessName || null,
        },
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/workers");
    return { success: true };
  } catch (err) {
    console.error("Update profile error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to update profile." };
  }
}

/* ── Change Account Password ───────────────────────────────── */
export async function changeAccountPassword(newPassword: string): Promise<ProfileActionResult> {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { success: false, error: "Not authenticated" };

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "Password must be at least 6 characters long." };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/* ── Get current user + profile for dashboard ───────────────── */
const userWithProfileInclude = {
  workerProfile: true,
  recruiterProfile: true,
  postedJobs: {
    orderBy: { createdAt: "desc" as const },
    take: 20,
    include: {
      applications: {
        orderBy: { createdAt: "desc" as const },
        include: {
          worker: {
            select: {
              id: true,
              email: true,
              phone: true,
              workerProfile: {
                select: {
                  name: true,
                  bio: true,
                  skills: true,
                  hourlyRate: true,
                  rating: true,
                  reviewCount: true,
                  address: true,
                  profilePhotoUrl: true,
                },
              },
            },
          },
        },
      },
    },
  },
  applications: {
    orderBy: { createdAt: "desc" as const },
    take: 20,
    include: {
      job: {
        select: {
          id: true,
          title: true,
          description: true,
          address: true,
          latitude: true,
          longitude: true,
          status: true,
          budget: true,
          category: true,
          urgency: true,
          recruiter: {
            select: {
              id: true,
              email: true,
              phone: true,
              recruiterProfile: {
                select: {
                  name: true,
                  businessName: true,
                  address: true,
                  profilePhotoUrl: true,
                },
              },
            },
          },
        },
      },
    },
  },
};

export async function getCurrentUserProfile() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  let dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: userWithProfileInclude,
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
        include: userWithProfileInclude,
      });
    } catch {
      // Fallback in case of race condition
      dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: userWithProfileInclude,
      });
    }
  }

  return dbUser;
}

/* ── Fetch Public Workers Directory ───────────────────────── */
export async function getPublicWorkers(filters?: {
  skill?: string;
  district?: string;
  search?: string;
}) {
  const where: any = {};

  if (filters?.skill && filters.skill !== "ALL") {
    where.skills = { has: filters.skill };
  }

  if (filters?.district && filters.district !== "ALL") {
    where.address = { contains: filters.district, mode: "insensitive" };
  }

  if (filters?.search && filters.search.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { bio: { contains: q, mode: "insensitive" } },
      { address: { contains: q, mode: "insensitive" } },
    ];
  }

  try {
    const workers = await prisma.workerProfile.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { rating: "desc" }, { createdAt: "desc" }],
      include: {
        user: {
          select: {
            email: true,
            phone: true,
          },
        },
      },
    });
    return workers;
  } catch (err) {
    console.error("Failed to fetch workers:", err);
    return [];
  }
}