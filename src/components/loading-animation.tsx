"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface LoadingAnimationProps {
  label?: string;
  sublabel?: string;
  fullscreen?: boolean;
  compact?: boolean;
}

export default function LoadingAnimation({
  label = "Loading KamGhar...",
  sublabel = "Nepal's Location-Based Gig & Trade Platform",
  fullscreen = false,
  compact = false,
}: LoadingAnimationProps) {
  const content = (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* Ambient Radial Glow */}
      <div
        className={`absolute -inset-6 bg-gradient-to-tr from-orange-500/20 via-amber-500/15 to-orange-600/20 rounded-full blur-2xl pointer-events-none transition-all ${
          compact ? "opacity-60 -inset-3" : "opacity-90"
        }`}
      />

      {/* Main Logo Card with Animated Shimmering Conic Border */}
      <motion.div
        animate={{ y: [-2, 2, -2] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        className="relative flex items-center justify-center"
      >
        <div
          className={`relative p-[1.5px] rounded-2xl overflow-hidden shadow-xl shadow-orange-500/15 ${
            compact ? "rounded-xl" : "rounded-2xl"
          }`}
        >
          {/* Smooth Rotating Conic Gradient Beam */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-full bg-[conic-gradient(from_0deg,#f97316,#fbbf24,#f97316,#fb923c,#f97316)]"
          />

          {/* Inner Clean White Badge (protects logo contrast in dark mode) */}
          <div
            className={`relative z-10 bg-white flex items-center justify-center ${
              compact ? "px-4 py-2 rounded-[10px]" : "px-6 py-3.5 rounded-[14px]"
            }`}
          >
            <Image
              src="/logo.png"
              alt="KamGhar"
              width={140}
              height={40}
              priority
              className={`${compact ? "h-6 w-auto" : "h-8 w-auto"} object-contain`}
            />
          </div>
        </div>
      </motion.div>

      {/* Nepali Live Tag */}
      {!compact && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100/90 dark:bg-orange-950/70 border border-orange-200/80 dark:border-orange-800/80 text-[11px] font-bold text-orange-700 dark:text-orange-300 shadow-xs"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>दक्ष जनशक्ति • भरपर्दो सेवा</span>
        </motion.div>
      )}

      {/* Sleek Modern Gradient Progress Bar */}
      <div
        className={`bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden relative shadow-inner ${
          compact ? "mt-3 w-40 h-1" : "mt-3.5 w-52 sm:w-60 h-1.5"
        }`}
      >
        <motion.div
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-1/2 h-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600 rounded-full"
        />
      </div>

      {/* Dynamic Status Typography */}
      <div className={`text-center ${compact ? "mt-2 space-y-0.5" : "mt-3 space-y-0.5"}`}>
        <motion.p
          animate={{ opacity: [0.75, 1, 0.75] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className={`font-bold text-slate-800 dark:text-slate-100 tracking-tight ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          {label}
        </motion.p>
        {sublabel && (
          <p
            className={`text-slate-400 dark:text-slate-500 font-medium ${
              compact ? "text-[10px]" : "text-[11px]"
            }`}
          >
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/85 dark:bg-slate-950/85 backdrop-blur-md">
        {content}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center ${
        compact ? "py-8" : "py-12"
      }`}
    >
      {content}
    </div>
  );
}
