"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Users,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  User,
  Phone,
  Sparkles,
} from "lucide-react";
import { registerUser } from "@/app/actions/auth";

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "recruiter" ? "RECRUITER" : "WORKER";

  const [role, setRole] = useState<"WORKER" | "RECRUITER">(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  };

  const passwordScore = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const response = await registerUser({
        name,
        email,
        password,
        role,
        phone: phone ? (phone.startsWith("+977") ? phone : `+977${phone}`) : "",
      });

      if (!response.success) {
        setErrorMessage(response.error ?? "Registration failed. Please check your information.");
      } else {
        setSuccessMessage("Account created! Let's set up your profile...");
        setTimeout(() => {
          router.push("/onboarding");
          router.refresh();
        }, 800);
      }
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-black/50 p-6 sm:p-10 transition-colors"
      >
        {/* Top Header inside card */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4 transition-transform hover:scale-105">
            <div className="dark:bg-white dark:rounded-xl dark:px-3 dark:py-1.5 dark:inline-flex transition-all duration-200">
              <Image
                src="/logo.png"
                alt="KamGhar Logo"
                width={160}
                height={52}
                priority
                className="h-10 w-auto object-contain mx-auto"
              />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Create your account
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Join thousands of gig workers and recruiters across Nepal
          </p>
        </div>

        {/* Animated Role Selection */}
        <div className="mb-8">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            I am joining as:
          </label>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Worker Role Button */}
            <button
              type="button"
              onClick={() => setRole("WORKER")}
              className={`relative flex flex-col items-start p-4 rounded-2xl border-2 text-left transition-all ${
                role === "WORKER"
                  ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/30 text-slate-900 dark:text-white shadow-sm shadow-orange-500/10"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400"
              }`}
            >
              {role === "WORKER" && (
                <motion.div
                  layoutId="roleIndicator"
                  className="absolute -top-2.5 -right-2 bg-orange-600 text-white rounded-full p-0.5 shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </motion.div>
              )}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 ${
                  role === "WORKER"
                    ? "bg-orange-600 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm block">Worker</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                Find local jobs & offer my skills
              </span>
            </button>

            {/* Recruiter Role Button */}
            <button
              type="button"
              onClick={() => setRole("RECRUITER")}
              className={`relative flex flex-col items-start p-4 rounded-2xl border-2 text-left transition-all ${
                role === "RECRUITER"
                  ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/30 text-slate-900 dark:text-white shadow-sm shadow-orange-500/10"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400"
              }`}
            >
              {role === "RECRUITER" && (
                <motion.div
                  layoutId="roleIndicator"
                  className="absolute -top-2.5 -right-2 bg-orange-600 text-white rounded-full p-0.5 shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </motion.div>
              )}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 ${
                  role === "RECRUITER"
                    ? "bg-orange-600 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                <Users className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm block">Recruiter</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                Hire nearby workers & post gigs
              </span>
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        <AnimatePresence mode="wait">
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm flex items-start gap-3"
            >
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <div className="flex-1 font-medium">{successMessage}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Full Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === "WORKER" ? "e.g. Bikash Thapa" : "e.g. Sunita Shrestha"}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Mobile Number (Nepal) <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative flex">
              <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium">
                +977
              </span>
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="98XXXXXXXX"
                  maxLength={10}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-r-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Password *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Dynamic Password Strength Indicator */}
            {password && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-2"
              >
                <div className="flex gap-1.5 h-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-full flex-1 rounded-full transition-all duration-300 ${
                        passwordScore >= step
                          ? passwordScore <= 2
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                          : "bg-slate-200 dark:bg-slate-700"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {passwordScore <= 1
                    ? "Weak password"
                    : passwordScore <= 3
                    ? "Good password"
                    : "Strong password"}
                </span>
              </motion.div>
            )}
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full mt-2 py-3 px-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-70 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 text-sm transition-colors cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating your account...</span>
              </>
            ) : (
              <>
                <span>Sign up as {role === "WORKER" ? "Worker" : "Recruiter"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        {/* Footer / Login Link */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 hover:underline inline-flex items-center gap-1"
          >
            Log in here
          </Link>
        </div>
      </motion.div>

      {/* Trust notice */}
      <div className="text-center mt-6 text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-orange-500" />
        <span>By signing up, you agree to KamGhar terms & privacy standards in Nepal.</span>
      </div>
    </div>
  );
}
