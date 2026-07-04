import type {
  DogAgeRange,
  FamilyStructure,
  SheddingPreference,
  SizePreference,
} from "@/lib/supabase/types";
import { ENUM_LABELS, he } from "@/lib/i18n/he";

/**
 * UI label lists for the `adopters` enum columns — single source of truth
 * shared by the profile form (as <select> options) and the read-only profile
 * view (as a value → label lookup via `getOptionLabel`). Values are typed
 * against the same literal unions as `lib/supabase/types.ts`'s `Database`
 * type, so a typo here is a compile error rather than a silent mismatch.
 * Labels are Hebrew, sourced from `lib/i18n/he.ts`'s `ENUM_LABELS` — the
 * underlying `value` sent to/stored in the DB is untouched.
 */

export const FAMILY_STRUCTURE_OPTIONS: { value: FamilyStructure; label: string }[] = [
  { value: "single", label: ENUM_LABELS.familyStructure.single },
  { value: "couple", label: ENUM_LABELS.familyStructure.couple },
  { value: "family", label: ENUM_LABELS.familyStructure.family },
];

export const SIZE_OPTIONS: { value: SizePreference; label: string }[] = [
  { value: "small", label: ENUM_LABELS.size.small },
  { value: "medium", label: ENUM_LABELS.size.medium },
  { value: "large", label: ENUM_LABELS.size.large },
  { value: "doesnt_matter", label: ENUM_LABELS.size.doesnt_matter },
];

export const SHEDS_OPTIONS: { value: SheddingPreference; label: string }[] = [
  { value: "no", label: ENUM_LABELS.sheds.no },
  { value: "doesnt_matter", label: ENUM_LABELS.sheds.doesnt_matter },
];

export const DOG_AGE_OPTIONS: { value: DogAgeRange; label: string }[] = [
  { value: "0-1", label: ENUM_LABELS.dogAge["0-1"] },
  { value: "1-3", label: ENUM_LABELS.dogAge["1-3"] },
  { value: "3-7", label: ENUM_LABELS.dogAge["3-7"] },
  { value: "7-10", label: ENUM_LABELS.dogAge["7-10"] },
  { value: "10+", label: ENUM_LABELS.dogAge["10+"] },
];

export const ENERGY_LEVEL_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: ENUM_LABELS.energyLevel[1] },
  { value: 2, label: ENUM_LABELS.energyLevel[2] },
  { value: 3, label: ENUM_LABELS.energyLevel[3] },
  { value: 4, label: ENUM_LABELS.energyLevel[4] },
  { value: 5, label: ENUM_LABELS.energyLevel[5] },
];

export function getOptionLabel<T extends string | number>(
  options: { value: T; label: string }[],
  value: T | null,
): string {
  if (value === null) return he.common.notSet;
  return options.find((option) => option.value === value)?.label ?? he.common.notSet;
}
