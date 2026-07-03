# Backend Rules — Python / Supabase (api/ directory)

> Read this when working on anything inside `api/`.
> The full feature spec is in `SPEC.md` (project root). This file covers *how* to
> write backend code, not *what* to build.

## Role
Act as a senior Python backend developer and database architect. Priorities, in order:
correctness → security → data integrity → performance within serverless limits.

## Tech Stack
- Python (serverless functions, one concern per file).
- `supabase-py` for all DB access. Do NOT add other DB libraries.
- `pydantic` for request/response validation.
- `fastapi` only where an endpoint genuinely needs it; simple handlers are fine.

## Matching Algorithm — Mathematical Rules (the critical part)
The scoring logic is the heart of this app. Get the math right.

- Total score is 0–100. Display threshold is **>= 70**.
- Weights (72/24/4):
  - High (24 pts each): Energy Level, Child Compatibility, Size.
  - Medium (8 pts each): Good with Dogs, Good with Cats, Dog Age.
  - Low (4 pts): Shedding.
- **Scaled parameters (energy, size) MUST use gradual penalties**, never
  binary pass/fail. The per-parameter score formula is:

      S_param = W * (1 - abs(V_dog - V_adopter) / delta_max)

  where W is the max weight for that parameter and delta_max is the maximum
  possible difference on that scale. Clamp the result at 0 (never negative).
  delta_max values: **energy = 4** (1–5 scale); **size = 2** (3 tiers only:
  small=1, medium=2, large=3). An adopter size preference of `doesnt_matter`
  scores the full weight (skip the penalty).
- **Dog age (8 pts) uses range membership, NOT a simple scalar diff.** The adopter
  picks a range (`0-1`, `1-3`, `3-7`, `7-10`, `10+`); the dog has an integer age.
  Award the full 8 pts when the dog's age is inside the range; outside it, apply a
  gradual penalty that grows with the number of years beyond the nearest range edge,
  down to 0. See SPEC.md §3 for the exact formula.
- Child Compatibility special case: families WITHOUT children get full 24 pts
  automatically. For families WITH children, the penalty for a dog not good with
  children grows as `youngest_child_age` decreases.
- "Good with dogs/cats" and "shedding": these are conditional booleans — see
  SPEC.md §3 for the exact 8/0 and 4/0 rules. Note: the adopter `sheds` preference is
  text (`no` | `doesnt_matter`), not a boolean.
- Write the algorithm as pure functions that take plain dicts and return floats,
  so they can be unit-tested without a DB connection.

## Database Operations
- Read `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from environment variables.
  NEVER hardcode keys or commit them.
- Validate and type every input with pydantic before it touches Supabase.
- Catch DB exceptions; return meaningful HTTP status codes and JSON error bodies,
  never raw stack traces.
- Respect Row Level Security — assume RLS is on; the service role key is server-only.

## Serverless Constraints (Vercel)
- Each function must finish well within the 10s free-tier timeout.
- No heavy synchronous loops over large datasets in a request path. If the dog
  table grows large, push core filtering into a Supabase SQL function / RPC and
  let Python only do final scoring.
- Keep cold-start light: import only what the function needs.

## Quality Gate (do this before saying a task is done)
1. Run `ruff check --fix` on edited Python files; ensure zero remaining errors.
2. If unit tests exist for the matcher, run them and confirm they pass.
3. Re-read the algorithm output against SPEC.md §3 to confirm weights sum to 100
   and gradual penalties behave correctly at the edges (perfect match = full points,
   max mismatch = 0 for that parameter).
