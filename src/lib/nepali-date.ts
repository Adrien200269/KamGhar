/**
 * Bikram Sambat (BS) & Nepali Localization Date Utilities
 * For KamGhar - Nepal's Freelance & Gig Platform
 */

const NEPALI_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

export function toNepaliDigits(num: number | string): string {
  return num
    .toString()
    .split("")
    .map((ch) => {
      const n = parseInt(ch, 10);
      return !isNaN(n) ? NEPALI_DIGITS[n] : ch;
    })
    .join("");
}

const BS_MONTHS_EN = [
  "Baisakh",
  "Jestha",
  "Ashadh",
  "Shrawan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
];

const BS_MONTHS_NE = [
  "वैशाख",
  "जेठ",
  "असार",
  "श्रावण",
  "भाद्र",
  "आश्विन",
  "कार्तिक",
  "मंसिर",
  "पौष",
  "माघ",
  "फागुन",
  "चैत",
];

export type BsDateInfo = {
  year: number;
  monthIndex: number;
  monthEn: string;
  monthNe: string;
  day: number;
  formattedEn: string;
  formattedNe: string;
  isExact: boolean;
};

/**
 * Verified Bikram Sambat month lengths for 2082 BS (starting 2025-04-14)
 * and 2083 BS (starting 2026-04-14) so calendar conversions never skip or duplicate days.
 */
const VERIFIED_BS_CALENDAR: {
  year: number;
  startAd: [number, number, number]; // [year, monthIndex (0-11), day]
  monthDays: number[];
}[] = [
  {
    year: 2082,
    startAd: [2025, 3, 14],
    monthDays: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  },
  {
    year: 2083,
    startAd: [2026, 3, 14],
    monthDays: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  },
];

function getUtcDayNumber(year: number, monthIndex: number, day: number): number {
  return Math.floor(Date.UTC(year, monthIndex, day) / 86_400_000);
}

/**
 * Converts a Gregorian (AD) Date to Bikram Sambat (BS).
 * Uses verified Nepal Panchanga month lengths for 2082–2083 BS and falls back
 * to the standard approximation outside that range.
 */
export function getApproximateBsDate(date: Date = new Date()): BsDateInfo {
  const adYear = date.getFullYear();
  const adMonth = date.getMonth(); // 0-indexed
  const adDay = date.getDate();

  const targetDayNum = getUtcDayNumber(adYear, adMonth, adDay);

  for (const entry of VERIFIED_BS_CALENDAR) {
    const [sy, sm, sd] = entry.startAd;
    const startDayNum = getUtcDayNumber(sy, sm, sd);
    const totalDays = entry.monthDays.reduce((sum, d) => sum + d, 0);
    const diff = targetDayNum - startDayNum;

    if (diff >= 0 && diff < totalDays) {
      let remaining = diff;
      let bsMonthIndex = 0;
      while (bsMonthIndex < entry.monthDays.length && remaining >= entry.monthDays[bsMonthIndex]) {
        remaining -= entry.monthDays[bsMonthIndex];
        bsMonthIndex += 1;
      }
      const bsDay = remaining + 1;
      const monthEn = BS_MONTHS_EN[bsMonthIndex] || "Baisakh";
      const monthNe = BS_MONTHS_NE[bsMonthIndex] || "वैशाख";

      return {
        year: entry.year,
        monthIndex: bsMonthIndex,
        monthEn,
        monthNe,
        day: bsDay,
        formattedEn: `${monthEn} ${bsDay}, ${entry.year} BS`,
        formattedNe: `${monthNe} ${toNepaliDigits(bsDay)}, ${toNepaliDigits(entry.year)} वि.सं.`,
        isExact: true,
      };
    }
  }

  // Approximate BS fallback outside verified table
  let bsYear = adYear + 56;
  let bsMonthIndex = adMonth + 8;
  let bsDay = adDay + 15;

  if (bsDay > 30) {
    bsDay -= 30;
    bsMonthIndex += 1;
  }

  if (bsMonthIndex >= 12) {
    bsMonthIndex -= 12;
    bsYear += 1;
  }

  const monthEn = BS_MONTHS_EN[bsMonthIndex] || "Baisakh";
  const monthNe = BS_MONTHS_NE[bsMonthIndex] || "वैशाख";

  return {
    year: bsYear,
    monthIndex: bsMonthIndex,
    monthEn,
    monthNe,
    day: bsDay,
    formattedEn: `${monthEn} ${bsDay}, ${bsYear} BS`,
    formattedNe: `${monthNe} ${toNepaliDigits(bsDay)}, ${toNepaliDigits(bsYear)} वि.सं.`,
    isExact: false,
  };
}

