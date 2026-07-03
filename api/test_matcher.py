"""Unit tests for the matching engine (api/matcher.py).

Pure math, no DB. Run with:  python -m pytest api/test_matcher.py
"""

from typing import Any

import pytest

import matcher


# --- dict factories -----------------------------------------------------------
def make_dog(**overrides: Any) -> dict[str, Any]:
    """A neutral dog; override individual fields per test."""
    dog: dict[str, Any] = {
        "energy_level": 3,
        "good_with_children": True,
        "good_with_dogs": True,
        "good_with_cats": True,
        "size": "medium",
        "age": 5,
        "sheds": False,
        "status": "available",
    }
    dog.update(overrides)
    return dog


def make_adopter(**overrides: Any) -> dict[str, Any]:
    """An adopter with no constraints (everything scores full); override per test."""
    adopter: dict[str, Any] = {
        "energy_level": 3,
        "number_of_children": 0,
        "youngest_child_age": None,
        "number_of_dogs": 0,
        "number_of_cats": 0,
        "size": "doesnt_matter",
        "dog_age": None,
        "sheds": "doesnt_matter",
    }
    adopter.update(overrides)
    return adopter


# --- weights ------------------------------------------------------------------
def test_weights_sum_to_100() -> None:
    total = (
        matcher.W_ENERGY
        + matcher.W_CHILD
        + matcher.W_SIZE
        + matcher.W_GOOD_DOGS
        + matcher.W_GOOD_CATS
        + matcher.W_DOG_AGE
        + matcher.W_SHEDDING
    )
    assert total == 100.0


# --- energy (24, delta_max 4) -------------------------------------------------
def test_energy_exact_match() -> None:
    assert matcher.score_energy(3, 3) == 24.0


def test_energy_max_gap() -> None:
    assert matcher.score_energy(1, 5) == 0.0


def test_energy_one_step_gap() -> None:
    assert matcher.score_energy(2, 3) == 18.0  # 24 * (1 - 1/4)


def test_energy_missing_is_full() -> None:
    assert matcher.score_energy(None, 3) == 24.0
    assert matcher.score_energy(3, None) == 24.0


# --- child compatibility (24) -------------------------------------------------
def test_child_no_children_is_full() -> None:
    assert matcher.score_child_compatibility(False, 0, None) == 24.0
    assert matcher.score_child_compatibility(False, None, None) == 24.0


def test_child_good_with_children_is_full() -> None:
    assert matcher.score_child_compatibility(True, 2, 1) == 24.0


def test_child_not_good_scales_with_youngest_age() -> None:
    assert matcher.score_child_compatibility(False, 2, 0) == 0.0
    assert matcher.score_child_compatibility(False, 2, 6) == 12.0
    assert matcher.score_child_compatibility(False, 2, 12) == 24.0
    assert matcher.score_child_compatibility(False, 2, 15) == 24.0  # clamped


def test_child_unknown_is_safety_first() -> None:
    # Unknown compatibility + unknown youngest age -> worst case 0.
    assert matcher.score_child_compatibility(None, 2, None) == 0.0
    assert matcher.score_child_compatibility(None, 2, 6) == 12.0


# --- size (24, delta_max 2) ---------------------------------------------------
def test_size_exact_match() -> None:
    assert matcher.score_size("medium", "medium") == 24.0


def test_size_one_tier_gap() -> None:
    assert matcher.score_size("small", "medium") == 12.0


def test_size_two_tier_gap() -> None:
    assert matcher.score_size("small", "large") == 0.0


def test_size_doesnt_matter_is_full() -> None:
    assert matcher.score_size("large", "doesnt_matter") == 24.0
    assert matcher.score_size("large", None) == 24.0


def test_size_missing_dog_size_is_full() -> None:
    assert matcher.score_size(None, "small") == 24.0


