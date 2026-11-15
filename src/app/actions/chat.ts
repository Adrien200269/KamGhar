"use server";

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

export type OpenConversationResult = {
  conversationId: string;
  messages: MessageItem[];
  currentUserId: string;
};

/* ── Get or create a conversation between current user and target user ── */
export async function getOrCreateConversation(
  targetUserId: string,
  jobId?: string | null
): Promise<OpenConversationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  if (user.id === targetUserId) throw new Error("Cannot chat with yourself");

  // Consistent ordering of user IDs to respect unique constraint
  const [user1Id, user2Id] = [user.id, targetUserId].sort();

  // 1. Fast find existing conversation and its initial messages in ONE query
  let conversation = await prisma.conversation.findFirst({
    where: {
      user1Id,
      user2Id,
      jobId: jobId || null,
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 100,
      },
    },
  });

  // 2. If no conversation exists yet, create it
  if (!conversation) {
    try {
      conversation = await prisma.conversation.create({
        data: {
          user1Id,
          user2Id,
          jobId: jobId || null,
        },
        include: {
          messages: true,
        },
      });
    } catch {
      // In case of race condition creating simultaneously
      conversation = await prisma.conversation.findFirst({
        where: {
          user1Id,
          user2Id,
          jobId: jobId || null,
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            take: 100,
          },
        },
      });
      if (!conversation) {
        throw new Error("Failed to initiate conversation");
      }
    }
  }

  // 3. Mark unread messages received by current user in the background (non-blocking)
  const hasUnread = conversation.messages.some(
    (m) => !m.isRead && m.receiverId === user.id
  );
  if (hasUnread) {
    prisma.message
      .updateMany({
        where: {
          conversationId: conversation.id,
          receiverId: user.id,
          isRead: false,
        },
        data: { isRead: true },
      })
      .catch(() => {});
  }

  return {
    conversationId: conversation.id,
    messages: conversation.messages,
    currentUserId: user.id,
  };
}

/* ── Fetch messages for a specific conversation ───────────────── */
export async function getConversationMessages(
  conversationId: string,
  afterTimestamp?: string
): Promise<MessageItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Single query: access check + fetch messages
  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      user1Id: true,
      user2Id: true,
      messages: {
        where: afterTimestamp
          ? { createdAt: { gt: new Date(afterTimestamp) } }
          : undefined,
        orderBy: { createdAt: "asc" },
        take: 100,
      },
    },
  });

  if (!convo || (convo.user1Id !== user.id && convo.user2Id !== user.id)) {
    return [];
  }

  // Mark unread messages in the background without delaying response
  const hasUnread = convo.messages.some(
    (m) => !m.isRead && m.receiverId === user.id
  );
  if (hasUnread) {
    prisma.message
      .updateMany({
        where: {
          conversationId,
          receiverId: user.id,
          isRead: false,
        },
        data: { isRead: true },
      })
      .catch(() => {});
  }

  return convo.messages;
}

/* ── Send a message (text and/or audio voice note) ─────────────── */
export async function sendMessage(data: {
  conversationId: string;
  content: string;
  audioUrl?: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const contentText = data.content.trim();
  if (!contentText && !data.audioUrl) {
    return { success: false, error: "Message cannot be empty." };
  }

  try {
    const convo = await prisma.conversation.findUnique({
      where: { id: data.conversationId },
      select: { user1Id: true, user2Id: true },
    });
    if (!convo || (convo.user1Id !== user.id && convo.user2Id !== user.id)) {
      return { success: false, error: "Conversation not found." };
    }

    const receiverId = convo.user1Id === user.id ? convo.user2Id : convo.user1Id;

    // Single transaction for creating message and updating conversation updatedAt
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: data.conversationId,
          senderId: user.id,
          receiverId,
          content: contentText || (data.audioUrl ? "🎙️ Voice message" : ""),
          audioUrl: data.audioUrl || null,
        },
      }),
      prisma.conversation.update({
        where: { id: data.conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);

    // Create notification for receiver (non-blocking background task)
    prisma.notification
      .create({
        data: {
          userId: receiverId,
          type: "MESSAGE",
          title: "New chat message",
          titleNe: "नयाँ च्याट सन्देश",
          message: contentText || "🎙️ Voice message",
          messageNe: contentText || "🎙️ भ्वाइस नोट",
          link: `/dashboard?chat=${data.conversationId}`,
          isRead: false,
        },
      })
      .catch(() => {});

    return { success: true, message };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to send message.";
    return { success: false, error: msg };
  }
}

/* ── Fetch User's Conversations ───────────────────────────────── */
export async function getUserConversations(): Promise<ConversationItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const convos = await prisma.conversation.findMany({
    where: {
      OR: [{ user1Id: user.id }, { user2Id: user.id }],
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
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
