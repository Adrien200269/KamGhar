"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Briefcase, User, CheckCircle2, ArrowRight,
  ArrowLeft, Loader2, Star, Wrench, Zap, AlertCircle,
} from "lucide-react";
import {
  completeWorkerOnboarding,
  completeRecruiterOnboarding,
} from "@/app/actions/profile";
import { NEPAL_DISTRICTS, SKILL_CATEGORIES } from "@/lib/constants";

type Role = "WORKER" | "RECRUITER" | "ADMIN";

interface Props {
  role: Role;
  name: string;
  email: string;
}

const TOTAL_STEPS = 3;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

export default function OnboardingWizard({ role, name, email }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Shared
  const [bio, setBio] = useState("");
  const [address, setAddress] = useState("");

  // Worker specific
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState("");

  // Recruiter specific
  const [businessName, setBusinessName] = useState("");

  const goNext = () => { setDir(1); setStep((s) => s + 1); };
  const goPrev = () => { setDir(-1); setStep((s) => s - 1); };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      let result;
      if (role === "WORKER") {
        result = await completeWorkerOnboarding({
          bio,
          skills: selectedSkills,
          hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
          address,
        });
      } else {
        result = await completeRecruiterOnboarding({
          bio,
          businessName,
          address,
        });
      }

      if (!result.success) {
        setError(result.error ?? "Something went wrong. Please try again.");
        setIsSubmitting(false);
        return;
      }

      goNext(); // show success step
    } catch {
      setError("An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  const stepTitles = [
    "Welcome to KamGhar",
    role === "WORKER" ? "Your Skills & Rate" : "Your Business",
    "All done!",
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center px-4 py-12 transition-colors duration-200">
      {/* Background blobs */}
      <div className="pointer-events-none fixed -top-40 -right-40 w-[500px] h-[500px] bg-orange-200/30 dark:bg-orange-500/5 rounded-full blur-3xl" />
      <div className="pointer-events-none fixed -bottom-40 -left-40 w-[500px] h-[500px] bg-blue-200/30 dark:bg-blue-500/5 rounded-full blur-3xl" />

      <div className="w-full max-w-lg relative z-10">
        {/* Progress bar */}
        {step < TOTAL_STEPS && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <motion.div
                    animate={{
                      backgroundColor: step >= s ? "#ea580c" : step > s ? "#16a34a" : undefined,
                    }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                      step > s
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : step === s
                        ? "bg-orange-600 border-orange-600 text-white"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                    }`}
                  >
                    {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                  </motion.div>
                  {s < 2 && (
                    <div className="flex-1 h-0.5 w-16 sm:w-32">
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: step > s ? 1 : 0 }}
                        className="h-full bg-orange-500 origin-left rounded-full"
                      />
                      <div className="h-full -mt-0.5 bg-slate-200 dark:bg-slate-700 rounded-full -z-10" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 text-right">
              Step {step} of 2
            </p>
          </div>
        )}

        {/* Card */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl shadow-slate-200/40 dark:shadow-black/40 overflow-hidden">
          <AnimatePresence mode="wait" custom={dir}>
            {/* ── STEP 1 ── Location & Bio */}
            {step === 1 && (
              <motion.div
                key="step1"
                custom={dir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="p-6 sm:p-10"
              >
                <div className="mb-8 text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 280 }}
                    className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-100 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800/50 flex items-center justify-center"
                  >
                    <User className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                  </motion.div>
                  <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    Hey, {name.split(" ")[0]}! 👋
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Let&apos;s set up your {role === "WORKER" ? "worker" : "recruiter"} profile — takes under 2 minutes.
                  </p>
                </div>

                <div className="space-y-5">
                  {/* District */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-orange-500" />Your Location (District)</span>
                    </label>
                    <select
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white"
                    >
                      <option value="">Select your district...</option>
                      {NEPAL_DISTRICTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      About You <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      maxLength={300}
                      placeholder={
                        role === "WORKER"
                          ? "Tell clients what you do and what makes you stand out..."
                          : "Describe your business and the kind of workers you typically hire..."
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
                    />
                    <p className="text-xs text-slate-400 text-right mt-1">{bio.length}/300</p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={goNext}
                  className="mt-8 w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 text-sm transition-colors cursor-pointer"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </motion.button>
              </motion.div>
            )}

            {/* ── STEP 2 ── Role-specific */}
            {step === 2 && (
              <motion.div
                key="step2"
                custom={dir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="p-6 sm:p-10"
              >
                <div className="mb-6 text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 280 }}
                    className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-100 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center"
                  >
                    {role === "WORKER"
                      ? <Wrench className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      : <Briefcase className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    }
                  </motion.div>
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {role === "WORKER" ? "Your Skills & Rate" : "Your Business"}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {role === "WORKER"
                      ? "Select all skills you offer — clients will find you based on these."
                      : "Tell workers a bit about your business."}
                  </p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}

                {role === "WORKER" ? (
                  <div className="space-y-5">
                    {/* Skills */}
                    <div className="max-h-64 overflow-y-auto pr-1 space-y-4 scrollbar-thin">
                      {SKILL_CATEGORIES.map((cat) => (
                        <div key={cat.group}>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{cat.group}</p>
                          <div className="flex flex-wrap gap-2">
                            {cat.skills.map((skill) => {
                              const active = selectedSkills.includes(skill);
                              return (
                                <motion.button
                                  key={skill}
                                  type="button"
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => toggleSkill(skill)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                    active
                                      ? "bg-orange-600 border-orange-600 text-white shadow-md shadow-orange-500/20"
                                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-orange-400"
                                  }`}
                                >
                                  {skill}
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    {selectedSkills.length > 0 && (
                      <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold">
                        {selectedSkills.length} skill{selectedSkills.length > 1 ? "s" : ""} selected
                      </p>
                    )}

                    {/* Hourly Rate */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-orange-500" />Hourly Rate (NPR) <span className="text-slate-400 font-normal">— optional</span></span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm text-slate-400 pointer-events-none">Rs.</span>
                        <input
                          type="number"
                          min={0}
                          value={hourlyRate}
                          onChange={(e) => setHourlyRate(e.target.value)}
                          placeholder="e.g. 500"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Business / Company Name <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Sharma Constructions"
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                )}

                <div className="mt-8 flex gap-3">
                  <button
                    onClick={goPrev}
                    className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 py-3 px-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-70 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 text-sm transition-colors cursor-pointer"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                    ) : (
                      <>Finish Setup <CheckCircle2 className="w-4 h-4" /></>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3 ── Done! */}
            {step === 3 && (
              <motion.div
                key="step3"
                custom={dir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="p-6 sm:p-10 text-center"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
                  className="text-7xl mb-6 select-none"
                >
                  🎉
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
                    You&apos;re all set, {name.split(" ")[0]}!
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                    Your profile is live on KamGhar.{" "}
                    {role === "WORKER"
                      ? "Start browsing jobs near you."
                      : "Start posting jobs and finding workers."}
                  </p>

                  <div className="flex flex-col gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push("/dashboard")}
                      className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 text-sm transition-colors cursor-pointer"
                    >
                      Go to Dashboard <ArrowRight className="w-4 h-4" />
                    </motion.button>
                    <button
                      onClick={() => router.push("/")}
                      className="w-full py-2.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    >
                      Back to Homepage
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Skip link (only on steps 1 & 2) */}
        {step < 3 && (
          <p className="text-center mt-5 text-xs text-slate-400 dark:text-slate-500">
            <button
              onClick={() => router.push("/dashboard")}
              className="hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2 transition-colors cursor-pointer"
            >
              Skip for now — I&apos;ll complete my profile later
            </button>
          </p>
        )}
      </div>
    </div>
  );
}