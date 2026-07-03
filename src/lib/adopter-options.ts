import type {
  DogAgeRange,
  FamilyStructure,
  SheddingPreference,
  SizePreference,
} from "@/lib/supabase/types";

/**
 * UI label lists for the `adopters` enum columns — single source of truth
 * shared by the profile form (as <select> options) and the read-only profile
 * view (as a value → label lookup via `getOptionLabel`). Values are typed
 * against the same literal unions as `lib/supabase/types.ts`'s `Database`
 * type, so a typo here is a compile error rather than a silent mismatch.
 */

export const FAMILY_STRUCTURE_OPTIONS: { value: FamilyStructure; label: string }[] = [
  { value: "single", label: "Single" },
  { value: "couple", label: "Couple (no children)" },
  { value: "family", label: "Family (with children)" },
];

export const SIZE_OPTIONS: { value: SizePreference; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "doesnt_matter", label: "Doesn't matter" },
];

export const SHEDS_OPTIONS: { value: SheddingPreference; label: string }[] = [
  { value: "no", label: "No shedding" },
  { value: "doesnt_matter", label: "Doesn't matter" },
];

export const DOG_AGE_OPTIONS: { value: DogAgeRange; label: string }[] = [
  { value: "0-1", label: "0–1 years (puppy)" },
  { value: "1-3", label: "1–3 years" },
  { value: "3-7", label: "3–7 years" },
  { value: "7-10", label: "7–10 years" },
  { value: "10+", label: "10+ years (senior)" },
];

export const ENERGY_LEVEL_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "1 — Very low" },
  { value: 2, label: "2 — Low" },
  { value: 3, label: "3 — Moderate" },
  { value: 4, label: "4 — High" },
  { value: 5, label: "5 — Very high" },
];

export function getOptionLabel<T extends string | number>(
  options: { value: T; label: string }[],
  value: T | null,
): string {
  if (value === null) return "Not set";
  return options.find((option) => option.value === value)?.label ?? "Not set";
}
