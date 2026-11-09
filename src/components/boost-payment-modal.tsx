"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Zap,
  Sparkles,
  Flame,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  ArrowRight,
  TrendingUp,
  CreditCard,
} from "lucide-react";
import {
  initiateBoostPayment,
  initiateFeaturePayment,
  verifyAndCompletePayment,
} from "@/app/actions/payment";
import { BOOST_PACKAGES, FEATURE_PACKAGES } from "@/lib/constants";
import { useLanguage } from "./language-provider";

interface BoostPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "BOOST_JOB" | "FEATURE_PROFILE";
  jobId?: string;
  itemTitle?: string;
  onSuccess?: () => void;
}

export default function BoostPaymentModal({
  isOpen,
  onClose,
  type,
  jobId,
  itemTitle,
  onSuccess,
}: BoostPaymentModalProps) {
  const { lang, tx } = useLanguage();
  const [isPending, startTransition] = useTransition();

  const packages = type === "BOOST_JOB" ? BOOST_PACKAGES : FEATURE_PACKAGES;
  const [selectedDays, setSelectedDays] = useState(packages[1]?.days || packages[0].days);
  const [gateway, setGateway] = useState<"ESEWA" | "KHALTI">("ESEWA");
  const [isSimulator, setIsSimulator] = useState(false);

  const [step, setStep] = useState<"SELECT" | "PAYING" | "SUCCESS">("SELECT");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedPkg = packages.find((p) => p.days === selectedDays) || packages[0];

  const handleCheckout = () => {
    setErrorMsg(null);
    startTransition(async () => {
      try {
        let res;
        if (type === "BOOST_JOB") {
          if (!jobId) throw new Error("Job ID missing");
          res = await initiateBoostPayment({
            jobId,
            days: selectedPkg.days,
            gateway,
          });
        } else {
          res = await initiateFeaturePayment({
            days: selectedPkg.days,
            gateway,
          });
        }

        if (!res.success || !res.transactionId) {
          setErrorMsg(res.error || "Payment initiation failed.");
          return;
        }

        setStep("PAYING");

        // Simulate gateway handshake (or sandbox completion)
        setTimeout(async () => {
          const verifyRes = await verifyAndCompletePayment({
            transactionId: res.transactionId!,
            gatewayRef: `${gateway}-REF-${Math.floor(100000 + Math.random() * 900000)}`,
            isSimulator: true,
          });

          if (verifyRes.success) {
            setStep("SUCCESS");
            if (onSuccess) onSuccess();
          } else {
            setErrorMsg(verifyRes.error || "Verification failed");
            setStep("SELECT");
          }
        }, 1200);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Unexpected error");
        setStep("SELECT");
      }
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 12 }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="relative p-6 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={onClose}
              disabled={isPending}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                {type === "BOOST_JOB" ? <Flame className="w-6 h-6 animate-pulse" /> : <Sparkles className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {type === "BOOST_JOB"
                    ? tx("Boost Job Listing", "काम बुस्ट गर्नुहोस्")
                    : tx("Feature Your Profile", "आफ्नो प्रोफाइल फिचर्ड गर्नुहोस्")}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs mt-0.5">
                  {itemTitle || (type === "BOOST_JOB" ? "Higher placement in searches" : "Appear at the top of workers list")}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {step === "SELECT" && (
              <>
                {/* Benefits Banner */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-900/60 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <TrendingUp className="w-4 h-4 text-orange-600 shrink-0" />
                    <span>{tx("5x More Visibility", "५ गुणा बढी भ्युज")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{tx("Top Placement Badge", "शीर्ष स्थान ब्याज")}</span>
                  </div>
                </div>

                {/* Package Options */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2.5">
                    {tx("Select Duration & Package", "प्याकेज छान्नुहोस्")}
                  </label>
                  <div className="space-y-2.5">
                    {packages.map((pkg) => {
                      const isSelected = selectedDays === pkg.days;
                      return (
                        <div
                          key={pkg.days}
                          onClick={() => setSelectedDays(pkg.days)}
                          className={`relative flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition ${
                            isSelected
                              ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 shadow-sm"
                              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                isSelected ? "border-orange-600 bg-orange-600" : "border-slate-300 dark:border-slate-600"
                              }`}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                  {lang === "ne" ? pkg.labelNe : pkg.label}
                                </span>
                                {pkg.popular && (
                                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border border-orange-300/60 dark:border-orange-800">
                                    Popular
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                ~ Rs. {(pkg.price / pkg.days).toFixed(0)} / day
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-base font-extrabold text-slate-900 dark:text-white">
                              Rs. {pkg.price}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Gateway Selection */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2.5">
                    {tx("Pay With Local Gateway", "भुक्तानी माध्यम")}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setGateway("ESEWA")}
                      className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 font-bold text-xs transition ${
                        gateway === "ESEWA"
                          ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 shadow-sm"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span>eSewa ePay</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGateway("KHALTI")}
                      className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 font-bold text-xs transition ${
                        gateway === "KHALTI"
                          ? "border-purple-500 bg-purple-50/60 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 shadow-sm"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      <div className="w-3 h-3 rounded-full bg-purple-600" />
                      <span>Khalti Digital</span>
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 font-medium">
                    {errorMsg}
                  </div>
                )}

                {/* Pay Action */}
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-sm shadow-xl shadow-orange-500/25 active:scale-98 transition disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{tx("Contacting Gateway...", "सम्पर्क हुँदैछ...")}</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {tx("Pay Rs.", "रु.")} {selectedPkg.price} {tx("via", "")} {gateway === "ESEWA" ? "eSewa" : "Khalti"}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </>
            )}

            {step === "PAYING" && (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-600 mx-auto flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {tx("Verifying with", "सत्यापन हुँदैछ")} {gateway === "ESEWA" ? "eSewa" : "Khalti"}...
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {tx("Securing transaction reference & activating listing...", "सक्रिय गरिँदैछ...")}
                  </p>
                </div>
              </div>
            )}

            {step === "SUCCESS" && (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {tx("Payment Verified & Boost Activated!", "भुक्तानी सफल भयो! बुस्ट सक्रिय गरियो!")}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    {type === "BOOST_JOB"
                      ? tx("Your gig listing is now highlighted at the top of search results.", "तपाईंको काम अब शीर्ष स्थानमा देखिनेछ।")
                      : tx("Your worker profile is featured on the directory page.", "तपाईंको प्रोफाइल अब फिचर्ड भयो।")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition"
                >
                  {tx("Done & View Changes", "सकियो")}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
