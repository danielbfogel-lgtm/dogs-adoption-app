"use client";

import { useActionState } from "react";
import { updatePassword } from "@/lib/auth-actions";
import { initialAuthActionState } from "@/lib/auth-state";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { he } from "@/lib/i18n/he";

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(updatePassword, initialAuthActionState);

  return (
    <form action={formAction} className="w-full space-y-5" noValidate>
      <PasswordInput
        name="password"
        label={he.auth.resetPassword.passwordLabel}
        autoComplete="new-password"
        minLength={6}
      />
      <PasswordInput
        name="confirmPassword"
        label={he.auth.resetPassword.confirmPasswordLabel}
        autoComplete="new-password"
        minLength={6}
      />
      <p className="-mt-3 text-xs text-fg-muted">{he.auth.resetPassword.passwordHint}</p>

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
        {isPending ? he.auth.resetPassword.submitPending : he.auth.resetPassword.submit}
      </button>
    </form>
  );
}
