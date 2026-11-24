"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { PaymentGateway, PaymentStatus, TransactionType } from "@prisma/client";
import { BOOST_PACKAGES, FEATURE_PACKAGES } from "@/lib/constants";
import { getSiteUrl } from "@/lib/site-url";
import { initiateKhaltiPayment, verifyKhaltiPayment, isKhaltiConfigured } from "@/lib/khalti";
import {
  createEsewaPaymentPayload,
  verifyEsewaTransaction,
  isEsewaConfigured,
  getEsewaGatewayUrl,
} from "@/lib/esewa";

export type PaymentResult = {
  success: boolean;
  error?: string;
  transactionId?: string;
  amount?: number;
  gateway?: PaymentGateway;
  paymentUrl?: string;
  esewaConfig?: {
    actionUrl: string;
    fields: Record<string, string>;
  };
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
    let esewaConfig: PaymentResult["esewaConfig"] | undefined;

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
          return { success: false, error: khaltiRes.error };
        }
      } catch (khaltiErr) {
        console.error("Khalti initiation exception:", khaltiErr);
        return { success: false, error: "Failed to connect to Khalti gateway." };
      }
    } else if (input.gateway === "ESEWA" && isEsewaConfigured()) {
      try {
        const siteUrl = await getSiteUrl();
        const payload = createEsewaPaymentPayload({
          amount: pkg.price,
          transactionUuid: transaction.id,
          successUrl: `${siteUrl}/payment/callback`,
          failureUrl: `${siteUrl}/payment/callback?gateway=esewa&status=failed&purchase_order_id=${transaction.id}`,
        });

        esewaConfig = {
          actionUrl: getEsewaGatewayUrl(),
          fields: payload as unknown as Record<string, string>,
        };
      } catch (esewaErr) {
        console.error("eSewa boost payment initiation exception:", esewaErr);
        return { success: false, error: "Failed to prepare eSewa checkout." };
      }
    }

    if (input.gateway === "KHALTI" && !paymentUrl) {
      return { success: false, error: "Khalti gateway is not configured or failed to return a checkout URL." };
    }
    if (input.gateway === "ESEWA" && !esewaConfig) {
      return { success: false, error: "eSewa gateway is not configured." };
    }

    return {
      success: true,
      transactionId: transaction.id,
      amount: pkg.price,
      gateway: transaction.gateway,
      paymentUrl,
      esewaConfig,
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
    let esewaConfig: PaymentResult["esewaConfig"] | undefined;

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
          return { success: false, error: khaltiRes.error };
        }
      } catch (khaltiErr) {
        console.error("Khalti initiation exception:", khaltiErr);
        return { success: false, error: "Failed to connect to Khalti gateway." };
      }
    } else if (input.gateway === "ESEWA" && isEsewaConfigured()) {
      try {
        const siteUrl = await getSiteUrl();
        const payload = createEsewaPaymentPayload({
          amount: pkg.price,
          transactionUuid: transaction.id,
          successUrl: `${siteUrl}/payment/callback`,
          failureUrl: `${siteUrl}/payment/callback?gateway=esewa&status=failed&purchase_order_id=${transaction.id}`,
        });

        esewaConfig = {
          actionUrl: getEsewaGatewayUrl(),
          fields: payload as unknown as Record<string, string>,
        };
      } catch (esewaErr) {
        console.error("eSewa feature payment initiation exception:", esewaErr);
        return { success: false, error: "Failed to prepare eSewa checkout." };
      }
    }

    if (input.gateway === "KHALTI" && !paymentUrl) {
      return { success: false, error: "Khalti gateway is not configured or failed to return a checkout URL." };
    }
    if (input.gateway === "ESEWA" && !esewaConfig) {
      return { success: false, error: "eSewa gateway is not configured." };
    }

    return {
      success: true,
      transactionId: transaction.id,
      amount: pkg.price,
      gateway: transaction.gateway,
      paymentUrl,
      esewaConfig,
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

    // Verify eSewa transaction status via status check API if not simulated
    if (transaction.gateway === PaymentGateway.ESEWA && !input.isSimulator && isEsewaConfigured()) {
      const verifyRes = await verifyEsewaTransaction({
        totalAmount: transaction.amount,
        transactionUuid: transaction.id,
      });

      if (!verifyRes.success || verifyRes.data?.status !== "COMPLETE") {
        return {
          success: false,
          error: verifyRes.error || `eSewa payment status: ${verifyRes.data?.status || "Incomplete"}`,
        };
      }
      verifiedRef = verifyRes.data.ref_id || input.gatewayRef || `ESEWA-${transaction.id}`;
    }

    const meta = (transaction.metadata as { packageDays?: number; jobTitle?: string }) || {};
    const days = meta.packageDays || 7;
    const additionalMs = days * 24 * 60 * 60 * 1000;
    const ref = verifiedRef || input.gatewayRef || `SIM-${Date.now().toString(36).toUpperCase()}`;

    if (transaction.type === TransactionType.BOOST_JOB && transaction.jobId) {
      const currentJob = await prisma.job.findUnique({
        where: { id: transaction.jobId },
        select: { boostedUntil: true, title: true },
      });
      const currentExpiry = currentJob?.boostedUntil ? new Date(currentJob.boostedUntil).getTime() : 0;
      const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
      const expiresAt = new Date(baseTime + additionalMs);

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
          message: `Your job "${transaction.job?.title || currentJob?.title || "listing"}" is now boosted at the top for ${days} days!`,
          messageNe: `तपाईंको काम "${transaction.job?.title || currentJob?.title || "काम"}" अब ${days} दिनको लागि शीर्ष स्थानमा बुस्ट गरिएको छ!`,
          link: "/jobs",
        },
      });
    } else if (transaction.type === TransactionType.FEATURE_PROFILE) {
      const currentWorker = await prisma.workerProfile.findUnique({
        where: { userId: user.id },
        select: { featuredUntil: true },
      });
      const currentExpiry = currentWorker?.featuredUntil ? new Date(currentWorker.featuredUntil).getTime() : 0;
      const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
      const expiresAt = new Date(baseTime + additionalMs);

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
