"""
Student routes for querying student cohort list and detailed profiles.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, status

from backend.app.schemas import (
    PredictionResult,
    StudentListItem,
    StudentListResponse,
    StudentResponse,
    TrajectoryData,
)
from backend.app.services.model_service import model_service
from backend.app.services.shap_service import shap_service
from backend.app.services.student_service import student_service
from backend.app.services.trajectory_service import trajectory_service

router = APIRouter(tags=["Students"])


@router.get(
    "/students",
    response_model=StudentListResponse,
    summary="List all students with dynamic risk predictions",
    description="Loads verified demo students, runs real inference through XGBoost model, and calculates trend and priority.",
)
def list_students() -> StudentListResponse:
    """Fetch all students with dynamic model predictions."""
    raw_students = student_service.get_all_students()
    items = []

    for raw in raw_students:
        sid = str(raw.get("demo_id") or raw.get("student_id", "UNKNOWN"))
        features = raw.get("features", {})

        # Predict dynamically
        pred = model_service.predict(features=features, student_id=sid)
        risk_score = pred["risk_score"]
        risk_level = pred["risk_level"]
        dropout_prob = pred["dropout_probability"]
        model_version = pred["model_version"]

        # Trajectory trend calculation via Smruthi's trajectory engine
        trend = trajectory_service.get_trend(features, risk_score_sem2=risk_score)

        # Operational priority: High risk -> High, Medium -> Medium, Low -> Low
        priority = risk_level

        items.append(
            StudentListItem(
                student_id=sid,
                risk_score=risk_score,
                risk_level=risk_level,
                dropout_probability=dropout_prob,
                model_version=model_version,
                trend=trend,
                priority=priority,
            )
        )

    return StudentListResponse(total=len(items), students=items)


@router.get(
    "/students/{student_id}",
    response_model=StudentResponse,
    summary="Get individual student risk details, SHAP reasons, and trajectory",
    description="Retrieves a verified student by ID, evaluates live ML model risk, and attaches explainability and trajectory data.",
    responses={
        404: {
            "description": "Student not found",
            "content": {"application/json": {"example": {"detail": "Student S9999 not found"}}},
        }
    },
)
def get_student(student_id: str) -> StudentResponse:
    """Fetch individual student profile with dynamic predictions, SHAP, and trajectory."""
    raw = student_service.get_student_by_id(student_id)
    if raw is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student {student_id} not found",
        )

    sid = str(raw.get("demo_id") or raw.get("student_id", student_id))
    features = raw.get("features", {})
    row_index = raw.get("dataset_row_index")
    actual_outcome = raw.get("actual_outcome_reference")

    # Live model prediction
    pred_data = model_service.predict(features=features, student_id=sid)
    prediction = PredictionResult(
        student_id=pred_data["student_id"],
        risk_score=pred_data["risk_score"],
        risk_level=pred_data["risk_level"],
        dropout_probability=pred_data["dropout_probability"],
        model_version=pred_data["model_version"],
    )

    # Explainability: Top SHAP reasons from Smruthi's engine
    top_reasons = shap_service.explain_student(student_features=features, top_k=5)

    # Trajectory: Real Sem1 -> Sem2 journey from Smruthi's engine
    trajectory_raw = trajectory_service.get_trajectory(
        student_features=features,
        risk_score_sem2=prediction.risk_score,
    )
    trajectory_data: Optional[TrajectoryData] = None
    if trajectory_raw is not None:
        trajectory_data = TrajectoryData(**trajectory_raw)

    # Trend calculation
    trend = trajectory_service.get_trend(trajectory_raw or features, risk_score_sem2=prediction.risk_score)

    return StudentResponse(
        student_id=sid,
        dataset_row_index=row_index,
        features=features,
        prediction=prediction,
        actual_outcome_reference=actual_outcome,
        trend=trend,
        top_reasons=top_reasons,
        trajectory_data=trajectory_data,
    )
