import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { Logo } from "@/components/Logo";
import { AvatarMenu } from "@/components/AvatarMenu";

/**
 * Global site header: logo + auth-aware right side. Async Server Component —
 * reads the session and (if authenticated) the caller's own `profiles.role`
 * via `getCurrentUser()` (shared with the dogs pages' admin-button gating;
 * `cache()`-wrapped so this and a page body's own call dedupe into one
 * query per request). Never creates/upserts `profiles` — that row is owned
 * by the `handle_new_user` DB trigger.
 */
export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Logo />
          <Link
            href="/dogs"
            className="hidden text-sm font-medium text-zinc-700 hover:text-zinc-900 sm:block"
          >
            All Dogs
          </Link>
          {user && (
            <Link
              href="/matches"
              className="hidden text-sm font-medium text-zinc-700 hover:text-zinc-900 sm:block"
            >
              My Matches
            </Link>
          )}
          {user?.role === "admin" && (
            <Link
              href="/admin/users"
              className="hidden text-sm font-medium text-zinc-700 hover:text-zinc-900 sm:block"
            >
              Manage Users
            </Link>
          )}
        </div>
        {user ? (
          <AvatarMenu email={user.email} role={user.role} />
        ) : (
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="flex h-11 items-center rounded-lg px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="flex h-11 items-center rounded-lg bg-primary px-3.5 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Register
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
