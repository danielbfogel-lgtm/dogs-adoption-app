"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Heart, LogOut, PawPrint, User as UserIcon, Users } from "lucide-react";
import { logout } from "@/lib/auth-actions";
import type { ProfileRole } from "@/lib/supabase/types";

type AvatarMenuProps = {
  email: string | null;
  role: ProfileRole | null;
};

/** Header avatar button + dropdown ("My Profile" / "Logout"). Client Component: needs open/close state + outside-click/Escape handling. */
export function AvatarMenu({ email, role }: AvatarMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const initial = email ? email[0]?.toUpperCase() : null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex h-11 items-center gap-1.5 rounded-full pl-1 pr-2.5 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        <span
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white"
        >
          {initial ?? <UserIcon className="h-5 w-5" />}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
        <span className="sr-only">Account menu</span>
      </button>

      {open && (
        // Plain container, not role="menu": that ARIA pattern implies
        // arrow-key roving-tabindex navigation (WAI-ARIA APG), which this
        // component doesn't implement — items are just Tab-order-focusable
        // links/buttons. Using role="menu" here would set false expectations
        // for screen reader users.
        <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
          {(email || role) && (
            <div className="border-b border-zinc-100 px-4 py-2.5">
              {email && <p className="truncate text-sm font-medium text-zinc-900">{email}</p>}
              {role && <p className="text-xs capitalize text-zinc-500">{role}</p>}
            </div>
          )}

          <Link
            href="/dogs"
            onClick={() => setOpen(false)}
            className="flex min-h-11 items-center gap-2.5 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 sm:hidden"
          >
            <PawPrint className="h-4 w-4" aria-hidden="true" />
            All Dogs
          </Link>

          <Link
            href="/matches"
            onClick={() => setOpen(false)}
            className="flex min-h-11 items-center gap-2.5 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 sm:hidden"
          >
            <Heart className="h-4 w-4" aria-hidden="true" />
            My Matches
          </Link>

          {role === "admin" && (
            <Link
              href="/admin/users"
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center gap-2.5 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 sm:hidden"
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              Manage Users
            </Link>
          )}

          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex min-h-11 items-center gap-2.5 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            <UserIcon className="h-4 w-4" aria-hidden="true" />
            My Profile
          </Link>

          <form action={logout}>
            <button
              type="submit"
              className="flex min-h-11 w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Logout
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
