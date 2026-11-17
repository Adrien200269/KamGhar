"use client";

import { motion } from "framer-motion";

interface LoadingAnimationProps {
  label?: string;
  sublabel?: string;
  fullscreen?: boolean;
  compact?: boolean;
  showLogo?: boolean;
}

// 10-bead ring with trailing snake opacity gradient from Mobbin Genie reference
const BEADS = [
  { opacity: 1.0, scale: 1.0 },
  { opacity: 0.9, scale: 0.96 },
  { opacity: 0.8, scale: 0.92 },
  { opacity: 0.7, scale: 0.88 },
  { opacity: 0.6, scale: 0.84 },
  { opacity: 0.5, scale: 0.8 },
  { opacity: 0.4, scale: 0.76 },
  { opacity: 0.3, scale: 0.72 },
  { opacity: 0.18, scale: 0.68 },
  { opacity: 0.05, scale: 0.6 },
];

export default function LoadingAnimation({
  label,
  sublabel,
  fullscreen = false,
  compact = false,
}: LoadingAnimationProps) {
  const radius = compact ? 15 : 19;
  const beadSize = compact ? 6.5 : 8;
  const containerSize = (radius + beadSize) * 2;

  const content = (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* ── Mobbin Genie Reference: 10-Bead Rotating Ring Spinner ── */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 0.85,
          repeat: Infinity,
          ease: "linear",
        }}
        className="relative flex items-center justify-center"
        style={{ width: containerSize, height: containerSize }}
      >
        {BEADS.map((bead, i) => {
          const angle = (i * 360) / BEADS.length;
          const rad = (angle * Math.PI) / 180;
          const x = radius * Math.cos(rad);
          const y = radius * Math.sin(rad);

          return (
            <span
              key={i}
              className="absolute rounded-full bg-black dark:bg-white transition-colors"
              style={{
                width: beadSize,
                height: beadSize,
                left: `calc(50% + ${x}px - ${beadSize / 2}px)`,
                top: `calc(50% + ${y}px - ${beadSize / 2}px)`,
                opacity: bead.opacity,
                transform: `scale(${bead.scale})`,
              }}
            />
          );
        })}
      </motion.div>

      {/* Optional Minimal Typography (only if explicitly provided) */}
      {label && (
        <p
          className={`mt-4 text-center font-medium tracking-tight text-slate-500 dark:text-slate-400 ${
            compact ? "text-[11px]" : "text-xs"
          }`}
        >
          {label}
        </p>
      )}

      {sublabel && (
        <p className="mt-0.5 text-center text-[10px] text-slate-400 dark:text-slate-500 tracking-wide">
          {sublabel}
        </p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-black select-none">
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
