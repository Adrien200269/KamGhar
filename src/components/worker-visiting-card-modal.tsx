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
  QrCode,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { getWorkerWhatsAppUrl } from "@/lib/whatsapp";

export interface VisitingCardWorker {
  id: string;
  name: string;
  photo?: string | null;
  phone?: string | null;
  address?: string | null;
  primarySkill?: string | null;
  skills?: string[];
  experienceYears?: number | null;
  hourlyRate?: number | null;
  avgRating?: number;
  reviewCount?: number;
  verified?: boolean;
}

interface WorkerVisitingCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: VisitingCardWorker;
}

export default function WorkerVisitingCardModal({
  isOpen,
  onClose,
  worker,
}: WorkerVisitingCardModalProps) {
  const { tx, lang } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "https://kamghar.com";
  const profileUrl = `${origin}/workers/${worker.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    profileUrl
  )}`;

  const waUrl = getWorkerWhatsAppUrl({
    phone: worker.phone,
    workerName: worker.name,
    skill: worker.primarySkill,
  });

  const handleCopyLink = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadVCard = () => {
    const vCardContent = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${worker.name} (KamGhar ${worker.primarySkill || "Technician"})`,
      `N:${worker.name};;;;`,
      "ORG:KamGhar Nepal;",
      `TITLE:${worker.primarySkill || "Technician"}`,
      worker.phone ? `TEL;TYPE=CELL,VOICE:${worker.phone}` : "",
      `ADR;TYPE=WORK:;;${worker.address || "Kathmandu"};;;Nepal`,
      `URL:${profileUrl}`,
      `NOTE:Verified on KamGhar Nepal. Rating: ${worker.avgRating || 5.0} stars.`,
      "END:VCARD",
    ]
      .filter(Boolean)
      .join("\r\n");

    const blob = new Blob([vCardContent], { type: "text/vcard;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${worker.name.replace(/\s+/g, "_")}_kamghar.vcf`;
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
          title: `${worker.name} - ${worker.primarySkill || "Professional"} on KamGhar`,
          text: `Check out ${worker.name}'s verified profile on KamGhar Nepal!`,
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm print:p-0 print:bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden print:border-none print:shadow-none"
        >
          {/* Header */}
          <div className="p-4 px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {tx("Digital Business Card & QR", "डिजिटल भिजिटिङ कार्ड तथा QR")}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Business Card Canvas (Standard 3.5x2 aspect style) */}
          <div className="p-6">
            <div
              id="printable-card"
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 text-white p-6 shadow-xl border border-white/10 space-y-5"
            >
              {/* Background watermark seal */}
              <div className="pointer-events-none absolute -right-12 -bottom-12 w-48 h-48 bg-orange-500/10 rounded-full blur-2xl" />
              <div className="pointer-events-none absolute top-0 right-0 p-4 opacity-10">
                <ShieldCheck className="w-24 h-24 text-white" />
              </div>

              {/* Card Top: Brand & Badge */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-600 flex items-center justify-center font-black text-xs text-white shadow-sm">
                    KG
                  </div>
                  <span className="font-extrabold tracking-tight text-sm text-white">
                    कामघर <span className="text-orange-400 font-bold">KamGhar</span>
                  </span>
                </div>

                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>{tx("KYC Verified", "प्रमाणित")}</span>
                </div>
              </div>

              {/* Card Middle: Photo, Info, and QR */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-slate-700 border-2 border-orange-500/50 flex-shrink-0">
                      {worker.photo ? (
                        <Image
                          src={worker.photo}
                          alt={worker.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-lg text-slate-300">
                          {worker.name[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-white tracking-tight leading-tight">
                        {worker.name}
                      </h4>
                      <p className="text-xs font-semibold text-orange-400">
                        {worker.primarySkill || "Professional Technician"}
                      </p>
                      {worker.experienceYears && (
                        <p className="text-[10px] text-slate-400">
                          {worker.experienceYears} {tx("yrs experience", "वर्ष अनुभव")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-1 space-y-1 text-[11px] text-slate-300">
                    {worker.address && (
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                        <span className="truncate">{worker.address}</span>
                      </div>
                    )}
                    {worker.phone && (
                      <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
                        <Phone className="w-3 h-3 text-slate-500 flex-shrink-0" />
                        <span>{worker.phone}</span>
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
                  <span className="text-[9px] font-bold text-slate-700 mt-1 uppercase tracking-tight">
                    {tx("Scan to Hire", "स्क्यान गर्नुहोस्")}
                  </span>
                </div>
              </div>

              {/* Card Bottom: Rating & Hourly Rate */}
              <div className="flex items-center justify-between border-t border-white/10 pt-2.5 text-xs">
                <div className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{worker.avgRating?.toFixed(1) || "5.0"}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    ({worker.reviewCount || 1} {tx("reviews", "समीक्षा")})
                  </span>
                </div>

                {worker.hourlyRate ? (
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
              </div>
            </div>

            {/* Quick Contact Actions (WhatsApp & Call) */}
            <div className="mt-4 grid grid-cols-2 gap-2.5 print:hidden">
              {worker.phone && (
                <a
                  href={`tel:${worker.phone}`}
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
                  <span>{tx("WhatsApp Booking", "ह्वाट्सएप बुकिङ")}</span>
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
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? tx("Copied!", "प्रतिलिपि भयो!") : tx("Copy Link", "लिंक")}</span>
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
