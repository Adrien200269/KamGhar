"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { CreateReviewSchema } from "@/lib/validations";

export type ReviewActionResult = {
  success: boolean;
  error?: string;
  review?: {
    id: string;
    jobId: string;
    targetUserId: string;
    rating: number;
    comment: string | null;
  };
};

/* ── Submit or Update a Review for a Worker ─────────────────── */
export async function submitReview(input: {
  jobId: string;
  targetUserId: string;
  rating: number;
  comment?: string | null;
}): Promise<ReviewActionResult> {
  const parseResult = CreateReviewSchema.safeParse(input);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.issues[0]?.message || "Invalid review data provided.",
    };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Please log in to submit a review." };
  }

  const { jobId, targetUserId, rating, comment } = parseResult.data;

  try {
    // 1. Verify job exists and caller is the recruiter
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        recruiterId: true,
        status: true,
        applications: {
          where: { workerId: targetUserId },
          select: { id: true, status: true },
        },
      },
    });

    if (!job) {
      return { success: false, error: "Job listing not found." };
    }

    if (job.recruiterId !== user.id) {
      return { success: false, error: "Only the recruiter who posted this job can submit a review." };
    }

    if (job.applications.length === 0) {
      return { success: false, error: "This worker has not applied to or worked on this job." };
    }

    // 2. Mark application status as COMPLETED if it was ACCEPTED
    await prisma.application.updateMany({
      where: {
        jobId,
        workerId: targetUserId,
        status: "ACCEPTED",
      },
      data: { status: "COMPLETED" },
    });

    // Mark job as COMPLETED if still OPEN or MATCHED
    if (job.status !== "COMPLETED") {
      await prisma.job.update({
        where: { id: jobId },
        data: { status: "COMPLETED" },
      });
    }

    // 3. Upsert the Review
    const existingReview = await prisma.review.findFirst({
      where: {
        jobId,
        authorId: user.id,
        targetUserId,
      },
    });

    let reviewRecord;
    if (existingReview) {
      reviewRecord = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating,
          comment: comment?.trim() || null,
        },
      });
    } else {
      reviewRecord = await prisma.review.create({
        data: {
          jobId,
          authorId: user.id,
          targetUserId,
          rating,
          comment: comment?.trim() || null,
        },
      });
    }

    // 4. Recalculate average rating & review count for the worker
    const allReviews = await prisma.review.findMany({
      where: { targetUserId },
      select: { rating: true },
    });

    const reviewCount = allReviews.length;
    const avgRating =
      reviewCount > 0
        ? Number((allReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1))
        : 0;

    await prisma.workerProfile.updateMany({
      where: { userId: targetUserId },
      data: {
        rating: avgRating,
        reviewCount,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/workers");
    revalidatePath("/jobs");

    return {
      success: true,
      review: {
        id: reviewRecord.id,
        jobId: reviewRecord.jobId,
        targetUserId: reviewRecord.targetUserId,
        rating: reviewRecord.rating,
        comment: reviewRecord.comment,
      },
    };
  } catch (err) {
    console.error("Submit review error:", err);
    return { success: false, error: "An unexpected error occurred while saving your review." };
  }
}

/* ── Fetch Worker's Completed Works, Count, and Reviews ────── */
export async function getWorkerRecentWorksAndReviews(workerUserId: string) {
  try {
    const [completedApps, reviews, totalWorksDone] = await Promise.all([
      prisma.application.findMany({
        where: {
          workerId: workerUserId,
          OR: [
            { status: "COMPLETED" },
            { status: "ACCEPTED", job: { status: "COMPLETED" } },
          ],
        },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              category: true,
              address: true,
              budget: true,
              status: true,
              updatedAt: true,
              createdAt: true,
              recruiter: {
                select: {
                  recruiterProfile: {
                    select: { name: true, businessName: true, profilePhotoUrl: true },
                  },
                },
              },
              reviews: {
                where: { targetUserId: workerUserId },
                select: {
                  id: true,
                  rating: true,
                  comment: true,
                  createdAt: true,
                },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 6,
      }),
      prisma.review.findMany({
        where: { targetUserId: workerUserId },
        include: {
          job: {
            select: {
              title: true,
              category: true,
            },
          },
          author: {
            select: {
              email: true,
              recruiterProfile: {
                select: { name: true, businessName: true, profilePhotoUrl: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.application.count({
        where: {
          workerId: workerUserId,
          OR: [
            { status: "COMPLETED" },
            { status: "ACCEPTED", job: { status: "COMPLETED" } },
          ],
        },
      }),
    ]);

    return {
      totalWorksDone,
      completedWorks: completedApps.map((app) => ({
        id: app.id,
        jobId: app.job.id,
        title: app.job.title,
        category: app.job.category,
        address: app.job.address,
        budget: app.proposedRate ?? app.job.budget,
        completedAt: app.updatedAt,
        clientName:
          app.job.recruiter.recruiterProfile?.businessName ||
          app.job.recruiter.recruiterProfile?.name ||
          "Client",
        clientPhoto: app.job.recruiter.recruiterProfile?.profilePhotoUrl,
        review: app.job.reviews[0] || null,
      })),
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        jobTitle: r.job.title,
        jobCategory: r.job.category,
        authorName:
          r.author.recruiterProfile?.businessName ||
          r.author.recruiterProfile?.name ||
          r.author.email.split("@")[0],
        authorPhoto: r.author.recruiterProfile?.profilePhotoUrl,
      })),
    };
  } catch (err) {
    console.error("Failed to fetch worker recent works:", err);
    return { totalWorksDone: 0, completedWorks: [], reviews: [] };
  }
}
