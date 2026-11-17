import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * Handles auth callbacks for:
 * 1. Password reset links (?type=recovery)
 * 2. Email verification links
 * 3. OAuth sign-in / sign-up (Google, etc.)
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const roleParam = requestUrl.searchParams.get("role");

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
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/reset-password`);
      }

      // Synchronize OAuth user with Prisma database
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && user.email) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
              workerProfile: true,
              recruiterProfile: true,
            },
          });

          if (!existingUser) {
            // New user registration via OAuth
            const selectedRole =
              (roleParam?.toUpperCase() === "RECRUITER" ||
              user.user_metadata?.role?.toUpperCase() === "RECRUITER")
                ? "RECRUITER"
                : "WORKER";

            const fullName =
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email.split("@")[0] ||
              "User";

            const avatarUrl =
              user.user_metadata?.avatar_url ||
              user.user_metadata?.picture ||
              null;

            await prisma.user.create({
              data: {
                id: user.id,
                email: user.email,
                role: selectedRole,
                ...(selectedRole === "WORKER"
                  ? {
                      workerProfile: {
                        create: {
                          name: fullName,
                          profilePhotoUrl: avatarUrl,
                          skills: [],
                        },
                      },
                    }
                  : {
                      recruiterProfile: {
                        create: {
                          name: fullName,
                          profilePhotoUrl: avatarUrl,
                        },
                      },
                    }),
              },
            });

            // Redirect new OAuth users directly to onboarding to complete their profile
            return NextResponse.redirect(`${origin}/onboarding`);
          } else {
            // Existing user: check if their profile exists, else complete onboarding
            const hasProfile =
              existingUser.role === "WORKER"
                ? Boolean(existingUser.workerProfile)
                : Boolean(existingUser.recruiterProfile);

            if (!hasProfile) {
              return NextResponse.redirect(`${origin}/onboarding`);
            }
          }
        } catch (dbErr) {
          console.error("Prisma user sync error in OAuth callback:", dbErr);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }

    if (type === "recovery") {
      return NextResponse.redirect(`${origin}/forgot-password?error=expired`);
    }

    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        error.message || "Failed to authenticate session"
      )}`
    );
  }

  return NextResponse.redirect(`${origin}/`);
}
