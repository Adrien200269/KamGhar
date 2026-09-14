"use client";

import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Map, Marker, Popup } from "maplibre-gl";

interface MapPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number, address?: string) => void;
}

export default function MapPicker({ lat, lng, onChange }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);

  // Reverse-geocode via Nominatim (free, no API key)
  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      return (data?.display_name as string | undefined) ?? undefined;
    } catch {
      return undefined;
    }
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Dynamic import keeps MapLibre out of the server bundle
    import("maplibre-gl").then((ml) => {
      const maplibregl = ml;

      const map = new maplibregl.Map({
        container: containerRef.current!,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: [lng, lat],
        zoom: 15,
      });

      map.addControl(new maplibregl.NavigationControl(), "top-right");

      const popup: Popup = new maplibregl.Popup({ offset: 30, closeButton: false }).setHTML(
        "<span style='font-size:12px;font-weight:600'>Drag or click to set location</span>"
      );

      const marker: Marker = new maplibregl.Marker({ color: "#ea580c", draggable: true })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);

      popup.addTo(map);

      const updateLocation = async (lngLat: { lat: number; lng: number }) => {
        marker.setLngLat([lngLat.lng, lngLat.lat]);
        const addr = await reverseGeocode(lngLat.lat, lngLat.lng);
        onChange(lngLat.lat, lngLat.lng, addr);
        if (addr) {
          popup
            .setHTML(
              `<span style='font-size:11px;font-weight:600;max-width:220px;display:block'>${addr.split(",").slice(0, 3).join(", ")}</span>`
            )
            .addTo(map);
        }
      };

      marker.on("dragend", () => {
        const lngLat = marker.getLngLat();
        updateLocation({ lat: lngLat.lat, lng: lngLat.lng });
      });

      map.on("click", (e: { lngLat: { lat: number; lng: number } }) => {
        updateLocation(e.lngLat);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fly to new coords when parent updates them (GPS / district change)
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    mapRef.current.flyTo({ center: [lng, lat], zoom: 15, duration: 1000 });
    markerRef.current.setLngLat([lng, lat]);
  }, [lat, lng]);

  return (
    <div
      ref={containerRef}
      className="w-full h-72 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner"
      style={{ position: "relative" }}
    />
  );
}
