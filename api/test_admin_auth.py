"""Unit tests for api/admin_auth.py's bearer-token admin-role dependency.

`db_client`'s network calls (`get_user_id_from_token`, `fetch_profile_by_id`)
are monkeypatched so these run with no real Supabase/network dependency.
"""

import pytest
from fastapi import HTTPException

import admin_auth
import db_client


def test_missing_header_is_401() -> None:
    with pytest.raises(HTTPException) as exc_info:
        admin_auth.get_authenticated_admin_user_id(authorization=None)
    assert exc_info.value.status_code == 401


def test_non_bearer_header_is_401() -> None:
    with pytest.raises(HTTPException) as exc_info:
        admin_auth.get_authenticated_admin_user_id(authorization="Basic abc123")
    assert exc_info.value.status_code == 401


def test_empty_bearer_token_is_401() -> None:
    with pytest.raises(HTTPException) as exc_info:
        admin_auth.get_authenticated_admin_user_id(authorization="Bearer ")
    assert exc_info.value.status_code == 401


def test_invalid_token_is_401(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(db_client, "get_user_id_from_token", lambda token: None)

    with pytest.raises(HTTPException) as exc_info:
        admin_auth.get_authenticated_admin_user_id(authorization="Bearer bad-token")
    assert exc_info.value.status_code == 401


def test_token_verification_infra_error_is_503(monkeypatch: pytest.MonkeyPatch) -> None:
    def raise_error(token: str) -> str | None:
        raise RuntimeError("network error")

    monkeypatch.setattr(db_client, "get_user_id_from_token", raise_error)

    with pytest.raises(HTTPException) as exc_info:
        admin_auth.get_authenticated_admin_user_id(authorization="Bearer some-token")
    assert exc_info.value.status_code == 503


def test_profile_lookup_error_is_500(monkeypatch: pytest.MonkeyPatch) -> None:
    def raise_error(user_id: str):
        raise RuntimeError("db error")

    monkeypatch.setattr(db_client, "get_user_id_from_token", lambda token: "user-1")
    monkeypatch.setattr(db_client, "fetch_profile_by_id", raise_error)

    with pytest.raises(HTTPException) as exc_info:
        admin_auth.get_authenticated_admin_user_id(authorization="Bearer good-token")
    assert exc_info.value.status_code == 500


def test_missing_profile_is_403(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(db_client, "get_user_id_from_token", lambda token: "user-1")
    monkeypatch.setattr(db_client, "fetch_profile_by_id", lambda user_id: None)

    with pytest.raises(HTTPException) as exc_info:
        admin_auth.get_authenticated_admin_user_id(authorization="Bearer good-token")
    assert exc_info.value.status_code == 403


def test_non_admin_profile_is_403(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(db_client, "get_user_id_from_token", lambda token: "user-1")
    monkeypatch.setattr(
        db_client,
        "fetch_profile_by_id",
        lambda user_id: {"id": user_id, "email": "a@b.com", "role": "adopter"},
    )

    with pytest.raises(HTTPException) as exc_info:
        admin_auth.get_authenticated_admin_user_id(authorization="Bearer good-token")
    assert exc_info.value.status_code == 403


def test_valid_admin_token_returns_user_id(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(db_client, "get_user_id_from_token", lambda token: "user-1")
    monkeypatch.setattr(
        db_client,
        "fetch_profile_by_id",
        lambda user_id: {"id": user_id, "email": "a@b.com", "role": "admin"},
    )

    assert (
        admin_auth.get_authenticated_admin_user_id(authorization="Bearer good-token")
        == "user-1"
    )


def test_bearer_scheme_is_case_insensitive(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(db_client, "get_user_id_from_token", lambda token: "user-1")
    monkeypatch.setattr(
        db_client,
        "fetch_profile_by_id",
        lambda user_id: {"id": user_id, "email": "a@b.com", "role": "admin"},
    )

    assert (
        admin_auth.get_authenticated_admin_user_id(authorization="bearer good-token")
        == "user-1"
    )
