import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { DogForm } from "@/components/dogs/DogForm";

type EditDogPageProps = {
  params: Promise<{ id: string }>;
};

const INVALID_UUID_ERROR_CODE = "22P02";

export const metadata: Metadata = {
  title: "Edit Dog — Dog Adoption",
};

/**
 * Admin-only "Edit Dog" (SPEC.md §4 "Dog Management (Integrated)"). Same
 * admin gate as `app/admin/dogs/new/page.tsx`; the dog fetch mirrors
 * `app/dogs/[id]/page.tsx`'s `getDog()` (invalid-UUID `id` treated as
 * not-found, same as zero rows).
 */
export default async function EditDogPage({ params }: EditDogPageProps) {
  const { id } = await params;
  await requireAdmin(`/admin/dogs/${id}/edit`);

  const supabase = await createClient();
  const { data: dog, error } = await supabase.from("dogs").select("*").eq("id", id).maybeSingle();

  if (error && error.code !== INVALID_UUID_ERROR_CODE) {
    console.error("EditDogPage: unexpected Supabase error", error);
  }
  if (!dog) notFound();

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-zinc-900">Edit {dog.name ?? "dog"}</h1>
      <div className="mt-8">
        {/* Keyed so a future change to the fetched row forces a remount
            (fresh lazy `useState` init) instead of going stale — see the
            note above DogForm's `values` state. */}
        <DogForm key={dog.id} initialData={dog} />
      </div>
    </div>
  );
}
