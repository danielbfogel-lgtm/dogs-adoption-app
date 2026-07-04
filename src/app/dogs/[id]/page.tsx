import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Baby,
  Cat,
  Check,
  Dog as DogIcon,
  Droplet,
  Pencil,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";
import { DogPhoto } from "@/components/dogs/DogPhoto";
import { DeleteDogButton } from "@/components/dogs/DeleteDogButton";
import { DOG_SIZE_OPTIONS, DOG_STATUS_OPTIONS, formatAge, getOptionLabel } from "@/lib/dog-options";
import type { Database, DogStatus } from "@/lib/supabase/types";

type DogRow = Database["public"]["Tables"]["dogs"]["Row"];

const STATUS_BADGE_CLASS: Record<DogStatus, string> = {
  available: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-800",
  adopted: "bg-surface-subtle text-fg-muted",
};

// cache() dedupes this within a single request — generateMetadata and the
// page component both call getDog(id) for the same render.
const INVALID_UUID_ERROR_CODE = "22P02";

const getDog = cache(async (id: string): Promise<DogRow | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("dogs").select("*").eq("id", id).maybeSingle();
  if (error) {
    // An `id` that isn't valid UUID syntax makes Postgres reject the `.eq()`
    // filter with this code rather than returning zero rows — treat that
    // the same as "not found". Anything else is a genuine failure (RLS
    // misconfig, outage, etc.) and must be logged, not silently 404'd.
    if (error.code !== INVALID_UUID_ERROR_CODE) {
      console.error("getDog: unexpected Supabase error", error);
    }
    return null;
  }
  return data;
});

type DogDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: DogDetailsPageProps): Promise<Metadata> {
  const { id } = await params;
  const dog = await getDog(id);
  return { title: dog ? `${dog.name ?? "Dog"} — Dog Adoption` : "Dog not found — Dog Adoption" };
}

function CompatibilityRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: boolean | null;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-divider px-4 py-3">
      <Icon className="h-5 w-5 shrink-0 text-fg-subtle" aria-hidden="true" />
      <span className="flex-1 text-sm text-fg-secondary">{label}</span>
      {value === null ? (
        <span className="text-xs font-medium text-fg-subtle">Unknown</span>
      ) : value ? (
        <Check className="h-5 w-5 text-green-600" aria-label="Yes" />
      ) : (
        <X className="h-5 w-5 text-danger" aria-label="No" />
      )}
    </div>
  );
}

/**
 * SPEC.md §4 "Dog Details" (`/dogs/[id]`) — read-only for standard users;
 * Edit/Delete controls (SPEC.md §4 "Dog Management (Integrated)") render
 * only for admins, gated by `getCurrentUser()`. The actual edit form lives
 * at `/admin/dogs/[id]/edit` (`requireAdmin()`-gated) — DB writes are
 * enforced by RLS either way.
 */
export default async function DogDetailsPage({ params }: DogDetailsPageProps) {
  const { id } = await params;
  const [dog, user] = await Promise.all([getDog(id), getCurrentUser()]);

  if (!dog) notFound();

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dogs"
          className="inline-flex h-11 items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to all dogs
        </Link>
        {user?.role === "admin" && (
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/dogs/${dog.id}/edit`}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-divider-strong px-3 text-sm font-medium text-fg-secondary hover:bg-surface-muted"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit
            </Link>
            <DeleteDogButton id={dog.id} />
          </div>
        )}
      </div>

      <div className="mt-2 grid gap-6 sm:grid-cols-2">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
          <DogPhoto src={dog.photo_url} alt={dog.name ?? "Dog"} sizes="(min-width: 640px) 50vw, 100vw" />
          {dog.status !== "available" && (
            <span
              className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE_CLASS[dog.status]}`}
            >
              {getOptionLabel(DOG_STATUS_OPTIONS, dog.status)}
            </span>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground">{dog.name ?? "Unnamed dog"}</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {dog.breed ?? "Mixed"} · {formatAge(dog.age)}
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-divider px-4 py-3">
              <dt className="text-fg-muted">Size</dt>
              <dd className="mt-0.5 font-semibold text-foreground">{getOptionLabel(DOG_SIZE_OPTIONS, dog.size)}</dd>
            </div>
            <div className="rounded-lg border border-divider px-4 py-3">
              <dt className="flex items-center gap-1 text-fg-muted">
                <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                Energy
              </dt>
              <dd className="mt-0.5 font-semibold text-foreground">
                {dog.energy_level !== null ? `${dog.energy_level}/5` : "Unknown"}
              </dd>
            </div>
          </dl>

          {dog.free_description && (
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-fg-secondary">{dog.free_description}</p>
          )}
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-foreground">Compatibility</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <CompatibilityRow icon={Baby} label="Good with children" value={dog.good_with_children} />
          <CompatibilityRow icon={DogIcon} label="Good with dogs" value={dog.good_with_dogs} />
          <CompatibilityRow icon={Cat} label="Good with cats" value={dog.good_with_cats} />
          <CompatibilityRow icon={Droplet} label="Sheds" value={dog.sheds} />
        </div>
      </section>
    </div>
  );
}
