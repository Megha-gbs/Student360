"""
End-to-End Live Verification Script for all Student360 Backend Endpoints.
Tests:
1. GET /health
2. GET /students
3. GET /students/S1001
4. GET /students/S9999 (404)
5. POST /simulate (valid)
6. POST /simulate (invalid)
7. POST /intervene
8. POST /students/S1001/simulate-outcome
9. GET /cohort/insights
10. OpenAPI schema & Swagger endpoint verification
"""

import sys
import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi.testclient import TestClient
from backend.app.main import app

def run_verification():
    print("=" * 60)
    print("STUDENT360 BACKEND: END-TO-END VERIFICATION")
    print("=" * 60)
    
    with TestClient(app) as client:
        # 1. GET /health
        print("\n[1] Testing GET /health...")
        res = client.get("/health")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert data == {"status": "ok"}
        print("  -> PASS: Status is", data)

        # 2. GET /students
        print("\n[2] Testing GET /students...")
        res = client.get("/students")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert data["total"] == 4424
        assert len(data["students"]) == 4424
        s1 = data["students"][0]
        print(f"  -> PASS: Total students: {data['total']}. First student: {s1['student_id']}, Risk: {s1['risk_score']} ({s1['risk_level']}), Trend: {s1['trend']}")

        # 3. GET /students/S1001
        print("\n[3] Testing GET /students/S1001...")
        res = client.get("/students/S1001")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        s1001 = res.json()
        assert s1001["student_id"] == "S1001"
        assert s1001["prediction"]["risk_score"] == 74
        assert s1001["prediction"]["risk_level"] == "High"
        assert len(s1001["top_reasons"]) >= 3
        assert s1001["trajectory_data"]["trajectory_type"] == "real_sem1_to_sem2"
        print(f"  -> PASS: S1001 retrieved. Prediction: Risk Score {s1001['prediction']['risk_score']} ({s1001['prediction']['risk_level']})")
        print(f"     Top SHAP reason: {s1001['top_reasons'][0]['feature']} (Impact: {s1001['top_reasons'][0]['impact']}, Direction: {s1001['top_reasons'][0]['direction']})")
        print(f"     Trajectory: {len(s1001['trajectory_data']['points'])} points: Sem 1 Risk {s1001['trajectory_data']['points'][0]['risk_score']} -> Sem 2 Risk {s1001['trajectory_data']['points'][1]['risk_score']}")

        # 4. GET /students/S9999 (404)
        print("\n[4] Testing GET /students/S9999 (404 Not Found)...")
        res = client.get("/students/S9999")
        assert res.status_code == 404
        assert "S9999 not found" in res.json()["detail"]
        print("  -> PASS: Correctly returned 404:", res.json())

        # 5. POST /simulate (valid)
        print("\n[5] Testing POST /simulate (valid modified features)...")
        sim_features = dict(s1001["features"])
        sim_features["Curricular units 2nd sem (approved)"] = 6
        sim_features["Curricular units 2nd sem (grade)"] = 15.0
        res = client.post("/simulate", json={"student_id": "S1001_SIM", "features": sim_features})
        assert res.status_code == 200
        sim_res = res.json()
        assert sim_res["simulation"] is True
        print(f"  -> PASS: Simulation result: Risk Score {sim_res['risk_score']} ({sim_res['risk_level']}), Note: {sim_res['note'][:45]}...")

        # 6. POST /simulate (invalid)
        print("\n[6] Testing POST /simulate (invalid with missing feature & Target column)...")
        res_bad1 = client.post("/simulate", json={"features": {"Target": 0}})
        assert res_bad1.status_code == 400
        print("  -> PASS: Target column rejected (HTTP 400):", res_bad1.json()["detail"])

        bad_features = dict(sim_features)
        bad_features["attendance"] = 99
        res_bad2 = client.post("/simulate", json={"features": bad_features})
        assert res_bad2.status_code == 400
        print("  -> PASS: Prohibited feature rejected (HTTP 400):", res_bad2.json()["detail"])

        # 7. POST /intervene
        print("\n[7] Testing POST /intervene...")
        res = client.post("/intervene", json={"student_id": "S1001", "intervention_type": "advising"})
        assert res.status_code == 200
        assert res.json()["status"] == "drafted"
        assert res.json()["requires_human_approval"] is True
        print("  -> PASS: Correctly returns drafted intervention with human approval flag:", res.json())

        # 8. POST /students/S1001/simulate-outcome
        print("\n[8] Testing POST /students/S1001/simulate-outcome...")
        res = client.post("/students/S1001/simulate-outcome", json={"intervention_type": "grant"})
        assert res.status_code == 200
        assert res.json()["status"] == "simulated"
        assert res.json()["badge"] == "SIMULATED DEMONSTRATION OUTCOME"
        print("  -> PASS: Correctly returns simulated outcome badge:", res.json())

        # 9. GET /cohort/insights
        print("\n[9] Testing GET /cohort/insights...")
        res = client.get("/cohort/insights")
        assert res.status_code == 200
        insights = res.json()
        assert insights["total_students"] == 10
        assert insights["high_risk_count"] == 3
        assert insights["medium_risk_count"] == 1
        assert insights["low_risk_count"] == 6
        assert insights["risk_distribution"] == {"High": 3, "Medium": 1, "Low": 6}
        assert len(insights["global_shap"]) > 0
        print(f"  -> PASS: Cohort insights calculated dynamically:")
        print(f"     Total: {insights['total_students']}, High: {insights['high_risk_count']}, Medium: {insights['medium_risk_count']}, Low: {insights['low_risk_count']}")
        print(f"     Top Global SHAP driver: {insights['global_shap'][0]['feature']} (mean |SHAP| = {insights['global_shap'][0]['mean_abs_shap']})")

        # 10. Swagger and OpenAPI verification
        print("\n[10] Testing OpenAPI schema /openapi.json...")
        res = client.get("/openapi.json")
        assert res.status_code == 200
        schema = res.json()
        assert "paths" in schema
        paths = list(schema["paths"].keys())
        print(f"  -> PASS: OpenAPI generated with {len(paths)} endpoints: {paths}")

    print("\n" + "=" * 60)
    print("ALL 10 END-TO-END VERIFICATION CHECKS PASSED PERFECTLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_verification()
