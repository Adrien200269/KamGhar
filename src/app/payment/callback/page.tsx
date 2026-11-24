"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Check,
  Copy,
  Printer,
  ArrowRight,
  Briefcase,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Receipt,
  X,
  ExternalLink,
} from "lucide-react";
import { verifyAndCompletePayment } from "@/app/actions/payment";
import { useLanguage } from "@/components/language-provider";

interface CallbackSummary {
  gateway: "eSewa" | "Khalti";
  transactionId: string;
  refCode?: string;
  amount?: number;
  itemTitle?: string;
  days?: number;
}

function safeDecodeEsewaPayload(encodedData: string): {
  transaction_code: string;
  status: "COMPLETE" | "PENDING" | "CANCELED" | "NOT_FOUND";
  total_amount: string | number;
  transaction_uuid: string;
  product_code: string;
} | null {
  try {
    let clean = encodedData.trim();
    if (clean.includes("%")) {
      try {
        clean = decodeURIComponent(clean);
      } catch {
        // ignore decode failure
      }
    }
    clean = clean.replace(/-/g, "+").replace(/_/g, "/");
    const pad = clean.length % 4;
    if (pad === 2) clean += "==";
    else if (pad === 3) clean += "=";

    const decoded = atob(clean);
    return JSON.parse(decoded);
  } catch (err) {
    console.error("Failed to decode eSewa callback payload:", err);
    return null;
  }
}

