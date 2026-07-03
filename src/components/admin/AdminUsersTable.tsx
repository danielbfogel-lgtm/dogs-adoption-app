"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Search, SearchX } from "lucide-react";
import { fetchUsers, type AdminUserRow } from "@/lib/admin-users-api";
import { DeleteUserButton } from "@/components/admin/DeleteUserButton";
import { ToastStack } from "@/components/ToastStack";
import { useToasts } from "@/lib/use-toasts";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function RoleBadge({ role }: { role: AdminUserRow["role"] }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        role === "admin" ? "bg-primary/10 text-primary" : "bg-zinc-100 text-zinc-700"
      }`}
    >
      {role === "admin" ? "Admin" : "Adopter"}
    </span>
  );
}

/**
 * Client Component: text search (debounced) + "Load more" pagination against
 * `/api/admin_users`, mirroring `components/dogs/DogsGallery.tsx`'s
 * fetch/abort/pagination pattern. Renders a real `<table>` on `sm+` and a
 * stacked card list below it — a user row has no visual content worth a
 * List/Tile toggle the way dogs' photos do.
 */
export function AdminUsersTable({ currentAdminId }: { currentAdminId: string }) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [resolvedSearch, setResolvedSearch] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const loadMoreControllerRef = useRef<AbortController | null>(null);
  const { toasts, push, dismiss } = useToasts();

  const loading = resolvedSearch !== search;

  useEffect(() => {
    const handle = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    loadMoreControllerRef.current?.abort();

    fetchUsers({ limit: PAGE_SIZE, offset: 0, search: search || undefined }, controller.signal)
      .then((data) => {
        if (requestId !== requestIdRef.current) return;
        setUsers(data.users);
        setTotal(data.total);
        setResolvedSearch(search);
        setError(null);
      })
      .catch((err: Error) => {
        if (err.name === "AbortError" || requestId !== requestIdRef.current) return;
        setError("Couldn't load users. Please try again.");
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

    fetchUsers(
      { limit: PAGE_SIZE, offset: users.length, search: search || undefined },
      controller.signal,
    )
      .then((data) => {
        if (requestId !== requestIdRef.current) return;
        setUsers((prev) => [...prev, ...data.users]);
        setTotal(data.total);
      })
      .catch((err: Error) => {
        if (err.name === "AbortError" || requestId !== requestIdRef.current) return;
        setError("Couldn't load more users. Please try again.");
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoadingMore(false);
      });
  }, [users.length, search]);

  function handleDeleted(id: string, email: string | null) {
    setUsers((prev) => prev.filter((user) => user.id !== id));
    setTotal((prev) => Math.max(0, prev - 1));
    push(`Deleted ${email ?? "user"}.`, "success");
  }

  const hasMore = users.length < total;

  return (
    <div>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.currentTarget.value)}
          placeholder="Search users by email…"
          aria-label="Search users by email"
          className="block h-11 w-full rounded-lg border border-zinc-300 bg-white pl-10 pr-4 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className="mt-12 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" aria-hidden="true" />
        </div>
      ) : users.length === 0 ? (
        error ? null : (
          <div className="mt-12 flex flex-col items-center gap-2 text-center text-zinc-500">
            <SearchX className="h-8 w-8" aria-hidden="true" />
            <p className="text-sm">
              {search ? `No users found matching "${search}".` : "No users yet."}
            </p>
          </div>
        )
      ) : (
        <>
          <p className="mt-4 text-sm text-zinc-500">
            Showing {users.length} of {total} user{total === 1 ? "" : "s"}
          </p>

          <div className="mt-3 hidden overflow-hidden rounded-xl border border-zinc-200 sm:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Email
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Role
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Joined
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="font-medium text-primary hover:text-primary-dark"
                      >
                        {user.email ?? "(no email)"}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{formatDate(user.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      {user.id !== currentAdminId && (
                        <DeleteUserButton
                          id={user.id}
                          onDeleted={() => handleDeleted(user.id, user.email)}
                          onError={(message) => push(message, "error")}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-3 space-y-3 sm:hidden">
            {users.map((user) => (
              <li key={user.id} className="rounded-xl border border-zinc-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="break-all font-medium text-primary hover:text-primary-dark"
                  >
                    {user.email ?? "(no email)"}
                  </Link>
                  <RoleBadge role={user.role} />
                </div>
                <p className="mt-1 text-xs text-zinc-500">Joined {formatDate(user.created_at)}</p>
                {user.id !== currentAdminId && (
                  <div className="mt-3">
                    <DeleteUserButton
                      id={user.id}
                      onDeleted={() => handleDeleted(user.id, user.email)}
                      onError={(message) => push(message, "error")}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="flex h-11 items-center gap-2 rounded-lg border border-zinc-300 px-5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
              >
                {loadingMore && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Load more
              </button>
            </div>
          )}
        </>
      )}

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
