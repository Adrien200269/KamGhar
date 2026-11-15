"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  X,
  Loader2,
  Mic,
  Square,
  MessageCircle,
  Phone,
  ShieldCheck,
  Languages,
  CheckCheck,
  Clock,
} from "lucide-react";
import {
  sendMessage,
  getConversationMessages,
  type MessageItem,
} from "@/app/actions/chat";
import {
  RECRUITER_QUICK_TEMPLATES,
  WORKER_QUICK_TEMPLATES,
  type QuickChatTemplate,
} from "@/lib/constants";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  recipientName: string;
  recipientRole?: string;
  recipientPhoto?: string | null;
  recipientPhone?: string | null;
  recipientVerified?: boolean;
  currentUserId?: string;
  currentUserRole?: "WORKER" | "RECRUITER";
  initialMessages?: MessageItem[];
}

function createOptimisticId(counter: number): string {
  return `optimistic-${Date.now()}-${counter}`;
}

export default function ChatModal({
  isOpen,
  onClose,
  conversationId,
  recipientName,
  recipientRole,
  recipientPhoto,
  recipientPhone,
  recipientVerified,
  currentUserId,
  currentUserRole,
  initialMessages,
}: ChatModalProps) {
  const [fetchedUserId, setFetchedUserId] = useState<string>("");
  const activeUserId = currentUserId || fetchedUserId;

  const [messages, setMessages] = useState<MessageItem[]>(initialMessages || []);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(initialMessages === undefined);
  const [sending, setSending] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const msgCounterRef = useRef(0);

  // Latest message timestamp tracker for incremental polling
  const latestTimestampRef = useRef<string | null>(
    initialMessages && initialMessages.length > 0
      ? new Date(initialMessages[initialMessages.length - 1].createdAt).toISOString()
      : null
  );

  useEffect(() => {
    if (!currentUserId) {
      import("@/lib/supabase/client").then(({ createClient }) => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) setFetchedUserId(user.id);
        });
      });
    }
  }, [currentUserId]);

  // Role-tailored quick chat states
  const defaultRole: "WORKER" | "RECRUITER" =
    currentUserRole || (recipientRole === "WORKER" ? "RECRUITER" : "WORKER");
  const [selectedRole, setSelectedRole] = useState<"WORKER" | "RECRUITER" | null>(null);
  const templateRole = selectedRole || defaultRole;

  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [chatLangMode, setChatLangMode] = useState<"both" | "ne" | "en">("both");

  const formatTemplate = (
    tmpl: QuickChatTemplate,
    mode: "both" | "ne" | "en" = chatLangMode
  ): string => {
    if (mode === "ne") return tmpl.nepali;
    if (mode === "en") return tmpl.english;
    return `${tmpl.nepali}\n(${tmpl.english})`;
  };

  const activeTemplates =
    templateRole === "RECRUITER" ? RECRUITER_QUICK_TEMPLATES : WORKER_QUICK_TEMPLATES;

  const categories = ["ALL", ...Array.from(new Set(activeTemplates.map((t) => t.category)))];

  const filteredTemplates =
    selectedCategory === "ALL"
      ? activeTemplates
      : activeTemplates.filter((t) => t.category === selectedCategory);

  const topQuickPills = activeTemplates.slice(0, 4);

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Initial load and fast incremental polling
  useEffect(() => {
    if (!isOpen || !conversationId) return;

    let mounted = true;

    // Fetch full messages if not provided via props
    if (initialMessages === undefined) {
      getConversationMessages(conversationId)
        .then((msgs) => {
          if (mounted) {
            setMessages(msgs);
            setLoading(false);
            if (msgs.length > 0) {
              const last = msgs[msgs.length - 1];
              latestTimestampRef.current = new Date(last.createdAt).toISOString();
            }
          }
        })
        .catch((err) => {
          console.error("Error loading chat messages:", err);
          if (mounted) setLoading(false);
        });
    }

    // Fast incremental polling: only fetches new messages since latest timestamp
    // and pauses automatically when the user is on another tab
    const pollInterval = setInterval(async () => {
      if (typeof document !== "undefined" && document.hidden) return;

      try {
        const since = latestTimestampRef.current;
        if (since) {
          const newMsgs = await getConversationMessages(conversationId, since);
          if (mounted && newMsgs && newMsgs.length > 0) {
            setMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const fresh = newMsgs.filter((m) => !existingIds.has(m.id));
              if (fresh.length === 0) return prev;
              return [...prev, ...fresh];
            });
            const last = newMsgs[newMsgs.length - 1];
            latestTimestampRef.current = new Date(last.createdAt).toISOString();
          }
        } else {
          const msgs = await getConversationMessages(conversationId);
          if (mounted && msgs && msgs.length > 0) {
            setMessages(msgs);
            const last = msgs[msgs.length - 1];
            latestTimestampRef.current = new Date(last.createdAt).toISOString();
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2500);

    return () => {
      mounted = false;
      clearInterval(pollInterval);
    };
  }, [isOpen, conversationId, initialMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend ?? inputText).trim();
    if (!text || sending) return;

    setSending(true);
    setInputText("");
    setShowTemplates(false);

    // Instant Optimistic Message Render
    const tempId = createOptimisticId(msgCounterRef.current++);
    const optimisticMessage: MessageItem = {
      id: tempId,
      conversationId,
      senderId: activeUserId || currentUserId || "me",
      receiverId: "",
      content: text,
      audioUrl: null,
      isRead: false,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const res = await sendMessage({
        conversationId,
        content: text,
      });

      if (res.success && res.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? (res.message as MessageItem) : m))
        );
        latestTimestampRef.current = new Date(res.message.createdAt).toISOString();
      } else {
        // Roll back on error
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        alert(res.error || "Failed to send message.");
      }
    } catch (err) {
      console.error("Send error:", err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  /* ── Audio Voice Note Recording ──────────────────────────────── */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          setSending(true);

          const tempId = createOptimisticId(msgCounterRef.current++);
          const optimisticMsg: MessageItem = {
            id: tempId,
            conversationId,
            senderId: activeUserId || currentUserId || "me",
            receiverId: "",
            content: "🎙️ Voice Message (" + recordingSeconds + "s)",
            audioUrl: base64Audio,
            isRead: false,
            createdAt: new Date(),
          };
          setMessages((prev) => [...prev, optimisticMsg]);

          try {
            const res = await sendMessage({
              conversationId,
              content: "🎙️ Voice Message (" + recordingSeconds + "s)",
              audioUrl: base64Audio,
            });
            if (res.success && res.message) {
              setMessages((prev) =>
                prev.map((m) => (m.id === tempId ? (res.message as MessageItem) : m))
              );
              latestTimestampRef.current = new Date(res.message.createdAt).toISOString();
            }
          } finally {
            setSending(false);
          }
        };
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      alert("Microphone permission denied or not supported on this browser.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-lg h-[85vh] max-h-[680px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
            <div className="flex items-center gap-3">
              {recipientPhoto ? (
                <img
                  src={recipientPhoto}
                  alt={recipientName}
                  className="w-10 h-10 rounded-2xl object-cover shadow-xs border border-orange-200 dark:border-orange-800/50"
                />
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white font-extrabold text-base flex items-center justify-center shadow-xs">
                  {recipientName[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                    {recipientName}
                  </h3>
                  {recipientVerified && (
                    <span title="KamGhar Verified" className="text-blue-500">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {recipientRole === "WORKER" ? "Skilled Worker" : "Client / Recruiter"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {recipientPhone && (
                <a
                  href={`tel:${recipientPhone}`}
                  title="Direct Call"
                  className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                </a>
              )}
              <button
                onClick={() => setShowTemplates((v) => !v)}
                title="Quick Templates (नेपाली / English)"
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  showTemplates
                    ? "bg-orange-600 text-white shadow-xs"
                    : "text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40"
                }`}
              >
                <Languages className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Messages Drawer (Tailored for Recruiter & Worker + Bilingual) */}
          <AnimatePresence>
            {showTemplates && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-b border-orange-200 dark:border-orange-900/40 bg-orange-50/90 dark:bg-orange-950/40 p-3 overflow-hidden space-y-2.5"
              >
                {/* Role Toggle Selector & Bilingual Language Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="inline-flex items-center p-1 rounded-xl bg-orange-100/90 dark:bg-slate-800 border border-orange-200/90 dark:border-slate-700 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRole("RECRUITER");
                        setSelectedCategory("ALL");
                      }}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        templateRole === "RECRUITER"
                          ? "bg-orange-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <span>🏢</span>
                      <span>Recruiter / Client</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRole("WORKER");
                        setSelectedCategory("ALL");
                      }}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        templateRole === "WORKER"
                          ? "bg-orange-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <span>👷</span>
                      <span>Worker / Technician</span>
                    </button>
                  </div>

                  {/* Bilingual Language Mode Selector */}
                  <div className="inline-flex items-center p-1 rounded-xl bg-white dark:bg-slate-800 border border-orange-200/90 dark:border-slate-700 text-xs shadow-2xs self-start sm:self-auto">
                    <span className="text-[10px] font-bold text-slate-400 px-1 hidden xs:inline">Language:</span>
                    <button
                      type="button"
                      onClick={() => setChatLangMode("both")}
                      title="Send both Nepali and English combined"
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        chatLangMode === "both"
                          ? "bg-orange-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <span>🌐</span>
                      <span>Both (दुवै)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setChatLangMode("ne")}
                      title="Send Nepali only"
                      className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        chatLangMode === "ne"
                          ? "bg-orange-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <span>🇳🇵</span>
                      <span>नेपाली</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setChatLangMode("en")}
                      title="Send English only"
                      className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        chatLangMode === "en"
                          ? "bg-orange-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <span>🇬🇧</span>
                      <span>English</span>
                    </button>
                  </div>
                </div>

                {/* Category Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                  {categories.map((cat) => {
                    const isActive = selectedCategory === cat;
                    const sample = activeTemplates.find((t) => t.category === cat);
                    const label = cat === "ALL" ? "All (सबै)" : (sample ? `${sample.categoryNe}` : cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2.5 py-0.5 rounded-full font-semibold transition-all cursor-pointer whitespace-nowrap border ${
                          isActive
                            ? "bg-orange-600 text-white border-orange-600 shadow-2xs"
                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-orange-50"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Quick Messages List */}
                <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-0.5">
                  {filteredTemplates.map((tmpl, idx) => (
                    <div
                      key={idx}
                      className="text-left text-xs bg-white dark:bg-slate-800 p-2.5 rounded-2xl border border-orange-200/80 dark:border-orange-800/50 hover:border-orange-400 hover:shadow-xs transition-all space-y-1.5 group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 px-2 py-0.5 bg-orange-50 dark:bg-orange-950/60 rounded-md border border-orange-200 dark:border-orange-900/60">
                          {tmpl.categoryNe} • {tmpl.category}
                        </span>

                        {/* Direct 1-tap Send Buttons for Each Language Mode */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleSend(formatTemplate(tmpl, "both"))}
                            title="Send both Nepali & English (Bilingual)"
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-600 hover:bg-orange-700 text-white transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                          >
                            <span>🌐</span>
                            <span>Both (दुवै)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSend(formatTemplate(tmpl, "ne"))}
                            title="Send in Nepali only"
                            className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-orange-50 hover:bg-orange-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-slate-600 transition-colors cursor-pointer flex items-center gap-0.5"
                          >
                            <span>🇳🇵</span>
                            <span>नेपाली</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSend(formatTemplate(tmpl, "en"))}
                            title="Send in English only"
                            className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-orange-50 hover:bg-orange-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-slate-600 transition-colors cursor-pointer flex items-center gap-0.5"
                          >
                            <span>🇬🇧</span>
                            <span>EN</span>
                          </button>
                        </div>
                      </div>

                      {/* Prominent Nepali Text */}
                      <p className="font-semibold text-slate-900 dark:text-white leading-snug flex items-start gap-1.5 text-xs">
                        <span className="text-orange-500 font-extrabold text-[11px] mt-0.5 flex-shrink-0">ने:</span>
                        <span>{tmpl.nepali}</span>
                      </p>

                      {/* Prominent English Text */}
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic flex items-start gap-1.5 leading-snug">
                        <span className="text-slate-400 font-bold text-[10px] mt-0.5 flex-shrink-0">EN:</span>
                        <span>{tmpl.english}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/40 dark:bg-slate-950/30">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <MessageCircle className="w-10 h-10 mb-2 text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No messages yet</p>
                <p className="text-[11px] mt-0.5">
                  Say Namaste or send a quick proposal note to coordinate directly!
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = activeUserId ? m.senderId === activeUserId : m.senderId === currentUserId;
                const isOptimistic = m.id.startsWith("optimistic-");

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                        isMe
                          ? "bg-orange-600 text-white rounded-br-xs"
                          : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-700/80 rounded-bl-xs"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>

                      {/* Audio Voice Note Player if present */}
                      {m.audioUrl && (
                        <div className="mt-2 pt-2 border-t border-white/20 dark:border-slate-700">
                          <audio controls src={m.audioUrl} className="w-48 h-8 rounded-lg" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1 px-1">
                      <span className="text-[9px] text-slate-400">
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {isMe && (
                        isOptimistic ? (
                          <Clock className="w-3 h-3 text-slate-400 animate-pulse" />
                        ) : (
                          <CheckCheck className="w-3 h-3 text-orange-500" />
                        )
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer & Input Bar */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
            {/* Quick Instant Response Chips Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              <span className="text-[10px] font-extrabold text-orange-600 dark:text-orange-400 uppercase tracking-wider flex-shrink-0 flex items-center gap-1">
                <span>⚡</span>
                <span className="hidden xs:inline">{templateRole === "RECRUITER" ? "Recruiter:" : "Worker:"}</span>
              </span>

              {/* Mini Language Mode Selector */}
              <div className="inline-flex items-center p-0.5 rounded-lg bg-orange-100/90 dark:bg-slate-800 border border-orange-200/90 dark:border-slate-700 text-[10px] flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setChatLangMode("both")}
                  title="Send Both (Nepali + English)"
                  className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                    chatLangMode === "both"
                      ? "bg-orange-600 text-white"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  🌐 Both
                </button>
                <button
                  type="button"
                  onClick={() => setChatLangMode("ne")}
                  title="Send Nepali only"
                  className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                    chatLangMode === "ne"
                      ? "bg-orange-600 text-white"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  🇳🇵 NE
                </button>
                <button
                  type="button"
                  onClick={() => setChatLangMode("en")}
                  title="Send English only"
                  className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                    chatLangMode === "en"
                      ? "bg-orange-600 text-white"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  🇬🇧 EN
                </button>
              </div>

              {topQuickPills.map((pill, idx) => {
                const displayText =
                  chatLangMode === "en"
                    ? pill.english
                    : pill.nepali;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(formatTemplate(pill, chatLangMode))}
                    title={
                      chatLangMode === "both"
                        ? `${pill.nepali}\n(${pill.english})`
                        : chatLangMode === "ne"
                        ? pill.nepali
                        : pill.english
                    }
                    className="px-2.5 py-1 text-[11px] font-semibold bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded-full border border-orange-200 dark:border-orange-800/60 whitespace-nowrap transition-colors cursor-pointer flex-shrink-0 flex items-center gap-1"
                  >
                    <span>{displayText}</span>
                    {chatLangMode === "both" && (
                      <span className="text-[9px] text-orange-500 font-bold bg-orange-200/60 dark:bg-orange-900/60 px-1 rounded-sm">
                        +EN
                      </span>
                    )}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setShowTemplates((v) => !v)}
                className="px-2 py-1 text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40 rounded-full border border-dashed border-orange-300 dark:border-orange-700 whitespace-nowrap transition-colors cursor-pointer flex-shrink-0"
              >
                {showTemplates ? "Hide" : "+ More (सबै)"}
              </button>
            </div>

            {isRecording ? (
              <div className="flex items-center justify-between bg-red-50 dark:bg-red-950/40 p-2.5 rounded-2xl border border-red-200 dark:red-900/60">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
                  <span className="text-xs font-bold text-red-700 dark:text-red-400">
                    Recording audio... ({recordingSeconds}s)
                  </span>
                </div>
                <button
                  onClick={stopRecording}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Square className="w-3 h-3" />
                  <span>Send Audio</span>
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={startRecording}
                  title="Record Voice Note"
                  className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <Mic className="w-4 h-4 text-orange-600" />
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message (or tap templates)..."
                  className="flex-1 px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 dark:text-white"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="p-2.5 rounded-2xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white transition-all cursor-pointer shadow-xs"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
