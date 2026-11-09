"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Star,
  ShieldCheck,
  ShieldAlert,
  Phone,
  MessageSquare,
  MessageCircle,
  QrCode,
  Share2,
  Copy,
  Check,
  Briefcase,
  FileText,
  Clock,
  Sparkles,
  ArrowLeft,
  Calendar,
  Send,
  Loader2,
  DollarSign,
  Award,
} from "lucide-react";
import AppHeader from "@/components/app-header";
import { useLanguage } from "@/components/language-provider";
import { getWorkerTier } from "@/lib/constants";
import { requestDirectHire } from "@/app/actions/job";
import { getOrCreateConversation } from "@/app/actions/chat";
import ChatModal from "@/components/chat-modal";
import BoostPaymentModal from "@/components/boost-payment-modal";
import WorkerVisitingCardModal from "@/components/worker-visiting-card-modal";
import SafetyToolkitModal from "@/components/safety-toolkit-modal";
import { getWorkerWhatsAppUrl } from "@/lib/whatsapp";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("@/components/map-picker"), { ssr: false });

export default function WorkerProfileView({
  data,
}: {
  data: {
    worker: any;
    isOwner: boolean;
    isRecruiter: boolean;
    recruiterOpenJobs: { id: string; title: string; category: string; budget: number | null }[];
    currentUserId: string | null;
  };
}) {
  const { worker, isOwner, isRecruiter, recruiterOpenJobs, currentUserId } = data;
  const profile = worker.workerProfile;
  const { lang, tx } = useLanguage();
  const router = useRouter();

  const [copied, setCopied] = useState(false);
  const [showDirectHireModal, setShowDirectHireModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [activeChatConvoId, setActiveChatConvoId] = useState<string | null>(null);
  const [showVisitingCardModal, setShowVisitingCardModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  const directWhatsAppUrl = getWorkerWhatsAppUrl({
    phone: worker.phone,
    workerName: profile.name,
    skill: profile.skills[0],
  });

  // Direct Hire Form State
  const [selectedJobId, setSelectedJobId] = useState<string>(
    recruiterOpenJobs.length > 0 ? recruiterOpenJobs[0].id : "NEW"
  );
  const [hireTitle, setHireTitle] = useState("");
  const [hireCategory, setHireCategory] = useState(profile.skills[0] || "Electrician");
  const [hireBudget, setHireBudget] = useState(profile.hourlyRate ? profile.hourlyRate.toString() : "");
  const [hireTime, setHireTime] = useState("Today Afternoon");
  const [hireAddress, setHireAddress] = useState("");
  const [isHiring, startHireTransition] = useTransition();
  const [hireSuccess, setHireSuccess] = useState(false);
  const [hireError, setHireError] = useState<string | null>(null);

  const completedJobsCount = worker.applications.length;
  const tier = getWorkerTier(completedJobsCount, profile.rating);
  const shareUrl = typeof window !== "undefined" ? window.location.href : `https://kamghar.com/workers/${worker.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `👋 Check out *${profile.name}* on KamGhar!\nRating: ${profile.rating.toFixed(1)}/5 • Skills: ${profile.skills.join(", ")}\nHire or view portfolio: ${shareUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleStartChat = async () => {
    if (!currentUserId) {
      router.push(`/login?next=/workers/${worker.id}`);
      return;
    }
    try {
      const convoId = await getOrCreateConversation(worker.id);
      setActiveChatConvoId(convoId);
    } catch (err) {
      console.error("Failed to start chat:", err);
    }
  };

  const handleDirectHireSubmit = () => {
    setHireError(null);
    startHireTransition(async () => {
      const res = await requestDirectHire({
        workerId: worker.id,
        jobId: selectedJobId !== "NEW" ? selectedJobId : undefined,
        title: selectedJobId === "NEW" ? hireTitle : undefined,
        category: selectedJobId === "NEW" ? hireCategory : undefined,
        budget: hireBudget ? parseFloat(hireBudget) : undefined,
        address: hireAddress || profile.address,
        scheduledTime: hireTime,
      });

      if (res.success) {
        setHireSuccess(true);
        setTimeout(() => {
          setShowDirectHireModal(false);
          setHireSuccess(false);
        }, 2000);
      } else {
        setHireError(res.error || "Failed to dispatch request");
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <AppHeader />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Back Link */}
        <Link
          href="/workers"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-orange-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{tx("Back to Workers Directory", "कामदारहरूको सूचीमा फर्कनुहोस्")}</span>
        </Link>

        {/* Worker Hero Profile Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex items-start gap-5">
              {/* Profile Photo */}
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-orange-100 dark:bg-orange-950/70 border-2 border-orange-200 dark:border-orange-800 flex items-center justify-center font-black text-2xl text-orange-600 overflow-hidden shadow-md">
                  {profile.profilePhotoUrl ? (
                    <img src={profile.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    profile.name.slice(0, 2).toUpperCase()
                  )}
                </div>

                {profile.isAvailableNow && (
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center" title="Available Now">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  </span>
                )}
              </div>

              {/* Identity & Badges */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {profile.name}
                  </h1>

                  {profile.kycStatus === "VERIFIED" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verified KYC</span>
                    </span>
                  )}

                  <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${tier.badgeClass}`}>
                    <Award className="w-3.5 h-3.5" />
                    <span>{lang === "ne" ? tier.labelNe : tier.label}</span>
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <span>{profile.address ? `${profile.address}, Nepal` : "Nepal"}</span>
                </p>

                {/* Rating & Works */}
                <div className="flex items-center gap-4 text-xs pt-1">
                  <span className="flex items-center gap-1 font-bold text-amber-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-slate-900 dark:text-white font-extrabold">{profile.rating.toFixed(1)}</span>
                    <span className="text-slate-400 font-normal">({profile.reviewCount} reviews)</span>
                  </span>

                  <span className="text-slate-300 dark:text-slate-700">•</span>

                  <span className="text-slate-600 dark:text-slate-400 font-semibold">
                    {completedJobsCount} gigs completed
                  </span>
                </div>
              </div>
            </div>

            {/* Hourly Rate & Direct Action */}
            <div className="flex flex-col sm:items-end justify-between gap-3">
              <div className="p-3.5 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-900/60 text-left sm:text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  {tx("Standard Rate", "पारिश्रमिक दर")}
                </span>
                <p className="text-xl font-black text-orange-600 dark:text-orange-400 mt-0.5">
                  {profile.hourlyRate ? `Rs. ${profile.hourlyRate} / hr` : tx("Negotiable", "सहमति अनुसार")}
                </p>
              </div>

              {isOwner ? (
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <button
                    type="button"
                    onClick={() => setShowVisitingCardModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold transition hover:opacity-90"
                  >
                    <QrCode className="w-4 h-4 text-orange-400" />
                    <span>{tx("Visiting Card & QR", "भिजिटिङ कार्ड")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSafetyModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-bold hover:bg-red-100 transition"
                  >
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <span>{tx("Safety SOS", "सुरक्षा")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFeatureModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md transition"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{tx("Feature Profile", "फिचर्ड")}</span>
                  </button>
                  <Link
                    href="/dashboard"
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition"
                  >
                    {tx("Edit Profile", "सम्पादन")}
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <button
                    type="button"
                    onClick={() => setShowVisitingCardModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-800 dark:text-slate-200 text-xs font-bold transition"
                  >
                    <QrCode className="w-4 h-4 text-orange-500" />
                    <span>{tx("Visiting Card", "कार्ड")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSafetyModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-bold hover:bg-red-100 transition"
                  >
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <span>{tx("Safety SOS", "सुरक्षा")}</span>
                  </button>

                  {directWhatsAppUrl && (
                    <a
                      href={directWhatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={handleStartChat}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-800 dark:text-slate-200 text-xs font-bold transition"
                  >
                    <MessageSquare className="w-4 h-4 text-orange-600" />
                    <span>{tx("Chat", "च्याट")}</span>
                  </button>

                  {worker.phone && (
                    <a
                      href={`tel:${worker.phone}`}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-800 dark:text-slate-200 text-xs font-bold transition"
                    >
                      <Phone className="w-4 h-4 text-emerald-600" />
                      <span>{tx("Call", "फोन")}</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (!currentUserId) {
                        router.push(`/login?next=/workers/${worker.id}`);
                      } else {
                        setShowDirectHireModal(true);
                      }
                    }}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold shadow-md hover:shadow-orange-500/25 active:scale-95 transition"
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>{tx("Direct Hire / Book", "काम दिनुहोस्")}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Skills Badges */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              {tx("Skills & Expertise", "दक्षता र सीपहरु")}
            </span>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill: string) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                {tx("About the Worker", "कामदारको बारेमा")}
              </span>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {profile.bio}
              </p>
            </div>
          )}

          {/* CV Attachment if uploaded */}
          {profile.cvUrl && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {profile.name} - Official CV / Experience Doc
                  </p>
                  <p className="text-[10px] text-slate-400">Verified PDF Document</p>
                </div>
              </div>
              <a
                href={profile.cvUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition"
              >
                {tx("View CV", "CV हेर्नुहोस्")}
              </a>
            </div>
          )}

          {/* Social Share Bar */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5" />
              <span>{tx("Share Worker Profile", "प्रोफाइल सेयर गर्नुहोस्")}:</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleWhatsApp}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition"
              >
                WhatsApp
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? tx("Copied!", "प्रतिलिपि भयो!") : tx("Copy Link", "लिङ्क कपी")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Location Map Section */}
        {profile.latitude && profile.longitude && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              {tx("Service Base Area", "कार्यक्षेत्रको स्थान")}
            </h3>
            <div className="h-64 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
              <MapPicker
                lat={profile.latitude}
                lng={profile.longitude}
                onChange={() => {}}
              />
            </div>
          </div>
        )}

        {/* Completed Jobs History */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>{tx("Recent Completed Gigs", "हालै सम्पन्न कामहरु")}</span>
            <span className="text-xs font-semibold text-slate-500">{worker.applications.length} completed</span>
          </h3>

          {worker.applications.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              {tx("No completed gigs recorded yet.", "अहिलेसम्म कुनै सम्पन्न काम दर्ता भएको छैन।")}
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {worker.applications.map((app: any) => (
                <div
                  key={app.id}
                  className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start justify-between"
                >
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      {app.job?.title || "Gig Work"}
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">{app.job?.category} • {app.job?.address}</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-200">
                    Completed
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reviews & Testimonials */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>{tx("Client Reviews & Ratings", "ग्राहक समीक्षा तथा प्रतिक्रिया")}</span>
            <span className="text-xs font-semibold text-amber-500 font-bold">★ {profile.rating.toFixed(1)}</span>
          </h3>

          {worker.reviewsReceived.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              {tx("No reviews received yet. Be the first to hire and rate!", "अहिलेसम्म कुनै समीक्षा छैन। काम दिएर पहिलो समीक्षा गर्नुहोस्!")}
            </p>
          ) : (
            <div className="space-y-3">
              {worker.reviewsReceived.map((rev: any) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {rev.author?.recruiterProfile?.name || "Client"}
                      </span>
                      {rev.author?.recruiterProfile?.businessName && (
                        <span className="text-[11px] text-orange-600 ml-1.5 font-medium">
                          ({rev.author.recruiterProfile.businessName})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i < rev.rating ? "fill-current" : "text-slate-300 dark:text-slate-600"}`}
                        />
                      ))}
                    </div>
                  </div>
                  {rev.comment && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                      "{rev.comment}"
                    </p>
                  )}
                  {rev.job && (
                    <span className="text-[10px] text-slate-400 block">
                      For: {rev.job.title} ({rev.job.category})
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Direct Hire Modal */}
      {showDirectHireModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {tx("Direct Hire / Booking Offer", "प्रत्यक्ष कामको प्रस्ताव पठाउनुहोस्")}
                </h3>
                <p className="text-xs text-slate-500">To: {profile.name}</p>
              </div>
              <button
                onClick={() => setShowDirectHireModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {hireSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {tx("Direct Hire Request Dispatched!", "प्रस्ताव सफलतापूर्वक पठाइयो!")}
                </h4>
                <p className="text-xs text-slate-500">
                  {profile.name} has been notified and can confirm immediately.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recruiterOpenJobs.length > 0 && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {tx("Link Existing Job or Create Custom", "खुला काम छान्नुहोस् वा नयाँ सिर्जना गर्नुहोस्")}
                    </label>
                    <select
                      value={selectedJobId}
                      onChange={(e) => setSelectedJobId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                    >
                      {recruiterOpenJobs.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.title} ({j.category} - Rs. {j.budget || "Negotiable"})
                        </option>
                      ))}
                      <option value="NEW">+ {tx("Create a New Quick Gig Task", "नयाँ काम लेख्नुहोस्")}</option>
                    </select>
                  </div>
                )}

                {selectedJobId === "NEW" && (
                  <>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        {tx("Task Title", "कामको शीर्षक")}
                      </label>
                      <input
                        type="text"
                        value={hireTitle}
                        onChange={(e) => setHireTitle(e.target.value)}
                        placeholder="e.g. Living room wall wiring repair"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        {tx("Service Category", "वर्ग")}
                      </label>
                      <input
                        type="text"
                        value={hireCategory}
                        onChange={(e) => setHireCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                      />
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {tx("Proposed Budget (Rs.)", "बजेट (रु.)")}
                    </label>
                    <input
                      type="number"
                      value={hireBudget}
                      onChange={(e) => setHireBudget(e.target.value)}
                      placeholder="1200"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {tx("Preferred Time", "समय")}
                    </label>
                    <input
                      type="text"
                      value={hireTime}
                      onChange={(e) => setHireTime(e.target.value)}
                      placeholder="Today 2 PM"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {tx("Service Address / Landmark", "ठेगाना")}
                  </label>
                  <input
                    type="text"
                    value={hireAddress}
                    onChange={(e) => setHireAddress(e.target.value)}
                    placeholder="e.g. New Baneshwor, near Eye Hospital"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                {hireError && <p className="text-xs text-red-600 font-semibold">{hireError}</p>}

                <button
                  type="button"
                  onClick={handleDirectHireSubmit}
                  disabled={isHiring}
                  className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isHiring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{tx("Send Direct Offer", "प्रस्ताव पठाउनुहोस्")}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Visiting Card & QR Modal */}
      {showVisitingCardModal && (
        <WorkerVisitingCardModal
          isOpen={showVisitingCardModal}
          onClose={() => setShowVisitingCardModal(false)}
          worker={{
            id: worker.id,
            name: profile.name,
            photo: profile.profilePhotoUrl,
            phone: worker.phone,
            address: profile.address,
            primarySkill: profile.skills[0],
            skills: profile.skills,
            experienceYears: profile.experienceYears,
            hourlyRate: profile.hourlyRate,
            avgRating: profile.rating,
            reviewCount: profile.reviewCount,
            verified: profile.kycStatus === "VERIFIED",
          }}
        />
      )}

      {/* Safety Toolkit Modal */}
      {showSafetyModal && (
        <SafetyToolkitModal
          isOpen={showSafetyModal}
          onClose={() => setShowSafetyModal(false)}
          contactName={profile.name}
          contactPhone={worker.phone}
          location={profile.address || undefined}
        />
      )}

      {/* Feature Profile Modal (If Owner) */}
      {showFeatureModal && (
        <BoostPaymentModal
          isOpen={showFeatureModal}
          onClose={() => setShowFeatureModal(false)}
          type="FEATURE_PROFILE"
          itemTitle={profile.name}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}

      {/* Chat Modal */}
      {activeChatConvoId && (
        <ChatModal
          isOpen={!!activeChatConvoId}
          conversationId={activeChatConvoId}
          recipientName={profile.name}
          recipientRole="WORKER"
          recipientPhoto={profile.profilePhotoUrl}
          recipientPhone={worker.phone}
          recipientVerified={profile.kycStatus === "VERIFIED"}
          onClose={() => setActiveChatConvoId(null)}
          currentUserId={currentUserId!}
        />
      )}
    </div>
  );
}
