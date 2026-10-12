"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { UserRole, JobStatus, UrgencyLevel, KycStatus, PaymentStatus, TransactionType, PaymentGateway } from "@prisma/client";
import { createNotification } from "@/app/actions/notification";

export type AdminActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

/* ── Auth helper: verify caller has ADMIN role ──────────────────────── */
export async function getAdminCaller() {
  const supabase = await createClient();
  const { data: { user: authUser }, error } = await supabase.auth.getUser();
  if (error || !authUser) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      id: true,
      email: true,
      role: true,
      workerProfile: { select: { name: true, profilePhotoUrl: true } },
      recruiterProfile: { select: { name: true, profilePhotoUrl: true } },
    },
  });

  return dbUser;
}

/* ── Allow authenticated user to claim ADMIN role (for dev/first operator) ── */
export async function claimAdminRole(): Promise<AdminActionResult<{ role: UserRole }>> {
  const supabase = await createClient();
  const { data: { user: authUser }, error } = await supabase.auth.getUser();
  if (error || !authUser) {
    return { success: false, error: "Please log in first to claim admin role." };
  }

  try {
    const updated = await prisma.user.update({
      where: { id: authUser.id },
      data: { role: "ADMIN" },
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { success: true, data: { role: updated.role } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to assign admin role";
    return { success: false, error: msg };
  }
}

/* ── Overview Statistics ────────────────────────────────────────────── */
export async function getAdminOverviewStats() {
  const admin = await getAdminCaller();
  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Admin access required." };
  }

  try {
    const [
      totalUsers,
      totalWorkers,
      totalRecruiters,
      totalAdmins,
      totalJobs,
      openJobs,
      boostedJobs,
      pendingWorkerKyc,
      pendingRecruiterKyc,
      totalTransactions,
      completedTransactions,
      completedRevenueResult,
      featuredWorkersCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "WORKER" } }),
      prisma.user.count({ where: { role: "RECRUITER" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.job.count(),
      prisma.job.count({ where: { status: "OPEN" } }),
      prisma.job.count({ where: { isBoosted: true } }),
      prisma.workerProfile.count({ where: { kycStatus: "PENDING" } }),
      prisma.recruiterProfile.count({ where: { kycStatus: "PENDING" } }),
      prisma.transaction.count(),
      prisma.transaction.count({ where: { status: "COMPLETED" } }),
      prisma.transaction.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.workerProfile.count({ where: { isFeatured: true } }),
    ]);

    const totalRevenue = completedRevenueResult._sum.amount || 0;
    const totalPendingKyc = pendingWorkerKyc + pendingRecruiterKyc;

    return {
      success: true,
      data: {
        users: {
          total: totalUsers,
          workers: totalWorkers,
          recruiters: totalRecruiters,
          admins: totalAdmins,
        },
        jobs: {
          total: totalJobs,
          open: openJobs,
          boosted: boostedJobs,
        },
        kyc: {
          pendingTotal: totalPendingKyc,
          pendingWorkers: pendingWorkerKyc,
          pendingRecruiters: pendingRecruiterKyc,
        },
        monetization: {
          totalTransactions,
          completedTransactions,
          totalRevenue,
          featuredWorkers: featuredWorkersCount,
        },
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load admin stats";
    return { success: false, error: msg };
  }
}

/* ── 1. Users Management & Moderation ───────────────────────────────── */
export async function getAdminUsersList(params?: {
  search?: string;
  role?: "ALL" | UserRole;
  kycStatus?: "ALL" | KycStatus;
}) {
  const admin = await getAdminCaller();
  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Admin access required." };
  }

  try {
    const whereClause: any = {};

    if (params?.role && params.role !== "ALL") {
      whereClause.role = params.role;
    }

    if (params?.search && params.search.trim()) {
      const q = params.search.trim();
      whereClause.OR = [
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { workerProfile: { name: { contains: q, mode: "insensitive" } } },
        { recruiterProfile: { name: { contains: q, mode: "insensitive" } } },
        { recruiterProfile: { businessName: { contains: q, mode: "insensitive" } } },
      ];
    }

    if (params?.kycStatus && params.kycStatus !== "ALL") {
      whereClause.OR = [
        { workerProfile: { kycStatus: params.kycStatus } },
        { recruiterProfile: { kycStatus: params.kycStatus } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        workerProfile: true,
        recruiterProfile: true,
        _count: {
          select: {
            postedJobs: true,
            applications: true,
            transactions: true,
          },
        },
      },
    });

    return { success: true, data: users };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch users";
    return { success: false, error: msg };
  }
}

export async function updateUserRoleByAdmin(
  targetUserId: string,
  newRole: UserRole
): Promise<AdminActionResult> {
  const admin = await getAdminCaller();
  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Admin access required." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { workerProfile: true, recruiterProfile: true },
    });

    if (!user) return { success: false, error: "User not found" };

    // Prevent demoting the only admin if they are targeting themselves
    if (user.id === admin.id && newRole !== "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return { success: false, error: "Cannot revoke admin role from the only remaining admin." };
      }
    }

    await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
    });

    // Ensure profiles exist if changing between worker/recruiter
    if (newRole === "WORKER" && !user.workerProfile) {
      await prisma.workerProfile.create({
        data: {
          userId: targetUserId,
          name: user.recruiterProfile?.name || user.email.split("@")[0],
          skills: [],
        },
      });
    } else if (newRole === "RECRUITER" && !user.recruiterProfile) {
      await prisma.recruiterProfile.create({
        data: {
          userId: targetUserId,
          name: user.workerProfile?.name || user.email.split("@")[0],
        },
      });
    }

    await createNotification({
      userId: targetUserId,
      type: "SYSTEM",
      title: "Account Role Updated",
      titleNe: "खाता भूमिका अद्यावधिक गरियो",
      message: `Your KamGhar role has been adjusted to ${newRole} by an administrator.`,
      messageNe: `तपाईंको कामघर खाता भूमिका प्रशासकद्वारा ${newRole} मा परिवर्तन गरिएको छ।`,
      link: "/dashboard",
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update role";
    return { success: false, error: msg };
  }
}

