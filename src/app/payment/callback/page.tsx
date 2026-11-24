"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, ArrowRight, Home, Briefcase } from "lucide-react";
import { verifyAndCompletePayment } from "@/app/actions/payment";

interface CallbackSummary {
  gateway: "eSewa" | "Khalti";
  transactionId: string;
  refCode?: string;
  amount?: number;
}

function CallbackContent() {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [state, setState] = useState<"VERIFYING" | "SUCCESS" | "FAILED">("VERIFYING");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<CallbackSummary | null>(null);

  // Khalti parameters
  const pidx = searchParams.get("pidx");
  const khaltiStatus = searchParams.get("status");
  const khaltiOrderId = searchParams.get("purchase_order_id");
  const khaltiTxnId = searchParams.get("transaction_id") || searchParams.get("txnId");
  const khaltiAmountPaisa = searchParams.get("amount");

  // eSewa parameters
  const esewaDataEncoded = searchParams.get("data");
  const esewaGatewayParam = searchParams.get("gateway");

  useEffect(() => {
    // Resolve eSewa data payload robustly from searchParams or window URL
    let resolvedEsewaData = esewaDataEncoded;
    if (!resolvedEsewaData && typeof window !== "undefined") {
      const match = window.location.href.match(/[?&]data=([^&]+)/);
      if (match) {
        resolvedEsewaData = decodeURIComponent(match[1]);
      }
    }

    // ── 1. eSewa Callback Flow ─────────────────────────
    if (esewaGatewayParam === "esewa" || resolvedEsewaData) {
      if (searchParams.get("status") === "failed" || searchParams.get("status") === "canceled") {
        setState("FAILED");
        setErrorMessage("Payment was canceled or failed on eSewa.");
        return;
      }

      if (!resolvedEsewaData) {
        setState("FAILED");
        setErrorMessage("Missing eSewa callback payload.");
        return;
      }

      try {
        const normalized = resolvedEsewaData.replace(/-/g, "+").replace(/_/g, "/");
        const decodedStr = atob(normalized);
        const parsed = JSON.parse(decodedStr);

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
      } catch (decodeErr) {
        setState("FAILED");
        setErrorMessage("Invalid eSewa response payload.");
      }
      return;
    }

    // ── 2. Khalti Callback Flow ────────────────────────
    if (khaltiStatus === "User canceled" || khaltiStatus === "Canceled") {
      setState("FAILED");
      setErrorMessage("Payment was canceled on Khalti.");
      return;
    }

    if (!khaltiOrderId || !pidx) {
      setState("FAILED");
      setErrorMessage("Missing transaction reference or payment token.");
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
  }, [pidx, khaltiStatus, khaltiOrderId, khaltiTxnId, khaltiAmountPaisa, esewaDataEncoded, esewaGatewayParam, searchParams]);

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
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Gateway</span>
              <span className={`font-semibold ${summary?.gateway === "eSewa" ? "text-emerald-600 dark:text-emerald-400" : "text-purple-600 dark:text-purple-400"}`}>
                {summary?.gateway === "eSewa" ? "eSewa ePay" : "Khalti Digital"}
              </span>
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
