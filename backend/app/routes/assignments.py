"""backend/app/routes/assignments.py

Assignment Management and Grading API routes.
Fixes Bug A: Create Assignment opens a blank page / 404 handler.
Provides:
- GET /assignments (list assignments filtered by faculty, class, student)
- POST /assignments (create coursework assignment)
- POST /assignments/{assignment_id}/submit (submit student deliverable)
- POST /assignments/{assignment_id}/grade (grade and publish feedback)
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from backend.app.core.security import (
    AuthenticatedUser,
    get_current_user,
)
from backend.app.schemas_college import (
    AssignmentCreateRequest,
    AssignmentGradeRequest,
    AssignmentItem,
    AssignmentSubmission,
    AssignmentSubmitRequest,
)
from backend.app.services.college_service import college_service

router = APIRouter(prefix="/assignments", tags=["Assignments"])


@router.get(
    "",
    response_model=List[AssignmentItem],
    summary="List assignments",
    description="Retrieve published assignments filtered by faculty, class section, or enrolled student.",
)
def list_assignments(
    faculty_id: Optional[str] = Query(None, description="Filter by faculty ID"),
    class_id: Optional[str] = Query(None, description="Filter by class section ID"),
    student_id: Optional[str] = Query(None, description="Filter by student ID"),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> List[AssignmentItem]:
    """List assignments with authorization and optional filter parameters."""
    return college_service.list_assignments(
        faculty_id=faculty_id,
        class_id=class_id,
        student_id=student_id or (current_user.user_id if current_user.role == "student" else None),
    )


@router.post(
    "",
    response_model=AssignmentItem,
    status_code=status.HTTP_201_CREATED,
    summary="Create course assignment",
    description="Create a new coursework assignment with required parameters and due dates.",
)
def create_assignment(
    payload: AssignmentCreateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> AssignmentItem:
    """Create a new course assignment."""
    data = payload.model_dump()
    if current_user.user_id:
        data["faculty_id"] = current_user.user_id
    created = college_service.create_assignment(data)
    return AssignmentItem(**created)


@router.post(
    "/{assignment_id}/submit",
    response_model=AssignmentSubmission,
    summary="Submit student assignment deliverable",
    description="Submit an assignment project file, code archive, or answer write-up.",
)
def submit_assignment(
    assignment_id: str,
    payload: AssignmentSubmitRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> AssignmentSubmission:
    """Submit assignment work for a student."""
    sub_data = payload.model_dump()
    if current_user.role == "student":
        sub_data["student_id"] = current_user.user_id
    try:
        res = college_service.submit_assignment(assignment_id, sub_data)
        return AssignmentSubmission(**res)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post(
    "/{assignment_id}/grade",
    response_model=AssignmentSubmission,
    summary="Grade assignment submission",
    description="Faculty publishes rubric score evaluation and constructive feedback.",
)
def grade_assignment(
    assignment_id: str,
    payload: AssignmentGradeRequest,
    student_id: str = Query(..., description="Student ID being graded"),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> AssignmentSubmission:
    """Grade an assignment deliverable."""
    try:
        res = college_service.grade_assignment(
            assignment_id=assignment_id,
            student_id=student_id,
            grade=payload.grade,
            feedback=payload.feedback,
        )
        return AssignmentSubmission(**res)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
