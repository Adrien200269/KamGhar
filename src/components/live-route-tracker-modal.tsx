"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MapPin,
  Navigation,
  Phone,
  MessageCircle,
  ShieldCheck,
  Award,
  Clock,
  Compass,
  Radio,
  ExternalLink,
  RotateCw,
} from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Map, Marker } from "maplibre-gl";
import { calculateHaversineDistanceKm, formatDistance } from "@/lib/geo";
import { useLanguage } from "./language-provider";
import { getWorkerTier } from "@/lib/constants";

interface LiveRouteTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  jobAddress: string;
  jobCoords: { lat: number; lng: number };
  worker: {
    id: string;
    name: string;
    phone?: string | null;
    photoUrl?: string | null;
    coords?: { lat: number; lng: number } | null;
    isVerified?: boolean;
    rating?: number;
    completedJobs?: number;
  };
  onOpenChat?: () => void;
}

export default function LiveRouteTrackerModal({
  isOpen,
  onClose,
  jobTitle,
  jobAddress,
  jobCoords,
  worker,
  onOpenChat,
}: LiveRouteTrackerModalProps) {
  const { lang, t } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const workerMarkerRef = useRef<Marker | null>(null);

  // If worker doesn't have exact coordinates, place them nearby (~1.8km offset) for demonstration
  const [workerPos, setWorkerPos] = useState<{ lat: number; lng: number }>(() => {
    if (worker.coords && worker.coords.lat && worker.coords.lng) {
      return worker.coords;
    }
    return {
      lat: jobCoords.lat + 0.012,
      lng: jobCoords.lng - 0.015,
    };
  });

  const [simulatedProgress, setSimulatedProgress] = useState(0); // 0 to 1
  const [lastPingTime, setLastPingTime] = useState<Date>(new Date());

  // Haversine distance
  const currentDistanceKm = calculateHaversineDistanceKm(
    workerPos.lat,
    workerPos.lng,
    jobCoords.lat,
    jobCoords.lng
  );

  // Average Kathmandu valley two-wheeler speed: ~20 km/h (plus base 3 min traffic factor)
  const etaMinutes = Math.max(3, Math.round((currentDistanceKm / 20) * 60) + 2);

  const tier = getWorkerTier(worker.completedJobs || 0, worker.rating || 5.0);

  // Clean WhatsApp number
  const rawPhone = worker.phone?.replace(/[^0-9]/g, "") || "";
  const whatsAppPhone = rawPhone.startsWith("977")
    ? rawPhone
    : rawPhone.length === 10
    ? `977${rawPhone}`
    : "";

  const whatsAppMessage = encodeURIComponent(
    `Namaste ${worker.name}! I am tracking your arrival for '${jobTitle}' on KamGhar. See you soon at ${jobAddress}.`
  );

  // Simulate movement closer to the job site
  const handleSimulateMovement = () => {
    const nextProg = Math.min(0.9, simulatedProgress + 0.2);
    setSimulatedProgress(nextProg);

    const targetLat = jobCoords.lat;
    const targetLng = jobCoords.lng;
    const baseLat = (worker.coords?.lat || jobCoords.lat + 0.012);
    const baseLng = (worker.coords?.lng || jobCoords.lng - 0.015);

    const newLat = baseLat + (targetLat - baseLat) * nextProg;
    const newLng = baseLng + (targetLng - baseLng) * nextProg;

    setWorkerPos({ lat: newLat, lng: newLng });
    setLastPingTime(new Date());

    if (workerMarkerRef.current) {
      workerMarkerRef.current.setLngLat([newLng, newLat]);
    }
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [newLng, newLat], zoom: 15, duration: 1200 });
    }
  };

  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    let isMounted = true;

    import("maplibre-gl").then((ml) => {
      if (!isMounted || !mapContainerRef.current) return;

      const maplibregl = ml;

      // Clean up previous map instance if any
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = new maplibregl.Map({
        container: mapContainerRef.current!,
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: [
                "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
                "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
                "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
              ],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors",
              maxzoom: 19,
            },
          },
          layers: [
            {
              id: "osm-tiles",
              type: "raster",
              source: "osm",
              minzoom: 0,
              maxzoom: 19,
            },
          ],
        },
        center: [
          (workerPos.lng + jobCoords.lng) / 2,
          (workerPos.lat + jobCoords.lat) / 2,
        ],
        zoom: 13.5,
      });

      map.addControl(new maplibregl.NavigationControl(), "top-right");

      // Destination / Job marker
      const destEl = document.createElement("div");
      destEl.className = "flex flex-col items-center";
      destEl.innerHTML = `
        <div style="background-color: #ea580c; color: white; padding: 6px; border-radius: 9999px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); border: 2px solid white;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
        </div>
        <div style="background: rgba(15,23,42,0.85); color: white; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; margin-top: 2px; white-space: nowrap;">
          Job Site
        </div>
      `;

      new maplibregl.Marker({ element: destEl })
        .setLngLat([jobCoords.lng, jobCoords.lat])
        .addTo(map);

      // Worker marker with pulsing indicator
      const workerEl = document.createElement("div");
      workerEl.className = "flex flex-col items-center";
      workerEl.innerHTML = `
        <div style="position: relative;">
          <div style="position: absolute; inset: -4px; background-color: #22c55e; border-radius: 9999px; opacity: 0.75; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; background-color: #15803d; color: white; padding: 7px; border-radius: 9999px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); border: 2px solid white;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
          </div>
        </div>
        <div style="background: rgba(21,128,61,0.9); color: white; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; margin-top: 4px; white-space: nowrap;">
          ${worker.name} (Live)
        </div>
      `;

      const marker = new maplibregl.Marker({ element: workerEl })
        .setLngLat([workerPos.lng, workerPos.lat])
        .addTo(map);

      workerMarkerRef.current = marker;
      mapRef.current = map;
    });

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isOpen, jobCoords.lat, jobCoords.lng]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>{lang === "ne" ? "प्रत्यक्ष आगमन ट्र्याकिङ" : "Live Route & Arrival Tracking"}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs sm:max-w-md">
                  {jobTitle} • {jobAddress}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Map Section */}
          <div className="relative w-full h-64 sm:h-72 bg-slate-100 dark:bg-slate-950">
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Floating Live Badge */}
            <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-md text-white px-3 py-1.5 rounded-xl shadow-lg border border-slate-700/60 flex items-center gap-2 text-xs">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="font-bold">
                {lang === "ne" ? "सक्रिय जीपीएस ट्र्याकिङ" : "Active Live GPS"}
              </span>
              <span className="text-[10px] text-slate-400">
                ({lastPingTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
              </span>
            </div>

            {/* Refresh / Simulate GPS button */}
            <button
              onClick={handleSimulateMovement}
              type="button"
              className="absolute bottom-3 right-3 bg-white/90 dark:bg-slate-900/90 hover:bg-white text-slate-800 dark:text-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Update live GPS coordinates"
            >
              <RotateCw className="w-3.5 h-3.5 text-orange-500" />
              <span>{lang === "ne" ? "स्थान रिफ्रेस" : "Refresh GPS"}</span>
            </button>
          </div>

          {/* Details & Live ETA Cards */}
          <div className="p-5 space-y-4 overflow-y-auto">
            {/* ETA & Distance Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-orange-50/80 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-800/60">
                <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 text-xs font-bold">
                  <Clock className="w-4 h-4" />
                  <span>{lang === "ne" ? "अनुमानित समय" : "Est. Arrival Time"}</span>
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-orange-700 dark:text-orange-300">
                    ~{etaMinutes}
                  </span>
                  <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                    {lang === "ne" ? "मिनेट" : "minutes"}
                  </span>
                </div>
                <p className="text-[10px] text-orange-700/70 dark:text-orange-300/70 mt-0.5">
                  {lang === "ne" ? "काठमाडौँ ट्राफिक अनुसार" : "Based on local Kathmandu traffic"}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  <Compass className="w-4 h-4" />
                  <span>{lang === "ne" ? "दूरी" : "Live Distance"}</span>
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                    {currentDistanceKm.toFixed(1)}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    km
                  </span>
                </div>
                <p className="text-[10px] text-emerald-700/70 dark:text-emerald-300/70 mt-0.5">
                  {formatDistance(currentDistanceKm)}
                </p>
              </div>
            </div>

            {/* Worker Details Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {worker.photoUrl ? (
                  <img
                    src={worker.photoUrl}
                    alt={worker.name}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-orange-200 dark:border-orange-800 shadow-xs"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 text-white font-extrabold text-lg flex items-center justify-center shadow-xs">
                    {worker.name[0]?.toUpperCase()}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {worker.name}
                    </span>

                    {/* Tier badge */}
                    <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${tier.badgeClass}`}>
                      <Award className={`w-3 h-3 ${tier.iconColor}`} />
                      <span>{lang === "ne" ? tier.labelNe : tier.label}</span>
                    </span>

                    {/* Verified badge */}
                    {worker.isVerified && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        <span>{lang === "ne" ? "प्रमाणित" : "Verified"}</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {worker.phone || "Contact via in-app chat"}
                  </p>
                </div>
              </div>

              {/* Direct Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-700">
                {worker.phone && (
                  <a
                    href={`tel:${worker.phone}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{lang === "ne" ? "कल" : "Call"}</span>
                  </a>
                )}

                {whatsAppPhone && (
                  <a
                    href={`https://wa.me/${whatsAppPhone}?text=${whatsAppMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                  >
                    <span>WhatsApp</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                {onOpenChat && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenChat();
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{lang === "ne" ? "च्याट" : "Chat"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