/**
 * Returns the BS month range label covering a Gregorian month (e.g. "कार्तिक – मंसिर २०८३ वि.सं.").
 */
export function getBsMonthSpanLabel(adYear: number, adMonth: number, lang: "en" | "ne" = "ne"): string {
  const firstDay = getApproximateBsDate(new Date(adYear, adMonth, 1));
  const lastDay = getApproximateBsDate(new Date(adYear, adMonth + 1, 0));

  if (firstDay.monthIndex === lastDay.monthIndex && firstDay.year === lastDay.year) {
    return lang === "ne"
      ? `${firstDay.monthNe} ${toNepaliDigits(firstDay.year)} वि.सं.`
      : `${firstDay.monthEn} ${firstDay.year} BS`;
  }

  if (firstDay.year === lastDay.year) {
    return lang === "ne"
      ? `${firstDay.monthNe} – ${lastDay.monthNe} ${toNepaliDigits(firstDay.year)} वि.सं.`
      : `${firstDay.monthEn} – ${lastDay.monthEn} ${firstDay.year} BS`;
  }

  return lang === "ne"
    ? `${firstDay.monthNe} ${toNepaliDigits(firstDay.year)} – ${lastDay.monthNe} ${toNepaliDigits(lastDay.year)} वि.सं.`
    : `${firstDay.monthEn} ${firstDay.year} – ${lastDay.monthEn} ${lastDay.year} BS`;
}

/**
 * Formats 24h hour (0-23) and minute (0-59) into a clean 12-hour clock string (e.g. "2:30 PM").
 */
export function formatExactClockTime(hour24: number, minute: number): string {
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const minPadded = minute.toString().padStart(2, "0");
  return `${hour12}:${minPadded} ${period}`;
}

/**
 * Formats an exact calendar Date + clock time for storage in job preferred timing.
 */
export function formatExactScheduledTiming(date: Date, hour24: number, minute: number): string {
  const adFormatted = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeFormatted = formatExactClockTime(hour24, minute);
  const bs = getApproximateBsDate(date);
  return `${adFormatted} at ${timeFormatted} (${bs.monthNe} ${toNepaliDigits(bs.day)}, ${toNepaliDigits(bs.year)})`;
}

/**
 * Extracts `[Preferred Timing: ...]` metadata appended to a job description.
 */
export function extractPreferredTiming(description: string): {
  cleanDescription: string;
  preferredTiming: string | null;
} {
  const match = description.match(/\n*\s*\[Preferred Timing:\s*([^\]]+)\]\s*$/i);
  if (!match || match.index === undefined) {
    return { cleanDescription: description, preferredTiming: null };
  }
  return {
    cleanDescription: description.slice(0, match.index).trimEnd(),
    preferredTiming: match[1].trim(),
  };
}

/**
 * Schedule time slot labels in English and Nepali
 */
export const SCHEDULE_TIME_SLOTS = [
  { value: "IMMEDIATE", labelEn: "Urgent (Within 2 Hours)", labelNe: "आपतकालीन (२ घण्टाभित्र)" },
  { value: "TODAY_AFTERNOON", labelEn: "Today Afternoon (1 PM - 5 PM)", labelNe: "आज दिउँसो (१ - ५ बजे)" },
  { value: "TOMORROW_MORNING", labelEn: "Tomorrow Morning (8 AM - 12 PM)", labelNe: "भोलि बिहान (८ - १२ बजे)" },
  { value: "TOMORROW_AFTERNOON", labelEn: "Tomorrow Afternoon (1 PM - 5 PM)", labelNe: "भोलि दिउँसो (१ - ५ बजे)" },
  { value: "WEEKEND", labelEn: "This Weekend (Saturday)", labelNe: "यस शनिबार" },
  { value: "FLEXIBLE", labelEn: "Flexible / Negotiable", labelNe: "सहमति अनुसार / लचिलो" },
];
