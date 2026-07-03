"""Unit tests for api/admin_users.py + api/admin_user.py's branching logic.

Focused on the parts with real logic worth a regression test — self-service
guardrails and gotrue error-code mapping — not the CRUD plumbing itself.
`db_client` calls are monkeypatched so these run with no real Supabase
dependency. The `Depends(...)`-injected params (`admin_id`/`_admin_id`) are
passed directly, bypassing FastAPI's request pipeline — but `user_id` query
params are still wrapped in `UUID(...)` here, matching what FastAPI's own
query-param coercion would actually pass to the function at runtime (the
endpoints compare `user_id == UUID(admin_id)`, which is never `True` for a
bare `str` on either side).
"""

from uuid import UUID, uuid4

import pytest
from fastapi import HTTPException
from supabase_auth.errors import AuthApiError, AuthWeakPasswordError

import admin_user
import admin_users
import db_client

SOME_ID = str(uuid4())
OTHER_ID = str(uuid4())


def _profile(user_id: str, role: str = "adopter") -> dict:
    return {
        "id": user_id,
        "email": "user@example.com",
        "role": role,
        "created_at": "2026-01-01T00:00:00Z",
    }


def test_list_users_returns_page(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        db_client,
        "fetch_profiles_page",
        lambda limit, offset, search: ([_profile(SOME_ID)], 1),
    )

    result = admin_users.list_users(limit=50, offset=0, search=None, _admin_id=OTHER_ID)
    assert result.total == 1
    assert result.users[0].id == SOME_ID


def test_get_user_404_when_missing(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(db_client, "fetch_profile_by_id", lambda user_id: None)

    with pytest.raises(HTTPException) as exc_info:
        admin_user.get_user(UUID(SOME_ID), _admin_id=OTHER_ID)
    assert exc_info.value.status_code == 404


def test_create_user_maps_email_exists_to_409(monkeypatch: pytest.MonkeyPatch) -> None:
    def raise_error(email: str, password: str) -> str:
        raise AuthApiError("User already registered", 422, "email_exists")

    monkeypatch.setattr(db_client, "admin_create_user", raise_error)

    body = admin_users.CreateUserRequest(email="a@b.com", password="secret1")
    with pytest.raises(HTTPException) as exc_info:
        admin_users.create_user(body, _admin_id=OTHER_ID)
    assert exc_info.value.status_code == 409


def test_create_user_maps_weak_password_to_400(monkeypatch: pytest.MonkeyPatch) -> None:
    def raise_error(email: str, password: str) -> str:
        raise AuthWeakPasswordError("Password too weak", 422, ["too short"])

    monkeypatch.setattr(db_client, "admin_create_user", raise_error)

    body = admin_users.CreateUserRequest(email="a@b.com", password="secret1")
    with pytest.raises(HTTPException) as exc_info:
        admin_users.create_user(body, _admin_id=OTHER_ID)
    assert exc_info.value.status_code == 400


def test_create_user_promotes_role_to_admin(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(db_client, "admin_create_user", lambda email, password: SOME_ID)
    monkeypatch.setattr(
        db_client,
        "update_profile",
        lambda user_id, **kwargs: _profile(user_id, role=kwargs.get("role", "adopter")),
    )

    body = admin_users.CreateUserRequest(
        email="a@b.com", password="secret1", role="admin"
    )
    result = admin_users.create_user(body, _admin_id=OTHER_ID)
    assert result.role == "admin"


def test_update_user_blocks_self_demotion(monkeypatch: pytest.MonkeyPatch) -> None:
    body = admin_user.UpdateUserRequest(role="adopter")
    with pytest.raises(HTTPException) as exc_info:
        admin_user.update_user(body, UUID(SOME_ID), admin_id=SOME_ID)
    assert exc_info.value.status_code == 400


def test_update_user_404_when_missing(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(db_client, "fetch_profile_by_id", lambda user_id: None)

    body = admin_user.UpdateUserRequest(email="new@example.com")
    with pytest.raises(HTTPException) as exc_info:
        admin_user.update_user(body, UUID(SOME_ID), admin_id=OTHER_ID)
    assert exc_info.value.status_code == 404


def test_update_user_allows_changing_own_email(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        db_client, "fetch_profile_by_id", lambda user_id: _profile(user_id)
    )
    monkeypatch.setattr(
        db_client, "admin_update_user_auth", lambda user_id, **kwargs: None
    )
    monkeypatch.setattr(
        db_client,
        "update_profile",
        lambda user_id, **kwargs: _profile(
            user_id, role=kwargs.get("role") or "adopter"
        ),
    )

    body = admin_user.UpdateUserRequest(email="new@example.com")
    result = admin_user.update_user(body, UUID(SOME_ID), admin_id=SOME_ID)
    assert result.id == SOME_ID


def test_delete_user_blocks_self_delete(monkeypatch: pytest.MonkeyPatch) -> None:
    with pytest.raises(HTTPException) as exc_info:
        admin_user.delete_user(UUID(SOME_ID), admin_id=SOME_ID)
    assert exc_info.value.status_code == 400


def test_delete_user_maps_user_not_found_to_404(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def raise_error(user_id: str) -> None:
        raise AuthApiError("User not found", 404, "user_not_found")

    monkeypatch.setattr(db_client, "admin_delete_user", raise_error)

    with pytest.raises(HTTPException) as exc_info:
        admin_user.delete_user(UUID(SOME_ID), admin_id=OTHER_ID)
    assert exc_info.value.status_code == 404


def test_delete_user_succeeds(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(db_client, "admin_delete_user", lambda user_id: None)

    result = admin_user.delete_user(UUID(SOME_ID), admin_id=OTHER_ID)
    assert result == {"deleted": True}
