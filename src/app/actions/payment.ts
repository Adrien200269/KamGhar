"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { PaymentGateway, PaymentStatus, TransactionType } from "@prisma/client";
import { BOOST_PACKAGES, FEATURE_PACKAGES } from "@/lib/constants";

export type PaymentResult = {
  success: boolean;
  error?: string;
  transactionId?: string;
  amount?: number;
  gateway?: PaymentGateway;
  paymentUrl?: string;
};

/* ── Initiate Job Boost Payment ────────────────────────────── */
export async function initiateBoostPayment(input: {
  jobId: string;
  days: number;
  gateway: "ESEWA" | "KHALTI";
}): Promise<PaymentResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Please log in to boost this job." };
  }

  const pkg = BOOST_PACKAGES.find((p) => p.days === input.days);
  if (!pkg) {
    return { success: false, error: "Invalid boost package selected." };
  }

  try {
    const job = await prisma.job.findUnique({
      where: { id: input.jobId },
      select: { id: true, recruiterId: true, title: true },
    });

    if (!job || job.recruiterId !== user.id) {
      return { success: false, error: "Job listing not found or unauthorized." };
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        jobId: job.id,
        type: TransactionType.BOOST_JOB,
        amount: pkg.price,
        gateway: input.gateway === "ESEWA" ? PaymentGateway.ESEWA : PaymentGateway.KHALTI,
        status: PaymentStatus.PENDING,
        metadata: {
          packageDays: pkg.days,
          jobTitle: job.title,
        },
      },
    });

    return {
      success: true,
      transactionId: transaction.id,
      amount: pkg.price,
      gateway: transaction.gateway,
    };
  } catch (err) {
    console.error("Initiate boost payment error:", err);
    return { success: false, error: "Failed to initiate payment." };
  }
}

/* ── Initiate Worker Feature Profile Payment ───────────────── */
export async function initiateFeaturePayment(input: {
  days: number;
  gateway: "ESEWA" | "KHALTI";
}): Promise<PaymentResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Please log in to feature your profile." };
  }

  const pkg = FEATURE_PACKAGES.find((p) => p.days === input.days);
  if (!pkg) {
    return { success: false, error: "Invalid featured package selected." };
  }

  try {
    const worker = await prisma.workerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true, name: true },
    });

    if (!worker) {
      return { success: false, error: "Worker profile not found." };
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: TransactionType.FEATURE_PROFILE,
        amount: pkg.price,
        gateway: input.gateway === "ESEWA" ? PaymentGateway.ESEWA : PaymentGateway.KHALTI,
        status: PaymentStatus.PENDING,
        metadata: {
          packageDays: pkg.days,
          workerName: worker.name,
        },
      },
    });

    return {
      success: true,
      transactionId: transaction.id,
      amount: pkg.price,
      gateway: transaction.gateway,
    };
  } catch (err) {
    console.error("Initiate feature payment error:", err);
    return { success: false, error: "Failed to initiate payment." };
  }
}

/* ── Complete & Verify Payment (eSewa / Khalti / Sandbox) ──── */
export async function verifyAndCompletePayment(input: {
  transactionId: string;
  gatewayRef?: string;
  isSimulator?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: input.transactionId },
      include: { job: true },
    });

    if (!transaction || transaction.userId !== user.id) {
      return { success: false, error: "Transaction not found." };
    }

    if (transaction.status === PaymentStatus.COMPLETED) {
      return { success: true };
    }

    const meta = (transaction.metadata as { packageDays?: number; jobTitle?: string }) || {};
    const days = meta.packageDays || 7;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const ref = input.gatewayRef || `SIM-${Date.now().toString(36).toUpperCase()}`;

    if (transaction.type === TransactionType.BOOST_JOB && transaction.jobId) {
      await prisma.$transaction([
        prisma.job.update({
          where: { id: transaction.jobId },
          data: {
            isBoosted: true,
            boostedUntil: expiresAt,
          },
        }),
        prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: PaymentStatus.COMPLETED,
            gatewayRef: ref,
          },
        }),
      ]);

      // Notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "SYSTEM",
          title: "🚀 Job Boost Activated!",
          titleNe: "🚀 काम बुस्ट सक्रिय भयो!",
          message: `Your job "${transaction.job?.title || "listing"}" is now boosted at the top for ${days} days!`,
          messageNe: `तपाईंको काम "${transaction.job?.title || "काम"}" अब ${days} दिनको लागि शीर्ष स्थानमा बुस्ट गरिएको छ!`,
          link: "/jobs",
        },
      });
    } else if (transaction.type === TransactionType.FEATURE_PROFILE) {
      await prisma.$transaction([
        prisma.workerProfile.update({
          where: { userId: user.id },
          data: {
            isFeatured: true,
            featuredUntil: expiresAt,
          },
        }),
        prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: PaymentStatus.COMPLETED,
            gatewayRef: ref,
          },
        }),
      ]);

      // Notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "SYSTEM",
          title: "⭐ Featured Profile Spotlight Active!",
          titleNe: "⭐ फिचर्ड प्रोफाइल सक्रिय भयो!",
          message: `Your worker profile is now featured at the top of the directory for ${days} days!`,
          messageNe: `तपाईंको प्रोफाइल अब ${days} दिनको लागि कामदार सूचीको शीर्ष स्थानमा रहनेछ!`,
          link: "/workers",
        },
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/jobs");
    revalidatePath("/workers");
    revalidatePath("/admin");

    return { success: true };
  } catch (err) {
    console.error("Verify payment error:", err);
    return { success: false, error: "Failed to finalize payment." };
  }
}
