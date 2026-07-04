"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { saveDog } from "@/lib/dog-actions";
import { initialDogFormState, type DogFormState } from "@/lib/dog-state";
import { parseDogFormData, validateDogFormValues } from "@/lib/dog-validation";
import {
  DOG_BOOLEAN_OPTIONS,
  DOG_BREED_OPTIONS,
  DOG_BREED_OTHER_VALUE,
  DOG_SIZE_OPTIONS,
  DOG_STATUS_OPTIONS,
} from "@/lib/dog-options";
// Dogs' energy_level is the same 1-5 scale as adopters' preferred energy
// level (identical values/labels) — reused rather than duplicated.
import { ENERGY_LEVEL_OPTIONS } from "@/lib/adopter-options";
import { SelectField, TextareaField, TextField } from "@/components/profile/FormField";
import { DogPhotoUploadField } from "@/components/dogs/DogPhotoUploadField";
import type { Database } from "@/lib/supabase/types";

type DogRow = Database["public"]["Tables"]["dogs"]["Row"];

type FormValues = {
  name: string;
  birth_date: string;
  breedSelect: string;
  breedCustom: string;
  size: string;
  energy_level: string;
  good_with_children: string;
  good_with_dogs: string;
  good_with_cats: string;
  sheds: string;
  free_description: string;
  status: string;
  photo_url: string | null;
};

const KNOWN_BREED_VALUES = new Set(
  DOG_BREED_OPTIONS.filter((option) => option.value !== DOG_BREED_OTHER_VALUE).map((option) => option.value),
);

function boolToFormValue(value: boolean | null): string {
  if (value === true) return "true";
  if (value === false) return "false";
  return "";
}

function toFormValues(dog: DogRow | null): FormValues {
  let breedSelect = "Mixed";
  let breedCustom = "";
  if (dog) {
    const breed = dog.breed;
    if (breed !== null && KNOWN_BREED_VALUES.has(breed)) {
      breedSelect = breed;
    } else {
      breedSelect = DOG_BREED_OTHER_VALUE;
      breedCustom = breed ?? "";
    }
  }

  return {
    name: dog?.name ?? "",
    birth_date: dog?.birth_date ?? "",
    breedSelect,
    breedCustom,
    size: dog?.size ?? "",
    energy_level: dog?.energy_level?.toString() ?? "",
    good_with_children: boolToFormValue(dog?.good_with_children ?? null),
    good_with_dogs: boolToFormValue(dog?.good_with_dogs ?? null),
    good_with_cats: boolToFormValue(dog?.good_with_cats ?? null),
    sheds: boolToFormValue(dog?.sheds ?? null),
    free_description: dog?.free_description ?? "",
    status: dog?.status ?? "available",
    photo_url: dog?.photo_url ?? null,
  };
}

/**
 * Runs the same validation the Server Action re-runs (lib/dog-validation.ts)
 * client-side first, for instant inline errors — mirrors ProfileForm's
 * `validateThenSave` wrapper.
 */
async function validateThenSave(prevState: DogFormState, formData: FormData): Promise<DogFormState> {
  const values = parseDogFormData(formData);
  const fieldErrors = validateDogFormValues(values);

  // `breed_select`/`breed` is a client-only UI concern (see the Breed field
  // below) — `parseDogFormData` only ever sees the final `breed` value, so
  // it can't tell "Other" was picked. Catch the empty-custom-breed case here
  // for an instant inline error; a bypassed/raw submission of the same shape
  // just falls back to "Mixed" server-side (lib/dog-actions.ts), which is a
  // harmless, spec-sanctioned default, not a validation gap worth a server
  // round trip.
  if (formData.get("breed_select") === DOG_BREED_OTHER_VALUE && !values.breed) {
    fieldErrors.breed = "Please specify a breed.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Please fix the errors below.", fieldErrors };
  }

  return saveDog(prevState, formData);
}

