"use client";

import { useState } from "react";
import { Calendar, Clock, Check, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

export type AvailabilitySchedule = {
  days: string[];
  startTime: string;
  endTime: string;
  note?: string;
};

export const WEEK_DAYS = [
  { key: "SUN", en: "Sun", ne: "आइत" },
  { key: "MON", en: "Mon", ne: "सोम" },
  { key: "TUE", en: "Tue", ne: "मंगल" },
  { key: "WED", en: "Wed", ne: "बुध" },
  { key: "THU", en: "Thu", ne: "बिहि" },
  { key: "FRI", en: "Fri", ne: "शुक्र" },
  { key: "SAT", en: "Sat", ne: "शनि" },
] as const;

export const DEFAULT_AVAILABILITY_SCHEDULE: AvailabilitySchedule = {
  days: ["SUN", "MON", "TUE", "WED", "THU", "FRI"],
  startTime: "08:00",
  endTime: "18:00",
  note: "",
};

export function parseAvailabilitySchedule(raw: unknown): AvailabilitySchedule {
  if (!raw || typeof raw !== "object") return DEFAULT_AVAILABILITY_SCHEDULE;
  const obj = raw as Record<string, unknown>;
  const days = Array.isArray(obj.days)
    ? obj.days.filter((d): d is string => typeof d === "string")
    : DEFAULT_AVAILABILITY_SCHEDULE.days;
  return {
    days,
    startTime: typeof obj.startTime === "string" ? obj.startTime : "08:00",
    endTime: typeof obj.endTime === "string" ? obj.endTime : "18:00",
    note: typeof obj.note === "string" ? obj.note : "",
  };
}

export function isAvailableToday(schedule: AvailabilitySchedule): boolean {
  const dayKeys = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const todayKey = dayKeys[new Date().getDay()];
  return schedule.days.includes(todayKey);
}

interface AvailabilityCalendarProps {
  schedule: AvailabilitySchedule;
  editable?: boolean;
  onSave?: (next: AvailabilitySchedule) => Promise<void>;
  onSelectDayForBooking?: (dayLabel: string, timeRange: string) => void;
}

export default function AvailabilityCalendar({
  schedule,
  editable = false,
  onSave,
  onSelectDayForBooking,
}: AvailabilityCalendarProps) {
  const { lang, tx } = useLanguage();
  const [draft, setDraft] = useState<AvailabilitySchedule>(schedule);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  const dayKeys = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const todayKey = dayKeys[new Date().getDay()];
  const activeSchedule = editable ? draft : schedule;
  const availableToday = activeSchedule.days.includes(todayKey);

  const toggleDay = (key: string) => {
    if (!editable) return;
    setDraft((prev) => {
      const exists = prev.days.includes(key);
      return {
        ...prev,
        days: exists ? prev.days.filter((d) => d !== key) : [...prev.days, key],
      };
    });
  };

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(draft);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              {tx("Weekly Availability Calendar", "साप्ताहिक उपलब्धता तालिका")}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>
                {activeSchedule.startTime} – {activeSchedule.endTime}
              </span>
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
            availableToday
              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              availableToday ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
            }`}
          />
          {availableToday
            ? tx("Available Today", "आज उपलब्ध")
            : tx("Off Today", "आज बिदा")}
        </span>
      </div>

      {/* 7-day strip */}
      <div className="grid grid-cols-7 gap-1.5">
        {WEEK_DAYS.map((day) => {
          const active = activeSchedule.days.includes(day.key);
          const isToday = day.key === todayKey;
          const clickable = editable || (active && !!onSelectDayForBooking);

          return (
            <button
              key={day.key}
              type="button"
              disabled={!clickable}
              onClick={() => {
                if (editable) {
                  toggleDay(day.key);
                } else if (active && onSelectDayForBooking) {
                  onSelectDayForBooking(
                    lang === "ne" ? day.ne : day.en,
                    `${activeSchedule.startTime}–${activeSchedule.endTime}`
                  );
                }
              }}
              title={
                !editable && active && onSelectDayForBooking
                  ? tx(`Book for ${day.en}`, `${day.ne} को लागि बुक गर्नुहोस्`)
                  : undefined
              }
              className={`py-2 px-1 rounded-xl text-center border transition-all flex flex-col items-center justify-center gap-0.5 ${
                active
                  ? "bg-emerald-500/15 dark:bg-emerald-950/60 border-emerald-400/70 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 font-bold"
                  : "bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/70 text-slate-400 dark:text-slate-500"
              } ${clickable ? "cursor-pointer hover:scale-[1.03]" : "cursor-default"} ${
                isToday ? "ring-2 ring-orange-500/40" : ""
              }`}
            >
              <span className="text-[11px]">{lang === "ne" ? day.ne : day.en}</span>
              <span className="text-[9px] uppercase tracking-tight">
                {isToday ? tx("Today", "आज") : active ? "✓" : "–"}
              </span>
            </button>
          );
        })}
      </div>

      {editable ? (
        <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                {tx("Start Time", "सुरु समय")}
              </label>
              <input
                type="time"
                value={draft.startTime}
                onChange={(e) => setDraft((p) => ({ ...p, startTime: e.target.value }))}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                {tx("End Time", "अन्त्य समय")}
              </label>
              <input
                type="time"
                value={draft.endTime}
                onChange={(e) => setDraft((p) => ({ ...p, endTime: e.target.value }))}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={draft.note || ""}
              onChange={(e) => setDraft((p) => ({ ...p, note: e.target.value }))}
              placeholder={tx(
                "Optional note (e.g. Weekends by appointment)",
                "ऐच्छिक नोट (जस्तै: शनिबार फोन गरेर मात्र)"
              )}
              className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            />
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-xs font-bold transition cursor-pointer shrink-0"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : savedToast ? (
                <Check className="w-3.5 h-3.5" />
              ) : null}
              <span>
                {savedToast ? tx("Saved!", "बचत भयो!") : tx("Save Schedule", "तालिका सेभ")}
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <span>
            {activeSchedule.note
              ? activeSchedule.note
              : tx(
                  "Click any green day to book a time slot directly.",
                  "सीधै समय बुक गर्न हरियो दिनमा क्लिक गर्नुहोस्।"
                )}
          </span>
        </div>
      )}
    </div>
  );
}
