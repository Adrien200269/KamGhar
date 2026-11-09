"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import {
  MapPin,
  Crosshair,
  Zap,
  Star,
  ArrowRight,
  Flame,
  CheckCircle2,
  Clock,
  Layers,
  Phone,
  Navigation,
  X,
} from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Map, Marker } from "maplibre-gl";
import { calculateHaversineDistanceKm, formatDistance, DEFAULT_MAP_CENTER } from "@/lib/geo";
import { useLanguage } from "./language-provider";

export type MapDiscoveryItem = {
  id: string;
  type: "JOB" | "WORKER";
  title: string;
  subtitle?: string;
  category?: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  price?: string | number | null;
  badge?: string;
  rating?: number;
  isUrgent?: boolean;
  isAvailableNow?: boolean;
  isFeatured?: boolean;
  photoUrl?: string | null;
  rawItem?: any;
};

interface InteractiveMapViewProps {
  items: MapDiscoveryItem[];
  userLocation?: { lat: number; lng: number } | null;
  onSelectItem?: (item: MapDiscoveryItem) => void;
  onLocateMe?: () => void;
  isLocating?: boolean;
  heightClass?: string;
  initialZoom?: number;
}

export default function InteractiveMapView({
  items,
  userLocation,
  onSelectItem,
  onLocateMe,
  isLocating = false,
  heightClass = "h-[560px]",
  initialZoom = 12,
}: InteractiveMapViewProps) {
  const { lang, tx } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const userMarkerRef = useRef<Marker | null>(null);

  const [selectedItem, setSelectedItem] = useState<MapDiscoveryItem | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Filter items with valid coordinates
  const validItems = useMemo(
    () => items.filter((it) => typeof it.latitude === "number" && typeof it.longitude === "number"),
    [items]
  );

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let isSubscribed = true;

    import("maplibre-gl").then((ml) => {
      if (!isSubscribed || !mapContainerRef.current) return;
      const maplibregl = ml;

      const center = userLocation
        ? [userLocation.lng, userLocation.lat]
        : validItems.length > 0
        ? [validItems[0].longitude, validItems[0].latitude]
        : [DEFAULT_MAP_CENTER.lng, DEFAULT_MAP_CENTER.lat];

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
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
              attribution: "&copy; OpenStreetMap contributors",
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
        center: center as [number, number],
        zoom: initialZoom,
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

      map.on("load", () => {
        if (!isSubscribed) return;
        mapRef.current = map;
        setMapLoaded(true);
      });
    });

    return () => {
      isSubscribed = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update User Location Marker
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    import("maplibre-gl").then((ml) => {
      const maplibregl = ml;

      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }

      if (userLocation) {
        const el = document.createElement("div");
        el.className = "relative flex items-center justify-center cursor-pointer";
        el.innerHTML = `
          <div class="absolute w-8 h-8 rounded-full bg-blue-500/25 animate-ping"></div>
          <div class="relative w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center">
            <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>
        `;

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([userLocation.lng, userLocation.lat])
          .addTo(mapRef.current!);

        userMarkerRef.current = marker;
      }
    });
  }, [userLocation, mapLoaded]);

  // Render & Update Markers for Items
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    import("maplibre-gl").then((ml) => {
      const maplibregl = ml;

      // Clear existing markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      validItems.forEach((item) => {
        const isJob = item.type === "JOB";
        const el = document.createElement("div");
        el.className =
          "group relative cursor-pointer transform transition-transform hover:scale-110 active:scale-95 duration-200";

        if (isJob) {
          const bgCol = item.isUrgent
            ? "bg-red-500 border-red-600 text-white"
            : item.isFeatured
            ? "bg-amber-500 border-amber-600 text-white"
            : "bg-orange-500 border-orange-600 text-white";

          el.innerHTML = `
            <div class="relative flex items-center justify-center">
              ${
                item.isUrgent
                  ? `<span class="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>`
                  : ""
              }
              <div class="px-2 py-1 rounded-full ${bgCol} border-2 shadow-md flex items-center gap-1 text-[11px] font-bold">
                ${item.isUrgent ? "🔥" : "💼"}
                <span>${item.price ? `Rs ${item.price}` : item.category?.slice(0, 10) || "Job"}</span>
              </div>
              <div class="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-orange-600 mx-auto -mt-0.5"></div>
            </div>
          `;
        } else {
          // Worker Marker
          const borderColor = item.isAvailableNow
            ? "border-emerald-500"
            : item.isFeatured
            ? "border-amber-500"
            : "border-orange-500";

          el.innerHTML = `
            <div class="relative flex flex-col items-center">
              <div class="relative w-8 h-8 rounded-full border-2 ${borderColor} bg-white dark:bg-slate-900 shadow-lg overflow-hidden flex items-center justify-center text-[11px] font-bold text-slate-800 dark:text-slate-100">
                ${
                  item.photoUrl
                    ? `<img src="${item.photoUrl}" class="w-full h-full object-cover" alt="" />`
                    : `<span>${item.title.slice(0, 2).toUpperCase()}</span>`
                }
              </div>
              ${
                item.isAvailableNow
                  ? `<div class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white"></div>`
                  : ""
              }
              <div class="px-1.5 py-0.5 bg-slate-900 text-white rounded text-[9px] font-semibold mt-0.5 shadow-sm max-w-[80px] truncate">
                ${item.title.split(" ")[0]}
              </div>
            </div>
          `;
        }

        el.addEventListener("click", () => {
          setSelectedItem(item);
          if (mapRef.current) {
            mapRef.current.easeTo({
              center: [item.longitude, item.latitude],
              zoom: Math.max(mapRef.current.getZoom(), 13),
              duration: 500,
            });
          }
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([item.longitude, item.latitude])
          .addTo(mapRef.current!);

        markersRef.current.push(marker);
      });

      // Fit bounds if multiple items and no specific center forced
      if (validItems.length > 1 && !selectedItem) {
        const bounds = new maplibregl.LngLatBounds();
        validItems.forEach((it) => bounds.extend([it.longitude, it.latitude]));
        if (userLocation) {
          bounds.extend([userLocation.lng, userLocation.lat]);
        }
        mapRef.current?.fitBounds(bounds, { padding: 50, maxZoom: 14 });
      }
    });
  }, [validItems, mapLoaded]);

  // Center on user position
  const handleRecenter = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 13.5,
        duration: 1000,
      });
    } else if (onLocateMe) {
      onLocateMe();
    }
  };

  const selectedDistance = useMemo(() => {
    if (!selectedItem || !userLocation) return null;
    return calculateHaversineDistanceKm(
      userLocation.lat,
      userLocation.lng,
      selectedItem.latitude,
      selectedItem.longitude
    );
  }, [selectedItem, userLocation]);

  return (
    <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner bg-slate-100 dark:bg-slate-900`}>
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Map Controls */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <button
          type="button"
          onClick={handleRecenter}
          disabled={isLocating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 shadow-md text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-orange-50 dark:hover:bg-slate-800 transition active:scale-95 disabled:opacity-60"
        >
          <Crosshair className={`w-3.5 h-3.5 text-orange-600 ${isLocating ? "animate-spin" : ""}`} />
          <span>{userLocation ? tx("Center on Me", "मेरो स्थानमा जानुहोस्") : tx("Find My Location", "मेरो स्थान पत्ता लगाउनुहोस्")}</span>
        </button>

        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/70 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300">
          <Layers className="w-3 h-3 text-slate-400" />
          <span>{validItems.length} {validItems.length === 1 ? "pin" : "pins"} on map</span>
        </span>
      </div>

      {/* Selected Item Drawer / Card Overlay */}
      {selectedItem && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md z-20 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-2.5 right-2.5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Close card"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3">
              {selectedItem.type === "WORKER" ? (
                <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800/60 flex items-center justify-center font-bold text-orange-700 dark:text-orange-300 overflow-hidden shrink-0">
                  {selectedItem.photoUrl ? (
                    <img src={selectedItem.photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    selectedItem.title.slice(0, 2).toUpperCase()
                  )}
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                  {selectedItem.isUrgent ? <Flame className="w-6 h-6 animate-pulse" /> : <MapPin className="w-6 h-6" />}
                </div>
              )}

              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {selectedItem.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border border-orange-200/60 dark:border-orange-900">
                      {selectedItem.badge}
                    </span>
                  )}
                  {selectedItem.isAvailableNow && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Available Now
                    </span>
                  )}
                  {selectedItem.rating && (
                    <span className="text-[11px] font-bold text-amber-500 flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-current" />
                      {selectedItem.rating.toFixed(1)}
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate mt-1">
                  {selectedItem.title}
                </h4>

                <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-orange-500 shrink-0" />
                  <span className="truncate">{selectedItem.address || "Nepal"}</span>
                </p>

                {selectedDistance !== null && (
                  <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5">
                    <Navigation className="w-3 h-3 shrink-0" />
                    <span>{formatDistance(selectedDistance)}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  {selectedItem.type === "WORKER" ? tx("Hourly Rate", "प्रति घण्टा दर") : tx("Budget", "बजेट")}
                </span>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {selectedItem.price ? `Rs. ${selectedItem.price.toLocaleString()}` : tx("Negotiable", "सहमति अनुसार")}
                </p>
              </div>

              {onSelectItem && (
                <button
                  type="button"
                  onClick={() => onSelectItem(selectedItem)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md hover:shadow-orange-500/25 active:scale-95 transition"
                >
                  <span>{selectedItem.type === "WORKER" ? tx("View & Hire", "विवरण र काम दिनुहोस्") : tx("View & Apply", "हेर्नुहोस् र आवेदन दिनुहोस्")}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
