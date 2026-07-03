"""Admin-only listing + creation of Supabase Auth users + their `profiles` row.

Unlike `dogs` (which has `dogs_admin_*` RLS policies as a DB-level backstop),
`profiles`/`adopters` have no admin-scoped RLS carve-out at all — and
creating a user requires Supabase's Admin Auth API (`auth.admin.*`), which
only works with the service-role key. So this whole feature runs through the
Python service-role client (`db_client.py`) self-enforcing an admin check
(`admin_auth.py`) rather than Postgres RLS, the same reasoning `api/auth.py`
already documents for adopter self-ownership.

Single-user operations (detail/update/delete) live in the sibling
`api/admin_user.py` (singular) instead of a `/{user_id}` path segment here —
Vercel's zero-config Python routing maps each `api/*.py` file to exactly one
static path matching its filename (confirmed by every existing endpoint in
this package: `api/matches.py`/`api/match_action.py` pass ids via query
params/request bodies, never a URL path segment), so a route like
`/api/admin_users/{user_id}` would not actually be reachable.
"""

import logging
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from supabase_auth.errors import AuthError, AuthWeakPasswordError

import db_client
from admin_auth import get_authenticated_admin_user_id

logger = logging.getLogger(__name__)

app = FastAPI()

Role = Literal["adopter", "admin"]


class ProfileOut(BaseModel):
    id: str
    email: str | None
    role: Role
    created_at: str


class UsersPageResponse(BaseModel):
    users: list[ProfileOut]
    total: int
    limit: int
    offset: int
    search: str | None


class CreateUserRequest(BaseModel):
    email: str
    password: str = Field(min_length=6)
    role: Role = "adopter"


def map_auth_error(exc: AuthError) -> HTTPException:
    """Maps a gotrue-py Admin Auth API error to a clean HTTP response.

    Shared with `api/admin_user.py`. Never leaks `exc`'s raw message/stack
    trace for an unmapped case, per `api/backend-rules.md` — only the
    specific, expected codes below get a tailored client-safe message.
    """
    if isinstance(exc, AuthWeakPasswordError):
        detail = ", ".join(exc.reasons) if exc.reasons else "password is too weak"
        return HTTPException(status_code=400, detail=detail)

    code = getattr(exc, "code", None)
    if code == "email_exists":
        return HTTPException(
            status_code=409, detail="a user with this email already exists"
        )
    if code == "email_address_invalid":
        return HTTPException(status_code=400, detail="enter a valid email address")
    if code == "user_not_found":
        return HTTPException(status_code=404, detail="user not found")

    logger.exception("Supabase Admin Auth API call failed")
    return HTTPException(status_code=500, detail="failed to complete the request")


@app.get("/api/admin_users")
@app.get("/api/admin_users/")
def list_users(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    search: str | None = Query(default=None, max_length=100),
    _admin_id: str = Depends(get_authenticated_admin_user_id),
) -> UsersPageResponse:
    try:
        users, total = db_client.fetch_profiles_page(limit, offset, search)
    except Exception:
        logger.exception("fetch_profiles_page failed")
        raise HTTPException(status_code=500, detail="failed to fetch users")

    return UsersPageResponse(
        users=[ProfileOut(**u) for u in users],
        total=total,
        limit=limit,
        offset=offset,
        search=search,
    )


@app.post("/api/admin_users")
@app.post("/api/admin_users/")
def create_user(
    body: CreateUserRequest,
    _admin_id: str = Depends(get_authenticated_admin_user_id),
) -> ProfileOut:
    try:
        new_user_id = db_client.admin_create_user(body.email, body.password)
    except AuthError as exc:
        raise map_auth_error(exc) from exc
    except Exception:
        logger.exception("admin_create_user failed")
        raise HTTPException(status_code=500, detail="failed to create user")

    # handle_new_user always inserts role='adopter' first (see the
    # 2026-07-01 migration) — a follow-up update is required for admin role.
    if body.role == "admin":
        try:
            profile = db_client.update_profile(new_user_id, role="admin")
        except Exception:
            logger.exception("update_profile failed after admin_create_user")
            raise HTTPException(
                status_code=500,
                detail=(
                    f"user was created (id {new_user_id}) but the admin role "
                    "could not be set — edit the user to try again"
                ),
            )
    else:
        try:
            profile = db_client.fetch_profile_by_id(new_user_id)
        except Exception:
            logger.exception("fetch_profile_by_id failed after admin_create_user")
            raise HTTPException(
                status_code=500,
                detail=f"user was created (id {new_user_id}) but could not be fetched",
            )
        if profile is None:
            raise HTTPException(
                status_code=500,
                detail=f"user was created (id {new_user_id}) but no profile was found",
            )

    return ProfileOut(**profile)
