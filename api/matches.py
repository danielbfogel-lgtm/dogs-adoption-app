"""GET /api/matches — an adopter's dashboard matches, best score first.

Includes fresh recommendations (score >= 70, not yet decided) plus dogs the
adopter has already confirmed or rejected, each tagged with `match_status`,
so the frontend's "All Recommendations" / "Confirmed" / "Rejected" tabs
(SPEC.md §4 "Match Results") can all be driven by this one response.
"""

import logging
from typing import Any
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException, Query

import matcher
from auth import get_authenticated_adopter_id

logger = logging.getLogger(__name__)

app = FastAPI()


@app.get("/api/matches")
@app.get("/api/matches/")
def list_matches(
    adopter_id: UUID = Query(...),
    authenticated_adopter_id: str = Depends(get_authenticated_adopter_id),
) -> dict[str, Any]:
    if adopter_id != UUID(authenticated_adopter_id):
        raise HTTPException(
            status_code=403, detail="cannot view another adopter's matches"
        )

    try:
        matches = matcher.get_dashboard_matches(str(adopter_id))
    except ValueError:
        raise HTTPException(status_code=404, detail="adopter not found")
    except Exception:
        logger.exception("get_dashboard_matches failed")
        raise HTTPException(status_code=500, detail="failed to compute matches")

    return {
        "matches": [
            {"dog": dog, "score": score, "match_status": match_status}
            for dog, score, match_status in matches
        ]
    }
