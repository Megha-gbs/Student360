"""backend/app/routes/attendance.py

Attendance Management API routes.
Fixes Bug B: Attendance always reports six records submitted.
Provides:
- GET /attendance/class (retrieve class roster/saved attendance for section & subject)
- POST /attendance/submit (persist attendance and return exact dynamic record counts)
- GET /attendance/student/{student_id} (student attendance breakdown)
- GET /attendance/report (institutional attendance reports)
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from backend.app.core.security import (
    AuthenticatedUser,
    get_current_user,
    verify_student_access,
)
from backend.app.schemas_college import (
    AttendanceReportItem,
    BulkAttendanceSubmit,
    StudentAttendanceSummary,
)
from backend.app.services.college_service import college_service

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.get(
    "/class",
    response_model=List[Dict[str, Any]],
    summary="Get class section attendance sheet",
    description="Loads the student roster or saved attendance records for a specific class, subject, and date.",
)
def get_class_attendance_sheet(
    class_id: str = Query("CS-Sem2", description="Class section ID"),
    subject_code: str = Query("CS301", description="Subject course code"),
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """Retrieve roster/attendance sheet for marking."""
    return college_service.get_class_attendance_sheet(
        class_id=class_id,
        subject_code=subject_code,
        date=date,
    )


@router.post(
    "/submit",
    summary="Submit and persist class attendance records",
    description=(
        "Persists student attendance statuses for a lecture session. "
        "Strictly computes and returns exact dynamic counts (never a hardcoded count)."
    ),
)
def submit_attendance(
    payload: BulkAttendanceSubmit,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> Dict[str, Any]:
    """Submit class attendance and receive exact processed counts."""
    data = payload.model_dump()
    if current_user.user_id:
        data["faculty_id"] = current_user.user_id
    res = college_service.submit_attendance(data)
    return res


@router.get(
    "/student/{student_id}",
    response_model=StudentAttendanceSummary,
    summary="Get individual student attendance summary",
    description="Calculates overall and subject-wise attendance percentages for a student.",
)
def get_student_attendance(
    student_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> StudentAttendanceSummary:
    """Retrieve attendance record for a student."""
    verify_student_access(student_id=student_id, current_user=current_user)
    res = college_service.get_student_attendance(student_id)
    return StudentAttendanceSummary(**res)


@router.get(
    "/report",
    response_model=List[AttendanceReportItem],
    summary="Get institution-wide attendance reports",
    description="Summarizes department and semester-wise attendance averages and low attendance counts.",
)
def get_attendance_reports(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> List[AttendanceReportItem]:
    """Retrieve administrative attendance reports."""
    reports = college_service.get_attendance_reports()
    return [AttendanceReportItem(**r) for r in reports]
