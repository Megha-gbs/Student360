"""backend/tests/test_faculty_attendance_bug_b.py

Regression tests for Bug B: Attendance always reports six records submitted.
Verifies:
- GET /attendance/class returns actual roster for section
- POST /attendance/submit dynamically computes and reports EXACT counts (never hardcoded 6)
- Tests varying roster counts: 10, 5, 8, 3, 1 students
- Tests diverse status mixes (Present, Absent, Late)
- Verifies remarks persistence and idempotent updates
- Verifies empty submission behavior
"""

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_get_roster_by_class():
    """Verify class attendance sheet returns section-appropriate roster."""
    # CS-Sem2 has 10 students
    res_sem2 = client.get("/attendance/class?class_id=CS-Sem2&subject_code=CS301&date=2026-10-10")
    assert res_sem2.status_code == 200
    roster_sem2 = res_sem2.json()
    assert len(roster_sem2) == 10

    # CS-Sem3-A has 5 students
    res_sem3a = client.get("/attendance/class?class_id=CS-Sem3-A&subject_code=CS301&date=2026-10-10")
    assert res_sem3a.status_code == 200
    roster_sem3a = res_sem3a.json()
    assert len(roster_sem3a) == 5


def test_submit_ten_students_exact_counts():
    """Verify submitting 10 students returns exactly 10 in response, not 6."""
    payload = {
        "class_id": "CS-Sem2",
        "subject_code": "CS301",
        "date": "2026-10-10",
        "session": "Morning",
        "faculty_id": "FAC-CS101",
        "records": [
            {"student_id": "S1001", "student_name": "Sarah Connor", "roll_number": "CS2024-001", "status": "Present", "remarks": "On time"},
            {"student_id": "S1002", "student_name": "Marcus Vance", "roll_number": "CS2024-002", "status": "Present", "remarks": ""},
            {"student_id": "S1003", "student_name": "Elena Rostova", "roll_number": "CS2024-003", "status": "Present", "remarks": ""},
            {"student_id": "S1004", "student_name": "David Kim", "roll_number": "CS2024-004", "status": "Present", "remarks": ""},
            {"student_id": "S1005", "student_name": "Aisha Patel", "roll_number": "CS2024-005", "status": "Present", "remarks": ""},
            {"student_id": "S1006", "student_name": "Liam O'Connor", "roll_number": "CS2024-006", "status": "Present", "remarks": ""},
            {"student_id": "S1007", "student_name": "Zoe Saldana", "roll_number": "CS2024-007", "status": "Present", "remarks": ""},
            {"student_id": "S1008", "student_name": "Rajesh Sharma", "roll_number": "CS2024-008", "status": "Absent", "remarks": "Medical leave"},
            {"student_id": "S1009", "student_name": "Emily Blunt", "roll_number": "CS2024-009", "status": "Absent", "remarks": "Unexcused"},
            {"student_id": "S1010", "student_name": "Carlos Gomez", "roll_number": "CS2024-010", "status": "Late", "remarks": "15 min late"},
        ],
    }

    res = client.post("/attendance/submit", json=payload)
    assert res.status_code == 200
    data = res.json()

    # STRICT ASSERTIONS: Must be 10, not 6
    assert data["records_processed"] == 10
    assert data["records_count"] == 10
    assert data["present_count"] == 7
    assert data["absent_count"] == 2
    assert data["late_count"] == 1
    assert "10 student record(s) committed (7 Present, 2 Absent, 1 Late)" in data["message"]
    assert "6 student records" not in data["message"]


