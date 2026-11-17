"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface LoadingAnimationProps {
  label?: string;
  sublabel?: string;
  fullscreen?: boolean;
  compact?: boolean;
  showLogo?: boolean;
}

// 6 Peacock-style harmonic spectrum dots mapped to Nepal's trade & gig categories:
// Amber (Electrician), Orange (KamGhar Primary), Crimson (Masonry), Violet (Tech), Azure (Plumbing), Emerald (Trades)
const ARC_DOTS = [
  { color: "#FAB915", baseY: 4.5, glow: "rgba(250, 185, 21, 0.7)" },
  { color: "#F97316", baseY: 1.5, glow: "rgba(249, 115, 22, 0.7)" },
  { color: "#EF4444", baseY: 0,   glow: "rgba(239, 68, 68, 0.7)" },
  { color: "#8B5CF6", baseY: 0,   glow: "rgba(139, 92, 246, 0.7)" },
  { color: "#0284C7", baseY: 1.5, glow: "rgba(2, 132, 199, 0.7)" },
  { color: "#10B981", baseY: 4.5, glow: "rgba(16, 185, 129, 0.7)" },
];

export default function LoadingAnimation({
  label,
  sublabel,
  fullscreen = false,
  compact = false,
  showLogo = true,
}: LoadingAnimationProps) {
  const content = (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* Optional Minimalist Brand Logo with subtle breathing */}
      {showLogo && (
        <motion.div
          animate={{ opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className={compact ? "mb-4" : "mb-6"}
        >
          <div className="bg-white rounded-xl px-3 py-1 shadow-md shadow-black/20 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="KamGhar"
              width={100}
              height={28}
              priority
              className={`${compact ? "h-5" : "h-6 sm:h-7"} w-auto object-contain`}
            />
          </div>
        </motion.div>
      )}

      {/* ── Mobbin Reference: 6 Harmonic Dots in an Arched Upward Plumage ── */}
      <div className="relative flex items-center justify-center gap-2.5 sm:gap-3 py-2 px-4">
        {ARC_DOTS.map((dot, idx) => (
          <motion.span
            key={idx}
            initial={{ y: dot.baseY, opacity: 0.7, scale: 1 }}
            animate={{
              y: [dot.baseY, dot.baseY - 9, dot.baseY],
              scale: [1, 1.28, 1],
              opacity: [0.65, 1, 0.65],
            }}
            transition={{
              duration: 1.25,
              repeat: Infinity,
              ease: "easeInOut",
              delay: idx * 0.13,
            }}
            className="rounded-full flex-shrink-0"
            style={{
              width: compact ? "8px" : "10px",
              height: compact ? "8px" : "10px",
              backgroundColor: dot.color,
              boxShadow: `0 0 10px ${dot.glow}, 0 0 4px ${dot.color}`,
            }}
          />
        ))}
      </div>

      {/* Optional Minimal Label */}
      {label && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className={`mt-4 text-center font-medium tracking-wider text-slate-300 dark:text-slate-400 ${
            compact ? "text-[11px]" : "text-xs"
          }`}
        >
          {label}
        </motion.p>
      )}

      {sublabel && (
        <p className="mt-1 text-center text-[10px] text-slate-500 tracking-wide">
          {sublabel}
        </p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black select-none">
        {content}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center select-none ${
        compact ? "py-8" : "py-16"
      }`}
    >
      {content}
    </div>
  );
}
