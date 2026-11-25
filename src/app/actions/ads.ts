"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AdAudience, AdPlacement } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminCaller, type AdminActionResult } from "@/app/actions/admin";

export type PublicAdItem = {
  id: string;
  sponsorName: string;
  title: string;
  description: string;
  imageUrl: string | null;
  targetUrl: string;
  ctaLabel: string;
  placement: AdPlacement;
  audience: AdAudience;
  badgeText: string;
};

export type AdminAdItem = PublicAdItem & {
  isActive: boolean;
  priority: number;
  impressions: number;
  clicks: number;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: { email: string } | null;
};

function isSafeHttpOrRelativeUrl(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.startsWith("/")) {
    return !trimmed.startsWith("//");
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isSafeHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

const AdInputSchema = z
  .object({
    sponsorName: z
      .string()
      .trim()
      .min(2, "Sponsor name must be at least 2 characters")
      .max(80, "Sponsor name is too long"),
    title: z
      .string()
      .trim()
      .min(3, "Ad headline must be at least 3 characters")
      .max(120, "Ad headline must be under 120 characters"),
    description: z
      .string()
      .trim()
      .min(5, "Description must be at least 5 characters")
      .max(320, "Description must be under 320 characters"),
    imageUrl: z
      .string()
      .trim()
      .optional()
      .nullable()
      .refine((v) => !v || isSafeHttpUrl(v), {
        message: "Image URL must be a valid http(s) URL",
      }),
    targetUrl: z
      .string()
      .trim()
      .min(1, "Destination URL is required")
      .refine(isSafeHttpOrRelativeUrl, {
        message: "Destination URL must start with https://, http://, or /",
      }),
    ctaLabel: z
      .string()
      .trim()
      .min(2, "Button label must be at least 2 characters")
      .max(40, "Button label is too long")
      .default("Learn More"),
    placement: z.enum(["LANDING", "DASHBOARD", "BOTH"]).default("BOTH"),
    audience: z.enum(["ALL", "WORKER", "RECRUITER"]).default("ALL"),
    badgeText: z
      .string()
      .trim()
      .min(2, "Badge text must be at least 2 characters")
      .max(30, "Badge text is too long")
      .default("Sponsored"),
    isActive: z.boolean().default(true),
    priority: z.coerce.number().int().min(0).max(999).default(0),
    startsAt: z.string().optional().nullable(),
    endsAt: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.startsAt && data.endsAt) {
        return new Date(data.endsAt) >= new Date(data.startsAt);
      }
      return true;
    },
    {
      message: "End date must be on or after the start date",
      path: ["endsAt"],
    }
  );

function parseOptionalDate(val?: string | null, endOfDay = false): Date | null {
  if (!val || !val.trim()) return null;
  const trimmed = val.trim();
  const parsed = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
      ? `${trimmed}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`
      : trimmed
  );
  return isNaN(parsed.getTime()) ? null : parsed;
}

function serializeAdminAd(ad: {
  id: string;
  sponsorName: string;
  title: string;
  description: string;
  imageUrl: string | null;
  targetUrl: string;
  ctaLabel: string;
  placement: AdPlacement;
  audience: AdAudience;
  badgeText: string;
  isActive: boolean;
  priority: number;
  impressions: number;
  clicks: number;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: { email: string } | null;
}): AdminAdItem {
  return {
    id: ad.id,
    sponsorName: ad.sponsorName,
    title: ad.title,
    description: ad.description,
    imageUrl: ad.imageUrl,
    targetUrl: ad.targetUrl,
    ctaLabel: ad.ctaLabel,
    placement: ad.placement,
    audience: ad.audience,
    badgeText: ad.badgeText,
    isActive: ad.isActive,
    priority: ad.priority,
    impressions: ad.impressions,
    clicks: ad.clicks,
    startsAt: ad.startsAt ? ad.startsAt.toISOString() : null,
    endsAt: ad.endsAt ? ad.endsAt.toISOString() : null,
    createdAt: ad.createdAt.toISOString(),
    updatedAt: ad.updatedAt.toISOString(),
    createdBy: ad.createdBy,
  };
}

function revalidateAdTargets() {
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
}

