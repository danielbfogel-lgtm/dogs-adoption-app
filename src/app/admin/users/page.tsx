import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/current-user";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";

export const metadata: Metadata = {
  title: "Manage Users — Dog Adoption",
};

/**
 * Admin-only "User Management" (SPEC.md §4). `/admin/*` is auth-protected by
 * middleware; `requireAdmin()` adds the role check (redirects non-admins to
 * `/dogs`) — the real enforcement is `api/admin_auth.py`'s self-check on the
 * Python side, since `profiles`/`adopters` have no admin RLS carve-out
 * (see `api/admin_users.py`'s module docstring).
 */
export default async function AdminUsersPage() {
  const admin = await requireAdmin("/admin/users");

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manage Users</h1>
          <p className="mt-1 text-sm text-fg-muted">
            View, create, and remove adopter and admin accounts.
          </p>
        </div>
        <Link
          href="/admin/users/new"
          className="flex h-11 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add User
        </Link>
      </div>
      <div className="mt-6">
        <AdminUsersTable currentAdminId={admin.userId} />
      </div>
    </div>
  );
}
