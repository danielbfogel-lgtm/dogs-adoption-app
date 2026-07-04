import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileView } from "@/components/profile/ProfileView";
import { he } from "@/lib/i18n/he";

export const metadata: Metadata = {
  title: he.profile.view.metaTitle,
};

/** SPEC.md §4 "My Profile" — view (and jump to edit) the caller's own `adopters` row. */
export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
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

  if (!adopter) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-foreground">{he.profile.view.emptyHeading}</h1>
        <p className="mt-2 text-sm text-fg-muted">{he.profile.view.emptyBody}</p>
        <Link
          href="/profile/edit"
          className="mt-6 flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          {he.profile.view.completeProfileCta}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      {saved === "1" && (
        <p role="status" className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {he.profile.view.savedBanner}
        </p>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{he.profile.view.heading}</h1>
        <Link
          href="/profile/edit"
          className="flex h-11 items-center rounded-lg border border-divider-strong px-4 text-sm font-semibold text-fg-secondary hover:bg-surface-muted"
        >
          {he.profile.view.editLink}
        </Link>
      </div>
      <div className="mt-6">
        <ProfileView adopter={adopter} />
      </div>
    </div>
  );
}
