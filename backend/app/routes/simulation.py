"""backend/app/routes/simulation.py

Simulation routes for What-If scenario predictions.
Validates modified feature inputs strictly against the frozen 36 UCI features schema.
Supports both POST /simulate and POST /students/{student_id}/what-if.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status

from backend.app.core.security import (
    AuthenticatedUser,
    get_current_user,
    verify_student_access,
)
from backend.app.schemas import SimulationRequest, SimulationResponse
from backend.app.services.model_service import model_service
from backend.app.services.student_service import student_service

router = APIRouter(tags=["Simulation"])


def _execute_simulation(
    features_input: Optional[dict],
    changes_input: Optional[dict],
    target_student_id: str,
) -> SimulationResponse:
    """Core logic to evaluate model counterfactuals."""
    original_risk: Optional[int] = None

    # Retrieve base features if student exists
    base_student = student_service.get_student_by_id(target_student_id)
    if base_student is not None:
        base_features = dict(base_student.get("features", {}))
        try:
            base_pred = model_service.predict(features=base_features, student_id=target_student_id)
            original_risk = base_pred["risk_score"]
        except Exception:
            original_risk = None
    else:
        base_features = {}

    # Determine final simulation features
    if changes_input:
        if not base_features:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot apply changes: student '{target_student_id}' features not found.",
            )
        sim_features = dict(base_features)
        sim_features.update(changes_input)
    elif features_input:
        sim_features = dict(features_input)
        if original_risk is None and base_features:
            try:
                base_pred = model_service.predict(features=base_features, student_id=target_student_id)
                original_risk = base_pred["risk_score"]
            except Exception:
                pass
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either 'features' or 'changes' must be provided in simulation request.",
        )

    # Validate against frozen 36 UCI features schema
    try:
        model_service.validate_features(sim_features)
    except (ValueError, TypeError) as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        )

    # Predict dynamically with model
    try:
        pred = model_service.predict(features=sim_features, student_id=target_student_id)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error during simulation: {exc}",
        )

    simulated_risk = pred["risk_score"]
    if original_risk is None:
        original_risk = simulated_risk

    return SimulationResponse(
        simulation=True,
        student_id=target_student_id,
        original_risk=original_risk,
        simulated_risk=simulated_risk,
        risk_score=simulated_risk,
        risk_level=pred["risk_level"],
        dropout_probability=pred["dropout_probability"],
        model_version=pred["model_version"],
        simulation_type="model_based_counterfactual",
        note=(
            "Model-based simulation using modified feature inputs; "
            "does not represent a causal intervention or guaranteed outcome."
        ),
    )


@router.post(
    "/simulate",
    response_model=SimulationResponse,
    summary="Simulate risk outcome with modified feature inputs (What-If analysis)",
    description=(
        "Evaluates the model prediction for a hypothetical or modified student feature profile. "
        "Strictly validated against the 36 real UCI features schema. "
        "Does not claim causal guarantees or invent intervention effects."
    ),
)
def simulate_outcome(request: SimulationRequest) -> SimulationResponse:
    """Run model-based what-if prediction on modified features."""
    target_student_id = request.student_id or "SIMULATED_STUDENT"
    return _execute_simulation(
        features_input=request.features,
        changes_input=request.changes,
        target_student_id=target_student_id,
    )


@router.post(
    "/students/{student_id}/what-if",
    response_model=SimulationResponse,
    summary="What-If Counterfactual Simulation for a specific student",
    description="Applies counterfactual feature modifications to a specific student and recalculates risk.",
    responses={
        403: {"description": "Access denied for unauthorized student"},
        404: {"description": "Student not found"},
    },
)
def simulate_student_what_if(
    student_id: str,
    request: SimulationRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> SimulationResponse:
    """Run model-based what-if simulation for a specified student."""
    verify_student_access(student_id=student_id, current_user=current_user)
    return _execute_simulation(
        features_input=request.features,
        changes_input=request.changes,
        target_student_id=student_id,
    )
