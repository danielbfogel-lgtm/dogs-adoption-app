import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MatchesDashboard } from "@/components/matches/MatchesDashboard";
import { he } from "@/lib/i18n/he";

export const metadata: Metadata = {
  title: he.matches.dashboard.metaTitle,
};

/**
 * SPEC.md §4 "Match Results" — the adopter's primary dashboard. Auth is
 * already gated by middleware (`/matches` is in `PROTECTED_PREFIXES`); this
 * page additionally resolves the caller's own `adopters.id` server-side
 * (mirrors `app/profile/page.tsx`) so the client dashboard never has to
 * guess or receive it from anywhere the caller could tamper with — the
 * Python API double-checks this same ownership via a bearer token anyway
 * (`api/auth.py`), but there's no reason to skip the cheap page-level check.
 */
export default async function MatchesPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims?.sub) {
    redirect("/login");
  }

  const { data: adopter } = await supabase
    .from("adopters")
    .select("id")
    .eq("user_id", claims.sub)
    .maybeSingle();

  if (!adopter) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-foreground">{he.matches.dashboard.emptyProfileHeading}</h1>
        <p className="mt-2 text-sm text-fg-muted">{he.matches.dashboard.emptyProfileBody}</p>
        <Link
          href="/profile/edit"
          className="mt-6 flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          {he.matches.dashboard.completeProfileCta}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{he.matches.dashboard.heading}</h1>
        <p className="mt-1 text-sm text-fg-muted">{he.matches.dashboard.subheading}</p>
      </div>
      <div className="mt-6">
        <MatchesDashboard adopterId={adopter.id} />
      </div>
    </div>
  );
}
