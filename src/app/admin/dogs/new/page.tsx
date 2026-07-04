import type { Metadata } from "next";
import { requireAdmin } from "@/lib/current-user";
import { DogForm } from "@/components/dogs/DogForm";
import { he } from "@/lib/i18n/he";

export const metadata: Metadata = {
  title: he.admin.dogs.new.metaTitle,
};

/**
 * Admin-only "Add New Dog" (SPEC.md §4 "Dog Management (Integrated)").
 * `/admin/*` is auth-protected by middleware; `requireAdmin()` adds the
 * role check (redirects non-admins to `/dogs`) — DB writes are the actual
 * enforcement via the `dogs_admin_insert` RLS policy either way.
 */
export default async function NewDogPage() {
  await requireAdmin("/admin/dogs/new");

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">{he.admin.dogs.new.heading}</h1>
      <p className="mt-1 text-sm text-fg-muted">{he.admin.dogs.new.subheading}</p>
      <div className="mt-8">
        <DogForm initialData={null} />
      </div>
    </div>
  );
}
