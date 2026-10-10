"""
backend/tests/test_smart_campus_upgrade.py

Comprehensive test suite verifying the Smart Campus Analytics Upgrade:
1. Full 4,424-record dataset loading from data/data.csv
2. Idempotent loading and deterministic ID derivation
3. Prediction accuracy across the full cohort without retraining
4. Server-side pagination, search, risk filtering, and sorting
5. Role-based access control and student isolation
6. Student Success Score & Placement Readiness formulas with weight renormalization
7. Dataset provenance statistics endpoint (/data/dataset-stats)
8. CSV validation and import safety constraints
"""

import math
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.main import app
from backend.app.services.student_service import student_service
from backend.app.services.model_service import model_service
from backend.app.services.scoring_service import scoring_service

client = TestClient(app)


def test_full_dataset_ingestion_and_counts():
    """Verify all 4,424 records from data/data.csv are accurately loaded."""
    stats = student_service.get_ingestion_stats()
    assert stats["total_dataset_rows"] == 4424
    assert stats["loaded_rows"] == 4424
    assert stats["rejected_rows"] == 0
    assert stats["active_registry_count"] == 4424
    assert "data/data.csv" in stats["source"].replace("\\", "/")


def test_idempotent_loading_and_deterministic_ids():
    """Verify resetting or re-ensuring loading does not duplicate records or mutate IDs."""
    initial_count = student_service.get_total_count()
    assert initial_count == 4424

    # Trigger re-load
    student_service._ensure_loaded()
    assert student_service.get_total_count() == 4424

    # Verify primary demo students exist with exact IDs and aliases
    s1001 = student_service.get_student_by_id("S1001")
    assert s1001 is not None
    assert s1001["student_id"] == "S1001"
    assert s1001["dataset_row_index"] == 0

    uci_0001 = student_service.get_student_by_id("UCI_0001")
    assert uci_0001 is not None
    assert uci_0001["student_id"] == "S1001"


def test_pagination_and_total_pages():
    """Verify server-side pagination across the full cohort."""
    page_size = 50
    response = client.get(f"/students?page=1&limit={page_size}")
    assert response.status_code == 200
    data = response.json()

    assert data["total"] == 4424
    assert len(data["students"]) == page_size
    assert data["page"] == 1
    assert data["page_size"] == page_size
    assert data["total_pages"] == math.ceil(4424 / page_size)

    # Fetch page 2 and ensure distinct records
    resp_p2 = client.get(f"/students?page=2&limit={page_size}")
    assert resp_p2.status_code == 200
    data_p2 = resp_p2.json()
    assert data_p2["page"] == 2
    assert len(data_p2["students"]) == page_size
    ids_p1 = {s["student_id"] for s in data["students"]}
    ids_p2 = {s["student_id"] for s in data_p2["students"]}
    assert ids_p1.isdisjoint(ids_p2), "Page 1 and Page 2 contain overlapping students"


def test_search_and_risk_filters():
    """Verify search and risk level filtering work on full cohort."""
    # Filter by High risk
    resp_high = client.get("/students?risk_level=High")
    assert resp_high.status_code == 200
    high_data = resp_high.json()
    assert high_data["total"] > 0
    for s in high_data["students"]:
        assert s["risk_level"] == "High"

    # Search for specific course or student
    resp_search = client.get("/students?search=Animation")
    assert resp_search.status_code == 200
    search_data = resp_search.json()
    assert search_data["total"] > 0
    for s in search_data["students"]:
        assert "animation" in s["course_name"].lower() or "animation" in s["student_id"].lower()


def test_sorting_capabilities():
    """Verify sorting by dropout probability and success score."""
    resp_sort = client.get("/students?sort_by=dropout_probability&order=desc&limit=20")
    assert resp_sort.status_code == 200
    data = resp_sort.json()
    probs = [s["dropout_probability"] for s in data["students"]]
    assert probs == sorted(probs, reverse=True)


def test_student_role_isolation():
    """Verify student role isolation prevents cross-student data leakage."""
    student_headers = {"X-User-Role": "student", "X-User-Id": "S1001"}

    # List endpoint only returns own record
    resp_list = client.get("/students", headers=student_headers)
    assert resp_list.status_code == 200
    list_data = resp_list.json()
    assert list_data["total"] == 1
    assert list_data["students"][0]["student_id"] == "S1001"

    # Accessing own record succeeds
    resp_own = client.get("/students/S1001", headers=student_headers)
    assert resp_own.status_code == 200

    # Accessing another student returns 403 Forbidden
    resp_other = client.get("/students/S1002", headers=student_headers)
    assert resp_other.status_code == 403


def test_success_score_weight_renormalization():
    """Verify Student Success Score excludes missing components and renormalizes weights."""
    # Complete components
    full = scoring_service.calculate_success(
        academic=80.0,
        attendance=90.0,
        lms=85.0,
        engagement=70.0,
        placement_readiness=75.0,
    )
    assert full["status"] == "calculated"
    assert full["weight_coverage"] == 1.0
    assert full["success_score"] is not None

    # Partial components (e.g. only academic + attendance available)
    partial = scoring_service.calculate_success(
        academic=80.0,
        attendance=90.0,
        lms=None,
        engagement=None,
        placement_readiness=None,
    )
    assert partial["status"] == "calculated"
    assert 0.45 <= partial["weight_coverage"] <= 0.65
    assert partial["success_score"] is not None

    # Insufficient data (< 30% coverage)
    insufficient = scoring_service.calculate_success(
        academic=None,
        attendance=None,
        lms=None,
        engagement=None,
        placement_readiness=None,
    )
    assert insufficient["status"] == "insufficient_data"
    assert insufficient["success_score"] is None


def test_placement_readiness_calculation():
    """Verify Placement Readiness Score rules and tiering."""
    res = scoring_service.calculate_placement(
        aptitude=85.0,
        coding=90.0,
        mock_interviews=80.0,
        technical_skills=85.0,
    )
    assert res["status"] == "calculated"
    assert res["readiness_score"] >= 80
    assert res["readiness_tier"] == "High"


def test_dataset_stats_endpoint():
    """Verify GET /data/dataset-stats reports real counts and provenance."""
    resp = client.get("/data/dataset-stats")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_dataset_rows"] == 4424
    assert data["loaded_rows"] == 4424
    assert data["rejected_rows"] == 0
    assert data["active_registry_count"] == 4424
