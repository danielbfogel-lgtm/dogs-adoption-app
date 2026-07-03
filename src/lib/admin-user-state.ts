/**
 * Shared type + initial value for the admin user forms' `useActionState`.
 * Kept separate from any action-holding file for the same reason as
 * lib/dog-state.ts: a "use server" file may only export async functions —
 * though these particular forms don't use Server Actions at all (they call
 * `lib/admin-users-api.ts`'s Python-backed fetch helpers instead), the
 * type/state split is kept for consistency with the rest of the codebase.
 */

export type AdminUserFormState = {
  error: string | null;
  fieldErrors: Record<string, string>;
};

export const initialAdminUserFormState: AdminUserFormState = { error: null, fieldErrors: {} };
