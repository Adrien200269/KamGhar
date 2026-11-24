"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, ArrowRight, Home, Briefcase } from "lucide-react";
import { verifyAndCompletePayment } from "@/app/actions/payment";

function CallbackContent() {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [state, setState] = useState<"VERIFYING" | "SUCCESS" | "FAILED">("VERIFYING");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pidx = searchParams.get("pidx");
  const status = searchParams.get("status");
  const transactionId = searchParams.get("purchase_order_id");
  const khaltiTxnId = searchParams.get("transaction_id") || searchParams.get("txnId");
  const amountPaisa = searchParams.get("amount");
  const amountRs = amountPaisa ? Math.round(Number(amountPaisa) / 100) : null;

  useEffect(() => {
    // If user canceled on Khalti
    if (status === "User canceled" || status === "Canceled") {
      setState("FAILED");
      setErrorMessage("Payment was canceled on Khalti.");
      return;
    }

    if (!transactionId || !pidx) {
      setState("FAILED");
      setErrorMessage("Missing transaction reference or Khalti token.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await verifyAndCompletePayment({
          transactionId,
          gatewayRef: pidx,
          isSimulator: false,
        });

        if (res.success) {
          setState("SUCCESS");
        } else {
          setState("FAILED");
          setErrorMessage(res.error || "Payment verification could not be confirmed.");
        }
      } catch (err) {
        setState("FAILED");
        setErrorMessage(err instanceof Error ? err.message : "Unexpected verification error");
      }
    });
  }, [pidx, status, transactionId]);

  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl text-center">
      {state === "VERIFYING" && (
        <div className="space-y-4 py-8">
          <div className="w-16 h-16 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Verifying Khalti Payment
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Please wait while we confirm your payment reference with Khalti...
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
              Your payment via Khalti has been verified and your boost is now active.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Gateway</span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">Khalti Digital</span>
            </div>
            {amountRs !== null && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Amount</span>
                <span className="font-semibold text-slate-900 dark:text-white">Rs. {amountRs}</span>
              </div>
            )}
            {khaltiTxnId && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Khalti Txn ID</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{khaltiTxnId}</span>
              </div>
            )}
            {pidx && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">PIDX</span>
                <span className="font-mono text-[10px] text-slate-500 truncate max-w-[180px]">{pidx}</span>
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
            <div className="w-16 h-16 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center">
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
