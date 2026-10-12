"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
import LanguageToggle from "@/components/language-toggle";
import NotificationDropdown from "@/components/notification-dropdown";
import ChatModal from "@/components/chat-modal";
import { useLanguage } from "@/components/language-provider";

export default function AppHeader({
  badgeText = "Gig Explorer",
  badgeTextNe = "गिग खोजकर्ता",
  isAdmin = false,
}: {
  badgeText?: string;
  badgeTextNe?: string;
  isAdmin?: boolean;
}) {
  const { tx } = useLanguage();
  const [activeChat, setActiveChat] = useState<{
    conversationId: string;
    recipientName: string;
    recipientPhoto?: string | null;
    recipientPhone?: string | null;
    recipientRole?: string;
    recipientVerified?: boolean;
  } | null>(null);

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center">
            <div className="dark:bg-white dark:rounded-xl dark:px-2.5 dark:py-1 transition-all duration-200">
              <Image src="/logo.png" alt="KamGhar" width={120} height={40} priority className="h-8 w-auto object-contain" />
            </div>
          </Link>
          <span className="hidden sm:inline text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60">
            {tx(badgeText, badgeTextNe)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <Link
            href="/jobs/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-orange-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">{tx("Post a Job", "काम पोस्ट गर्नुहोस्")}</span>
          </Link>

          {/* Notification Button & Dropdown */}
          <NotificationDropdown onOpenChat={(chat) => setActiveChat(chat)} />

          <ThemeToggle />
          <LanguageToggle />

          {isAdmin && (
            <Link
              href="/admin"
              className="px-3 py-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800/60 hover:bg-orange-100 rounded-xl transition-colors"
            >
              {tx("Admin", "प्रशासक")}
            </Link>
          )}

          <Link
            href="/dashboard"
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            {tx("Dashboard", "ड्यासबोर्ड")}
          </Link>
        </div>
      </div>

      {/* In-App Direct Chat Modal when triggered from a message notification */}
      {activeChat && (
        <ChatModal
          isOpen={!!activeChat}
          onClose={() => setActiveChat(null)}
          conversationId={activeChat.conversationId}
          recipientName={activeChat.recipientName}
          recipientRole={activeChat.recipientRole}
          recipientPhoto={activeChat.recipientPhoto}
          recipientPhone={activeChat.recipientPhone}
          recipientVerified={activeChat.recipientVerified}
        />
      )}
    </header>
  );
}
