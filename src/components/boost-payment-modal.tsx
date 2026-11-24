"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Zap,
  Sparkles,
  Flame,
  ShieldCheck,
  Loader2,
  TrendingUp,
  ExternalLink,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import {
  initiateBoostPayment,
  initiateFeaturePayment,
  PaymentResult,
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

type ModalStep = "SELECT" | "REDIRECTING";

export default function BoostPaymentModal({
  isOpen,
  onClose,
  type,
  jobId,
  itemTitle,
}: BoostPaymentModalProps) {
  const { lang, tx } = useLanguage();
  const [isPending, startTransition] = useTransition();

  const packages = type === "BOOST_JOB" ? BOOST_PACKAGES : FEATURE_PACKAGES;
  const [selectedDays, setSelectedDays] = useState(packages[1]?.days || packages[0].days);
  const [gateway, setGateway] = useState<"ESEWA" | "KHALTI">("ESEWA");

  const [step, setStep] = useState<ModalStep>("SELECT");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Stored transaction result from initiation
  const [paymentTx, setPaymentTx] = useState<PaymentResult | null>(null);

  const selectedPkg = packages.find((p) => p.days === selectedDays) || packages[0];

  // Reset fields when opening/closing
  const handleClose = () => {
    if (isPending) return;
    setErrorMsg(null);
    setStep("SELECT");
    setPaymentTx(null);
    onClose();
  };

  // Helper function to launch external gateway portal
  const launchExternalPortal = (txData: PaymentResult, selectedGateway: "ESEWA" | "KHALTI") => {
    if (selectedGateway === "ESEWA" && txData.esewaConfig) {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = txData.esewaConfig.actionUrl;
      Object.entries(txData.esewaConfig.fields).forEach(([key, val]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = val;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } else if (selectedGateway === "KHALTI" && txData.paymentUrl) {
      window.location.href = txData.paymentUrl;
    }
  };

  // Initiate Transaction and automatically launch external gateway portal
  const handleProceedToPayment = () => {
    setErrorMsg(null);
    setStep("REDIRECTING");

    startTransition(async () => {
      try {
        let res: PaymentResult;
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
          setStep("SELECT");
          return;
        }

        setPaymentTx(res);

        // Automatically launch external gateway portal!
        launchExternalPortal(res, gateway);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Unexpected error launching gateway");
        setStep("SELECT");
      }
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 12 }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col my-auto"
        >
          {/* Header */}
          <div className="relative p-6 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={handleClose}
              disabled={isPending}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-40"
              aria-label="Close"
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

          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
            {/* ── STEP 1: Select Package & Gateway ────────────────────── */}
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
                    {tx("Pay With Local Gateway", "भुक्तानी माध्यम छान्नुहोस्")}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setGateway("ESEWA")}
                      className={`flex items-center justify-center gap-2.5 p-3.5 rounded-2xl border-2 font-bold text-xs transition cursor-pointer ${
                        gateway === "ESEWA"
                          ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 shadow-sm"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
                      <span>eSewa ePay</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGateway("KHALTI")}
                      className={`flex items-center justify-center gap-2.5 p-3.5 rounded-2xl border-2 font-bold text-xs transition cursor-pointer ${
                        gateway === "KHALTI"
                          ? "border-purple-500 bg-purple-50/60 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 shadow-sm"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      <div className="w-3.5 h-3.5 rounded-full bg-purple-600" />
                      <span>Khalti Digital</span>
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Launch External Gateway Portal Button */}
                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-sm shadow-xl shadow-orange-500/25 active:scale-98 transition disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        {gateway === "ESEWA"
                          ? tx("Launching eSewa Portal...", "इ-सेवा पोर्टल खोल्दै...")
                          : tx("Launching Khalti Portal...", "खल्ती पोर्टल खोल्दै...")}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>
                        {tx("Pay Rs.", "भुक्तानी गर्नुहोस् रु.")} {selectedPkg.price}{" "}
                        {tx("via", "मार्फत")} {gateway === "ESEWA" ? "eSewa" : "Khalti"}
                      </span>
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>
                    {tx(
                      "Secure official portal redirection. You will return here after completion.",
                      "आधिकारिक पोर्टलमा सुरक्षित रिडिरेक्सन। भुक्तानीपछि यहीँ फर्किनुहुनेछ।"
                    )}
                  </span>
                </div>
              </>
            )}

            {/* ── STEP 2: Automatic Redirection to Official Portal ──────── */}
            {step === "REDIRECTING" && (
              <div className="py-8 text-center space-y-6 animate-in fade-in duration-200">
                {/* Gateway Branding Header */}
                <div
                  className={`p-4 rounded-2xl border flex items-center justify-between mx-auto max-w-sm ${
                    gateway === "ESEWA"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                      : "bg-purple-500/10 border-purple-500/30 text-purple-800 dark:text-purple-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md ${
                        gateway === "ESEWA" ? "bg-emerald-600" : "bg-purple-600"
                      }`}
                    >
                      {gateway === "ESEWA" ? "eS" : "KH"}
                    </div>
                    <div className="text-left">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {gateway === "ESEWA" ? "eSewa ePay Portal" : "Khalti Payment Portal"}
                      </h4>
                      <p className="text-[11px] opacity-75">
                        {selectedPkg.label} • Rs. {selectedPkg.price}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Official</span>
                  </div>
                </div>

                {/* Animated Redirect State */}
                <div className="space-y-3">
                  <div className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center shadow-lg transition-transform animate-pulse ${
                    gateway === "ESEWA"
                      ? "bg-emerald-500 text-white shadow-emerald-500/30"
                      : "bg-purple-600 text-white shadow-purple-600/30"
                  }`}>
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {gateway === "ESEWA"
                        ? tx("Launching eSewa Portal...", "इ-सेवा पोर्टल खुल्दैछ...")
                        : tx("Launching Khalti Portal...", "खल्ती पोर्टल खुल्दैछ...")}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      {tx(
                        "Connecting to the official payment gateway. Please complete your transaction on the portal.",
                        "आधिकारिक भुक्तानी पोर्टलमा जोडिँदैछ। कृपया पोर्टलमा गएर भुक्तानी सम्पन्न गर्नुहोस्।"
                      )}
                    </p>
                  </div>
                </div>

                {/* Reassurance Info */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{tx("Secured with 256-bit official encryption", "२५६-बिट आधिकारिक इन्क्रिप्सनबाट सुरक्षित")}</span>
                </div>

                {/* Fallback Launch Link & Cancel Button */}
                <div className="space-y-3 pt-2">
                  {paymentTx && (
                    <button
                      type="button"
                      onClick={() => launchExternalPortal(paymentTx, gateway)}
                      className="text-xs font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{tx("Click here if not redirected automatically", "स्वत: रिडिरेक्ट नभए यहाँ थिच्नुहोस्")}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg(null);
                        setStep("SELECT");
                      }}
                      className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>{tx("Cancel & Change Package", "रद्द गरी अर्को छान्नुहोस्")}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
