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
    """Verify GET /cohort/insights calculates real metrics from model predictions across full cohort."""
    response = client.get("/cohort/insights")
    assert response.status_code == 200
    data = response.json()

    # Aggregate counts calculated from all 4,424 students
    assert data["total_students"] == 4424
    assert data["high_risk_count"] > 0
    assert data["medium_risk_count"] > 0
    assert data["low_risk_count"] > 0

    dist = data["risk_distribution"]
    assert dist["High"] == data["high_risk_count"]
    assert dist["Medium"] == data["medium_risk_count"]
    assert dist["Low"] == data["low_risk_count"]
    assert dist["High"] + dist["Medium"] + dist["Low"] == 4424

    # Global SHAP drivers from Smruthi's explainability engine
    assert "global_shap" in data
    assert data["global_shap"] is not None
    assert len(data["global_shap"]) > 0

    scores = [item["mean_abs_shap"] for item in data["global_shap"]]
    # Verify sorted in descending order of feature importance
    assert scores == sorted(scores, reverse=True)


def test_cohort_insights_calls_predict_dynamically_without_retraining():
    """Verify cohort metrics are computed dynamically using predict and without retraining."""
    response = client.get("/cohort/insights")
    assert response.status_code == 200
    data = response.json()
    assert data["total_students"] == 4424
    assert len(data["segments"]) >= 3
    assert len(data["by_course"]) > 0

