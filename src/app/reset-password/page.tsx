import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { he } from "@/lib/i18n/he";

export const metadata: Metadata = {
  title: he.auth.resetPassword.metaTitle,
};

/**
 * Reached either via `/auth/confirm` (which verifies the emailed reset link
 * and establishes a short-lived recovery session) or, directly, by an
 * already-logged-in user. Not gated by middleware: a recovery session isn't
 * a normal login, so it must reach this page even though `AUTH_ONLY_PREFIXES`
 * would otherwise bounce an authenticated visitor away from `/login`-like
 * pages.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ invalidLink?: string }>;
}) {
  const { invalidLink } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const hasSession = data?.claims != null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {invalidLink === "1" || !hasSession ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">{he.auth.resetPassword.invalidLinkHeading}</h1>
            <p className="mt-2 text-sm text-fg-muted">{he.auth.resetPassword.invalidLinkBody}</p>
            <Link
              href="/forgot-password"
              className="mt-6 inline-block font-semibold text-primary hover:text-primary-dark"
            >
              {he.auth.resetPassword.requestNewLink}
            </Link>
          </div>
        ) : (
          <>
            <h1 className="mb-1 text-center text-2xl font-bold text-foreground">
              {he.auth.resetPassword.heading}
            </h1>
            <p className="mb-8 text-center text-sm text-fg-muted">{he.auth.resetPassword.subheading}</p>
            <ResetPasswordForm />
          </>
        )}
      </div>
    </div>
  );
}
