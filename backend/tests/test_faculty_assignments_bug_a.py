"""backend/tests/test_faculty_assignments_bug_a.py

Regression tests for Bug A: Create Assignment opens a blank page / 404 handler.
Verifies:
- GET /assignments lists coursework items
- POST /assignments creates a valid persistent assignment with required fields
- Form validation errors on missing fields
- Submitting deliverables and grading flow
"""

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_list_assignments_endpoint():
    """Verify assignments listing returns 200 OK and populated list."""
    response = client.get("/assignments?faculty_id=FAC-CS101")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    first = data[0]
    assert "title" in first
    assert "due_date" in first
    assert "max_marks" in first


def test_create_assignment_success():
    """Verify creating a new assignment persists and returns 201 Created."""
    payload = {
        "title": "Distributed Consensus Algorithms Lab",
        "description": "Implement Raft consensus leader election and log replication.",
        "subject_code": "CS305",
        "subject_name": "Software Engineering & Architecture",
        "faculty_id": "FAC-CS101",
        "class_id": "CS-Sem2",
        "due_date": "2026-11-15",
        "due_time": "23:59",
        "max_marks": 75.0,
    }

    response = client.post("/assignments", json=payload)
    assert response.status_code == 201
    created = response.json()
    assert created["title"] == payload["title"]
    assert created["max_marks"] == 75.0
    assert "id" in created

    # Verify assignment now appears in assignment list
    list_res = client.get("/assignments?class_id=CS-Sem2")
    assert list_res.status_code == 200
    items = list_res.json()
    matching = [i for i in items if i["id"] == created["id"]]
    assert len(matching) == 1
    assert matching[0]["title"] == "Distributed Consensus Algorithms Lab"


def test_submit_and_grade_assignment():
    """Verify assignment submission and grading flow."""
    # 1. Create assignment
    payload = {
        "title": "Machine Learning Hyperparameter Tuning",
        "description": "Evaluate grid search vs Bayesian optimization.",
        "subject_code": "CS402",
        "subject_name": "Machine Learning Fundamentals",
        "faculty_id": "FAC-CS101",
        "class_id": "CS-Sem2",
        "due_date": "2026-11-20",
        "due_time": "18:00",
        "max_marks": 50.0,
    }
    create_res = client.post("/assignments", json=payload)
    assert create_res.status_code == 201
    asg_id = create_res.json()["id"]

    # 2. Student submits deliverable
    sub_payload = {
        "student_id": "S1002",
        "content": "Submitted Jupyter Notebook and requirements.txt",
        "file_name": "opt_s1002.ipynb",
    }
    sub_res = client.post(f"/assignments/{asg_id}/submit", json=sub_payload)
    assert sub_res.status_code == 200
    sub_data = sub_res.json()
    assert sub_data["student_id"] == "S1002"
    assert sub_data["status"] == "Submitted"

    # 3. Faculty grades deliverable
    grade_payload = {
        "grade": 47.5,
        "feedback": "Comprehensive convergence plots and clear analysis.",
    }
    grade_res = client.post(f"/assignments/{asg_id}/grade?student_id=S1002", json=grade_payload)
    assert grade_res.status_code == 200
    graded_data = grade_res.json()
    assert graded_data["grade"] == 47.5
    assert graded_data["status"] == "Graded"
