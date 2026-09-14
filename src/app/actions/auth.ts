"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { RegisterSchema, LoginSchema } from "@/lib/validations";
import { redirect } from "next/navigation";


export type AuthActionResult = {
  success: boolean;
  message?: string;
  error?: string;
  requiresEmailVerification?: boolean;
};

export async function registerUser(rawInput: unknown): Promise<AuthActionResult> {
  const result = RegisterSchema.safeParse(rawInput);
  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message ?? "Invalid form data",
    };
  }

  const { email, password, role, name, phone } = result.data;
  const supabase = await createClient();

  // 1. Register with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
        phone: phone || null,
      },
    },
  });

  if (authError) {
    return { success: false, error: authError.message };
  }

  const authUserId = authData.user?.id;
  if (!authUserId) {
    return { success: false, error: "Failed to create authentication user" };
  }

  // 2. Create User and Role Profile in PostgreSQL via Prisma
  try {
    const existing = await prisma.user.findUnique({
      where: { id: authUserId },
    });

    if (!existing) {
      await prisma.user.create({
        data: {
          id: authUserId,
          email,
          phone: phone || null,
          role,
          ...(role === "WORKER"
            ? {
                workerProfile: {
                  create: {
                    name,
                    skills: [],
                  },
                },
              }
            : {
                recruiterProfile: {
                  create: {
                    name,
                  },
                },
              }),
        },
      });
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Database error";
    console.error("Prisma user sync warning:", errorMsg);
  }

  const requiresEmailVerification = !authData.session;

  return {
    success: true,
    requiresEmailVerification,
    message: requiresEmailVerification
      ? "Account created! Please check your email to verify your address."
      : "Welcome to KamGhar! Your account is ready.",
  };
}

export async function loginUser(rawInput: unknown): Promise<AuthActionResult> {
  const result = LoginSchema.safeParse(rawInput);
  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message ?? "Invalid credentials",
    };
  }

  const { email, password } = result.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    message: "Logged in successfully!",
  };
}

export async function signOutUser() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export async function requestPasswordReset(
  rawInput: unknown
): Promise<AuthActionResult> {
  const schema = (await import("zod")).z.object({
    email: (await import("zod")).z
      .string()
      .email("Please enter a valid email address"),
  });

  const result = schema.safeParse(rawInput);
  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message ?? "Invalid email",
    };
  }

  const { email } = result.data;
  const supabase = await createClient();

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?type=recovery&next=/reset-password`,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    message:
      "Password reset link sent! Check your inbox (and spam folder) for the reset email.",
  };
}

export async function updatePassword(
  rawInput: unknown
): Promise<AuthActionResult> {
  const schema = (await import("zod")).z.object({
    password: (await import("zod")).z
      .string()
      .min(8, "Password must be at least 8 characters"),
  });

  const result = schema.safeParse(rawInput);
  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message ?? "Invalid password",
    };
  }

  const { password } = result.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    message: "Password updated successfully! You can now log in with your new password.",
  };
}
