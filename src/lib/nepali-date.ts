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

/**
 * Approximate conversion from Gregorian (AD) to Bikram Sambat (BS).
 * BS is approximately 56 years, 8 months, and 15–17 days ahead of AD.
 */
export function getApproximateBsDate(date: Date = new Date()): {
  year: number;
  monthIndex: number;
  monthEn: string;
  monthNe: string;
  day: number;
  formattedEn: string;
  formattedNe: string;
} {
  const adYear = date.getFullYear();
  const adMonth = date.getMonth(); // 0-indexed
  const adDay = date.getDate();

  // Approximate BS calculation
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
