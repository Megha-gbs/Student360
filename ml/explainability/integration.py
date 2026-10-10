"""ml/explainability/integration.py

Seamless end-to-end integration helper for Student360 ML subsystem.
Combines:
1. Mohith's XGBoost ML Risk Prediction (ml.prediction.predict.predict_student)
2. Smruthi's Fixed SHAP Explainability Engine (ml.explainability.explainer.StudentSHAPExplainer)
3. Smruthi's Real Sem1 -> Sem2 Trajectory Generator (ml.trajectory.generator.Sem1Sem2TrajectoryGenerator)

Provides a single production-ready function returning the complete Student 360 payload
ready for the FastAPI backend (/students/{id}).
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from ml.prediction.predict import predict_student
from ml.explainability.explainer import StudentSHAPExplainer
from ml.trajectory.generator import (
    Sem1Sem2TrajectoryGenerator,
    calculate_student_trend,
)

logger = logging.getLogger("student360.ml.integration")

# Process-level singleton caches to ensure zero redundant reloading
_CACHED_EXPLAINER: Optional[StudentSHAPExplainer] = None
_CACHED_TRAJECTORY_GEN: Optional[Sem1Sem2TrajectoryGenerator] = None


def get_cached_explainer() -> StudentSHAPExplainer:
    """Retrieve or initialize the cached singleton StudentSHAPExplainer."""
    global _CACHED_EXPLAINER
    if _CACHED_EXPLAINER is None:
        _CACHED_EXPLAINER = StudentSHAPExplainer()
    return _CACHED_EXPLAINER


def get_cached_trajectory_generator() -> Sem1Sem2TrajectoryGenerator:
    """Retrieve or initialize the cached singleton Sem1Sem2TrajectoryGenerator."""
    global _CACHED_TRAJECTORY_GEN
    if _CACHED_TRAJECTORY_GEN is None:
        _CACHED_TRAJECTORY_GEN = Sem1Sem2TrajectoryGenerator()
    return _CACHED_TRAJECTORY_GEN


def predict_and_explain_student(
    features: Dict[str, Any],
    student_id: Optional[str] = None,
    top_k: int = 5,
) -> Dict[str, Any]:
    """Execute complete end-to-end inference for a single student.
    
    Parameters:
    - features: Dict containing original 36 UCI features.
    - student_id: Optional student identifier (extracted from features if omitted).
    - top_k: Number of SHAP risk contributors to return (3 to 5).
    
    Returns:
    Unified dict matching the frozen Student360 backend contract:
    {
      "student_id": "S1001",
      "risk_score": 74,
      "risk_level": "High",
      "dropout_probability": 0.7449,
      "model_version": "student360_xgb_v2_real_features",
      "trend": "Deteriorating",
      "top_reasons": [ ... ],
      "trajectory_data": {
        "trajectory_type": "real_sem1_to_sem2",
        "points": [ ... ],
        "note": "Based on actual 1st vs 2nd semester curricular units from the dataset"
      }
    }
    """
    # 1. ML Prediction (Mohith's XGBoost pipeline)
    prediction = predict_student(features=features, student_id=student_id)
    sid = prediction["student_id"]
    risk_score = prediction["risk_score"]
    risk_level = prediction["risk_level"]
    dropout_prob = prediction["dropout_probability"]
    model_version = prediction["model_version"]

    # 2. Fixed SHAP Explainability (Smruthi's engine with ColumnTransformer mapping)
    explainer = get_cached_explainer()
    shap_resp = explainer.explain_student(student_data=features, top_k=top_k)
    top_reasons = shap_resp.to_dict()["top_reasons"]

    # 3. Real Sem1 -> Sem2 Trajectory (Smruthi's trajectory generator)
    traj_gen = get_cached_trajectory_generator()
    traj_resp = traj_gen.generate_trajectory(
        student_data=features,
        risk_score_sem2=risk_score,
    )
    trajectory_data = traj_resp.to_dict()
    trend = calculate_student_trend(traj_resp)

    # 4. Combined frozen payload
    return {
        "student_id": sid,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "dropout_probability": dropout_prob,
        "model_version": model_version,
        "trend": trend,
        "top_reasons": top_reasons,
        "trajectory_data": trajectory_data,
    }


# Alias for backward compatibility
analyze_student_full = predict_and_explain_student