/* ── Fetch Active Ads for Landing or Dashboard ────────────────────── */
export async function getActiveAds(
  placement: "LANDING" | "DASHBOARD",
  audience: "ALL" | "WORKER" | "RECRUITER" = "ALL"
): Promise<PublicAdItem[]> {
  try {
    const now = new Date();
    const audienceFilter: AdAudience[] =
      audience === "ALL" ? ["ALL", "WORKER", "RECRUITER"] : [audience, "ALL"];

    const ads = await prisma.advertisement.findMany({
      where: {
        isActive: true,
        placement: { in: [placement, "BOTH"] },
        ...(placement === "DASHBOARD"
          ? { audience: { in: audienceFilter } }
          : {}),
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 6,
      select: {
        id: true,
        sponsorName: true,
        title: true,
        description: true,
        imageUrl: true,
        targetUrl: true,
        ctaLabel: true,
        placement: true,
        audience: true,
        badgeText: true,
      },
    });

    return ads;
  } catch (err) {
    console.error("Failed to fetch active ads:", err);
    return [];
  }
}

/* ── Record Ad Impression / Click ─────────────────────────────────── */
const UuidSchema = z.string().uuid();

export async function recordAdImpression(adId: string): Promise<void> {
  if (!UuidSchema.safeParse(adId).success) return;
  try {
    await prisma.advertisement.update({
      where: { id: adId },
      data: { impressions: { increment: 1 } },
    });
  } catch {
    // Non-blocking analytics failure
  }
}

export async function recordAdClick(adId: string): Promise<void> {
  if (!UuidSchema.safeParse(adId).success) return;
  try {
    await prisma.advertisement.update({
      where: { id: adId },
      data: { clicks: { increment: 1 } },
    });
  } catch {
    // Non-blocking analytics failure
  }
}

/* ── Admin: List All Ads ──────────────────────────────────────────── */
export async function getAdminAdsList(): Promise<AdminActionResult<AdminAdItem[]>> {
  const admin = await getAdminCaller();
  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Admin access required." };
  }

  try {
    const ads = await prisma.advertisement.findMany({
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      include: {
        createdBy: { select: { email: true } },
      },
    });

    return {
      success: true,
      data: ads.map(serializeAdminAd),
    };
  } catch (err) {
    console.error("Admin fetch ads error:", err);
    return { success: false, error: "Failed to load advertisements." };
  }
}

/* ── Admin: Create New Ad ─────────────────────────────────────────── */
export async function createAdByAdmin(
  rawInput: unknown
): Promise<AdminActionResult<AdminAdItem>> {
  const admin = await getAdminCaller();
  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Admin access required." };
  }

  const parsed = AdInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid advertisement details",
    };
  }

  const data = parsed.data;

  try {
    const created = await prisma.advertisement.create({
      data: {
        sponsorName: data.sponsorName,
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl?.trim() || null,
        targetUrl: data.targetUrl,
        ctaLabel: data.ctaLabel,
        placement: data.placement,
        audience: data.audience,
        badgeText: data.badgeText,
        isActive: data.isActive,
        priority: data.priority,
        startsAt: parseOptionalDate(data.startsAt, false),
        endsAt: parseOptionalDate(data.endsAt, true),
        createdById: admin.id,
      },
      include: {
        createdBy: { select: { email: true } },
      },
    });

    revalidateAdTargets();
    return { success: true, data: serializeAdminAd(created) };
  } catch (err) {
    console.error("Admin create ad error:", err);
    return { success: false, error: "Failed to create advertisement." };
  }
}

/* ── Admin: Update Existing Ad ────────────────────────────────────── */
export async function updateAdByAdmin(
  adId: string,
  rawInput: unknown
): Promise<AdminActionResult<AdminAdItem>> {
  const admin = await getAdminCaller();
  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Admin access required." };
  }

  if (!UuidSchema.safeParse(adId).success) {
    return { success: false, error: "Invalid advertisement ID." };
  }

  const parsed = AdInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid advertisement details",
    };
  }

  const data = parsed.data;

  try {
    const updated = await prisma.advertisement.update({
      where: { id: adId },
      data: {
        sponsorName: data.sponsorName,
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl?.trim() || null,
        targetUrl: data.targetUrl,
        ctaLabel: data.ctaLabel,
        placement: data.placement,
        audience: data.audience,
        badgeText: data.badgeText,
        isActive: data.isActive,
        priority: data.priority,
        startsAt: parseOptionalDate(data.startsAt, false),
        endsAt: parseOptionalDate(data.endsAt, true),
      },
      include: {
        createdBy: { select: { email: true } },
      },
    });

    revalidateAdTargets();
    return { success: true, data: serializeAdminAd(updated) };
  } catch (err) {
    console.error("Admin update ad error:", err);
    return { success: false, error: "Failed to update advertisement." };
  }
}

/* ── Admin: Toggle Ad Active Status ───────────────────────────────── */
export async function toggleAdActiveByAdmin(
  adId: string,
  isActive: boolean
): Promise<AdminActionResult<AdminAdItem>> {
  const admin = await getAdminCaller();
  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Admin access required." };
  }

  if (!UuidSchema.safeParse(adId).success) {
    return { success: false, error: "Invalid advertisement ID." };
  }

  try {
    const updated = await prisma.advertisement.update({
      where: { id: adId },
      data: { isActive },
      include: {
        createdBy: { select: { email: true } },
      },
    });

    revalidateAdTargets();
    return { success: true, data: serializeAdminAd(updated) };
  } catch (err) {
    console.error("Admin toggle ad error:", err);
    return { success: false, error: "Failed to toggle advertisement status." };
  }
}

/* ── Admin: Delete Ad ─────────────────────────────────────────────── */
export async function deleteAdByAdmin(adId: string): Promise<AdminActionResult> {
  const admin = await getAdminCaller();
  if (!admin || admin.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: Admin access required." };
  }

  if (!UuidSchema.safeParse(adId).success) {
    return { success: false, error: "Invalid advertisement ID." };
  }

  try {
    await prisma.advertisement.delete({ where: { id: adId } });
    revalidateAdTargets();
    return { success: true };
  } catch (err) {
    console.error("Admin delete ad error:", err);
    return { success: false, error: "Failed to delete advertisement." };
  }
}
