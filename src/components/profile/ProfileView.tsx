import {
  DOG_AGE_OPTIONS,
  ENERGY_LEVEL_OPTIONS,
  FAMILY_STRUCTURE_OPTIONS,
  getOptionLabel,
  SHEDS_OPTIONS,
  SIZE_OPTIONS,
} from "@/lib/adopter-options";
import { he } from "@/lib/i18n/he";
import type { Database } from "@/lib/supabase/types";

type AdopterRow = Database["public"]["Tables"]["adopters"]["Row"];

function Row({ label, value, ltrValue }: { label: string; value: string; ltrValue?: boolean }) {
  return (
    <div className="flex justify-between gap-4 py-2.5 text-sm">
      <dt className="text-fg-muted">{label}</dt>
      <dd className="text-end font-medium text-foreground" dir={ltrValue ? "ltr" : undefined}>
        {value}
      </dd>
    </div>
  );
}

function formatDate(value: string | null): string {
  if (!value) return he.common.notSet;
  return new Date(value).toLocaleDateString("he-IL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Read-only display of an `adopters` row — reuses the same option/label maps as `ProfileForm`. */
export function ProfileView({ adopter }: { adopter: AdopterRow }) {
  const v = he.profile.view;
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-divider bg-surface p-5">
        <h2 className="text-sm font-semibold text-foreground">{v.sectionAboutYou}</h2>
        <dl className="mt-1 divide-y divide-divider">
          <Row
            label={v.fieldName}
            value={`${adopter.first_name ?? ""} ${adopter.last_name ?? ""}`.trim() || he.common.notSet}
          />
          <Row label={v.fieldDob} value={formatDate(adopter.birth_date)} ltrValue />
          <Row label={v.fieldPhone} value={adopter.phone ?? he.common.notSet} ltrValue />
        </dl>
      </section>

      <section className="rounded-xl border border-divider bg-surface p-5">
        <h2 className="text-sm font-semibold text-foreground">{v.sectionHousehold}</h2>
        <dl className="mt-1 divide-y divide-divider">
          <Row
            label={v.fieldFamilyStructure}
            value={getOptionLabel(FAMILY_STRUCTURE_OPTIONS, adopter.family_structure)}
          />
          <Row label={v.fieldHouseholdSize} value={adopter.household_size?.toString() ?? he.common.notSet} ltrValue />
          <Row
            label={v.fieldNumberOfChildren}
            value={adopter.number_of_children?.toString() ?? he.common.notSet}
            ltrValue
          />
          {(adopter.number_of_children ?? 0) > 0 && (
            <Row
              label={v.fieldYoungestChildAge}
              value={adopter.youngest_child_age?.toString() ?? he.common.notSet}
              ltrValue
            />
          )}
          <Row label={v.fieldDogsAtHome} value={adopter.number_of_dogs?.toString() ?? he.common.notSet} ltrValue />
          <Row label={v.fieldCatsAtHome} value={adopter.number_of_cats?.toString() ?? he.common.notSet} ltrValue />
        </dl>
      </section>

      <section className="rounded-xl border border-divider bg-surface p-5">
        <h2 className="text-sm font-semibold text-foreground">{v.sectionLookingFor}</h2>
        <dl className="mt-1 divide-y divide-divider">
          <Row
            label={v.fieldEnergyLevel}
            value={getOptionLabel(ENERGY_LEVEL_OPTIONS, adopter.energy_level)}
          />
          <Row label={v.fieldSize} value={getOptionLabel(SIZE_OPTIONS, adopter.size)} />
          <Row label={v.fieldDogAge} value={getOptionLabel(DOG_AGE_OPTIONS, adopter.dog_age)} />
          <Row label={v.fieldSheds} value={getOptionLabel(SHEDS_OPTIONS, adopter.sheds)} />
        </dl>
      </section>
    </div>
  );
}