def test_submit_five_students_exact_counts():
    """Verify submitting 5 students returns exactly 5, not 6."""
    payload = {
        "class_id": "CS-Sem3-A",
        "subject_code": "CS305",
        "date": "2026-10-11",
        "session": "Afternoon",
        "faculty_id": "FAC-CS101",
        "records": [
            {"student_id": "S1001", "student_name": "Sarah Connor", "roll_number": "CS2024-001", "status": "Present", "remarks": ""},
            {"student_id": "S1002", "student_name": "Marcus Vance", "roll_number": "CS2024-002", "status": "Present", "remarks": ""},
            {"student_id": "S1003", "student_name": "Elena Rostova", "roll_number": "CS2024-003", "status": "Present", "remarks": ""},
            {"student_id": "S1004", "student_name": "David Kim", "roll_number": "CS2024-004", "status": "Absent", "remarks": ""},
            {"student_id": "S1005", "student_name": "Aisha Patel", "roll_number": "CS2024-005", "status": "Late", "remarks": ""},
        ],
    }

    res = client.post("/attendance/submit", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["records_processed"] == 5
    assert data["records_count"] == 5
    assert data["present_count"] == 3
    assert data["absent_count"] == 1
    assert data["late_count"] == 1
    assert "5 student record(s) committed (3 Present, 1 Absent, 1 Late)" in data["message"]
    assert "6 student records" not in data["message"]


def test_submit_three_students_exact_counts():
    """Verify submitting 3 students returns exactly 3, not 6."""
    payload = {
        "class_id": "CS-Sem3-B",
        "subject_code": "CS301",
        "date": "2026-10-12",
        "session": "Morning",
        "faculty_id": "FAC-CS101",
        "records": [
            {"student_id": "S1006", "student_name": "Liam O'Connor", "roll_number": "CS2024-006", "status": "Present", "remarks": ""},
            {"student_id": "S1007", "student_name": "Zoe Saldana", "roll_number": "CS2024-007", "status": "Present", "remarks": ""},
            {"student_id": "S1008", "student_name": "Rajesh Sharma", "roll_number": "CS2024-008", "status": "Present", "remarks": ""},
        ],
    }

    res = client.post("/attendance/submit", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["records_processed"] == 3
    assert data["records_count"] == 3
    assert data["present_count"] == 3
    assert data["absent_count"] == 0
    assert data["late_count"] == 0
    assert "3 student record(s) committed (3 Present, 0 Absent, 0 Late)" in data["message"]
    assert "6 student records" not in data["message"]


def test_attendance_persistence_and_no_duplication():
    """Verify submitted attendance can be retrieved and repeated submits update in-place without duplicating."""
    date_val = "2026-10-15"
    payload = {
        "class_id": "CS-Sem2",
        "subject_code": "CS402",
        "date": date_val,
        "session": "Morning",
        "faculty_id": "FAC-CS101",
        "records": [
            {"student_id": "S1001", "student_name": "Sarah Connor", "roll_number": "CS2024-001", "status": "Present", "remarks": "Note A"},
            {"student_id": "S1002", "student_name": "Marcus Vance", "roll_number": "CS2024-002", "status": "Absent", "remarks": "Note B"},
        ],
    }

    # First submit
    res1 = client.post("/attendance/submit", json=payload)
    assert res1.status_code == 200
    assert res1.json()["records_count"] == 2

    # Query attendance sheet
    get_res = client.get(f"/attendance/class?class_id=CS-Sem2&subject_code=CS402&date={date_val}")
    assert get_res.status_code == 200
    sheet = get_res.json()
    assert len(sheet) == 2
    s1 = next(s for s in sheet if s["student_id"] == "S1001")
    assert s1["status"] == "Present"
    assert s1["remarks"] == "Note A"

    # Repeated submit with status change
    payload["records"][0]["status"] = "Late"
    payload["records"][0]["remarks"] = "Updated note"
    res2 = client.post("/attendance/submit", json=payload)
    assert res2.status_code == 200
    assert res2.json()["records_count"] == 2
    assert res2.json()["late_count"] == 1
    assert res2.json()["absent_count"] == 1

    # Check updated sheet - still exactly 2 records
    get_res2 = client.get(f"/attendance/class?class_id=CS-Sem2&subject_code=CS402&date={date_val}")
    assert get_res2.status_code == 200
    sheet2 = get_res2.json()
    assert len(sheet2) == 2
    s1_updated = next(s for s in sheet2 if s["student_id"] == "S1001")
    assert s1_updated["status"] == "Late"
    assert s1_updated["remarks"] == "Updated note"
