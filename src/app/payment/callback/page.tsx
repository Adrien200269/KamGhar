"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  Home,
  Briefcase,
  TrendingUp,
  Zap,
  ShieldCheck,
  RotateCw,
  Sparkles,
} from "lucide-react";
import { verifyAndCompletePayment } from "@/app/actions/payment";

interface CallbackSummary {
  gateway: "eSewa" | "Khalti";
  transactionId: string;
  refCode?: string;
  amount?: number;
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
    // Replace URL-safe base64 characters
    clean = clean.replace(/-/g, "+").replace(/_/g, "/");
    // Pad base64 if needed
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
  const [isPending, startTransition] = useTransition();

  const [state, setState] = useState<"VERIFYING" | "SUCCESS" | "FAILED">("VERIFYING");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<CallbackSummary | null>(null);

  useEffect(() => {
    // Robust parameter extractor that handles standard searchParams, double '?', and URL-encoded queries
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

    // ── 1. eSewa Parameters Detection ─────────────────
    let esewaData = getParam("data");
    let esewaGateway = getParam("gateway");
    const esewaStatus = getParam("status");

    // Handle malformed URL cases like ?gateway=esewa?data=XYZ
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

  return (
    <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-center space-y-6">
      {/* Ambient Warm Gradient Header Glow */}
      <div
        className={`absolute top-0 left-0 right-0 h-32 pointer-events-none transition-colors duration-500 ${
          state === "SUCCESS"
            ? "bg-gradient-to-b from-emerald-500/15 via-teal-500/5 to-transparent"
            : state === "FAILED"
            ? "bg-gradient-to-b from-rose-500/15 via-amber-500/5 to-transparent"
            : "bg-gradient-to-b from-amber-500/15 via-orange-500/5 to-transparent"
        }`}
      />

      {/* ── 1. VERIFYING STATE ── */}
      {state === "VERIFYING" && (
        <div className="space-y-6 py-2 relative z-10 animate-in fade-in duration-200">
          <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-500/25 mx-auto">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Verifying Payment Status
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Confirming transaction ledger with official gateway servers...
            </p>
          </div>

          {/* Highlights Banner */}
          <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-around text-xs font-bold text-amber-900 dark:text-amber-200">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span>Real-Time Check</span>
            </span>
            <div className="w-px h-4 bg-amber-200/80 dark:bg-amber-800" />
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>256-Bit Encrypted</span>
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            Please keep this window open while the payment provider responds.
          </div>

          <div className="pt-2 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Secure official portal redirection confirmation</span>
          </div>
        </div>
      )}

      {/* ── 2. SUCCESS STATE ── */}
      {state === "SUCCESS" && (
        <div className="space-y-5 relative z-10 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Payment Confirmed!
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your payment via {summary?.gateway || "official gateway"} has been verified and your boost is now active.
            </p>
          </div>

          {/* Highlights Banner */}
          <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-around text-xs font-bold text-amber-900 dark:text-amber-200">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span>5x More Visibility</span>
            </span>
            <div className="w-px h-4 bg-amber-200/80 dark:bg-amber-800" />
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Top Placement Badge</span>
            </span>
          </div>

          {/* Transaction Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-left space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Gateway</span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs">
                <span
                  className={`w-2 h-2 rounded-full ${
                    summary?.gateway === "eSewa" ? "bg-emerald-500" : "bg-purple-500"
                  }`}
                />
                <span
                  className={`font-bold text-[11px] ${
                    summary?.gateway === "eSewa"
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-purple-700 dark:text-purple-400"
                  }`}
                >
                  {summary?.gateway === "eSewa" ? "eSewa ePay" : "Khalti Digital"}
                </span>
              </div>
            </div>

            {summary?.amount !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Total Amount Paid</span>
                <span className="font-black text-slate-900 dark:text-white text-sm">
                  Rs. {summary.amount}
                </span>
              </div>
            )}

            {summary?.refCode && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Gateway Reference</span>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-700/60 text-slate-800 dark:text-slate-200 font-semibold truncate max-w-[180px]">
                  {summary.refCode}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Placement Status</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-3 h-3" />
                <span>Active at Top of Feed</span>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <Link
              href="/dashboard"
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-sm shadow-xl shadow-orange-500/25 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/jobs"
              className="w-full py-3.5 px-6 rounded-2xl border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Briefcase className="w-4 h-4" />
              <span>Browse All Gig Listings</span>
            </Link>
          </div>

          {/* Security Footer */}
          <div className="pt-1 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Official verified transaction. Your boost is immediately live.</span>
          </div>
        </div>
      )}

      {/* ── 3. FAILED STATE ── */}
      {state === "FAILED" && (
        <div className="space-y-5 relative z-10 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-14 h-14 bg-gradient-to-tr from-rose-500 to-red-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-rose-500/30 mx-auto">
            <XCircle className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Payment Not Completed
            </h2>
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              {errorMessage || "The transaction could not be confirmed with the payment gateway."}
            </p>
          </div>

          {/* Highlights Banner */}
          <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-around text-xs font-bold text-amber-900 dark:text-amber-200">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Balance Unaffected</span>
            </span>
            <div className="w-px h-4 bg-amber-200/80 dark:bg-amber-800" />
            <span className="flex items-center gap-1.5">
              <RotateCw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Instant Retry Supported</span>
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-left space-y-2 text-xs">
            <p className="text-slate-600 dark:text-slate-400">
              No charges were finalized on your account for this attempt. If any funds were reserved by your wallet, they will be automatically released by the gateway.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <Link
              href="/dashboard"
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-sm shadow-xl shadow-orange-500/25 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Return to Dashboard & Try Again</span>
            </Link>
            <Link
              href="/jobs"
              className="w-full py-3.5 px-6 rounded-2xl border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Briefcase className="w-4 h-4" />
              <span>View Public Jobs</span>
            </Link>
          </div>

          {/* Security Footer */}
          <div className="pt-1 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>Secure official portal redirection. You will return here after completion.</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 mx-auto flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Loading payment status...
            </p>
          </div>
        }
      >
        <CallbackContent />
      </Suspense>
    </div>
  );
}
