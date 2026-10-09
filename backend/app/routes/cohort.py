"""
Cohort insights routes for aggregate analytics and global SHAP drivers.
"""

from fastapi import APIRouter

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
)
def get_cohort_insights() -> CohortInsightsResponse:
    """Return live aggregate metrics and global SHAP drivers."""
    data = cohort_service.get_cohort_insights()
    return CohortInsightsResponse(**data)