export async function toggleUserPhoneVerifiedByAdmin(
  targetUserId: string,
  phoneVerified: boolean
): Promise<AdminActionResult> {
  const admin = await getAdminCaller();
  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Admin access required." };
  }

  try {
    await prisma.user.update({
      where: { id: targetUserId },
      data: { phoneVerified },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to toggle phone verification";
    return { success: false, error: msg };
  }
}

export async function deleteUserByAdmin(targetUserId: string): Promise<AdminActionResult> {
  const admin = await getAdminCaller();
  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Admin access required." };
  }

  if (targetUserId === admin.id) {
    return { success: false, error: "You cannot delete your own active admin account." };
  }

  try {
    await prisma.user.delete({
      where: { id: targetUserId },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to delete user";
    return { success: false, error: msg };
  }
}

/* ── 2. Job Postings Moderation ─────────────────────────────────────── */
export async function getAdminJobsList(params?: {
  search?: string;
  status?: "ALL" | JobStatus;
  urgency?: "ALL" | UrgencyLevel;
  boostedOnly?: boolean;
}) {
  const admin = await getAdminCaller();
  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Admin access required." };
  }

  try {
    const whereClause: any = {};

    if (params?.status && params.status !== "ALL") {
      whereClause.status = params.status;
    }

    if (params?.urgency && params.urgency !== "ALL") {
      whereClause.urgency = params.urgency;
    }

    if (params?.boostedOnly) {
      whereClause.isBoosted = true;
    }

    if (params?.search && params.search.trim()) {
      const q = params.search.trim();
      whereClause.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
        { address: { contains: q, mode: "insensitive" } },
        { recruiter: { email: { contains: q, mode: "insensitive" } } },
        { recruiter: { recruiterProfile: { name: { contains: q, mode: "insensitive" } } } },
      ];
    }

    const jobs = await prisma.job.findMany({
      where: whereClause,
      orderBy: [{ isBoosted: "desc" }, { createdAt: "desc" }],
      take: 100,
      include: {
        recruiter: {
          select: {
            id: true,
            email: true,
            phone: true,
            recruiterProfile: {
              select: {
                name: true,
                businessName: true,
                profilePhotoUrl: true,
                kycStatus: true,
              },
            },
          },
        },
        _count: {
          select: {
            applications: true,
            conversations: true,
          },
        },
      },
    });

    return { success: true, data: jobs };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch jobs";
    return { success: false, error: msg };
  }
}

export async function updateJobStatusByAdmin(
  jobId: string,
  status: JobStatus
): Promise<AdminActionResult> {
  const admin = await getAdminCaller();
  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Admin access required." };
  }

  try {
    const job = await prisma.job.update({
      where: { id: jobId },
      data: { status },
      select: { id: true, title: true, recruiterId: true },
    });

    await createNotification({
      userId: job.recruiterId,
      type: "SYSTEM",
      title: `Job Status Moderated: ${status}`,
      titleNe: `कामको स्थिति परिमार्जन गरियो: ${status}`,
      message: `Your job posting "${job.title}" status has been set to ${status} by moderators.`,
      messageNe: `तपाईंको काम "${job.title}" को स्थिति मध्यस्थकर्ताद्वारा ${status} मा परिवर्तन गरियो।`,
      link: "/dashboard",
    });

    revalidatePath("/admin");
    revalidatePath("/jobs");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update job status";
    return { success: false, error: msg };
  }
}

