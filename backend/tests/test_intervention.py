"""
Tests for Intervention endpoints:
- POST /intervene
- POST /students/{student_id}/simulate-outcome
Verifies structured 'not_integrated' status and proper student 404 handling.
"""

import sys
from pathlib import Path
from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.main import app

client = TestClient(app)


def test_post_intervene_draft_workflow():
    """Verify POST /intervention or /intervene returns structured draft with human approval required."""
    payload = {
        "student_id": "S1001",
        "intervention_type": "tutoring",
        "parameters": {"hours": 10},
    }
    response = client.post("/intervene", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["student_id"] == "S1001"
    assert data["status"] == "drafted"
    assert data["requires_human_approval"] is True
    assert data["human_approved"] is False
    assert "draft" in data
    assert "recommended_actions" in data


def test_post_intervention_approved():
    """Verify POST /intervention with approved=True updates status and captures approval."""
    payload = {
        "student_id": "S1001",
        "intervention_type": "Financial Aid Counseling",
        "approved": True,
        "notes": "Approved tuition assistance plan for semester 2",
    }
    response = client.post("/intervention", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "approved"
    assert data["human_approved"] is True
    assert data["requires_human_approval"] is True


def test_simulate_outcome_existing_student():
    """Verify POST /students/S1001/simulate-outcome returns structured simulated demonstration outcome."""
    payload = {
        "intervention_type": "financial_aid_counseling",
        "parameters": {"grant_amount": 500},
    }
    response = client.post("/students/S1001/simulate-outcome", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "simulated"
    assert data["student_id"] == "S1001"
    assert data["badge"] == "SIMULATED DEMONSTRATION OUTCOME"
    assert "simulated_risk_score" in data
    assert "simulated_risk_level" in data


def test_simulate_outcome_nonexistent_student_returns_404():
    """Verify POST /students/S9999/simulate-outcome returns 404."""
    payload = {
        "intervention_type": "tutoring",
    }
    response = client.post("/students/S9999/simulate-outcome", json=payload)
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert "S9999 not found" in data["detail"]

