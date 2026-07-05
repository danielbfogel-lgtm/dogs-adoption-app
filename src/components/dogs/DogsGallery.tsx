"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Search, SearchX } from "lucide-react";
import { DogCard } from "@/components/dogs/DogCard";
import { fetchDogsPage } from "@/lib/dogs-api";
import { he } from "@/lib/i18n/he";
import type { Database } from "@/lib/supabase/types";

type DogRow = Database["public"]["Tables"]["dogs"]["Row"];

const PAGE_SIZE = 24;
const SEARCH_DEBOUNCE_MS = 300;

/** Client Component: text search (debounced) + "Load more" pagination against `/api/dogs`. */
export function DogsGallery() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  // The search term the current `dogs`/`total` actually belong to. Comparing
  // it against `search` derives `loading` during render instead of a
  // separate state variable set synchronously inside the effect below (the
  // latter trips `react-hooks/set-state-in-effect` and causes an extra
  // render on every fetch).
  const [resolvedSearch, setResolvedSearch] = useState<string | null>(null);
  const [dogs, setDogs] = useState<DogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Guards against a slow, stale request landing after a newer one — e.g. the
  // user types a second search query before the first one's response arrives.
  const requestIdRef = useRef(0);
  // Tracks the in-flight "Load more" request (if any) so a new search can
  // abort it instead of leaving it to finish pointlessly in the background.
  const loadMoreControllerRef = useRef<AbortController | null>(null);

  const loading = resolvedSearch !== search;

  useEffect(() => {
    const handle = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    loadMoreControllerRef.current?.abort();

    fetchDogsPage(0, PAGE_SIZE, search, controller.signal)
      .then((data) => {
        if (requestId !== requestIdRef.current) return;
        setDogs(data.dogs);
        setTotal(data.total);
        setResolvedSearch(search);
        setError(null);
      })
      .catch((err: Error) => {
        if (err.name === "AbortError" || requestId !== requestIdRef.current) return;
        setError(he.dogs.gallery.loadError);
        setResolvedSearch(search);
      });

    return () => controller.abort();
  }, [search]);

  const loadMore = useCallback(() => {
    const requestId = requestIdRef.current;
    const controller = new AbortController();
    loadMoreControllerRef.current = controller;
    setLoadingMore(true);
    setError(null);

    fetchDogsPage(dogs.length, PAGE_SIZE, search, controller.signal)
      .then((data) => {
        if (requestId !== requestIdRef.current) return;
        setDogs((prev) => [...prev, ...data.dogs]);
        setTotal(data.total);
      })
      .catch((err: Error) => {
        if (err.name === "AbortError" || requestId !== requestIdRef.current) return;
        setError(he.dogs.gallery.loadMoreError);
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoadingMore(false);
      });
  }, [dogs.length, search]);

  const hasMore = dogs.length < total;

  return (
    <div>
      <div className="relative">
        <Search
          className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle"
          aria-hidden="true"
        />
        <input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.currentTarget.value)}
          placeholder={he.dogs.gallery.searchPlaceholder}
          aria-label={he.dogs.gallery.searchAriaLabel}
          className="block h-11 w-full rounded-lg border border-divider-strong bg-surface ps-10 pe-4 text-base text-foreground placeholder:text-fg-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      {loading ? (
        <div className="mt-12 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-fg-subtle" aria-hidden="true" />
        </div>
      ) : dogs.length === 0 ? (
        // Suppress the empty state when `error` is set — the alert above
        // already explains why there's nothing to show, so "No dogs
        // available" would just contradict it.
        error ? null : (
          <div className="mt-12 flex flex-col items-center gap-2 text-center text-fg-muted">
            <SearchX className="h-8 w-8" aria-hidden="true" />
            <p className="text-sm">
              {search
                ? he.dogs.gallery.noResultsForTemplate.replace("{search}", search)
                : he.dogs.gallery.noneAvailable}
            </p>
          </div>
        )
      ) : (
        <>
          <p className="mt-4 text-sm text-fg-muted">
            {he.dogs.gallery.showingCountTemplate
              .replace("{count}", String(dogs.length))
              .replace("{total}", String(total))}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {dogs.map((dog) => (
              <DogCard key={dog.id} dog={dog} />
            ))}
          </div>
          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="flex h-11 items-center gap-2 rounded-lg border border-divider-strong px-5 text-sm font-semibold text-fg-secondary hover:bg-surface-muted disabled:opacity-60"
              >
                {loadingMore && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {he.dogs.gallery.loadMore}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
