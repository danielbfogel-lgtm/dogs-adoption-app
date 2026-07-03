"""Dog↔adopter compatibility scoring engine.

Pure, DB-free scoring functions for the matching algorithm (SPEC.md §3). Every
function takes plain values or the ``Dog`` / ``Adopter`` TypedDicts from
``db_client`` and returns a float, so the math is unit-testable without Supabase.

Weight system (72/24/4), total 100 pts:
  - High (24 each): Energy Level, Child Compatibility, Size.
  - Medium (8 each): Good with Dogs, Good with Cats, Dog Age.
  - Low (4): Shedding.

Scaled parameters (energy, size) use gradual penalties; dog age uses range
membership with a gradual penalty past the nearest edge. A dog is shown to an
adopter only when ``calculate_match_score`` is >= ``MATCH_THRESHOLD`` (70).

``get_valid_matches`` is the one function here that touches the database: it
fetches an adopter, all dogs, and that adopter's existing ``potential_matches``
via ``db_client``, then scores and filters using the pure functions above. It
imports ``db_client`` lazily (inside the function body) so importing this
module — and unit-testing every pure scorer — never requires ``supabase`` to
be installed or reachable.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    # Imported for type checking only; at runtime the scorers operate on plain
    # dicts, so the engine never needs supabase / a DB connection.
    from db_client import Adopter, Dog

# --- Weights (sum must equal 100) ---------------------------------------------
W_ENERGY = 24.0
W_CHILD = 24.0
W_SIZE = 24.0
W_GOOD_DOGS = 8.0
W_GOOD_CATS = 8.0
W_DOG_AGE = 8.0
W_SHEDDING = 4.0

assert (
    W_ENERGY + W_CHILD + W_SIZE + W_GOOD_DOGS + W_GOOD_CATS + W_DOG_AGE + W_SHEDDING
    == 100.0
), "matching weights must sum to 100"

# --- Tunable scoring constants ------------------------------------------------
ENERGY_DELTA_MAX = 4  # 1–5 energy scale
SIZE_DELTA_MAX = 2  # 3 size tiers (small/medium/large)
AGE_DELTA_MAX = 5  # years beyond the chosen range edge that drives score to 0
CHILD_SAFE_AGE = 12  # youngest-child age at/above which a not-good dog scores full

MATCH_THRESHOLD = 70.0

SIZE_RANK = {"small": 1, "medium": 2, "large": 3}
# Adopter age-range -> [low, high]; high is None for the open-ended "10+" range.
AGE_RANGES: dict[str, tuple[int, int | None]] = {
    "0-1": (0, 1),
    "1-3": (1, 3),
    "3-7": (3, 7),
    "7-10": (7, 10),
    "10+": (10, None),
}


def _clamp(value: float, low: float, high: float) -> float:
    """Constrain ``value`` to the inclusive ``[low, high]`` range."""
    return max(low, min(high, value))


# --- Per-parameter scorers (primitives in, float out) -------------------------
def score_energy(dog_energy: int | None, adopter_energy: int | None) -> float:
    """Energy level (24 pts), gradual penalty over the 1–5 scale (delta_max=4).

    Comfort parameter: a missing value on either side scores full points.
    """
    if dog_energy is None or adopter_energy is None:
        return W_ENERGY
    penalty = abs(dog_energy - adopter_energy) / ENERGY_DELTA_MAX
    return _clamp(W_ENERGY * (1 - penalty), 0.0, W_ENERGY)


def score_child_compatibility(
    good_with_children: bool | None,
    number_of_children: int | None,
    youngest_child_age: int | None,
) -> float:
    """Child compatibility (24 pts).

    Families without children always score full points. With children, a dog that
    is good with children scores full; otherwise the penalty grows the younger the
    youngest child is (linear ramp to ``CHILD_SAFE_AGE``). Safety-first: an unknown
    (None) ``good_with_children`` is treated as not-good, and an unknown youngest
    age as 0 (worst case).
    """
    if not number_of_children:  # None or 0 -> no children
        return W_CHILD
    if good_with_children is True:
        return W_CHILD
    age = youngest_child_age if youngest_child_age is not None else 0
    return _clamp(W_CHILD * min(1.0, age / CHILD_SAFE_AGE), 0.0, W_CHILD)


def score_size(dog_size: str | None, adopter_size: str | None) -> float:
    """Size (24 pts), gradual penalty over 3 tiers (delta_max=2).

    Adopter preference of ``doesnt_matter`` (or no preference) scores full points;
    a missing dog size (comfort parameter) also scores full.
    """
    if adopter_size is None or adopter_size == "doesnt_matter":
        return W_SIZE
    if dog_size is None:
        return W_SIZE
    dog_rank = SIZE_RANK.get(dog_size)
    adopter_rank = SIZE_RANK.get(adopter_size)
    if dog_rank is None or adopter_rank is None:
        return W_SIZE
    penalty = abs(dog_rank - adopter_rank) / SIZE_DELTA_MAX
    return _clamp(W_SIZE * (1 - penalty), 0.0, W_SIZE)


def score_good_with_dogs(
    good_with_dogs: bool | None, number_of_dogs: int | None
) -> float:
    """Good with dogs (8 pts). Only relevant when the adopter currently has dogs.

    No dogs -> full points. With dogs: compatible -> full; not compatible or
    unknown (None) -> 0 (safety-first).
    """
    if not number_of_dogs:  # None or 0 -> not relevant
        return W_GOOD_DOGS
    return W_GOOD_DOGS if good_with_dogs is True else 0.0


def score_good_with_cats(
    good_with_cats: bool | None, number_of_cats: int | None
) -> float:
    """Good with cats (8 pts). Only relevant when the adopter currently has cats.

    No cats -> full points. With cats: compatible -> full; not compatible or
    unknown (None) -> 0 (safety-first).
    """
    if not number_of_cats:  # None or 0 -> not relevant
        return W_GOOD_CATS
    return W_GOOD_CATS if good_with_cats is True else 0.0


def score_dog_age(dog_age: int | None, adopter_range: str | None) -> float:
    """Dog age (8 pts), range membership with a gradual penalty past the edge.

    Full points when the dog's integer age is inside the adopter's chosen range;
    outside, the score decays linearly with years beyond the nearest edge, hitting
    0 at ``AGE_DELTA_MAX`` years out. No preference or a missing dog age (comfort
    parameter) scores full points.
    """
    if adopter_range is None:
        return W_DOG_AGE
    bounds = AGE_RANGES.get(adopter_range)
    if bounds is None:
        return W_DOG_AGE
    if dog_age is None:
        return W_DOG_AGE
    low, high = bounds
    years_outside = max(
        0,
        low - dog_age,
        (dog_age - high) if high is not None else 0,
    )
    return _clamp(W_DOG_AGE * (1 - years_outside / AGE_DELTA_MAX), 0.0, W_DOG_AGE)


def score_shedding(dog_sheds: bool | None, adopter_pref: str | None) -> float:
    """Shedding (4 pts).

    Only an adopter who prefers ``no`` shedding paired with a dog that sheds scores
    0. Any other case — ``doesnt_matter`` / no preference, or a dog that does not
    shed (or unknown, a comfort parameter) — scores full points.
    """
    if adopter_pref == "no" and dog_sheds is True:
        return 0.0
    return W_SHEDDING


# --- Public entry points (dicts in) -------------------------------------------
def score_breakdown(dog: Dog, adopter: Adopter) -> dict[str, float]:
    """Return each parameter's score plus the clamped, rounded ``total``.

    Useful for unit tests, debugging, and surfacing a per-parameter explanation in
    the UI.
    """
    components = {
        "energy": score_energy(dog["energy_level"], adopter["energy_level"]),
        "child": score_child_compatibility(
            dog["good_with_children"],
            adopter["number_of_children"],
            adopter["youngest_child_age"],
        ),
        "size": score_size(dog["size"], adopter["size"]),
        "good_with_dogs": score_good_with_dogs(
            dog["good_with_dogs"], adopter["number_of_dogs"]
        ),
        "good_with_cats": score_good_with_cats(
            dog["good_with_cats"], adopter["number_of_cats"]
        ),
        "dog_age": score_dog_age(dog["age"], adopter["dog_age"]),
        "shedding": score_shedding(dog["sheds"], adopter["sheds"]),
    }
    components["total"] = round(_clamp(sum(components.values()), 0.0, 100.0), 2)
    return components


def calculate_match_score(dog: Dog, adopter: Adopter) -> float:
    """Total compatibility score in ``[0, 100]``, rounded to 2 decimal places."""
    return score_breakdown(dog, adopter)["total"]


def is_match(score: float) -> bool:
    """Whether a score qualifies to be shown to the adopter (>= 70)."""
    return score >= MATCH_THRESHOLD


def rank_matches(dogs: list[Dog], adopter: Adopter) -> list[tuple[Dog, float]]:
    """Score every dog for ``adopter``, keep matches (>= 70), best score first."""
    scored = [(dog, calculate_match_score(dog, adopter)) for dog in dogs]
    matches = [pair for pair in scored if is_match(pair[1])]
    matches.sort(key=lambda pair: pair[1], reverse=True)
    return matches


# --- DB-backed entry point (the only function here that touches Supabase) -----
def get_valid_matches(adopter_id: str) -> list[tuple[Dog, float]]:
    """Fetch, score, and filter matches for one adopter.

    Fetches the adopter, every available dog, and the adopter's existing
    ``potential_matches`` via ``db_client``; excludes dogs that are not
    ``available`` (already adopted or pending elsewhere) and dogs the adopter
    has already ``confirmed`` or ``rejected``; scores the rest with
    ``calculate_match_score``; and returns only matches (>= ``MATCH_THRESHOLD``),
    best score first.

    Raises ``ValueError`` if no adopter exists for ``adopter_id`` — callers at
    the API layer should translate that into a 404.

    Callers: ``adopter_id`` is trusted as-is (no UUID/shape validation, no
    ownership check against the caller's session) — the future API endpoint
    that wires this up must validate it and derive it from the authenticated
    adopter (or an admin role), not accept it as a raw client-supplied value.
    """
    from db_client import fetch_adopter_by_id, fetch_all_dogs, fetch_existing_matches

    adopter = fetch_adopter_by_id(adopter_id)
    if adopter is None:
        raise ValueError(f"adopter {adopter_id!r} not found")

    decided_dog_ids = {
        match["dog_id"]
        for match in fetch_existing_matches(adopter_id)
        if match["match_status"] in ("confirmed", "rejected")
    }
    candidate_dogs = [
        dog
        for dog in fetch_all_dogs()
        if dog["status"] == "available" and dog["id"] not in decided_dog_ids
    ]
    return rank_matches(candidate_dogs, adopter)


def get_dashboard_matches(adopter_id: str) -> list[tuple[Dog, float, str]]:
    """Every dog for the adopter's Match Results dashboard (SPEC.md §4), tagged
    with its `match_status` ('pending' | 'confirmed' | 'rejected').

    Unlike `get_valid_matches` (new, undecided recommendations only — used to
    compute *whether* a dog currently qualifies as a fresh recommendation),
    this also includes dogs the adopter has already confirmed or rejected, so
    one call can power the "All Recommendations" / "Confirmed" / "Rejected"
    dashboard tabs. A decided dog is included even if it's no longer
    `available` (already decided, so not subject to the live-availability
    filter that new recommendations get) and uses the `matching_score`
    snapshotted in `potential_matches` at decision time (falling back to a
    live recalculation only if that's missing), so a later profile/dog edit
    doesn't retroactively change a decision the adopter already made.

    Raises `ValueError` if no adopter exists for `adopter_id` (see
    `get_valid_matches`).
    """
    from db_client import fetch_adopter_by_id, fetch_all_dogs, fetch_existing_matches

    adopter = fetch_adopter_by_id(adopter_id)
    if adopter is None:
        raise ValueError(f"adopter {adopter_id!r} not found")

    decided_by_dog_id = {
        match["dog_id"]: match
        for match in fetch_existing_matches(adopter_id)
        if match["match_status"] in ("confirmed", "rejected")
    }

    results: list[tuple[Dog, float, str]] = []
    for dog in fetch_all_dogs():
        decided = decided_by_dog_id.get(dog["id"])
        if decided is not None:
            score = decided["matching_score"]
            if score is None:
                score = calculate_match_score(dog, adopter)
            results.append((dog, score, decided["match_status"]))
        elif dog["status"] == "available":
            score = calculate_match_score(dog, adopter)
            if is_match(score):
                results.append((dog, score, "pending"))

    results.sort(key=lambda item: item[1], reverse=True)
    return results
