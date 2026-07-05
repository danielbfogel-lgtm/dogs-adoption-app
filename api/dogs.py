"""GET /api/dogs — all dogs, with optional limit/offset pagination and name search.

Requires login (SPEC.md §4 "All Dogs Gallery"), not public — any authenticated
user (adopter or admin), not just adopters. This endpoint reads with the
service-role key (see `db_client.py`), which bypasses RLS entirely, so it must
verify the caller's session itself rather than relying on the `dogs` table's
RLS policy.
"""

import logging
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

import db_client
from auth import get_authenticated_user_id

logger = logging.getLogger(__name__)

router = APIRouter()


class Dog(BaseModel):
    id: str
    name: str | None
    birth_date: str | None
    age: int | None
    breed: str | None
    size: Literal["small", "medium", "large"] | None
    energy_level: int | None
    good_with_children: bool | None
    good_with_dogs: bool | None
    good_with_cats: bool | None
    sheds: bool | None
    free_description: str | None
    status: Literal["available", "pending", "adopted"]
    photo_url: str | None
    created_at: str


class DogsPageResponse(BaseModel):
    dogs: list[Dog]
    total: int
    limit: int
    offset: int
    search: str | None


@router.get("/api/dogs")
@router.get("/api/dogs/")
def list_dogs(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    search: str | None = Query(default=None, max_length=100),
    _user_id: str = Depends(get_authenticated_user_id),
) -> DogsPageResponse:
    try:
        dogs, total = db_client.fetch_dogs_page(limit, offset, search)
    except Exception:
        logger.exception("fetch_dogs_page failed")
        raise HTTPException(status_code=500, detail="failed to fetch dogs")
    return DogsPageResponse(
        dogs=dogs, total=total, limit=limit, offset=offset, search=search
    )
