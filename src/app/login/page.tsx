import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Loader2, MapPin, Star } from "lucide-react";
import LoginForm from "./login-form";
import ThemeToggle from "@/components/theme-toggle";

export const metadata = {
  title: "Log In — KamGhar",
  description: "Log in to your KamGhar account to find jobs or manage your postings in Nepal.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950 transition-colors duration-200">

      {/* ── Left panel: Form ── */}
      <div className="flex-1 flex flex-col px-6 py-8 sm:px-10 lg:px-16 xl:px-24 max-w-xl">

        {/* Top nav */}
        <div className="flex items-center justify-between mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
          <ThemeToggle />
        </div>

        {/* Logo + heading — left aligned */}
        <div className="mb-10">
          <Link href="/" className="inline-block mb-6">
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
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
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

      {/* ── Right panel: Photo + story ── */}
      <div className="hidden lg:flex flex-1 relative bg-slate-900 overflow-hidden">

        {/* Full bleed photo */}
        <Image
          src="/worker-electrician.jpg"
          alt="Electrician at work"
          fill
          className="object-cover opacity-60"
          sizes="50vw"
          priority
        />

        {/* Dark gradient over photo */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

        {/* Content over photo */}
        <div className="absolute inset-0 flex flex-col justify-end p-12">

          {/* Quote card */}
          <div className="mb-8 max-w-md">
            <p className="text-white text-xl font-bold leading-snug mb-4">
              &ldquo;I got my first job 40 minutes after signing up. A wiring job in Chabahil, NPR 4,500.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                S
              </div>
              <div>
                <div className="text-white text-sm font-semibold">Suraj Tamang</div>
                <div className="text-slate-400 text-xs flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Electrician · Lalitpur
                </div>
              </div>
              <div className="ml-auto flex gap-0.5">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                ))}
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="flex items-center gap-8 border-t border-white/10 pt-6">
            <div>
              <div className="text-2xl font-extrabold text-white">847</div>
              <div className="text-slate-400 text-xs mt-0.5">gigs this month</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white">23 min</div>
              <div className="text-slate-400 text-xs mt-0.5">avg first response</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white">NPR 0</div>
              <div className="text-slate-400 text-xs mt-0.5">commission for workers</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
