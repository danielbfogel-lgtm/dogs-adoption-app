"""Bearer-token checks for adopter-facing endpoints.

`matches.py` and `match_action.py` read/write with the service-role key (see
`db_client.py`), which bypasses RLS entirely — so, unlike the Next.js side
(where Postgres RLS is the real enforcement), these endpoints must verify the
caller's identity themselves instead of trusting a client-supplied
`adopter_id` at face value (SPEC.md §5 RBAC: "Adopter: ... confirm/reject
[their own] matches"). `get_authenticated_adopter_id` validates the
`Authorization: Bearer <token>` header the frontend sends (the caller's
Supabase session access token) and returns *that user's own* `adopters.id`,
which callers must then cross-check against any client-supplied `adopter_id`.
"""

import logging

from fastapi import Header, HTTPException

import db_client

logger = logging.getLogger(__name__)


def _verify_bearer_token(authorization: str | None) -> str:
    """Validates the `Authorization: Bearer <token>` header and returns the
    caller's user id. Shared by `get_authenticated_user_id` (any logged-in
    user) and `get_authenticated_adopter_id` (logged-in *and* has an
    `adopters` row) below.
    """
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

    return user_id


def get_authenticated_user_id(authorization: str | None = Header(default=None)) -> str:
    """Any logged-in user (adopter or admin) — used by endpoints like
    `dogs.py` that don't need an `adopters` row, just a valid session
    (SPEC.md §4 "All Dogs Gallery" requires login, but isn't adopter-specific).
    """
    return _verify_bearer_token(authorization)


def get_authenticated_adopter_id(
    authorization: str | None = Header(default=None),
) -> str:
    user_id = _verify_bearer_token(authorization)

    try:
        adopter = db_client.fetch_adopter_by_user_id(user_id)
    except Exception:
        logger.exception("fetch_adopter_by_user_id failed")
        raise HTTPException(status_code=500, detail="failed to look up adopter profile")
    if adopter is None:
        raise HTTPException(status_code=404, detail="adopter profile not found")

    return adopter["id"]
