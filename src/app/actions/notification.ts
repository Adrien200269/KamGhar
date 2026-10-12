"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export type NotificationType =
  | "MESSAGE"
  | "JOB_APPLICATION"
  | "APPLICATION_STATUS"
  | "URGENT_BROADCAST"
  | "SYSTEM";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  titleNe: string;
  message: string;
  messageNe: string;
  createdAt: string;
  isRead: boolean;
  link?: string | null;
  conversationId?: string;
  senderName?: string;
  senderPhoto?: string | null;
  senderRole?: string;
  senderPhone?: string | null;
  senderVerified?: boolean;
  jobId?: string;
  jobTitle?: string;
  proposedRate?: number | null;
};

/* ── Fetch aggregated notifications for current user ─────────── */
export async function getUserNotifications(): Promise<{
  notifications: NotificationItem[];
  unreadCount: number;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return { notifications: [], unreadCount: 0 };
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        workerProfile: true,
        recruiterProfile: true,
      },
    });

    if (!user) {
      return { notifications: [], unreadCount: 0 };
    }

    const items: NotificationItem[] = [];

    // 1. Text Messages received by this user
    const recentMessages = await prisma.message.findMany({
      where: { receiverId: user.id },
      orderBy: { createdAt: "desc" },
      take: 15,
      include: {
        sender: {
          include: {
            workerProfile: true,
            recruiterProfile: true,
          },
        },
        conversation: {
          include: {
            job: true,
          },
        },
      },
    });

    for (const m of recentMessages) {
      const senderName =
        m.sender.workerProfile?.name ||
        m.sender.recruiterProfile?.name ||
        m.sender.email.split("@")[0] ||
        "User";
      const senderPhoto =
        m.sender.workerProfile?.profilePhotoUrl ||
        m.sender.recruiterProfile?.profilePhotoUrl ||
        null;
      const senderPhone = m.sender.phone;
      const isVerified =
        m.sender.workerProfile?.kycStatus === "VERIFIED" ||
        m.sender.recruiterProfile?.kycStatus === "VERIFIED";

      items.push({
        id: `msg-${m.id}`,
        type: "MESSAGE",
        title: `Message from ${senderName}`,
        titleNe: `${senderName} बाट नयाँ सन्देश`,
        message: m.content || "🎙️ Voice note",
        messageNe: m.content || "🎙️ भ्वाइस नोट",
        createdAt: m.createdAt.toISOString(),
        isRead: m.isRead,
        conversationId: m.conversationId,
        senderName,
        senderPhoto,
        senderPhone,
        senderRole: m.sender.role,
        senderVerified: isVerified,
        link: `/dashboard`,
        jobId: m.conversation?.jobId || undefined,
        jobTitle: m.conversation?.job?.title || undefined,
      });
    }

    // 2. Job Applications (For Recruiters)
    const applicationsOnMyJobs = await prisma.application.findMany({
      where: {
        job: { recruiterId: user.id },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        job: true,
        worker: {
          include: {
            workerProfile: true,
          },
        },
      },
    });

    for (const app of applicationsOnMyJobs) {
      const workerName =
        app.worker.workerProfile?.name ||
        app.worker.email.split("@")[0] ||
        "Skilled Worker";

      items.push({
        id: `app-${app.id}`,
        type: "JOB_APPLICATION",
        title: `New Applicant: ${app.job.title}`,
        titleNe: `नयाँ आवेदन: ${app.job.title}`,
        message: `${workerName} applied with proposed rate Rs. ${app.proposedRate || app.job.budget || "Negotiable"}.`,
        messageNe: `${workerName} ले रु. ${app.proposedRate || app.job.budget || "सहमति अनुसार"} मा आवेदन दिनुभयो।`,
        createdAt: app.createdAt.toISOString(),
        isRead: app.status !== "APPLIED",
        jobId: app.jobId,
        jobTitle: app.job.title,
        proposedRate: app.proposedRate,
        link: "/dashboard",
      });
    }

    // 3. Application Status Updates (For Workers)
    if (user.role === "WORKER" || user.workerProfile) {
      const myApplications = await prisma.application.findMany({
        where: {
          workerId: user.id,
          status: { not: "APPLIED" },
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
        include: {
          job: true,
        },
      });

      for (const app of myApplications) {
        const isAccepted = app.status === "ACCEPTED";
        items.push({
          id: `app-status-${app.id}`,
          type: "APPLICATION_STATUS",
          title: isAccepted ? `Application Accepted! 🎉` : `Application Status: ${app.status}`,
          titleNe: isAccepted ? `आवेदन स्वीकृत भयो! 🎉` : `आवेदन स्थिति: ${app.status}`,
          message: isAccepted
            ? `Your proposal for "${app.job.title}" was accepted by recruiter! Tap to coordinate.`
            : `Your application for "${app.job.title}" has been updated to ${app.status.toLowerCase()}.`,
          messageNe: isAccepted
            ? `"${app.job.title}" को लागि तपाईंको आवेदन स्वीकृत भयो! अब कुरा सुरु गर्नुहोस्।`
            : `"${app.job.title}" को आवेदन स्थिति: ${app.status}`,
          createdAt: app.updatedAt.toISOString(),
          isRead: false,
          jobId: app.jobId,
          jobTitle: app.job.title,
          link: "/dashboard",
        });
      }

      // 4. Urgent Gigs Broadcasted in Nepal
      const urgentJobs = await prisma.job.findMany({
        where: {
          urgency: "URGENT",
          status: "OPEN",
          createdAt: {
            gte: new Date(Date.now() - 48 * 60 * 60 * 1000),
          },
        },
        orderBy: { createdAt: "desc" },
        take: 4,
      });

      for (const job of urgentJobs) {
        items.push({
          id: `urgent-${job.id}`,
          type: "URGENT_BROADCAST",
          title: `🚨 Urgent Gig: ${job.title}`,
          titleNe: `🚨 आपतकालीन काम: ${job.title}`,
          message: `Location: ${job.address} • Budget Rs. ${job.budget || "Negotiable"}`,
          messageNe: `स्थान: ${job.address} • बजेट रु. ${job.budget || "सहमति अनुसार"}`,
          createdAt: job.createdAt.toISOString(),
          isRead: false,
          jobId: job.id,
          jobTitle: job.title,
          link: "/jobs",
        });
      }
    }

    // 5. Stored Notification records from DB
    try {
      const stored = await prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      for (const st of stored) {
        items.push({
          id: st.id,
          type: st.type as NotificationType,
          title: st.title,
          titleNe: st.titleNe || st.title,
          message: st.message,
          messageNe: st.messageNe || st.message,
          createdAt: st.createdAt.toISOString(),
          isRead: st.isRead,
          link: st.link,
        });
      }
    } catch {
      // Ignore if table temporarily syncing
    }

    // Sort all descending by timestamp
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Deduplicate by ID
    const uniqueMap = new Map<string, NotificationItem>();
    for (const item of items) {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    }

    const uniqueList = Array.from(uniqueMap.values()).slice(0, 30);
    const unreadCount = uniqueList.filter((i) => !i.isRead).length;

    return {
      notifications: uniqueList,
      unreadCount,
    };
  } catch (err) {
    console.error("Error fetching notifications:", err);
    return { notifications: [], unreadCount: 0 };
  }
}

