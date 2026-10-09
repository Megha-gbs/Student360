"""ml/trajectory/generator.py

Production trajectory generator for Student360 academic risk monitoring.
Derives a real, 2-point Sem 1 -> Sem 2 trajectory from actual UCI curricular units.
Strictly adheres to Upgrade 2 of the Student360 Blueprint. Never invents weekly points.
Supports optional dual-model risk scoring (Sem 1-only model vs Full Sem 1+2 model).
"""

from __future__ import annotations

import logging
from typing import Any, Callable, Dict, List, Optional, Sequence, Union
import numpy as np

from ml.explainability.uci_schema import (
    UCI_ALL_FEATURES,
    UCI_SEM1_CURRICULAR_FEATURES,
    UCI_SEM1_ONLY_FEATURES,
    UCI_SEM2_CURRICULAR_FEATURES,
    normalize_feature_name,
)
from ml.trajectory.schemas import TrajectoryPoint, TrajectoryResponse

logger = logging.getLogger("student360.ml.trajectory")

FROZEN_NOTE: str = "Based on actual 1st vs 2nd semester curricular units from the dataset"


def _extract_numeric_value(
    record: Dict[str, Any],
    keys: Sequence[str],
    default: float = 0.0,
) -> float:
    """Safely extract a numeric value from record matching any candidate keys."""
    clean_map: Dict[str, Any] = {}
    for k, v in record.items():
        norm_k = normalize_feature_name(str(k))
        clean_map[norm_k] = v
        clean_map[norm_k.lower()] = v
        clean_map[norm_k.lower().replace(" ", "_")] = v

    for k in keys:
        norm_k = normalize_feature_name(k)
        for candidate in [norm_k, norm_k.lower(), norm_k.lower().replace(" ", "_")]:
            if candidate in clean_map:
                try:
                    val_f = float(clean_map[candidate])
                    if not np.isnan(val_f):
                        return val_f
                except (ValueError, TypeError):
                    continue
    return default


def _calculate_academic_risk_proxy(
    approved: float,
    enrolled: float,
    grade: float,
    baseline_risk: float = 50.0,
) -> int:
    """Calibrated academic risk proxy when ML model is unavailable.
    
    Academic risk is inversely proportional to unit completion rate and grades
    (Portuguese grading scale 0-20, passing grade >= 10.0).
    """
    completion_rate = approved / max(enrolled, 1.0) if enrolled > 0 else 0.5
    grade_factor = min(max(grade / 20.0, 0.0), 1.0)

    # Academic health index (0 to 1, 1 is best)
    health_index = (0.6 * completion_rate) + (0.4 * grade_factor)
    raw_risk = (1.0 - health_index) * 100.0

    # Smooth with baseline
    blended = 0.7 * raw_risk + 0.3 * baseline_risk
    return int(round(max(0, min(100, blended))))


def _load_model_if_path(model: Any) -> Any:
    """Load model artifact from file path if a string is provided."""
    if not isinstance(model, str):
        return model
    try:
        import joblib  # type: ignore
        return joblib.load(model)
    except Exception:
        try:
            import pickle
            with open(model, "rb") as f:
                return pickle.load(f)
        except Exception as exc:
            logger.warning("Could not load model from path %s: %s", model, exc)
            return model


