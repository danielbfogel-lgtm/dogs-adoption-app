import { createClient } from "@/lib/supabase/client";
import type { Database, ProfileRole } from "@/lib/supabase/types";

type AdopterRow = Database["public"]["Tables"]["adopters"]["Row"];

/** Shape of a `profiles` row as returned by `api/admin_users.py`'s `ProfileOut`. */
export type AdminUserRow = {
  id: string;
  email: string | null;
  role: ProfileRole;
  created_at: string;
};

/** Shape of `GET /api/admin_user`'s response (`api/admin_user.py`'s `UserDetailResponse`). */
export type AdminUserDetail = {
  profile: AdminUserRow;
  adopter: AdopterRow | null;
};

/**
 * Thrown by the helpers below so callers can distinguish e.g. a 409
 * ("email already exists") from a generic failure and show the server's
 * actual message.
 */
export class AdminUsersApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminUsersApiError";
    this.status = status;
  }
}

/**
 * `api/admin_users.py`/`api/admin_user.py` run with the Supabase service-role
 * key (no admin carve-out exists in `profiles`/`adopters` RLS) and verify the
 * caller's identity/role themselves instead (see `api/admin_auth.py`).
 * `getSession()` reads the already-established browser session (no extra
 * network round trip in the common case), so this only throws if the
 * admin's own session has actually expired/been cleared. Mirrors
 * `lib/match-api.ts`'s pattern.
 *
 * Note the endpoint paths below are `/api/admin_users` (plural, list/create)
 * and `/api/admin_user` (singular, detail/update/delete via a `user_id`
 * query param) — not `/api/admin/users/{id}` — because Vercel's zero-config
 * Python routing maps each `api/*.py` file to one static path matching its
 * filename; see `api/admin_users.py`'s module docstring for the full
 * rationale (mirrors `api/matches.py`'s existing query-param convention).
 */
async function authHeader(): Promise<HeadersInit> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new AdminUsersApiError("Your session has expired. Please log in again.", 401);
  }
  return { Authorization: `Bearer ${token}` };
}

async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const body: unknown = await res.json();
    if (body && typeof body === "object" && "detail" in body && typeof body.detail === "string") {
      return body.detail;
    }
  } catch {
    // Non-JSON error body — fall through to the generic message below.
  }
  return `Request failed (${res.status}).`;
}

export async function fetchUsers(
  params: { limit: number; offset: number; search?: string },
  signal?: AbortSignal,
): Promise<{ users: AdminUserRow[]; total: number }> {
  const headers = await authHeader();
  const query = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  });
  if (params.search) query.set("search", params.search);

  const res = await fetch(`/api/admin_users?${query.toString()}`, { headers, signal });
  if (!res.ok) throw new AdminUsersApiError(await extractErrorMessage(res), res.status);
  const data: { users: AdminUserRow[]; total: number } = await res.json();
  return data;
}

export async function fetchUser(id: string, signal?: AbortSignal): Promise<AdminUserDetail> {
  const headers = await authHeader();
  const res = await fetch(`/api/admin_user?user_id=${encodeURIComponent(id)}`, {
    headers,
    signal,
  });
  if (!res.ok) throw new AdminUsersApiError(await extractErrorMessage(res), res.status);
  return res.json();
}

export async function createUser(input: {
  email: string;
  password: string;
  role: ProfileRole;
}): Promise<AdminUserRow> {
  const headers = await authHeader();
  const res = await fetch("/api/admin_users", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new AdminUsersApiError(await extractErrorMessage(res), res.status);
  return res.json();
}

/** Keys omitted entirely (not sent as "") mean "no change" — a blank "new password" field must not overwrite the current one. */
export async function updateUser(
  id: string,
  input: Partial<{ email: string; password: string; role: ProfileRole }>,
): Promise<AdminUserRow> {
  const headers = await authHeader();
  const res = await fetch(`/api/admin_user?user_id=${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new AdminUsersApiError(await extractErrorMessage(res), res.status);
  return res.json();
}

export async function deleteUser(id: string): Promise<void> {
  const headers = await authHeader();
  const res = await fetch(`/api/admin_user?user_id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new AdminUsersApiError(await extractErrorMessage(res), res.status);
}
