"""Admin-only detail/update/delete for a single Supabase Auth user.

Split from `api/admin_users.py` (plural) — see that file's module docstring
for why `user_id` is a `?user_id=` query param here rather than a
`/{user_id}` path segment (the same convention `api/matches.py` already uses
for `adopter_id`).
"""

import logging
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from supabase_auth.errors import AuthError

import db_client
from admin_auth import get_authenticated_admin_user_id
from admin_users import ProfileOut, Role, map_auth_error

logger = logging.getLogger(__name__)

app = FastAPI()


class AdopterOut(BaseModel):
    id: str
    user_id: str
    first_name: str | None
    last_name: str | None
    birth_date: str | None
    age: int | None
    family_structure: str | None
    energy_level: int | None
    number_of_children: int | None
    youngest_child_age: int | None
    number_of_dogs: int | None
    number_of_cats: int | None
    household_size: int | None
    phone: str | None
    size: str | None
    sheds: str | None
    dog_age: str | None
    created_at: str


class UserDetailResponse(BaseModel):
    profile: ProfileOut
    adopter: AdopterOut | None


class UpdateUserRequest(BaseModel):
    email: str | None = None
    role: Role | None = None
    password: str | None = Field(default=None, min_length=6)


@app.get("/api/admin_user")
@app.get("/api/admin_user/")
def get_user(
    user_id: UUID = Query(...),
    _admin_id: str = Depends(get_authenticated_admin_user_id),
) -> UserDetailResponse:
    try:
        profile = db_client.fetch_profile_by_id(str(user_id))
    except Exception:
        logger.exception("fetch_profile_by_id failed")
        raise HTTPException(status_code=500, detail="failed to fetch user")
    if profile is None:
        raise HTTPException(status_code=404, detail="user not found")

    try:
        adopter = db_client.fetch_adopter_by_user_id(str(user_id))
    except Exception:
        logger.exception("fetch_adopter_by_user_id failed")
        raise HTTPException(status_code=500, detail="failed to fetch adopter profile")

    return UserDetailResponse(
        profile=ProfileOut(**profile),
        adopter=AdopterOut(**adopter) if adopter else None,
    )


@app.patch("/api/admin_user")
@app.patch("/api/admin_user/")
def update_user(
    body: UpdateUserRequest,
    user_id: UUID = Query(...),
    admin_id: str = Depends(get_authenticated_admin_user_id),
) -> ProfileOut:
    # Parse both sides as UUID before comparing, so a case-formatting quirk
    # can't produce a false-negative match and silently bypass the guardrail.
    if body.role is not None and body.role != "admin" and user_id == UUID(admin_id):
        raise HTTPException(
            status_code=400, detail="you cannot remove your own admin role"
        )

    try:
        existing = db_client.fetch_profile_by_id(str(user_id))
    except Exception:
        logger.exception("fetch_profile_by_id failed")
        raise HTTPException(status_code=500, detail="failed to fetch user")
    if existing is None:
        raise HTTPException(status_code=404, detail="user not found")

    email_changed = body.email is not None and body.email != existing["email"]

    if email_changed or body.password is not None:
        try:
            db_client.admin_update_user_auth(
                str(user_id),
                email=body.email if email_changed else None,
                password=body.password,
            )
        except AuthError as exc:
            raise map_auth_error(exc) from exc
        except Exception:
            logger.exception("admin_update_user_auth failed")
            raise HTTPException(
                status_code=500, detail="failed to update user credentials"
            )

    if email_changed or body.role is not None:
        try:
            profile = db_client.update_profile(
                str(user_id),
                email=body.email if email_changed else None,
                role=body.role,
            )
        except Exception:
            logger.exception("update_profile failed")
            raise HTTPException(status_code=500, detail="failed to update user")
    else:
        profile = existing

    return ProfileOut(**profile)


@app.delete("/api/admin_user")
@app.delete("/api/admin_user/")
def delete_user(
    user_id: UUID = Query(...),
    admin_id: str = Depends(get_authenticated_admin_user_id),
) -> dict[str, bool]:
    if user_id == UUID(admin_id):
        raise HTTPException(
            status_code=400, detail="you cannot delete your own account"
        )

    try:
        db_client.admin_delete_user(str(user_id))
    except AuthError as exc:
        raise map_auth_error(exc) from exc
    except Exception:
        logger.exception("admin_delete_user failed")
        raise HTTPException(status_code=500, detail="failed to delete user")

    return {"deleted": True}
