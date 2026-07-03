import type { DogSize, DogStatus } from "@/lib/supabase/types";

/**
 * UI label lists for the `dogs` enum columns — shared by the gallery card,
 * dog detail page, and (eventually) admin dog forms. Mirrors the pattern in
 * `lib/adopter-options.ts`.
 */

export const DOG_SIZE_OPTIONS: { value: DogSize; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

export const DOG_STATUS_OPTIONS: { value: DogStatus; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "pending", label: "Pending" },
  { value: "adopted", label: "Adopted" },
];

// `dogs.breed` is a plain `text` column (no CHECK constraint) — SPEC.md §2
// calls it an "Enum" with "Mixed [Default] ... etc. (Alphabetical order)",
// but since the DB doesn't actually restrict the value, `DogForm` offers
// this curated list (Mixed pinned first, rest alphabetical) plus an
// "Other" escape hatch that reveals a free-text field, rather than a hard
// `<select>` that would block entering a breed not on the list.
export const DOG_BREED_OTHER_VALUE = "__other__";

export const DOG_BREED_OPTIONS: { value: string; label: string }[] = [
  { value: "Mixed", label: "Mixed" },
  { value: "Amstaff", label: "Amstaff (American Staffordshire Terrier)" },
  { value: "Beagle", label: "Beagle" },
  { value: "Boxer", label: "Boxer" },
  { value: "Bulldog", label: "Bulldog" },
  { value: "Chihuahua", label: "Chihuahua" },
  { value: "Cocker Spaniel", label: "Cocker Spaniel" },
  { value: "Dachshund", label: "Dachshund" },
  { value: "Doberman", label: "Doberman" },
  { value: "German Shepherd", label: "German Shepherd" },
  { value: "Golden Retriever", label: "Golden Retriever" },
  { value: "Great Dane", label: "Great Dane" },
  { value: "Husky", label: "Husky" },
  { value: "Labrador Retriever", label: "Labrador Retriever" },
  { value: "Maltese", label: "Maltese" },
  { value: "Pitbull", label: "Pitbull" },
  { value: "Poodle", label: "Poodle" },
  { value: "Pug", label: "Pug" },
  { value: "Rottweiler", label: "Rottweiler" },
  { value: "Shih Tzu", label: "Shih Tzu" },
  { value: "Yorkshire Terrier", label: "Yorkshire Terrier" },
  { value: DOG_BREED_OTHER_VALUE, label: "Other…" },
];

// Tri-state yes/no for the nullable `good_with_*`/`sheds` boolean columns —
// paired with a SelectField whose empty placeholder means "Unknown" (null),
// not a forced yes/no.
export const DOG_BOOLEAN_OPTIONS: { value: "true" | "false"; label: string }[] = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
];

export function getOptionLabel<T extends string>(
  options: { value: T; label: string }[],
  value: T | null,
): string {
  if (value === null) return "Unknown";
  return options.find((option) => option.value === value)?.label ?? "Unknown";
}

export function formatAge(age: number | null): string {
  if (age === null) return "Age unknown";
  if (age === 0) return "Under 1 year";
  return age === 1 ? "1 year old" : `${age} years old`;
}
