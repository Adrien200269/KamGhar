"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  Share2,
  Printer,
  ShieldCheck,
  Star,
  MapPin,
  Phone,
  MessageCircle,
  Copy,
  Check,
  Sparkles,
  Briefcase,
  Building2,
  Mail,
  ExternalLink,
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { getWorkerWhatsAppUrl, getRecruiterWhatsAppUrl } from "@/lib/whatsapp";

export interface VisitingCardWorker {
  id: string;
  name: string;
  photo?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  primarySkill?: string | null;
  skills?: string[];
  experienceYears?: number | null;
  hourlyRate?: number | null;
  avgRating?: number;
  reviewCount?: number;
  verified?: boolean;
}

export interface VisitingCardRecruiter {
  id: string;
  name: string;
  businessName?: string | null;
  photo?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  activeJobsCount?: number;
  verified?: boolean;
}

export type VisitingCardData =
  | ({ type: "WORKER" } & VisitingCardWorker)
  | ({ type: "RECRUITER" } & VisitingCardRecruiter);

export interface WorkerVisitingCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: VisitingCardData;
  worker?: VisitingCardWorker;
  recruiter?: VisitingCardRecruiter;
}

export default function WorkerVisitingCardModal({
  isOpen,
  onClose,
  data,
  worker: propWorker,
  recruiter: propRecruiter,
}: WorkerVisitingCardModalProps) {
  const { tx } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Resolve card type & payload
  const isRecruiter =
    data?.type === "RECRUITER" || (Boolean(propRecruiter) && !propWorker);

  const worker: VisitingCardWorker | null = isRecruiter
    ? null
    : data?.type === "WORKER"
    ? data
    : propWorker || null;

  const recruiter: VisitingCardRecruiter | null = isRecruiter
    ? data?.type === "RECRUITER"
      ? data
      : propRecruiter || null
    : null;

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://kamghar.com";

  // URL & QR target
  const profileUrl = isRecruiter
    ? `${origin}/jobs?recruiter=${recruiter?.id || ""}`
    : `${origin}/workers/${worker?.id || ""}`;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    profileUrl
  )}`;

  // Direct WhatsApp URL
  const waUrl = isRecruiter
    ? getRecruiterWhatsAppUrl({
        phone: recruiter?.phone,
        recruiterName: recruiter?.name || "Client",
        businessName: recruiter?.businessName,
      })
    : getWorkerWhatsAppUrl({
        phone: worker?.phone,
        workerName: worker?.name || "Worker",
        skill: worker?.primarySkill,
      });

  const cardName = isRecruiter ? recruiter?.name : worker?.name;
  const cardPhone = isRecruiter ? recruiter?.phone : worker?.phone;
  const cardEmail = isRecruiter ? recruiter?.email : worker?.email;
  const cardAddress = isRecruiter ? recruiter?.address : worker?.address;
  const cardPhoto = isRecruiter ? recruiter?.photo : worker?.photo;
  const isVerified = isRecruiter ? recruiter?.verified : worker?.verified;

  const handleCopyLink = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadVCard = () => {
    const fn = isRecruiter
      ? `${cardName} (KamGhar Hirer)`
      : `${cardName} (KamGhar ${worker?.primarySkill || "Technician"})`;
    const org = isRecruiter
      ? recruiter?.businessName || "KamGhar Client & Hirer"
      : "KamGhar Nepal";
    const title = isRecruiter
      ? "Verified Client / Recruiter"
      : worker?.primarySkill || "Professional Technician";

    const vCardLines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${fn}`,
      `N:${cardName};;;;`,
      `ORG:${org};`,
      `TITLE:${title}`,
      cardPhone ? `TEL;TYPE=CELL,VOICE:${cardPhone}` : "",
      cardEmail ? `EMAIL;TYPE=INTERNET:${cardEmail}` : "",
      `ADR;TYPE=WORK:;;${cardAddress || "Kathmandu"};;;Nepal`,
      `URL:${profileUrl}`,
      isRecruiter
        ? "NOTE:Verified Client & Employer on KamGhar Nepal."
        : `NOTE:Verified Tradesperson on KamGhar Nepal. Rating: ${
            worker?.avgRating || 5.0
          } stars.`,
      "END:VCARD",
    ];

    const vCardContent = vCardLines.filter(Boolean).join("\r\n");
    const blob = new Blob([vCardContent], { type: "text/vcard;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(cardName || "kamghar_contact").replace(/\s+/g, "_")}_card.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: isRecruiter
            ? `${cardName} - Client & Hirer on KamGhar`
            : `${cardName} - ${worker?.primarySkill || "Professional"} on KamGhar`,
          text: isRecruiter
            ? `Check out jobs and profile for ${cardName} on KamGhar Nepal!`
            : `Check out ${cardName}'s verified trade profile on KamGhar Nepal!`,
          url: profileUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm print:p-0 print:bg-white overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden print:border-none print:shadow-none my-auto max-h-[92dvh] flex flex-col"
        >
          {/* Header */}
          <div className="p-4 px-5 sm:px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between print:hidden shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {isRecruiter
                  ? tx("Client & Employer Digital Card", "रोजगारदाता डिजिटल भिजिटिङ कार्ड")
                  : tx("Worker Digital Business Card", "कामदार डिजिटल भिजिटिङ कार्ड")}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Business Card Canvas (Standard physical 3.5x2 aspect style) */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1">
            <div
              id="printable-card"
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 text-white p-4 sm:p-6 shadow-2xl border border-white/10 space-y-4 sm:space-y-5"
            >
              {/* Background ambient warmth aura */}
              <div
                className={`pointer-events-none absolute -right-12 -bottom-12 w-48 h-48 rounded-full blur-2xl ${
                  isRecruiter ? "bg-blue-500/10" : "bg-orange-500/15"
                }`}
              />
              <div className="pointer-events-none absolute top-0 right-0 p-4 opacity-10">
                <ShieldCheck className="w-24 h-24 text-white" />
              </div>

              {/* Card Top: Brand Logo & Trust Badge */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  {/* Clean white container for logo contrast on dark card */}
                  <div className="bg-white rounded-lg px-2 py-0.5 flex items-center justify-center shadow-xs">
                    <Image
                      src="/logo.png"
                      alt="KamGhar"
                      width={90}
                      height={26}
                      priority
                      className="h-5 w-auto object-contain"
                    />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-white/10 text-slate-300 border border-white/10">
                    {isRecruiter ? "Hirer" : "Verified Pro"}
                  </span>
                </div>

                <div
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    isVerified
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  }`}
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>
                    {isVerified
                      ? tx("KYC Verified", "प्रमाणित")
                      : tx("KamGhar Member", "सदस्य")}
                  </span>
                </div>
              </div>

              {/* Card Middle: Profile, Details, and QR */}
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div
                      className={`relative w-14 h-14 rounded-2xl overflow-hidden bg-slate-800 border-2 flex-shrink-0 flex items-center justify-center ${
                        isRecruiter
                          ? "border-blue-500/50 text-blue-300"
                          : "border-orange-500/50 text-orange-300"
                      }`}
                    >
                      {cardPhoto ? (
                        <Image
                          src={cardPhoto}
                          alt={cardName || "Profile"}
                          fill
                          className="object-cover"
                        />
                      ) : isRecruiter ? (
                        <Building2 className="w-7 h-7" />
                      ) : (
                        <span className="font-black text-xl">
                          {cardName ? cardName.charAt(0).toUpperCase() : "K"}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h4 className="font-extrabold text-base text-white tracking-tight leading-tight truncate">
                        {cardName || "KamGhar User"}
                      </h4>

                      {isRecruiter ? (
                        <>
                          <p className="text-xs font-semibold text-blue-400 truncate">
                            {recruiter?.businessName ||
                              tx("Homeowner & Hirer", "रोजगारदाता / ग्राहक")}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {tx("Direct Client & Job Poster", "प्रत्यक्ष रोजगारदाता")}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-xs font-semibold text-orange-400 truncate">
                            {worker?.primarySkill || "Professional Technician"}
                          </p>
                          {worker?.experienceYears ? (
                            <p className="text-[10px] text-slate-400">
                              {worker.experienceYears} {tx("yrs exp", "वर्ष अनुभव")}
                            </p>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Location & Contact Snippet */}
                  <div className="pt-1 space-y-1 text-[11px] text-slate-300">
                    {cardAddress && (
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                        <span className="truncate">{cardAddress}</span>
                      </div>
                    )}
                    {cardPhone && (
                      <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
                        <Phone className="w-3 h-3 text-slate-500 flex-shrink-0" />
                        <span>{cardPhone}</span>
                      </div>
                    )}
                    {isRecruiter && cardEmail && (
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] truncate">
                        <Mail className="w-3 h-3 text-slate-500 flex-shrink-0" />
                        <span className="truncate">{cardEmail}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* QR Code Container */}
                <div className="flex flex-col items-center flex-shrink-0 bg-white p-2 rounded-2xl shadow-md border border-slate-200">
                  <div className="relative w-20 h-20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrCodeUrl}
                      alt="KamGhar Profile QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-[9px] font-bold text-slate-800 mt-1 uppercase tracking-tight">
                    {isRecruiter
                      ? tx("Scan Gigs", "गिग हेर्नुहोस्")
                      : tx("Scan to Hire", "स्क्यान गर्नुहोस्")}
                  </span>
                </div>
              </div>

              {/* Card Bottom: Metric Badges */}
              <div className="flex items-center justify-between border-t border-white/10 pt-2.5 text-xs">
                {isRecruiter ? (
                  <>
                    <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>
                        {recruiter?.activeJobsCount !== undefined
                          ? `${recruiter.activeJobsCount} ${tx("Open Gigs", "खुला कामहरू")}`
                          : tx("Active Hirer", "सक्रिय रोजगारदाता")}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-semibold">
                      {tx("Direct Worker Payouts", "भरपर्दो प्रत्यक्ष भुक्तानी")}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{worker?.avgRating?.toFixed(1) || "5.0"}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({worker?.reviewCount || 1} {tx("reviews", "समीक्षा")})
                      </span>
                    </div>

                    {worker?.hourlyRate ? (
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block leading-none">
                          {tx("Rate", "दर")}
                        </span>
                        <span className="text-xs font-black text-white">
                          रू {worker.hourlyRate.toLocaleString()} / {tx("hr", "घण्टा")}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        {tx("Fair Market Benchmark", "निष्पक्ष बजार दर")}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Quick Contact Actions (WhatsApp & Call) */}
            <div className="mt-4 grid grid-cols-2 gap-2.5 print:hidden">
              {cardPhone && (
                <a
                  href={`tel:${cardPhone}`}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span>{tx("Call Directly", "फोन गर्नुहोस्")}</span>
                </a>
              )}

              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>
                    {isRecruiter
                      ? tx("WhatsApp Message", "ह्वाट्सएप सन्देश")
                      : tx("WhatsApp Booking", "ह्वाट्सएप बुकिङ")}
                  </span>
                </a>
              )}
            </div>

            {/* Download, Share, & Print Actions */}
            <div className="mt-3 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 print:hidden">
              <button
                type="button"
                onClick={handleDownloadVCard}
                className="flex-1 px-3 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-sm shadow-orange-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{tx("Save Contact (.vcf)", "सम्पर्क सेभ (.vcf)")}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>
                  {copied ? tx("Copied!", "प्रतिलिपि भयो!") : tx("Copy Link", "लिंक")}
                </span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span>{tx("Share", "सेयर")}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>{tx("Print", "प्रिन्ट")}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Named alias for convenience
export { WorkerVisitingCardModal as DigitalVisitingCardModal };
