import { createClient } from "@/lib/supabase/client";
import { he } from "@/lib/i18n/he";
import type { Database } from "@/lib/supabase/types";

type DogRow = Database["public"]["Tables"]["dogs"]["Row"];

export type DogsPage = {
  dogs: DogRow[];
  total: number;
  limit: number;
  offset: number;
};

export class DogsApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "DogsApiError";
    this.status = status;
  }
}

/**
 * `/api/dogs` runs with the service-role key and therefore bypasses RLS — it
 * verifies the caller's identity itself instead (see `api/auth.py`'s
 * `get_authenticated_user_id`; SPEC.md §4 "All Dogs Gallery" requires login,
 * it isn't public). `getSession()` reads the already-established browser
 * session (no extra network round trip in the common case), so this only
 * throws if the user's session has actually expired/been cleared. Mirrors
 * `match-api.ts`'s `authHeader()`.
 */
async function authHeader(): Promise<HeadersInit> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new DogsApiError(he.errors.sessionExpired, 401);
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
  return he.errors.requestFailedTemplate.replace("{status}", String(res.status));
}

export async function fetchDogsPage(
  offset: number,
  limit: number,
  search: string,
  signal: AbortSignal,
): Promise<DogsPage> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (search) params.set("search", search);
  const headers = await authHeader();
  const res = await fetch(`/api/dogs?${params.toString()}`, { headers, signal });
  if (!res.ok) throw new DogsApiError(await extractErrorMessage(res), res.status);
  return res.json();
}
