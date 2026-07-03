/**
 * Shared type + initial value for the dog admin form's `useActionState`.
 * Deliberately NOT in lib/dog-actions.ts: a "use server" file may only
 * export async functions (see lib/adopter-state.ts for the same split).
 */

export type DogFormState = {
  error: string | null;
  fieldErrors: Record<string, string>;
};

export const initialDogFormState: DogFormState = { error: null, fieldErrors: {} };
