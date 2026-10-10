"""backend/tests/test_csv_import.py

Tests for CSV Academic Dataset Validation and Import.
Verifies:
- Schema checks against 36 UCI features.
- Row-level error reporting, duplicate IDs, missing columns.
- Preview mode vs Import mode.
- Access restrictions on importing data.
"""

import json
from pathlib import Path
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.student_service import student_service
from ml.explainability.uci_schema import UCI_ALL_FEATURES

client = TestClient(app)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent


def _build_valid_csv_text(row_count=2) -> str:
    """Helper creating valid CSV text containing the frozen 36 UCI features."""
    demo_file = PROJECT_ROOT / "docs" / "DEMO_STUDENTS.json"
    with open(demo_file, "r", encoding="utf-8") as f:
        demo_students = json.load(f)

    headers = ["student_id"] + list(UCI_ALL_FEATURES)
    lines = [",".join(headers)]

    for i in range(min(row_count, len(demo_students))):
        s = demo_students[i]
        sid = f"TEST_S{i+1}"
        features = s["features"]
        row_vals = [sid]
        for feat in UCI_ALL_FEATURES:
            row_vals.append(str(features.get(feat, 0)))
        lines.append(",".join(row_vals))

    return "\n".join(lines)


def test_validate_csv_success():
    """Verify POST /data/validate-csv returns valid report for valid CSV."""
    csv_text = _build_valid_csv_text(2)
    response = client.post(
        "/data/validate-csv?filename=test_students.csv&preview_only=true",
        content=csv_text.encode("utf-8"),
        headers={"Content-Type": "text/csv"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is True
    assert data["total_rows"] == 2
    assert data["accepted_rows"] == 2
    assert data["rejected_rows"] == 0
    assert len(data["errors"]) == 0
    assert data["preview_sample"] is not None


def test_validate_csv_missing_columns():
    """Verify POST /data/validate-csv rejects CSV missing required features."""
    bad_csv = "student_id,Course,Age at enrollment\nS1001,171,20\n"
    response = client.post(
        "/data/validate-csv?filename=bad.csv",
        content=bad_csv.encode("utf-8"),
        headers={"Content-Type": "text/csv"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is False
    assert len(data["missing_columns"]) > 0
    assert len(data["errors"]) > 0


def test_validate_csv_duplicate_ids():
    """Verify POST /data/validate-csv detects duplicate student IDs."""
    csv_text = _build_valid_csv_text(1)
    # Append duplicate row
    lines = csv_text.split("\n")
    lines.append(lines[-1])  # duplicate the data row
    dup_csv = "\n".join(lines)

    response = client.post(
        "/data/validate-csv?filename=duplicates.csv",
        content=dup_csv.encode("utf-8"),
        headers={"Content-Type": "text/csv"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is False
    assert "TEST_S1" in data["duplicate_ids"]


def test_validate_csv_empty_body():
    """Verify POST /data/validate-csv returns 400 for empty body."""
    response = client.post(
        "/data/validate-csv",
        content=b"",
        headers={"Content-Type": "text/csv"},
    )
    assert response.status_code == 400


def test_import_csv_role_protection():
    """Verify POST /data/import-csv forbids student role from importing datasets."""
    csv_text = _build_valid_csv_text(1)
    headers = {
        "X-User-Role": "student",
        "X-User-Id": "S1001",
        "Content-Type": "text/csv",
    }
    response = client.post(
        "/data/import-csv",
        content=csv_text.encode("utf-8"),
        headers=headers,
    )
    assert response.status_code == 403


def test_import_csv_admin_success():
    """Verify Admin can import valid CSV and query newly ingested students."""
    csv_text = _build_valid_csv_text(1)
    headers = {
        "X-User-Role": "admin",
        "X-User-Id": "ADMIN_DEAN",
        "Content-Type": "text/csv",
    }
    response = client.post(
        "/data/import-csv",
        content=csv_text.encode("utf-8"),
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is True
    assert "Successfully validated" in data["message"]

    # Verify newly ingested student record is queryable
    get_res = client.get("/students/TEST_S1")
    assert get_res.status_code == 200
    stu_data = get_res.json()
    assert stu_data["student_id"] == "TEST_S1"
    assert stu_data["risk_score"] >= 0

    # Clean up test ingestion
    student_service.reset()