export async function toggleJobBoostByAdmin(
  jobId: string,
  isBoosted: boolean,
  days: number = 7
): Promise<AdminActionResult> {
  const admin = await getAdminCaller();
  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Admin access required." };
  }

  try {
    const boostedUntil = isBoosted ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;

    const job = await prisma.job.update({
      where: { id: jobId },
      data: {
        isBoosted,
        boostedUntil,
      },
      select: { title: true, recruiterId: true },
    });

    if (isBoosted) {
      await createNotification({
        userId: job.recruiterId,
        type: "SYSTEM",
        title: "🚀 Job Boost Activated!",
        titleNe: "🚀 कामको विज्ञापन बूस्ट भयो!",
        message: `Your job "${job.title}" is now highlighted and boosted on top of search for ${days} days!`,
        messageNe: `तपाईंको काम "${job.title}" अब ${days} दिनका लागि खोज सूचीको शीर्ष स्थानमा देखिनेछ!`,
        link: "/jobs",
      });
    }

    revalidatePath("/admin");
    revalidatePath("/jobs");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to toggle job boost";
    return { success: false, error: msg };
  }
}

export async function deleteJobByAdmin(jobId: string): Promise<AdminActionResult> {
  const admin = await getAdminCaller();
  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Admin access required." };
  }

  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { title: true, recruiterId: true },
    });

    if (job) {
      await createNotification({
        userId: job.recruiterId,
        type: "SYSTEM",
        title: "Job Listing Removed",
        titleNe: "कामको विज्ञापन हटाइयो",
        message: `Your job posting "${job.title}" was removed by platform moderators for policy compliance.`,
        messageNe: `तपाईंको कामको विज्ञापन "${job.title}" नीति नियमका कारण हटाइएको छ।`,
        link: "/dashboard",
      });
    }

    await prisma.job.delete({
      where: { id: jobId },
    });

    revalidatePath("/admin");
    revalidatePath("/jobs");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to delete job";
    return { success: false, error: msg };
  }
}

/* ── 3. KYC Document Verification ──────────────────────────────────── */
export async function getAdminKycSubmissions(params?: {
  status?: "ALL" | KycStatus;
  roleType?: "ALL" | "WORKER" | "RECRUITER";
}) {
  const admin = await getAdminCaller();
  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Admin access required." };
  }

  try {
    const statusFilter = params?.status && params.status !== "ALL" ? params.status : undefined;
    const includeWorkers = !params?.roleType || params.roleType === "ALL" || params.roleType === "WORKER";
    const includeRecruiters = !params?.roleType || params.roleType === "ALL" || params.roleType === "RECRUITER";

    const workerWhere: any = {};
    if (statusFilter) workerWhere.kycStatus = statusFilter;

    const recruiterWhere: any = {};
    if (statusFilter) recruiterWhere.kycStatus = statusFilter;

    const [workers, recruiters] = await Promise.all([
      includeWorkers
        ? prisma.workerProfile.findMany({
            where: workerWhere,
            orderBy: [{ kycStatus: "asc" }, { updatedAt: "desc" }],
            include: {
              user: {
                select: { id: true, email: true, phone: true, phoneVerified: true, createdAt: true },
              },
            },
          })
        : Promise.resolve([]),
      includeRecruiters
        ? prisma.recruiterProfile.findMany({
            where: recruiterWhere,
            orderBy: [{ kycStatus: "asc" }, { updatedAt: "desc" }],
            include: {
              user: {
                select: { id: true, email: true, phone: true, phoneVerified: true, createdAt: true },
              },
            },
          })
        : Promise.resolve([]),
    ]);

    const formattedWorkers = workers.map((w) => ({
      profileId: w.id,
      userId: w.userId,
      roleType: "WORKER" as const,
      name: w.name,
      email: w.user.email,
      phone: w.user.phone,
      phoneVerified: w.user.phoneVerified,
      profilePhotoUrl: w.profilePhotoUrl,
      address: w.address,
      kycStatus: w.kycStatus,
      kycDocumentType: w.kycDocumentType,
      kycDocumentNumber: w.kycDocumentNumber,
      kycDocumentUrl: w.kycDocumentUrl,
      kycVerifiedAt: w.kycVerifiedAt,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
      skills: w.skills,
    }));

    const formattedRecruiters = recruiters.map((r) => ({
      profileId: r.id,
      userId: r.userId,
      roleType: "RECRUITER" as const,
      name: r.name,
      businessName: r.businessName,
      email: r.user.email,
      phone: r.user.phone,
      phoneVerified: r.user.phoneVerified,
      profilePhotoUrl: r.profilePhotoUrl,
      address: r.address,
      kycStatus: r.kycStatus,
      kycDocumentType: r.kycDocumentType,
      kycDocumentNumber: r.kycDocumentNumber,
      kycDocumentUrl: r.kycDocumentUrl,
      kycVerifiedAt: r.kycVerifiedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      skills: [],
    }));

    // Merge and sort with PENDING first, then most recently updated
    const all = [...formattedWorkers, ...formattedRecruiters].sort((a, b) => {
      if (a.kycStatus === "PENDING" && b.kycStatus !== "PENDING") return -1;
      if (b.kycStatus === "PENDING" && a.kycStatus !== "PENDING") return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return { success: true, data: all };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load KYC submissions";
    return { success: false, error: msg };
  }
}

export async function reviewKycSubmission(params: {
  userId: string;
  roleType: "WORKER" | "RECRUITER";
  decision: "VERIFIED" | "REJECTED" | "PENDING";
  feedback?: string;
}): Promise<AdminActionResult> {
  const admin = await getAdminCaller();
  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Admin access required." };
  }

  const { userId, roleType, decision, feedback } = params;

  try {
    const kycVerifiedAt = decision === "VERIFIED" ? new Date() : null;

    if (roleType === "WORKER") {
      await prisma.workerProfile.update({
        where: { userId },
        data: {
          kycStatus: decision,
          kycVerifiedAt,
        },
      });
    } else {
      await prisma.recruiterProfile.update({
        where: { userId },
        data: {
          kycStatus: decision,
          kycVerifiedAt,
        },
      });
    }

    // Send corresponding notification
    if (decision === "VERIFIED") {
      await createNotification({
        userId,
        type: "SYSTEM",
        title: "🛡️ KYC Verified Successfully!",
        titleNe: "🛡️ केवाइसी प्रमाणीकरण सफल भयो!",
        message: "Your citizenship/identity document has been approved by KamGhar operators. You now have the verified trust badge!",
        messageNe: "तपाईंको नागरिकता/परिचयपत्र कामघरबाट स्वीकृत भएको छ। तपाईंको प्रोफाइलमा प्रमाणित ब्लु ब्याज थपिएको छ!",
        link: "/dashboard",
      });
    } else if (decision === "REJECTED") {
      const reasonText = feedback ? ` Reason: "${feedback}".` : "";
      const reasonTextNe = feedback ? ` कारण: "${feedback}".` : "";
      await createNotification({
        userId,
        type: "SYSTEM",
        title: "⚠️ KYC Verification Rejected",
        titleNe: "⚠️ केवाइसी अस्वीकृत भयो",
        message: `Your submitted identity document could not be verified.${reasonText} Please re-upload a clear copy in your settings.`,
        messageNe: `तपाईंको कागजात प्रमाणित हुन सकेन।${reasonTextNe} कृपया प्रोफाइल सेटिङ्समा गएर स्पष्ट कागजात पुनः पेश गर्नुहोस्।`,
        link: "/dashboard",
      });
    }

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    revalidatePath("/workers");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to review KYC";
    return { success: false, error: msg };
  }
}

