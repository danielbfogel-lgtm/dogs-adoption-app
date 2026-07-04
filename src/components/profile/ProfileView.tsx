import {
  DOG_AGE_OPTIONS,
  ENERGY_LEVEL_OPTIONS,
  FAMILY_STRUCTURE_OPTIONS,
  getOptionLabel,
  SHEDS_OPTIONS,
  SIZE_OPTIONS,
} from "@/lib/adopter-options";
import type { Database } from "@/lib/supabase/types";

type AdopterRow = Database["public"]["Tables"]["adopters"]["Row"];

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2.5 text-sm">
      <dt className="text-fg-muted">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}

function formatDate(value: string | null): string {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Read-only display of an `adopters` row — reuses the same option/label maps as `ProfileForm`. */
export function ProfileView({ adopter }: { adopter: AdopterRow }) {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-divider bg-surface p-5">
        <h2 className="text-sm font-semibold text-foreground">About you</h2>
        <dl className="mt-1 divide-y divide-divider">
          <Row label="Name" value={`${adopter.first_name ?? ""} ${adopter.last_name ?? ""}`.trim() || "Not set"} />
          <Row label="Date of birth" value={formatDate(adopter.birth_date)} />
          <Row label="Phone number" value={adopter.phone ?? "Not set"} />
        </dl>
      </section>

      <section className="rounded-xl border border-divider bg-surface p-5">
        <h2 className="text-sm font-semibold text-foreground">Your household</h2>
        <dl className="mt-1 divide-y divide-divider">
          <Row
            label="Family structure"
            value={getOptionLabel(FAMILY_STRUCTURE_OPTIONS, adopter.family_structure)}
          />
          <Row label="Household size" value={adopter.household_size?.toString() ?? "Not set"} />
          <Row label="Number of children" value={adopter.number_of_children?.toString() ?? "Not set"} />
          {(adopter.number_of_children ?? 0) > 0 && (
            <Row label="Youngest child's age" value={adopter.youngest_child_age?.toString() ?? "Not set"} />
          )}
          <Row label="Dogs currently at home" value={adopter.number_of_dogs?.toString() ?? "Not set"} />
          <Row label="Cats currently at home" value={adopter.number_of_cats?.toString() ?? "Not set"} />
        </dl>
      </section>

      <section className="rounded-xl border border-divider bg-surface p-5">
        <h2 className="text-sm font-semibold text-foreground">What you&apos;re looking for</h2>
        <dl className="mt-1 divide-y divide-divider">
          <Row
            label="Preferred energy level"
            value={getOptionLabel(ENERGY_LEVEL_OPTIONS, adopter.energy_level)}
          />
          <Row label="Preferred size" value={getOptionLabel(SIZE_OPTIONS, adopter.size)} />
          <Row label="Preferred dog age" value={getOptionLabel(DOG_AGE_OPTIONS, adopter.dog_age)} />
          <Row label="Shedding preference" value={getOptionLabel(SHEDS_OPTIONS, adopter.sheds)} />
        </dl>
      </section>
    </div>
  );
}
