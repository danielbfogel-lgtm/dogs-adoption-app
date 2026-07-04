"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register } from "@/lib/auth-actions";
import { initialAuthActionState } from "@/lib/auth-state";
import { PasswordInput } from "@/components/auth/PasswordInput";

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(register, initialAuthActionState);

  return (
    <form action={formAction} className="w-full space-y-5" noValidate>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1.5 block w-full rounded-lg border border-divider-strong bg-surface px-3.5 py-2.5 text-base text-foreground placeholder:text-fg-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <PasswordInput name="password" label="Password" autoComplete="new-password" minLength={6} />
      <PasswordInput
        name="confirmPassword"
        label="Confirm password"
        autoComplete="new-password"
        minLength={6}
      />
      <p className="-mt-3 text-xs text-fg-muted">Must be at least 6 characters.</p>

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
        {isPending ? "Creating account…" : "Create account"}
      </button>

      <p className="text-center text-sm text-fg-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:text-primary-dark">
          Log in
        </Link>
      </p>
    </form>
  );
}
