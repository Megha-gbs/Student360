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


def test_post_intervene_not_integrated():
    """Verify POST /intervene returns structured 'not_integrated' status without fake data."""
    payload = {
        "student_id": "S1001",
        "intervention_type": "tutoring",
        "parameters": {"hours": 10},
    }
    response = client.post("/intervene", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "not_integrated"
    assert "not yet connected" in data["message"]


def test_simulate_outcome_existing_student():
    """Verify POST /students/S1001/simulate-outcome returns structured 'not_integrated' status."""
    payload = {
        "intervention_type": "financial_aid_counseling",
        "parameters": {"grant_amount": 500},
    }
    response = client.post("/students/S1001/simulate-outcome", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "not_integrated"
    assert "not yet connected" in data["message"]
    assert data["student_id"] == "S1001"


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
