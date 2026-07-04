"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { SelectField, TextField } from "@/components/profile/FormField";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { ProfileView } from "@/components/profile/ProfileView";
import { DeleteUserButton } from "@/components/admin/DeleteUserButton";
import { ToastStack } from "@/components/ToastStack";
import { useToasts } from "@/lib/use-toasts";
import {
  AdminUsersApiError,
  fetchUser,
  updateUser,
  type AdminUserDetail,
} from "@/lib/admin-users-api";
import { initialAdminUserFormState, type AdminUserFormState } from "@/lib/admin-user-state";
import { parseUserFormData, validateEditUserValues } from "@/lib/admin-user-validation";
import type { ProfileRole } from "@/lib/supabase/types";

const ROLE_OPTIONS: { value: ProfileRole; label: string }[] = [
  { value: "adopter", label: "Adopter" },
  { value: "admin", label: "Admin" },
];

/**
 * Admin "Edit User" form: email/role/optional-password, plus a read-only
 * view of the linked `adopters` row (if any). Unlike `DogForm`, the page
 * shell (`app/admin/users/[id]/page.tsx`) deliberately does NOT fetch the
 * user server-side — this component fetches from the Python API itself with
 * the browser's bearer token, mirroring `/matches`'s split (see
 * `MatchesDashboard.tsx`), since there's no admin RLS carve-out on
 * `profiles`/`adopters` for a Server Component to read through.
 */
export function EditUserForm({
  userId,
  currentAdminId,
}: {
  userId: string;
  currentAdminId: string;
}) {
  const router = useRouter();
  const isSelf = userId === currentAdminId;

  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ProfileRole | "">("");
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const { toasts, push, dismiss } = useToasts();

  useEffect(() => {
    const controller = new AbortController();
    fetchUser(userId, controller.signal)
      .then((data) => {
        setDetail(data);
        setEmail(data.profile.email ?? "");
        setRole(data.profile.role);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setLoadError(err instanceof AdminUsersApiError ? err.message : "Couldn't load this user.");
      });
    return () => controller.abort();
  }, [userId, reloadKey]);

  async function validateThenUpdate(
    _prevState: AdminUserFormState,
    formData: FormData,
  ): Promise<AdminUserFormState> {
    setSavedMessage(null);
    if (!detail) return { error: "Still loading — please try again.", fieldErrors: {} };

    const values = parseUserFormData(formData);
    const fieldErrors = validateEditUserValues(values);
    if (Object.keys(fieldErrors).length > 0) {
      return { error: "Please fix the errors below.", fieldErrors };
    }

    const payload: Partial<{ email: string; password: string; role: ProfileRole }> = {};
    if (values.email !== (detail.profile.email ?? "")) payload.email = values.email;
    if (values.role !== detail.profile.role) payload.role = values.role as ProfileRole;
    if (values.password) payload.password = values.password;

    if (Object.keys(payload).length === 0) {
      setSavedMessage("No changes to save.");
      return initialAdminUserFormState;
    }

    try {
      const updatedProfile = await updateUser(userId, payload);
      setDetail((prev) => (prev ? { ...prev, profile: updatedProfile } : prev));
      setEmail(updatedProfile.email ?? "");
      setRole(updatedProfile.role);
      setSavedMessage("User updated.");
      return initialAdminUserFormState;
    } catch (err) {
      const message = err instanceof AdminUsersApiError ? err.message : "Failed to update user.";
      return { error: message, fieldErrors: {} };
    }
  }

  const [state, formAction, isPending] = useActionState(
    validateThenUpdate,
    initialAdminUserFormState,
  );

  if (loadError) {
    return (
      <div className="mt-12 flex flex-col items-center gap-3 text-center text-fg-muted">
        <p role="alert" className="text-sm font-medium text-danger">
          {loadError}
        </p>
        <button
          type="button"
          onClick={() => {
            setLoadError(null);
            setReloadKey((key) => key + 1);
          }}
          className="flex h-11 items-center gap-2 rounded-lg border border-divider-strong px-4 text-sm font-semibold text-fg-secondary hover:bg-surface-muted"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="mt-12 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-fg-subtle" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
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
          <SelectField
            name="role"
            label="Role"
            options={ROLE_OPTIONS}
            value={role}
            onChange={(value) => setRole(value as ProfileRole)}
            placeholder="Select a role"
            required
            disabled={isSelf}
            error={state.fieldErrors.role}
          />
          {/* A disabled <select> submits nothing — carry the frozen value
              separately so the form still round-trips `role` unchanged. */}
          {isSelf && <input type="hidden" name="role" value={role} />}
          {isSelf && (
            <p className="mt-1.5 text-xs text-fg-muted">You can&apos;t change your own role.</p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <PasswordInput
              name="password"
              label="New password"
              autoComplete="new-password"
              minLength={6}
              required={false}
            />
            {state.fieldErrors.password && (
              <p role="alert" className="mt-1 text-xs font-medium text-danger">
                {state.fieldErrors.password}
              </p>
            )}
          </div>
          <div>
            <PasswordInput
              name="confirmPassword"
              label="Confirm new password"
              autoComplete="new-password"
              minLength={6}
              required={false}
            />
            {state.fieldErrors.confirmPassword && (
              <p role="alert" className="mt-1 text-xs font-medium text-danger">
                {state.fieldErrors.confirmPassword}
              </p>
            )}
          </div>
        </div>
        <p className="-mt-3 text-xs text-fg-muted">Leave the password fields blank to keep the current password.</p>

        {state.error && (
          <p role="alert" aria-live="polite" className="text-sm font-medium text-danger">
            {state.error}
          </p>
        )}
        {!state.error && savedMessage && (
          <p role="status" aria-live="polite" className="text-sm font-medium text-success">
            {savedMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
      </form>

      <section className="border-t border-divider pt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-foreground">Household &amp; matching profile (read-only)</h2>
          {!isSelf && (
            <DeleteUserButton
              id={userId}
              onDeleted={() => router.push("/admin/users")}
              onError={(message) => push(message, "error")}
            />
          )}
        </div>
        <div className="mt-4">
          {detail.adopter ? (
            <ProfileView adopter={detail.adopter} />
          ) : (
            <p className="text-sm text-fg-muted">No adopter profile submitted yet.</p>
          )}
        </div>
      </section>

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
