# Dog Adoption Matching Platform

A platform that matches adoptable dogs with potential adopting families using a
weighted compatibility scoring algorithm. Built with the **Vibe Coding**
approach on a Vercel Serverless Split-Stack.

Full functional/technical requirements live in [`SPEC.md`](./SPEC.md).

## Tech Stack

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS, icons via `lucide-react`.
- **Backend:** Python serverless functions in `api/`, built with FastAPI + Pydantic, using `supabase-py`.
- **Database & Auth:** Supabase (Postgres, Auth, Storage, RLS).
- **Deployment:** Vercel (frontend + Python functions as separate services), CI/CD via GitHub.

## Directory Layout

```
api/              Backend — Python serverless functions (FastAPI app, matching engine, DB client)
src/app/          Frontend — Next.js App Router pages (login, register, matches, dogs, profile, admin)
src/components/   Frontend — React components
src/lib/          Frontend — shared TypeScript helpers, Supabase clients, Server Actions
src/proxy.ts      Frontend — Next.js middleware (route protection / session refresh)
supabase/         Database migrations (shared infrastructure)
SPEC.md           Full project specification (source of truth for features)
api/backend-rules.md  Backend coding conventions
```

## The Matching Algorithm

Every dog-adopter pair is scored 0–100; a dog is only shown to an adopter once
its score is **>= 70**. Weights follow a 72/24/4 method:

| Weight | Parameters |
|---|---|
| High (24% each) | Energy Level, Child Compatibility, Size |
| Medium (8% each) | Good with Dogs, Good with Cats, Dog Age |
| Low (4%) | Shedding |

Scaled parameters (energy, size) use **gradual** penalties proportional to the
absolute difference, not binary pass/fail — see `SPEC.md §3` for the full
formulas.

## Getting Started

Local development runs through the Vercel CLI so the Next.js frontend and
Python backend run together (`next dev` alone will not serve `api/`):

```bash
npm install
pip install -r api/requirements.txt
vercel dev
```

Then open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Create a `.env.local` (frontend) / `.env` (backend) with:

```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Never hardcode credentials — both frontend and backend read these from the
environment.

### Database

Schema changes are managed as SQL migrations under `supabase/migrations/`.
Apply them with the Supabase CLI:

```bash
supabase db push
```

## Deployment

Deployed to Vercel as two services defined in `vercel.json`: the Next.js
frontend and the Python (FastAPI) backend, with `/api/*` routed to the
backend and everything else to the frontend.
