import { headers } from "next/headers";

/**
 * Resolves the base site URL for auth redirects, email verification links, and transactional emails.
 *
 * Resolution order:
 * 1. Request headers (`x-forwarded-host` or `origin` or `host`) - dynamically matches whatever domain the user is visiting.
 * 2. `NEXT_PUBLIC_SITE_URL` - ignored in production if mistakenly set to localhost.
 * 3. `VERCEL_PROJECT_PRODUCTION_URL` (official Vercel production domain e.g. your-app.vercel.app).
 * 4. `VERCEL_URL` (preview deployment domain).
 * 5. Fallback to `http://localhost:3000` for local development.
 */
export async function getSiteUrl(): Promise<string> {
  // 1. Try reading dynamic headers from current request (Server Actions & Server Components)
  try {
    const headersList = await headers();
    const forwardedHost = headersList.get("x-forwarded-host");
    const forwardedProto = headersList.get("x-forwarded-proto") || "https";

    if (forwardedHost) {
      return `${forwardedProto}://${forwardedHost}`.replace(/\/+$/, "");
    }

    const host = headersList.get("host");
    if (host) {
      const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
      return `${isLocal ? "http" : "https"}://${host}`.replace(/\/+$/, "");
    }

    const origin = headersList.get("origin");
    if (origin && !origin.startsWith("null")) {
      return origin.replace(/\/+$/, "");
    }
  } catch {
    // headers() throws if called outside a request context (e.g. static generation, background scripts)
  }

  const isProduction =
    process.env.NODE_ENV === "production" || !!process.env.VERCEL;

  // 2. Explicitly configured NEXT_PUBLIC_SITE_URL
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    // Safeguard: If running on Vercel/production, ignore accidental localhost configuration
    if (!isProduction || !configured.includes("localhost")) {
      const url = configured.startsWith("http") ? configured : `https://${configured}`;
      return url.replace(/\/+$/, "");
    }
  }

  // 3. Vercel production / deployment environment variables
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(/\/+$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/+$/, "");
  }

  return "http://localhost:3000";
}
