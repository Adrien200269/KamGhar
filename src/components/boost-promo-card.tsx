"use client";

import { useState } from "react";
import Image from "next/image";
import { Flame, TrendingUp, Zap, ShieldCheck, ArrowRight, Sparkles, Check } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import BoostPaymentModal from "@/components/boost-payment-modal";
import { BOOST_PACKAGES } from "@/lib/constants";
import { getRemainingBoostInfo } from "@/lib/boost";

interface BoostPromoCardProps {
  jobId: string;
  jobTitle: string;
  isBoosted?: boolean;
  boostedUntil?: Date | string | null;
  className?: string;
  onBoostSuccess?: () => void;
}

export default function BoostPromoCard({
  jobId,
  jobTitle,
  isBoosted = false,
  boostedUntil,
  className = "",
  onBoostSuccess,
}: BoostPromoCardProps) {
  const { lang, tx } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [selectedDays, setSelectedDays] = useState(7);
  const [selectedGateway, setSelectedGateway] = useState<"ESEWA" | "KHALTI">("ESEWA");

  const popularPkg = BOOST_PACKAGES.find((p) => p.days === selectedDays) || BOOST_PACKAGES[1];
  const boostInfo = getRemainingBoostInfo(boostedUntil, lang);

  return (
    <>
      <div
        className={`relative w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden p-6 sm:p-7 space-y-5 transition-all duration-300 hover:shadow-2xl ${className}`}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-amber-500/10 via-orange-500/5 to-transparent pointer-events-none" />

        {/* ── Top Header ───────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20 shrink-0">
              <Flame className="w-6 h-6 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {tx("Boost Job Listing", "काम बुस्ट गर्नुहोस्")}
                </h3>
                {isBoosted && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs">
                    <Sparkles className="w-3 h-3 text-white fill-white" />
                    <span>Active{boostInfo?.isActive ? ` (${boostInfo.shortFormatted})` : ""}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[260px] sm:max-w-md">
                {jobTitle}
              </p>
            </div>
          </div>

          {isBoosted && boostInfo?.isActive && (
            <div className="text-right hidden sm:block">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {tx("Boost Remaining", "बाँकी समय")}
              </span>
              <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                {boostInfo.formatted}
              </span>
            </div>
          )}
        </div>

        {/* ── Highlights Banner ────────────────────────────── */}
        <div className="relative z-10 p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-around text-xs font-bold text-amber-900 dark:text-amber-200">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span>{tx("5x More Visibility", "५ गुणा बढी भिजिविलिटी")}</span>
          </span>
          <div className="w-px h-4 bg-amber-200/80 dark:bg-amber-800" />
          <span className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>{tx("Top Placement Badge", "शीर्ष स्थान ब्याच")}</span>
          </span>
        </div>

        {/* ── Package Selection Grid ───────────────────────── */}
        <div className="relative z-10 space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block px-1">
            {tx("Select Duration & Package", "प्याकेज छान्नुहोस्")}
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {BOOST_PACKAGES.map((pkg) => {
              const isSelected = selectedDays === pkg.days;
              const perDay = Math.round(pkg.price / pkg.days);

              return (
                <button
                  key={pkg.days}
                  type="button"
                  onClick={() => setSelectedDays(pkg.days)}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "border-2 border-orange-500 bg-orange-50/40 dark:bg-orange-950/30 shadow-md shadow-orange-500/10"
                      : "border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "border-orange-600 bg-orange-600 text-white"
                            : "border-slate-300 dark:border-slate-600"
                        }`}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {pkg.days} Days
                      </span>
                    </div>
                    {pkg.popular && (
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/60">
                        Popular
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline justify-between mt-2 pt-1 border-t border-slate-200/50 dark:border-slate-800/50 text-xs">
                    <span className="text-[11px] text-slate-400 font-medium">~ Rs. {perDay}/day</span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                      Rs. {pkg.price}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Payment Gateway Selection ─────────────────────── */}
        <div className="relative z-10 space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block px-1">
            {tx("Pay With Local Gateway", "भुक्तानी गेटवे छान्नुहोस्")}
          </span>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setSelectedGateway("ESEWA")}
              className={`py-3 px-4 rounded-2xl border flex items-center justify-center gap-2 transition cursor-pointer font-bold text-xs ${
                selectedGateway === "ESEWA"
                  ? "border-2 border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 shadow-sm"
                  : "border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400 hover:border-slate-300"
              }`}
            >
              <Image
                src="/esewa-logo.png"
                alt="eSewa"
                width={20}
                height={20}
                className="w-5 h-5 object-contain"
              />
              <span>eSewa ePay</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedGateway("KHALTI")}
              className={`py-3 px-4 rounded-2xl border flex items-center justify-center gap-2 transition cursor-pointer font-bold text-xs ${
                selectedGateway === "KHALTI"
                  ? "border-2 border-purple-500 bg-purple-50/40 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 shadow-sm"
                  : "border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400 hover:border-slate-300"
              }`}
            >
              <Image
                src="/khalti-logo.png"
                alt="Khalti"
                width={20}
                height={20}
                className="w-5 h-5 object-contain"
              />
              <span>Khalti Digital</span>
            </button>
          </div>
        </div>

        {/* ── CTA Action Button ────────────────────────────── */}
        <div className="relative z-10 pt-1 space-y-2">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-sm shadow-xl shadow-orange-500/25 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>
              {isBoosted
                ? tx(
                    `Extend Boost for Rs. ${popularPkg.price} via ${selectedGateway === "ESEWA" ? "eSewa" : "Khalti"}`,
                    `रु. ${popularPkg.price} मा थप बुस्ट गर्नुहोस्`
                  )
                : tx(
                    `Pay Rs. ${popularPkg.price} via ${selectedGateway === "ESEWA" ? "eSewa" : "Khalti"}`,
                    `रु. ${popularPkg.price} ${selectedGateway === "ESEWA" ? "ईसेवा" : "खल्ती"} बाट तिर्नुहोस्`
                  )}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5 text-center">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{tx("Secure official portal redirection. You will return here after completion.", "आधिकारिक पोर्टलबाट सुरक्षित भुक्तानी।")}</span>
          </div>
        </div>
      </div>

      {/* Boost Modal trigger */}
      {showModal && (
        <BoostPaymentModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          type="BOOST_JOB"
          jobId={jobId}
          itemTitle={jobTitle}
          onSuccess={() => {
            setShowModal(false);
            if (onBoostSuccess) onBoostSuccess();
          }}
        />
      )}
    </>
  );
}
