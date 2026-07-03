"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { SelectField, TextField } from "@/components/profile/FormField";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { AdminUsersApiError, createUser } from "@/lib/admin-users-api";
import { initialAdminUserFormState, type AdminUserFormState } from "@/lib/admin-user-state";
import { parseUserFormData, validateCreateUserValues } from "@/lib/admin-user-validation";
import type { ProfileRole } from "@/lib/supabase/types";

const ROLE_OPTIONS: { value: ProfileRole; label: string }[] = [
  { value: "adopter", label: "Adopter" },
  { value: "admin", label: "Admin" },
];

/**
 * Admin "Create User" form. The "action" passed to `useActionState` is a
 * plain client function — not a `"use server"` Server Action — since it
 * calls the Python Admin Auth API (`lib/admin-users-api.ts`) rather than
 * doing an RLS-scoped Supabase mutation (see the plan's architecture
 * decision: `profiles`/`adopters` have no admin RLS carve-out). It's defined
 * inside the component (not module-level, unlike `DogForm`'s
 * `validateThenSave`) so it can close over `useRouter()` for client-side
 * navigation on success — `next/navigation`'s `redirect()` only works in
 * Server Components/Actions, not here.
 *
 * `email`/`role` are controlled (like `EditUserForm.tsx`), not left
 * uncontrolled the way `RegisterForm.tsx`'s smaller form does — React resets
 * *all* uncontrolled `<form action>` fields back to blank once the action
 * settles, even on a failed submission (see `FormField.tsx`'s comment on
 * this). The most likely real error here is a 409 "email already exists",
 * exactly the case where the admin needs their typed email preserved to see
 * and fix it. Password fields stay uncontrolled (`PasswordInput`) — losing a
 * short, blank-on-load password on a failed submit is a minor retype, not
 * lost work.
 */
export function CreateUserForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ProfileRole | "">("adopter");

  async function validateThenCreate(
    _prevState: AdminUserFormState,
    formData: FormData,
  ): Promise<AdminUserFormState> {
    const values = parseUserFormData(formData);
    const fieldErrors = validateCreateUserValues(values);
    if (Object.keys(fieldErrors).length > 0) {
      return { error: "Please fix the errors below.", fieldErrors };
    }

    try {
      const user = await createUser({
        email: values.email,
        password: values.password,
        role: values.role as ProfileRole,
      });
      router.push(`/admin/users/${user.id}`);
      return initialAdminUserFormState;
    } catch (err) {
      const message = err instanceof AdminUsersApiError ? err.message : "Failed to create user.";
      return { error: message, fieldErrors: {} };
    }
  }

  const [state, formAction, isPending] = useActionState(
    validateThenCreate,
    initialAdminUserFormState,
  );

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <TextField
        name="email"
        label="Email"
        value={email}
        onChange={setEmail}
        required
        autoComplete="email"
        error={state.fieldErrors.email}
      />

      <div>
        <PasswordInput name="password" label="Password" autoComplete="new-password" minLength={6} />
        {state.fieldErrors.password && (
          <p role="alert" className="mt-1 text-xs font-medium text-red-600">
            {state.fieldErrors.password}
          </p>
        )}
      </div>

      <div>
        <PasswordInput
          name="confirmPassword"
          label="Confirm password"
          autoComplete="new-password"
          minLength={6}
        />
        {state.fieldErrors.confirmPassword && (
          <p role="alert" className="mt-1 text-xs font-medium text-red-600">
            {state.fieldErrors.confirmPassword}
          </p>
        )}
      </div>
      <p className="-mt-3 text-xs text-zinc-500">Must be at least 6 characters.</p>

      <SelectField
        name="role"
        label="Role"
        options={ROLE_OPTIONS}
        value={role}
        onChange={(value) => setRole(value as ProfileRole)}
        placeholder="Select a role"
        required
        error={state.fieldErrors.role}
      />

      {state.error && (
        <p role="alert" aria-live="polite" className="text-sm font-medium text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {isPending ? "Creating…" : "Create user"}
      </button>
    </form>
  );
}