/* ── 4. Featured Listings Payments & Transactions ───────────────────── */
export async function getAdminTransactionsList(params?: {
  status?: "ALL" | PaymentStatus;
  type?: "ALL" | TransactionType;
  gateway?: "ALL" | PaymentGateway;
}) {
  const admin = await getAdminCaller();
  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Admin access required." };
  }

  try {
    const whereClause: any = {};

    if (params?.status && params.status !== "ALL") {
      whereClause.status = params.status;
    }

    if (params?.type && params.type !== "ALL") {
      whereClause.type = params.type;
    }

    if (params?.gateway && params.gateway !== "ALL") {
      whereClause.gateway = params.gateway;
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
            workerProfile: { select: { name: true, profilePhotoUrl: true } },
            recruiterProfile: { select: { name: true, businessName: true, profilePhotoUrl: true } },
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            category: true,
            isBoosted: true,
            boostedUntil: true,
          },
        },
      },
    });

    return { success: true, data: transactions };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch transactions";
    return { success: false, error: msg };
  }
}

export async function updateTransactionStatusByAdmin(
  transactionId: string,
  newStatus: PaymentStatus,
  durationDays: number = 7
): Promise<AdminActionResult> {
  const admin = await getAdminCaller();
  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Admin access required." };
  }

  try {
    const tx = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        user: true,
        job: true,
      },
    });

    if (!tx) return { success: false, error: "Transaction not found" };

    const updatedTx = await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: newStatus },
    });

    // If marked COMPLETED, activate the benefit automatically!
    if (newStatus === "COMPLETED") {
      const untilDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

      if (tx.type === "BOOST_JOB" && tx.jobId) {
        await prisma.job.update({
          where: { id: tx.jobId },
          data: {
            isBoosted: true,
            boostedUntil: untilDate,
          },
        });

        await createNotification({
          userId: tx.userId,
          type: "SYSTEM",
          title: "Payment Approved: Job Boost Activated! 🚀",
          titleNe: "भुक्तानी स्वीकृत: कामको बूस्ट सक्रिय! 🚀",
          message: `Your payment of Rs. ${tx.amount} has been verified. Your job "${tx.job?.title || "Listing"}" is now boosted for ${durationDays} days!`,
          messageNe: `तपाईंको रु. ${tx.amount} को भुक्तानी प्रमाणित भयो। तपाईंको विज्ञापन ${durationDays} दिनका लागि बूस्ट गरिएको छ!`,
          link: "/jobs",
        });
      } else if (tx.type === "FEATURE_PROFILE") {
        await prisma.workerProfile.update({
          where: { userId: tx.userId },
          data: {
            isFeatured: true,
            featuredUntil: untilDate,
          },
        });

        await createNotification({
          userId: tx.userId,
          type: "SYSTEM",
          title: "Payment Approved: Profile Featured! ⭐",
          titleNe: "भुक्तानी स्वीकृत: प्रोफाइल फिचर्ड भयो! ⭐",
          message: `Your payment of Rs. ${tx.amount} has been verified. Your profile is now featured at the top of worker searches for ${durationDays} days!`,
          messageNe: `तपाईंको रु. ${tx.amount} को भुक्तानी प्रमाणित भयो। तपाईंको प्रोफाइल ${durationDays} दिनका लागि फिचर्ड भएको छ!`,
          link: "/workers",
        });
      }
    } else if (newStatus === "FAILED") {
      await createNotification({
        userId: tx.userId,
        type: "SYSTEM",
        title: "Payment Unsuccessful / Declined",
        titleNe: "भुक्तानी असफल भयो",
        message: `Your payment transaction of Rs. ${tx.amount} (${tx.gateway}) could not be verified by operators.`,
        messageNe: `तपाईंको रु. ${tx.amount} (${tx.gateway}) को भुक्तानी प्रमाणित हुन सकेन।`,
        link: "/dashboard",
      });
    }

    revalidatePath("/admin");
    revalidatePath("/jobs");
    revalidatePath("/workers");
    return { success: true, data: updatedTx };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update transaction";
    return { success: false, error: msg };
  }
}

