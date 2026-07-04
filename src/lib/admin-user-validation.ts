import { he } from "@/lib/i18n/he";
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
    errors.email = he.validation.adminUser.emailRequired;
  } else if (!EMAIL_PATTERN.test(values.email)) {
    errors.email = he.validation.adminUser.emailInvalid;
  }
}

function validatePasswordPair(values: UserFormValues, errors: Record<string, string>): void {
  if (values.password.length < 6) {
    errors.password = he.validation.adminUser.passwordMinLength;
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = he.validation.adminUser.passwordsMismatch;
  }
}

export function validateCreateUserValues(values: UserFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  validateEmail(values, errors);
  if (!values.role) errors.role = he.validation.adminUser.roleRequired;
  validatePasswordPair(values, errors);
  return errors;
}

/** Password/confirm are only validated if either was typed — blank means "keep the current password". */
export function validateEditUserValues(values: UserFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  validateEmail(values, errors);
  if (!values.role) errors.role = he.validation.adminUser.roleRequired;
  if (values.password || values.confirmPassword) validatePasswordPair(values, errors);
  return errors;
}
