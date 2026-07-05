import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Route prefixes that require an authenticated session (SPEC.md §4-5). */
const PROTECTED_PREFIXES = ["/profile", "/matches", "/admin", "/dogs"];

/**
 * Route prefixes that require the caller's `profiles.role` to be `admin`
 * (SPEC.md §4 "Admin Only Pages", §5 RBAC) — checked in addition to, not
 * instead of, `PROTECTED_PREFIXES`'s plain-authentication gate above.
 */
const ADMIN_PREFIXES = ["/admin"];

/**
 * Auth pages a logged-in user shouldn't see again. `/reset-password` is
 * deliberately excluded: Supabase's recovery link signs the user into a
 * short-lived "recovery" session before landing there, so treating that as
 * a normal login and bouncing away would break the password-reset flow.
 */
const AUTH_ONLY_PREFIXES = ["/login", "/register", "/forgot-password"];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * `setAll` rotates the session cookie onto `source` (the `NextResponse.next`
 * built inside the Supabase client). A redirect branch builds a brand-new
 * `NextResponse.redirect(...)` — without copying, any refreshed cookie from
 * this request would be silently dropped, which can cause spurious logouts
 * once refresh-token rotation kicks in.
 */
function copyCookies(source: NextResponse, target: NextResponse): NextResponse {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  return target;
}

/**
 * Refreshes the Supabase auth session on every request and enforces route
 * protection. Called from the root `middleware.ts`.
 *
 * IMPORTANT: do not add any logic between `createServerClient` and
 * `supabase.auth.getClaims()` below — doing so can cause hard-to-debug
 * session refresh bugs (per Supabase's SSR guidance).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and getClaims(): it validates
  // the JWT and refreshes the session cookie in one step.
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = data?.claims != null;

  const { pathname, search } = request.nextUrl;

  if (!isAuthenticated && matchesPrefix(pathname, PROTECTED_PREFIXES)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", `${pathname}${search}`);
    return copyCookies(response, NextResponse.redirect(loginUrl));
  }

  if (isAuthenticated && matchesPrefix(pathname, ADMIN_PREFIXES)) {
    const userId = data?.claims?.sub;
    // maybeSingle(), not single(): a missing profiles row (the signup
    // trigger race, see Header.tsx/getCurrentUser()) should just fail the
    // admin check, not throw.
    const { data: profile } =
      typeof userId === "string"
        ? await supabase.from("profiles").select("role").eq("id", userId).maybeSingle()
        : { data: null };

    if (profile?.role !== "admin") {
      return copyCookies(response, NextResponse.redirect(new URL("/dogs", request.url)));
    }
  }

  if (isAuthenticated && matchesPrefix(pathname, AUTH_ONLY_PREFIXES)) {
    return copyCookies(response, NextResponse.redirect(new URL("/profile/edit", request.url)));
  }

  // IMPORTANT: return the `response` object as-is so refreshed cookies
  // propagate to both the browser and downstream Server Components.
  return response;
}
