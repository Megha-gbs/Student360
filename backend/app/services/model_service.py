"""
Model Service Adapter.
Wraps Mohit's existing ML prediction pipeline without duplicating logic,
retraining models, or hardcoding predictions.
"""

from typing import Any, Dict, Optional
import pandas as pd

from backend.app.config import MODEL_PATH, PREPROCESSOR_PATH
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
        
        Returns:
            Dict containing student_id, risk_score, risk_level, dropout_probability, model_version.
        """
        return _predict_student(
            features=features,
            student_id=student_id,
            model_path=self.model_path,
            preprocessor_path=self.preprocessor_path,
        )

    def determine_risk(self, probability: float) -> str:
        """Determines categorical risk level based on threshold policy."""
        return _determine_risk_level(probability)


# Global singleton instance for service injection
model_service = ModelService()
