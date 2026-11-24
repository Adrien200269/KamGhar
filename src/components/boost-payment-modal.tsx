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
  ArrowLeft,
  TrendingUp,
  CreditCard,
  Lock,
  Smartphone,
  KeyRound,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import {
  initiateBoostPayment,
  initiateFeaturePayment,
  verifyAndCompletePayment,
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

type ModalStep = "SELECT" | "GATEWAY_LOGIN" | "OTP" | "PAYING" | "SUCCESS";

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

  const [step, setStep] = useState<ModalStep>("SELECT");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // User input fields
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");

  // Stored transaction result from initiation
  const [paymentTx, setPaymentTx] = useState<PaymentResult | null>(null);

  const selectedPkg = packages.find((p) => p.days === selectedDays) || packages[0];

  // Reset fields when opening/closing
  const handleClose = () => {
    if (isPending) return;
    setErrorMsg(null);
    setStep("SELECT");
    setMobileNumber("");
    setPassword("");
    setOtp("");
    setPaymentTx(null);
    onClose();
  };

  // Step 1: Initiate Transaction and proceed to Login Credentials Form
  const handleProceedToCredentials = () => {
    setErrorMsg(null);
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
          return;
        }

        setPaymentTx(res);
        setStep("GATEWAY_LOGIN");
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Unexpected error");
      }
    });
  };

  // Step 2: Validate Credentials & proceed to OTP
  const handleProceedToOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanMobile = mobileNumber.trim();
    if (!cleanMobile) {
      setErrorMsg(tx("Please enter your mobile number / ID.", "कृपया मोबाइल नम्बर वा आईडी भर्नुहोस्।"));
      return;
    }
    if (cleanMobile.length < 9) {
      setErrorMsg(tx("Mobile number must be at least 10 digits.", "१० अङ्कको मोबाइल नम्बर हुनुपर्छ।"));
      return;
    }
    if (!password.trim()) {
      setErrorMsg(tx("Please enter your password / MPIN.", "कृपया पासवर्ड वा एमपिन भर्नुहोस्।"));
      return;
    }

    setStep("OTP");
  };

  // Step 3: Verify OTP and finalize payment
  const handleFinalizePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 4) {
      setErrorMsg(tx("Please enter the 6-digit verification OTP.", "कृपया ६ अङ्कको ओटिपी भर्नुहोस्।"));
      return;
    }

    if (!paymentTx?.transactionId) {
      setErrorMsg("Transaction reference missing.");
      setStep("SELECT");
      return;
    }

    setStep("PAYING");
    startTransition(async () => {
      try {
        const verifyRes = await verifyAndCompletePayment({
          transactionId: paymentTx.transactionId!,
          gatewayRef: `${gateway}-${mobileNumber.trim().slice(-4)}-${Date.now().toString(36).toUpperCase()}`,
          isSimulator: true,
        });

        if (verifyRes.success) {
          setStep("SUCCESS");
          if (onSuccess) onSuccess();
        } else {
          setErrorMsg(verifyRes.error || "Payment verification failed");
          setStep("OTP");
        }
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Unexpected verification error");
        setStep("OTP");
      }
    });
  };

  // Quick fill helper for sandbox testing
  const handleFillSandboxCredentials = () => {
    if (gateway === "ESEWA") {
      setMobileNumber("9806800001");
      setPassword("Nepal@123");
    } else {
      setMobileNumber("9800000001");
      setPassword("1122");
    }
  };

  // Optional: Launch external gateway checkout
  const handleLaunchExternal = () => {
    if (gateway === "ESEWA" && paymentTx?.esewaConfig) {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = paymentTx.esewaConfig.actionUrl;
      Object.entries(paymentTx.esewaConfig.fields).forEach(([key, val]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = val;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } else if (gateway === "KHALTI" && paymentTx?.paymentUrl) {
      window.location.href = paymentTx.paymentUrl;
    }
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
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
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
                    {tx("Pay With Local Gateway", "भुक्तानी माध्यम")}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setGateway("ESEWA")}
                      className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 font-bold text-xs transition cursor-pointer ${
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
                      className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 font-bold text-xs transition cursor-pointer ${
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

                {/* Continue to Login Button */}
                <button
                  type="button"
                  onClick={handleProceedToCredentials}
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-sm shadow-xl shadow-orange-500/25 active:scale-98 transition disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{tx("Preparing Gateway...", "सम्पर्क हुँदैछ...")}</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {tx("Proceed to", "अघि बढ्नुहोस्")} {gateway === "ESEWA" ? "eSewa" : "Khalti"} (Rs. {selectedPkg.price})
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </>
            )}

            {/* ── STEP 2: Gateway Credentials Form ─────────────────────── */}
            {step === "GATEWAY_LOGIN" && (
              <form onSubmit={handleProceedToOtp} className="space-y-4 animate-in fade-in duration-200">
                {/* Gateway Branding Header */}
                <div
                  className={`p-4 rounded-2xl border flex items-center justify-between ${
                    gateway === "ESEWA"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                      : "bg-purple-500/10 border-purple-500/30 text-purple-800 dark:text-purple-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-md ${
                        gateway === "ESEWA" ? "bg-emerald-600" : "bg-purple-600"
                      }`}
                    >
                      {gateway === "ESEWA" ? "eS" : "KH"}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {gateway === "ESEWA" ? "eSewa ePay Gateway" : "Khalti Digital Wallet"}
                      </h4>
                      <p className="text-[11px] opacity-75">
                        {selectedPkg.label} • Rs. {selectedPkg.price}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Secure</span>
                  </div>
                </div>

                {/* Quick Autofill Helper */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {tx("Enter Wallet Credentials", "वालेट विवरण भर्नुहोस्")}
                  </span>
                  <button
                    type="button"
                    onClick={handleFillSandboxCredentials}
                    className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{tx("Fill Test Credentials", "परीक्षण विवरण भर्नुहोस्")}</span>
                  </button>
                </div>

                {/* Mobile / ID Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    {gateway === "ESEWA" ? "eSewa ID / Mobile Number" : "Khalti Registered Mobile"}
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder={gateway === "ESEWA" ? "e.g. 9806800001" : "e.g. 9800000001"}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Password / MPIN Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    {gateway === "ESEWA" ? "Password / MPIN" : "Khalti MPIN / Password"}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={gateway === "ESEWA" ? "e.g. Nepal@123" : "e.g. 1122"}
                      className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 font-medium">
                    {errorMsg}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setStep("SELECT");
                    }}
                    className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{tx("Back", "फिर्ता")}</span>
                  </button>

                  <button
                    type="submit"
                    className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-sm shadow-xl shadow-orange-500/25 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{tx("Verify & Continue", "सत्यापन गरी अघि बढ्नुहोस्")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* External Portal Option */}
                {(paymentTx?.esewaConfig || paymentTx?.paymentUrl) && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={handleLaunchExternal}
                      className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 inline-flex items-center gap-1 underline transition cursor-pointer"
                    >
                      <span>{tx("Or launch official external gateway portal", "वा आधिकारिक बाह्य पोर्टल खोल्नुहोस्")}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* ── STEP 3: OTP Verification ────────────────────────────── */}
            {step === "OTP" && (
              <form onSubmit={handleFinalizePayment} className="space-y-4 animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-amber-600" />
                    <span>{tx("Two-Factor Authentication", "सुरक्षा कोड (OTP)")}</span>
                  </div>
                  <p className="text-[11px] opacity-80">
                    {tx("Enter the 6-digit confirmation token sent to", "यस नम्बरमा पठाइएको कोड हाल्नुहोस्:")}{" "}
                    <strong className="text-slate-900 dark:text-white font-mono">{mobileNumber}</strong>
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {tx("6-Digit Token / OTP", "६ अङ्कको ओटिपी कोड")}
                    </label>
                    <button
                      type="button"
                      onClick={() => setOtp("123456")}
                      className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
                    >
                      {tx("Use Test OTP (123456)", "परीक्षण कोड: 123456")}
                    </button>
                  </div>

                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full py-3.5 px-4 text-center tracking-[0.5em] font-mono text-xl font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                    autoFocus
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 font-medium">
                    {errorMsg}
                  </div>
                )}

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setStep("GATEWAY_LOGIN");
                    }}
                    className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{tx("Back", "फिर्ता")}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-sm shadow-xl shadow-orange-500/25 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{tx("Authorizing...", "पुष्टि हुँदैछ...")}</span>
                      </>
                    ) : (
                      <>
                        <span>
                          {tx("Confirm & Pay Rs.", "भुक्तानी गर्नुहोस् रु.")} {selectedPkg.price}
                        </span>
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ── STEP 4: Authorizing / Processing ────────────────────── */}
            {step === "PAYING" && (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-600 mx-auto flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {tx("Authorizing Payment...", "भुक्तानी पुष्टि हुँदैछ...")}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {tx("Connecting with", "सम्पर्क हुँदैछ")} {gateway === "ESEWA" ? "eSewa" : "Khalti"} &{" "}
                    {tx("activating your boost...", "सक्रिय गरिँदैछ...")}
                  </p>
                </div>
              </div>
            )}

            {/* ── STEP 5: Success & Boost Activated ───────────────────── */}
            {step === "SUCCESS" && (
              <div className="py-6 text-center space-y-4 animate-in fade-in duration-200">
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

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-left text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Method</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {gateway === "ESEWA" ? "eSewa ePay" : "Khalti Digital Wallet"}
                    </span>
                  </div>
                  {mobileNumber && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Account ID</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{mobileNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Paid</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Rs. {selectedPkg.price}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-3 px-6 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition cursor-pointer"
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
