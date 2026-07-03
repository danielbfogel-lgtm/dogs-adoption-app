"""Bearer-token admin-role check for admin-only endpoints.

`admin_users.py` reads/writes with the service-role key (see `db_client.py`),
which bypasses RLS entirely — and unlike `dogs`, `profiles`/`adopters` have no
admin-scoped RLS carve-out at all (SPEC.md §5 RBAC: "Admin: Full CRUD access
to ... user management"). So this endpoint must verify the caller is both
authenticated *and* an admin itself, the same way `auth.py`'s
`get_authenticated_adopter_id` verifies adopter self-ownership.
"""

import logging

from fastapi import Header, HTTPException

import db_client

logger = logging.getLogger(__name__)


def get_authenticated_admin_user_id(
    authorization: str | None = Header(default=None),
) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="missing bearer token")

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="missing bearer token")

    try:
        user_id = db_client.get_user_id_from_token(token)
    except Exception:
        # A failure *verifying* the token (network/timeout talking to
        # Supabase Auth) is not the same as the token being invalid — 401
        # would wrongly tell the client their session itself is bad.
        logger.exception("get_user_id_from_token failed")
        raise HTTPException(
            status_code=503, detail="authentication service unavailable"
        )
    if user_id is None:
        raise HTTPException(status_code=401, detail="invalid or expired session")

    try:
        profile = db_client.fetch_profile_by_id(user_id)
    except Exception:
        logger.exception("fetch_profile_by_id failed")
        raise HTTPException(status_code=500, detail="failed to look up profile")

    # 403, not 404: the caller is authenticated (they have a valid session),
    # just not permitted — a missing/non-admin profile is the same "you may
    # not do this" outcome from the caller's point of view.
    if profile is None or profile["role"] != "admin":
        raise HTTPException(status_code=403, detail="admin role required")

    return user_id
