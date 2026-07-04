"use client";

import { useEffect, useRef, useState } from "react";
import { HeartCrack, LayoutGrid, List, Loader2, RefreshCw } from "lucide-react";
import { MatchCard } from "@/components/matches/MatchCard";
import { ToastStack } from "@/components/ToastStack";
import { useToasts } from "@/lib/use-toasts";
import { fetchMatches, postMatchAction, MatchApiError, type MatchItem, type MatchStatus } from "@/lib/match-api";
import { he } from "@/lib/i18n/he";

type Tab = "all" | "confirmed" | "rejected";
type View = "tile" | "list";

const TABS: { value: Tab; label: string }[] = [
  { value: "all", label: he.matches.dashboard.tabAll },
  { value: "confirmed", label: he.matches.dashboard.tabConfirmed },
  { value: "rejected", label: he.matches.dashboard.tabRejected },
];

function countFor(matches: MatchItem[], tab: Tab): number {
  if (tab === "all") return matches.length;
  return matches.filter((item) => item.match_status === tab).length;
}

const EMPTY_MESSAGE: Record<Tab, string> = {
  all: he.matches.dashboard.emptyAll,
  confirmed: he.matches.dashboard.emptyConfirmed,
  rejected: he.matches.dashboard.emptyRejected,
};

/**
 * Client Component: fetches `/api/matches` for the caller's own adopter row
 * (SPEC.md §4 "Match Results"), and wires "Approve"/"Reject" to
 * `/api/match_action` with an optimistic UI update + toast (per-card pending
 * state, not a full-page block, so browsing other cards isn't interrupted).
 */
