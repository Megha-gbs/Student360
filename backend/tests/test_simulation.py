"""
Tests for POST /simulate endpoint.
Verifies What-If analysis, strict 36 UCI features validation, and non-causal disclaimer.
"""

import sys
from pathlib import Path
from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.main import app
from backend.app.services.student_service import student_service

client = TestClient(app)


def test_simulate_valid_features():
    """Verify POST /simulate runs dynamic prediction on modified student features."""
    base_features = dict(student_service.get_student_features("S1001"))
    # Modify a curricular unit feature for simulation
    base_features["Curricular units 2nd sem (approved)"] = 5
    base_features["Curricular units 2nd sem (grade)"] = 14.0

    payload = {
        "student_id": "S1001_SIMULATED",
        "features": base_features,
    }

    response = client.post("/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["simulation"] is True
    assert data["student_id"] == "S1001_SIMULATED"
    assert "risk_score" in data
    assert "risk_level" in data
    assert "dropout_probability" in data
    assert data["model_version"] == "student360_xgb_v2_real_features"
    assert "Model-based simulation" in data["note"]
    assert "causal" in data["note"].lower()


def test_simulate_missing_feature_rejected():
    """Verify simulation rejects payload with missing required features."""
    base_features = dict(student_service.get_student_features("S1001"))
    del base_features["GDP"]

    payload = {
        "student_id": "S1001_INVALID",
        "features": base_features,
    }

    response = client.post("/simulate", json=payload)
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "Missing 1 required feature" in data["detail"]


def test_simulate_invented_feature_rejected():
    """Verify simulation strictly rejects invented features (e.g. attendance, study_time)."""
    base_features = dict(student_service.get_student_features("S1001"))
    base_features["attendance"] = 95.0

    payload = {
        "student_id": "S1001_INVENTED",
        "features": base_features,
    }

    response = client.post("/simulate", json=payload)
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "Unexpected feature(s) detected" in data["detail"]


def test_simulate_target_column_rejected():
    """Verify simulation strictly rejects Target column in inference input."""
    base_features = dict(student_service.get_student_features("S1001"))
    base_features["Target"] = 0

    payload = {
        "student_id": "S1001_LEAKAGE",
        "features": base_features,
    }

    response = client.post("/simulate", json=payload)
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "target column" in data["detail"].lower()
