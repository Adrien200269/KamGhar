import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Loader2 } from "lucide-react";
import RegisterForm from "./register-form";
import ThemeToggle from "@/components/theme-toggle";
import AuthImageCarousel from "@/components/auth-image-carousel";

export const metadata = {
  title: "Sign Up — KamGhar",
  description: "Create an account on KamGhar to find local gig work or hire skilled talent across Nepal.",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-slate-950 transition-colors duration-200">
      {/* ── Left panel: Form ── */}
      <div className="flex-1 flex flex-col justify-between px-6 py-6 sm:px-10 lg:px-12 xl:px-16 max-w-2xl min-h-screen overflow-y-auto">
        {/* Top nav */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
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
        <div className="lg:hidden mb-4">
          <AuthImageCarousel variant="mobile" intervalSeconds={4} />
        </div>

        {/* Content Area */}
        <div className="my-auto py-2">
          {/* Logo + heading */}
          <div className="mb-4">
            <Link href="/" className="inline-block mb-2">
              <div className="dark:bg-white dark:rounded-xl dark:px-2.5 dark:py-1 dark:inline-flex transition-all duration-200">
                <Image
                  src="/logo.png"
                  alt="KamGhar"
                  width={130}
                  height={42}
                  priority
                  className="h-8 w-auto object-contain"
                />
              </div>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Create your account.
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5">
              Connect with nearby work, or find dependable local hands in minutes.
            </p>
          </div>

          {/* Form */}
          <Suspense
            fallback={
              <div className="h-48 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
              </div>
            }
          >
            <RegisterForm />
          </Suspense>
        </div>

        {/* Footer */}
        <p className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 dark:text-slate-600">
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
