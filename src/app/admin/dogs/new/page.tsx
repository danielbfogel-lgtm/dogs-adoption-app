import type { Metadata } from "next";
import { requireAdmin } from "@/lib/current-user";
import { DogForm } from "@/components/dogs/DogForm";

export const metadata: Metadata = {
  title: "Add Dog — Dog Adoption",
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
      <h1 className="text-2xl font-bold text-zinc-900">Add a dog</h1>
      <p className="mt-1 text-sm text-zinc-600">Add a new dog to the adoption program.</p>
      <div className="mt-8">
        <DogForm initialData={null} />
      </div>
    </div>
  );
}