# --- good with dogs / cats (8 each) -------------------------------------------
def test_good_with_dogs_not_relevant_when_no_dogs() -> None:
    assert matcher.score_good_with_dogs(False, 0) == 8.0
    assert matcher.score_good_with_dogs(None, None) == 8.0


def test_good_with_dogs_relevant() -> None:
    assert matcher.score_good_with_dogs(True, 1) == 8.0
    assert matcher.score_good_with_dogs(False, 1) == 0.0
    assert matcher.score_good_with_dogs(None, 1) == 0.0  # unknown -> safety-first


def test_good_with_cats_relevant() -> None:
    assert matcher.score_good_with_cats(True, 2) == 8.0
    assert matcher.score_good_with_cats(False, 2) == 0.0
    assert matcher.score_good_with_cats(None, 2) == 0.0


# --- dog age (8, AGE_DELTA_MAX 5) ---------------------------------------------
def test_dog_age_inside_range_is_full() -> None:
    assert matcher.score_dog_age(5, "3-7") == 8.0
    assert matcher.score_dog_age(3, "3-7") == 8.0  # inclusive low edge
    assert matcher.score_dog_age(7, "3-7") == 8.0  # inclusive high edge


def test_dog_age_outside_decays() -> None:
    assert matcher.score_dog_age(9, "3-7") == pytest.approx(4.8)  # 2 yrs out
    assert matcher.score_dog_age(12, "3-7") == 0.0  # 5 yrs out -> 0
    assert matcher.score_dog_age(20, "3-7") == 0.0  # well past, clamped


def test_dog_age_open_ended_10_plus() -> None:
    assert matcher.score_dog_age(20, "10+") == 8.0  # no upper bound
    assert matcher.score_dog_age(7, "10+") == pytest.approx(3.2)  # 3 yrs below


def test_dog_age_no_preference_is_full() -> None:
    assert matcher.score_dog_age(5, None) == 8.0
    assert matcher.score_dog_age(None, "3-7") == 8.0  # missing dog age -> full


# --- shedding (4) -------------------------------------------------------------
def test_shedding_conflict_is_zero() -> None:
    assert matcher.score_shedding(True, "no") == 0.0


def test_shedding_otherwise_full() -> None:
    assert matcher.score_shedding(False, "no") == 4.0
    assert matcher.score_shedding(True, "doesnt_matter") == 4.0
    assert matcher.score_shedding(True, None) == 4.0
    assert matcher.score_shedding(None, "no") == 4.0  # unknown shedding -> full


# --- aggregate ----------------------------------------------------------------
def test_calculate_match_score_perfect_match_scores_100() -> None:
    dog = make_dog(energy_level=3, size="medium", age=5, sheds=False)
    adopter = make_adopter(energy_level=3, size="medium", dog_age="3-7", sheds="no")
    assert matcher.calculate_match_score(dog, adopter) == 100.0


def test_calculate_match_score_total_mismatch_scores_0() -> None:
    dog = make_dog(
        energy_level=1,
        good_with_children=False,
        good_with_dogs=False,
        good_with_cats=False,
        size="small",
        age=10,
        sheds=True,
    )
    adopter = make_adopter(
        energy_level=5,
        number_of_children=2,
        youngest_child_age=0,
        number_of_dogs=1,
        number_of_cats=1,
        size="large",
        dog_age="0-1",
        sheds="no",
    )
    assert matcher.calculate_match_score(dog, adopter) == 0.0


def test_calculate_match_score_high_weight_mismatch() -> None:
    """High-weight params (energy/child/size, 72 pts) all miss completely while
    every medium/low param (28 pts) is a perfect match — the 72% weighting
    still drags the total well under the 70 threshold."""
    dog = make_dog(
        energy_level=1,
        good_with_children=False,
        size="small",
        good_with_dogs=True,
        good_with_cats=True,
        age=5,
        sheds=False,
    )
    adopter = make_adopter(
        energy_level=5,  # energy gap 4 -> 0 pts
        number_of_children=2,
        youngest_child_age=0,  # child not-good, youngest 0 -> 0 pts
        size="large",  # size gap 2 tiers -> 0 pts
        number_of_dogs=1,
        number_of_cats=1,
        dog_age="3-7",  # dog age 5 is inside range -> full 8 pts
        sheds="no",  # dog doesn't shed -> full 4 pts
    )
    score = matcher.calculate_match_score(dog, adopter)
    assert score == 28.0  # 0 + 0 + 0 + 8 + 8 + 8 + 4
    assert matcher.is_match(score) is False


