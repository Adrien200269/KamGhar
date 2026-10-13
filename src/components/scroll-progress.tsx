"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useScroll, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { ArrowUp, ChevronDown } from "lucide-react";

export default function ScrollProgress() {
  const [mounted, setMounted] = useState(false);
  const [percent, setPercent] = useState(0);
  const [isHoveringRail, setIsHoveringRail] = useState(false);
  const [hoverYPercent, setHoverYPercent] = useState<number | null>(null);

  const { scrollYProgress, scrollY } = useScroll();

  // Smooth physics spring for ultra-fluid motion
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 24,
    restDelta: 0.001,
  });

  // Track percentage for indicator
  useEffect(() => {
    setMounted(true);
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      setPercent(Math.round(latest * 100));
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  // Derived values for animations
  const progressHeight = useTransform(smoothProgress, (val) => `${val * 100}%`);
  const beadTop = useTransform(smoothProgress, (val) => `${Math.min(Math.max(val * 100, 0), 100)}%`);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  const handleRailClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const ratio = Math.min(Math.max(clickY / rect.height, 0), 1);
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({
      top: maxScroll * ratio,
      behavior: "smooth",
    });
  };

  const handleRailMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const ratio = Math.min(Math.max(clickY / rect.height, 0), 1);
    setHoverYPercent(Math.round(ratio * 100));
  };

  if (!mounted) return null;

  return (
    <>
      {/* ── 1. Vertical Right Edge Progress Rail ── */}
      <div
        className="fixed top-0 right-0 bottom-0 z-40 w-4 group cursor-pointer flex justify-end"
        onMouseEnter={() => setIsHoveringRail(true)}
        onMouseLeave={() => {
          setIsHoveringRail(false);
          setHoverYPercent(null);
        }}
        onMouseMove={handleRailMouseMove}
        onClick={handleRailClick}
        aria-label="Scroll rail navigator"
      >
        {/* Background track (subtle) */}
        <div className="h-full w-[3px] group-hover:w-[6px] transition-all duration-200 bg-slate-300/40 dark:bg-slate-700/40 backdrop-blur-xs relative overflow-visible">
          {/* Active animated progress fill */}
          <motion.div
            className="w-full bg-gradient-to-b from-amber-500 via-orange-500 to-rose-600 origin-top shadow-[0_0_8px_rgba(249,115,22,0.6)]"
            style={{ height: progressHeight }}
          />

          {/* Gliding luminous bead */}
          <motion.div
            className="absolute right-1/2 translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ top: beadTop }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 ring-2 ring-white dark:ring-slate-900 shadow-[0_0_10px_#ea580c] group-hover:scale-125 transition-transform" />
          </motion.div>

          {/* Hover scrubber tooltip */}
          {isHoveringRail && hoverYPercent !== null && (
            <div
              className="absolute right-5 -translate-y-1/2 pointer-events-none px-2 py-1 rounded-md text-[10px] font-bold bg-slate-900/90 dark:bg-slate-100/90 text-white dark:text-slate-900 shadow-md whitespace-nowrap backdrop-blur-xs flex items-center gap-1.5 transition-all"
              style={{ top: `${hoverYPercent}%` }}
            >
              <span>Jump to {hoverYPercent}%</span>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. Floating Right-Side Interactive Progress Capsule ── */}
      <AnimatePresence>
        {percent > 5 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7, x: 24 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.7, x: 24 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="fixed right-3 sm:right-6 bottom-6 sm:bottom-8 z-40 flex flex-col items-center gap-2"
          >
            {/* Quick scroll-to-top button with circular SVG progress ring */}
            <motion.button
              onClick={scrollToTop}
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.94 }}
              title={`Page scroll: ${percent}% (Click to return to top)`}
              className="group relative w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 shadow-lg shadow-orange-500/10 hover:shadow-orange-500/25 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-orange-600 dark:hover:text-orange-400 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              {/* Circular SVG progress ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 44 44">
                {/* Track background */}
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="text-slate-200/70 dark:text-slate-800/70"
                />
                {/* Animated active stroke */}
                <motion.circle
                  cx="22"
                  cy="22"
                  r="18"
                  fill="none"
                  stroke="url(#kamghar-scroll-grad)"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  style={{
                    pathLength: smoothProgress,
                  }}
                />
                <defs>
                  <linearGradient id="kamghar-scroll-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="50%" stopColor="#ea580c" />
                    <stop offset="100%" stopColor="#e11d48" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Icon / Percentage on hover */}
              <div className="relative flex items-center justify-center">
                <ArrowUp className="w-4 h-4 sm:w-4.5 sm:h-4.5 group-hover:-translate-y-0.5 transition-transform duration-200 text-orange-600 dark:text-orange-400" />
              </div>

              {/* Tooltip on hover */}
              <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900/90 dark:bg-slate-800/95 text-white shadow-lg shadow-black/20 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 whitespace-nowrap flex items-center gap-1.5 backdrop-blur-xs">
                <span>Top</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-orange-500 text-white font-mono font-bold">
                  {percent}%
                </span>
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
