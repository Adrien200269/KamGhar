"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react";
import {
  recordAdClick,
  recordAdImpression,
  type PublicAdItem,
} from "@/app/actions/ads";

function AdLinkWrapper({
  ad,
  children,
  className,
}: {
  ad: PublicAdItem;
  children: React.ReactNode;
  className: string;
}) {
  const handleClick = () => {
    void recordAdClick(ad.id);
  };

  if (ad.targetUrl.startsWith("/")) {
    return (
      <Link href={ad.targetUrl} onClick={handleClick} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={ad.targetUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  );
}

/**
 * Pure clickable banner ad (Hamrobazar-style: image only, zero extra text overlays).
 * Falls back to a minimal text card only if no imageUrl is provided.
 */
export function SponsoredAdCard({
  ad,
  layout = "grid",
  previewOnly = false,
}: {
  ad: PublicAdItem;
  layout?: "wide" | "grid" | "dashboard";
  previewOnly?: boolean;
}) {
  if (ad.imageUrl) {
    const heightClass =
      layout === "dashboard"
        ? "h-[160px] sm:h-[210px] lg:h-[230px]"
        : "h-[175px] sm:h-[230px] lg:h-[270px]";

    const innerImage = (
      <div
        className={`relative w-full ${heightClass} overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm group`}
      >
        <img
          src={ad.imageUrl}
          alt={ad.title}
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.01]"
        />
      </div>
    );

    if (previewOnly) {
      return innerImage;
    }

    return (
      <AdLinkWrapper ad={ad} className="block w-full cursor-pointer">
        {innerImage}
      </AdLinkWrapper>
    );
  }

  // Fallback for text-only ads when no banner image was uploaded
  const fallbackCard = (
    <div className="group rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm hover:border-orange-300 dark:hover:border-orange-700 transition-all flex items-center justify-between gap-4">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
          {ad.title}
        </p>
        {ad.description && (
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
            {ad.description}
          </p>
        )}
      </div>
      <span className="shrink-0 inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold">
        <span>{ad.ctaLabel || "Open"}</span>
        <ArrowUpRight className="w-3.5 h-3.5" />
      </span>
    </div>
  );

  if (previewOnly) {
    return fallbackCard;
  }

  return (
    <AdLinkWrapper ad={ad} className="block w-full cursor-pointer">
      {fallbackCard}
    </AdLinkWrapper>
  );
}

/**
 * Hamrobazar-inspired Banner Ad Carousel:
 * - Pure clickable banner with zero extra text around it
 * - Auto-rotates when multiple ads are active, with bottom-right dots, pause/play, and arrows
 */
export default function SponsoredAdsSection({
  ads,
  variant,
}: {
  ads: PublicAdItem[];
  variant: "landing" | "dashboard";
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const trackedRef = useRef<Set<string>>(new Set());

  const safeIndex = ads.length > 0 ? activeIndex % ads.length : 0;
  const activeAd = ads[safeIndex];

  useEffect(() => {
    if (!activeAd) return;
    if (!trackedRef.current.has(activeAd.id)) {
      trackedRef.current.add(activeAd.id);
      void recordAdImpression(activeAd.id);
    }
  }, [activeAd]);

  useEffect(() => {
    if (ads.length <= 1 || isPaused) return;
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % ads.length);
    }, 4500);
    return () => clearInterval(id);
  }, [ads.length, isPaused]);

  if (!ads || ads.length === 0 || !activeAd) {
    return null;
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + ads.length) % ads.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % ads.length);
  };

  return (
    <div
      className={variant === "landing" ? "pt-3 pb-4" : ""}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative rounded-2xl overflow-hidden">
        <SponsoredAdCard
          ad={activeAd}
          layout={variant === "dashboard" ? "dashboard" : "wide"}
        />

        {/* Hamrobazar-style bottom-right carousel controls (only when 2+ ads) */}
        {ads.length > 1 && (
          <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1.5">
            {/* Pagination dots */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-950/55 backdrop-blur-md">
              {ads.map((ad, idx) => (
                <button
                  key={ad.id}
                  type="button"
                  aria-label={`Go to ad ${idx + 1}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveIndex(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === safeIndex
                      ? "w-5 bg-white"
                      : "w-1.5 bg-white/50 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>

            {/* Play / Pause */}
            <button
              type="button"
              aria-label={isPaused ? "Play ad rotation" : "Pause ad rotation"}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsPaused((p) => !p);
              }}
              className="w-7 h-7 rounded-full bg-slate-950/55 hover:bg-slate-950/75 backdrop-blur-md text-white flex items-center justify-center transition cursor-pointer"
            >
              {isPaused ? (
                <Play className="w-3.5 h-3.5 fill-white" />
              ) : (
                <Pause className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Prev / Next arrows */}
            <button
              type="button"
              aria-label="Previous ad"
              onClick={handlePrev}
              className="w-7 h-7 rounded-full bg-slate-950/55 hover:bg-slate-950/75 backdrop-blur-md text-white flex items-center justify-center transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              aria-label="Next ad"
              onClick={handleNext}
              className="w-7 h-7 rounded-full bg-slate-950/55 hover:bg-slate-950/75 backdrop-blur-md text-white flex items-center justify-center transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