def test_calculate_match_score_family_with_young_children() -> None:
    """A family with a young child and a dog that isn't good with children:
    the child-compatibility penalty scales down with the youngest child's age,
    dragging an otherwise-perfect match below the threshold."""
    dog = make_dog(
        good_with_children=False, energy_level=3, size="medium", age=5, sheds=False
    )
    adopter = make_adopter(
        energy_level=3,
        size="medium",
        dog_age="3-7",
        sheds="no",
        number_of_children=1,
        youngest_child_age=3,  # 24 * 3/12 = 6 pts for child compatibility
    )
    score = matcher.calculate_match_score(dog, adopter)
    assert score == 82.0  # 100 - 24 (full child) + 6 (scaled child)
    assert matcher.is_match(score) is True


def test_calculate_match_score_no_pets_adopter() -> None:
    """An adopter with no current dogs/cats gets full good-with-dogs/cats
    points automatically, even for a dog that isn't compatible with either."""
    dog = make_dog(
        good_with_dogs=False,
        good_with_cats=False,
        energy_level=3,
        size="medium",
        age=5,
        sheds=False,
    )
    adopter = make_adopter(
        energy_level=3,
        size="medium",
        dog_age="3-7",
        sheds="no",
        number_of_dogs=0,
        number_of_cats=0,
    )
    assert matcher.calculate_match_score(dog, adopter) == 100.0


def test_breakdown_keys_and_total() -> None:
    breakdown = matcher.score_breakdown(make_dog(), make_adopter())
    assert set(breakdown) == {
        "energy",
        "child",
        "size",
        "good_with_dogs",
        "good_with_cats",
        "dog_age",
        "shedding",
        "total",
    }
    assert breakdown["total"] == round(
        sum(v for k, v in breakdown.items() if k != "total"), 2
    )


def test_is_match_threshold() -> None:
    assert matcher.is_match(70.0) is True
    assert matcher.is_match(69.99) is False
    assert matcher.is_match(100.0) is True


def test_rank_matches_filters_and_sorts() -> None:
    adopter = make_adopter(
        energy_level=5,
        size="small",
        dog_age="3-7",
        sheds="no",
        number_of_children=2,
        youngest_child_age=2,
        number_of_dogs=1,
        number_of_cats=1,
    )
    perfect = make_dog(id="perfect", energy_level=5, size="small", age=5)
    # energy 0 (gap 4) + size 0 (two tiers) + child 4 + dogs/cats 0 + age 8
    # + shedding 0 => 12, below the 70 threshold, so it is filtered out.
    weak = make_dog(
        id="weak",
        energy_level=1,
        size="large",
        age=5,
        good_with_children=False,
        good_with_dogs=False,
        good_with_cats=False,
        sheds=True,
    )
    matches = matcher.rank_matches([weak, perfect], adopter)
    assert [dog["id"] for dog, _ in matches] == ["perfect"]
    assert matches[0][1] == 100.0


