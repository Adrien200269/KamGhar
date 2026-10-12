"use server";

import { revalidatePath } from "next/cache";
import { ApplicationStatus } from "@prisma/client";
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
  latitude?: number | null;
  longitude?: number | null;
  profilePhotoUrl?: string | null;
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
        ...(data.latitude !== undefined ? { latitude: data.latitude } : {}),
        ...(data.longitude !== undefined ? { longitude: data.longitude } : {}),
        ...(data.profilePhotoUrl !== undefined ? { profilePhotoUrl: data.profilePhotoUrl || null } : {}),
      },
      create: {
        userId: user.id,
        name: fallbackName,
        bio: data.bio || null,
        skills: data.skills,
        hourlyRate: data.hourlyRate,
        address: data.address || null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        profilePhotoUrl: data.profilePhotoUrl || null,
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
  latitude?: number | null;
  longitude?: number | null;
  profilePhotoUrl?: string | null;
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
        ...(data.latitude !== undefined ? { latitude: data.latitude } : {}),
        ...(data.longitude !== undefined ? { longitude: data.longitude } : {}),
        ...(data.profilePhotoUrl !== undefined ? { profilePhotoUrl: data.profilePhotoUrl || null } : {}),
      },
      create: {
        userId: user.id,
        name: fallbackName,
        businessName: data.businessName || null,
        address: data.address || null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        profilePhotoUrl: data.profilePhotoUrl || null,
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
export async function changeAccountPassword(
  newPasswordOrOld: string,
  maybeNewPassword?: string
): Promise<ProfileActionResult> {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user || !user.email) return { success: false, error: "Not authenticated" };

  const isTwoArg = typeof maybeNewPassword === "string";
  const oldPassword = isTwoArg ? newPasswordOrOld : "";
  const newPassword = isTwoArg ? maybeNewPassword : newPasswordOrOld;

  if (isTwoArg && !oldPassword) {
    return { success: false, error: "Current password is required." };
  }

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "New password must be at least 6 characters long." };
  }

  if (isTwoArg && oldPassword === newPassword) {
    return { success: false, error: "New password cannot be the same as your current password." };
  }

  // If old password provided, verify it first
  if (oldPassword) {
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: oldPassword,
    });

    if (signInErr) {
      return { success: false, error: "Current password is incorrect." };
    }
  }

  // Update password on current user session
  const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
  if (updateErr) {
    return { success: false, error: updateErr.message };
  }

  return { success: true };
}

/* ── Upload Worker CV ──────────────────────────────────────── */
export async function uploadWorkerCV(
  formData: FormData
): Promise<ProfileActionResult & { cvUrl?: string }> {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { success: false, error: "Not authenticated" };

  const file = formData.get("cv") as File | null;
  if (!file) return { success: false, error: "No file provided" };
  if (file.type !== "application/pdf")
    return { success: false, error: "Only PDF files are allowed" };
  if (file.size > 5 * 1024 * 1024)
    return { success: false, error: "File must be smaller than 5 MB" };

  const filePath = `${user.id}/cv.pdf`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadErr } = await supabase.storage
    .from("cvs")
    .upload(filePath, arrayBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadErr) {
    console.error("CV upload error:", uploadErr);
    return { success: false, error: uploadErr.message };
  }

  const { data: urlData } = supabase.storage.from("cvs").getPublicUrl(filePath);
  const cvUrl = urlData?.publicUrl;

  await prisma.workerProfile.update({
    where: { userId: user.id },
    data: { cvUrl },
  });

  revalidatePath("/dashboard");
  return { success: true, cvUrl };
}