export function MatchesDashboard({ adopterId }: { adopterId: string }) {
  const [matches, setMatches] = useState<MatchItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [view, setView] = useState<View>("tile");
  // A `Set`, not a single id: two different cards can be actioned back to
  // back before the first request resolves, and each dog's in-flight request
  // must be tracked independently (see `pendingControllersRef` below) so a
  // second dog's click can never re-enable a first dog's still-in-flight
  // buttons.
  const [pendingDogIds, setPendingDogIds] = useState<ReadonlySet<string>>(new Set());
  // Bumped by the "Try again" button to re-run the fetch effect below without
  // duplicating its fetch/setState logic in a second, button-triggered
  // function (the `react-hooks/set-state-in-effect` rule flags an effect
  // whose body is just a bare call to an external setState-ing function).
  const [reloadKey, setReloadKey] = useState(0);
  const { toasts, push, dismiss } = useToasts();
  const requestIdRef = useRef(0);
  // One AbortController per in-flight `match_action` request, keyed by dog id
  // — aborted on unmount so navigating away from `/matches` mid-request can't
  // resolve into a `setState` on a stale action (e.g. a toast for a page the
  // user already left).
  const pendingControllersRef = useRef<Map<string, AbortController>>(new Map());

  useEffect(() => {
    const controllers = pendingControllersRef.current;
    return () => {
      controllers.forEach((controller) => controller.abort());
      controllers.clear();
    };
  }, []);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    const controller = new AbortController();

    fetchMatches(adopterId, controller.signal)
      .then((data) => {
        if (requestId !== requestIdRef.current) return;
        setMatches(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (requestId !== requestIdRef.current) return;
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof MatchApiError ? err.message : he.matches.dashboard.loadError);
      });

    return () => controller.abort();
  }, [adopterId, reloadKey]);

  async function handleAction(item: MatchItem, action: Extract<MatchStatus, "confirmed" | "rejected">) {
    const dogId = item.dog.id;
    const dogName = item.dog.name ?? he.matches.dashboard.dogNameFallback;
    const previousStatus = item.match_status;
    // Also guards re-entrancy: a second click on the same card while its
    // first request is still in flight is a no-op rather than firing a
    // second, overlapping request for the same dog.
    if (previousStatus === action || pendingControllersRef.current.has(dogId)) return;

    const controller = new AbortController();
    pendingControllersRef.current.set(dogId, controller);
    setPendingDogIds((prev) => new Set(prev).add(dogId));

    setMatches((prev) =>
      prev?.map((match) => (match.dog.id === dogId ? { ...match, match_status: action } : match)) ?? prev,
    );

    try {
      await postMatchAction(adopterId, dogId, action, controller.signal);
      push(
        action === "confirmed"
          ? he.matches.dashboard.confirmToastTemplate.replace("{dogName}", dogName)
          : he.matches.dashboard.rejectToastTemplate.replace("{dogName}", dogName),
        "success",
      );
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setMatches((prev) =>
        prev?.map((match) => (match.dog.id === dogId ? { ...match, match_status: previousStatus } : match)) ??
        prev,
      );
      push(
        err instanceof MatchApiError
          ? err.message
          : he.matches.dashboard.updateErrorToastTemplate.replace("{dogName}", dogName),
        "error",
      );
    } finally {
      pendingControllersRef.current.delete(dogId);
      setPendingDogIds((prev) => {
        const next = new Set(prev);
        next.delete(dogId);
        return next;
      });
    }
  }

  if (error) {
    return (
      <div className="mt-12 flex flex-col items-center gap-3 text-center text-fg-muted">
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setReloadKey((key) => key + 1);
          }}
          className="flex h-11 items-center gap-2 rounded-lg border border-divider-strong px-4 text-sm font-semibold text-fg-secondary hover:bg-surface-muted"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {he.matches.dashboard.tryAgain}
        </button>
      </div>
    );
  }

  if (matches === null) {
    return (
      <div className="mt-12 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-fg-subtle" aria-hidden="true" />
      </div>
    );
  }

  const visibleMatches = matches.filter((item) => tab === "all" || item.match_status === tab);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label={he.matches.dashboard.filterMatchesAria} className="flex flex-wrap gap-1.5">
          {TABS.map((tabOption) => (
            <button
              key={tabOption.value}
              type="button"
              role="tab"
              aria-selected={tab === tabOption.value}
              onClick={() => setTab(tabOption.value)}
              className={`flex h-11 items-center rounded-full px-4 text-sm font-semibold transition ${
                tab === tabOption.value
                  ? "bg-primary text-white"
                  : "bg-surface-subtle text-fg-muted hover:bg-surface-subtle"
              }`}
            >
              {he.matches.dashboard.tabLabelWithCountTemplate
                .replace("{label}", tabOption.label)
                .replace("{count}", String(countFor(matches, tabOption.value)))}
            </button>
          ))}
        </div>

        <div
          role="group"
          aria-label={he.matches.dashboard.switchViewAria}
          className="flex shrink-0 gap-1 rounded-lg bg-surface-subtle p-1"
        >
          <button
            type="button"
            aria-pressed={view === "tile"}
            onClick={() => setView("tile")}
            aria-label={he.matches.dashboard.tileViewAria}
            className={`flex h-11 w-11 items-center justify-center rounded-md transition ${
              view === "tile" ? "bg-surface text-primary shadow-sm" : "text-fg-muted hover:text-fg-secondary"
            }`}
          >
            <LayoutGrid className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
            aria-label={he.matches.dashboard.listViewAria}
            className={`flex h-11 w-11 items-center justify-center rounded-md transition ${
              view === "list" ? "bg-surface text-primary shadow-sm" : "text-fg-muted hover:text-fg-secondary"
            }`}
          >
            <List className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {visibleMatches.length === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-2 text-center text-fg-muted">
          <HeartCrack className="h-8 w-8" aria-hidden="true" />
          <p className="text-sm">{EMPTY_MESSAGE[tab]}</p>
        </div>
      ) : view === "tile" ? (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleMatches.map((item) => (
            <MatchCard
              key={item.dog.id}
              item={item}
              view="tile"
              pending={pendingDogIds.has(item.dog.id)}
              onApprove={() => handleAction(item, "confirmed")}
              onReject={() => handleAction(item, "rejected")}
            />
          ))}
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          {visibleMatches.map((item) => (
            <MatchCard
              key={item.dog.id}
              item={item}
              view="list"
              pending={pendingDogIds.has(item.dog.id)}
              onApprove={() => handleAction(item, "confirmed")}
              onReject={() => handleAction(item, "rejected")}
            />
          ))}
        </div>
      )}

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