# --- get_valid_matches (DB-backed; db_client fetch_* are monkeypatched) -------
# db_client is imported locally in each test (not at module level) so the pure
# scorer tests above never require `supabase` to be importable to collect.
def test_get_valid_matches_excludes_confirmed_and_rejected(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    import db_client

    adopter = make_adopter()
    dogs = [
        make_dog(id="confirmed-dog"),
        make_dog(id="rejected-dog"),
        make_dog(id="new-dog"),
    ]
    existing_matches = [
        {"dog_id": "confirmed-dog", "match_status": "confirmed"},
        {"dog_id": "rejected-dog", "match_status": "rejected"},
    ]
    monkeypatch.setattr(db_client, "fetch_adopter_by_id", lambda adopter_id: adopter)
    monkeypatch.setattr(db_client, "fetch_all_dogs", lambda: dogs)
    monkeypatch.setattr(
        db_client, "fetch_existing_matches", lambda adopter_id: existing_matches
    )

    matches = matcher.get_valid_matches("adopter-1")

    assert [dog["id"] for dog, _ in matches] == ["new-dog"]


def test_get_valid_matches_excludes_unavailable_dogs(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    import db_client

    adopter = make_adopter()
    dogs = [
        make_dog(id="adopted-dog", status="adopted"),
        make_dog(id="pending-dog", status="pending"),
        make_dog(id="available-dog", status="available"),
    ]
    monkeypatch.setattr(db_client, "fetch_adopter_by_id", lambda adopter_id: adopter)
    monkeypatch.setattr(db_client, "fetch_all_dogs", lambda: dogs)
    monkeypatch.setattr(db_client, "fetch_existing_matches", lambda adopter_id: [])

    matches = matcher.get_valid_matches("adopter-1")

    assert [dog["id"] for dog, _ in matches] == ["available-dog"]


def test_get_valid_matches_filters_below_threshold_and_sorts(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    import db_client

    adopter = make_adopter(energy_level=3, size="medium", dog_age="3-7", sheds="no")
    perfect = make_dog(id="perfect", energy_level=3, size="medium", age=5, sheds=False)
    close = make_dog(id="close", energy_level=2, size="medium", age=5, sheds=False)
    weak = make_dog(id="weak", energy_level=1, size="large", age=20, sheds=True)
    monkeypatch.setattr(db_client, "fetch_adopter_by_id", lambda adopter_id: adopter)
    monkeypatch.setattr(db_client, "fetch_all_dogs", lambda: [weak, perfect, close])
    monkeypatch.setattr(db_client, "fetch_existing_matches", lambda adopter_id: [])

    matches = matcher.get_valid_matches("adopter-1")

    assert [dog["id"] for dog, _ in matches] == ["perfect", "close"]
    assert all(score >= matcher.MATCH_THRESHOLD for _, score in matches)


def test_get_valid_matches_raises_for_unknown_adopter(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    import db_client

    monkeypatch.setattr(db_client, "fetch_adopter_by_id", lambda adopter_id: None)

    with pytest.raises(ValueError):
        matcher.get_valid_matches("missing-adopter")


# --- get_dashboard_matches (DB-backed; db_client fetch_* are monkeypatched) ---
def test_dashboard_matches_includes_decided_dogs_with_their_status(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    import db_client

    adopter = make_adopter()
    dogs = [
        make_dog(id="confirmed-dog"),
        make_dog(id="rejected-dog"),
        make_dog(id="new-dog"),
    ]
    existing_matches = [
        {
            "dog_id": "confirmed-dog",
            "match_status": "confirmed",
            "matching_score": 91.5,
        },
        {"dog_id": "rejected-dog", "match_status": "rejected", "matching_score": 88.0},
    ]
    monkeypatch.setattr(db_client, "fetch_adopter_by_id", lambda adopter_id: adopter)
    monkeypatch.setattr(db_client, "fetch_all_dogs", lambda: dogs)
    monkeypatch.setattr(
        db_client, "fetch_existing_matches", lambda adopter_id: existing_matches
    )

    matches = matcher.get_dashboard_matches("adopter-1")

    by_id = {dog["id"]: (score, status) for dog, score, status in matches}
    assert by_id["confirmed-dog"] == (91.5, "confirmed")
    assert by_id["rejected-dog"] == (88.0, "rejected")
    assert by_id["new-dog"] == (100.0, "pending")


def test_dashboard_matches_includes_decided_dog_even_if_no_longer_available(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    import db_client

    adopter = make_adopter()
    dogs = [make_dog(id="adopted-elsewhere", status="adopted")]
    existing_matches = [
        {
            "dog_id": "adopted-elsewhere",
            "match_status": "confirmed",
            "matching_score": 95.0,
        },
    ]
    monkeypatch.setattr(db_client, "fetch_adopter_by_id", lambda adopter_id: adopter)
    monkeypatch.setattr(db_client, "fetch_all_dogs", lambda: dogs)
    monkeypatch.setattr(
        db_client, "fetch_existing_matches", lambda adopter_id: existing_matches
    )

    matches = matcher.get_dashboard_matches("adopter-1")

    assert [(dog["id"], score, status) for dog, score, status in matches] == [
        ("adopted-elsewhere", 95.0, "confirmed")
    ]


def test_dashboard_matches_falls_back_to_recompute_when_score_missing(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    import db_client

    adopter = make_adopter()
    dogs = [make_dog(id="confirmed-dog")]
    existing_matches = [
        {
            "dog_id": "confirmed-dog",
            "match_status": "confirmed",
            "matching_score": None,
        },
    ]
    monkeypatch.setattr(db_client, "fetch_adopter_by_id", lambda adopter_id: adopter)
    monkeypatch.setattr(db_client, "fetch_all_dogs", lambda: dogs)
    monkeypatch.setattr(
        db_client, "fetch_existing_matches", lambda adopter_id: existing_matches
    )

    matches = matcher.get_dashboard_matches("adopter-1")

    assert matches == [(dogs[0], 100.0, "confirmed")]


def test_dashboard_matches_excludes_undecided_dog_below_threshold_or_unavailable(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    import db_client

    adopter = make_adopter(
        energy_level=5,
        size="small",
        number_of_children=2,
        youngest_child_age=2,
        number_of_dogs=1,
        number_of_cats=1,
        sheds="no",
    )
    # Same shape as test_rank_matches_filters_and_sorts's "weak" dog: scores 12
    # total, well below the 70 threshold.
    weak = make_dog(
        id="weak",
        energy_level=1,
        size="large",
        good_with_children=False,
        good_with_dogs=False,
        good_with_cats=False,
        sheds=True,
    )
    unavailable = make_dog(id="unavailable", status="pending")
    monkeypatch.setattr(db_client, "fetch_adopter_by_id", lambda adopter_id: adopter)
    monkeypatch.setattr(db_client, "fetch_all_dogs", lambda: [weak, unavailable])
    monkeypatch.setattr(db_client, "fetch_existing_matches", lambda adopter_id: [])

    matches = matcher.get_dashboard_matches("adopter-1")

    assert matches == []


def test_dashboard_matches_sorted_best_score_first(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    import db_client

    adopter = make_adopter()
    dogs = [make_dog(id="perfect"), make_dog(id="confirmed-lower")]
    existing_matches = [
        {
            "dog_id": "confirmed-lower",
            "match_status": "confirmed",
            "matching_score": 70.0,
        },
    ]
    monkeypatch.setattr(db_client, "fetch_adopter_by_id", lambda adopter_id: adopter)
    monkeypatch.setattr(db_client, "fetch_all_dogs", lambda: dogs)
    monkeypatch.setattr(
        db_client, "fetch_existing_matches", lambda adopter_id: existing_matches
    )

    matches = matcher.get_dashboard_matches("adopter-1")

    assert [dog["id"] for dog, _, _ in matches] == ["perfect", "confirmed-lower"]


def test_dashboard_matches_raises_for_unknown_adopter(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    import db_client

    monkeypatch.setattr(db_client, "fetch_adopter_by_id", lambda adopter_id: None)

    with pytest.raises(ValueError):
        matcher.get_dashboard_matches("missing-adopter")