export async function createManualTransactionByAdmin(data: {
  userId: string;
  type: TransactionType;
  amount: number;
  gateway: PaymentGateway;
  gatewayRef?: string;
  status: PaymentStatus;
  jobId?: string;
  durationDays?: number;
}): Promise<AdminActionResult> {
  const admin = await getAdminCaller();
  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Admin access required." };
  }

  try {
    const created = await prisma.transaction.create({
      data: {
        userId: data.userId,
        type: data.type,
        amount: data.amount,
        gateway: data.gateway,
        gatewayRef: data.gatewayRef || `MANUAL-${Date.now().toString(36).toUpperCase()}`,
        status: data.status,
        jobId: data.jobId || null,
        metadata: { createdByAdminId: admin.id },
      },
    });

    if (data.status === "COMPLETED") {
      const days = data.durationDays || 7;
      const untilDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

      if (data.type === "BOOST_JOB" && data.jobId) {
        await prisma.job.update({
          where: { id: data.jobId },
          data: { isBoosted: true, boostedUntil: untilDate },
        });
      } else if (data.type === "FEATURE_PROFILE") {
        await prisma.workerProfile.update({
          where: { userId: data.userId },
          data: { isFeatured: true, featuredUntil: untilDate },
        });
      }
    }

    revalidatePath("/admin");
    revalidatePath("/jobs");
    revalidatePath("/workers");
    return { success: true, data: created };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to record transaction";
    return { success: false, error: msg };
  }
}

export async function toggleWorkerFeaturedByAdmin(
  workerUserId: string,
  isFeatured: boolean,
  days: number = 7
): Promise<AdminActionResult> {
  const admin = await getAdminCaller();
  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Admin access required." };
  }

  try {
    const featuredUntil = isFeatured ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;

    await prisma.workerProfile.update({
      where: { userId: workerUserId },
      data: {
        isFeatured,
        featuredUntil,
      },
    });

    if (isFeatured) {
      await createNotification({
        userId: workerUserId,
        type: "SYSTEM",
        title: "⭐ Your Profile is now Featured!",
        titleNe: "⭐ तपाईंको प्रोफाइल फिचर्ड भयो!",
        message: `An admin has featured your profile on top of the worker catalog for ${days} days!`,
        messageNe: `प्रशासकले तपाईंको प्रोफाइल ${days} दिनका लागि खोज सूचीको शीर्ष स्थानमा फिचर गर्नुभएको छ!`,
        link: "/workers",
      });
    }

    revalidatePath("/admin");
    revalidatePath("/workers");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to toggle worker featured";
    return { success: false, error: msg };
  }
}

/* ── In-Memory / Runtime Audit Log Cache ────────────────────────────── */
export type AuditLogEntry = {
  id: string;
  adminEmail: string;
  action: string;
  target: string;
  details?: string;
  timestamp: string;
};

