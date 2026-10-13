"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ClickRipple {
  id: number;
  x: number;
  y: number;
}

export default function MacCursor() {
  const [ripples, setRipples] = useState<ClickRipple[]>([]);
  const [isShaking, setIsShaking] = useState(false);
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const shakeHistory = useRef<{ x: number; time: number; dir: number }[]>([]);
  const shakeTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Detect touch-only screens (mobile/tablets) to not run unnecessary desktop cursor effects
    if (window.matchMedia("(pointer: coarse)").matches) {
      setIsTouchDevice(true);
      return;
    }

    let nextRippleId = 0;

    const handlePointerDown = (e: MouseEvent) => {
      // Create subtle Apple macOS-style click ripple
      const newRipple = {
        id: nextRippleId++,
        x: e.clientX,
        y: e.clientY,
      };
      setRipples((prev) => [...prev.slice(-4), newRipple]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 450);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      const currentX = e.clientX;
      setMousePos({ x: e.clientX, y: e.clientY });

      // macOS "Shake mouse pointer to locate" detector
      const history = shakeHistory.current;
      if (history.length > 0) {
        const last = history[history.length - 1];
        const dt = now - last.time;
        if (dt > 16) {
          const dx = currentX - last.x;
          const dir = dx > 0 ? 1 : dx < 0 ? -1 : 0;
          if (dir !== 0 && dir !== last.dir) {
            history.push({ x: currentX, time: now, dir });
          }
        }
      } else {
        history.push({ x: currentX, time: now, dir: 0 });
      }

      // Keep only last 350ms of movements
      shakeHistory.current = history.filter((h) => now - h.time < 350);

      // If user reversed direction rapidly 4+ times in 350ms, trigger signature macOS cursor zoom!
      if (shakeHistory.current.length >= 5) {
        setIsShaking(true);
        if (shakeTimeout.current) clearTimeout(shakeTimeout.current);
        shakeTimeout.current = setTimeout(() => {
          setIsShaking(false);
          shakeHistory.current = [];
        }, 550);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("mousemove", handleMouseMove);
      if (shakeTimeout.current) clearTimeout(shakeTimeout.current);
    };
  }, []);

  if (isTouchDevice) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden select-none">
      {/* ── 1. macOS Click Ripples ── */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            initial={{ scale: 0.2, opacity: 0.75 }}
            animate={{ scale: 1.8, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.42, ease: "easeOut" }}
            style={{
              position: "fixed",
              left: ripple.x - 16,
              top: ripple.y - 16,
              width: 32,
              height: 32,
            }}
            className="rounded-full border-2 border-orange-500/70 bg-orange-400/15 shadow-[0_0_12px_rgba(249,115,22,0.4)] pointer-events-none"
          />
        ))}
      </AnimatePresence>

      {/* ── 2. Iconic macOS "Shake to Locate" Cursor Magnifier ── */}
      <AnimatePresence>
        {isShaking && (
          <motion.div
            initial={{ scale: 1, opacity: 0 }}
            animate={{ scale: 2.6, opacity: 1 }}
            exit={{ scale: 1, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            style={{
              position: "fixed",
              left: mousePos.x - 10,
              top: mousePos.y - 7,
            }}
            className="pointer-events-none origin-top-left"
          >
            {/* High-res macOS arrow vector during shake */}
            <svg
              height="36"
              viewBox="0 0 32 32"
              width="36"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-2xl"
            >
              <defs>
                <filter id="mac-shake-shadow">
                  <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.5" />
                </filter>
              </defs>
              <g fill="none" fillRule="evenodd" transform="translate(10 7)" filter="url(#mac-shake-shadow)">
                <path
                  d="m6.148 18.473 1.863-1.003 1.615-.839-2.568-4.816h4.332l-11.379-11.408v16.015l3.316-3.221z"
                  fill="#ffffff"
                  stroke="#ffffff"
                  strokeWidth="1.2"
                />
                <path
                  d="m6.431 17 1.765-.941-2.775-5.202h3.604l-8.025-8.043v11.188l2.53-2.442z"
                  fill="#000000"
                />
              </g>
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
