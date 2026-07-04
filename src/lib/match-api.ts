import { createClient } from "@/lib/supabase/client";
import { he } from "@/lib/i18n/he";
import type { Database } from "@/lib/supabase/types";

type DogRow = Database["public"]["Tables"]["dogs"]["Row"];

export type MatchStatus = "pending" | "confirmed" | "rejected";

/** Shape of one item in `/api/matches`'s response (api/matches.py). */
export type MatchItem = {
  dog: DogRow;
  score: number;
  match_status: MatchStatus;
};

/**
 * Thrown by the helpers below so callers can distinguish e.g. a 409 ("dog no
 * longer available") from a generic failure and show a tailored message.
 */
export class MatchApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "MatchApiError";
    this.status = status;
  }
}

/**
 * The Python API (`api/matches.py`/`api/match_action.py`) runs with the
 * Supabase service-role key and therefore bypasses RLS — it verifies the
 * caller's identity itself via this bearer token instead (see `api/auth.py`).
 * `getSession()` reads the already-established browser session (no extra
 * network round trip in the common case), so this only throws if the user's
 * session has actually expired/been cleared.
 */
async function authHeader(): Promise<HeadersInit> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new MatchApiError(he.errors.sessionExpired, 401);
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

export async function fetchMatches(adopterId: string, signal?: AbortSignal): Promise<MatchItem[]> {
  const headers = await authHeader();
  const params = new URLSearchParams({ adopter_id: adopterId });
  const res = await fetch(`/api/matches?${params.toString()}`, { headers, signal });
  if (!res.ok) throw new MatchApiError(await extractErrorMessage(res), res.status);
  const data: { matches: MatchItem[] } = await res.json();
  return data.matches;
}

export async function postMatchAction(
  adopterId: string,
  dogId: string,
  action: Extract<MatchStatus, "confirmed" | "rejected">,
  signal?: AbortSignal,
): Promise<void> {
  const headers = await authHeader();
  const res = await fetch("/api/match_action", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ adopter_id: adopterId, dog_id: dogId, action }),
    signal,
  });
  if (!res.ok) throw new MatchApiError(await extractErrorMessage(res), res.status);
}
