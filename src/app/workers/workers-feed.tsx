"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  Star,
  Phone,
  Mail,
  CheckCircle2,
  X,
  Loader2,
  Users,
  RotateCcw,
  Sparkles,
  Briefcase,
  Quote,
  Clock,
  Calendar,
  MessageCircle,
  ShieldCheck,
  Zap,
  Award,
  ExternalLink,
} from "lucide-react";
import { getPublicWorkers } from "@/app/actions/profile";
import { NEPAL_DISTRICTS, getWorkerTier } from "@/lib/constants";
import ChatModal from "@/components/chat-modal";
import { getOrCreateConversation } from "@/app/actions/chat";
import { useLanguage } from "@/components/language-provider";

const POPULAR_SKILLS = [
  "ALL",
  "Electrician",
  "Plumbing",
  "Painting",
  "Carpentry",
  "Home Cleaning",
  "Appliance Repair",
  "Tutoring",
  "Motorcycle Delivery",
  "Graphic Design",
  "Web Development",
];

export type WorkerItem = {
  id: string;
  userId: string;
  name: string;
  bio: string | null;
  skills: string[];
  hourlyRate: number | null;
  rating: number;
  reviewCount: number;
  address: string | null;
  profilePhotoUrl: string | null;
  isFeatured: boolean;
  isAvailableNow?: boolean;
  kycStatus?: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  user: {
    id?: string;
    email: string;
    phone: string | null;
    applications?: {
      id: string;
      updatedAt: string | Date;
      job: {
        id: string;
        title: string;
        category: string;
        address: string;
        budget: number | null;
      };
    }[];
    reviewsReceived?: {
      id: string;
      rating: number;
      comment: string | null;
      createdAt: string | Date;
      author: {
        email: string;
        recruiterProfile: {
          name: string;
          businessName: string | null;
        } | null;
      };
      job?: {
        title: string;
      } | null;
    }[];
    _count?: {
      applications: number;
      reviewsReceived: number;
    };
  };
};

