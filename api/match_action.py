"""POST /api/match_action — adopter confirms or rejects a proposed match.

Upserts the `potential_matches` row (unique on `adopter_id, dog_id`) so this
works whether or not a `pending` row already exists for the pair.
"""

import logging
from typing import Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

import db_client
import matcher
from auth import get_authenticated_adopter_id

logger = logging.getLogger(__name__)

router = APIRouter()


class MatchActionRequest(BaseModel):
    adopter_id: UUID
    dog_id: UUID
    action: Literal["confirmed", "rejected"]


@router.post("/api/match_action")
@router.post("/api/match_action/")
def set_match_action(
    body: MatchActionRequest,
    authenticated_adopter_id: str = Depends(get_authenticated_adopter_id),
) -> dict[str, Any]:
    if body.adopter_id != UUID(authenticated_adopter_id):
        raise HTTPException(
            status_code=403, detail="cannot modify another adopter's matches"
        )

    try:
        adopter = db_client.fetch_adopter_by_id(str(body.adopter_id))
    except Exception:
        logger.exception("fetch_adopter_by_id failed")
        raise HTTPException(status_code=500, detail="failed to look up adopter")
    if adopter is None:
        raise HTTPException(status_code=404, detail="adopter not found")

    try:
        dog = db_client.fetch_dog_by_id(str(body.dog_id))
    except Exception:
        logger.exception("fetch_dog_by_id failed")
        raise HTTPException(status_code=500, detail="failed to look up dog")
    if dog is None:
        raise HTTPException(status_code=404, detail="dog not found")
    if body.action == "confirmed" and dog["status"] != "available":
        raise HTTPException(status_code=409, detail="dog is no longer available")

    score = matcher.calculate_match_score(dog, adopter)
    try:
        match = db_client.upsert_match_status(
            str(body.adopter_id), str(body.dog_id), body.action, matching_score=score
        )
    except Exception:
        logger.exception("upsert_match_status failed")
        raise HTTPException(status_code=500, detail="failed to update match status")

    return {"match": match}
