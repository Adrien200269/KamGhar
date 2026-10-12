"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Check,
  MessageSquare,
  Briefcase,
  AlertTriangle,
  ExternalLink,
  Loader2,
  CheckCheck,
  Flame,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type NotificationItem,
} from "@/app/actions/notification";
import { useLanguage } from "@/components/language-provider";

interface NotificationDropdownProps {
  onOpenChat?: (chatData: {
    conversationId: string;
    recipientName: string;
    recipientPhoto?: string | null;
    recipientPhone?: string | null;
    recipientRole?: string;
    recipientVerified?: boolean;
  }) => void;
}

export default function NotificationDropdown({ onOpenChat }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | "MESSAGES" | "JOBS">("ALL");
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const { lang, tx } = useLanguage();

  const fetchNotifs = async () => {
    try {
      const data = await getUserNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error("Error polling notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 6000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = async (item: NotificationItem) => {
    // Mark as read locally and remotely
    if (!item.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      markNotificationAsRead(item.id, item.type).catch(() => {});
    }

    setIsOpen(false);

    // If message notification and onOpenChat callback exists, trigger instant modal
    if (item.type === "MESSAGE" && item.conversationId) {
      if (onOpenChat) {
        onOpenChat({
          conversationId: item.conversationId,
          recipientName: item.senderName || "User",
          recipientPhoto: item.senderPhoto,
          recipientPhone: item.senderPhone,
          recipientRole: item.senderRole,
          recipientVerified: item.senderVerified,
        });
        return;
      }
      router.push(`/dashboard?chat=${item.conversationId}`);
      return;
    }

    // If job/application notification, navigate
    if (item.link) {
      router.push(item.link);
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === "MESSAGES") return item.type === "MESSAGE";
    if (activeTab === "JOBS")
      return (
        item.type === "JOB_APPLICATION" ||
        item.type === "APPLICATION_STATUS" ||
        item.type === "URGENT_BROADCAST"
      );
    return true;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          if (!isOpen) fetchNotifs();
        }}
        title={tx("Notifications", "सूचनाहरू")}
        className={`relative p-2 rounded-xl transition-all cursor-pointer ${
          isOpen
            ? "bg-orange-500 text-white shadow-xs"
            : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
        }`}
      >
        <Bell className="w-4 h-4" />

        {/* Unread badge & ping */}
        {unreadCount > 0 && (
          <>
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-extrabold text-white shadow-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 animate-ping opacity-75" />
          </>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl z-50 overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="p-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{tx("Notifications", "सूचना तथा सन्देश")}</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-[10px] font-bold">
                        {unreadCount} {tx("new", "नयाँ")}
                      </span>
                    )}
                  </h3>
                </div>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={loading}
                  className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>{tx("Mark all read", "सबै पढेको चिन्ह लगाउनुहोस्")}</span>
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-2 border-b border-slate-100 dark:border-slate-800 text-[11px] bg-white dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setActiveTab("ALL")}
                className={`flex-1 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === "ALL"
                    ? "bg-orange-500 text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {tx("All", "सबै")} ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("MESSAGES")}
                className={`flex-1 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === "MESSAGES"
                    ? "bg-orange-500 text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {tx("Messages", "च्याट")} (
                {notifications.filter((n) => n.type === "MESSAGE").length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("JOBS")}
                className={`flex-1 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === "JOBS"
                    ? "bg-orange-500 text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {tx("Jobs", "काम")} (
                {
                  notifications.filter(
                    (n) =>
                      n.type === "JOB_APPLICATION" ||
                      n.type === "APPLICATION_STATUS" ||
                      n.type === "URGENT_BROADCAST"
                  ).length
                }
                )
              </button>
            </div>

            {/* Notification Items List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 max-h-96">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2 text-slate-400">
                    <Bell className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {tx("No notifications yet", "कुनै सूचना छैन")}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {tx(
                      "Messages and job alerts will appear here in real time.",
                      "च्याट सन्देश र नयाँ कामको सूचना यहाँ देखिनेछ।"
                    )}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((item) => {
                  const isMessage = item.type === "MESSAGE";
                  const isJobApp = item.type === "JOB_APPLICATION";
                  const isStatus = item.type === "APPLICATION_STATUS";
                  const isUrgent = item.type === "URGENT_BROADCAST";

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`p-3 transition-colors cursor-pointer flex items-start gap-3 hover:bg-orange-50/50 dark:hover:bg-slate-800/50 relative group ${
                        !item.isRead
                          ? "bg-orange-50/20 dark:bg-orange-950/20"
                          : "bg-white dark:bg-slate-900"
                      }`}
                    >
                      {/* Left Icon or Sender Avatar */}
                      <div className="relative flex-shrink-0 mt-0.5">
                        {isMessage && item.senderPhoto ? (
                          <img
                            src={item.senderPhoto}
                            alt={item.senderName || "User"}
                            className="w-9 h-9 rounded-xl object-cover border border-orange-200 dark:border-orange-800/50"
                          />
                        ) : isMessage ? (
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white font-extrabold text-xs flex items-center justify-center shadow-2xs">
                            {(item.senderName || "U")[0]?.toUpperCase()}
                          </div>
                        ) : isUrgent ? (
                          <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shadow-2xs">
                            <Flame className="w-4 h-4" />
                          </div>
                        ) : isJobApp ? (
                          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-2xs">
                            <Briefcase className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-2xs">
                            <CheckCheck className="w-4 h-4" />
                          </div>
                        )}

                        {/* Unread indicator dot */}
                        {!item.isRead && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-orange-600 border-2 border-white dark:border-slate-900" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1">
                            <span>{lang === "ne" ? item.titleNe : item.title}</span>
                            {item.senderVerified && (
                              <ShieldCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                            )}
                          </h4>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0">
                            {new Date(item.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {lang === "ne" ? item.messageNe : item.message}
                        </p>

                        {/* Action Hint */}
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold group-hover:underline flex items-center gap-0.5">
                            {isMessage
                              ? tx("Open Chat 💬", "च्याट खोल्नुहोस् 💬")
                              : isJobApp
                              ? tx("Review Applicant ↗", "आवेदन हेर्नुहोस् ↗")
                              : isUrgent
                              ? tx("View Urgent Gig ⚡", "आपतकालीन काम हेर्नुहोस् ⚡")
                              : tx("View Dashboard ↗", "ड्यासबोर्ड हेर्नुहोस् ↗")}
                          </span>

                          <span className="text-[9px] text-slate-400">
                            {new Date(item.createdAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-center">
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors inline-flex items-center gap-1"
              >
                <span>{tx("Go to Full Dashboard", "ड्यासबोर्डमा जानुहोस्")}</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
