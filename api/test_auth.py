"""Unit tests for api/auth.py's bearer-token ownership dependency.

`db_client`'s network calls (`get_user_id_from_token`, `fetch_adopter_by_user_id`)
are monkeypatched so these run with no real Supabase/network dependency.
"""

import pytest
from fastapi import HTTPException

import auth
import db_client


def test_missing_header_is_401() -> None:
    with pytest.raises(HTTPException) as exc_info:
        auth.get_authenticated_adopter_id(authorization=None)
    assert exc_info.value.status_code == 401


def test_non_bearer_header_is_401() -> None:
    with pytest.raises(HTTPException) as exc_info:
        auth.get_authenticated_adopter_id(authorization="Basic abc123")
    assert exc_info.value.status_code == 401


def test_empty_bearer_token_is_401() -> None:
    with pytest.raises(HTTPException) as exc_info:
        auth.get_authenticated_adopter_id(authorization="Bearer ")
    assert exc_info.value.status_code == 401


def test_invalid_token_is_401(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(db_client, "get_user_id_from_token", lambda token: None)

    with pytest.raises(HTTPException) as exc_info:
        auth.get_authenticated_adopter_id(authorization="Bearer bad-token")
    assert exc_info.value.status_code == 401


def test_token_verification_infra_error_is_503(monkeypatch: pytest.MonkeyPatch) -> None:
    def raise_error(token: str) -> str | None:
        raise RuntimeError("network error")

    monkeypatch.setattr(db_client, "get_user_id_from_token", raise_error)

    with pytest.raises(HTTPException) as exc_info:
        auth.get_authenticated_adopter_id(authorization="Bearer some-token")
    assert exc_info.value.status_code == 503


def test_adopter_lookup_error_is_500(monkeypatch: pytest.MonkeyPatch) -> None:
    def raise_error(user_id: str):
        raise RuntimeError("db error")

    monkeypatch.setattr(db_client, "get_user_id_from_token", lambda token: "user-1")
    monkeypatch.setattr(db_client, "fetch_adopter_by_user_id", raise_error)

    with pytest.raises(HTTPException) as exc_info:
        auth.get_authenticated_adopter_id(authorization="Bearer good-token")
    assert exc_info.value.status_code == 500


def test_valid_token_with_no_adopter_profile_is_404(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(db_client, "get_user_id_from_token", lambda token: "user-1")
    monkeypatch.setattr(db_client, "fetch_adopter_by_user_id", lambda user_id: None)

    with pytest.raises(HTTPException) as exc_info:
        auth.get_authenticated_adopter_id(authorization="Bearer good-token")
    assert exc_info.value.status_code == 404


def test_valid_token_returns_own_adopter_id(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(db_client, "get_user_id_from_token", lambda token: "user-1")
    monkeypatch.setattr(
        db_client,
        "fetch_adopter_by_user_id",
        lambda user_id: {"id": "adopter-1", "user_id": user_id},
    )

    assert (
        auth.get_authenticated_adopter_id(authorization="Bearer good-token")
        == "adopter-1"
    )


def test_bearer_scheme_is_case_insensitive(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(db_client, "get_user_id_from_token", lambda token: "user-1")
    monkeypatch.setattr(
        db_client,
        "fetch_adopter_by_user_id",
        lambda user_id: {"id": "adopter-1", "user_id": user_id},
    )

    assert (
        auth.get_authenticated_adopter_id(authorization="bearer good-token")
        == "adopter-1"
    )


# get_authenticated_user_id — any logged-in user (adopter or admin), used by
# endpoints like dogs.py that don't need an `adopters` row.


def test_user_id_missing_header_is_401() -> None:
    with pytest.raises(HTTPException) as exc_info:
        auth.get_authenticated_user_id(authorization=None)
    assert exc_info.value.status_code == 401


def test_user_id_invalid_token_is_401(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(db_client, "get_user_id_from_token", lambda token: None)

    with pytest.raises(HTTPException) as exc_info:
        auth.get_authenticated_user_id(authorization="Bearer bad-token")
    assert exc_info.value.status_code == 401


def test_user_id_valid_token_returns_user_id_without_adopter_lookup(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(db_client, "get_user_id_from_token", lambda token: "user-1")

    def fail_if_called(user_id: str) -> None:
        raise AssertionError(
            "get_authenticated_user_id must not look up an adopter row"
        )

    monkeypatch.setattr(db_client, "fetch_adopter_by_user_id", fail_if_called)

    assert auth.get_authenticated_user_id(authorization="Bearer good-token") == "user-1"
