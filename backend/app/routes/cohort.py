from fastapi import APIRouter, Depends, HTTPException, status

from backend.app.core.security import AuthenticatedUser, UserRole, get_current_user
from backend.app.schemas import CohortInsightsResponse
from backend.app.services.cohort_service import cohort_service

router = APIRouter(tags=["Cohort Analytics"])


@router.get(
    "/cohort/insights",
    response_model=CohortInsightsResponse,
    summary="Get cohort-wide aggregate risk insights and global SHAP feature importance",
    description=(
        "Calculates real aggregate distributions (High, Medium, Low risk counts) "
        "and cohort-wide mean absolute SHAP feature importances across all verified demo students."
    ),
    responses={
        403: {
            "description": "Access denied for students",
            "content": {"application/json": {"example": {"detail": "Access denied."}}},
        }
    },
)
def get_cohort_insights(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> CohortInsightsResponse:
    """Return live aggregate metrics and global SHAP drivers."""
    if current_user.role == UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Students are strictly prohibited from viewing institutional cohort insights.",
        )
    data = cohort_service.get_cohort_insights()
    return CohortInsightsResponse(**data)
