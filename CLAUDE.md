# CLAUDE.md — Dog Adoption Matching Platform

> This file is loaded at the start of every Claude Code session. Keep it short.
> The full functional/technical requirements live in **SPEC.md** — read that file
> before implementing any feature.

## Project Summary

A platform that matches adoptable dogs with potential adopting families using a
weighted scoring algorithm. Built with the **Vibe Coding** approach on a
**Vercel Serverless Split-Stack**.

## Tech Stack

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS. Icons: `lucide-react`.
- **Backend:** Python serverless functions in `api/`. Uses `supabase-py`, `fastapi`, `pydantic`.
- **Database & Auth:** Supabase. Server talks to DB via `supabase-py`.
- **Deployment:** Vercel (frontend + Python functions), CI/CD via GitHub.
- **Local dev:** Run `vercel dev` (NOT `next dev`) — only `vercel dev` runs the
Python functions alongside Next.js locally.

## Directory Layout

Backend and frontend are split into their own top-level folders — `api/` is
the only backend location Vercel will treat as Python serverless functions,
so it stays at the project root; everything else Next.js owns lives under
`src/` (Next.js's built-in "src directory" convention). The `@/*` path alias
(`tsconfig.json`) points at `./src/*`, so `@/lib/...`/`@/components/...`
imports are unaffected by files' physical location under `src/`.

- `api/` — **Backend.** Python serverless functions (DB client, matching engine, API routes).
- `src/app/` — **Frontend.** Next.js App Router pages.
- `src/components/` — **Frontend.** React components.
- `src/lib/` — **Frontend.** Shared TypeScript helpers, Supabase clients, Server Actions.
- `src/proxy.ts` — **Frontend.** Next.js middleware (route protection / session refresh).
- `supabase/` — Database migrations (shared infrastructure, not exclusively frontend or backend).
- `SPEC.md` — full project specification (source of truth for features).
- `api/backend-rules.md` — backend coding conventions (read when working in `api/`).
- Obsidian status file: "C:\Users\danie\OneDrive\Desktop\Courses\AI Developers\GeneralClaudeVault\Projects\Dogs Adoption [App.md](http://App.md)" — read at task start, update at task end.

## Core Conventions

- **TypeScript:** No `any`. Strictly type all props, state, and DB rows to match the schema.
- **Python:** Strict type hints. Validate all inputs before querying Supabase.
Handle exceptions and return meaningful HTTP error codes.
- **Components:** Small, modular, reusable. Prefer Server Components for static data;
use `"use client"` only when hooks or interactivity are needed.
- **Mobile-first:** The UI must be fully responsive. This site is used by families on phones.
- **Secrets:** Read `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from environment
variables. Never hardcode credentials.

## The Matching Algorithm (critical — see SPEC.md §3 for full detail)

- Score is 0–100. A dog is shown to an adopter ONLY if score **>= 70**.
- Weights: 72/24/4 method.
  - High (24% each): Energy Level, Child Compatibility, Size.
  - Medium (8% each): Good with Dogs, Good with Cats, Dog Age.
  - Low (4%): Shedding.
- **Use GRADUAL penalties** (fraction of the weight based on absolute difference)
for scaled parameters: energy (`delta_max=4`) and size (3 tiers only —
small/medium/large — `delta_max=2`; "doesn't matter" = full points). Do NOT use
binary pass/fail on scales.
- **Dog age** is range-based: the adopter picks an age range and the dog has an
integer age — full points inside the range, gradual penalty outside (see SPEC.md §3).

## Serverless Limits

- Keep endpoints lightweight — Vercel free tier has a 10s function timeout.
- If dog volume grows large, consider moving core filtering into Supabase SQL/RPC.

## Quality Gate

- After editing Python, run `ruff` to self-correct formatting and syntax.
- After meaningful code changes, the `code-reviewer` subagent should review the diff.

