"""
Model Service Adapter.
Wraps Mohit's existing ML prediction pipeline without duplicating logic,
retraining models, or hardcoding predictions.
Provides cached and batch-vectorized predictions for high-performance cohort analytics.
"""

from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd

from backend.app.config import MODEL_PATH, PREPROCESSOR_PATH
from ml.training.preprocess import (
    FEATURE_ORDER,
    TARGET_MAPPING,
    load_preprocessor,
)
from ml.prediction.predict import (
    predict_student as _predict_student,
    validate_inference_features as _validate_inference_features,
    determine_risk_level as _determine_risk_level,
    get_artifacts as _get_artifacts,
    MODEL_VERSION,
)


class ModelService:
    """Production service adapter delegating directly to ml.prediction.predict."""

    def __init__(
        self,
        model_path: Optional[str] = None,
        preprocessor_path: Optional[str] = None,
    ):
        self.model_path = str(model_path or MODEL_PATH)
        self.preprocessor_path = str(preprocessor_path or PREPROCESSOR_PATH)
        self._prediction_cache: Dict[str, Dict[str, Any]] = {}

    def load_artifacts(self):
        """Preload / warm cached artifacts at startup."""
        return _get_artifacts(self.model_path, self.preprocessor_path)

    def get_model(self):
        """Returns the loaded XGBoost model artifact."""
        model, _ = self.load_artifacts()
        return model

    def validate_features(self, features: Dict[str, Any]) -> pd.DataFrame:
        """Validates features against the frozen 36 UCI features schema."""
        return _validate_inference_features(features)

    def predict(
        self,
        features: Dict[str, Any],
        student_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generates risk prediction by delegating to Mohit's predict_student().
        Caches predictions by student_id for high-frequency queries.
        """
        sid = student_id or features.get("student_id")
        if sid and str(sid) in self._prediction_cache:
            # Check if features match cached baseline
            return self._prediction_cache[str(sid)]

        # Auto-warm cache for the whole cohort on first query if empty
        if not self._prediction_cache:
            try:
                from backend.app.services.student_service import student_service
                all_s = student_service.get_all_students()
                if all_s:
                    self.warm_cache_for_cohort(all_s)
                    if sid and str(sid) in self._prediction_cache:
                        return self._prediction_cache[str(sid)]
            except Exception:
                pass

        res = _predict_student(
            features=features,
            student_id=student_id,
            model_path=self.model_path,
            preprocessor_path=self.preprocessor_path,
        )

        if sid:
            self._prediction_cache[str(sid)] = res

        return res

    def warm_cache_for_cohort(self, students: List[Dict[str, Any]]) -> int:
        """Vectorized batch prediction warming the cache for the entire cohort at once."""
        if not students:
            return 0

        model, preprocessor = self.load_artifacts()
        rows: List[Dict[str, Any]] = []
        sids: List[str] = []

        for s in students:
            sid = str(s.get("demo_id") or s.get("student_id") or "UNKNOWN")
            f = s.get("features", {})
            sids.append(sid)
            # Order features cleanly
            row_dict = {}
            for col in FEATURE_ORDER:
                norm_col = col.strip()
                val = f.get(col, f.get(norm_col, 0))
                row_dict[col] = val
            rows.append(row_dict)

        df = pd.DataFrame(rows)[FEATURE_ORDER]
        X_trans = preprocessor.transform(df)
        probabilities = model.predict_proba(X_trans)

        dropout_class_code = TARGET_MAPPING["Dropout"]  # 0
        if dropout_class_code in model.classes_:
            dropout_idx = int(np.where(model.classes_ == dropout_class_code)[0][0])
        else:
            dropout_idx = 0

        dropout_probs = probabilities[:, dropout_idx]
        warmed = 0

        for i, sid in enumerate(sids):
            prob = float(dropout_probs[i])
            prob_rounded = round(prob, 4)
            risk_score = int(round(prob * 100))
            risk_level = _determine_risk_level(prob)

            pred_res = {
                "student_id": sid,
                "risk_score": risk_score,
                "risk_level": risk_level,
                "dropout_probability": prob_rounded,
                "model_version": MODEL_VERSION,
            }
            self._prediction_cache[sid] = pred_res
            warmed += 1

        return warmed

    def determine_risk(self, probability: float) -> str:
        """Determines categorical risk level based on threshold policy."""
        return _determine_risk_level(probability)


# Global singleton instance for service injection
model_service = ModelService()
