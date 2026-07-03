"""Supabase database client and typed query helpers."""

import os
from typing import Literal, TypedDict

from supabase import Client, create_client

_client: Client | None = None


def _get_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_ROLE_KEY"],
        )
    return _client


class Dog(TypedDict):
    id: str
    name: str | None
    birth_date: str | None
    age: int | None
    breed: str | None
    size: str | None  # 'small' | 'medium' | 'large'
    energy_level: int | None
    good_with_children: bool | None
    good_with_dogs: bool | None
    good_with_cats: bool | None
    sheds: bool | None
    free_description: str | None
    status: str  # 'available' | 'pending' | 'adopted'
    photo_url: str | None
    created_at: str


class Adopter(TypedDict):
    id: str
    user_id: str
    first_name: str | None
    last_name: str | None
    birth_date: str | None
    age: int | None
    family_structure: str | None  # 'single' | 'couple' | 'family'
    energy_level: int | None
    number_of_children: int | None
    youngest_child_age: int | None
    number_of_dogs: int | None
    number_of_cats: int | None
    household_size: int | None
    phone: str | None
    size: str | None  # 'small' | 'medium' | 'large' | 'doesnt_matter'
    sheds: str | None  # 'no' | 'doesnt_matter'
    dog_age: str | None  # '0-1' | '1-3' | '3-7' | '7-10' | '10+'
    created_at: str


class PotentialMatch(TypedDict):
    id: str
    adopter_id: str
    dog_id: str
    matching_score: float | None
    match_status: str  # 'pending' | 'confirmed' | 'rejected'
    created_at: str


class Profile(TypedDict):
    id: str
    email: str | None
    role: str  # 'adopter' | 'admin'
    created_at: str


def _ilike_pattern(term: str) -> str:
    """Escapes `%`/`_`/`\\` (PostgREST `ilike` wildcards) then wraps in `%...%`.

    Shared by `fetch_dogs_page` and `fetch_profiles_page` so a literal `%`/`_`
    typed by the user acts as a literal character, not a wildcard.
    """
    escaped = term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


def fetch_all_dogs() -> list[Dog]:
    response = _get_client().table("dogs").select("*").execute()
    return response.data


def fetch_dog_by_id(dog_id: str) -> Dog | None:
    response = (
        _get_client()
        .table("dogs")
        .select("*")
        .eq("id", dog_id)
        .maybe_single()
        .execute()
    )
    return response.data


def fetch_adopter_by_id(adopter_id: str) -> Adopter | None:
    response = (
        _get_client()
        .table("adopters")
        .select("*")
        .eq("id", adopter_id)
        .maybe_single()
        .execute()
    )
    return response.data


