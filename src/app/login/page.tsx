import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Loader2 } from "lucide-react";
import LoginForm from "./login-form";
import ThemeToggle from "@/components/theme-toggle";
import AuthImageCarousel from "@/components/auth-image-carousel";

export const metadata = {
  title: "Log In — KamGhar",
  description: "Log in to your KamGhar account to find jobs or manage your postings in Nepal.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-slate-950 transition-colors duration-200">
      {/* ── Left panel: Form ── */}
      <div className="flex-1 flex flex-col px-6 py-8 sm:px-10 lg:px-16 xl:px-24 max-w-xl">
        {/* Top nav */}
        <div className="flex items-center justify-between mb-8 sm:mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
          <ThemeToggle />
        </div>

        {/* Mobile Animated Image Carousel (visible only on mobile/tablet) */}
        <div className="lg:hidden mb-6">
          <AuthImageCarousel variant="mobile" intervalSeconds={4} />
        </div>

        {/* Logo + heading — left aligned */}
        <div className="mb-8">
          <Link href="/" className="inline-block mb-4">
            <div className="dark:bg-white dark:rounded-xl dark:px-3 dark:py-1.5 dark:inline-flex transition-all duration-200">
              <Image
                src="/logo.png"
                alt="KamGhar"
                width={140}
                height={46}
                priority
                className="h-9 w-auto object-contain"
              />
            </div>
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Log back in.
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5">
            Your gigs and messages are waiting.
          </p>
        </div>

        {/* Form */}
        <Suspense
          fallback={
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        {/* Footer */}
        <p className="mt-auto pt-10 text-xs text-slate-400 dark:text-slate-600">
          © {new Date().getFullYear()} KamGhar · Built in Kathmandu
        </p>
      </div>

      {/* ── Right panel: Full desktop animated carousel (clean, no text on image) ── */}
      <div className="hidden lg:flex flex-1 relative bg-slate-950 overflow-hidden min-h-screen">
        <AuthImageCarousel variant="desktop" intervalSeconds={4} />
      </div>
    </div>
  );
}
