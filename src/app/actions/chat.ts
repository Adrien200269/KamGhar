"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export type MessageItem = {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  audioUrl?: string | null;
  isRead: boolean;
  createdAt: Date;
};

export type ConversationItem = {
  id: string;
  user1Id: string;
  user2Id: string;
  jobId?: string | null;
  updatedAt: Date;
  otherUser: {
    id: string;
    email: string;
    name: string;
    role: string;
    profilePhotoUrl?: string | null;
    kycStatus?: string | null;
  };
  job?: {
    id: string;
    title: string;
  } | null;
  lastMessage?: MessageItem | null;
  unreadCount: number;
};

/* ── Get or create a conversation between current user and target user ── */
export async function getOrCreateConversation(targetUserId: string, jobId?: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  if (user.id === targetUserId) throw new Error("Cannot chat with yourself");

  // Consistent ordering of user IDs to respect unique constraint
  const [user1Id, user2Id] = [user.id, targetUserId].sort();

  const conversation = await prisma.conversation.upsert({
    where: {
      user1Id_user2Id_jobId: {
        user1Id,
        user2Id,
        jobId: jobId || null as any,
      },
    },
    update: {},
    create: {
      user1Id,
      user2Id,
      jobId: jobId || null,
    },
  });

  return conversation.id;
}

/* ── Fetch messages for a specific conversation ───────────────── */
export async function getConversationMessages(conversationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Verify access
  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });
  if (!convo || (convo.user1Id !== user.id && convo.user2Id !== user.id)) {
    return [];
  }

  // Mark unread messages received by current user as read
  await prisma.message.updateMany({
    where: {
      conversationId,
      receiverId: user.id,
      isRead: false,
    },
    data: { isRead: true },
  });

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });

  return messages;
}

/* ── Send a message (text and/or audio voice note) ─────────────── */
export async function sendMessage(data: {
  conversationId: string;
  content: string;
  audioUrl?: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (!data.content.trim() && !data.audioUrl) {
    return { success: false, error: "Message cannot be empty." };
  }

  try {
    const convo = await prisma.conversation.findUnique({
      where: { id: data.conversationId },
    });
    if (!convo || (convo.user1Id !== user.id && convo.user2Id !== user.id)) {
      return { success: false, error: "Conversation not found." };
    }

    const receiverId = convo.user1Id === user.id ? convo.user2Id : convo.user1Id;

    const message = await prisma.message.create({
      data: {
        conversationId: data.conversationId,
        senderId: user.id,
        receiverId,
        content: data.content.trim() || (data.audioUrl ? "🎙️ Voice message" : ""),
        audioUrl: data.audioUrl || null,
      },
    });

    await prisma.conversation.update({
      where: { id: data.conversationId },
      data: { updatedAt: new Date() },
    });

    // Create notification for receiver (non-blocking)
    prisma.notification
      .create({
        data: {
          userId: receiverId,
          type: "MESSAGE",
          title: "New chat message",
          titleNe: "नयाँ च्याट सन्देश",
          message: data.content.trim() || "🎙️ Voice message",
          messageNe: data.content.trim() || "🎙️ भ्वाइस नोट",
          link: `/dashboard?chat=${data.conversationId}`,
          isRead: false,
        },
      })
      .catch(() => {});

    revalidatePath("/dashboard");
    return { success: true, message };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to send message.";
    return { success: false, error: msg };
  }
}

/* ── Fetch User's Conversations ───────────────────────────────── */
export async function getUserConversations(): Promise<ConversationItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const convos = await prisma.conversation.findMany({
    where: {
      OR: [{ user1Id: user.id }, { user2Id: user.id }],
    },
    orderBy: { updatedAt: "desc" },
    include: {
      user1: {
        select: {
          id: true,
          email: true,
          role: true,
          workerProfile: { select: { name: true, profilePhotoUrl: true, kycStatus: true } },
          recruiterProfile: { select: { name: true, profilePhotoUrl: true, kycStatus: true } },
        },
      },
      user2: {
        select: {
          id: true,
          email: true,
          role: true,
          workerProfile: { select: { name: true, profilePhotoUrl: true, kycStatus: true } },
          recruiterProfile: { select: { name: true, profilePhotoUrl: true, kycStatus: true } },
        },
      },
      job: {
        select: { id: true, title: true },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return convos.map((c) => {
    const otherUserRaw = c.user1Id === user.id ? c.user2 : c.user1;
    const profile = otherUserRaw.workerProfile || otherUserRaw.recruiterProfile;
    const name = profile?.name || otherUserRaw.email.split("@")[0];

    return {
      id: c.id,
      user1Id: c.user1Id,
      user2Id: c.user2Id,
      jobId: c.jobId,
      updatedAt: c.updatedAt,
      otherUser: {
        id: otherUserRaw.id,
        email: otherUserRaw.email,
        name,
        role: otherUserRaw.role,
        profilePhotoUrl: profile?.profilePhotoUrl ?? null,
        kycStatus: profile?.kycStatus ?? null,
      },
      job: c.job,
      lastMessage: c.messages[0] ?? null,
      unreadCount: 0,
    };
  });
}
