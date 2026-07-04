"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { he } from "@/lib/i18n/he";
import type { AuthActionState } from "@/lib/auth-state";

/**
 * `redirectTo` arrives as attacker-controllable form data (the page reads it
 * straight from a query param), so it must be revalidated here regardless of
 * what the page already rendered. Only same-site relative paths are safe —
 * `next/navigation`'s `redirect()` does not enforce same-origin, so an
 * absolute or protocol-relative ("//evil.example") value would send a freshly
 * authenticated user straight to an attacker's page (open redirect).
 */
function safeRedirectPath(value: FormDataEntryValue | null): string {
  if (typeof value !== "string" || value.length === 0) return "/matches";
  if (!/^\/(?!\/|\\)/.test(value)) return "/matches";
  return value;
}

/**
 * Signs an existing user in with email + password. On success, redirects to
 * the `redirectTo` form field (set by middleware when it bounced an
 * unauthenticated visitor from a protected route) or `/matches` by default.
 */
export async function login(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = formData.get("email");
  const password = formData.get("password");
  const redirectTo = safeRedirectPath(formData.get("redirectTo"));

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return { error: he.validation.auth.emailPasswordRequired };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

/**
 * Creates a new auth user via Supabase. Does NOT insert into `profiles` —
 * that row is created server-side by the `handle_new_user` DB trigger
 * (see the project's Obsidian decision log #12 / CLAUDE.md). Inserting here
 * too would race the trigger.
 */
export async function register(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = formData.get("email");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof confirmPassword !== "string" ||
    !email ||
    !password
  ) {
    return { error: he.validation.auth.emailPasswordRequired };
  }

  if (password.length < 6) {
    return { error: he.validation.auth.passwordMinLength };
  }

  if (password !== confirmPassword) {
    return { error: he.validation.auth.passwordsMismatch };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/profile/edit");
}

/** Signs the current user out and returns them to the login page. */
export async function logout(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("signOut failed:", error.message);
  }
  revalidatePath("/", "layout");
  redirect("/login");
}
