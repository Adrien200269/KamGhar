"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Check,
} from "lucide-react";
import {
  getApproximateBsDate,
  getBsMonthSpanLabel,
  formatExactClockTime,
  toNepaliDigits,
} from "@/lib/nepali-date";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getNextSaturday(from: Date): Date {
  const day = from.getDay(); // 0=Sun .. 6=Sat
  const offset = day === 6 ? 0 : 6 - day;
  return new Date(from.getFullYear(), from.getMonth(), from.getDate() + offset);
}

export interface ExactDateTimePickerProps {
  selectedDate: Date;
  hour24: number;
  minute: number;
  onChange: (date: Date, hour24: number, minute: number) => void;
  compact?: boolean;
  initialTab?: "calendar" | "clock";
  activeTab?: "calendar" | "clock";
  onTabChange?: (tab: "calendar" | "clock") => void;
  onDone?: () => void;
}

export default function ExactDateTimePicker({
  selectedDate,
  hour24,
  minute,
  onChange,
  compact = false,
  initialTab = "calendar",
  activeTab,
  onTabChange,
  onDone,
}: ExactDateTimePickerProps) {
  const [nowTick, setNowTick] = useState<Date | null>(null);
  const today = useMemo(() => startOfDay(nowTick ?? selectedDate), [nowTick, selectedDate]);

  const [viewYear, setViewYear] = useState(() => selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => selectedDate.getMonth());
  const [trackedSelectedTime, setTrackedSelectedTime] = useState(() => selectedDate.getTime());

  // Sync visible calendar month whenever selectedDate changes externally
  if (selectedDate.getTime() !== trackedSelectedTime) {
    setTrackedSelectedTime(selectedDate.getTime());
    setViewYear(selectedDate.getFullYear());
    setViewMonth(selectedDate.getMonth());
  }

  // Mobile / compact tab state (controlled if activeTab is provided)
  const [internalTab, setInternalTab] = useState<"calendar" | "clock">(initialTab);
  const currentTab = activeTab ?? internalTab;
  const setCurrentTab = (next: "calendar" | "clock") => {
    setInternalTab(next);
    onTabChange?.(next);
  };

  // Clock dial mode ("hour" vs "minute")
  const [clockMode, setClockMode] = useState<"hour" | "minute">("hour");

  // Local text draft state so typing 2-digit numbers in Hour/Minute never fights cursor
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const period: "AM" | "PM" = hour24 >= 12 ? "PM" : "AM";
  const [hourDraft, setHourDraft] = useState<string | null>(null);
  const [minDraft, setMinDraft] = useState<string | null>(null);

  const dialRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Sync real client "now" after mount via async callback (avoids SSR mismatch & cascading effect lint)
  useEffect(() => {
    const boot = setTimeout(() => {
      setNowTick(new Date());
    }, 0);
    const interval = setInterval(() => {
      setNowTick(new Date());
    }, 30_000);
    return () => {
      clearTimeout(boot);
      clearInterval(interval);
    };
  }, []);

  const isPrevMonthDisabled =
    viewYear < today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth <= today.getMonth());

  const handlePrevMonth = () => {
    if (isPrevMonthDisabled) return;
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDate = (day: number) => {
    const candidate = new Date(viewYear, viewMonth, day);
    if (candidate < today) return;
    onChange(candidate, hour24, minute);
  };

  const setPeriod = (nextPeriod: "AM" | "PM") => {
    if (nextPeriod === period) return;
    const nextHour24 = nextPeriod === "PM" ? (hour12 === 12 ? 12 : hour12 + 12) : hour12 === 12 ? 0 : hour12;
    onChange(selectedDate, nextHour24, minute);
  };

  const setHour12 = useCallback(
    (nextHour12: number) => {
      const normalized = ((nextHour12 - 1 + 12) % 12) + 1;
      const nextHour24 =
        period === "PM" ? (normalized === 12 ? 12 : normalized + 12) : normalized === 12 ? 0 : normalized;
      onChange(selectedDate, nextHour24, minute);
    },
    [minute, onChange, period, selectedDate]
  );

  const setMinuteValue = useCallback(
    (nextMin: number) => {
      const normalized = ((nextMin % 60) + 60) % 60;
      onChange(selectedDate, hour24, normalized);
    },
    [hour24, onChange, selectedDate]
  );

  // Pointer math for SVG analog clock face
  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const el = dialRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      // Angle clockwise from 12 o'clock in degrees [0, 360)
      let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      if (deg < 0) deg += 360;

      if (clockMode === "hour") {
        const h = Math.round(deg / 30) % 12;
        setHour12(h === 0 ? 12 : h);
      } else {
        const m = Math.round(deg / 6) % 60;
        setMinuteValue(m);
      }
    },
    [clockMode, setHour12, setMinuteValue]
  );

  const handleDialPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDraggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromPointer(e.clientX, e.clientY);
  };

  const handleDialPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    updateFromPointer(e.clientX, e.clientY);
  };

  const handleDialPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    // Smooth flow: pick hour -> automatically advance to minute
    if (clockMode === "hour") {
      setClockMode("minute");
    }
  };

  const commitHourDraft = (raw: string) => {
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 12) {
      setHour12(parsed);
    }
    setHourDraft(null);
  };

  const commitMinDraft = (raw: string) => {
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 59) {
      setMinuteValue(parsed);
    }
    setMinDraft(null);
  };

  const handleQuickInOneHour = () => {
    const base = nowTick ?? new Date();
    const target = new Date(base.getTime() + 60 * 60 * 1000);
    const targetDay = startOfDay(target);
    onChange(targetDay, target.getHours(), target.getMinutes());
  };

  const handleSetTomorrowSameTime = () => {
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    onChange(tomorrow, hour24, minute);
  };

  // Build calendar cells
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const bsMonthSpan = getBsMonthSpanLabel(viewYear, viewMonth, "ne");
  const selectedBs = getApproximateBsDate(selectedDate);

  const selectedDateTime = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
    hour24,
    minute
  );
  const isSelectedTimeInPast =
    nowTick !== null &&
    isSameCalendarDay(selectedDate, today) &&
    selectedDateTime.getTime() <= nowTick.getTime();

  // Analog hand angle & tip coordinates (dial box 184x184, center 92,92)
  const handAngleDeg = clockMode === "hour" ? (hour12 % 12) * 30 : minute * 6;
  const handRad = ((handAngleDeg - 90) * Math.PI) / 180;
  const isInterMinute = clockMode === "minute" && minute % 5 !== 0;
  const handRadius = isInterMinute ? 75 : 60;
  const tipX = 92 + handRadius * Math.cos(handRad);
  const tipY = 92 + handRadius * Math.sin(handRad);

  const showCalendarPane = compact ? currentTab === "calendar" : true;
  const showClockPane = compact ? currentTab === "clock" : true;

  return (
    <div className="rounded-2xl border border-orange-200/80 dark:border-orange-900/50 bg-slate-50/90 dark:bg-slate-800/50 p-3.5 sm:p-4 space-y-3.5 shadow-inner">
      {/* Compact Mode Tab Switcher */}
      {compact && (
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-900/80">
          <button
            type="button"
            onClick={() => setCurrentTab("calendar")}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              currentTab === "calendar"
                ? "bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Calendar Date</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab("clock")}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              currentTab === "clock"
                ? "bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Exact Clock</span>
          </button>
        </div>
      )}

      {/* Main Grid: Calendar (left) + Analog/Digital Clock (right) */}
      <div className={compact ? "space-y-3" : "grid grid-cols-1 md:grid-cols-2 gap-4 items-start"}>
        {/* ── 1. INTERACTIVE CALENDAR ── */}
        {showCalendarPane && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-3 space-y-2.5 shadow-xs">
            {/* Month Header */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                disabled={isPrevMonthDisabled}
                aria-label="Previous month"
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="text-center">
                <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </div>
                <div className="text-[10px] font-semibold text-orange-600 dark:text-orange-400">
                  {bsMonthSpan}
                </div>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Next month"
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Date Shortcuts */}
            <div className="flex items-center gap-1.5">
              {[
                { label: "Today", date: today },
                {
                  label: "Tomorrow",
                  date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
                },
                { label: "This Sat", date: getNextSaturday(today) },
              ].map((shortcut) => {
                const active = isSameCalendarDay(selectedDate, shortcut.date);
                return (
                  <button
                    key={shortcut.label}
                    type="button"
                    onClick={() => onChange(shortcut.date, hour24, minute)}
                    className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                      active
                        ? "bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {shortcut.label}
                  </button>
                );
              })}
            </div>

            {/* Weekday Header */}
            <div className="grid grid-cols-7 gap-1 text-center pt-0.5">
              {WEEKDAYS.map((dayName, idx) => (
                <div
                  key={dayName}
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    idx === 6
                      ? "text-rose-500 dark:text-rose-400"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {dayName}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstWeekday }).map((_, i) => (
                <div key={`empty-${i}`} className="h-9" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const cellDate = new Date(viewYear, viewMonth, dayNum);
                const isPast = cellDate < today;
                const isSelected = isSameCalendarDay(cellDate, selectedDate);
                const isTodayCell = isSameCalendarDay(cellDate, today);
                const isSaturday = cellDate.getDay() === 6;
                const bsInfo = getApproximateBsDate(cellDate);

                return (
                  <button
                    key={dayNum}
                    type="button"
                    disabled={isPast}
                    onClick={() => handleSelectDate(dayNum)}
                    title={`${cellDate.toDateString()} • ${bsInfo.formattedEn}`}
                    className={`relative h-9 rounded-xl flex flex-col items-center justify-center leading-none transition-all ${
                      isPast
                        ? "opacity-30 cursor-not-allowed text-slate-400 dark:text-slate-600"
                        : isSelected
                        ? "bg-orange-600 text-white shadow-md shadow-orange-500/25 font-extrabold cursor-pointer"
                        : isTodayCell
                        ? "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 ring-1 ring-orange-400/80 font-bold hover:bg-orange-100 dark:hover:bg-orange-950/70 cursor-pointer"
                        : isSaturday
                        ? "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold cursor-pointer"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                    }`}
                  >
                    <span className="text-[11px]">{dayNum}</span>
                    {bsInfo.isExact && (
                      <span
                        className={`text-[8px] mt-0.5 ${
                          isSelected ? "text-orange-100" : "text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        {toNepaliDigits(bsInfo.day)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 2. INTERACTIVE ANALOG & DIGITAL CLOCK ── */}
        {showClockPane && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-3 space-y-3 shadow-xs">
            {/* Digital Exact Readout + Steppers */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {/* Hour control */}
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    aria-label="Increase hour"
                    onClick={() => {
                      setClockMode("hour");
                      setHour12(hour12 + 1);
                    }}
                    className="p-0.5 text-slate-400 hover:text-orange-600 transition cursor-pointer"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    aria-label="Exact hour"
                    maxLength={2}
                    value={hourDraft ?? hour12.toString().padStart(2, "0")}
                    onFocus={(e) => {
                      setClockMode("hour");
                      setHourDraft(hour12.toString().padStart(2, "0"));
                      e.target.select();
                    }}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 2);
                      setHourDraft(digits);
                      const num = parseInt(digits, 10);
                      if (digits.length === 2 && num >= 1 && num <= 12) {
                        setHour12(num);
                      }
                    }}
                    onBlur={(e) => commitHourDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setHour12(hour12 + 1);
                        setHourDraft(null);
                      } else if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setHour12(hour12 - 1);
                        setHourDraft(null);
                      } else if (e.key === "Enter") {
                        e.preventDefault();
                        commitHourDraft((e.target as HTMLInputElement).value);
                        setClockMode("minute");
                      }
                    }}
                    className={`w-11 py-1 text-center rounded-xl text-base font-black tabular-nums focus:outline-none transition ${
                      clockMode === "hour"
                        ? "bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 ring-2 ring-orange-500/40"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                    }`}
                  />
                  <button
                    type="button"
                    aria-label="Decrease hour"
                    onClick={() => {
                      setClockMode("hour");
                      setHour12(hour12 - 1);
                    }}
                    className="p-0.5 text-slate-400 hover:text-orange-600 transition cursor-pointer"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <span className="text-lg font-black text-slate-400 px-0.5">:</span>

                {/* Minute control */}
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    aria-label="Increase minute"
                    onClick={() => {
                      setClockMode("minute");
                      setMinuteValue(minute + 1);
                    }}
                    className="p-0.5 text-slate-400 hover:text-orange-600 transition cursor-pointer"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    aria-label="Exact minute"
                    maxLength={2}
                    value={minDraft ?? minute.toString().padStart(2, "0")}
                    onFocus={(e) => {
                      setClockMode("minute");
                      setMinDraft(minute.toString().padStart(2, "0"));
                      e.target.select();
                    }}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 2);
                      setMinDraft(digits);
                      const num = parseInt(digits, 10);
                      if (digits.length === 2 && num >= 0 && num <= 59) {
                        setMinuteValue(num);
                      }
                    }}
                    onBlur={(e) => commitMinDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setMinuteValue(minute + 1);
                        setMinDraft(null);
                      } else if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setMinuteValue(minute - 1);
                        setMinDraft(null);
                      } else if (e.key === "Enter") {
                        e.preventDefault();
                        commitMinDraft((e.target as HTMLInputElement).value);
                      }
                    }}
                    className={`w-11 py-1 text-center rounded-xl text-base font-black tabular-nums focus:outline-none transition ${
                      clockMode === "minute"
                        ? "bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 ring-2 ring-orange-500/40"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                    }`}
                  />
                  <button
                    type="button"
                    aria-label="Decrease minute"
                    onClick={() => {
                      setClockMode("minute");
                      setMinuteValue(minute - 1);
                    }}
                    className="p-0.5 text-slate-400 hover:text-orange-600 transition cursor-pointer"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* AM / PM Segmented Switch */}
              <div className="flex flex-col gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                {(["AM", "PM"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPeriod(m)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer ${
                      period === m
                        ? "bg-orange-600 text-white shadow-xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Analog Clock Face (Click or Drag) */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                <button
                  type="button"
                  onClick={() => setClockMode("hour")}
                  className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                    clockMode === "hour"
                      ? "bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400"
                      : "hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
                >
                  Select Hour
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setClockMode("minute")}
                  className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                    clockMode === "minute"
                      ? "bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400"
                      : "hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
                >
                  Select Minute
                </button>
              </div>

              <div
                ref={dialRef}
                role="slider"
                aria-label={clockMode === "hour" ? "Analog hour dial" : "Analog minute dial"}
                aria-valuemin={clockMode === "hour" ? 1 : 0}
                aria-valuemax={clockMode === "hour" ? 12 : 59}
                aria-valuenow={clockMode === "hour" ? hour12 : minute}
                onPointerDown={handleDialPointerDown}
                onPointerMove={handleDialPointerMove}
                onPointerUp={handleDialPointerUp}
                onPointerCancel={handleDialPointerUp}
                className="relative w-[184px] h-[184px] rounded-full bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 select-none touch-none cursor-pointer shadow-inner"
              >
                {/* SVG Dial Ticks & Hand */}
                <svg viewBox="0 0 184 184" className="absolute inset-0 w-full h-full pointer-events-none">
                  {/* 60 subtle minute ticks around perimeter */}
                  {Array.from({ length: 60 }).map((_, idx) => {
                    const angle = ((idx * 6 - 90) * Math.PI) / 180;
                    const isMajor = idx % 5 === 0;
                    const r1 = isMajor ? 82 : 85;
                    const r2 = 89;
                    const isActiveMinuteTick = clockMode === "minute" && idx === minute;
                    return (
                      <line
                        key={idx}
                        x1={92 + r1 * Math.cos(angle)}
                        y1={92 + r1 * Math.sin(angle)}
                        x2={92 + r2 * Math.cos(angle)}
                        y2={92 + r2 * Math.sin(angle)}
                        stroke={
                          isActiveMinuteTick
                            ? "#ea580c"
                            : isMajor
                            ? "rgba(148,163,184,0.65)"
                            : "rgba(148,163,184,0.3)"
                        }
                        strokeWidth={isActiveMinuteTick ? 2.4 : isMajor ? 1.5 : 1}
                        strokeLinecap="round"
                      />
                    );
                  })}

                  {/* Clock Hand */}
                  <line
                    x1={92}
                    y1={92}
                    x2={tipX}
                    y2={tipY}
                    stroke="#ea580c"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />

                  {/* Tip Bubble */}
                  {isInterMinute ? (
                    <>
                      <circle cx={tipX} cy={tipY} r={5.5} fill="#ea580c" />
                      <circle cx={tipX} cy={tipY} r={2} fill="#ffffff" />
                    </>
                  ) : (
                    <circle cx={tipX} cy={tipY} r={14} fill="#ea580c" />
                  )}

                  {/* Center Hub */}
                  <circle cx={92} cy={92} r={4.5} fill="#ea580c" />
                  <circle cx={92} cy={92} r={2} fill="#ffffff" />
                </svg>

                {/* Dial Labels */}
                {Array.from({ length: 12 }).map((_, idx) => {
                  const val = clockMode === "hour" ? (idx === 0 ? 12 : idx) : idx * 5;
                  const angle = ((idx * 30 - 90) * Math.PI) / 180;
                  const r = 60;
                  const x = 92 + r * Math.cos(angle);
                  const y = 92 + r * Math.sin(angle);
                  const isActive =
                    clockMode === "hour" ? hour12 === val : minute === val;

                  return (
                    <span
                      key={idx}
                      style={{ left: `${x}px`, top: `${y}px` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 text-[11px] font-bold pointer-events-none tabular-nums ${
                        isActive
                          ? "text-white"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {clockMode === "minute" ? val.toString().padStart(2, "0") : val}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Quick Exact Time Chips */}
            <div className="flex flex-wrap items-center justify-center gap-1 pt-0.5">
              <button
                type="button"
                onClick={handleQuickInOneHour}
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60 hover:bg-orange-100 transition cursor-pointer"
              >
                +1 hr
              </button>
              {[
                { label: "9:00 AM", h: 9, m: 0 },
                { label: "11:00 AM", h: 11, m: 0 },
                { label: "2:00 PM", h: 14, m: 0 },
                { label: "5:00 PM", h: 17, m: 0 },
              ].map((preset) => {
                const active = hour24 === preset.h && minute === preset.m;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => onChange(selectedDate, preset.h, preset.m)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                      active
                        ? "bg-orange-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Past-Time Notice */}
      {isSelectedTimeInPast && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-[11px]">
          <span className="flex items-center gap-1.5 font-medium">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Selected time has already passed today.</span>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleQuickInOneHour}
              className="px-2 py-0.5 rounded-md bg-amber-600 text-white font-bold text-[10px] hover:bg-amber-700 transition cursor-pointer"
            >
              Set +1 hr
            </button>
            <button
              type="button"
              onClick={handleSetTomorrowSameTime}
              className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 font-bold text-[10px] hover:bg-amber-100 transition cursor-pointer"
            >
              Use Tomorrow
            </button>
          </div>
        </div>
      )}

      {/* Selected Summary Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/80 dark:border-slate-700/80">
        <div className="text-[11px] text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-1.5">
          <span className="font-bold text-slate-800 dark:text-white">
            {selectedDate.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span className="text-slate-400">•</span>
          <span className="font-extrabold text-orange-600 dark:text-orange-400">
            {formatExactClockTime(hour24, minute)}
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            {selectedBs.formattedNe}
          </span>
        </div>

        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-bold shadow-xs transition cursor-pointer"
          >
            <Check className="w-3 h-3" />
            <span>Confirm Time</span>
          </button>
        )}
      </div>
    </div>
  );
}
