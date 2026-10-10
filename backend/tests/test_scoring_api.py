"""backend/tests/test_scoring_api.py

Unit and API contract tests for Student Success Score and Placement Readiness endpoints.
Validates:
- Full inputs, boundary inputs, missing values, and dynamic renormalization.
- Academic extraction from genuine 36 UCI features.
- 404 handling for nonexistent students.
"""

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_post_placement_readiness_full():
    """Verify POST /scoring/placement-readiness with all components."""
    payload = {
        "aptitude": 80.0,
        "coding": 90.0,
        "mock_interviews": 70.0,
        "technical_skills": 85.0,
    }
    response = client.post("/scoring/placement-readiness", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "calculated"
    assert data["readiness_score"] == 82
    assert data["readiness_tier"] == "High"
    assert data["weight_coverage"] == 1.0
    assert "aptitude" in data["components"]


def test_post_placement_readiness_partial_renormalization():
    """Verify POST /scoring/placement-readiness renormalizes when indicators are missing."""
    payload = {
        "aptitude": 75.0,
        "coding": 85.0,
        "mock_interviews": None,
        "technical_skills": None,
    }
    response = client.post("/scoring/placement-readiness", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "calculated"
    assert data["readiness_score"] == 80
    assert data["weight_coverage"] == 0.60
    assert data["components"]["aptitude"]["effective_weight"] == 0.50


def test_post_placement_readiness_empty():
    """Verify POST /scoring/placement-readiness returns insufficient_data when all missing."""
    payload = {}
    response = client.post("/scoring/placement-readiness", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "insufficient_data"
    assert data["readiness_score"] is None


def test_post_success_score_full():
    """Verify POST /scoring/success-score with complete 5-component inputs."""
    payload = {
        "academic": 85.0,
        "attendance": 90.0,
        "lms": 80.0,
        "engagement": 75.0,
        "placement_readiness": 70.0,
    }
    response = client.post("/scoring/success-score", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "calculated"
    assert isinstance(data["success_score"], int)
    assert data["standing_tier"] in ["Exemplary", "Good Standing", "Developing", "At Risk"]
    assert data["weight_coverage"] == 1.0


def test_post_success_score_insufficient_weight():
    """Verify POST /scoring/success-score enforces 30% minimum weight coverage."""
    payload = {
        "engagement": 80.0,  # Base weight 0.10, below MIN_WEIGHT_THRESHOLD of 0.30
    }
    response = client.post("/scoring/success-score", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "insufficient_data"
    assert data["success_score"] is None


def test_get_student_success_score_existing():
    """Verify GET /students/{id}/success-score auto-derives academic score from real UCI features."""
    response = client.get("/students/S1001/success-score")
    assert response.status_code == 200
    data = response.json()
    assert data["student_id"] == "S1001"
    assert data["status"] == "calculated"
    assert isinstance(data["success_score"], int)
    assert data["standing_tier"] in ["Exemplary", "Good Standing", "Developing", "At Risk"]
    assert "academic" in data["components"]


def test_get_student_placement_readiness_existing():
    """Verify GET /students/{id}/placement-readiness returns calculated readiness."""
    response = client.get("/students/S1001/placement-readiness")
    assert response.status_code == 200
    data = response.json()
    assert data["student_id"] == "S1001"
    assert data["status"] == "calculated"
    assert isinstance(data["readiness_score"], int)
    assert data["readiness_tier"] in ["High", "Moderate", "Needs Attention"]


def test_get_student_scoring_nonexistent():
    """Verify GET scoring for nonexistent student returns 404."""
    res_success = client.get("/students/S9999/success-score")
    assert res_success.status_code == 404

    res_placement = client.get("/students/S9999/placement-readiness")
    assert res_placement.status_code == 404
