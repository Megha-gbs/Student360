"""backend/app/routes/scoring.py

Scoring routes for Student Success Score and Placement Readiness.
Exposes dedicated endpoints for rules-based holistic multi-dimensional evaluations.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from backend.app.core.security import (
    AuthenticatedUser,
    get_current_user,
    verify_student_access,
)
from backend.app.schemas import (
    PlacementReadinessRequest,
    PlacementReadinessResponse,
    SuccessScoreRequest,
    SuccessScoreResponse,
)
from backend.app.services.scoring_service import scoring_service
from backend.app.services.student_service import student_service

router = APIRouter(tags=["Scoring"])


@router.post(
    "/scoring/placement-readiness",
    response_model=PlacementReadinessResponse,
    summary="Calculate Placement Readiness Score",
    description="Rules-based scoring evaluating aptitude, coding proficiency, mock interviews, and technical skills.",
)
def calculate_placement_readiness(
    request: PlacementReadinessRequest,
) -> PlacementReadinessResponse:
    """Calculates placement readiness with dynamic weight renormalization."""
    result = scoring_service.calculate_placement(
        student_id=request.student_id,
        aptitude=request.aptitude,
        coding=request.coding,
        mock_interviews=request.mock_interviews,
        technical_skills=request.technical_skills,
        weights=request.weights,
    )
    return PlacementReadinessResponse(**result)


@router.post(
    "/scoring/success-score",
    response_model=SuccessScoreResponse,
    summary="Calculate Multi-Dimensional Student Success Score",
    description=(
        "Holistic student success scoring combining academic standing, attendance, "
        "LMS activity, campus engagement, and placement readiness."
    ),
)
def calculate_success_score(
    request: SuccessScoreRequest,
) -> SuccessScoreResponse:
    """Calculates student success score with minimum weight threshold validation."""
    result = scoring_service.calculate_success(
        student_id=request.student_id,
        academic=request.academic,
        attendance=request.attendance,
        lms=request.lms,
        engagement=request.engagement,
        placement_readiness=request.placement_readiness,
        weights=request.weights,
    )
    return SuccessScoreResponse(**result)


@router.get(
    "/students/{student_id}/success-score",
    response_model=SuccessScoreResponse,
    summary="Get holistic success score for a specific student",
    description="Derives academic score directly from genuine student UCI features and computes holistic standing.",
    responses={
        403: {"description": "Access denied for unauthorized student or faculty"},
        404: {"description": "Student not found"},
    },
)
def get_student_success_score(
    student_id: str,
    attendance: Optional[float] = Query(None, ge=0.0, le=100.0, description="Optional attendance percentage"),
    lms: Optional[float] = Query(None, ge=0.0, le=100.0, description="Optional LMS platform score"),
    engagement: Optional[float] = Query(None, ge=0.0, le=100.0, description="Optional engagement score"),
    placement_readiness: Optional[float] = Query(None, ge=0.0, le=100.0, description="Optional placement readiness"),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> SuccessScoreResponse:
    """Derives success score for an enrolled student."""
    student = student_service.get_student_by_id(student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student '{student_id}' not found",
        )
    verify_student_access(student_id=student_id, current_user=current_user)
    result = scoring_service.get_student_success_score(
        student_id=student_id,
        attendance=attendance,
        lms=lms,
        engagement=engagement,
        placement_readiness=placement_readiness,
    )
    return SuccessScoreResponse(**result)


@router.get(
    "/students/{student_id}/placement-readiness",
    response_model=PlacementReadinessResponse,
    summary="Get placement readiness for a specific student",
    description="Computes placement readiness profile for a specific student.",
    responses={
        403: {"description": "Access denied for unauthorized student or faculty"},
        404: {"description": "Student not found"},
    },
)
def get_student_placement_readiness(
    student_id: str,
    aptitude: Optional[float] = Query(None, ge=0.0, le=100.0),
    coding: Optional[float] = Query(None, ge=0.0, le=100.0),
    mock_interviews: Optional[float] = Query(None, ge=0.0, le=100.0),
    technical_skills: Optional[float] = Query(None, ge=0.0, le=100.0),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> PlacementReadinessResponse:
    """Computes placement readiness for an enrolled student."""
    student = student_service.get_student_by_id(student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student '{student_id}' not found",
        )
    verify_student_access(student_id=student_id, current_user=current_user)
    result = scoring_service.get_student_placement_readiness(
        student_id=student_id,
        aptitude=aptitude,
        coding=coding,
        mock_interviews=mock_interviews,
        technical_skills=technical_skills,
    )
    return PlacementReadinessResponse(**result)
