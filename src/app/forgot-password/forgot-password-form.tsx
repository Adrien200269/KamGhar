"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Sparkles,
} from "lucide-react";
import { requestPasswordReset } from "@/app/actions/auth";

export default function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const linkExpired = searchParams.get("error") === "expired";

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    linkExpired ? "Your reset link has expired. Please request a new one." : null
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await requestPasswordReset({ email });

      if (!response.success) {
        setErrorMessage(response.error ?? "Something went wrong. Please try again.");
      } else {
        setSuccessMessage(response.message ?? "Reset link sent!");
        setEmailSent(true);
      }
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-black/50 p-6 sm:p-10 transition-colors"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-5 transition-transform hover:scale-105">
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

          {/* Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
            className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-orange-100 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800/50 flex items-center justify-center"
          >
            <KeyRound className="w-7 h-7 text-orange-600 dark:text-orange-400" />
          </motion.div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Forgot your password?
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            No worries! Enter your email and we will send you a secure link to reset your password.
          </p>
        </div>

        {/* Alerts */}
        <AnimatePresence mode="wait">
          {errorMessage && (
            <motion.div
              key="error"
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </motion.div>
          )}

          {successMessage && emailSent && (
            <motion.div
              key="success"
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm flex items-start gap-3"
            >
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <div className="flex-1 font-medium">{successMessage}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form or Success State */}
        <AnimatePresence mode="wait">
          {emailSent ? (
            <motion.div
              key="sent-state"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="text-center space-y-6"
            >
              {/* Animated envelope illustration */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="text-6xl select-none"
              >
                ✉️
              </motion.div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  We sent an email to
                </p>
                <p className="text-sm font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 rounded-xl py-2 px-4 inline-block border border-orange-200 dark:border-orange-800/50">
                  {email}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                  Click the link in the email to reset your password. The link expires in 1 hour.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Did not receive it? Check your spam folder or try again.
                </p>
                <button
                  onClick={() => {
                    setEmailSent(false);
                    setSuccessMessage(null);
                    setErrorMessage(null);
                    setEmail("");
                  }}
                  className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline"
                >
                  Try a different email
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Email Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
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

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full mt-1 py-3 px-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-70 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 text-sm transition-colors cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Back to login */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Remembered your password?{" "}
          <Link
            href="/login"
            className="font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 hover:underline"
          >
            Back to log in
          </Link>
        </div>
      </motion.div>

      {/* Trust notice */}
      <div className="text-center mt-6 text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-orange-500" />
        <span>Your data is encrypted and never shared.</span>
      </div>
    </div>
  );
}
