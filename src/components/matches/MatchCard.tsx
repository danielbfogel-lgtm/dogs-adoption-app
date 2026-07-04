import Link from "next/link";
import { Check, Loader2, X, Zap } from "lucide-react";
import { DogPhoto } from "@/components/dogs/DogPhoto";
import { DOG_SIZE_OPTIONS, formatAge, getOptionLabel } from "@/lib/dog-options";
import { ENUM_LABELS, he } from "@/lib/i18n/he";
import type { MatchItem, MatchStatus } from "@/lib/match-api";

type MatchCardProps = {
  item: MatchItem;
  view: "tile" | "list";
  pending: boolean;
  onApprove: () => void;
  onReject: () => void;
};

function MatchScoreBadge({ score }: { score: number }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-white shadow-sm">
      {he.matches.card.matchBadgeTemplate.replace("{percent}", String(Math.round(score)))}
    </span>
  );
}

function StatusRibbon({ status }: { status: Exclude<MatchStatus, "pending"> }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        status === "confirmed" ? "bg-green-100 text-green-800" : "bg-danger-soft text-danger"
      }`}
    >
      {ENUM_LABELS.matchStatus[status]}
    </span>
  );
}

function ActionButtons({
  status,
  pending,
  onApprove,
  onReject,
}: {
  status: MatchStatus;
  pending: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onApprove}
        disabled={pending}
        aria-pressed={status === "confirmed"}
        className={`flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
          status === "confirmed"
            ? "bg-green-600 text-white hover:bg-green-700"
            : "border border-green-600 text-green-700 hover:bg-green-50"
        }`}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Check className="h-4 w-4" aria-hidden="true" />
        )}
        {status === "confirmed" ? he.matches.card.confirmedButton : he.matches.card.approveButton}
      </button>
      <button
        type="button"
        onClick={onReject}
        disabled={pending}
        aria-pressed={status === "rejected"}
        className={`flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
          status === "rejected"
            ? "bg-red-600 text-white hover:bg-red-700"
            : "border border-red-600 text-danger hover:bg-danger-soft"
        }`}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <X className="h-4 w-4" aria-hidden="true" />
        )}
        {status === "rejected" ? he.matches.card.rejectedButton : he.matches.card.rejectButton}
      </button>
    </div>
  );
}

/** One dog in the Match Results dashboard (SPEC.md §4 "Match Results"), tile or list layout. */
export function MatchCard({ item, view, pending, onApprove, onReject }: MatchCardProps) {
  const { dog, score, match_status: status } = item;

  if (view === "list") {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-divider bg-surface p-3 sm:flex-row sm:items-center sm:gap-4">
        <Link
          href={`/dogs/${dog.id}`}
          className="relative aspect-square w-full shrink-0 overflow-hidden rounded-lg sm:h-20 sm:w-20"
        >
          <DogPhoto src={dog.photo_url} alt={dog.name ?? he.dogs.card.genericAlt} sizes="80px" />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/dogs/${dog.id}`}
              className="truncate text-sm font-semibold text-foreground hover:text-primary sm:text-base"
            >
              {dog.name ?? he.matches.card.unnamedDog}
            </Link>
            <MatchScoreBadge score={score} />
            {status !== "pending" && <StatusRibbon status={status} />}
          </div>
          <p className="mt-0.5 truncate text-xs text-fg-muted sm:text-sm">
            {dog.breed ?? ENUM_LABELS.dogBreed.Mixed} · {formatAge(dog.age)} ·{" "}
            {getOptionLabel(DOG_SIZE_OPTIONS, dog.size)}
          </p>
        </div>

        <div className="sm:w-56">
          <ActionButtons status={status} pending={pending} onApprove={onApprove} onReject={onReject} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-divider bg-surface">
      <Link href={`/dogs/${dog.id}`} className="group relative aspect-square w-full">
        <DogPhoto src={dog.photo_url} alt={dog.name ?? he.dogs.card.genericAlt} />
        <div className="absolute start-2 top-2 flex flex-wrap gap-1.5">
          <MatchScoreBadge score={score} />
        </div>
        {status !== "pending" && (
          <div className="absolute end-2 top-2">
            <StatusRibbon status={status} />
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
        <Link
          href={`/dogs/${dog.id}`}
          className="truncate text-sm font-semibold text-foreground hover:text-primary sm:text-base"
        >
          {dog.name ?? he.matches.card.unnamedDog}
        </Link>
        <p className="truncate text-xs text-fg-muted sm:text-sm">
          {dog.breed ?? ENUM_LABELS.dogBreed.Mixed} · {formatAge(dog.age)}
        </p>
        <div className="mt-1 flex items-center justify-between text-xs text-fg-muted">
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
        <div className="mt-3">
          <ActionButtons status={status} pending={pending} onApprove={onApprove} onReject={onReject} />
        </div>
      </div>
    </div>
  );
}
