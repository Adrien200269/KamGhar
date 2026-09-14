"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { updatePassword } from "@/app/actions/auth";

/* ── password strength helper ─────────────────────────────── */
function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: "Too weak", color: "bg-red-500" };
  if (score === 2) return { score, label: "Weak", color: "bg-orange-400" };
  if (score === 3) return { score, label: "Fair", color: "bg-yellow-400" };
  if (score === 4) return { score, label: "Good", color: "bg-emerald-400" };
  return { score, label: "Strong", color: "bg-emerald-500" };
}

export default function ResetPasswordForm() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const strength = getStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await updatePassword({ password });

      if (!response.success) {
        setErrorMessage(
          response.error ??
          "Could not update password. Your reset link may have expired — request a new one."
        );
      } else {
        setSuccessMessage(response.message ?? "Password updated!");
        setDone(true);
        // Redirect to login after 2.5 seconds
        setTimeout(() => {
          router.push("/login?passwordReset=true");
        }, 2500);
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

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
            className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-orange-100 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800/50 flex items-center justify-center"
          >
            <ShieldCheck className="w-7 h-7 text-orange-600 dark:text-orange-400" />
          </motion.div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Set new password
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Your new password must be at least 8 characters long.
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
          {successMessage && done && (
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

        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4 py-4"
            >
              <motion.div
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="text-5xl select-none"
              >
                🔓
              </motion.div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Redirecting you to log in...
              </p>
              <div className="flex items-center justify-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
                    className="w-2 h-2 rounded-full bg-orange-500"
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
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

                {/* Strength bar */}
                {password.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-2 space-y-1.5"
                  >
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <div
                          key={lvl}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            strength.score >= lvl
                              ? strength.color
                              : "bg-slate-200 dark:bg-slate-700"
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${
                      strength.score <= 2
                        ? "text-red-500 dark:text-red-400"
                        : strength.score === 3
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}>
                      {strength.label}
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                      confirmPassword.length > 0 && confirmPassword !== password
                        ? "border-red-400 dark:border-red-600"
                        : confirmPassword.length > 0 && confirmPassword === password
                        ? "border-emerald-400 dark:border-emerald-600"
                        : "border-slate-200 dark:border-slate-700"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && confirmPassword !== password && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1 font-medium">
                    Passwords do not match
                  </p>
                )}
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
                    <span>Updating password...</span>
                  </>
                ) : (
                  <>
                    <span>Update Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Footer link */}
        {!done && (
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Link expired?{" "}
            <Link
              href="/forgot-password"
              className="font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 hover:underline"
            >
              Request a new reset link
            </Link>
          </div>
        )}
      </motion.div>

      {/* Trust notice */}
      <div className="text-center mt-6 text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-orange-500" />
        <span>Your data is encrypted and never shared.</span>
      </div>
    </div>
  );
}
