import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileView } from "@/components/profile/ProfileView";

export const metadata: Metadata = {
  title: "My Profile — Dog Adoption",
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
        <h1 className="text-2xl font-bold text-zinc-900">Complete your profile</h1>
        <p className="mt-2 text-sm text-zinc-600">
          We need a few details about you and your household before we can find dog matches.
        </p>
        <Link
          href="/profile/edit"
          className="mt-6 flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Complete your profile
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      {saved === "1" && (
        <p role="status" className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          Profile saved.
        </p>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">My Profile</h1>
        <Link
          href="/profile/edit"
          className="flex h-11 items-center rounded-lg border border-zinc-300 px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
        >
          Edit
        </Link>
      </div>
      <div className="mt-6">
        <ProfileView adopter={adopter} />
      </div>
    </div>
  );
}
