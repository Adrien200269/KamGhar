/**
 * Utility functions to calculate and format remaining boost / feature time
 * for Worker Profiles and Job Listings.
 */

export interface RemainingBoostInfo {
  isActive: boolean;
  days: number;
  hours: number;
  minutes: number;
  totalHours: number;
  formatted: string;
  shortFormatted: string;
  badgeLabel: string;
  expiryDateFormatted: string;
}

export function getRemainingBoostInfo(
  expiryDate: Date | string | null | undefined,
  lang: string = "en"
): RemainingBoostInfo | null {
  if (!expiryDate) return null;

  const expiry = new Date(expiryDate).getTime();
  if (isNaN(expiry)) return null;

  const now = Date.now();
  const diff = expiry - now;

  const expiryDateObj = new Date(expiryDate);
  const expiryDateFormatted = expiryDateObj.toLocaleDateString(lang === "ne" ? "ne-NP" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (diff <= 0) {
    return {
      isActive: false,
      days: 0,
      hours: 0,
      minutes: 0,
      totalHours: 0,
      formatted: lang === "ne" ? "म्याद सकियो" : "Boost Expired",
      shortFormatted: lang === "ne" ? "सकियो" : "Expired",
      badgeLabel: lang === "ne" ? "सकियो" : "Expired",
      expiryDateFormatted,
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const totalHours = Math.round(diff / (1000 * 60 * 60));

  let formatted = "";
  let shortFormatted = "";
  let badgeLabel = "";

  if (days > 0) {
    if (lang === "ne") {
      formatted = `${days} दिन ${hours} घण्टा बाँकी`;
      shortFormatted = `${days}d ${hours}h`;
      badgeLabel = `${days} दिन बाँकी`;
    } else {
      formatted = `${days} day${days > 1 ? "s" : ""}, ${hours} hr${hours > 1 ? "s" : ""} left`;
      shortFormatted = `${days}d ${hours}h left`;
      badgeLabel = `${days}d left`;
    }
  } else if (hours > 0) {
    if (lang === "ne") {
      formatted = `${hours} घण्टा ${minutes} मिनेट बाँकी`;
      shortFormatted = `${hours}h ${minutes}m`;
      badgeLabel = `${hours} घण्टा बाँकी`;
    } else {
      formatted = `${hours} hr${hours > 1 ? "s" : ""} ${minutes} min left`;
      shortFormatted = `${hours}h ${minutes}m left`;
      badgeLabel = `${hours}h left`;
    }
  } else {
    if (lang === "ne") {
      formatted = `${minutes} मिनेट बाँकी`;
      shortFormatted = `${minutes}m`;
      badgeLabel = `${minutes}m बाँकी`;
    } else {
      formatted = `${minutes} min left`;
      shortFormatted = `${minutes}m left`;
      badgeLabel = `${minutes}m left`;
    }
  }

  return {
    isActive: true,
    days,
    hours,
    minutes,
    totalHours,
    formatted,
    shortFormatted,
    badgeLabel,
    expiryDateFormatted,
  };
}
