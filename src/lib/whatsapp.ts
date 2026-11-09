/**
 * KamGhar WhatsApp Instant Booking & Direct Messaging Utility
 * Normalizes Nepali phone numbers to international +977 standard
 * and generates pre-filled conversational booking messages.
 */

export function sanitizeNepaliPhone(rawPhone?: string | null): string {
  if (!rawPhone) return "";
  let cleaned = rawPhone.replace(/[^0-9]/g, "");

  // If starts with 0, drop leading 0
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }

  // If 10 digits starting with 9 (standard Nepali mobile: 98xxxxxxxx, 97xxxxxxxx)
  if (cleaned.length === 10 && cleaned.startsWith("9")) {
    cleaned = `977${cleaned}`;
  }

  // If starts with 977 and has 13 or 12 digits
  if (cleaned.startsWith("977")) {
    return cleaned;
  }

  return cleaned;
}

export function getWorkerWhatsAppUrl(params: {
  phone?: string | null;
  workerName: string;
  skill?: string | null;
  clientName?: string | null;
}): string {
  const sanitized = sanitizeNepaliPhone(params.phone);
  if (!sanitized) return "";

  const text = `नमस्ते ${params.workerName} जी, म कामघर (KamGhar) बाट तपाईंको ${
    params.skill || "सेवा"
  } सम्बन्धी कुरा गर्न चाहन्छु। के तपाईं यो कामको लागि उपलब्ध हुनुहुन्छ?`;

  return `https://wa.me/${sanitized}?text=${encodeURIComponent(text)}`;
}

export function getJobWhatsAppUrl(params: {
  phone?: string | null;
  recruiterName?: string | null;
  jobTitle: string;
  budget?: number | null;
}): string {
  const sanitized = sanitizeNepaliPhone(params.phone);
  if (!sanitized) return "";

  const budgetText = params.budget ? ` (बजेट: रू ${params.budget.toLocaleString()})` : "";
  const text = `नमस्ते ${params.recruiterName || "सर/म्याडम"}, मैले कामघर (KamGhar) मा तपाईंले पोस्ट गर्नुभएको काम '${
    params.jobTitle
  }'${budgetText} देखें। म यो काम गर्न इच्छुक छु। के थप जानकारी पाउन सकिन्छ?`;

  return `https://wa.me/${sanitized}?text=${encodeURIComponent(text)}`;
}
