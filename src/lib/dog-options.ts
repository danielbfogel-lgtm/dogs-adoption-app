import type { DogSize, DogStatus } from "@/lib/supabase/types";
import { ENUM_LABELS, he } from "@/lib/i18n/he";

/**
 * UI label lists for the `dogs` enum columns — shared by the gallery card,
 * dog detail page, and (eventually) admin dog forms. Mirrors the pattern in
 * `lib/adopter-options.ts`. Labels are Hebrew, sourced from `lib/i18n/he.ts`'s
 * `ENUM_LABELS` — the underlying `value` sent to/stored in the DB is untouched.
 */

export const DOG_SIZE_OPTIONS: { value: DogSize; label: string }[] = [
  { value: "small", label: ENUM_LABELS.size.small },
  { value: "medium", label: ENUM_LABELS.size.medium },
  { value: "large", label: ENUM_LABELS.size.large },
];

export const DOG_STATUS_OPTIONS: { value: DogStatus; label: string }[] = [
  { value: "available", label: ENUM_LABELS.dogStatus.available },
  { value: "pending", label: ENUM_LABELS.dogStatus.pending },
  { value: "adopted", label: ENUM_LABELS.dogStatus.adopted },
];

// `dogs.breed` is a plain `text` column (no CHECK constraint) — SPEC.md §2
// calls it an "Enum" with "Mixed [Default] ... etc. (Alphabetical order)",
// but since the DB doesn't actually restrict the value, `DogForm` offers
// this curated list (Mixed pinned first, rest alphabetical) plus an
// "Other" escape hatch that reveals a free-text field, rather than a hard
// `<select>` that would block entering a breed not on the list.
export const DOG_BREED_OTHER_VALUE = "__other__";

export const DOG_BREED_OPTIONS: { value: string; label: string }[] = [
  { value: "Mixed", label: ENUM_LABELS.dogBreed.Mixed },
  { value: "Amstaff", label: ENUM_LABELS.dogBreed.Amstaff },
  { value: "Beagle", label: ENUM_LABELS.dogBreed.Beagle },
  { value: "Boxer", label: ENUM_LABELS.dogBreed.Boxer },
  { value: "Bulldog", label: ENUM_LABELS.dogBreed.Bulldog },
  { value: "Chihuahua", label: ENUM_LABELS.dogBreed.Chihuahua },
  { value: "Cocker Spaniel", label: ENUM_LABELS.dogBreed["Cocker Spaniel"] },
  { value: "Dachshund", label: ENUM_LABELS.dogBreed.Dachshund },
  { value: "Doberman", label: ENUM_LABELS.dogBreed.Doberman },
  { value: "German Shepherd", label: ENUM_LABELS.dogBreed["German Shepherd"] },
  { value: "Golden Retriever", label: ENUM_LABELS.dogBreed["Golden Retriever"] },
  { value: "Great Dane", label: ENUM_LABELS.dogBreed["Great Dane"] },
  { value: "Husky", label: ENUM_LABELS.dogBreed.Husky },
  { value: "Labrador Retriever", label: ENUM_LABELS.dogBreed["Labrador Retriever"] },
  { value: "Maltese", label: ENUM_LABELS.dogBreed.Maltese },
  { value: "Pitbull", label: ENUM_LABELS.dogBreed.Pitbull },
  { value: "Poodle", label: ENUM_LABELS.dogBreed.Poodle },
  { value: "Pug", label: ENUM_LABELS.dogBreed.Pug },
  { value: "Rottweiler", label: ENUM_LABELS.dogBreed.Rottweiler },
  { value: "Shih Tzu", label: ENUM_LABELS.dogBreed["Shih Tzu"] },
  { value: "Yorkshire Terrier", label: ENUM_LABELS.dogBreed["Yorkshire Terrier"] },
  { value: DOG_BREED_OTHER_VALUE, label: ENUM_LABELS.dogBreed.__other__ },
];

// Tri-state yes/no for the nullable `good_with_*`/`sheds` boolean columns —
// paired with a SelectField whose empty placeholder means "Unknown" (null),
// not a forced yes/no.
export const DOG_BOOLEAN_OPTIONS: { value: "true" | "false"; label: string }[] = [
  { value: "true", label: ENUM_LABELS.dogBoolean.true },
  { value: "false", label: ENUM_LABELS.dogBoolean.false },
];

export function getOptionLabel<T extends string>(
  options: { value: T; label: string }[],
  value: T | null,
): string {
  if (value === null) return he.common.unknown;
  return options.find((option) => option.value === value)?.label ?? he.common.unknown;
}

export function formatAge(age: number | null): string {
  if (age === null) return he.format.ageUnknown;
  if (age === 0) return he.format.ageUnderOneYear;
  return age === 1 ? he.format.ageOneYearOld : he.format.ageYearsOldTemplate.replace("{age}", String(age));
}
