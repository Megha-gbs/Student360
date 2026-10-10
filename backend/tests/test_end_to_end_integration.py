"""
End-to-End ML Integration Test for Student360 Backend.
Tests all six core endpoints using real data from docs/DEMO_STUDENTS.json:
1. GET /health
2. GET /students/priority-queue (and GET /students)
3. GET /students/{student_id} (full Student 360 payload with risk + top_reasons + trajectory)
4. POST /students/{student_id}/what-if (counterfactual simulation)
5. POST /intervention (draft + human approval flag)
6. GET /cohort/insights (risk distribution + global SHAP + segments + by-course)

Validates exact frozen JSON contracts and prints a clear SUCCESS / FAIL summary.
"""

import json
import logging
import sys
from pathlib import Path
from typing import Any, Dict

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi.testclient import TestClient
from backend.app.main import app

# Silence non-critical logs during testing
logging.getLogger("student360").setLevel(logging.WARNING)

FROZEN_TRAJECTORY_NOTE = "Based on actual 1st vs 2nd semester curricular units from the dataset"


def test_end_to_end_ml_stack():
    """Runs end-to-end integration test across all 6 core endpoints with real ML integration."""
    demo_file = PROJECT_ROOT / "docs" / "DEMO_STUDENTS.json"
    assert demo_file.exists(), f"Demo students file missing: {demo_file}"

    with open(demo_file, "r", encoding="utf-8") as f:
        demo_students = json.load(f)
    assert len(demo_students) > 0, "No demo students found in docs/DEMO_STUDENTS.json"

    # Select the primary high-risk demo student
    target_student = demo_students[0]
    target_id = str(target_student.get("demo_id") or target_student.get("student_id", "S1001"))

    results = []

    with TestClient(app) as client:
        # -------------------------------------------------------------
        # Endpoint 1: GET /health
        # -------------------------------------------------------------
        try:
            res = client.get("/health")
            assert res.status_code == 200, f"Status code {res.status_code}: {res.text}"
            data = res.json()
            assert data.get("status") == "ok", f"Unexpected status: {data}"
            results.append(("GET /health", "PASS", "Operational status OK"))
        except Exception as exc:
            results.append(("GET /health", "FAIL", str(exc)))
            raise

        # -------------------------------------------------------------
        # Endpoint 2: GET /students/priority-queue
        # -------------------------------------------------------------
        try:
            res = client.get("/students/priority-queue")
            assert res.status_code == 200, f"Status code {res.status_code}: {res.text}"
            data = res.json()
            assert "total" in data and "students" in data
            assert data["total"] >= len(demo_students)
            students = data["students"]
            assert len(students) >= len(demo_students)
            # Verify sorted descending by risk_score
            scores = [s["risk_score"] for s in students]
            assert scores == sorted(scores, reverse=True), "Priority queue not sorted descending by risk_score"
            # Verify fields on first student
            s0 = students[0]
            for field in ["student_id", "risk_score", "risk_level", "dropout_probability", "model_version", "priority"]:
                assert field in s0, f"Missing field '{field}' in priority queue item"
            assert s0["risk_level"] in ["High", "Medium", "Low"]
            results.append(("GET /students/priority-queue", "PASS", f"{len(students)} students ranked (Top Risk: {scores[0]})"))
        except Exception as exc:
            results.append(("GET /students/priority-queue", "FAIL", str(exc)))
            raise

        # -------------------------------------------------------------
        # Endpoint 3: GET /students/{student_id} (Full Student 360)
        # -------------------------------------------------------------
        try:
            res = client.get(f"/students/{target_id}")
            assert res.status_code == 200, f"Status code {res.status_code}: {res.text}"
            payload = res.json()

            # Assert top-level fields match exact frozen contract
            assert payload["student_id"] == target_id
            assert isinstance(payload["risk_score"], int)
            assert payload["risk_level"] in ["High", "Medium", "Low"]
            assert isinstance(payload["dropout_probability"], float)
            assert 0.0 <= payload["dropout_probability"] <= 1.0
            assert isinstance(payload["model_version"], str) and len(payload["model_version"]) > 0
            assert payload["trend"] in ["Deteriorating", "Improving", "Stable"]

            # Assert top_reasons: 3 to 5 items with real UCI features
            top_reasons = payload.get("top_reasons")
            assert isinstance(top_reasons, list), "top_reasons must be a list"
            assert 3 <= len(top_reasons) <= 5, f"Expected 3-5 top_reasons, got {len(top_reasons)}"
            for reason in top_reasons:
                assert "feature" in reason and isinstance(reason["feature"], str)
                assert "value" in reason
                assert reason["impact"] in ["high", "medium", "low"]
                assert reason["direction"] in ["increases_risk", "decreases_risk"]
                # Must not contain invented columns
                assert reason["feature"].lower() not in ["attendance", "study_time", "studytime"]

            # Assert trajectory_data: real Sem1->Sem2 only
            traj = payload.get("trajectory_data")
            assert traj is not None, "trajectory_data missing"
            assert traj["trajectory_type"] == "real_sem1_to_sem2"
            assert traj["note"] == FROZEN_TRAJECTORY_NOTE
            points = traj["points"]
            assert len(points) == 2, f"Expected 2 trajectory points, got {len(points)}"
            assert points[0]["semester"] == "Sem 1"
            assert points[1]["semester"] == "Sem 2"
            assert isinstance(points[0]["risk_score"], int)
            assert isinstance(points[1]["risk_score"], int)
            assert "approved_units" in points[0] and "approved_units" in points[1]
            assert "grade" in points[0] and "grade" in points[1]

            results.append((
                f"GET /students/{target_id}",
                "PASS",
                f"Risk: {payload['risk_score']} ({payload['risk_level']}), "
                f"Reasons: {len(top_reasons)}, Trend: {payload['trend']}"
            ))
        except Exception as exc:
            results.append((f"GET /students/{target_id}", "FAIL", str(exc)))
            raise

        # -------------------------------------------------------------
        # Endpoint 4: POST /students/{student_id}/what-if
        # -------------------------------------------------------------
        try:
            what_if_payload = {
                "changes": {
                    "Curricular units 2nd sem (approved)": 6.0,
                    "Curricular units 2nd sem (grade)": 15.5,
                }
            }
            res = client.post(f"/students/{target_id}/what-if", json=what_if_payload)
            assert res.status_code == 200, f"Status code {res.status_code}: {res.text}"
            sim_data = res.json()
            assert sim_data["simulation"] is True
            assert sim_data["student_id"] == target_id
            assert "original_risk" in sim_data
            assert "simulated_risk" in sim_data
            assert sim_data["simulated_risk"] <= sim_data["original_risk"]
            assert sim_data["risk_level"] in ["High", "Medium", "Low"]
            assert "note" in sim_data
            results.append((
                f"POST /students/{target_id}/what-if",
                "PASS",
                f"Original: {sim_data['original_risk']} -> Simulated: {sim_data['simulated_risk']} ({sim_data['risk_level']})"
            ))
        except Exception as exc:
            results.append((f"POST /students/{target_id}/what-if", "FAIL", str(exc)))
            raise

        # -------------------------------------------------------------
        # Endpoint 5: POST /intervention
        # -------------------------------------------------------------
        try:
            intervention_payload = {
                "student_id": target_id,
                "intervention_type": "Academic Mentoring",
                "approved": True,
                "notes": "Student assigned faculty tutor for Sem 2 catch-up.",
            }
            res = client.post("/intervention", json=intervention_payload)
            assert res.status_code == 200, f"Status code {res.status_code}: {res.text}"
            interv_data = res.json()
            assert interv_data["student_id"] == target_id
            assert interv_data["status"] == "approved"
            assert interv_data["requires_human_approval"] is True
            assert interv_data["human_approved"] is True
            assert "recommended_actions" in interv_data and len(interv_data["recommended_actions"]) > 0

            # Test drafting flow without approval
            res_draft = client.post("/intervention", json={"student_id": target_id})
            assert res_draft.status_code == 200
            draft_data = res_draft.json()
            assert draft_data["status"] == "drafted"
            assert draft_data["human_approved"] is False
            assert draft_data["requires_human_approval"] is True

            results.append((
                "POST /intervention",
                "PASS",
                f"Draft & Human Approval workflows verified (Category: {interv_data['category']})"
            ))
        except Exception as exc:
            results.append(("POST /intervention", "FAIL", str(exc)))
            raise

        # -------------------------------------------------------------
        # Endpoint 6: GET /cohort/insights
        # -------------------------------------------------------------
        try:
            res = client.get("/cohort/insights")
            assert res.status_code == 200, f"Status code {res.status_code}: {res.text}"
            cohort_data = res.json()
            assert cohort_data["total_students"] >= len(demo_students)
            assert "risk_distribution" in cohort_data
            dist = cohort_data["risk_distribution"]
            assert dist["High"] + dist["Medium"] + dist["Low"] == cohort_data["total_students"]

            # Global SHAP
            assert "global_shap" in cohort_data and cohort_data["global_shap"] is not None
            assert len(cohort_data["global_shap"]) > 0
            top_global = cohort_data["global_shap"][0]
            assert "feature" in top_global and "mean_abs_shap" in top_global

            # Segments and Course breakdown
            assert "segments" in cohort_data and len(cohort_data["segments"]) > 0
            assert "by_course" in cohort_data and len(cohort_data["by_course"]) > 0

            results.append((
                "GET /cohort/insights",
                "PASS",
                f"Total: {cohort_data['total_students']}, "
                f"Dist: {dist}, "
                f"Top Global Feature: {top_global['feature']}"
            ))
        except Exception as exc:
            results.append(("GET /cohort/insights", "FAIL", str(exc)))
            raise

    # Print summary
    print("\n" + "=" * 70)
    print("STUDENT360 BACKEND: END-TO-END ML INTEGRATION TEST SUMMARY")
    print("=" * 70)
    all_passed = True
    for endpoint, status, details in results:
        indicator = "[PASS]" if status == "PASS" else "[FAIL]"
        if status != "PASS":
            all_passed = False
        print(f"{indicator} {endpoint:<35} : {details}")
    print("=" * 70)
    if all_passed:
        print("OVERALL RESULT: SUCCESS (All 6 core endpoints fully operational)")
    else:
        print("OVERALL RESULT: FAIL")
    print("=" * 70 + "\n")
    assert all_passed, "One or more end-to-end integration checks failed."


if __name__ == "__main__":
    try:
        test_end_to_end_ml_stack()
        sys.exit(0)
    except Exception:
        sys.exit(1)

