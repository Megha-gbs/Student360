"""backend/tests/test_auth.py

Unit tests for Role-Based Access Control (RBAC) and Privacy Boundaries.
Verifies:
- Students cannot view other students' records (403 Forbidden).
- Students can view their own record (200 OK).
- Faculty can view assigned students.
- Faculty cannot view unassigned students when assignment mapping exists (403 Forbidden).
- Admins have complete access.
- Anonymous / demo calls function in demo advisor mode.
- /auth/me returns current user identity.
"""


import sys
from pathlib import Path

# Add the project root to Python's import path.
PROJECT_ROOT = Path(__file__).resolve().parents[2]

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)



def test_auth_me_default_demo():
    """Verify /auth/me returns default demo faculty advisor when unauthenticated."""
    response = client.get("/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "faculty"
    assert data["user_id"] == "DEMO_FACULTY_ADVISOR"


def test_auth_me_explicit_student():
    """Verify /auth/me returns student identity when X-User-Role and X-User-Id are provided."""
    headers = {
        "X-User-Role": "student",
        "X-User-Id": "S1001",
    }
    response = client.get("/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "student"
    assert data["user_id"] == "S1001"


def test_student_cannot_access_other_student_record():
    """Security Policy: Students are strictly forbidden from viewing another student's record."""
    # Student S1002 attempts to view S1001's private record
    headers = {
        "X-User-Role": "student",
        "X-User-Id": "S1002",
    }
    response = client.get("/students/S1001", headers=headers)
    assert response.status_code == 403
    assert "strictly prohibited" in response.json()["detail"]


def test_student_can_access_own_record():
    """Security Policy: Student S1001 can view their own record."""
    headers = {
        "X-User-Role": "student",
        "X-User-Id": "S1001",
    }
    response = client.get("/students/S1001", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["student_id"] == "S1001"


def test_student_priority_queue_is_filtered_to_own_record():
    """Student viewing priority queue only sees their own entry."""
    headers = {
        "X-User-Role": "student",
        "X-User-Id": "S1001",
    }
    response = client.get("/students/priority-queue", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["students"][0]["student_id"] == "S1001"


def test_faculty_assigned_student_access():
    """Faculty advisor FAC_ADVISOR_01 can access assigned student S1001."""
    headers = {
        "Authorization": "Bearer faculty:FAC_ADVISOR_01",
    }
    response = client.get("/students/S1001", headers=headers)
    assert response.status_code == 200
    assert response.json()["student_id"] == "S1001"


def test_faculty_unassigned_student_blocked():
    """Faculty advisor FAC_ADVISOR_01 is blocked from accessing unassigned student S1005."""
    headers = {
        "Authorization": "Bearer faculty:FAC_ADVISOR_01",
    }
    response = client.get("/students/S1005", headers=headers)
    assert response.status_code == 403
    assert "not assigned" in response.json()["detail"]


def test_admin_access_any_student():
    """Admin has unrestricted access to all student records."""
    headers = {
        "X-User-Role": "admin",
        "X-User-Id": "ADMIN_DEAN_01",
    }
    response = client.get("/students/S1005", headers=headers)
    assert response.status_code == 200
    assert response.json()["student_id"] == "S1005"


def test_bearer_token_student_auth():
    """Verify Bearer token parses student role and id."""
    headers = {
        "Authorization": "Bearer student:S1001",
    }
    response = client.get("/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "student"
    assert data["user_id"] == "S1001"


def test_bearer_token_admin_auth():
    """Verify Bearer token parses admin role and id."""
    headers = {
        "Authorization": "Bearer admin:ADMIN_SUPER",
    }
    response = client.get("/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "admin"
    assert data["user_id"] == "ADMIN_SUPER"


def test_invalid_role_header_returns_400():
    """Verify invalid X-User-Role header returns HTTP 400 Bad Request."""
    headers = {
        "X-User-Role": "superhero",
        "X-User-Id": "BATMAN",
    }
    response = client.get("/auth/me", headers=headers)
    assert response.status_code == 400
    assert "Invalid X-User-Role" in response.json()["detail"]


def test_invalid_bearer_token_role_returns_401():
    """Verify invalid role in Bearer token returns HTTP 401 Unauthorized."""
    headers = {
        "Authorization": "Bearer invalidrole:USER_123",
    }
    response = client.get("/auth/me", headers=headers)
    assert response.status_code == 401
    assert "Invalid role" in response.json()["detail"]


def test_inferred_student_id_header():
    """Verify that student ID starting with 'S' without role header infers Student role."""
    headers = {
        "X-User-Id": "S1001",
    }
    response = client.get("/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "student"
    assert data["user_id"] == "S1001"


def test_student_cannot_view_cohort_insights():
    """Security Policy: Students cannot view institutional cohort insights."""
    headers = {
        "X-User-Role": "student",
        "X-User-Id": "S1001",
    }
    response = client.get("/cohort/insights", headers=headers)
    assert response.status_code == 403
    assert "Access denied" in response.json()["detail"]


def test_student_success_score_privacy():
    """Security Policy: Student S1001 can view own success score but not S1002's."""
    headers = {
        "X-User-Role": "student",
        "X-User-Id": "S1001",
    }
    # Own success score allowed
    res_own = client.get("/students/S1001/success-score", headers=headers)
    assert res_own.status_code == 200

    # Other student's success score forbidden
    res_other = client.get("/students/S1002/success-score", headers=headers)
    assert res_other.status_code == 403


def test_student_placement_readiness_privacy():
    """Security Policy: Student S1001 can view own placement readiness but not S1002's."""
    headers = {
        "X-User-Role": "student",
        "X-User-Id": "S1001",
    }
    # Own placement readiness allowed
    res_own = client.get("/students/S1001/placement-readiness", headers=headers)
    assert res_own.status_code == 200

    # Other student's placement readiness forbidden
    res_other = client.get("/students/S1002/placement-readiness", headers=headers)
    assert res_other.status_code == 403


def test_student_simulation_what_if_privacy():
    """Security Policy: Student S1001 cannot simulate counterfactuals for S1002."""
    headers = {
        "X-User-Role": "student",
        "X-User-Id": "S1001",
    }
    response = client.post(
        "/students/S1002/what-if",
        json={"changes": {"Curricular units 2nd sem (approved)": 5}},
        headers=headers,
    )
    assert response.status_code == 403


def test_student_intervention_outcome_privacy():
    """Security Policy: Student S1001 cannot simulate intervention outcomes for S1002."""
    headers = {
        "X-User-Role": "student",
        "X-User-Id": "S1001",
    }
    response = client.post(
        "/students/S1002/simulate-outcome",
        json={"intervention_type": "advising"},
        headers=headers,
    )
    assert response.status_code == 403


def test_auth_login_roles():
    """Verify /auth/login returns correct user profile and token for Admin, Faculty, and Student."""
    # Admin
    res_admin = client.post("/auth/login", json={"username": "admin@smartcampus.edu", "password": "admin123"})
    assert res_admin.status_code == 200
    data_admin = res_admin.json()
    assert data_admin["user"]["role"] == "admin"
    assert data_admin["user"]["id"] == "ADM001"

    # Faculty
    res_fac = client.post("/auth/login", json={"username": "faculty@smartcampus.edu", "password": "faculty123"})
    assert res_fac.status_code == 200
    data_fac = res_fac.json()
    assert data_fac["user"]["role"] == "faculty"
    assert data_fac["user"]["id"] == "FAC-CS101"
    assert len(data_fac["user"]["assigned_students"]) == 10

    # Student
    res_stu = client.post("/auth/login", json={"username": "student@smartcampus.edu", "password": "student123"})
    assert res_stu.status_code == 200
    data_stu = res_stu.json()
    assert data_stu["user"]["role"] == "student"
    assert data_stu["user"]["id"] == "S1001"


def test_faculty_cs101_assigned_students_access():
    """Verify FAC-CS101 has authorized access to all 10 assigned students (S1001-S1010)."""
    headers = {
        "Authorization": "Bearer faculty:FAC-CS101",
    }
    res = client.get("/admin/students", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 10
    student_ids = [s["student_id"] for s in data]
    assert "S1001" in student_ids
    assert "S1010" in student_ids


def test_faculty_teaching_schedule_week():
    """Verify teaching schedule returns lectures and labs across weekdays for FAC-CS101."""
    headers = {
        "Authorization": "Bearer faculty:FAC-CS101",
    }
    res = client.get("/timetable?faculty_id=FAC-CS101", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 5
    days = {item["day"] for item in data}
    assert "Monday" in days
    assert "Tuesday" in days
    assert "Wednesday" in days
    assert "Thursday" in days
    assert "Friday" in days


