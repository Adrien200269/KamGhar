"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowUpRight, Megaphone } from "lucide-react";
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

export function SponsoredAdCard({
  ad,
  layout = "grid",
  previewOnly = false,
}: {
  ad: PublicAdItem;
  layout?: "wide" | "grid" | "dashboard";
  previewOnly?: boolean;
}) {
  if (layout === "wide") {
    return (
      <div className="group relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-orange-200/80 dark:border-orange-900/50 shadow-sm hover:shadow-xl hover:border-orange-300 dark:hover:border-orange-700 transition-all">
        <div className="pointer-events-none absolute -right-12 -top-12 w-56 h-56 rounded-full bg-orange-400/10 blur-3xl" />

        <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
          {ad.imageUrl && (
            <div className="md:col-span-5 relative min-h-[200px] bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <img
                src={ad.imageUrl}
                alt={ad.title}
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
              />
              <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/75 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
                <Megaphone className="w-3 h-3 text-orange-400" />
                <span>{ad.badgeText || "Sponsored"}</span>
              </span>
            </div>
          )}

          <div
            className={`${
              ad.imageUrl ? "md:col-span-7" : "md:col-span-12"
            } p-6 sm:p-8 flex flex-col justify-between gap-5 relative z-10`}
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-extrabold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                  {ad.sponsorName}
                </span>
                {!ad.imageUrl && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800/60 text-orange-700 dark:text-orange-300 text-[10px] font-bold uppercase tracking-wider">
                    <Megaphone className="w-3 h-3" />
                    <span>{ad.badgeText || "Sponsored"}</span>
                  </span>
                )}
              </div>

              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug">
                {ad.title}
              </h3>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {ad.description}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              {previewOnly ? (
                <span className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20">
                  <span>{ad.ctaLabel || "Learn More"}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              ) : (
                <AdLinkWrapper
                  ad={ad}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-colors"
                >
                  <span>{ad.ctaLabel || "Learn More"}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </AdLinkWrapper>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (layout === "dashboard") {
    return (
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-orange-50/35 to-amber-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-orange-950/20 border border-orange-200/80 dark:border-orange-900/50 p-4 shadow-sm hover:shadow-md hover:border-orange-300 dark:hover:border-orange-700 transition-all flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        {ad.imageUrl && (
          <div className="w-full sm:w-28 h-32 sm:h-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/70 dark:border-slate-700">
            <img
              src={ad.imageUrl}
              alt={ad.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 border border-orange-200/80 dark:border-orange-800/60 text-[10px] font-extrabold uppercase tracking-wider">
              <Megaphone className="w-2.5 h-2.5" />
              <span>{ad.badgeText || "Sponsored"}</span>
            </span>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">
              {ad.sponsorName}
            </span>
          </div>

          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug line-clamp-1">
            {ad.title}
          </h4>

          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {ad.description}
          </p>
        </div>

        <div className="shrink-0 flex sm:flex-col justify-end">
          {previewOnly ? (
            <span className="inline-flex items-center justify-center gap-1 px-3.5 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold shadow-xs">
              <span>{ad.ctaLabel || "Learn More"}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          ) : (
            <AdLinkWrapper
              ad={ad}
              className="inline-flex items-center justify-center gap-1 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs transition-colors whitespace-nowrap"
            >
              <span>{ad.ctaLabel || "Learn More"}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </AdLinkWrapper>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="group flex flex-col justify-between overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-orange-300 dark:hover:border-orange-700 transition-all">
      <div>
        {ad.imageUrl && (
          <div className="relative h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <img
              src={ad.imageUrl}
              alt={ad.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-950/75 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
              <Megaphone className="w-2.5 h-2.5 text-orange-400" />
              <span>{ad.badgeText || "Sponsored"}</span>
            </span>
          </div>
        )}

        <div className="p-5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold text-orange-600 dark:text-orange-400 uppercase tracking-wider truncate">
              {ad.sponsorName}
            </span>
            {!ad.imageUrl && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800/60 text-orange-700 dark:text-orange-300 text-[10px] font-bold uppercase tracking-wider shrink-0">
                {ad.badgeText || "Sponsored"}
              </span>
            )}
          </div>

          <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug line-clamp-2">
            {ad.title}
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
            {ad.description}
          </p>
        </div>
      </div>

      <div className="px-5 pb-5 pt-1">
        {previewOnly ? (
          <span className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-orange-600 text-white text-xs font-bold shadow-sm">
            <span>{ad.ctaLabel || "Learn More"}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        ) : (
          <AdLinkWrapper
            ad={ad}
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-sm shadow-orange-500/20 transition-colors"
          >
            <span>{ad.ctaLabel || "Learn More"}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </AdLinkWrapper>
        )}
      </div>
    </div>
  );
}

export default function SponsoredAdsSection({
  ads,
  variant,
}: {
  ads: PublicAdItem[];
  variant: "landing" | "dashboard";
}) {
  const trackedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    ads.forEach((ad) => {
      if (!trackedRef.current.has(ad.id)) {
        trackedRef.current.add(ad.id);
        void recordAdImpression(ad.id);
      }
    });
  }, [ads]);

  if (!ads || ads.length === 0) {
    return null;
  }

  if (variant === "dashboard") {
    return (
      <div
        className={`grid gap-3 ${
          ads.length === 1 ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2"
        }`}
      >
        {ads.slice(0, 2).map((ad) => (
          <SponsoredAdCard key={ad.id} ad={ad} layout="dashboard" />
        ))}
      </div>
    );
  }

  return (
    <div className="pt-4 pb-2">
      <div
        className={`grid gap-3 ${
          ads.length === 1 ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
        }`}
      >
        {ads.slice(0, 2).map((ad) => (
          <SponsoredAdCard key={ad.id} ad={ad} layout="dashboard" />
        ))}
      </div>
    </div>
  );
}
