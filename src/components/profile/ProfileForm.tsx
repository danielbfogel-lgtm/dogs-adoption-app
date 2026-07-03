"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { saveAdopterProfile } from "@/lib/adopter-actions";
import { initialAdopterFormState, type AdopterFormState } from "@/lib/adopter-state";
import { parseAdopterFormData, validateAdopterFormValues } from "@/lib/adopter-validation";
import {
  DOG_AGE_OPTIONS,
  ENERGY_LEVEL_OPTIONS,
  FAMILY_STRUCTURE_OPTIONS,
  SHEDS_OPTIONS,
  SIZE_OPTIONS,
} from "@/lib/adopter-options";
import { NumberField, SelectField, TextField } from "@/components/profile/FormField";
import type { Database } from "@/lib/supabase/types";

type AdopterRow = Database["public"]["Tables"]["adopters"]["Row"];

type FormValues = {
  first_name: string;
  last_name: string;
  birth_date: string;
  phone: string;
  family_structure: string;
  number_of_children: string;
  household_size: string;
  youngest_child_age: string;
  number_of_dogs: string;
  number_of_cats: string;
  energy_level: string;
  size: string;
  dog_age: string;
  sheds: string;
};

function toFormValues(adopter: AdopterRow | null): FormValues {
  return {
    first_name: adopter?.first_name ?? "",
    last_name: adopter?.last_name ?? "",
    birth_date: adopter?.birth_date ?? "",
    phone: adopter?.phone ?? "",
    family_structure: adopter?.family_structure ?? "",
    number_of_children: adopter?.number_of_children?.toString() ?? "",
    household_size: adopter?.household_size?.toString() ?? "",
    youngest_child_age: adopter?.youngest_child_age?.toString() ?? "",
    number_of_dogs: adopter?.number_of_dogs?.toString() ?? "",
    number_of_cats: adopter?.number_of_cats?.toString() ?? "",
    energy_level: adopter?.energy_level?.toString() ?? "",
    size: adopter?.size ?? "",
    dog_age: adopter?.dog_age ?? "",
    sheds: adopter?.sheds ?? "",
  };
}

/**
 * Runs the same validation the Server Action re-runs (see
 * lib/adopter-validation.ts) client-side first, so an invalid submit shows
 * inline errors instantly instead of round-tripping to the server. Passed
 * directly to `useActionState` — an action doesn't have to be a "use server"
 * function itself, only what it eventually calls does.
 */
async function validateThenSave(
  prevState: AdopterFormState,
  formData: FormData,
): Promise<AdopterFormState> {
  const values = parseAdopterFormData(formData);
  const fieldErrors = validateAdopterFormValues(values);

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Please fix the errors below.", fieldErrors };
  }

  return saveAdopterProfile(prevState, formData);
}

