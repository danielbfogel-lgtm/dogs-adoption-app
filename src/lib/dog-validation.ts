import { he } from "@/lib/i18n/he";
import type { DogSize, DogStatus } from "@/lib/supabase/types";

/**
 * Parsing + validation shared by the client form (`DogForm`, for instant
 * feedback with no round trip) and the `saveDog` Server Action (authoritative
 * — the client can't be trusted). Mirrors `lib/adopter-validation.ts`'s
 * pattern so the two domains don't drift in style.
 */

export type DogFormValues = {
  name: string | null;
  birth_date: string | null;
  breed: string | null;
  size: DogSize | null;
  energy_level: number | null;
  good_with_children: boolean | null;
  good_with_dogs: boolean | null;
  good_with_cats: boolean | null;
  sheds: boolean | null;
  free_description: string | null;
  status: DogStatus | null;
  photo_url: string | null;
};

function toNullableString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// Server-side trust boundary (also used for client-side UX) — reject
// malformed input outright rather than letting parseInt silently truncate
// trailing garbage (e.g. "12abc" -> 12). Mirrors adopter-validation.ts.
function toInt(value: FormDataEntryValue | null): number | null {
  const str = toNullableString(value);
  if (str === null || !/^-?\d+$/.test(str)) return null;
  return Number.parseInt(str, 10);
}

// Tri-state: "true"/"false" map to the boolean, anything else (including the
// unselected "" placeholder) means "unknown" — dogs' good_with_*/sheds
// columns are nullable booleans, not required yes/no answers.
function toBoolean(value: FormDataEntryValue | null): boolean | null {
  const str = toNullableString(value);
  if (str === "true") return true;
  if (str === "false") return false;
  return null;
}

function toDogSize(value: FormDataEntryValue | null): DogSize | null {
  const str = toNullableString(value);
  return str === "small" || str === "medium" || str === "large" ? str : null;
}

function toDogStatus(value: FormDataEntryValue | null): DogStatus | null {
  const str = toNullableString(value);
  return str === "available" || str === "pending" || str === "adopted" ? str : null;
}

export function parseDogFormData(formData: FormData): DogFormValues {
  return {
    name: toNullableString(formData.get("name")),
    birth_date: toNullableString(formData.get("birth_date")),
    breed: toNullableString(formData.get("breed")),
    size: toDogSize(formData.get("size")),
    energy_level: toInt(formData.get("energy_level")),
    good_with_children: toBoolean(formData.get("good_with_children")),
    good_with_dogs: toBoolean(formData.get("good_with_dogs")),
    good_with_cats: toBoolean(formData.get("good_with_cats")),
    sheds: toBoolean(formData.get("sheds")),
    free_description: toNullableString(formData.get("free_description")),
    status: toDogStatus(formData.get("status")),
    photo_url: toNullableString(formData.get("photo_url")),
  };
}

/** Returns a map of field name → error message; empty when the form is valid. */
export function validateDogFormValues(values: DogFormValues): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.name) errors.name = he.validation.dog.nameRequired;

  if (values.birth_date) {
    const parsed = new Date(values.birth_date);
    if (Number.isNaN(parsed.getTime())) {
      errors.birth_date = he.validation.dog.invalidDate;
    } else if (parsed.getTime() > Date.now()) {
      errors.birth_date = he.validation.dog.birthDateFuture;
    }
  }

  if (!values.size) errors.size = he.validation.dog.sizeRequired;

  if (values.energy_level === null || values.energy_level < 1 || values.energy_level > 5) {
    errors.energy_level = he.validation.dog.energyLevelRequired;
  }

  if (!values.status) errors.status = he.validation.dog.statusRequired;

  // `DogPhotoUploadField` only ever produces an https Supabase Storage
  // public URL, so this should never trip in the real UI — it's
  // defense-in-depth against a bypassed/malformed submission (CLAUDE.md:
  // "Validate all inputs before querying Supabase"), since `photo_url` is
  // rendered straight into next/image's `src` (`DogPhoto.tsx`).
  if (values.photo_url && !/^https:\/\//.test(values.photo_url)) {
    errors.photo_url = he.validation.dog.photoUrlInvalid;
  }

  return errors;
}

/**
 * `dogs.age` has no auto-calc trigger (see lib/supabase/types.ts's comment on
 * `DogRow`) — the admin form computes it here, server-side, from
 * `birth_date` at save time. Returns `null` when there's no birth date to
 * derive it from (age then reads as "Unknown" via `formatAge`, same as any
 * pre-existing row with no age). Whole years only, matching the `age
 * integer check (age >= 0)` column.
 */
export function computeAgeFromBirthDate(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;

  // `new Date("YYYY-MM-DD")` parses as UTC midnight. Using the local
  // getFullYear()/getMonth()/getDate() accessors here (as this used to) mixes
  // a UTC instant with a local calendar read: in any timezone west of UTC,
  // that instant can localize to the previous calendar day, which produces a
  // genuine one-year age error on the dog's actual birthday each year. Do the
  // whole comparison in UTC so parsing and comparison share one basis.
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const hasNotHadBirthdayThisYear =
    now.getUTCMonth() < birth.getUTCMonth() ||
    (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate());
  if (hasNotHadBirthdayThisYear) age -= 1;

  return age >= 0 ? age : null;
}
