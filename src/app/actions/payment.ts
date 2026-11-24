"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { PaymentGateway, PaymentStatus, TransactionType } from "@prisma/client";
import { BOOST_PACKAGES, FEATURE_PACKAGES } from "@/lib/constants";
import { getSiteUrl } from "@/lib/site-url";
import { initiateKhaltiPayment, verifyKhaltiPayment, isKhaltiConfigured } from "@/lib/khalti";

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

    let paymentUrl: string | undefined;

    if (input.gateway === "KHALTI" && isKhaltiConfigured()) {
      try {
        const siteUrl = await getSiteUrl();
        const khaltiRes = await initiateKhaltiPayment({
          returnUrl: `${siteUrl}/payment/callback`,
          websiteUrl: siteUrl,
          amount: Math.round(pkg.price * 100),
          purchaseOrderId: transaction.id,
          purchaseOrderName: `KamGhar Boost: ${job.title}`,
          customerInfo: {
            name: user.user_metadata?.full_name || user.email || "KamGhar User",
            email: user.email,
          },
        });

        if (khaltiRes.success && khaltiRes.data?.payment_url) {
          paymentUrl = khaltiRes.data.payment_url;
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              gatewayRef: khaltiRes.data.pidx,
              metadata: {
                ...((transaction.metadata as object) || {}),
                pidx: khaltiRes.data.pidx,
              },
            },
          });
        } else if (khaltiRes.error) {
          console.warn("Khalti boost payment initiation notice:", khaltiRes.error);
        }
      } catch (khaltiErr) {
        console.error("Khalti initiation exception:", khaltiErr);
      }
    }

    return {
      success: true,
      transactionId: transaction.id,
      amount: pkg.price,
      gateway: transaction.gateway,
      paymentUrl,
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

    let paymentUrl: string | undefined;

    if (input.gateway === "KHALTI" && isKhaltiConfigured()) {
      try {
        const siteUrl = await getSiteUrl();
        const khaltiRes = await initiateKhaltiPayment({
          returnUrl: `${siteUrl}/payment/callback`,
          websiteUrl: siteUrl,
          amount: Math.round(pkg.price * 100),
          purchaseOrderId: transaction.id,
          purchaseOrderName: `KamGhar Featured: ${worker.name}`,
          customerInfo: {
            name: worker.name || user.user_metadata?.full_name || user.email || "KamGhar Worker",
            email: user.email,
          },
        });

        if (khaltiRes.success && khaltiRes.data?.payment_url) {
          paymentUrl = khaltiRes.data.payment_url;
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              gatewayRef: khaltiRes.data.pidx,
              metadata: {
                ...((transaction.metadata as object) || {}),
                pidx: khaltiRes.data.pidx,
              },
            },
          });
        } else if (khaltiRes.error) {
          console.warn("Khalti feature payment initiation notice:", khaltiRes.error);
        }
      } catch (khaltiErr) {
        console.error("Khalti initiation exception:", khaltiErr);
      }
    }

    return {
      success: true,
      transactionId: transaction.id,
      amount: pkg.price,
      gateway: transaction.gateway,
      paymentUrl,
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

    let verifiedRef = input.gatewayRef;

    // Verify Khalti transaction status via lookup API if not simulated
    if (transaction.gateway === PaymentGateway.KHALTI && !input.isSimulator && isKhaltiConfigured()) {
      const metaObj = (transaction.metadata as { pidx?: string }) || {};
      const pidxToVerify = input.gatewayRef || metaObj.pidx;

      if (pidxToVerify) {
        const verifyRes = await verifyKhaltiPayment(pidxToVerify);
        if (!verifyRes.success || verifyRes.data?.status !== "Completed") {
          return {
            success: false,
            error: verifyRes.error || `Khalti payment status: ${verifyRes.data?.status || "Incomplete"}`,
          };
        }
        verifiedRef = verifyRes.data.transaction_id || pidxToVerify;
      }
    }

    const meta = (transaction.metadata as { packageDays?: number; jobTitle?: string }) || {};
    const days = meta.packageDays || 7;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const ref = verifiedRef || input.gatewayRef || `SIM-${Date.now().toString(36).toUpperCase()}`;

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
