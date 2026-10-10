import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_cors_preflight_for_vercel_origin():
    """Verify CORS preflight OPTIONS request returns 200 with proper headers for Vercel origin."""
    response = client.options(
        "/auth/login",
        headers={
            "Origin": "https://student360-plum.vercel.app",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://student360-plum.vercel.app"
    assert "POST" in response.headers.get("access-control-allow-methods", "")

def test_admin_login_success():
    """Test Admin login with username and email."""
    # Username
    res = client.post("/auth/login", json={"username": "admin", "password": "password123"})
    assert res.status_code == 200
    data = res.json()
    assert data["token"] == "admin:ADM001"
    assert data["user"]["role"] == "admin"
    assert data["user"]["id"] == "ADM001"

    # Email alias + alternative password
    res2 = client.post("/auth/login", json={"username": "admin@smartcampus.edu", "password": "admin123"})
    assert res2.status_code == 200
    assert res2.json()["user"]["role"] == "admin"

def test_faculty_login_success():
    """Test Faculty login with username and email."""
    res = client.post("/auth/login", json={"username": "faculty", "password": "password123"})
    assert res.status_code == 200
    data = res.json()
    assert data["token"] == "faculty:FAC-CS101"
    assert data["user"]["role"] == "faculty"
    assert data["user"]["id"] == "FAC-CS101"
    assert len(data["user"]["assigned_students"]) == 10

    res2 = client.post("/auth/login", json={"username": "faculty@smartcampus.edu", "password": "faculty123"})
    assert res2.status_code == 200
    assert res2.json()["user"]["role"] == "faculty"

def test_student_login_success():
    """Test Student login with username and email."""
    res = client.post("/auth/login", json={"username": "student", "password": "password123"})
    assert res.status_code == 200
    data = res.json()
    assert data["token"] == "student:S1001"
    assert data["user"]["role"] == "student"
    assert data["user"]["id"] == "S1001"

    res2 = client.post("/auth/login", json={"username": "student@smartcampus.edu", "password": "student123"})
    assert res2.status_code == 200
    assert res2.json()["user"]["role"] == "student"

def test_login_field_flexibility():
    """Verify endpoint accepts both identifier and username keys."""
    res = client.post("/auth/login", json={"identifier": "admin", "password": "password123"})
    assert res.status_code == 200
    assert res.json()["user"]["role"] == "admin"

def test_login_empty_body_validation():
    """Verify empty or missing fields return 400 Bad Request."""
    res = client.post("/auth/login", json={})
    assert res.status_code == 400
    assert res.json()["detail"] == "Username and password are required."

    res2 = client.post("/auth/login", json={"username": "admin"})
    assert res2.status_code == 400
    assert res2.json()["detail"] == "Username and password are required."

def test_login_invalid_credentials():
    """Verify wrong password returns 401 Unauthorized."""
    res = client.post("/auth/login", json={"username": "admin", "password": "wrongpassword"})
    assert res.status_code == 401
    assert "Invalid institutional ID" in res.json()["detail"]

def test_auth_me_tokens_for_all_roles():
    """Verify /auth/me identity verification for Admin, Faculty, and Student tokens."""
    roles_and_tokens = [
        ("admin:ADM001", "admin", "ADM001"),
        ("faculty:FAC-CS101", "faculty", "FAC-CS101"),
        ("student:S1001", "student", "S1001"),
    ]
    for token, expected_role, expected_id in roles_and_tokens:
        res = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        data = res.json()
        assert data["role"] == expected_role
        assert data["user_id"] == expected_id
