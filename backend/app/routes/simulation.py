"""
Simulation route for What-If scenario predictions.
Validates modified feature inputs strictly against the frozen 36 UCI features schema.
"""

from fastapi import APIRouter, HTTPException, status

from backend.app.schemas import SimulationRequest, SimulationResponse
from backend.app.services.model_service import model_service

router = APIRouter(tags=["Simulation"])


@router.post(
    "/simulate",
    response_model=SimulationResponse,
    summary="Simulate risk outcome with modified feature inputs (What-If analysis)",
    description=(
        "Evaluates the model prediction for a hypothetical or modified student feature profile. "
        "Strictly validated against the 36 real UCI features schema. "
        "Does not claim causal guarantees or invent intervention effects."
    ),
    responses={
        400: {
            "description": "Invalid feature schema or prohibited features detected",
            "content": {"application/json": {"example": {"detail": "Missing 1 required feature(s): ['GDP']"}}},
        },
        422: {
            "description": "Validation error",
        },
    },
)
def simulate_outcome(request: SimulationRequest) -> SimulationResponse:
    """Run model-based what-if prediction on modified features."""
    features = request.features
    student_id = request.student_id or "SIMULATED_STUDENT"

    # Strict validation via existing ML pipeline validation
    try:
        model_service.validate_features(features)
    except (ValueError, TypeError) as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        )

    # Predict dynamically
    try:
        pred = model_service.predict(features=features, student_id=student_id)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error during simulation: {exc}",
        )

    return SimulationResponse(
        simulation=True,
        student_id=pred["student_id"],
        risk_score=pred["risk_score"],
        risk_level=pred["risk_level"],
        dropout_probability=pred["dropout_probability"],
        model_version=pred["model_version"],
        note=(
            "Model-based simulation using modified feature inputs; "
            "does not represent a causal intervention or guaranteed outcome."
        ),
    )
