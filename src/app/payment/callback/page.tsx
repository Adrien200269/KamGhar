"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, ArrowRight, Home, Briefcase } from "lucide-react";
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
    <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl text-center">
      {state === "VERIFYING" && (
        <div className="space-y-4 py-8">
          <div className="w-16 h-16 rounded-full bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 mx-auto flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Verifying Payment Status
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Please wait while we confirm your payment reference with the gateway...
          </p>
        </div>
      )}

      {state === "SUCCESS" && (
        <div className="space-y-5 py-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Payment Successful!
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Your payment via {summary?.gateway || "Local Gateway"} has been confirmed and your boost is now active.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-left space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Gateway</span>
              <div className="flex items-center gap-1.5">
                <Image
                  src={summary?.gateway === "eSewa" ? "/esewa-logo.png" : "/khalti-logo.png"}
                  alt={summary?.gateway || "Gateway"}
                  width={18}
                  height={18}
                  className="w-4 h-4 object-contain inline-block shrink-0"
                />
                <span className={`font-semibold ${summary?.gateway === "eSewa" ? "text-emerald-600 dark:text-emerald-400" : "text-purple-600 dark:text-purple-400"}`}>
                  {summary?.gateway === "eSewa" ? "eSewa ePay" : "Khalti Digital"}
                </span>
              </div>
            </div>
            {summary?.amount !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Amount</span>
                <span className="font-semibold text-slate-900 dark:text-white">Rs. {summary.amount}</span>
              </div>
            )}
            {summary?.refCode && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Gateway Ref</span>
                <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                  {summary.refCode}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <Link
              href="/dashboard"
              className="flex-1 py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition"
            >
              <span>Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/jobs"
              className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <Briefcase className="w-4 h-4" />
              <span>Browse Gigs</span>
            </Link>
          </div>
        </div>
      )}

      {state === "FAILED" && (
        <div className="space-y-5 py-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
            <XCircle className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Payment Verification Failed
            </h2>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {errorMessage || "Unable to confirm transaction."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <Link
              href="/dashboard"
              className="flex-1 py-3 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <Home className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
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
