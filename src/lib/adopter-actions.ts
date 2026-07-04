"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseAdopterFormData, validateAdopterFormValues } from "@/lib/adopter-validation";
import { he } from "@/lib/i18n/he";
import type { AdopterFormState } from "@/lib/adopter-state";
import type { Database } from "@/lib/supabase/types";

type AdopterInsert = Database["public"]["Tables"]["adopters"]["Insert"];

/**
 * Creates or updates the caller's own `adopters` row. Upsert on `user_id`
 * (UNIQUE in the schema) so this same action serves both the first-ever save
 * and later edits — RLS's `adopters_rw_own` policy (`auth.uid() = user_id`)
 * scopes it to the caller's own row for both paths.
 */
export async function saveAdopterProfile(
  _prevState: AdopterFormState,
  formData: FormData,
): Promise<AdopterFormState> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (typeof userId !== "string") {
    return { error: he.errors.sessionExpired, fieldErrors: {} };
  }

  // Re-validate server-side: the client's checks are UX only, not a trust
  // boundary (CLAUDE.md: "Validate all inputs before querying Supabase").
  const values = parseAdopterFormData(formData);
  const fieldErrors = validateAdopterFormValues(values);

  if (Object.keys(fieldErrors).length > 0) {
    return { error: he.errors.fixErrorsBelow, fieldErrors };
  }

  const row: AdopterInsert = {
    user_id: userId,
    first_name: values.first_name,
    last_name: values.last_name,
    birth_date: values.birth_date,
    family_structure: values.family_structure,
    energy_level: values.energy_level,
    number_of_children: values.number_of_children,
    youngest_child_age: (values.number_of_children ?? 0) > 0 ? values.youngest_child_age : null,
    number_of_dogs: values.number_of_dogs,
    number_of_cats: values.number_of_cats,
    household_size: values.household_size,
    phone: values.phone,
    size: values.size,
    sheds: values.sheds,
    dog_age: values.dog_age,
  };

  const { error } = await supabase.from("adopters").upsert(row, { onConflict: "user_id" });

  if (error) {
    // Don't surface the raw PostgREST error (can leak constraint/column
    // names) to the client — log it server-side and show a generic message.
    console.error("saveAdopterProfile upsert failed:", error.message);
    return { error: he.errors.adopterSaveFailed, fieldErrors: {} };
  }

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  redirect("/profile?saved=1");
}