export default function WorkersFeed({
  initialWorkers,
}: {
  initialWorkers: WorkerItem[];
}) {
  const { lang, t, tx } = useLanguage();
  const [workers, setWorkers] = useState<WorkerItem[]>(initialWorkers);
  const [search, setSearch] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("ALL");
  const [selectedDistrict, setSelectedDistrict] = useState("ALL");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlyVerified, setOnlyVerified] = useState(false);

  const [selectedWorkerDetails, setSelectedWorkerDetails] = useState<WorkerItem | null>(null);

  const [activeChat, setActiveChat] = useState<{
    conversationId: string;
    recipientName: string;
    recipientRole?: string;
    recipientPhoto?: string | null;
    recipientPhone?: string | null;
    recipientVerified?: boolean;
    currentUserId: string;
  } | null>(null);

  const handleStartChat = async (worker: WorkerItem) => {
    try {
      const convoId = await getOrCreateConversation(worker.userId);
      setActiveChat({
        conversationId: convoId,
        recipientName: worker.name,
        recipientRole: "WORKER",
        recipientPhoto: worker.profilePhotoUrl,
        recipientPhone: worker.user.phone,
        recipientVerified: worker.kycStatus === "VERIFIED",
        currentUserId: "", // Handled inside or server
      });
    } catch (err) {
      console.error("Could not start chat:", err);
    }
  };

  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (
    newSearch = search,
    newSkill = selectedSkill,
    newDist = selectedDistrict,
    newAvail = onlyAvailable,
    newVerif = onlyVerified
  ) => {
    startTransition(async () => {
      const updated = await getPublicWorkers({
        search: newSearch,
        skill: newSkill,
        district: newDist,
        availableOnly: newAvail,
        verifiedOnly: newVerif,
      });
      setWorkers(updated as unknown as WorkerItem[]);
    });
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedSkill("ALL");
    setSelectedDistrict("ALL");
    setOnlyAvailable(false);
    setOnlyVerified(false);
    handleFilterChange("", "ALL", "ALL", false, false);
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedSkill !== "ALL" ||
    selectedDistrict !== "ALL" ||
    onlyAvailable ||
    onlyVerified;

  return (
    <div className="space-y-8">
      {/* ── Search & Filter Panel ───────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-5">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 text-orange-600 dark:text-orange-400 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>{tx("Verified Local Talent", "प्रमाणित स्थानीय जनशक्ति")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {tx("Find Skilled Workers & Technicians", "दक्ष कामदार तथा प्राविधिकहरू खोज्नुहोस्")}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {tx(
              "Browse verified technicians, trade experts, and freelance professionals. View completed works, authentic 5-star reviews, and contact workers directly.",
              "प्रमाणित प्राविधिक, सिकर्मी, डकर्मी तथा दक्ष पेशाकर्मीहरू खोज्नुहोस्। सम्पन्न कामहरू, वास्तविक समीक्षाहरू हेर्नुहोस् र सिधै सम्पर्क गर्नुहोस्।"
            )}
          </p>
        </div>

        {/* Search Input + District Dropdown */}
        <div className="grid sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                handleFilterChange(e.target.value);
              }}
              placeholder={tx("Search by worker name, skill, or area (e.g. Electrician, Lalitpur)...", "कामदारको नाम, सीप वा स्थान खोज्नुहोस् (उदा. इलेक्ट्रीसियन, ललितपुर)...")}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                handleFilterChange(search, selectedSkill, e.target.value);
              }}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white"
            >
              <option value="ALL">{tx("All Districts (Nepal)", "सबै जिल्लाहरू (नेपाल)")}</option>
              {NEPAL_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Filter Toggles & Popular Skills Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
          {/* Available Now Toggle Button */}
          <button
            onClick={() => {
              const nextVal = !onlyAvailable;
              setOnlyAvailable(nextVal);
              handleFilterChange(search, selectedSkill, selectedDistrict, nextVal, onlyVerified);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
              onlyAvailable
                ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${onlyAvailable ? "bg-white" : "bg-emerald-500 animate-pulse"}`} />
            <span>{tx("Available Now", "अहिले उपलब्ध")}</span>
          </button>

          {/* Verified Only Toggle Button */}
          <button
            onClick={() => {
              const nextVal = !onlyVerified;
              setOnlyVerified(nextVal);
              handleFilterChange(search, selectedSkill, selectedDistrict, onlyAvailable, nextVal);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
              onlyVerified
                ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20"
                : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{tx("Verified Talent", "प्रमाणित जनशक्ति")}</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 flex-shrink-0" />

          {POPULAR_SKILLS.map((skill) => {
            const active = selectedSkill === skill;
            return (
              <button
                key={skill}
                onClick={() => {
                  setSelectedSkill(skill);
                  handleFilterChange(search, skill, selectedDistrict, onlyAvailable, onlyVerified);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? "bg-orange-600 text-white shadow-md shadow-orange-500/20"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {skill}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Workers Grid or Empty State ─────────────────────── */}
      {isPending ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Updating workers list...</p>
        </div>
      ) : workers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-4">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No workers found for this selection
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto mb-6">
            Try searching for a different skill, expanding to all districts, or clearing your search term.
          </p>
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {workers.map((worker) => {
            const initial = worker.name ? worker.name[0].toUpperCase() : "W";
            const worksDone = worker.user?._count?.applications ?? 0;
            const recentReview = worker.user?.reviewsReceived?.[0];
            const recentWork = worker.user?.applications?.[0];
            const tier = getWorkerTier(worksDone, worker.rating || 5.0);
            const rawPhone = worker.user?.phone?.replace(/[^0-9]/g, "");
            const whatsAppPhone = rawPhone && (rawPhone.startsWith("977") ? rawPhone : rawPhone.length === 10 ? `977${rawPhone}` : null);

            return (
              <motion.div
                key={worker.id}
                layout
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-orange-300 dark:hover:border-orange-800/80 transition-all"
              >
                <div className="space-y-4">
                  {/* Top Profile Summary */}
                  <div className="flex items-start gap-3.5">
                    {worker.profilePhotoUrl ? (
                      <img
                        src={worker.profilePhotoUrl}
                        alt={worker.name}
                        className="w-13 h-13 rounded-2xl object-cover flex-shrink-0 shadow-md border border-orange-200 dark:border-orange-800/50"
                      />
                    ) : (
                      <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white font-extrabold text-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-orange-500/20">
                        {initial}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h3 className="font-extrabold text-base text-slate-900 dark:text-white truncate">
                            {worker.name}
                          </h3>
                          {worker.kycStatus === "VERIFIED" && (
                            <span
                              title="KamGhar Verified - Citizenship / KYC Confirmed"
                              className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60"
                            >
                              <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                              <span className="hidden sm:inline">Verified</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {worker.isAvailableNow ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1 shadow-xs whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Available Now</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 whitespace-nowrap">
                              Available
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-orange-500 flex-shrink-0" />
                        <span className="truncate">{worker.address ? `${worker.address}, Nepal` : "Nepal"}</span>
                      </p>

                      {/* Works Done Badge + Tier Badge */}
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${tier.badgeClass}`}>
                          <Award className={`w-3 h-3 ${tier.iconColor}`} />
                          <span>{lang === "ne" ? tier.labelNe : tier.label}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60">
                          <CheckCircle2 className="w-3 h-3 text-blue-500" />
                          <span>{worksDone} {worksDone === 1 ? "Work Done" : "Works Done"}</span>
                        </span>
                        {worker.isFeatured && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                            <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {worker.bio && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {worker.bio}
                    </p>
                  )}

                  {/* Skills Tags */}
                  {worker.skills && worker.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {worker.skills.slice(0, 4).map((s) => (
                        <span
                          key={s}
                          className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60"
                        >
                          {s}
                        </span>
                      ))}
                      {worker.skills.length > 4 && (
                        <span className="text-[10px] text-slate-400 self-center">
                          +{worker.skills.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Recent Work or Recent Review Snippet */}
                  {recentReview?.comment ? (
                    <div className="bg-amber-50/70 dark:bg-amber-950/25 rounded-xl p-2.5 border border-amber-200/60 dark:border-amber-800/50 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-amber-700 dark:text-amber-400">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                          <span>{recentReview.rating}★ Review from Client</span>
                        </span>
                        <span className="text-slate-400 font-normal">
                          {new Date(recentReview.createdAt).toLocaleDateString("en-NP", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <p className="italic text-slate-600 dark:text-slate-300 line-clamp-2">
                        &ldquo;{recentReview.comment}&rdquo;
                      </p>
                    </div>
                  ) : recentWork ? (
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl px-2.5 py-1.5 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      <span className="truncate">
                        Recent: <strong className="text-slate-700 dark:text-slate-200">{recentWork.job.title}</strong>
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Footer Info & Actions */}
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                      <strong>{worker.rating ? worker.rating.toFixed(1) : "5.0"}</strong>
                      <span className="text-slate-400">({worker.reviewCount} {worker.reviewCount === 1 ? "review" : "reviews"})</span>
                    </span>

                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {worker.hourlyRate ? `Rs. ${worker.hourlyRate}/hr` : "Rate on Request"}
                    </span>
                  </div>

                  <div className={`grid ${whatsAppPhone ? "grid-cols-[1fr_1fr_auto]" : "grid-cols-2"} gap-2`}>
                    <button
                      onClick={() => setSelectedWorkerDetails(worker)}
                      className="w-full py-2 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-orange-500" />
                      <span>{lang === "ne" ? "अनुभव" : "Experience"}</span>
                    </button>

                    <button
                      onClick={() => handleStartChat(worker)}
                      className="w-full py-2 px-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-orange-600/20 transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{lang === "ne" ? "च्याट" : "Chat Now"}</span>
                    </button>

                    {whatsAppPhone && (
                      <a
                        href={`https://wa.me/${whatsAppPhone}?text=${encodeURIComponent(
                          `Namaste ${worker.name}, I found your profile on KamGhar and want to inquire about a gig.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center shadow-xs cursor-pointer"
                        title="Inquire on WhatsApp"
                      >
                        <span className="text-[11px] font-black">WA</span>
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Worker Details, Experience & Reviews Modal ───────── */}
      <AnimatePresence>
        {selectedWorkerDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  {selectedWorkerDetails.profilePhotoUrl ? (
                    <img
                      src={selectedWorkerDetails.profilePhotoUrl}
                      alt={selectedWorkerDetails.name}
                      className="w-14 h-14 rounded-2xl object-cover shadow-md border border-orange-200 dark:border-orange-800/50"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-orange-500/20">
                      {selectedWorkerDetails.name[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                        {selectedWorkerDetails.name}
                      </h3>
                      {(() => {
                        const mTier = getWorkerTier(
                          selectedWorkerDetails.user?._count?.applications ?? 0,
                          selectedWorkerDetails.rating || 5.0
                        );
                        return (
                          <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-md border ${mTier.badgeClass}`}>
                            <Award className={`w-3.5 h-3.5 ${mTier.iconColor}`} />
                            <span>{lang === "ne" ? mTier.labelNe : mTier.label}</span>
                          </span>
                        );
                      })()}
                      {selectedWorkerDetails.kycStatus === "VERIFIED" && (
                        <span
                          title="KamGhar Verified - Citizenship / KYC Confirmed"
                          className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>KamGhar Verified</span>
                        </span>
                      )}
                      {selectedWorkerDetails.isAvailableNow ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Available Now</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          Available
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-orange-500" />
                      <span>{selectedWorkerDetails.address ? `${selectedWorkerDetails.address}, Nepal` : "Nepal"}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedWorkerDetails(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Bio & Skills */}
              {selectedWorkerDetails.bio && (
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                  {selectedWorkerDetails.bio}
                </p>
              )}

              {/* Stats Highlights */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/50">
                  <div className="flex items-center justify-center text-blue-600 dark:text-blue-400 mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="block text-base font-extrabold text-slate-900 dark:text-white">
                    {selectedWorkerDetails.user?._count?.applications ?? 0}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Works Done
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50">
                  <div className="flex items-center justify-center text-amber-500 mb-1">
                    <Star className="w-4 h-4 fill-amber-400" />
                  </div>
                  <span className="block text-base font-extrabold text-slate-900 dark:text-white">
                    {selectedWorkerDetails.rating ? selectedWorkerDetails.rating.toFixed(1) : "5.0"}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {selectedWorkerDetails.reviewCount} Reviews
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50">
                  <div className="flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-1">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="block text-xs font-extrabold text-slate-900 dark:text-white">
                    {selectedWorkerDetails.hourlyRate ? `Rs. ${selectedWorkerDetails.hourlyRate}/hr` : "On Request"}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Standard Rate
                  </span>
                </div>
              </div>

              {/* ── Section: Recent Completed Works ─────────── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-orange-500" />
                    <span>Recent Completed Work</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Total: {selectedWorkerDetails.user?._count?.applications ?? 0} jobs
                  </span>
                </div>

                {selectedWorkerDetails.user?.applications &&
                selectedWorkerDetails.user.applications.length > 0 ? (
                  <div className="space-y-2">
                    {selectedWorkerDetails.user.applications.map((app) => (
                      <div
                        key={app.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {app.job.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-[10px]">
                              {app.job.category}
                            </span>
                            <span>•</span>
                            <span>{app.job.address}</span>
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[10px] whitespace-nowrap">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Completed</span>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                    No completed works recorded on the platform yet.
                  </div>
                )}
              </div>

              {/* ── Section: Client Reviews (5 Stars) ───────── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    <span>Client Reviews &amp; Ratings ({selectedWorkerDetails.reviewCount})</span>
                  </h4>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                    {selectedWorkerDetails.rating ? selectedWorkerDetails.rating.toFixed(1) : "5.0"} / 5.0
                  </span>
                </div>

                {selectedWorkerDetails.user?.reviewsReceived &&
                selectedWorkerDetails.user.reviewsReceived.length > 0 ? (
                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {selectedWorkerDetails.user.reviewsReceived.map((rev) => {
                      const clientName =
                        rev.author.recruiterProfile?.businessName ||
                        rev.author.recruiterProfile?.name ||
                        rev.author.email.split("@")[0];

                      return (
                        <div
                          key={rev.id}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {clientName}
                            </span>
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3 h-3 ${
                                    star <= rev.rating
                                      ? "text-amber-500 fill-amber-400"
                                      : "text-slate-300 dark:text-slate-600"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          {rev.job?.title && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Job: <span className="font-medium text-slate-700 dark:text-slate-300">{rev.job.title}</span>
                            </p>
                          )}

                          {rev.comment && (
                            <p className="italic text-slate-600 dark:text-slate-300 text-xs">
                              &ldquo;{rev.comment}&rdquo;
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                    No client reviews yet. Recruiters can review this worker after completing work!
                  </div>
                )}
              </div>

              {/* ── Direct Contact Actions ──────────────────── */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Contact Worker
                </p>

                {selectedWorkerDetails.user.phone ? (
                  <>
                    <a
                      href={`tel:${selectedWorkerDetails.user.phone}`}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 font-bold text-sm hover:bg-emerald-100 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Phone className="w-4 h-4 text-emerald-600" />
                        <span>{selectedWorkerDetails.user.phone}</span>
                      </div>
                      <span className="text-xs font-semibold underline">{lang === "ne" ? "कल गर्नुहोस्" : "Call Now"}</span>
                    </a>

                    {(() => {
                      const raw = selectedWorkerDetails.user.phone.replace(/[^0-9]/g, "");
                      const waNum = raw.startsWith("977") ? raw : raw.length === 10 ? `977${raw}` : null;
                      if (!waNum) return null;
                      return (
                        <a
                          href={`https://wa.me/${waNum}?text=${encodeURIComponent(
                            `Namaste ${selectedWorkerDetails.name}, I am contacting you via KamGhar regarding potential work.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#128C7E] dark:text-[#25D366] font-bold text-sm transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-[#25D366] text-white flex items-center justify-center text-[10px] font-black">WA</span>
                            <span>Chat on WhatsApp</span>
                          </div>
                          <span className="text-xs font-semibold underline flex items-center gap-1">
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </span>
                        </a>
                      );
                    })()}
                  </>
                ) : (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>Phone number not provided yet</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const target = selectedWorkerDetails;
                    setSelectedWorkerDetails(null);
                    handleStartChat(target);
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <MessageCircle className="w-4 h-4" />
                    <span>Send In-App Message / Voice Note</span>
                  </div>
                  <span className="text-xs underline font-semibold">Chat</span>
                </button>

                <a
                  href={`mailto:${selectedWorkerDetails.user.email}`}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-orange-500" />
                    <span>{selectedWorkerDetails.user.email}</span>
                  </div>
                  <span className="text-xs font-semibold text-orange-600 underline">Send Email</span>
                </a>
              </div>

              <div>
                <button
                  onClick={() => setSelectedWorkerDetails(null)}
                  className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Real-Time In-App Chat Modal ─────────────────────── */}
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
          currentUserId=""
          currentUserRole="RECRUITER"
        />
      )}
    </div>
  );
}
