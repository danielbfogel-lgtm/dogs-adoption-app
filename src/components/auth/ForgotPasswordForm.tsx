"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset } from "@/lib/auth-actions";
import { initialPasswordResetRequestState } from "@/lib/auth-state";
import { he } from "@/lib/i18n/he";

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset,
    initialPasswordResetRequestState,
  );

  if (state.success) {
    return (
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">{he.auth.forgotPassword.successHeading}</h2>
        <p className="mt-2 text-sm text-fg-muted">{he.auth.forgotPassword.successBody}</p>
        <Link
          href="/login"
          className="mt-6 inline-block font-semibold text-primary hover:text-primary-dark"
        >
          {he.auth.forgotPassword.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="w-full space-y-5" noValidate>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          {he.auth.forgotPassword.emailLabel}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          dir="ltr"
          className="mt-1.5 block w-full rounded-lg border border-divider-strong bg-surface px-3.5 py-2.5 text-base text-foreground placeholder:text-fg-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {state.error && (
        <p role="alert" aria-live="polite" className="text-sm font-medium text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? he.auth.forgotPassword.submitPending : he.auth.forgotPassword.submit}
      </button>

      <p className="text-center text-sm text-fg-muted">
        <Link href="/login" className="font-semibold text-primary hover:text-primary-dark">
          {he.auth.forgotPassword.backToLogin}
        </Link>
      </p>
    </form>
  );
}
