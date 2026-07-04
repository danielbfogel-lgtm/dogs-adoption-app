/**
 * Shared type + initial value for the auth Server Actions' `useActionState`.
 * Deliberately NOT in lib/auth-actions.ts: a "use server" file may only
 * export async functions — exporting this plain object alongside the
 * actions throws "A 'use server' file can only export async functions,
 * found object" at runtime (build/type-check don't catch it).
 */

export type AuthActionState = {
  error: string | null;
};

export const initialAuthActionState: AuthActionState = { error: null };

/**
 * State for the "forgot password" request form. Unlike the other auth
 * actions, this one never redirects on success — it stays on the same page
 * and shows a "check your email" message, so it needs its own `success`
 * flag rather than reusing `AuthActionState`.
 */
export type PasswordResetRequestState = {
  error: string | null;
  success: boolean;
};

export const initialPasswordResetRequestState: PasswordResetRequestState = {
  error: null,
  success: false,
};
