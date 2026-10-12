"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2 } from "lucide-react";
import { claimAdminRole } from "@/app/actions/admin";

export default function AdminClaimButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClaim = () => {
    setError(null);
    startTransition(async () => {
      const res = await claimAdminRole();
      if (res.success) {
        router.refresh();
      } else {
        setError(res.error || "Failed to claim admin role");
      }
    });
  };

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">{error}</p>
      )}
      <button
        type="button"
        disabled={isPending}
        onClick={handleClaim}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Assigning Admin Role...</span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4" />
            <span>Enable Admin Access for This Account</span>
          </>
        )}
      </button>
    </div>
  );
}
