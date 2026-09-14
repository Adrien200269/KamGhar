import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import LoginForm from "./login-form";
import ThemeToggle from "@/components/theme-toggle";

export const metadata = {
  title: "Log In — KamGhar",
  description: "Log in to your KamGhar account to find jobs or manage your postings in Nepal.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen relative flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-200">
      {/* Background Decorative Gradients */}
      <div className="pointer-events-none absolute -top-40 -right-40 w-96 h-96 bg-orange-200/40 dark:bg-orange-500/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 w-96 h-96 bg-blue-200/40 dark:bg-blue-500/10 rounded-full blur-3xl" />

      {/* Top navigation */}
      <div className="w-full max-w-md mx-auto mb-6 flex items-center justify-between z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Home
        </Link>
        <ThemeToggle />
      </div>

      {/* Main Login Card */}
      <div className="relative z-10 w-full">
        <Suspense
          fallback={
            <div className="w-full max-w-md mx-auto h-80 bg-white/80 dark:bg-slate-900/80 rounded-3xl flex items-center justify-center border border-slate-200 dark:border-slate-800">
              <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