// Global in-memory audit logs store
declare global {
  var __kamghar_audit_logs: AuditLogEntry[] | undefined;
}

export async function recordAuditLog(action: string, target: string, details?: string) {
  const admin = await getAdminCaller();
  const adminEmail = admin?.email || "system@kamghar.np";
  
  if (!global.__kamghar_audit_logs) {
    global.__kamghar_audit_logs = [
      {
        id: "audit-init",
        adminEmail: "system@kamghar.np",
        action: "SYSTEM_INITIALIZE",
        target: "Admin Console",
        details: "Operator session established with security compliance.",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
    ];
  }

  const newEntry: AuditLogEntry = {
    id: `audit-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    adminEmail,
    action,
    target,
    details,
    timestamp: new Date().toISOString(),
  };

  global.__kamghar_audit_logs.unshift(newEntry);
  if (global.__kamghar_audit_logs.length > 200) {
    global.__kamghar_audit_logs.pop();
  }
  return newEntry;
}

export async function getAdminAuditLogs(): Promise<AuditLogEntry[]> {
  if (!global.__kamghar_audit_logs) {
    global.__kamghar_audit_logs = [
      {
        id: "audit-init",
        adminEmail: "admin@kamghar.np",
        action: "CONSOLE_BOOT",
        target: "KamGhar Security Engine",
        details: "Access granted with internal platform operator privileges.",
        timestamp: new Date().toISOString(),
      },
    ];
  }
  return global.__kamghar_audit_logs;
}

/* ── 5. Dispute & Conflict Resolution Center ────────────────────────── */
export async function getDisputeConversations() {
  const admin = await getAdminCaller();
  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Admin access required." };
  }

  try {
    const conversations = await prisma.conversation.findMany({
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: {
        user1: {
          select: {
            id: true,
            email: true,
            phone: true,
            phoneVerified: true,
            role: true,
            workerProfile: { select: { name: true, profilePhotoUrl: true, rating: true, kycStatus: true } },
            recruiterProfile: { select: { name: true, businessName: true, profilePhotoUrl: true, kycStatus: true } },
          },
        },
        user2: {
          select: {
            id: true,
            email: true,
            phone: true,
            phoneVerified: true,
            role: true,
            workerProfile: { select: { name: true, profilePhotoUrl: true, rating: true, kycStatus: true } },
            recruiterProfile: { select: { name: true, businessName: true, profilePhotoUrl: true, kycStatus: true } },
          },
        },
        job: {
          include: {
            applications: {
              include: {
                worker: {
                  select: {
                    id: true,
                    email: true,
                    workerProfile: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          take: 100,
        },
      },
    });

    return { success: true, data: conversations };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load dispute conversations";
    return { success: false, error: msg };
  }
}

export async function issueWarningStrike(params: {
  userId: string;
  reason: string;
  jobId?: string;
}): Promise<AdminActionResult> {
  const admin = await getAdminCaller();
  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Admin access required." };
  }

  try {
    await createNotification({
      userId: params.userId,
      type: "SYSTEM",
      title: "⚠️ Official Operator Warning Strike",
      titleNe: "⚠️ आधिकारिक प्रशासक चेतावनी",
      message: `You have received an official warning strike: "${params.reason}". Continued policy violations may result in account termination.`,
      messageNe: `तपाईंले आधिकारिक चेतावनी प्राप्त गर्नुभएको छ: "${params.reason}"। नीति उल्लंघन दोहोरिएमा खाता निष्क्रिय हुन सक्छ।`,
      link: "/dashboard",
    });

    await recordAuditLog(
      "ISSUE_STRIKE",
      `User ${params.userId}`,
      `Reason: ${params.reason} (Job: ${params.jobId || "N/A"})`
    );

    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to issue warning";
    return { success: false, error: msg };
  }
}

export async function resolveDisputeJob(params: {
  jobId: string;
  newStatus: JobStatus;
  resolutionNotes: string;
}): Promise<AdminActionResult> {
  const admin = await getAdminCaller();
  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Admin access required." };
  }

  try {
    const job = await prisma.job.update({
      where: { id: params.jobId },
      data: { status: params.newStatus },
      include: {
        recruiter: true,
        applications: { where: { status: "ACCEPTED" } },
      },
    });

    // Notify recruiter
    await createNotification({
      userId: job.recruiterId,
      type: "SYSTEM",
      title: `Dispute Mediated: Job Set to ${params.newStatus}`,
      titleNe: `विवाद समाधान: कामको स्थिति ${params.newStatus} गरियो`,
      message: `Operators have resolved the dispute for "${job.title}". Resolution: ${params.resolutionNotes}`,
      messageNe: `काम "${job.title}" को विवाद समाधान भयो: ${params.resolutionNotes}`,
      link: "/dashboard",
    });

    // Notify matched worker if any
    for (const app of job.applications) {
      await createNotification({
        userId: app.workerId,
        type: "SYSTEM",
        title: `Dispute Mediated: Job Set to ${params.newStatus}`,
        titleNe: `विवाद समाधान: कामको स्थिति ${params.newStatus} गरियो`,
        message: `Operators have resolved the dispute for "${job.title}". Resolution: ${params.resolutionNotes}`,
        messageNe: `काम "${job.title}" को विवाद समाधान भयो: ${params.resolutionNotes}`,
        link: "/dashboard",
      });
    }

    await recordAuditLog(
      "RESOLVE_DISPUTE",
      `Job ${job.title} (${params.jobId})`,
      `Status changed to ${params.newStatus}. Notes: ${params.resolutionNotes}`
    );

    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to resolve dispute";
    return { success: false, error: msg };
  }
}

/* ── 6. Review & Rating Moderation ──────────────────────────────────── */
export async function getAdminReviewsList(ratingFilter?: number) {
  const admin = await getAdminCaller();
  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Admin access required." };
  }

  try {
    const where: any = {};
    if (ratingFilter && ratingFilter > 0) {
      where.rating = ratingFilter;
    }

    const reviews = await prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        job: { select: { id: true, title: true, category: true } },
        author: {
          select: {
            id: true,
            email: true,
            role: true,
            workerProfile: { select: { name: true } },
            recruiterProfile: { select: { name: true, businessName: true } },
          },
        },
        targetUser: {
          select: {
            id: true,
            email: true,
            role: true,
            workerProfile: { select: { name: true, rating: true, reviewCount: true } },
            recruiterProfile: { select: { name: true, businessName: true } },
          },
        },
      },
    });

    return { success: true, data: reviews };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load reviews";
    return { success: false, error: msg };
  }
}

export async function deleteReviewByAdmin(reviewId: string): Promise<AdminActionResult> {
  const admin = await getAdminCaller();
  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Admin access required." };
  }

  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) return { success: false, error: "Review not found" };

    const targetUserId = review.targetUserId;

    // Delete review
    await prisma.review.delete({
      where: { id: reviewId },
    });

    // Recalculate target worker rating if target is a worker
    const remainingReviews = await prisma.review.findMany({
      where: { targetUserId },
      select: { rating: true },
    });

    const newCount = remainingReviews.length;
    const newRating = newCount > 0
      ? remainingReviews.reduce((sum, r) => sum + r.rating, 0) / newCount
      : 0;

    await prisma.workerProfile.updateMany({
      where: { userId: targetUserId },
      data: {
        rating: Math.round(newRating * 10) / 10,
        reviewCount: newCount,
      },
    });

    await recordAuditLog(
      "DELETE_REVIEW",
      `Review ID ${reviewId}`,
      `Removed review for target user ${targetUserId}. Recomputed rating to ${newRating.toFixed(1)}.`
    );

    revalidatePath("/admin");
    revalidatePath("/workers");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to delete review";
    return { success: false, error: msg };
  }
}

/* ── 7. Broadcast & Push Announcement System ────────────────────────── */
export async function sendAdminBroadcast(params: {
  audience: "ALL" | "WORKERS" | "RECRUITERS" | string;
  titleEn: string;
  titleNe?: string;
  messageEn: string;
  messageNe?: string;
  link?: string;
}): Promise<AdminActionResult<{ recipientCount: number }>> {
  const admin = await getAdminCaller();
  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Admin access required." };
  }

  try {
    const whereClause: any = {};
    if (params.audience === "WORKERS") {
      whereClause.role = "WORKER";
    } else if (params.audience === "RECRUITERS") {
      whereClause.role = "RECRUITER";
    }

    const targetUsers = await prisma.user.findMany({
      where: whereClause,
      select: { id: true },
    });

    if (targetUsers.length === 0) {
      return { success: false, error: "No target users found for this audience." };
    }

    const notificationsData = targetUsers.map((u) => ({
      userId: u.id,
      type: "SYSTEM" as const,
      title: params.titleEn,
      titleNe: params.titleNe || params.titleEn,
      message: params.messageEn,
      messageNe: params.messageNe || params.messageEn,
      link: params.link || "/dashboard",
      isRead: false,
    }));

    await prisma.notification.createMany({
      data: notificationsData,
    });

    await recordAuditLog(
      "BROADCAST_ANNOUNCEMENT",
      `Audience: ${params.audience}`,
      `Sent "${params.titleEn}" to ${targetUsers.length} users.`
    );

    revalidatePath("/dashboard");
    return { success: true, data: { recipientCount: targetUsers.length } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to send broadcast";
    return { success: false, error: msg };
  }
}

/* ── 8. Geographic Supply & Demand Heatmap Data ─────────────────────── */
export async function getGeographicHeatmapData() {
  const admin = await getAdminCaller();
  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Admin access required." };
  }

  try {
    const [openJobs, workers] = await Promise.all([
      prisma.job.findMany({
        where: { status: "OPEN" },
        select: {
          id: true,
          title: true,
          category: true,
          urgency: true,
          budget: true,
          latitude: true,
          longitude: true,
          address: true,
          createdAt: true,
        },
      }),
      prisma.workerProfile.findMany({
        where: {
          latitude: { not: null },
          longitude: { not: null },
        },
        select: {
          id: true,
          name: true,
          skills: true,
          hourlyRate: true,
          rating: true,
          latitude: true,
          longitude: true,
          address: true,
          isAvailableNow: true,
          kycStatus: true,
        },
      }),
    ]);

    // Define Nepal operational hubs
    const hubs = [
      { name: "Kathmandu (Cent)", lat: 27.7172, lng: 85.324, radiusKm: 8 },
      { name: "Lalitpur / Patan", lat: 27.6644, lng: 85.3188, radiusKm: 6 },
      { name: "Bhaktapur", lat: 27.671, lng: 85.4298, radiusKm: 7 },
      { name: "Pokhara Valley", lat: 28.2096, lng: 83.9856, radiusKm: 12 },
    ];

    // Compute hub demand-to-supply ratio
    const hubAnalysis = hubs.map((hub) => {
      // Euclidean distance approx for km
      const distance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const dLat = (lat2 - lat1) * 111;
        const dLon = (lon2 - lon1) * 111 * Math.cos((lat1 * Math.PI) / 180);
        return Math.sqrt(dLat * dLat + dLon * dLon);
      };

      const jobsInHub = openJobs.filter((j) => distance(hub.lat, hub.lng, j.latitude, j.longitude) <= hub.radiusKm);
      const workersInHub = workers.filter((w) => w.latitude && w.longitude && distance(hub.lat, hub.lng, w.latitude, w.longitude) <= hub.radiusKm);
      const availableWorkersInHub = workersInHub.filter((w) => w.isAvailableNow);

      const deficitAlert = jobsInHub.length > workersInHub.length;

      return {
        ...hub,
        jobCount: jobsInHub.length,
        workerCount: workersInHub.length,
        availableWorkerCount: availableWorkersInHub.length,
        deficitAlert,
      };
    });

    return {
      success: true,
      data: {
        jobs: openJobs,
        workers,
        hubs: hubAnalysis,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load heatmap data";
    return { success: false, error: msg };
  }
}

/* ── 9. Marketplace Funnel & Conversion Analytics ───────────────────── */
export async function getMarketplaceFunnelAnalytics() {
  const admin = await getAdminCaller();
  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Admin access required." };
  }

  try {
    const [
      totalApplications,
      acceptedApplications,
      completedJobsCount,
      allJobs,
      topWorkers,
      topRecruiters,
    ] = await Promise.all([
      prisma.application.count(),
      prisma.application.count({ where: { status: "ACCEPTED" } }),
      prisma.job.count({ where: { status: "COMPLETED" } }),
      prisma.job.findMany({ select: { category: true, budget: true, status: true, urgency: true } }),
      prisma.workerProfile.findMany({
        orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
        take: 5,
        select: { id: true, name: true, skills: true, rating: true, reviewCount: true, kycStatus: true },
      }),
      prisma.user.findMany({
        where: { role: "RECRUITER" },
        take: 5,
        include: {
          recruiterProfile: { select: { name: true, businessName: true } },
          _count: { select: { postedJobs: true } },
        },
        orderBy: { postedJobs: { _count: "desc" } },
      }),
    ]);

    const conversionRate = totalApplications > 0
      ? Math.round((acceptedApplications / totalApplications) * 100)
      : 0;

    // Group jobs by category
    const categoryStats: Record<string, { count: number; totalBudget: number }> = {};
    for (const j of allJobs) {
      if (!categoryStats[j.category]) {
        categoryStats[j.category] = { count: 0, totalBudget: 0 };
      }
      categoryStats[j.category].count += 1;
      categoryStats[j.category].totalBudget += j.budget || 0;
    }

    const categoriesList = Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      jobCount: stats.count,
      avgBudget: stats.count > 0 ? Math.round(stats.totalBudget / stats.count) : 0,
    })).sort((a, b) => b.jobCount - a.jobCount);

    return {
      success: true,
      data: {
        funnel: {
          totalApplications,
          acceptedApplications,
          completedJobs: completedJobsCount,
          conversionRate,
        },
        categories: categoriesList,
        topWorkers,
        topRecruiters: topRecruiters.map((r) => ({
          id: r.id,
          name: r.recruiterProfile?.businessName || r.recruiterProfile?.name || r.email,
          jobCount: r._count.postedJobs,
        })),
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load funnel analytics";
    return { success: false, error: msg };
  }
}

