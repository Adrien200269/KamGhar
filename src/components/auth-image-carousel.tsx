"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const CAROUSEL_IMAGES = [
  {
    src: "/worker-electrician.jpg",
    alt: "Electrician at work",
  },
  {
    src: "/worker-plumber.jpg",
    alt: "Plumber working on fixtures",
  },
  {
    src: "/worker-mechanic.webp",
    alt: "Automotive mechanic at work",
  },
  {
    src: "/worker-cleaner.webp",
    alt: "Professional cleaner",
  },
  {
    src: "/worker-digital.webp",
    alt: "Digital freelancer at work",
  },
];

interface AuthImageCarouselProps {
  /** "desktop" for full-height side panel, "mobile" for compact hero banner */
  variant?: "desktop" | "mobile";
  /** Slide duration in seconds (default: 4) */
  intervalSeconds?: number;
  className?: string;
}

export default function AuthImageCarousel({
  variant = "desktop",
  intervalSeconds = 4,
  className = "",
}: AuthImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, intervalSeconds * 1000);

    return () => clearInterval(timer);
  }, [intervalSeconds]);

  const currentImage = CAROUSEL_IMAGES[currentIndex];

  if (variant === "mobile") {
    return (
      <div
        className={`relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden shadow-md border border-slate-200/80 dark:border-slate-800 bg-slate-900 ${className}`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImage.src}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={currentImage.src}
              alt={currentImage.alt}
              fill
              className="object-cover object-center"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {/* Soft decorative gradient vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/20" />
          </motion.div>
        </AnimatePresence>

        {/* Minimal dot indicators */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center items-center gap-1.5 z-10">
          {CAROUSEL_IMAGES.map((img, idx) => (
            <button
              key={img.src}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIndex
                  ? "w-6 bg-white shadow-sm"
                  : "w-1.5 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  // Desktop variant (full split screen side panel)
  return (
    <div className={`relative w-full h-full bg-slate-950 overflow-hidden ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentImage.src}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <Image
            src={currentImage.src}
            alt={currentImage.alt}
            fill
            className="object-cover object-center opacity-85"
            priority
            sizes="50vw"
          />

          {/* Sophisticated dual-gradient overlays for cinematic contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-slate-950/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 via-transparent to-slate-950/30" />
        </motion.div>
      </AnimatePresence>

      {/* Elegant bottom navigation dots */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-2 z-20">
        {CAROUSEL_IMAGES.map((img, idx) => (
          <button
            key={img.src}
            type="button"
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`h-2 rounded-full transition-all duration-400 cursor-pointer ${
              idx === currentIndex
                ? "w-8 bg-white shadow-lg shadow-white/20"
                : "w-2 bg-white/40 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
