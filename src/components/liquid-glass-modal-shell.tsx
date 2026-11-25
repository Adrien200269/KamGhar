"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";

export function LiquidGlassModalShell({
  titleId,
  badgeText,
  title,
  subtitle,
  onClose,
  children,
}: {
  titleId: string;
  badgeText: string;
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-slate-950/35 dark:bg-slate-950/65 backdrop-blur-md"
    >
      {/* Ambient Liquid Refraction Orbs behind card */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-[12%] left-[18%] w-72 h-72 rounded-full bg-orange-400/25 dark:bg-orange-500/15 blur-3xl" />
        <div className="absolute bottom-[14%] right-[16%] w-80 h-80 rounded-full bg-amber-300/25 dark:bg-amber-500/10 blur-3xl" />
        <div className="absolute top-[45%] right-[28%] w-56 h-56 rounded-full bg-sky-300/20 dark:bg-sky-500/10 blur-3xl" />
      </div>

      {/* Liquid Glass Card Container */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90dvh] flex flex-col rounded-[28px] sm:rounded-[32px] overflow-hidden bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl backdrop-saturate-150 border border-white/85 dark:border-white/15 shadow-[0_32px_96px_-16px_rgba(15,23,42,0.34),0_0_0_1px_rgba(255,255,255,0.5)_inset,0_1px_0_rgba(255,255,255,0.95)_inset] dark:shadow-[0_32px_96px_-16px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.08)_inset,0_1px_0_rgba(255,255,255,0.18)_inset]"
      >
        {/* Top Specular Liquid Sheen */}
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/95 dark:via-white/40 to-transparent z-30" />
        {/* Diagonal Refractive Glass Gloss */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/45 via-white/5 to-orange-100/20 dark:from-white/[0.08] dark:via-transparent dark:to-orange-500/[0.06] z-0" />

        {/* Frosted Sticky Header */}
        <div className="relative z-10 shrink-0 px-5 sm:px-8 py-4 border-b border-white/60 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/12 dark:bg-orange-500/20 border border-orange-300/60 dark:border-orange-700/50 text-orange-700 dark:text-orange-300 text-[11px] font-bold">
              <Sparkles className="w-3 h-3" />
              <span>{badgeText}</span>
            </div>
            <h2
              id={titleId}
              className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight"
            >
              {title}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300/90">
              {subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close popup"
            className="w-9 h-9 rounded-full bg-white/75 dark:bg-slate-800/75 hover:bg-white dark:hover:bg-slate-800 border border-white/85 dark:border-white/15 text-slate-600 dark:text-slate-300 shadow-sm flex items-center justify-center shrink-0 transition hover:scale-105 active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain px-4 sm:px-8 py-5 sm:py-6">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}