class Sem1Sem2TrajectoryGenerator:
    """Generates real Sem 1 -> Sem 2 student risk journeys from UCI curricular units.
    
    Adheres strictly to Upgrade 2:
    - Exactly two milestones: Sem 1 and Sem 2.
    - True curricular unit data (approved units, grades, enrolled units).
    - Never uses fictional weekly points.
    - Supports dual-model evaluation (Sem1-only model alongside full model).
    """

    def __init__(
        self,
        model_full: Optional[Any] = None,
        model_sem1: Optional[Any] = None,
        feature_names_full: Optional[Sequence[str]] = None,
        feature_names_sem1: Optional[Sequence[str]] = None,
        dropout_class_idx: Optional[int] = None,
    ) -> None:
        """Initialize Trajectory Generator.
        
        Args:
            model_full: Full XGBoost model (or path to saved model) for all features.
            model_sem1: Optional XGBoost model (or path) trained on Sem 1-only features.
            feature_names_full: Ordered features for model_full.
            feature_names_sem1: Ordered features for model_sem1.
            dropout_class_idx: Target index representing Dropout (auto-detected if None).
        """
        self.model_full = _load_model_if_path(model_full)
        self.model_sem1 = _load_model_if_path(model_sem1)

        # Auto-detect Dropout class index
        if dropout_class_idx is not None:
            self.dropout_class_idx = dropout_class_idx
        else:
            self.dropout_class_idx = 0
            check_m = self.model_full if self.model_full is not None else self.model_sem1
            if check_m is not None and hasattr(check_m, "classes_"):
                try:
                    classes_list = [str(c).lower() for c in check_m.classes_]
                    if "dropout" in classes_list:
                        self.dropout_class_idx = classes_list.index("dropout")
                    elif len(classes_list) == 2 and 1 in list(check_m.classes_):
                        self.dropout_class_idx = 1
                except Exception:
                    self.dropout_class_idx = 0

        # Feature lists
        self.feature_names_full = (
            [normalize_feature_name(f) for f in feature_names_full]
            if feature_names_full
            else list(UCI_ALL_FEATURES)
        )
        self.feature_names_sem1 = (
            [normalize_feature_name(f) for f in feature_names_sem1]
            if feature_names_sem1
            else list(UCI_SEM1_ONLY_FEATURES)
        )

    def _predict_risk_from_model(
        self,
        model: Any,
        features_dict: Dict[str, Any],
        expected_features: Sequence[str],
    ) -> Optional[int]:
        """Query a model to predict dropout probability and return risk score (0-100)."""
        if model is None:
            return None

        try:
            clean_dict: Dict[str, Any] = {}
            for k, v in features_dict.items():
                norm_k = normalize_feature_name(str(k))
                clean_dict[norm_k] = v
                clean_dict[norm_k.lower()] = v
                clean_dict[norm_k.lower().replace(" ", "_")] = v

            row = np.zeros((1, len(expected_features)), dtype=np.float32)
            for j, feat in enumerate(expected_features):
                norm_feat = normalize_feature_name(feat)
                val = clean_dict.get(
                    norm_feat,
                    clean_dict.get(
                        norm_feat.lower(),
                        clean_dict.get(norm_feat.lower().replace(" ", "_"), 0.0),
                    ),
                )
                try:
                    row[0, j] = float(val)
                except (ValueError, TypeError):
                    row[0, j] = 0.0

            # Wrap in DataFrame if pandas is available to preserve column names
            input_data: Any = row
            try:
                import pandas as pd  # type: ignore
                input_data = pd.DataFrame(row, columns=list(expected_features))
            except ImportError:
                input_data = row

            if hasattr(model, "predict_proba"):
                probs = model.predict_proba(input_data)[0]
                idx = min(self.dropout_class_idx, len(probs) - 1)
                prob = float(probs[idx])
                return int(round(max(0.0, min(1.0, prob)) * 100.0))
            elif hasattr(model, "predict"):
                try:
                    preds = model.predict(input_data)
                except Exception:
                    try:
                        import xgboost as xgb  # type: ignore
                        dmat = xgb.DMatrix(row, feature_names=list(expected_features))
                        preds = model.predict(dmat)
                    except Exception:
                        raise
                pred_val = float(preds[0])
                if 0.0 <= pred_val <= 1.0:
                    return int(round(pred_val * 100.0))
                return int(round(max(0.0, min(100.0, pred_val))))
        except Exception as err:
            logger.warning("Failed to evaluate risk model: %s", err)

        return None

    def generate_trajectory(
        self,
        student_data: Dict[str, Any],
        risk_score_sem2: Optional[int] = None,
        risk_score_sem1: Optional[int] = None,
    ) -> TrajectoryResponse:
        """Generate the real Sem 1 -> Sem 2 trajectory for a student.
        
        Args:
            student_data: Dict containing real UCI features for the student.
            risk_score_sem2: Optional pre-computed Sem 2 risk score (from Mohith's predict_student).
            risk_score_sem1: Optional pre-computed Sem 1 risk score.
            
        Returns:
            TrajectoryResponse matching exact frozen JSON contract.
        """
        # 1. Extract Sem 1 Curricular Units
        sem1_approved = _extract_numeric_value(
            student_data,
            ["Curricular units 1st sem (approved)", "curricular_units_1st_sem_approved"],
            default=0.0,
        )
        sem1_grade = _extract_numeric_value(
            student_data,
            ["Curricular units 1st sem (grade)", "curricular_units_1st_sem_grade"],
            default=0.0,
        )
        sem1_enrolled = _extract_numeric_value(
            student_data,
            ["Curricular units 1st sem (enrolled)", "curricular_units_1st_sem_enrolled"],
            default=max(sem1_approved, 6.0),
        )

        # 2. Extract Sem 2 Curricular Units
        sem2_approved = _extract_numeric_value(
            student_data,
            ["Curricular units 2nd sem (approved)", "curricular_units_2nd_sem_approved"],
            default=0.0,
        )
        sem2_grade = _extract_numeric_value(
            student_data,
            ["Curricular units 2nd sem (grade)", "curricular_units_2nd_sem_grade"],
            default=0.0,
        )
        sem2_enrolled = _extract_numeric_value(
            student_data,
            ["Curricular units 2nd sem (enrolled)", "curricular_units_2nd_sem_enrolled"],
            default=max(sem2_approved, 6.0),
        )

        # 3. Determine Sem 2 Risk Score
        final_risk_sem2: int
        if risk_score_sem2 is not None:
            final_risk_sem2 = int(max(0, min(100, risk_score_sem2)))
        else:
            model_risk = self._predict_risk_from_model(
                self.model_full,
                student_data,
                self.feature_names_full,
            )
            if model_risk is not None:
                final_risk_sem2 = model_risk
            else:
                final_risk_sem2 = _calculate_academic_risk_proxy(
                    sem2_approved, sem2_enrolled, sem2_grade, baseline_risk=50.0
                )

        # 4. Determine Sem 1 Risk Score (Dual-Model or Baseline Projection)
        final_risk_sem1: int
        if risk_score_sem1 is not None:
            final_risk_sem1 = int(max(0, min(100, risk_score_sem1)))
        elif self.model_sem1 is not None:
            # High-impact Dual-Model path: Evaluate Sem 1-only model with Sem 1 features
            dual_risk = self._predict_risk_from_model(
                self.model_sem1,
                student_data,
                self.feature_names_sem1,
            )
            final_risk_sem1 = dual_risk if dual_risk is not None else 50
        elif self.model_full is not None:
            # Single-model fallback: Progressive counterfactual projection
            # Project risk at end of Sem 1 before Sem 2 unfolded
            # (assuming Sem 2 performance initially tracked Sem 1 rate)
            sem1_projected_features = dict(student_data)
            sem1_projected_features["Curricular units 2nd sem (approved)"] = sem1_approved
            sem1_projected_features["Curricular units 2nd sem (grade)"] = sem1_grade
            sem1_projected_features["Curricular units 2nd sem (enrolled)"] = sem1_enrolled
            
            projected_risk = self._predict_risk_from_model(
                self.model_full,
                sem1_projected_features,
                self.feature_names_full,
            )
            final_risk_sem1 = projected_risk if projected_risk is not None else 50
        else:
            # Calibrated fallback proxy
            final_risk_sem1 = _calculate_academic_risk_proxy(
                sem1_approved, sem1_enrolled, sem1_grade, baseline_risk=final_risk_sem2
            )

        # Build Points
        point_sem1 = TrajectoryPoint(
            semester="Sem 1",
            risk_score=final_risk_sem1,
            approved_units=int(sem1_approved) if sem1_approved.is_integer() else sem1_approved,
            grade=round(sem1_grade, 1),
            enrolled_units=int(sem1_enrolled) if sem1_enrolled.is_integer() else sem1_enrolled,
        )

        point_sem2 = TrajectoryPoint(
            semester="Sem 2",
            risk_score=final_risk_sem2,
            approved_units=int(sem2_approved) if sem2_approved.is_integer() else sem2_approved,
            grade=round(sem2_grade, 1),
            enrolled_units=int(sem2_enrolled) if sem2_enrolled.is_integer() else sem2_enrolled,
        )

        return TrajectoryResponse(
            trajectory_type="real_sem1_to_sem2",
            points=[point_sem1, point_sem2],
            note=FROZEN_NOTE,
        )

    def calculate_trend(self, points: Sequence[TrajectoryPoint]) -> str:
        """Compute the trajectory trend direction between Sem 1 and Sem 2.
        
        Returns:
            'Deteriorating' (risk increased by >= 5 points)
            'Improving' (risk decreased by >= 5 points)
            'Stable' (risk changed by < 5 points)
        """
        if len(points) < 2:
            return "Stable"
        delta = points[1].risk_score - points[0].risk_score
        if delta >= 5:
            return "Deteriorating"
        elif delta <= -5:
            return "Improving"
        return "Stable"


