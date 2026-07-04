import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { he } from "@/lib/i18n/he";

export const metadata: Metadata = {
  title: he.profile.edit.metaTitle,
};

/**
 * Create-or-edit form for the caller's own `adopters` row (SPEC.md §2).
 * Middleware already protects `/profile/*`; this Server Component also
 * checks the session directly (defense in depth) before querying `adopters`.
 */
export default async function ProfileEditPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims?.sub) {
    redirect("/login");
  }

  const { data: adopter } = await supabase
    .from("adopters")
    .select("*")
    .eq("user_id", claims.sub)
    .maybeSingle();

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">
        {adopter ? he.profile.edit.headingEdit : he.profile.edit.headingCreate}
      </h1>
      <p className="mt-1 text-sm text-fg-muted">{he.profile.edit.subheading}</p>
      <div className="mt-8">
        {/* Keyed so a future change to the fetched row forces a remount
            (and a fresh lazy `useState` init) instead of silently going
            stale — see the note above ProfileForm's `values` state. */}
        <ProfileForm key={adopter?.id ?? "new"} initialData={adopter} />
      </div>
    </div>
  );
}
