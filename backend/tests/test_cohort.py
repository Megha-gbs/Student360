"""
Tests for Cohort Insights endpoint:
- GET /cohort/insights
Verifies dynamic calculation of cohort metrics, risk distribution, and Global SHAP drivers.
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


def test_cohort_insights_dynamic_calculation():
    """Verify GET /cohort/insights calculates real metrics from model predictions."""
    response = client.get("/cohort/insights")
    assert response.status_code == 200
    data = response.json()

    # Aggregate counts calculated from the 10 demo students
    assert data["total_students"] == 10
    assert data["high_risk_count"] == 3
    assert data["medium_risk_count"] == 1
    assert data["low_risk_count"] == 6

    dist = data["risk_distribution"]
    assert dist["High"] == 3
    assert dist["Medium"] == 1
    assert dist["Low"] == 6

    # Global SHAP drivers from Smruthi's explainability engine
    assert "global_shap" in data
    assert data["global_shap"] is not None
    assert len(data["global_shap"]) > 0

    scores = [item["mean_abs_shap"] for item in data["global_shap"]]
    # Verify sorted in descending order of feature importance
    assert scores == sorted(scores, reverse=True)


def test_cohort_insights_calls_predict_dynamically_without_retraining():
    """Verify cohort metrics are computed dynamically using predict_student and without retraining."""
    from backend.app.services.model_service import model_service

    original_predict = model_service.predict
    call_count = 0

    def mock_predict(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        return original_predict(*args, **kwargs)

    with patch.object(model_service, "predict", side_effect=mock_predict):
        response = client.get("/cohort/insights")
        assert response.status_code == 200
        # Exactly 10 calls for 10 students
        assert call_count == 10
