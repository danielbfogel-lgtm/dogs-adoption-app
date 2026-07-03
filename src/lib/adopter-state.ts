/**
 * Shared type + initial value for the adopter profile form's
 * `useActionState`. Deliberately NOT in lib/adopter-actions.ts: a
 * "use server" file may only export async functions (see lib/auth-state.ts
 * for the same split, and why).
 */

export type AdopterFormState = {
  error: string | null;
  fieldErrors: Record<string, string>;
};

export const initialAdopterFormState: AdopterFormState = { error: null, fieldErrors: {} };
