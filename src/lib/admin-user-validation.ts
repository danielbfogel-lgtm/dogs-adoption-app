import type { ProfileRole } from "@/lib/supabase/types";

/**
 * Parsing + validation shared by `CreateUserForm`/`EditUserForm` (both call
 * their respective `validate*` function client-side for instant feedback,
 * before the Python API — the actual trust boundary, per `api/admin_users.py` —
 * re-validates). Mirrors `lib/dog-validation.ts`'s pattern.
 */

export type UserFormValues = {
  email: string;
  password: string;
  confirmPassword: string;
  role: ProfileRole | "";
};

function toTrimmedString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function toRawString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

function toRole(value: FormDataEntryValue | null): ProfileRole | "" {
  const str = toTrimmedString(value);
  return str === "adopter" || str === "admin" ? str : "";
}

export function parseUserFormData(formData: FormData): UserFormValues {
  return {
    email: toTrimmedString(formData.get("email")),
    password: toRawString(formData.get("password")),
    confirmPassword: toRawString(formData.get("confirmPassword")),
    role: toRole(formData.get("role")),
  };
}

// Deliberately loose (CLAUDE.md: "validate all inputs before querying
// Supabase") — real format enforcement is Supabase Admin Auth API's own
// (mapped to a clean 400 via `email_address_invalid` in `api/admin_users.py`),
// this is just for faster feedback before a round trip.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(values: UserFormValues, errors: Record<string, string>): void {
  if (!values.email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(values.email)) {
    errors.email = "Enter a valid email address.";
  }
}

function validatePasswordPair(values: UserFormValues, errors: Record<string, string>): void {
  if (values.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }
}

export function validateCreateUserValues(values: UserFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  validateEmail(values, errors);
  if (!values.role) errors.role = "Please select a role.";
  validatePasswordPair(values, errors);
  return errors;
}

/** Password/confirm are only validated if either was typed — blank means "keep the current password". */
export function validateEditUserValues(values: UserFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  validateEmail(values, errors);
  if (!values.role) errors.role = "Please select a role.";
  if (values.password || values.confirmPassword) validatePasswordPair(values, errors);
  return errors;
}
