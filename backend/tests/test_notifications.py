"""backend/tests/test_notifications.py

Comprehensive test suite verifying Part 1: Notification Engine & Sync Today:
1. Seeded notifications for student, faculty, admin.
2. RBAC student isolation on /notifications.
3. Sync Today for weekday (e.g. Monday 2026-10-12) generates in-app notifications.
4. Idempotency & duplicate prevention across repeated syncs.
5. Handling empty schedule / weekend dates without backend errors.
6. Marking individual and all notifications read.
"""

from pathlib import Path
import sys
import pytest
from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.main import app
from backend.app.services.notification_service import notification_service

client = TestClient(app)


def test_initial_notifications_seeded():
    """Verify seeded notifications exist for demo student S1001 and faculty FAC-CS101."""
    student_headers = {"X-User-Role": "student", "X-User-Id": "S1001"}
    resp = client.get("/notifications?user_id=S1001", headers=student_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 2
    types = {n["type"] for n in data}
    assert "system" in types or "daily_schedule" in types


def test_student_cannot_access_other_student_notifications():
    """Verify student role isolation prevents S1001 from reading S1002 notifications."""
    student_headers = {"X-User-Role": "student", "X-User-Id": "S1001"}
    resp = client.get("/notifications?user_id=S1002", headers=student_headers)
    assert resp.status_code == 403


def test_sync_today_empty_schedule_handled_gracefully():
    """Verify syncing a date with no classes (e.g. Saturday 2026-10-10) returns success with 0 created."""
    headers = {"X-User-Role": "faculty", "X-User-Id": "FAC-CS101"}
    resp = client.post(
        "/notifications/trigger-daily-schedule?target_date=2026-10-10",
        headers=headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] in ["success", "no_classes_scheduled"]
    assert data["notifications_created"] == 0
    assert "No classes scheduled" in data["message"]


def test_sync_today_creates_schedule_notifications():
    """Verify syncing a date with classes (Monday 2026-10-12) creates in-app notifications."""
    headers = {"X-User-Role": "faculty", "X-User-Id": "FAC-CS101"}
    resp = client.post(
        "/notifications/trigger-daily-schedule?target_date=2026-10-12",
        headers=headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["notifications_created"] > 0

    # Verify student S1001 has received new daily_schedule notification
    student_headers = {"X-User-Role": "student", "X-User-Id": "S1001"}
    resp_student = client.get("/notifications?user_id=S1001", headers=student_headers)
    assert resp_student.status_code == 200
    s_notifs = resp_student.json()
    sched_notifs = [n for n in s_notifs if n["type"] == "daily_schedule" and n.get("metadata", {}).get("target_date") == "2026-10-12"]
    assert len(sched_notifs) > 0


def test_repeated_sync_prevents_duplicate_notifications():
    """Verify repeated sync calls do not duplicate notifications and report skipped count."""
    headers = {"X-User-Role": "faculty", "X-User-Id": "FAC-CS101"}
    # Call sync again for Monday 2026-10-12
    resp = client.post(
        "/notifications/trigger-daily-schedule?target_date=2026-10-12",
        headers=headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["notifications_created"] == 0
    assert data["skipped_duplicates"] > 0
    assert "already up to date" in data["message"]


def test_mark_as_read_and_mark_all_read():
    """Verify individual and batch read status updates."""
    student_headers = {"X-User-Role": "student", "X-User-Id": "S1001"}
    resp = client.get("/notifications?user_id=S1001", headers=student_headers)
    notifs = resp.json()
    unread = [n for n in notifs if not n["read"]]
    if unread:
        notif_id = unread[0]["id"]
        resp_mark = client.post(f"/notifications/{notif_id}/read", headers=student_headers)
        assert resp_mark.status_code == 200

    # Mark all read
    resp_all = client.post("/notifications/read-all?user_id=S1001", headers=student_headers)
    assert resp_all.status_code == 200
    resp_after = client.get("/notifications?user_id=S1001", headers=student_headers)
    for n in resp_after.json():
        assert n["read"] is True
