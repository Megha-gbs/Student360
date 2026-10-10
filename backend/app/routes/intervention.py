"""backend/app/routes/intervention.py

Intervention and simulated outcome routes.
Supports both POST /intervention and POST /intervene with human-in-the-loop review.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status

from backend.app.core.security import (
    AuthenticatedUser,
    UserRole,
    get_current_user,
    verify_student_access,
)
from backend.app.schemas import (
    InterventionRequest,
    InterventionResponse,
    SimulatedOutcomeResponse,
)
from backend.app.services.intervention_service import intervention_service
from backend.app.services.student_service import student_service

router = APIRouter(tags=["Interventions"])


@router.post(
    "/intervention",
    response_model=InterventionResponse,
    summary="Draft or approve student intervention strategy",
    description="Drafts recommended intervention strategies tailored to real risk factors and captures human approval.",
)
@router.post(
    "/intervene",
    response_model=InterventionResponse,
    summary="Alias for /intervention",
    description="Maintains backward compatibility with /intervene.",
)
def create_intervention(
    request: InterventionRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> InterventionResponse:
    """Execute intervention workflow with human-in-the-loop governance."""
    if current_user.role == UserRole.STUDENT and request.student_id and request.student_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Students cannot draft or modify interventions for other students.",
        )
    result = intervention_service.process_intervention(
        student_id=request.student_id,
        intervention_type=request.intervention_type,
        parameters=request.parameters,
        approved=request.approved,
        notes=request.notes,
    )
    return InterventionResponse(**result)


@router.post(
    "/students/{student_id}/simulate-outcome",
    response_model=SimulatedOutcomeResponse,
    summary="Simulate follow-up outcome of student intervention",
    description=(
        "Simulates impact of an intervention on student risk trajectory. "
        "Explicitly labelled with SIMULATED DEMONSTRATION OUTCOME badge."
    ),
    responses={
        403: {"description": "Access denied for unauthorized student or faculty"},
        404: {
            "description": "Student not found",
            "content": {"application/json": {"example": {"detail": "Student S9999 not found"}}},
        },
    },
)
def simulate_student_intervention_outcome(
    student_id: str,
    request: Optional[InterventionRequest] = None,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> SimulatedOutcomeResponse:
    """Simulate intervention outcome for a specific student."""
    student = student_service.get_student_by_id(student_id)
    if student is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student {student_id} not found",
        )
    verify_student_access(student_id=student_id, current_user=current_user)

    features = student.get("features", {})
    interv_params = request.model_dump() if request else None

    result = intervention_service.simulate_outcome(
        student_id=student_id,
        student_features=features,
        intervention_data=interv_params,
    )
    return SimulatedOutcomeResponse(**result)
