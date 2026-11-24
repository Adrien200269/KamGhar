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

    const isWorkerUser = user.role === "WORKER" || !!user.workerProfile;

    // Fetch all notification sources concurrently in a single round-trip
    const [recentMessages, applicationsOnMyJobs, myApplications, urgentJobs, stored] =
      await Promise.all([
        // 1. Text Messages received by this user
        prisma.message.findMany({
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
        }),

        // 2. Job Applications (For Recruiters)
        prisma.application.findMany({
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
        }),

        // 3. Application Status Updates (For Workers)
        isWorkerUser
          ? prisma.application.findMany({
              where: {
                workerId: user.id,
                status: { not: "APPLIED" },
              },
              orderBy: { updatedAt: "desc" },
              take: 10,
              include: {
                job: true,
              },
            })
          : Promise.resolve([]),

        // 4. Urgent Gigs Broadcasted in Nepal
        isWorkerUser
          ? prisma.job.findMany({
              where: {
                urgency: "URGENT",
                status: "OPEN",
                createdAt: {
                  gte: new Date(Date.now() - 48 * 60 * 60 * 1000),
                },
              },
              orderBy: { createdAt: "desc" },
              take: 4,
            })
          : Promise.resolve([]),

        // 5. Stored Notification records from DB
        prisma.notification
          .findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            take: 100,
          })
          .catch(() => []),
      ]);

    // Build quick lookup of read notifications & read markers
    const readMarkerIds = new Set<string>();
    for (const st of stored) {
      if (st.isRead) {
        readMarkerIds.add(st.id);
      }
    }

    // Process 1. Messages
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

    // Process 2. Job Applications
    for (const app of applicationsOnMyJobs) {
      const workerName =
        app.worker.workerProfile?.name ||
        app.worker.email.split("@")[0] ||
        "Skilled Worker";

      const isRead = app.status !== "APPLIED" || readMarkerIds.has(`app-${app.id}`);

      items.push({
        id: `app-${app.id}`,
        type: "JOB_APPLICATION",
        title: `New Applicant: ${app.job.title}`,
        titleNe: `नयाँ आवेदन: ${app.job.title}`,
        message: `${workerName} applied with proposed rate Rs. ${app.proposedRate || app.job.budget || "Negotiable"}.`,
        messageNe: `${workerName} ले रु. ${app.proposedRate || app.job.budget || "सहमति अनुसार"} मा आवेदन दिनुभयो।`,
        createdAt: app.createdAt.toISOString(),
        isRead,
        jobId: app.jobId,
        jobTitle: app.job.title,
        proposedRate: app.proposedRate,
        link: "/dashboard",
      });
    }

    // Process 3. Application Status Updates
    for (const app of myApplications) {
      const isAccepted = app.status === "ACCEPTED";
      const isRead = readMarkerIds.has(`app-status-${app.id}`);

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
        isRead,
        jobId: app.jobId,
        jobTitle: app.job.title,
        link: "/dashboard",
      });
    }

    // Process 4. Urgent Gigs
    for (const job of urgentJobs) {
      const isRead = readMarkerIds.has(`urgent-${job.id}`);

      items.push({
        id: `urgent-${job.id}`,
        type: "URGENT_BROADCAST",
        title: `🚨 Urgent Gig: ${job.title}`,
        titleNe: `🚨 आपतकालीन काम: ${job.title}`,
        message: `Location: ${job.address} • Budget Rs. ${job.budget || "Negotiable"}`,
        messageNe: `स्थान: ${job.address} • बजेट रु. ${job.budget || "सहमति अनुसार"}`,
        createdAt: job.createdAt.toISOString(),
        isRead,
        jobId: job.id,
        jobTitle: job.title,
        link: "/jobs",
      });
    }

    // Process 5. Stored Notification records from DB (excluding markers & duplicate generic alerts)
    for (const st of stored) {
      // 1. Skip virtual read tracking markers
      if (st.id.startsWith("app-") || st.id.startsWith("urgent-")) {
        continue;
      }

      // 2. Skip stored chat message alerts (recentMessages covers this with full sender details and read state)
      if (st.type === "MESSAGE") {
        continue;
      }

      // 3. Skip generic duplicate job application alerts if recruiter has applications query covering it
      if (st.type === "JOB_APPLICATION" && (st.title === "New Job Applicant! 💼" || st.titleNe === "नयाँ कामदारको आवेदन! 💼")) {
        continue;
      }

      // 4. Skip generic duplicate application status alerts if worker has status query covering it
      if (st.type === "APPLICATION_STATUS" && (st.title === "Application Accepted! 🎉" || st.title === "Application Update")) {
        continue;
      }

      // 5. Skip generic duplicate urgent alerts if worker has urgentJobs query covering it
      if (st.type === "URGENT_BROADCAST" && st.title.includes("Urgent Gig Alert")) {
        continue;
      }

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
      const msg = await prisma.message
        .findUnique({
          where: { id: messageId },
          select: { conversationId: true },
        })
        .catch(() => null);

      await prisma.message.updateMany({
        where: { id: messageId, receiverId: user.id },
        data: { isRead: true },
      });

      // Also mark stored MESSAGE alerts for this user/chat as read
      if (msg?.conversationId) {
        await prisma.notification
          .updateMany({
            where: {
              userId: user.id,
              type: "MESSAGE",
              link: { contains: msg.conversationId },
              isRead: false,
            },
            data: { isRead: true },
          })
          .catch(() => {});
      }
    } else if (id.startsWith("app-") || id.startsWith("urgent-")) {
      // Persist read status marker in database for dynamic notifications
      const notifType: NotificationType = id.startsWith("urgent-")
        ? "URGENT_BROADCAST"
        : id.startsWith("app-status-")
        ? "APPLICATION_STATUS"
        : "JOB_APPLICATION";

      await prisma.notification.upsert({
        where: { id },
        create: {
          id,
          userId: user.id,
          type: notifType,
          title: "Notification Read Marker",
          message: "Marked as read",
          isRead: true,
        },
        update: {
          isRead: true,
        },
      });

      // If recruiter marked a job application as read, also mark any matching stored JOB_APPLICATION notification
      if (id.startsWith("app-") && !id.startsWith("app-status-")) {
        const appId = id.replace("app-", "");
        const app = await prisma.application
          .findUnique({
            where: { id: appId },
            select: { job: { select: { title: true } } },
          })
          .catch(() => null);

        if (app?.job?.title) {
          await prisma.notification
            .updateMany({
              where: {
                userId: user.id,
                type: "JOB_APPLICATION",
                isRead: false,
              },
              data: { isRead: true },
            })
            .catch(() => {});
        }
      }
    } else {
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
export async function markAllNotificationsAsRead(ids?: string[]) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Not authenticated" };

    // 1. Mark all received messages as read
    await prisma.message.updateMany({
      where: { receiverId: user.id, isRead: false },
      data: { isRead: true },
    });

    // 2. Mark all stored notifications as read
    try {
      await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      });
    } catch {
      // Non-blocking
    }

    // 3. Collect virtual IDs to mark as read
    const virtualIds = new Set<string>();

    if (ids && Array.isArray(ids)) {
      for (const id of ids) {
        if (id.startsWith("app-") || id.startsWith("urgent-")) {
          virtualIds.add(id);
        }
      }
    }

    // Automatically discover any dynamic notifications for current user
    const [appsOnJobs, myApps, urgentGigs] = await Promise.all([
      prisma.application.findMany({
        where: { job: { recruiterId: user.id } },
        select: { id: true },
        take: 20,
      }).catch(() => []),
      prisma.application.findMany({
        where: { workerId: user.id },
        select: { id: true },
        take: 20,
      }).catch(() => []),
      prisma.job.findMany({
        where: {
          urgency: "URGENT",
          status: "OPEN",
          createdAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
        },
        select: { id: true },
        take: 10,
      }).catch(() => []),
    ]);

    for (const a of appsOnJobs) virtualIds.add(`app-${a.id}`);
    for (const a of myApps) virtualIds.add(`app-status-${a.id}`);
    for (const j of urgentGigs) virtualIds.add(`urgent-${j.id}`);

    // Persist read markers for all virtual notification items
    if (virtualIds.size > 0) {
      await Promise.all(
        Array.from(virtualIds).map((vId) => {
          const notifType: NotificationType = vId.startsWith("urgent-")
            ? "URGENT_BROADCAST"
            : vId.startsWith("app-status-")
            ? "APPLICATION_STATUS"
            : "JOB_APPLICATION";

          return prisma.notification.upsert({
            where: { id: vId },
            create: {
              id: vId,
              userId: user.id,
              type: notifType,
              title: "Read Marker",
              message: "Marked as read",
              isRead: true,
            },
            update: {
              isRead: true,
            },
          });
        })
      ).catch(() => {});
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
