"""backend/tests/test_projection_recalculation_bug_c.py

Regression tests for Bug C: Recalculate Projection does not recalculate.
Verifies:
- POST /students/{id}/simulate-outcome performs real dynamic calculations
- Different intervention parameters result in different projected risk scores
- Retains mandatory "SIMULATED DEMONSTRATION OUTCOME" badge and causal disclaimer
- Handles repetitive calls with updated inputs
"""

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_simulate_outcome_dynamic_recalculation():
    """Verify that simulate-outcome recalculates from inputs and changes outputs."""
    student_id = "S1001"

    # Baseline call with high current risk and tutoring
    payload1 = {
        "current_risk": 80.0,
        "intervention_type": "Academic Tutoring",
    }
    res1 = client.post(f"/students/{student_id}/simulate-outcome", json=payload1)
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["badge"] == "SIMULATED DEMONSTRATION OUTCOME"
    assert "not real student improvement" in data1["note"]
    assert "simulated_risk_score" in data1
    assert data1["simulated_risk_score"] < 80

    # Recalculate with different current risk and custom units boost parameter
    payload2 = {
        "current_risk": 50.0,
        "intervention_type": "Financial Aid Counseling",
        "parameters": {"approved_units_boost": 4.0},
    }
    res2 = client.post(f"/students/{student_id}/simulate-outcome", json=payload2)
    assert res2.status_code == 200
    data2 = res2.json()

    # Verify that data2 recomputed with different risk score
    assert data2["simulated_risk_score"] < 50
    assert data2["simulated_risk_score"] != data1["simulated_risk_score"]
    assert data2["badge"] == "SIMULATED DEMONSTRATION OUTCOME"


def test_simulate_outcome_repeated_calls():
    """Verify endpoint can be called repeatedly without stale cache or errors."""
    student_id = "S1002"
    for risk_val in [90.0, 70.0, 40.0]:
        res = client.post(
            f"/students/{student_id}/simulate-outcome",
            json={"current_risk": risk_val, "intervention_type": "Academic Counseling"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["simulated_risk_score"] <= risk_val