export function ProfileForm({ initialData }: { initialData: AdopterRow | null }) {
  const [state, formAction, isPending] = useActionState(validateThenSave, initialAdopterFormState);
  // Every field is controlled from this one object. React resets uncontrolled
  // <form action={fn}> fields back to their defaultValue once the action
  // settles — even on a validation-error submission — which would silently
  // wipe out everything the user just typed. Controlled state is immune to
  // that reset (see components/profile/FormField.tsx for the full note).
  //
  // `initialData` is only read on mount (lazy initializer) — safe today
  // because the caller (app/profile/edit/page.tsx) is a Server Component
  // that re-fetches and remounts this component on every navigation, keyed
  // by adopter id. If that ever changes, key the <ProfileForm> on
  // `initialData?.id` to force a remount when it changes.
  const [values, setValues] = useState<FormValues>(() => toFormValues(initialData));
  const formRef = useRef<HTMLFormElement>(null);
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  function updateField<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  // On a long form, the "Please fix the errors below" banner can land far
  // from the actual invalid field(s) — scroll the first one into view so the
  // user isn't left guessing which field to fix.
  useEffect(() => {
    if (Object.keys(state.fieldErrors).length === 0) return;
    formRef.current?.querySelector('[aria-invalid="true"]')?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [state.fieldErrors]);

  const hasChildren = Number(values.number_of_children) > 0;

  return (
    <form ref={formRef} action={formAction} className="space-y-8" noValidate>
      <fieldset className="space-y-5">
        <legend className="text-base font-semibold text-zinc-900">About you</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="first_name"
            label="First name"
            value={values.first_name}
            onChange={(value) => updateField("first_name", value)}
            autoComplete="given-name"
            required
            error={state.fieldErrors.first_name}
          />
          <TextField
            name="last_name"
            label="Last name"
            value={values.last_name}
            onChange={(value) => updateField("last_name", value)}
            autoComplete="family-name"
            required
            error={state.fieldErrors.last_name}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="birth_date"
            label="Date of birth"
            type="date"
            value={values.birth_date}
            onChange={(value) => updateField("birth_date", value)}
            max={todayIso}
            hint="Optional"
            error={state.fieldErrors.birth_date}
          />
          <TextField
            name="phone"
            label="Phone number"
            type="tel"
            value={values.phone}
            onChange={(value) => updateField("phone", value)}
            autoComplete="tel"
            required
            error={state.fieldErrors.phone}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="text-base font-semibold text-zinc-900">Your household</legend>
        <SelectField
          name="family_structure"
          label="Family structure"
          options={FAMILY_STRUCTURE_OPTIONS}
          value={values.family_structure}
          onChange={(value) => updateField("family_structure", value)}
          placeholder="Select your family structure"
          required
          error={state.fieldErrors.family_structure}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <NumberField
            name="number_of_children"
            label="Number of children"
            value={values.number_of_children}
            onChange={(value) => updateField("number_of_children", value)}
            required
            error={state.fieldErrors.number_of_children}
          />
          <NumberField
            name="household_size"
            label="Household size"
            value={values.household_size}
            onChange={(value) => updateField("household_size", value)}
            min={1}
            required
            hint="Everyone living in the home, including you"
            error={state.fieldErrors.household_size}
          />
        </div>
        {hasChildren && (
          <NumberField
            name="youngest_child_age"
            label="Youngest child's age"
            value={values.youngest_child_age}
            onChange={(value) => updateField("youngest_child_age", value)}
            required
            error={state.fieldErrors.youngest_child_age}
          />
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <NumberField
            name="number_of_dogs"
            label="Dogs currently at home"
            value={values.number_of_dogs}
            onChange={(value) => updateField("number_of_dogs", value)}
            required
            error={state.fieldErrors.number_of_dogs}
          />
          <NumberField
            name="number_of_cats"
            label="Cats currently at home"
            value={values.number_of_cats}
            onChange={(value) => updateField("number_of_cats", value)}
            required
            error={state.fieldErrors.number_of_cats}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="text-base font-semibold text-zinc-900">What you&apos;re looking for</legend>
        <SelectField
          name="energy_level"
          label="Preferred energy level"
          options={ENERGY_LEVEL_OPTIONS}
          value={values.energy_level}
          onChange={(value) => updateField("energy_level", value)}
          placeholder="Select an energy level"
          required
          error={state.fieldErrors.energy_level}
        />
        <SelectField
          name="size"
          label="Preferred size"
          options={SIZE_OPTIONS}
          value={values.size}
          onChange={(value) => updateField("size", value)}
          placeholder="Select a size preference"
          required
          error={state.fieldErrors.size}
        />
        <SelectField
          name="dog_age"
          label="Preferred dog age"
          options={DOG_AGE_OPTIONS}
          value={values.dog_age}
          onChange={(value) => updateField("dog_age", value)}
          placeholder="Select a preferred age range"
          required
          error={state.fieldErrors.dog_age}
        />
        <SelectField
          name="sheds"
          label="Shedding preference"
          options={SHEDS_OPTIONS}
          value={values.sheds}
          onChange={(value) => updateField("sheds", value)}
          placeholder="Select a shedding preference"
          required
          error={state.fieldErrors.sheds}
        />
      </fieldset>

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
        {isPending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
