import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { DogsGallery } from "@/components/dogs/DogsGallery";
import { getCurrentUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "All Dogs — Dog Adoption",
  description: "Browse every adoptable dog.",
};

/**
 * SPEC.md §4 "All Dogs Gallery" — public listing, search, and pagination.
 * The "Add Dog" control (SPEC.md §4 "Dog Management (Integrated)") lives
 * here, in the Server Component page shell, not the client `DogsGallery` —
 * it's a one-time role check per page load, not something the gallery's
 * search/pagination state needs to know about.
 */
export default async function DogsPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">All Dogs</h1>
          <p className="mt-1 text-sm text-fg-muted">Browse every dog currently in our program.</p>
        </div>
        {user?.role === "admin" && (
          <Link
            href="/admin/dogs/new"
            className="flex h-11 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Dog
          </Link>
        )}
      </div>
      <div className="mt-6">
        <DogsGallery />
      </div>
    </div>
  );
}
