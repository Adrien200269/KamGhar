import crypto from "crypto";

/**
 * eSewa ePay (v2) Integration Utility for KamGhar
 * Works with both eSewa Sandbox (UAT / EPAYTEST) and Production
 */

/**
 * Strips surrounding quotes (single or double) and trailing/leading whitespace or newlines.
 * Essential for hosting environments like Vercel where users might copy-paste values from .env files with quotes.
 */
export function cleanEnvVal(val?: string | null): string {
  if (!val) return "";
  let cleaned = val.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

export function getEsewaProductCode(): string {
  return cleanEnvVal(process.env.ESEWA_PRODUCT_CODE) || "EPAYTEST";
}

export function getEsewaSecretKey(): string {
  const productCode = getEsewaProductCode();
  const configured = cleanEnvVal(process.env.ESEWA_SECRET_KEY);

  // When testing with official sandbox code EPAYTEST, ensure the official test key is used
  // (guards against truncation like "8gBm/:" when '&' was treated as a separator in shell or Vercel UI)
  if (productCode === "EPAYTEST") {
    if (!configured || configured.startsWith("8gBm/:") || configured !== "8gBm/:&EnhH.1/q") {
      return "8gBm/:&EnhH.1/q";
    }
  }

  return configured || "8gBm/:&EnhH.1/q";
}

export function isEsewaConfigured(): boolean {
  // Always true: defaults to standard sandbox EPAYTEST credentials if not customized in env
  return true;
}

export function getEsewaGatewayUrl(): string {
  const configured = cleanEnvVal(process.env.ESEWA_GATEWAY_URL);
  if (configured) return configured;

  const productCode = getEsewaProductCode();
  if (productCode === "EPAYTEST") {
    return "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
  }
  return "https://epay.esewa.com.np/api/epay/main/v2/form";
}

export function getEsewaStatusUrl(): string {
  const configured = cleanEnvVal(process.env.ESEWA_STATUS_URL);
  if (configured) return configured;

  const productCode = getEsewaProductCode();
  if (productCode === "EPAYTEST") {
    return "https://rc.esewa.com.np/api/epay/transaction/status/";
  }
  return "https://epay.esewa.com.np/api/epay/transaction/status/";
}

export interface EsewaPaymentPayload {
  amount: string;
  tax_amount: string;
  product_service_charge: string;
  product_delivery_charge: string;
  total_amount: string;
  transaction_uuid: string;
  product_code: string;
  signed_field_names: string;
  signature: string;
  success_url: string;
  failure_url: string;
}

export interface EsewaCallbackData {
  transaction_code: string;
  status: "COMPLETE" | "PENDING" | "CANCELED" | "NOT_FOUND";
  total_amount: string;
  transaction_uuid: string;
  product_code: string;
  signature?: string;
  signed_field_names?: string;
}

export interface EsewaStatusResponse {
  product_code: string;
  transaction_uuid: string;
  total_amount: number | string;
  status: "COMPLETE" | "PENDING" | "NOT_FOUND" | "CANCELED";
  ref_id: string | null;
}

/**
 * Generates an HMAC-SHA256 signature in Base64 format as required by eSewa v2.
 * String template: total_amount={VAL},transaction_uuid={VAL},product_code={VAL}
 */
export function generateEsewaSignature(
  message: string,
  secretKey?: string
): string {
  const key = cleanEnvVal(secretKey) || getEsewaSecretKey();
  return crypto.createHmac("sha256", key).update(message).digest("base64");
}

/**
 * Creates the complete form fields payload required to initiate an eSewa ePay v2 checkout.
 */
export function createEsewaPaymentPayload(params: {
  amount: number;
  transactionUuid: string;
  successUrl: string;
  failureUrl: string;
  productCode?: string;
  secretKey?: string;
}): EsewaPaymentPayload {
  const productCode = cleanEnvVal(params.productCode) || getEsewaProductCode();
  const secretKey = cleanEnvVal(params.secretKey) || getEsewaSecretKey();

  const totalAmountStr = params.amount.toString();
  const signedFieldNames = "total_amount,transaction_uuid,product_code";
  const rawMessage = `total_amount=${totalAmountStr},transaction_uuid=${params.transactionUuid},product_code=${productCode}`;

  const signature = generateEsewaSignature(rawMessage, secretKey);

  return {
    amount: totalAmountStr,
    tax_amount: "0",
    product_service_charge: "0",
    product_delivery_charge: "0",
    total_amount: totalAmountStr,
    transaction_uuid: params.transactionUuid,
    product_code: productCode,
    signed_field_names: signedFieldNames,
    signature,
    success_url: params.successUrl,
    failure_url: params.failureUrl,
  };
}

/**
 * Decodes the base64-encoded `data` query parameter returned by eSewa upon redirect to success_url.
 */
export function decodeEsewaCallbackData(
  encodedData: string
): EsewaCallbackData | null {
  try {
    let clean = encodedData.trim();
    if (clean.includes("%")) {
      try {
        clean = decodeURIComponent(clean);
      } catch {
        // ignore
      }
    }
    clean = clean.replace(/-/g, "+").replace(/_/g, "/");
    const pad = clean.length % 4;
    if (pad === 2) clean += "==";
    else if (pad === 3) clean += "=";

    const jsonStr = Buffer.from(clean, "base64").toString("utf-8");
    return JSON.parse(jsonStr) as EsewaCallbackData;
  } catch (err) {
    console.error("Failed to decode eSewa callback payload:", err);
    return null;
  }
}

/**
 * Performs a server-to-server transaction status check using eSewa's Status Check API.
 */
export async function verifyEsewaTransaction(params: {
  productCode?: string;
  totalAmount: number | string;
  transactionUuid: string;
}): Promise<{ success: boolean; data?: EsewaStatusResponse; error?: string }> {
  const productCode =
    cleanEnvVal(params.productCode) ||
    getEsewaProductCode();

  const baseUrl = getEsewaStatusUrl();
  const amountStr = typeof params.totalAmount === "number"
    ? params.totalAmount.toString()
    : params.totalAmount.replace(/,/g, "").trim();

  const url = `${baseUrl.replace(/\/+$/, "")}/?product_code=${encodeURIComponent(
    productCode
  )}&total_amount=${encodeURIComponent(amountStr)}&transaction_uuid=${encodeURIComponent(
    params.transactionUuid
  )}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const body = (await res.json().catch(() => null)) as EsewaStatusResponse | null;

    if (res.ok && body) {
      if (body.status === "COMPLETE") {
        return { success: true, data: body };
      }
      return {
        success: false,
        data: body,
        error: `eSewa transaction status: ${body.status || "Unknown"}`,
      };
    }

    return {
      success: false,
      error: `eSewa verification request failed with HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error contacting eSewa status API",
    };
  }
}
