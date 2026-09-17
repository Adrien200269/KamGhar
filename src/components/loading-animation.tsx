"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface LoadingAnimationProps {
  label?: string;
  fullscreen?: boolean;
}

export default function LoadingAnimation({
  label = "Loading KamGhar...",
  fullscreen = false,
}: LoadingAnimationProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Animated Radar Beacon & House Icon */}
      <div className="relative flex items-center justify-center w-24 h-24">
        {/* Pulsing Radar Rings */}
        <motion.div
          animate={{ scale: [1, 1.8, 2.2], opacity: [0.6, 0.2, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 rounded-full bg-orange-500/20 border border-orange-500/30 pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.5, 1.9], opacity: [0.8, 0.3, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
          className="absolute inset-0 rounded-full bg-orange-500/25 pointer-events-none"
        />

        {/* Center Logo Card with Breathing Animation */}
        <motion.div
          animate={{ scale: [1, 1.06, 1], y: [0, -3, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-10 w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 shadow-xl shadow-orange-500/15 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center overflow-hidden"
        >
          <Image
            src="/favicon.ico"
            alt="KamGhar Icon"
            width={40}
            height={40}
            className="w-10 h-10 object-contain"
            priority
          />
        </motion.div>
      </div>

      {/* Animated Shimmering Text */}
      <div className="flex flex-col items-center gap-1">
        <motion.p
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="text-sm font-bold text-slate-700 dark:text-slate-200 tracking-tight"
        >
          {label}
        </motion.p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
              className="w-1.5 h-1.5 rounded-full bg-orange-500"
            />
          ))}
        </div>
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        {content}
      </div>
    );
  }

  return <div className="py-12 flex items-center justify-center">{content}</div>;
}
