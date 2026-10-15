import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Supabase sends users here after clicking the password-reset email link.
 * The URL contains ?code=<pkce_code>&type=recovery&next=/reset-password
 * We exchange the code for a session and redirect to the target page.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next") ?? "/";

  // Ensure origin matches the public host in production/reverse proxies (e.g. Vercel)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const destination = type === "recovery" ? "/reset-password" : next;
      return NextResponse.redirect(`${origin}${destination}`);
    }

    return NextResponse.redirect(
      `${origin}/forgot-password?error=expired`
    );
  }

  return NextResponse.redirect(`${origin}/`);
}
