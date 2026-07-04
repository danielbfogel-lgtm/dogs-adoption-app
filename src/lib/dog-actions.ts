"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";
import {
  computeAgeFromBirthDate,
  parseDogFormData,
  validateDogFormValues,
  type DogFormValues,
} from "@/lib/dog-validation";
import { DOG_PHOTOS_BUCKET, extractDogPhotoStoragePath } from "@/lib/dog-photo-storage";
import { he } from "@/lib/i18n/he";
import type { DogFormState } from "@/lib/dog-state";
import type { Database } from "@/lib/supabase/types";

type DogInsert = Database["public"]["Tables"]["dogs"]["Insert"];
// `id` dropped entirely (not just left undefined): postgrest-js's `.update()`
// rejects any object whose *type* declares an `id` property at all — even
// optional/undefined — via an excess-property check, since `dogs.Update` is
// `Partial<Omit<DogRow, "id">>`. Omitting the key from the type (not just the
// value) keeps this one object assignable to both `.insert()` and `.update()`.
type DogWriteRow = Omit<DogInsert, "id">;

/** Shared field mapping for both create and edit — `status` defaulted. */
function buildDogRow(values: DogFormValues, age: number | null): DogWriteRow {
  return {
    name: values.name,
    birth_date: values.birth_date,
    age,
    breed: values.breed ?? "Mixed",
    size: values.size,
    energy_level: values.energy_level,
    good_with_children: values.good_with_children,
    good_with_dogs: values.good_with_dogs,
    good_with_cats: values.good_with_cats,
    sheds: values.sheds,
    free_description: values.free_description,
    status: values.status ?? "available",
    photo_url: values.photo_url,
  };
}

/**
 * Best-effort removal of a now-superseded Storage object, called only
 * *after* the new `photo_url` is confirmed persisted (see `DogForm`'s
 * `original_photo_url` hidden field and `DogPhotoUploadField`'s doc comment
 * for why this can't happen any earlier — deleting on upload/replace would
 * risk breaking a still-live photo if the edit is never saved). Never
 * throws: an orphaned Storage object is wasted space, not a functional
 * break, so a cleanup failure must not fail the request that already
 * succeeded.
 */
async function cleanupReplacedPhoto(
  supabase: Awaited<ReturnType<typeof createClient>>,
  previousUrl: string | null,
  currentUrl: string | null,
): Promise<void> {
  if (!previousUrl || previousUrl === currentUrl) return;
  const path = extractDogPhotoStoragePath(previousUrl);
  if (!path) return;

  const { error } = await supabase.storage.from(DOG_PHOTOS_BUCKET).remove([path]);
  if (error) {
    console.error("cleanupReplacedPhoto: failed to remove old photo:", error.message);
  }
}

/**
 * Creates or updates a `dogs` row. Unlike `saveAdopterProfile` (which upserts
 * on `user_id`), dogs have no natural unique key to upsert on — a hidden
 * `id` form field (present only when editing, see `DogForm`) decides which
 * branch runs. RLS's `dogs_admin_insert`/`dogs_admin_update` policies are the
 * real enforcement; the `role !== "admin"` check here is defense-in-depth
 * that also produces a clean error message instead of a raw RLS rejection.
 */
export async function saveDog(_prevState: DogFormState, formData: FormData): Promise<DogFormState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: he.errors.sessionExpired, fieldErrors: {} };
  }
  if (user.role !== "admin") {
    return { error: he.errors.dogAdminOnly, fieldErrors: {} };
  }

  // Re-validate server-side: the client's checks are UX only, not a trust
  // boundary (CLAUDE.md: "Validate all inputs before querying Supabase").
  const values = parseDogFormData(formData);
  const fieldErrors = validateDogFormValues(values);

  if (Object.keys(fieldErrors).length > 0) {
    return { error: he.errors.fixErrorsBelow, fieldErrors };
  }

  const id = typeof formData.get("id") === "string" ? (formData.get("id") as string) : null;
  const originalPhotoUrlRaw = formData.get("original_photo_url");
  const originalPhotoUrl =
    typeof originalPhotoUrlRaw === "string" && originalPhotoUrlRaw.length > 0 ? originalPhotoUrlRaw : null;
  const age = computeAgeFromBirthDate(values.birth_date);
  const row = buildDogRow(values, age);

  const supabase = await createClient();

  if (id) {
    const { error } = await supabase.from("dogs").update(row).eq("id", id);
    if (error) {
      console.error("saveDog update failed:", error.message);
      return { error: he.errors.dogSaveFailed, fieldErrors: {} };
    }
    await cleanupReplacedPhoto(supabase, originalPhotoUrl, values.photo_url);
    revalidatePath("/dogs");
    revalidatePath(`/dogs/${id}`);
    redirect(`/dogs/${id}`);
  }

  const { data, error } = await supabase.from("dogs").insert(row).select("id").single();
  if (error || !data) {
    console.error("saveDog insert failed:", error?.message);
    return { error: he.errors.dogSaveFailed, fieldErrors: {} };
  }

  revalidatePath("/dogs");
  redirect(`/dogs/${data.id}`);
}

/**
 * Deletes a dog. RLS's `dogs_admin_delete` policy is the real enforcement;
 * this action's role check exists so a non-admin (who'd never see the
 * delete button anyway) gets a clean redirect rather than a raw RLS error.
 * Not wired through `useActionState` — `DeleteDogButton` calls it directly
 * as a plain `<form action={deleteDog}>`, so it takes only `FormData`.
 */
export async function deleteDog(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/dogs");
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    redirect("/dogs");
  }

  const supabase = await createClient();

  // Fetched before the delete (rather than via `.delete().select()`) to
  // avoid depending on how RLS's DELETE policy interacts with a RETURNING
  // representation — a plain SELECT-then-DELETE is unambiguous either way.
  const { data: existingDog } = await supabase.from("dogs").select("photo_url").eq("id", id).maybeSingle();

  const { error } = await supabase.from("dogs").delete().eq("id", id);
  if (error) {
    // No form state to report through on this action's shape — log and fall
    // back to the detail page, where the (still-existing) dog and no error
    // banner at least isn't a false "deleted" message.
    console.error("deleteDog failed:", error.message);
    redirect(`/dogs/${id}`);
  }

  await cleanupReplacedPhoto(supabase, existingDog?.photo_url ?? null, null);

  revalidatePath("/dogs");
  redirect("/dogs");
}
