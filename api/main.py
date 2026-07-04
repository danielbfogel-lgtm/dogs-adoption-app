"""Single FastAPI entrypoint for Vercel's Services model.

Combining a Python backend with a Next.js frontend in one Vercel project now
requires `vercel.json`'s `services`/`rewrites` config, and a Python service
detected as FastAPI must declare exactly one `module:app` `entrypoint` (see
`vercel.json`'s `backend` service) — Vercel no longer auto-discovers multiple
independent `FastAPI()` apps spread across sibling files the way the older
flat `api/**/*.py` convention did (that's what every route file used before
this change; each had its own `app = FastAPI()`).

This module mounts each domain file's `router` (unchanged route paths/logic)
onto one `app` — the per-file organization stays the same, only how the
pieces are wired together changes.
"""

from fastapi import FastAPI

import admin_user
import admin_users
import dogs
import index
import match_action
import matches

app = FastAPI()

app.include_router(index.router)
app.include_router(dogs.router)
app.include_router(matches.router)
app.include_router(match_action.router)
app.include_router(admin_users.router)
app.include_router(admin_user.router)
