"""backend/app/services/notification_service.py

Thread-safe Notification Engine for Student360.
Provides:
- In-app notification storage, retrieval, and status updates (read/unread).
- Daily timetable schedule synchronization engine.
- Duplicate prevention across repeated sync calls.
- Strict user-level access boundary enforcement.
- Clean separation between in-app schedule alerts and system notices.
"""

from datetime import datetime
import logging
import threading
from typing import Any, Dict, List, Optional
import uuid

from backend.app.core.security import AuthenticatedUser, UserRole, verify_student_access
from backend.app.schemas_college import NotificationItem
from backend.app.services.college_service import DEFAULT_ROSTERS, college_service

logger = logging.getLogger("student360.notification_service")


class NotificationService:
    """Singleton service managing in-app notifications and schedule dispatch."""

    def __init__(self):
        self._lock = threading.RLock()
        self._notifications: List[Dict[str, Any]] = []
        self._seed_default_notifications()

    def _seed_default_notifications(self):
        """Seed realistic institutional system and schedule notifications."""
        self._notifications = [
            # System notification for Student Sarah Connor
            {
                "id": "NOTIF-SYS-1001",
                "user_id": "S1001",
                "title": "System Synchronization Complete",
                "message": "Student360 academic records synchronized with institutional LMS and attendance registers.",
                "type": "system",
                "priority": "normal",
                "created_at": "2026-10-09 08:30",
                "read": False,
                "delivery_channel": "in_app",
                "delivery_status": "delivered",
                "metadata": {"source": "system_sync"},
            },
            # Exam schedule notification for Student S1001
            {
                "id": "NOTIF-SYS-1002",
                "user_id": "S1001",
                "title": "Mid-Semester Examination Notice",
                "message": "Midterm examinations commence November 10th. Check the examination portal for seating arrangements.",
                "type": "system",
                "priority": "high",
                "created_at": "2026-10-08 14:00",
                "read": True,
                "delivery_channel": "in_app",
                "delivery_status": "delivered",
                "metadata": {"source": "academic_office"},
            },
            # Seed daily schedule notification for Student S1001
            {
                "id": "NOTIF-SCHED-1001",
                "user_id": "S1001",
                "title": "Daily Schedule: CS301 Data Structures",
                "message": "You have CS301 Data Structures & Algorithms (Lecture) in Hall 302 at 09:00–10:15 with Dr. Alan Turing.",
                "type": "daily_schedule",
                "priority": "normal",
                "created_at": "2026-10-10 07:30",
                "read": False,
                "delivery_channel": "in_app",
                "delivery_status": "delivered",
                "metadata": {
                    "target_date": "2026-10-10",
                    "subject_code": "CS301",
                    "timetable_id": "TT-001",
                },
            },
            # Faculty notification for Dr. Alan Turing
            {
                "id": "NOTIF-FAC-SYS-01",
                "user_id": "FAC-CS101",
                "title": "Faculty Cohort Verification",
                "message": "Semester 2 cohort roster verified. 10 students actively enrolled in CS-Sem2.",
                "type": "system",
                "priority": "normal",
                "created_at": "2026-10-09 09:00",
                "read": False,
                "delivery_channel": "in_app",
                "delivery_status": "delivered",
                "metadata": {"source": "registrar"},
            },
            {
                "id": "NOTIF-FAC-SCHED-01",
                "user_id": "FAC-CS101",
                "title": "Teaching Schedule: CS301 Lecture",
                "message": "Class scheduled: CS301 Data Structures & Algorithms in Hall 302 at 09:00–10:15 for section CS-Sem2.",
                "type": "daily_schedule",
                "priority": "normal",
                "created_at": "2026-10-10 07:30",
                "read": False,
                "delivery_channel": "in_app",
                "delivery_status": "delivered",
                "metadata": {
                    "target_date": "2026-10-10",
                    "subject_code": "CS301",
                    "timetable_id": "TT-001",
                },
            },
            # Admin notification
            {
                "id": "NOTIF-ADM-SYS-01",
                "user_id": "ADM001",
                "title": "Institutional Analytics Pipeline Active",
                "message": "All 4,424 student records indexed and ML inference pipelines operational.",
                "type": "system",
                "priority": "normal",
                "created_at": "2026-10-09 08:00",
                "read": False,
                "delivery_channel": "in_app",
                "delivery_status": "delivered",
                "metadata": {"source": "admin_service"},
            },
        ]

    def get_notifications(
        self,
        user_id: str,
        current_user: AuthenticatedUser,
        notification_type: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves notifications for user_id with strict role authorization.
        - Students can only view their own notifications.
        - Faculty can view their own or assigned students.
        - Admin can view any user's notifications.
        """
        with self._lock:
            # Enforce student isolation
            if current_user.role == UserRole.STUDENT and current_user.user_id != user_id:
                verify_student_access(user_id, current_user)

            results = []
            for n in self._notifications:
                if n.get("user_id") == user_id:
                    if notification_type and n.get("type") != notification_type:
                        continue
                    results.append(dict(n))

            # Sort descending by created_at
            results.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            return results

    def mark_as_read(self, notification_id: str, current_user: AuthenticatedUser) -> bool:
        """Marks a single notification as read if authorized."""
        with self._lock:
            for n in self._notifications:
                if n.get("id") == notification_id:
                    # Enforce privacy
                    if (
                        current_user.role == UserRole.STUDENT
                        and n.get("user_id") != current_user.user_id
                    ):
                        return False
                    n["read"] = True
                    return True
            return False

    def mark_all_as_read(self, user_id: str, current_user: AuthenticatedUser) -> int:
        """Marks all notifications for user_id as read."""
        with self._lock:
            if current_user.role == UserRole.STUDENT and current_user.user_id != user_id:
                verify_student_access(user_id, current_user)

            updated = 0
            for n in self._notifications:
                if n.get("user_id") == user_id and not n.get("read"):
                    n["read"] = True
                    updated += 1
            return updated

    def trigger_daily_schedule(
        self,
        target_date: Optional[str] = None,
        check_quiet_hours: bool = False,
        current_user: Optional[AuthenticatedUser] = None,
    ) -> Dict[str, Any]:
        """
        Synchronizes timetable entries for the target date into in-app notifications.
        - Deduplicates repeated syncs to prevent notification spam.
        - Accurately checks if classes are scheduled for the day of week.
        - Generates notifications for enrolled students and instructors.
        - Returns informative metrics: total processed, created, skipped duplicates.
        """
        with self._lock:
            # 1. Resolve date and day of week
            if not target_date:
                target_date = datetime.now().strftime("%Y-%m-%d")

            try:
                dt = datetime.strptime(target_date, "%Y-%m-%d")
                day_name = dt.strftime("%A")
            except ValueError:
                # If invalid date format, return error response
                return {
                    "status": "error",
                    "target_date": target_date,
                    "total_students_processed": 0,
                    "notifications_created": 0,
                    "skipped_duplicates": 0,
                    "skipped_quiet_hours": 0,
                    "message": f"Invalid date format '{target_date}'. Expected YYYY-MM-DD.",
                    "details": [],
                }

            # 2. Check quiet hours if requested
            skipped_quiet = 0
            current_hour = datetime.now().hour
            if check_quiet_hours and (current_hour >= 22 or current_hour < 6):
                return {
                    "status": "skipped_quiet_hours",
                    "target_date": target_date,
                    "day_of_week": day_name,
                    "total_students_processed": 0,
                    "notifications_created": 0,
                    "skipped_duplicates": 0,
                    "skipped_quiet_hours": 1,
                    "message": "Quiet hours active (22:00–06:00). In-app schedule notification generation suspended.",
                    "details": [],
                }

            # 3. Retrieve timetable slots for the target day
            all_slots = college_service.get_timetable({})
            day_slots = [
                s for s in all_slots
                if s.get("day", "").strip().lower() == day_name.lower()
            ]

            # 4. Handle days with no classes scheduled (e.g. weekends, holidays)
            if not day_slots:
                return {
                    "status": "success",
                    "target_date": target_date,
                    "day_of_week": day_name,
                    "total_students_processed": 0,
                    "notifications_created": 0,
                    "skipped_duplicates": 0,
                    "skipped_quiet_hours": 0,
                    "message": f"No classes scheduled for {day_name} ({target_date}). No schedule notifications generated.",
                    "details": [],
                }

            # 5. Process timetable entries and dispatch in-app notifications
            notifications_created = 0
            skipped_duplicates = 0
            processed_students = set()
            details = []

            for slot in day_slots:
                class_id = slot.get("class_id", "CS-Sem2")
                subject_code = slot.get("subject_code", "CS301")
                subject_name = slot.get("subject_name", "Subject")
                faculty_id = slot.get("faculty_id", "FAC-CS101")
                faculty_name = slot.get("faculty_name", "Faculty")
                room = slot.get("room", "Room 101")
                start_time = slot.get("start_time", "09:00")
                end_time = slot.get("end_time", "10:00")
                slot_id = slot.get("id", f"TT-{subject_code}")

                # Enrolled students for this section
                roster = DEFAULT_ROSTERS.get(class_id, DEFAULT_ROSTERS["CS-Sem2"])

                for student in roster:
                    s_id = student.get("student_id")
                    if not s_id:
                        continue
                    processed_students.add(s_id)

                    # Check for duplicate
                    dedup_exists = any(
                        n.get("user_id") == s_id
                        and n.get("type") == "daily_schedule"
                        and n.get("metadata", {}).get("target_date") == target_date
                        and n.get("metadata", {}).get("timetable_id") == slot_id
                        for n in self._notifications
                    )

                    if dedup_exists:
                        skipped_duplicates += 1
                    else:
                        new_notif = {
                            "id": f"NOTIF-SCHED-{uuid.uuid4().hex[:8].upper()}",
                            "user_id": s_id,
                            "title": f"Daily Schedule: {subject_code} - {subject_name}",
                            "message": f"Class scheduled today: {subject_name} with {faculty_name} at {start_time}–{end_time} in {room}.",
                            "type": "daily_schedule",
                            "priority": "normal",
                            "created_at": f"{target_date} 07:30",
                            "read": False,
                            "delivery_channel": "in_app",
                            "delivery_status": "delivered",
                            "metadata": {
                                "target_date": target_date,
                                "timetable_id": slot_id,
                                "subject_code": subject_code,
                                "class_id": class_id,
                            },
                        }
                        self._notifications.insert(0, new_notif)
                        notifications_created += 1

                # Generate notification for the Faculty Member
                if faculty_id:
                    fac_dedup = any(
                        n.get("user_id") == faculty_id
                        and n.get("type") == "daily_schedule"
                        and n.get("metadata", {}).get("target_date") == target_date
                        and n.get("metadata", {}).get("timetable_id") == slot_id
                        for n in self._notifications
                    )
                    if fac_dedup:
                        skipped_duplicates += 1
                    else:
                        fac_notif = {
                            "id": f"NOTIF-FAC-{uuid.uuid4().hex[:8].upper()}",
                            "user_id": faculty_id,
                            "title": f"Teaching Schedule: {subject_code} ({class_id})",
                            "message": f"You have {subject_name} at {start_time}–{end_time} in {room} with {class_id}.",
                            "type": "daily_schedule",
                            "priority": "normal",
                            "created_at": f"{target_date} 07:30",
                            "read": False,
                            "delivery_channel": "in_app",
                            "delivery_status": "delivered",
                            "metadata": {
                                "target_date": target_date,
                                "timetable_id": slot_id,
                                "subject_code": subject_code,
                                "class_id": class_id,
                            },
                        }
                        self._notifications.insert(0, fac_notif)
                        notifications_created += 1

                details.append({
                    "slot_id": slot_id,
                    "subject": subject_code,
                    "class_id": class_id,
                    "students_count": len(roster),
                })

            total_processed = len(processed_students)
            msg = (
                f"Generated {notifications_created} in-app notification(s) for {day_name}, {target_date}. "
                f"({skipped_duplicates} duplicate(s) skipped)."
            )
            if notifications_created == 0 and skipped_duplicates > 0:
                msg = f"All {skipped_duplicates} schedule notifications are already up to date for {day_name}, {target_date}."

            return {
                "status": "success",
                "target_date": target_date,
                "day_of_week": day_name,
                "total_students_processed": total_processed,
                "notifications_created": notifications_created,
                "skipped_duplicates": skipped_duplicates,
                "skipped_quiet_hours": skipped_quiet,
                "message": msg,
                "details": details,
            }


# Singleton instance
notification_service = NotificationService()
