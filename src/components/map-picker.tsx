"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map, Marker } from "leaflet";

interface MapPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number, address?: string) => void;
}

export default function MapPicker({ lat, lng, onChange }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Dynamic import to keep SSR safe (this component is always loaded client-side)
    import("leaflet").then((L) => {
      // Fix broken default icon paths when bundled
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      marker.bindPopup("<b>Drag me to the exact location</b>").openPopup();

      // On drag-end: update coords + reverse-geocode address
      marker.on("dragend", async () => {
        const pos = marker.getLatLng();
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.lat}&lon=${pos.lng}&format=json`
          );
          const data = await res.json();
          const addr =
            data?.display_name ??
            `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`;
          onChange(pos.lat, pos.lng, addr);
          marker.bindPopup(`<b>${addr}</b>`).openPopup();
        } catch {
          onChange(pos.lat, pos.lng);
        }
      });

      // Also allow clicking on map to move marker
      map.on("click", async (e) => {
        marker.setLatLng(e.latlng);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${e.latlng.lat}&lon=${e.latlng.lng}&format=json`
          );
          const data = await res.json();
          const addr =
            data?.display_name ??
            `${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`;
          onChange(e.latlng.lat, e.latlng.lng, addr);
          marker.bindPopup(`<b>${addr}</b>`).openPopup();
        } catch {
          onChange(e.latlng.lat, e.latlng.lng);
        }
      });

      mapRef.current = map;
      markerRef.current = marker;
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When parent coords change (e.g., GPS detect, district change), fly map there
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    mapRef.current.flyTo([lat, lng], 15, { duration: 1 });
    markerRef.current.setLatLng([lat, lng]);
  }, [lat, lng]);

  return (
    <div
      ref={containerRef}
      className="w-full h-64 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner z-0"
      style={{ position: "relative" }}
    />
  );
}
