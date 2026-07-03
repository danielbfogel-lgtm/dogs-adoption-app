import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRole } from "@/lib/supabase/types";

export type CurrentUser = {
  userId: string;
  email: string | null;
  role: ProfileRole | null;
};

/**
 * Resolves the caller's session + `profiles.role` in one place. Extracted
 * from the role-fetch that used to be inlined in `Header.tsx` so admin pages
 * and the dogs pages can reuse it. Wrapped in `cache()` so multiple calls
 * within the same request (e.g. `Header` + a page body) dedupe into one
 * `getClaims()` + one `profiles` query, per the `server-cache-react`
 * best-practice rule.
 *
 * Returns `null` when there's no session — callers decide whether that's an
 * error (redirect to `/login`) or an expected logged-out state (Header).
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  // maybeSingle(), not single(): zero rows is an expected race right after
  // signup (before the handle_new_user trigger commits), not exceptional —
  // same rationale as the original Header.tsx read this replaces.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", claims.sub)
    .maybeSingle();

  return {
    userId: claims.sub,
    email: claims.email ?? null,
    role: profile?.role ?? null,
  };
});

/**
 * Page-level guard for admin-only routes (defense in depth on top of the
 * `/admin` middleware role gate and the DB's `dogs_admin_*`/`dog_photos_admin_*`
 * RLS policies — see `lib/supabase/middleware.ts`). Redirects rather than
 * throwing so a stale bookmark/direct nav degrades gracefully instead of
 * showing an error page.
 *
 * `currentPath`, if given, is echoed onto the `/login` redirect's `redirect=`
 * query param (matching how `lib/supabase/middleware.ts` does it), so a
 * logged-out visitor lands back here after logging in. In practice the
 * middleware's own auth check already catches this case first for every
 * `/admin/*` route today, so this only matters if that ever changes.
 */
export async function requireAdmin(currentPath?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(currentPath ? `/login?redirect=${encodeURIComponent(currentPath)}` : "/login");
  }
  if (user.role !== "admin") redirect("/dogs");
  return user;
}