/* ── Remove Worker CV ──────────────────────────────────────── */
export async function removeWorkerCV(): Promise<ProfileActionResult> {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { success: false, error: "Not authenticated" };

  const filePath = `${user.id}/cv.pdf`;
  await supabase.storage.from("cvs").remove([filePath]);

  await prisma.workerProfile.update({
    where: { userId: user.id },
    data: { cvUrl: null },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

/* ── Send Phone OTP ────────────────────────────────────────── */
export async function sendPhoneOtp(
  phone: string
): Promise<ProfileActionResult> {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { success: false, error: "Not authenticated" };

  // Normalise: ensure +977 country code for Nepal if no + prefix
  const cleaned = phone.replace(/[\s-]/g, "");
  const normalisedPhone = cleaned.startsWith("+") ? cleaned : `+977${cleaned.replace(/^0/, "")}`;

  try {
    const timeoutPromise = new Promise<{ error: { message: string } }>((resolve) =>
      setTimeout(
        () =>
          resolve({
            error: {
              message:
                "SMS gateway timed out (15s). Check your Textlocal Sender ID or provider credentials in Supabase.",
            },
          }),
        15000
      )
    );

    const otpPromise = supabase.auth.signInWithOtp({
      phone: normalisedPhone,
    });

    const { error } = await Promise.race([otpPromise, timeoutPromise]);

    if (error) {
      console.error("Send OTP error:", error);
      let userMsg = error.message;
      if (error.message.includes("upstream request timeout") || error.message.includes("504")) {
        userMsg = "The SMS provider timed out. Please ensure your Textlocal Sender Name is set, or switch to Twilio.";
      }
      return { success: false, error: userMsg };
    }

    // Store the normalised phone on the user row so it's ready after verification
    const existing = await prisma.user.findFirst({
      where: { phone: normalisedPhone, NOT: { id: user.id } },
    });
    if (existing) {
      return { success: false, error: "This phone number is already in use by another account." };
    }
    await prisma.user.update({ where: { id: user.id }, data: { phone: normalisedPhone } });

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to dispatch SMS OTP.";
    return { success: false, error: msg };
  }
}

/* ── Verify Phone OTP ──────────────────────────────────────── */
export async function verifyPhoneOtp(
  phone: string,
  token: string
): Promise<ProfileActionResult> {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { success: false, error: "Not authenticated" };

  const normalisedPhone = phone.startsWith("+") ? phone : `+977${phone.replace(/^0/, "")}`;

  try {
    const timeoutPromise = new Promise<{ error: { message: string } }>((resolve) =>
      setTimeout(
        () =>
          resolve({
            error: {
              message: "Verification timed out. Please try again.",
            },
          }),
        15000
      )
    );

    const verifyPromise = supabase.auth.verifyOtp({
      phone: normalisedPhone,
      token,
      type: "sms",
    });

    const { error } = await Promise.race([verifyPromise, timeoutPromise]);

    if (error) {
      return { success: false, error: error.message };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { phoneVerified: true },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Verification failed.";
    return { success: false, error: msg };
  }
}

/* ── Get current user + profile for dashboard ───────────────── */

const userWithProfileInclude = {
  workerProfile: true,
  recruiterProfile: true,
  postedJobs: {
    orderBy: { createdAt: "desc" as const },
    take: 20,
    include: {
      reviews: {
        select: {
          id: true,
          targetUserId: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
      },
      applications: {
        orderBy: { createdAt: "desc" as const },
        include: {
          worker: {
            select: {
              id: true,
              email: true,
              phone: true,
              phoneVerified: true,
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
                  cvUrl: true,
                },
              },
              _count: {
                select: {
                  reviewsReceived: true,
                  applications: true,
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
          reviews: {
            select: {
              id: true,
              targetUserId: true,
              rating: true,
              comment: true,
              createdAt: true,
            },
          },
        },
      },
    },
  },
  reviewsReceived: {
    orderBy: { createdAt: "desc" as const },
    take: 10,
    include: {
      author: {
        select: {
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
      job: {
        select: {
          id: true,
          title: true,
          category: true,
        },
      },
    },
  },
  _count: {
    select: {
      applications: true,
      reviewsReceived: true,
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
  availableOnly?: boolean;
  verifiedOnly?: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

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

  if (filters?.availableOnly) {
    where.isAvailableNow = true;
  }

  if (filters?.verifiedOnly) {
    where.kycStatus = "VERIFIED";
  }

  try {
    const workers = await prisma.workerProfile.findMany({
      where,
      orderBy: [
        { isFeatured: "desc" },
        { isAvailableNow: "desc" },
        { rating: "desc" },
        { createdAt: "desc" },
      ],
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            phoneVerified: true,
            applications: {
              where: {
                OR: [
                  { status: ApplicationStatus.COMPLETED },
                  { status: ApplicationStatus.ACCEPTED, job: { status: "COMPLETED" } },
                ],
              },
              select: {
                id: true,
                updatedAt: true,
                job: {
                  select: {
                    id: true,
                    title: true,
                    category: true,
                    address: true,
                    budget: true,
                  },
                },
              },
              orderBy: { updatedAt: "desc" },
              take: 3,
            },
            reviewsReceived: {
              select: {
                id: true,
                rating: true,
                comment: true,
                createdAt: true,
                author: {
                  select: {
                    email: true,
                    recruiterProfile: {
                      select: { name: true, businessName: true },
                    },
                  },
                },
                job: {
                  select: {
                    title: true,
                  },
                },
              },
              orderBy: { createdAt: "desc" },
              take: 3,
            },
            _count: {
              select: {
                applications: true,
                reviewsReceived: true,
              },
            },
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

/* ── Toggle Worker Live Availability ("Available Now") ────────── */
export async function toggleWorkerAvailability(): Promise<ProfileActionResult & { isAvailableNow?: boolean }> {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { success: false, error: "Not authenticated" };

  try {
    const profile = await prisma.workerProfile.findUnique({
      where: { userId: user.id },
      select: { isAvailableNow: true },
    });

    if (!profile) return { success: false, error: "Worker profile not found." };

    const updated = await prisma.workerProfile.update({
      where: { userId: user.id },
      data: { isAvailableNow: !profile.isAvailableNow },
      select: { isAvailableNow: true },
    });

    revalidatePath("/dashboard");
    revalidatePath("/workers");
    return { success: true, isAvailableNow: updated.isAvailableNow };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to toggle status.";
    return { success: false, error: msg };
  }
}

/* ── Submit KYC Verification (Citizenship / National ID / PAN) ── */
export async function submitKycVerification(data: {
  documentType: "CITIZENSHIP" | "NATIONAL_ID" | "PAN_OR_LICENSE";
  documentNumber: string;
  documentUrl?: string | null;
}): Promise<ProfileActionResult> {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { success: false, error: "Not authenticated" };

  if (!data.documentNumber || !data.documentNumber.trim()) {
    return { success: false, error: "Document number is required." };
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!dbUser) return { success: false, error: "User not found." };

    // Submit for Admin Verification review (sets status: PENDING for operator review)
    if (dbUser.role === "WORKER") {
      await prisma.workerProfile.update({
        where: { userId: user.id },
        data: {
          kycStatus: "PENDING",
          kycDocumentType: data.documentType,
          kycDocumentNumber: data.documentNumber.trim(),
          kycDocumentUrl: data.documentUrl || null,
          kycVerifiedAt: null,
        },
      });
    } else {
      await prisma.recruiterProfile.update({
        where: { userId: user.id },
        data: {
          kycStatus: "PENDING",
          kycDocumentType: data.documentType,
          kycDocumentNumber: data.documentNumber.trim(),
          kycDocumentUrl: data.documentUrl || null,
          kycVerifiedAt: null,
        },
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/workers");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to submit KYC.";
    return { success: false, error: msg };
  }
}