def fetch_adopter_by_user_id(user_id: str) -> Adopter | None:
    response = (
        _get_client()
        .table("adopters")
        .select("*")
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    return response.data


def get_user_id_from_token(token: str) -> str | None:
    """Verifies a Supabase session access token and returns its `sub` (user id).

    Delegates to GoTrue's `GET /auth/v1/user` (via the already-initialized
    service-role client — the client's own API key is irrelevant here, only
    the passed `token` is validated) so a forged/expired/tampered token is
    rejected without this service needing its own JWT-verification logic.
    """
    response = _get_client().auth.get_user(token)
    if response is None or response.user is None:
        return None
    return response.user.id


def fetch_existing_matches(adopter_id: str) -> list[PotentialMatch]:
    response = (
        _get_client()
        .table("potential_matches")
        .select("*")
        .eq("adopter_id", adopter_id)
        .execute()
    )
    return response.data


def fetch_dogs_page(
    limit: int, offset: int, search: str | None = None
) -> tuple[list[Dog], int]:
    # count="exact" runs a full COUNT(*) on every page — fine at current
    # scale; revisit (e.g. count="planned") if the `dogs` table grows large
    # per CLAUDE.md's serverless-limits note.
    query = _get_client().table("dogs").select("*", count="exact")
    if search:
        # `.ilike()` passes the pattern as an opaque PostgREST filter value
        # (not concatenated SQL), so this isn't SQL-injectable.
        query = query.ilike("name", _ilike_pattern(search))
    response = query.range(offset, offset + limit - 1).execute()
    return response.data, response.count or 0


def fetch_profile_by_id(user_id: str) -> Profile | None:
    response = (
        _get_client()
        .table("profiles")
        .select("*")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )
    return response.data


def fetch_profiles_page(
    limit: int, offset: int, search: str | None = None
) -> tuple[list[Profile], int]:
    query = (
        _get_client()
        .table("profiles")
        .select("*", count="exact")
        .order("created_at", desc=True)
    )
    if search:
        query = query.ilike("email", _ilike_pattern(search))
    response = query.range(offset, offset + limit - 1).execute()
    return response.data, response.count or 0


def update_profile(
    user_id: str,
    *,
    email: str | None = None,
    role: Literal["adopter", "admin"] | None = None,
) -> Profile:
    """Partial update of a `profiles` row.

    Callers must confirm the row exists first (e.g. via `fetch_profile_by_id`)
    — an update against a missing id returns `data: []`, and indexing `[0]`
    below would raise `IndexError` rather than surfacing a clean not-found.
    """
    if email is None and role is None:
        raise ValueError("update_profile requires at least one field to update")
    fields: dict[str, str] = {}
    if email is not None:
        fields["email"] = email
    if role is not None:
        fields["role"] = role
    response = (
        _get_client().table("profiles").update(fields).eq("id", user_id).execute()
    )
    return response.data[0]


def admin_create_user(email: str, password: str) -> str:
    """Creates a new Supabase Auth user via the Admin API and returns its id.

    `email_confirm=True` makes the account immediately usable with the
    admin-set password — an admin-created account shouldn't be stuck behind
    an email-confirmation loop. `handle_new_user` (see the
    2026-07-01 migration) fires synchronously within the `auth.users` INSERT
    that this call performs, so by the time this function returns, the
    matching `public.profiles` row (role='adopter') already exists.
    """
    response = _get_client().auth.admin.create_user(
        {"email": email, "password": password, "email_confirm": True}
    )
    return response.user.id


def admin_update_user_auth(
    user_id: str, *, email: str | None = None, password: str | None = None
) -> None:
    """Updates auth-side attributes (email and/or password) via the Admin API.

    `profiles.email` is only a mirror column written once at signup — the
    actual login credential is `auth.users.email`, so an email change must go
    through this Admin API call (not a plain `profiles` table update) to take
    effect. `email_confirm=True` is set whenever `email` changes so the new
    address is effective immediately, without GoTrue's normal
    reconfirmation-email flow.
    """
    attributes: dict[str, str | bool] = {}
    if email is not None:
        attributes["email"] = email
        attributes["email_confirm"] = True
    if password is not None:
        attributes["password"] = password
    if not attributes:
        return
    _get_client().auth.admin.update_user_by_id(user_id, attributes)


def admin_delete_user(user_id: str) -> None:
    """Deletes a Supabase Auth user via the Admin API.

    No manual cleanup of `profiles`/`adopters`/`potential_matches` is needed:
    `profiles.id` references `auth.users(id) on delete cascade`,
    `adopters.user_id` references `profiles(id) on delete cascade`, and
    `potential_matches.adopter_id` references `adopters(id) on delete cascade`
    (see `supabase/migrations/20260623125227_create_initial_schema.sql`), so
    deleting the auth user cascades through all of them automatically.
    """
    _get_client().auth.admin.delete_user(user_id)


def upsert_match_status(
    adopter_id: str,
    dog_id: str,
    match_status: Literal["pending", "confirmed", "rejected"],
    matching_score: float | None = None,
) -> PotentialMatch:
    payload: dict[str, str | float] = {
        "adopter_id": adopter_id,
        "dog_id": dog_id,
        "match_status": match_status,
    }
    if matching_score is not None:
        payload["matching_score"] = matching_score
    response = (
        _get_client()
        .table("potential_matches")
        .upsert(payload, on_conflict="adopter_id,dog_id")
        .execute()
    )
    return response.data[0]
