import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Supabase sends users here after clicking the password-reset email link.
 * The URL contains ?code=<pkce_code>&type=recovery&next=/reset-password
 * We exchange the code for a session and redirect to the target page.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/";

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
