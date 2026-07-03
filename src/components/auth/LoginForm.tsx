"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/lib/auth-actions";
import { initialAuthActionState } from "@/lib/auth-state";
import { PasswordInput } from "@/components/auth/PasswordInput";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, isPending] = useActionState(login, initialAuthActionState);

  return (
    <form action={formAction} className="w-full space-y-5" noValidate>
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-zinc-900">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1.5 block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <PasswordInput name="password" label="Password" autoComplete="current-password" />

      {state.error && (
        <p role="alert" aria-live="polite" className="text-sm font-medium text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Logging in…" : "Log in"}
      </button>

      <p className="text-center text-sm text-zinc-600">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-primary hover:text-primary-dark">
          Register
        </Link>
      </p>
    </form>
  );
}
