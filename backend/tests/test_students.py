"""
Tests for /students and /students/{student_id} endpoints.
Verifies real dynamic predictions, 404 for unknown students, SHAP reasons, and trajectories.
"""

import sys
from pathlib import Path
from unittest.mock import patch
from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.main import app
import ml.prediction.predict as predict_module

client = TestClient(app)


def test_list_students_success():
    """Verify GET /students returns all cohort students with live predictions."""
    response = client.get("/students")
    assert response.status_code == 200
    data = response.json()

    assert "total" in data
    assert "students" in data
    assert data["total"] == 4424
    assert len(data["students"]) == 4424

    # Verify student structure
    first = data["students"][0]
    assert "student_id" in first
    assert "risk_score" in first
    assert "risk_level" in first
    assert "dropout_probability" in first
    assert "model_version" in first
    assert first["risk_level"] in ["Low", "Medium", "High"]
    assert 0 <= first["risk_score"] <= 100


def test_list_students_pagination_and_search():
    """Verify pagination and search filtering work correctly."""
    # Pagination
    resp_paged = client.get("/students?page=1&limit=25")
    assert resp_paged.status_code == 200
    paged_data = resp_paged.json()
    assert paged_data["total"] == 4424
    assert len(paged_data["students"]) == 25
    assert paged_data["page"] == 1
    assert paged_data["page_size"] == 25
    assert paged_data["total_pages"] == 177

    # Search by ID
    resp_search = client.get("/students?search=S1001")
    assert resp_search.status_code == 200
    search_data = resp_search.json()
    assert any(s["student_id"] == "S1001" for s in search_data["students"])


def test_get_individual_student_s1001():
    """Verify GET /students/S1001 retrieves verified high-risk student profile."""
    response = client.get("/students/S1001")
    assert response.status_code == 200
    data = response.json()

    assert data["student_id"] == "S1001"
    assert "features" in data
    assert len(data["features"]) == 36
    assert "prediction" in data

    pred = data["prediction"]
    assert pred["student_id"] == "S1001"
    assert pred["risk_score"] == 74
    assert pred["risk_level"] == "High"
    assert pred["dropout_probability"] == 0.7449
    assert pred["model_version"] == "student360_xgb_v2_real_features"

    # Verify SHAP explanations
    assert "top_reasons" in data
    assert data["top_reasons"] is not None
    assert len(data["top_reasons"]) >= 3
    for reason in data["top_reasons"]:
        assert "feature" in reason
        assert "value" in reason
        assert reason["impact"] in ["high", "medium", "low"]
        assert reason["direction"] in ["increases_risk", "decreases_risk"]

    # Verify Trajectory
    assert "trajectory_data" in data
    assert data["trajectory_data"] is not None
    traj = data["trajectory_data"]
    assert traj["trajectory_type"] == "real_sem1_to_sem2"
    assert len(traj["points"]) == 2
    assert traj["points"][0]["semester"] == "Sem 1"
    assert traj["points"][1]["semester"] == "Sem 2"
    assert "note" in traj


def test_get_nonexistent_student_returns_404():
    """Verify GET /students/S9999 returns HTTP 404."""
    response = client.get("/students/S9999")
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert "S9999 not found" in data["detail"]


def test_model_predict_is_actually_called_dynamically():
    """Verify the backend actually calls the prediction pipeline and does not hardcode results."""
    from backend.app.services.model_service import model_service

    original_predict = model_service.predict
    call_count = 0

    def mock_predict(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        return original_predict(*args, **kwargs)

    with patch.object(model_service, "predict", side_effect=mock_predict):
        response = client.get("/students/S1002")
        assert response.status_code == 200
        assert call_count >= 1

        data = response.json()
        assert data["student_id"] == "S1002"
        assert data["prediction"]["risk_score"] == 10
        assert data["prediction"]["risk_level"] == "Low"
