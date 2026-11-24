/**
 * Khalti ePayment Gateway (v2) Integration Utility for KamGhar
 */

export interface KhaltiCustomerInfo {
  name?: string;
  email?: string;
  phone?: string;
}

export interface KhaltiInitiateParams {
  returnUrl: string;
  websiteUrl: string;
  amount: number; // in paisa (1 NPR = 100 paisa)
  purchaseOrderId: string;
  purchaseOrderName: string;
  customerInfo?: KhaltiCustomerInfo;
}

export interface KhaltiInitiateResponse {
  pidx: string;
  payment_url: string;
  expires_at: string;
  expires_in: number;
}

export interface KhaltiLookupResponse {
  pidx: string;
  total_amount: number;
  status: "Completed" | "Pending" | "Initiated" | "Refunded" | "Expired" | "User canceled";
  transaction_id: string | null;
  fee: number;
  refunded: boolean;
}

export function isKhaltiConfigured(): boolean {
  return !!process.env.KHALTI_SECRET_KEY && process.env.KHALTI_SECRET_KEY.trim().length > 0;
}

export function getKhaltiBaseUrl(): string {
  if (process.env.KHALTI_GATEWAY_URL?.trim()) {
    return process.env.KHALTI_GATEWAY_URL.trim().replace(/\/+$/, "");
  }
  // Default to dev / sandbox for testing
  return "https://dev.khalti.com/api/v2";
}

/**
 * Initiates an ePayment checkout session with Khalti v2
 */
export async function initiateKhaltiPayment(
  params: KhaltiInitiateParams
): Promise<{ success: boolean; data?: KhaltiInitiateResponse; error?: string }> {
  const secretKey = process.env.KHALTI_SECRET_KEY?.trim();
  if (!secretKey) {
    return { success: false, error: "KHALTI_SECRET_KEY is not configured." };
  }

  const primaryUrl = getKhaltiBaseUrl();
  // List endpoints to try (primary first, then fallback between dev & live)
  const candidateUrls = [
    primaryUrl,
    primaryUrl.includes("dev.khalti.com")
      ? "https://khalti.com/api/v2"
      : "https://dev.khalti.com/api/v2",
  ];

  let lastError = "Failed to communicate with Khalti.";

  for (const baseUrl of candidateUrls) {
    try {
      const endpoint = `${baseUrl}/epayment/initiate/`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Key ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          return_url: params.returnUrl,
          website_url: params.websiteUrl,
          amount: Math.round(params.amount),
          purchase_order_id: params.purchaseOrderId,
          purchase_order_name: params.purchaseOrderName,
          customer_info: params.customerInfo || {},
        }),
      });

      const body = await res.json().catch(() => null);

      if (res.ok && body?.payment_url && body?.pidx) {
        return {
          success: true,
          data: {
            pidx: body.pidx,
            payment_url: body.payment_url,
            expires_at: body.expires_at,
            expires_in: body.expires_in,
          },
        };
      }

      if (body?.detail) {
        lastError = body.detail;
      } else if (body?.error_key) {
        lastError = `${body.error_key}: ${JSON.stringify(body)}`;
      } else {
        lastError = `Khalti error: HTTP ${res.status}`;
      }

      // If unauthorized (401), try the next candidate environment (e.g. dev vs prod)
      if (res.status === 401) {
        continue;
      }

      // If validation error (e.g. 400 Bad Request with details), break and return
      break;
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Network error contacting Khalti";
    }
  }

  return { success: false, error: lastError };
}

/**
 * Looks up and verifies an ePayment transaction with Khalti v2 using pidx
 */
export async function verifyKhaltiPayment(
  pidx: string
): Promise<{ success: boolean; data?: KhaltiLookupResponse; error?: string }> {
  const secretKey = process.env.KHALTI_SECRET_KEY?.trim();
  if (!secretKey) {
    return { success: false, error: "KHALTI_SECRET_KEY is not configured." };
  }

  const primaryUrl = getKhaltiBaseUrl();
  const candidateUrls = [
    primaryUrl,
    primaryUrl.includes("dev.khalti.com")
      ? "https://khalti.com/api/v2"
      : "https://dev.khalti.com/api/v2",
  ];

  let lastError = "Payment verification with Khalti failed.";

  for (const baseUrl of candidateUrls) {
    try {
      const endpoint = `${baseUrl}/epayment/lookup/`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Key ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pidx }),
      });

      const body = await res.json().catch(() => null);

      if (res.ok && body?.status) {
        return {
          success: true,
          data: body as KhaltiLookupResponse,
        };
      }

      if (body?.detail) {
        lastError = body.detail;
      }

      if (res.status === 401) {
        continue;
      }

      break;
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Network error verifying payment with Khalti";
    }
  }

  return { success: false, error: lastError };
}
