"""
Intervention and simulated outcome routes.
Provides structured contracts ready for future causal intervention engine integration.
"""

from fastapi import APIRouter, HTTPException, status

from backend.app.schemas import (
    InterventionRequest,
    InterventionResponse,
    SimulatedOutcomeResponse,
)
from backend.app.services.intervention_service import intervention_service
from backend.app.services.student_service import student_service

router = APIRouter(tags=["Interventions"])


@router.post(
    "/intervene",
    response_model=InterventionResponse,
    summary="Trigger student intervention strategy (Integration Placeholder)",
    description=(
        "Pre-structured endpoint for causal intervention execution. "
        "Returns explicit 'not_integrated' status until teammate intervention module is connected."
    ),
)
def create_intervention(request: InterventionRequest) -> InterventionResponse:
    """Execute intervention workflow."""
    result = intervention_service.process_intervention(
        student_id=request.student_id,
        intervention_type=request.intervention_type,
        parameters=request.parameters,
    )
    return InterventionResponse(**result)


@router.post(
    "/students/{student_id}/simulate-outcome",
    response_model=SimulatedOutcomeResponse,
    summary="Simulate causal outcome of student intervention (Integration Placeholder)",
    description=(
        "Simulates impact of an intervention on student risk trajectory. "
        "Validates student existence, and returns explicit 'not_integrated' status without fabricating numbers."
    ),
    responses={
        404: {
            "description": "Student not found",
            "content": {"application/json": {"example": {"detail": "Student S9999 not found"}}},
        }
    },
)
def simulate_student_intervention_outcome(
    student_id: str,
    request: InterventionRequest = None,
) -> SimulatedOutcomeResponse:
    """Simulate intervention outcome for a specific student."""
    # Validate student existence
    student = student_service.get_student_by_id(student_id)
    if student is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student {student_id} not found",
        )

    features = student.get("features", {})
    interv_params = request.model_dump() if request else None

    result = intervention_service.simulate_outcome(
        student_id=student_id,
        student_features=features,
        intervention_data=interv_params,
    )
    return SimulatedOutcomeResponse(**result)
