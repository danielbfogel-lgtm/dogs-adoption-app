import type {
  DogAgeRange,
  FamilyStructure,
  SheddingPreference,
  SizePreference,
} from "@/lib/supabase/types";

/**
 * Parsing + validation shared by the client form (`ProfileForm`, for instant
 * feedback with no round trip) and the `saveAdopterProfile` Server Action
 * (authoritative — the client can't be trusted). Keeping one copy of the
 * rules avoids the two drifting apart.
 */

export type AdopterFormValues = {
  first_name: string | null;
  last_name: string | null;
  birth_date: string | null;
  family_structure: FamilyStructure | null;
  household_size: number | null;
  energy_level: number | null;
  size: SizePreference | null;
  sheds: SheddingPreference | null;
  dog_age: DogAgeRange | null;
  phone: string | null;
  number_of_children: number | null;
  youngest_child_age: number | null;
  number_of_dogs: number | null;
  number_of_cats: number | null;
};

// Requires at least 7 digit characters somewhere in the 7-20 char string, so
// punctuation-only input (e.g. "-------") doesn't pass as a "phone number".
const PHONE_PATTERN = /^(?=(?:.*\d){7,})[0-9+()\-.\s]{7,20}$/;

function toNullableString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// This is the server-side trust boundary (also used for client-side UX), so
// reject malformed input outright rather than letting parseInt silently
// truncate trailing garbage (e.g. "12abc" -> 12).
function toInt(value: FormDataEntryValue | null): number | null {
  const str = toNullableString(value);
  if (str === null || !/^-?\d+$/.test(str)) return null;
  return Number.parseInt(str, 10);
}

function toFamilyStructure(value: FormDataEntryValue | null): FamilyStructure | null {
  const str = toNullableString(value);
  return str === "single" || str === "couple" || str === "family" ? str : null;
}

function toSize(value: FormDataEntryValue | null): SizePreference | null {
  const str = toNullableString(value);
  return str === "small" || str === "medium" || str === "large" || str === "doesnt_matter"
    ? str
    : null;
}

function toSheds(value: FormDataEntryValue | null): SheddingPreference | null {
  const str = toNullableString(value);
  return str === "no" || str === "doesnt_matter" ? str : null;
}

function toDogAge(value: FormDataEntryValue | null): DogAgeRange | null {
  const str = toNullableString(value);
  return str === "0-1" || str === "1-3" || str === "3-7" || str === "7-10" || str === "10+"
    ? str
    : null;
}

export function parseAdopterFormData(formData: FormData): AdopterFormValues {
  return {
    first_name: toNullableString(formData.get("first_name")),
    last_name: toNullableString(formData.get("last_name")),
    birth_date: toNullableString(formData.get("birth_date")),
    family_structure: toFamilyStructure(formData.get("family_structure")),
    household_size: toInt(formData.get("household_size")),
    energy_level: toInt(formData.get("energy_level")),
    size: toSize(formData.get("size")),
    sheds: toSheds(formData.get("sheds")),
    dog_age: toDogAge(formData.get("dog_age")),
    phone: toNullableString(formData.get("phone")),
    number_of_children: toInt(formData.get("number_of_children")),
    youngest_child_age: toInt(formData.get("youngest_child_age")),
    number_of_dogs: toInt(formData.get("number_of_dogs")),
    number_of_cats: toInt(formData.get("number_of_cats")),
  };
}

/** Returns a map of field name → error message; empty when the form is valid. */
export function validateAdopterFormValues(values: AdopterFormValues): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.first_name) errors.first_name = "First name is required.";
  if (!values.last_name) errors.last_name = "Last name is required.";

  if (values.birth_date) {
    const parsed = new Date(values.birth_date);
    if (Number.isNaN(parsed.getTime())) {
      errors.birth_date = "Enter a valid date.";
    } else if (parsed.getTime() > Date.now()) {
      errors.birth_date = "Birth date can't be in the future.";
    }
  }

  if (!values.family_structure) {
    errors.family_structure = "Please select a family structure.";
  }

  if (values.household_size === null || values.household_size < 1) {
    errors.household_size = "Household size must be at least 1.";
  }

  if (values.energy_level === null || values.energy_level < 1 || values.energy_level > 5) {
    errors.energy_level = "Select a preferred energy level.";
  }

  if (!values.size) errors.size = "Please select a size preference.";
  if (!values.sheds) errors.sheds = "Please select a shedding preference.";
  if (!values.dog_age) errors.dog_age = "Please select a preferred dog age.";

  if (!values.phone) {
    errors.phone = "Phone number is required.";
  } else if (!PHONE_PATTERN.test(values.phone)) {
    errors.phone = "Enter a valid phone number (7-20 digits).";
  }

  if (values.number_of_children === null || values.number_of_children < 0) {
    errors.number_of_children = "Must be 0 or more.";
  }
  if (values.number_of_dogs === null || values.number_of_dogs < 0) {
    errors.number_of_dogs = "Must be 0 or more.";
  }
  if (values.number_of_cats === null || values.number_of_cats < 0) {
    errors.number_of_cats = "Must be 0 or more.";
  }

  if (
    values.number_of_children !== null &&
    values.number_of_children > 0 &&
    (values.youngest_child_age === null || values.youngest_child_age < 0)
  ) {
    errors.youngest_child_age = "Required when you have children.";
  }

  return errors;
}