function CallbackContent() {
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const { lang, tx } = useLanguage();

  const [state, setState] = useState<"VERIFYING" | "SUCCESS" | "FAILED">("VERIFYING");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<CallbackSummary | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyRef = (refText?: string) => {
    if (!refText) return;
    navigator.clipboard.writeText(refText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  useEffect(() => {
    const getParam = (name: string): string | null => {
      const fromSearch = searchParams.get(name);
      if (fromSearch) return fromSearch;

      if (typeof window !== "undefined") {
        const fullUrl = window.location.href;
        const regex = new RegExp(`[?&]${name}=([^&#]*)`, "i");
        const match = fullUrl.match(regex);
        if (match && match[1]) {
          try {
            return decodeURIComponent(match[1]);
          } catch {
            return match[1];
          }
        }
      }
      return null;
    };

    // ── Preview Mode for visual review ───────────────
    const preview = getParam("preview");
    if (preview) {
      if (preview === "verifying") {
        setState("VERIFYING");
        setSummary({
          gateway: getParam("gateway")?.toLowerCase().includes("khalti") ? "Khalti" : "eSewa",
          transactionId: "preview-tx-892401",
          refCode: "000HHB0",
          amount: 200,
        });
        return;
      }
      if (preview === "esewa" || preview === "success") {
        setState("SUCCESS");
        setSummary({
          gateway: "eSewa",
          transactionId: "f83b1299-4d2a-4c28-98f1-892401b2a9f1",
          refCode: "000HHB0",
          amount: 200,
          itemTitle: "Electrician Needed for Fridge",
          days: 7,
        });
        return;
      }
      if (preview === "khalti") {
        setState("SUCCESS");
        setSummary({
          gateway: "Khalti",
          transactionId: "c299ec08-9eff-4921-9872-9ed6ce434893",
          refCode: "TJPcNJQJhQcSkLpJjWRJPs",
          amount: 200,
          itemTitle: "Featured Worker Spotlight",
          days: 14,
        });
        return;
      }
      if (preview === "failed") {
        setState("FAILED");
        setErrorMessage("Payment was canceled on official wallet portal.");
        return;
      }
    }

    // ── 1. eSewa Parameters Detection ─────────────────
    let esewaData = getParam("data");
    let esewaGateway = getParam("gateway");
    const esewaStatus = getParam("status");

    if (esewaGateway && esewaGateway.includes("?data=")) {
      const parts = esewaGateway.split("?data=");
      esewaGateway = parts[0];
      if (!esewaData && parts[1]) {
        esewaData = parts[1];
      }
    } else if (esewaGateway && esewaGateway.includes("&data=")) {
      const parts = esewaGateway.split("&data=");
      esewaGateway = parts[0];
      if (!esewaData && parts[1]) {
        esewaData = parts[1];
      }
    }

    const isEsewa = Boolean(
      esewaData ||
      (esewaGateway && esewaGateway.toLowerCase().startsWith("esewa"))
    );

    // ── 2. Khalti Parameters Detection ────────────────
    const pidx = getParam("pidx");
    const khaltiStatus = getParam("status");
    const khaltiOrderId = getParam("purchase_order_id");
    const khaltiTxnId = getParam("transaction_id") || getParam("txnId");
    const khaltiAmountPaisa = getParam("amount");

    const isKhalti = Boolean(pidx || (khaltiOrderId && !isEsewa));

    // ── Process eSewa Flow ────────────────────────────
    if (isEsewa) {
      if (esewaStatus === "failed" || esewaStatus === "canceled") {
        setState("FAILED");
        setErrorMessage("Payment was canceled or failed on eSewa.");
        return;
      }

      if (!esewaData) {
        setState("FAILED");
        setErrorMessage("Missing eSewa callback payload.");
        return;
      }

      const parsed = safeDecodeEsewaPayload(esewaData);
      if (!parsed) {
        setState("FAILED");
        setErrorMessage("Invalid eSewa response payload format.");
        return;
      }

      if (parsed.status !== "COMPLETE") {
        setState("FAILED");
        setErrorMessage(`eSewa returned payment status: ${parsed.status || "Unknown"}`);
        return;
      }

      const transactionUuid = parsed.transaction_uuid;
      const refId = parsed.transaction_code;
      const totalAmountNum = parsed.total_amount
        ? Math.round(Number(parsed.total_amount.toString().replace(/,/g, "")))
        : undefined;

      setSummary({
        gateway: "eSewa",
        transactionId: transactionUuid,
        refCode: refId,
        amount: totalAmountNum,
      });

      startTransition(async () => {
        try {
          const res = await verifyAndCompletePayment({
            transactionId: transactionUuid,
            gatewayRef: refId,
            isSimulator: false,
          });

          if (res.success) {
            if (res.details) {
              setSummary((prev) => ({
                gateway: "eSewa",
                transactionId: transactionUuid,
                refCode: res.details?.gatewayRef || refId,
                amount: res.details?.amount || totalAmountNum,
                itemTitle: res.details?.itemTitle,
                days: res.details?.days,
              }));
            }
            setState("SUCCESS");
          } else {
            setState("FAILED");
            setErrorMessage(res.error || "eSewa payment verification could not be confirmed.");
          }
        } catch (err) {
          setState("FAILED");
          setErrorMessage(err instanceof Error ? err.message : "Unexpected eSewa verification error");
        }
      });
      return;
    }

    // ── Process Khalti Flow ───────────────────────────
    if (isKhalti) {
      if (khaltiStatus === "User canceled" || khaltiStatus === "Canceled") {
        setState("FAILED");
        setErrorMessage("Payment was canceled on Khalti.");
        return;
      }

      if (!khaltiOrderId || !pidx) {
        setState("FAILED");
        setErrorMessage("Missing Khalti transaction reference or payment token.");
        return;
      }

      const amountRs = khaltiAmountPaisa ? Math.round(Number(khaltiAmountPaisa) / 100) : undefined;
      setSummary({
        gateway: "Khalti",
        transactionId: khaltiOrderId,
        refCode: khaltiTxnId || pidx,
        amount: amountRs,
      });

      startTransition(async () => {
        try {
          const res = await verifyAndCompletePayment({
            transactionId: khaltiOrderId,
            gatewayRef: pidx,
            isSimulator: false,
          });

          if (res.success) {
            if (res.details) {
              setSummary((prev) => ({
                gateway: "Khalti",
                transactionId: khaltiOrderId,
                refCode: res.details?.gatewayRef || khaltiTxnId || pidx,
                amount: res.details?.amount || amountRs,
                itemTitle: res.details?.itemTitle,
                days: res.details?.days,
              }));
            }
            setState("SUCCESS");
          } else {
            setState("FAILED");
            setErrorMessage(res.error || "Khalti payment verification could not be confirmed.");
          }
        } catch (err) {
          setState("FAILED");
          setErrorMessage(err instanceof Error ? err.message : "Unexpected verification error");
        }
      });
      return;
    }

    // ── Fallback: Neither Gateway Params Found ─────────
    setState("FAILED");
    setErrorMessage("No valid payment transaction reference or callback token was found.");
  }, [searchParams]);

  const isEsewa = summary?.gateway === "eSewa";
  const receiptNo = summary?.transactionId
    ? summary.transactionId.replace(/-/g, "").slice(-8).toUpperCase()
    : "892401B2";
  const formattedDate = new Date().toLocaleDateString(lang === "ne" ? "ne-NP" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="relative w-full max-w-md mx-auto print:max-w-none print:m-0">
      {/* ── Realistic Handcrafted Paperclip on top left corner ── */}
      <div className="absolute -top-3.5 left-7 z-30 pointer-events-none drop-shadow-md select-none print:hidden">
        <Image
          src="/notebook/paperclip.png"
          alt="Paperclip"
          width={22}
          height={48}
          className="w-5.5 h-auto object-contain"
        />
      </div>

      {/* ── The Physical Paper Slip Voucher ── */}
      <div className="relative bg-[#FCFAF6] dark:bg-[#141822] text-stone-900 dark:text-stone-100 rounded-3xl border-2 border-stone-300/80 dark:border-stone-700/80 shadow-[0_20px_50px_-10px_rgba(45,30,15,0.18)] dark:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.6)] p-6 sm:p-7 overflow-hidden transition-all">
        {/* Subtle decorative inner stitch border */}
        <div className="absolute inset-2 border border-dashed border-amber-900/15 dark:border-amber-400/15 rounded-2xl pointer-events-none" />

        {/* ── Header: Official KamGhar Seal & Voucher Number ── */}
        <div className="relative z-10 flex items-center justify-between pb-3.5 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center p-1.5 border border-orange-500/20">
              <Image
                src="/logo.png"
                alt="KamGhar Logo"
                width={28}
                height={28}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-extrabold text-stone-500 dark:text-stone-400 block font-mono">
                {tx("Official Receipt Slip", "कामघर आधिकारिक रसिद")}
              </span>
              <h1 className="text-xs font-black text-stone-900 dark:text-white leading-tight">
                KamGhar Services • कामघर
              </h1>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block text-[10px] font-mono font-bold bg-amber-100/70 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-300/60 dark:border-amber-800/60">
              NO. #{receiptNo}
            </span>
            <span className="block text-[9px] text-stone-400 dark:text-stone-500 font-mono mt-0.5">
              {formattedDate}
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* ── 1. VERIFYING STATE ──                               */}
        {/* ═══════════════════════════════════════════════════════ */}
        {state === "VERIFYING" && (
          <div className="py-7 px-2 text-center space-y-6 relative z-10 animate-in fade-in duration-300">
            {/* Live Artisan Gateway Seal */}
            <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
              {/* Outer Pulsing Ink Ring */}
              <div
                className={`absolute inset-0 rounded-full border-2 border-dashed animate-[spin_8s_linear_infinite] ${
                  isEsewa
                    ? "border-emerald-500/60"
                    : "border-purple-500/60"
                }`}
              />
              <div
                className={`absolute inset-1.5 rounded-full border border-stone-200 dark:border-stone-700 animate-pulse ${
                  isEsewa ? "bg-emerald-500/5" : "bg-purple-500/5"
                }`}
              />

              {/* Center Gateway Brand Mark */}
              <div className="relative w-16 h-16 rounded-full bg-white dark:bg-stone-900 shadow-md border border-stone-200 dark:border-stone-700 flex items-center justify-center p-2.5 z-10">
                <Image
                  src={isEsewa ? "/esewa-logo.png" : "/khalti-logo.png"}
                  alt={isEsewa ? "eSewa" : "Khalti"}
                  width={52}
                  height={52}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Typography */}
            <div className="space-y-1.5">
              <h2 className="text-lg font-black text-stone-900 dark:text-white tracking-tight">
                {tx("Verifying Official Ledger...", "भुक्तानी जाँच्दै छौँ...")}
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-300 max-w-xs mx-auto leading-relaxed">
                {tx(
                  "Confirming transaction token with eSewa & Khalti. Stamping your boost into the directory.",
                  "ईसेवा / खल्तीसँग कारोबार रुजु गर्दैछौँ। एकैछिनमा तपाईंको बुस्ट सक्रिय हुनेछ।"
                )}
              </p>
            </div>

            {/* Tactile Handcrafted Progress Steps */}
            <div className="p-3.5 rounded-2xl bg-[#F5F2EB] dark:bg-stone-900/80 border border-stone-300/70 dark:border-stone-700/70 text-left space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-stone-700 dark:text-stone-300 font-semibold">
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
                    ✓
                  </span>
                  <span>{tx("Token Received", "कारोबार संकेत प्राप्त")}</span>
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  OK
                </span>
              </div>

              <div className="flex items-center justify-between text-amber-900 dark:text-amber-200 font-semibold">
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center animate-spin">
                    ⟳
                  </span>
                  <span>{tx("Verifying Amount", "रकम रुजु हुँदैछ")}</span>
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold animate-pulse">
                  CHECKING...
                </span>
              </div>

              <div className="flex items-center justify-between text-stone-400 dark:text-stone-500">
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-stone-200 dark:bg-stone-800 text-[10px] flex items-center justify-center font-bold">
                    3
                  </span>
                  <span>{tx("Directory Spotlight Stamp", "फिड प्राथमिकता छाप")}</span>
                </span>
                <span className="text-[10px]">PENDING</span>
              </div>
            </div>

            {/* Gentle Human Reassurance */}
            <p className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center justify-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{tx("Please keep this slip open", "कृपया यो रसिद पृष्ठ बन्द नगर्नुहोस्")}</span>
            </p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* ── 2. SUCCESS STATE (Physical Stamped Receipt) ──       */}
        {/* ═══════════════════════════════════════════════════════ */}
        {state === "SUCCESS" && (
          <div className="py-4 space-y-4 relative z-10 animate-in fade-in zoom-in-95 duration-300">
            {/* ── Physical Ink Rubber Stamp ("PAID / भुक्तानी सम्पन्न") ── */}
            <div className="flex items-center justify-between pt-1">
              {/* Gateway Logo Badge */}
              <div className="flex items-center gap-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 px-3 py-1.5 rounded-2xl shadow-xs">
                <div className="w-6 h-6 relative flex-shrink-0">
                  <Image
                    src={isEsewa ? "/esewa-logo.png" : "/khalti-logo.png"}
                    alt={isEsewa ? "eSewa" : "Khalti"}
                    width={28}
                    height={28}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-left leading-none">
                  <span className="text-[10px] text-stone-400 dark:text-stone-500 font-mono block">
                    SETTLED VIA
                  </span>
                  <span className="text-xs font-black text-stone-900 dark:text-white">
                    {isEsewa ? "eSewa ePay" : "Khalti Digital"}
                  </span>
                </div>
              </div>

              {/* Stamped Ink Seal at slight angle */}
              <div className="transform -rotate-6 select-none animate-in zoom-in-75 duration-300">
                <div className="border-2 border-emerald-600 dark:border-emerald-500 rounded-xl px-2.5 py-1 text-emerald-700 dark:text-emerald-400 font-black font-mono text-[10px] tracking-widest uppercase flex items-center gap-1 shadow-xs bg-emerald-50/60 dark:bg-emerald-950/40">
                  <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-600" />
                  <span>{tx("PAID • भुक्तानी सम्पन्न", "भुक्तानी सम्पन्न • PAID")}</span>
                </div>
              </div>
            </div>

            {/* Total Amount Settled Box (Hand-ruled bill aesthetic) */}
            <div className="text-center py-2.5 px-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50">
              <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-widest font-mono block">
                {tx("Total Amount Settled", "जम्मा भुक्तान रकम")}
              </span>
              <div className="text-3xl font-black text-stone-900 dark:text-white tracking-tight my-0.5">
                रु. {summary?.amount || 200}/-
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{tx("Placement Boost Activated Immediately", "फिडको शीर्ष स्थानमा सक्रिय भयो")}</span>
              </span>
            </div>

            {/* ── Perforated Tear Line with Notches ── */}
            <div className="relative my-2 py-1">
              {/* Left Cutout Notch */}
              <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-stone-100 dark:bg-slate-950 border-r-2 border-stone-300/80 dark:border-stone-700/80" />
              {/* Right Cutout Notch */}
              <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-stone-100 dark:bg-slate-950 border-l-2 border-stone-300/80 dark:border-stone-700/80" />
              {/* Dashed Perforation Line */}
              <div className="border-t-2 border-dashed border-stone-300/80 dark:border-stone-700/80 w-full" />
            </div>

            {/* Itemized Voucher Breakdown Table */}
            <div className="space-y-2 text-xs font-mono bg-white/70 dark:bg-stone-900/60 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800">
              {/* Service Description */}
              <div className="flex justify-between items-start gap-2">
                <span className="text-stone-500 dark:text-stone-400">
                  {tx("Service / सेवा", "सेवा (Item):")}
                </span>
                <span className="font-bold text-stone-900 dark:text-white text-right font-sans">
                  {summary?.itemTitle || tx("Featured Profile Spotlight", "कामदार फिचर्ड प्रोफाइल बूस्ट")}
                  {summary?.days ? ` (${summary.days} ${tx("Days", "दिन")})` : ""}
                </span>
              </div>

              {/* Gateway Reference with 1-Click Copy */}
              {summary?.refCode && (
                <div className="flex justify-between items-center gap-2 pt-1.5 border-t border-stone-100 dark:border-stone-800">
                  <span className="text-stone-500 dark:text-stone-400">
                    {tx("Reference Code / कोड:", "कारोबार कोड:")}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyRef(summary.refCode)}
                    title={tx("Copy Reference Code", "कोड कपी गर्नुहोस्")}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-mono font-bold text-[11px] transition cursor-pointer"
                  >
                    <span>{summary.refCode}</span>
                    {copied ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-sans text-[10px] font-bold">
                        {tx("Copied!", "कपी भयो!")}
                      </span>
                    ) : (
                      <Copy className="w-3 h-3 text-stone-400" />
                    )}
                  </button>
                </div>
              )}

              {/* Status */}
              <div className="flex justify-between items-center gap-2 pt-1.5 border-t border-stone-100 dark:border-stone-800">
                <span className="text-stone-500 dark:text-stone-400">
                  {tx("Ledger Status:", "दर्ता स्थिति:")}
                </span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-[11px]">
                  ✓ {tx("Verified & Active", "प्रमाणित र सक्रिय")}
                </span>
              </div>
            </div>

            {/* Decorative Realistic Barcode (Handmade Voucher Detail) */}
            <div className="text-center pt-1 print:hidden select-none">
              <div className="flex items-center justify-center gap-1 text-stone-700 dark:text-stone-300 font-mono text-base tracking-widest scale-y-125">
                || | ||| || ||| | |||| || | ||| || ||||
              </div>
              <span className="block text-[9px] text-stone-400 dark:text-stone-500 font-mono tracking-widest mt-1">
                * KAMGHAR - DIGITAL - RECEIPT - {receiptNo} *
              </span>
            </div>

            {/* ── Actions ── */}
            <div className="space-y-2 pt-2 print:hidden">
              <Link
                href="/dashboard"
                className="w-full py-3.5 px-5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm shadow-lg shadow-orange-600/25 active:translate-y-0.5 transition flex items-center justify-center gap-2 cursor-pointer border-b-2 border-orange-800"
              >
                <span>{tx("Go to Dashboard", "ड्यासबोर्डमा जानुहोस्")}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="py-2.5 px-3 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{tx("Print Receipt", "रसिद छाप्नुहोस्")}</span>
                </button>

                <Link
                  href="/jobs"
                  className="py-2.5 px-3 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>{tx("View Directory", "कामहरू हेर्नुहोस्")}</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* ── 3. FAILED STATE (Clear, Reassuring Bill) ──         */}
        {/* ═══════════════════════════════════════════════════════ */}
        {state === "FAILED" && (
          <div className="py-4 space-y-4 relative z-10 animate-in fade-in zoom-in-95 duration-300">
            {/* Cancelled Rubber Ink Stamp */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 text-stone-500 font-mono text-xs">
                <Receipt className="w-4 h-4" />
                <span>{tx("Transaction Status", "कारोबार अवस्था")}</span>
              </div>

              <div className="transform -rotate-6 select-none">
                <div className="border-2 border-rose-600 dark:border-rose-500 rounded-xl px-2.5 py-1 text-rose-700 dark:text-rose-400 font-black font-mono text-[10px] tracking-widest uppercase flex items-center gap-1 shadow-xs bg-rose-50/60 dark:bg-rose-950/40">
                  <X className="w-3.5 h-3.5 stroke-[3] text-rose-600" />
                  <span>{tx("CANCELLED • अपूर्ण", "अपूर्ण • CANCELLED")}</span>
                </div>
              </div>
            </div>

            {/* Error Message Box */}
            <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/50 text-left space-y-1.5">
              <h3 className="text-xs font-black text-rose-900 dark:text-rose-200">
                {tx("Payment Was Not Completed", "भुक्तानी पूरा हुन सकेन")}
              </h3>
              <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed font-medium">
                {errorMessage || tx(
                  "The transaction could not be confirmed with the payment provider.",
                  "भुक्तानी गेटवेबाट कारोबार प्रमाणीकरण हुन सकेन।"
                )}
              </p>
            </div>

            {/* Human Reassurance Card */}
            <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 text-left space-y-1 text-xs">
              <span className="font-extrabold text-stone-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{tx("Your Wallet Balance Is Safe", "तपाईंको खाता सुरक्षित छ")}</span>
              </span>
              <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
                {tx(
                  "No funds were deducted for this attempt. If any temporary hold was placed by eSewa/Khalti, it will be automatically released back to your wallet.",
                  "यस प्रयासका लागि तपाईंको खाताबाट कुनै रकम काटिएको छैन। यदि वालेटमा रकम रोकिएको भए स्वतः फिर्ता हुनेछ।"
                )}
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <Link
                href="/dashboard"
                className="w-full py-3.5 px-5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm shadow-lg shadow-orange-600/25 active:translate-y-0.5 transition flex items-center justify-center gap-2 cursor-pointer border-b-2 border-orange-800"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{tx("Return to Dashboard & Try Again", "ड्यासबोर्ड फर्केर पुनः प्रयास गर्नुहोस्")}</span>
              </Link>
              <Link
                href="/jobs"
                className="w-full py-2.5 px-3 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer text-center"
              >
                <span>{tx("Browse Available Jobs", "खुला कामहरू हेर्नुहोस्")}</span>
              </Link>
            </div>
          </div>
        )}

        {/* ── Footer Micro-note ── */}
        <div className="pt-3 mt-3 border-t border-stone-200 dark:border-stone-800 text-center text-[10px] text-stone-400 dark:text-stone-500 font-mono flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
          <span>KamGhar Nepal Ledger • काठमाडौं, नेपाल</span>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-stone-100/60 dark:bg-slate-950">
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-[#FCFAF6] dark:bg-[#141822] border-2 border-stone-300/80 dark:border-stone-700/80 rounded-3xl p-8 shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-orange-500 animate-spin mx-auto" />
            <p className="text-xs font-mono font-bold text-stone-600 dark:text-stone-300">
              रसिद लोड हुँदैछ... / Loading official receipt...
            </p>
          </div>
        }
      >
        <CallbackContent />
      </Suspense>
    </div>
  );
}