/* ── Mark a specific notification as read ────────────────────── */
export async function markNotificationAsRead(id: string, type: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Not authenticated" };

    if (id.startsWith("msg-")) {
      const messageId = id.replace("msg-", "");
      await prisma.message.updateMany({
        where: { id: messageId, receiverId: user.id },
        data: { isRead: true },
      });
    } else if (!id.startsWith("app-") && !id.startsWith("urgent-")) {
      await prisma.notification.updateMany({
        where: { id, userId: user.id },
        data: { isRead: true },
      });
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error("Error marking notification as read:", err);
    return { success: false, error: "Failed to mark as read" };
  }
}

/* ── Mark all notifications as read ─────────────────────────── */
export async function markAllNotificationsAsRead() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Not authenticated" };

    // Mark all received messages as read
    await prisma.message.updateMany({
      where: { receiverId: user.id, isRead: false },
      data: { isRead: true },
    });

    // Mark all stored notifications as read
    try {
      await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      });
    } catch {
      // Non-blocking
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error("Error marking all notifications as read:", err);
    return { success: false, error: "Failed to mark all as read" };
  }
}

/* ── Create a stored notification ────────────────────────────── */
export async function createNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  titleNe?: string;
  message: string;
  messageNe?: string;
  link?: string;
}) {
  try {
    const notif = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        titleNe: data.titleNe || data.title,
        message: data.message,
        messageNe: data.messageNe || data.message,
        link: data.link || null,
        isRead: false,
      },
    });

    return { success: true, notification: notif };
  } catch (err) {
    console.error("Error creating notification:", err);
    return { success: false, error: "Failed to create notification" };
  }
}
