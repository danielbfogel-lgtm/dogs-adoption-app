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