def generate_student_trajectory(
    student_data: Dict[str, Any],
    model_full: Optional[Any] = None,
    model_sem1: Optional[Any] = None,
    risk_score_sem2: Optional[int] = None,
    risk_score_sem1: Optional[int] = None,
    include_enrolled: bool = False,
) -> Dict[str, Any]:
    """Convenience function for FastAPI backend to get student trajectory directly.
    
    Returns exact frozen dictionary:
    {
      "trajectory_type": "real_sem1_to_sem2",
      "points": [
        {"semester": "Sem 1", "risk_score": ..., "approved_units": ..., "grade": ...},
        {"semester": "Sem 2", "risk_score": ..., "approved_units": ..., "grade": ...}
      ],
      "note": "Based on actual 1st vs 2nd semester curricular units from the dataset"
    }
    """
    generator = Sem1Sem2TrajectoryGenerator(
        model_full=model_full,
        model_sem1=model_sem1,
    )
    response = generator.generate_trajectory(
        student_data=student_data,
        risk_score_sem2=risk_score_sem2,
        risk_score_sem1=risk_score_sem1,
    )
    return response.to_dict(include_enrolled=include_enrolled)


def calculate_student_trend(
    points_or_trajectory: Union[
        Sequence[TrajectoryPoint],
        Sequence[Dict[str, Any]],
        TrajectoryResponse,
        Dict[str, Any],
    ],
) -> str:
    """Extract trajectory trend ('Deteriorating', 'Improving', 'Stable') for Priority Queue.
    
    Adheres to blueprint:
    - Deteriorating: Sem 2 risk >= Sem 1 risk + 5 points
    - Improving: Sem 2 risk <= Sem 1 risk - 5 points
    - Stable: Risk change within +/- 5 points
    """
    if isinstance(points_or_trajectory, TrajectoryResponse):
        pts = points_or_trajectory.points
    elif isinstance(points_or_trajectory, dict) and "points" in points_or_trajectory:
        pts = points_or_trajectory["points"]
    else:
        pts = points_or_trajectory  # type: ignore

    if len(pts) < 2:
        return "Stable"

    p0 = pts[0]
    p1 = pts[1]
    r0 = p0.risk_score if hasattr(p0, "risk_score") else p0.get("risk_score", 0)
    r1 = p1.risk_score if hasattr(p1, "risk_score") else p1.get("risk_score", 0)

    delta = int(r1) - int(r0)
    if delta >= 5:
        return "Deteriorating"
    elif delta <= -5:
        return "Improving"
    return "Stable"
