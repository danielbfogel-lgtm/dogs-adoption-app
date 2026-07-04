import Link from "next/link";
import { Zap } from "lucide-react";
import { DogPhoto } from "@/components/dogs/DogPhoto";
import { DOG_SIZE_OPTIONS, DOG_STATUS_OPTIONS, formatAge, getOptionLabel } from "@/lib/dog-options";
import { ENUM_LABELS, he } from "@/lib/i18n/he";
import type { Database, DogStatus } from "@/lib/supabase/types";

type DogRow = Database["public"]["Tables"]["dogs"]["Row"];

const STATUS_BADGE_CLASS: Record<DogStatus, string> = {
  available: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-800",
  adopted: "bg-surface-subtle text-fg-muted",
};

/** Gallery card: photo + key details, per SPEC.md §4 "All Dogs Gallery". */
export function DogCard({ dog }: { dog: DogRow }) {
  return (
    <Link
      href={`/dogs/${dog.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-divider bg-surface transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      <div className="relative aspect-square w-full">
        <DogPhoto src={dog.photo_url} alt={dog.name ?? he.dogs.card.genericAlt} />
        {dog.status !== "available" && (
          <span
            className={`absolute end-2 top-2 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE_CLASS[dog.status]}`}
          >
            {getOptionLabel(DOG_STATUS_OPTIONS, dog.status)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
        <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary sm:text-base">
          {dog.name ?? he.dogs.card.unnamedDog}
        </h3>
        <p className="truncate text-xs text-fg-muted sm:text-sm">
          {dog.breed ?? ENUM_LABELS.dogBreed.Mixed} · {formatAge(dog.age)}
        </p>
        <div className="mt-2 flex items-center justify-between text-xs text-fg-muted">
          <span className="rounded-full bg-surface-subtle px-2.5 py-1 font-medium">
            {getOptionLabel(DOG_SIZE_OPTIONS, dog.size)}
          </span>
          {dog.energy_level !== null && (
            <span className="flex items-center gap-1" title={he.matches.card.energyLevelTitle}>
              <Zap className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span dir="ltr">{dog.energy_level}/5</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
