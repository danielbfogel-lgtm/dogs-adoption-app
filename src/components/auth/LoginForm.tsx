"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/lib/auth-actions";
import { initialAuthActionState } from "@/lib/auth-state";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { he } from "@/lib/i18n/he";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, isPending] = useActionState(login, initialAuthActionState);

  return (
    <form action={formAction} className="w-full space-y-5" noValidate>
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          {he.auth.login.emailLabel}
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

      <PasswordInput name="password" label={he.auth.login.passwordLabel} autoComplete="current-password" />

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
        {isPending ? he.auth.login.submitPending : he.auth.login.submit}
      </button>

      <p className="text-center text-sm text-fg-muted">
        {he.auth.login.noAccount}
        <Link href="/register" className="font-semibold text-primary hover:text-primary-dark">
          {he.auth.login.registerLink}
        </Link>
      </p>
    </form>
  );
}