/** Admin create/edit form for a `dogs` row. Rendered only behind `requireAdmin()` (see the `app/admin/dogs/*` pages) — RLS is the real enforcement either way. */
export function DogForm({ initialData }: { initialData: DogRow | null }) {
  const [state, formAction, isPending] = useActionState(validateThenSave, initialDogFormState);
  // Controlled from one object, same rationale as ProfileForm: React resets
  // uncontrolled <form action> fields to defaultValue once the action
  // settles, even on a validation-error submission. `initialData` is read
  // only on mount (lazy initializer) — the caller keys <DogForm> on
  // `initialData?.id` to force a remount if that ever changes.
  const [values, setValues] = useState<FormValues>(() => toFormValues(initialData));
  // Lifted from DogPhotoUploadField so the submit button can be disabled
  // while a photo upload is in flight — otherwise submitting mid-upload
  // saves the dog with the *previous* photo_url (the upload's onChange
  // hasn't fired yet) and the new file is silently orphaned in Storage.
  const [photoUploading, setPhotoUploading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  function updateField<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  // On a long form, the error banner can land far from the actual invalid
  // field(s) — scroll the first one into view.
  useEffect(() => {
    if (Object.keys(state.fieldErrors).length === 0) return;
    formRef.current?.querySelector('[aria-invalid="true"]')?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [state.fieldErrors]);

  const isOtherBreed = values.breedSelect === DOG_BREED_OTHER_VALUE;

  return (
    <form ref={formRef} action={formAction} className="space-y-8" noValidate>
      {initialData && <input type="hidden" name="id" value={initialData.id} />}
      {/* The pre-edit photo_url, compared server-side (saveDog) against the
          final saved value so the old Storage object can be cleaned up only
          once the new one is confirmed persisted — see the note on
          DogPhotoUploadField about why that cleanup doesn't happen here. */}
      <input type="hidden" name="original_photo_url" value={initialData?.photo_url ?? ""} />

      <fieldset className="space-y-5">
        <legend className="text-base font-semibold text-foreground">Basics</legend>
        <TextField
          name="name"
          label="Name"
          value={values.name}
          onChange={(value) => updateField("name", value)}
          required
          error={state.fieldErrors.name}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="birth_date"
            label="Date of birth"
            type="date"
            value={values.birth_date}
            onChange={(value) => updateField("birth_date", value)}
            max={todayIso}
            hint="Optional — used to compute age"
            error={state.fieldErrors.birth_date}
          />
          <SelectField
            name="status"
            label="Status"
            options={DOG_STATUS_OPTIONS}
            value={values.status}
            onChange={(value) => updateField("status", value)}
            placeholder="Select a status"
            required
            error={state.fieldErrors.status}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Not the field the server reads (see the hidden/hand-off `breed`
              input below) — dogs.breed is unconstrained text, so "Other"
              reveals a free-text field instead of blocking entry to a fixed list. */}
          <SelectField
            name="breed_select"
            label="Breed"
            options={DOG_BREED_OPTIONS}
            value={values.breedSelect}
            onChange={(value) => updateField("breedSelect", value)}
            placeholder="Select a breed"
          />
          {isOtherBreed && (
            <TextField
              name="breed"
              label="Breed (specify)"
              value={values.breedCustom}
              onChange={(value) => updateField("breedCustom", value)}
            />
          )}
        </div>
        {!isOtherBreed && <input type="hidden" name="breed" value={values.breedSelect} />}
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="text-base font-semibold text-foreground">Traits</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            name="size"
            label="Size"
            options={DOG_SIZE_OPTIONS}
            value={values.size}
            onChange={(value) => updateField("size", value)}
            placeholder="Select a size"
            required
            error={state.fieldErrors.size}
          />
          <SelectField
            name="energy_level"
            label="Energy level"
            options={ENERGY_LEVEL_OPTIONS}
            value={values.energy_level}
            onChange={(value) => updateField("energy_level", value)}
            placeholder="Select an energy level"
            required
            error={state.fieldErrors.energy_level}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            name="good_with_children"
            label="Good with children"
            options={DOG_BOOLEAN_OPTIONS}
            value={values.good_with_children}
            onChange={(value) => updateField("good_with_children", value)}
            placeholder="Unknown"
          />
          <SelectField
            name="good_with_dogs"
            label="Good with dogs"
            options={DOG_BOOLEAN_OPTIONS}
            value={values.good_with_dogs}
            onChange={(value) => updateField("good_with_dogs", value)}
            placeholder="Unknown"
          />
          <SelectField
            name="good_with_cats"
            label="Good with cats"
            options={DOG_BOOLEAN_OPTIONS}
            value={values.good_with_cats}
            onChange={(value) => updateField("good_with_cats", value)}
            placeholder="Unknown"
          />
          <SelectField
            name="sheds"
            label="Sheds"
            options={DOG_BOOLEAN_OPTIONS}
            value={values.sheds}
            onChange={(value) => updateField("sheds", value)}
            placeholder="Unknown"
          />
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="text-base font-semibold text-foreground">Photo &amp; description</legend>
        <DogPhotoUploadField
          value={values.photo_url}
          onChange={(url) => updateField("photo_url", url)}
          onUploadingChange={setPhotoUploading}
        />
        <TextareaField
          name="free_description"
          label="Description"
          value={values.free_description}
          onChange={(value) => updateField("free_description", value)}
          hint="Optional — shown on the dog's detail page"
        />
      </fieldset>

      {state.error && (
        <p role="alert" aria-live="polite" className="text-sm font-medium text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || photoUploading}
        className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {isPending ? "Saving…" : photoUploading ? "Uploading photo…" : initialData ? "Save changes" : "Add dog"}
      </button>
    </form>
  );
}
