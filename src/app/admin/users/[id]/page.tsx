import type { Metadata } from "next";
import { requireAdmin } from "@/lib/current-user";
import { EditUserForm } from "@/components/admin/EditUserForm";
import { he } from "@/lib/i18n/he";

type EditUserPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: he.admin.users.edit.metaTitle,
};

/**
 * Admin-only "Admin User View" (SPEC.md §4 "/admin/users/[id]"). Same admin
 * gate as `app/admin/users/page.tsx`. Deliberately does not fetch the user
 * server-side (see `EditUserForm`'s doc comment) — 404 handling for an
 * unknown id happens inside the client component once its own fetch resolves.
 */
export default async function EditUserPage({ params }: EditUserPageProps) {
  const { id } = await params;
  const admin = await requireAdmin(`/admin/users/${id}`);

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">{he.admin.users.edit.heading}</h1>
      <div className="mt-8">
        <EditUserForm userId={id} currentAdminId={admin.userId} />
      </div>
    </div>
  );
}
