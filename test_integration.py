"""test_integration.py

Integration test script for Student360 ML subsystem.
Demonstrates end-to-end execution:
1. Loads a real student from docs/DEMO_STUDENTS.json
2. Runs Mohith's XGBoost prediction + Smruthi's SHAP explanation (233 -> 36 features) + Real Sem1->Sem2 Trajectory
3. Prints risk score, top_reasons, and trajectory_data
4. Verifies frozen JSON shapes and contract compliance
"""

from __future__ import annotations

import json
import os
import sys
import warnings

# Suppress serialization version notices
warnings.filterwarnings("ignore")

# Ensure project root in sys.path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from ml.explainability import predict_and_explain_student, UCI_ALL_FEATURES
from ml.explainability.uci_schema import normalize_feature_name


def run_integration_test() -> None:
    print("=" * 70)
    print("  STUDENT360 ML INTEGRATION TEST (Mohith Model + Smruthi SHAP & Trajectory)")
    print("=" * 70)

    demo_file = os.path.join(PROJECT_ROOT, "docs", "DEMO_STUDENTS.json")
    if not os.path.exists(demo_file):
        raise FileNotFoundError(f"Demo students file not found at: {demo_file}")

    with open(demo_file, "r", encoding="utf-8") as f:
        demo_students = json.load(f)

    # Pick the first demo student (S1001)
    student_record = demo_students[0]
    demo_id = student_record["demo_id"]
    features = student_record["features"]

    print(f"\n[1] Loaded Student: {demo_id}")
    print(f"    Raw features count: {len(features)}")

    # Execute full integrated pipeline
    result = predict_and_explain_student(
        features=features,
        student_id=demo_id,
        top_k=5,
    )

    print("\n[2] Execution Successful! Combined Backend Payload:")
    print(json.dumps(result, indent=2))

    # Assertions and contract validation
    print("\n[3] Validating JSON Contracts:")

    # Risk fields
    assert "risk_score" in result, "Missing risk_score"
    assert isinstance(result["risk_score"], int), "risk_score must be int"
    assert 0 <= result["risk_score"] <= 100, "risk_score must be between 0 and 100"
    assert result["risk_level"] in ["High", "Medium", "Low"], "Invalid risk_level"
    assert 0.0 <= result["dropout_probability"] <= 1.0, "dropout_probability must be in [0, 1]"
    print("    [PASS] Risk score, risk level, and dropout probability match contract.")

    # SHAP reasons
    assert "top_reasons" in result, "Missing top_reasons"
    reasons = result["top_reasons"]
    assert 3 <= len(reasons) <= 5, f"Expected 3-5 top reasons, got {len(reasons)}"

    normalized_canonical = {normalize_feature_name(f) for f in UCI_ALL_FEATURES}
    for r in reasons:
        assert "feature" in r, "Reason missing feature"
        assert "value" in r, "Reason missing value"
        assert "impact" in r, "Reason missing impact"
        assert "direction" in r, "Reason missing direction"
        assert r["impact"] in ["high", "medium", "low"], f"Invalid impact: {r['impact']}"
        assert r["direction"] in ["increases_risk", "decreases_risk"], f"Invalid direction: {r['direction']}"
        norm_r_feat = normalize_feature_name(r["feature"])
        assert norm_r_feat in normalized_canonical, f"Non-UCI feature detected: {r['feature']}"
    print("    [PASS] top_reasons has 3-5 items with real UCI features and valid impacts/directions.")

    # Trajectory
    assert "trajectory_data" in result, "Missing trajectory_data"
    traj = result["trajectory_data"]
    assert traj["trajectory_type"] == "real_sem1_to_sem2", "Invalid trajectory_type"
    assert len(traj["points"]) == 2, "Trajectory must have exactly 2 points (Sem 1 and Sem 2)"
    assert traj["points"][0]["semester"] == "Sem 1", "Point 0 must be Sem 1"
    assert traj["points"][1]["semester"] == "Sem 2", "Point 1 must be Sem 2"
    assert "approved_units" in traj["points"][0] and "grade" in traj["points"][0]
    assert "approved_units" in traj["points"][1] and "grade" in traj["points"][1]
    assert traj["note"] == "Based on actual 1st vs 2nd semester curricular units from the dataset"
    print("    [PASS] trajectory_data is real Sem1->Sem2 with exact frozen disclaimer note.")

    # Trend
    assert result["trend"] in ["Deteriorating", "Improving", "Stable"], f"Invalid trend: {result['trend']}"
    print(f"    [PASS] Trend calculated: {result['trend']}")

    print("\n" + "=" * 70)
    print("  ALL VERIFICATIONS PASSED: ZERO ERRORS! PRODUCTION-READY!")
    print("=" * 70)


if __name__ == "__main__":
    run_integration_test()
