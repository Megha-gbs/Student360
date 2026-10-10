"""
Student360 Prediction Module
============================
Inference module for Student360 ML risk prediction.
Loads serialized preprocessing and XGBoost artifacts, validates
real UCI input features, and returns standardized risk scores.
"""

import os
import sys
from typing import Any, Dict, List, Optional, Union
import joblib
import numpy as np
import pandas as pd

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from ml.training.preprocess import (
    FEATURE_ORDER,
    TARGET_COLUMN,
    TARGET_MAPPING,
    REVERSE_TARGET_MAPPING,
    load_preprocessor
)

MODEL_VERSION: str = "student360_xgb_v2_real_features"
DEFAULT_MODEL_PATH: str = os.path.join(PROJECT_ROOT, "models", "xgboost_model_v1.joblib")
DEFAULT_PREPROCESSOR_PATH: str = os.path.join(PROJECT_ROOT, "models", "preprocessor.joblib")

# Risk Level Thresholds (Implementation Policy)
# - Low Risk: Dropout Probability < 0.35 (Risk Score 0-34)
# - Medium Risk: 0.35 <= Dropout Probability < 0.65 (Risk Score 35-64)
# - High Risk: Dropout Probability >= 0.65 (Risk Score 65-100)
LOW_RISK_THRESHOLD: float = 0.35
HIGH_RISK_THRESHOLD: float = 0.65

# Module-level cache for loaded artifacts
_MODEL_CACHE = None
_PREPROCESSOR_CACHE = None


def get_artifacts(
    model_path: str = DEFAULT_MODEL_PATH,
    preprocessor_path: str = DEFAULT_PREPROCESSOR_PATH
):
    """Loads and caches model and preprocessor artifacts without retraining."""
    global _MODEL_CACHE, _PREPROCESSOR_CACHE
    if _MODEL_CACHE is None:
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model artifact not found at {model_path}")
        _MODEL_CACHE = joblib.load(model_path)

    if _PREPROCESSOR_CACHE is None:
        if not os.path.exists(preprocessor_path):
            raise FileNotFoundError(f"Preprocessor artifact not found at {preprocessor_path}")
        _PREPROCESSOR_CACHE = load_preprocessor(preprocessor_path)

    return _MODEL_CACHE, _PREPROCESSOR_CACHE


def determine_risk_level(dropout_probability: float) -> str:
    """Classifies risk level based on the documented threshold policy."""
    if dropout_probability < LOW_RISK_THRESHOLD:
        return "Low"
    elif dropout_probability < HIGH_RISK_THRESHOLD:
        return "Medium"
    else:
        return "High"


def validate_inference_features(features: Dict[str, Any]) -> pd.DataFrame:
    """
    Strict validation of inference feature dictionary:
    - Rejects input containing the Target column.
    - Rejects input missing any of the 36 required UCI features.
    - Rejects unexpected / invented features (excluding optional metadata 'student_id').
    - Returns ordered 1-row DataFrame.
    """
    if not isinstance(features, dict):
        raise TypeError(f"Expected features to be a dict, got {type(features).__name__}")

    # Check for Target column
    if TARGET_COLUMN in features:
        raise ValueError(
            f"Input features must not contain the target column '{TARGET_COLUMN}'."
        )

    # Normalize minor whitespace differences (e.g. Daytime/evening attendance vs Daytime/evening attendance\t)
    features_copy = dict(features)
    if "Daytime/evening attendance" in features_copy and "Daytime/evening attendance\t" not in features_copy:
        features_copy["Daytime/evening attendance\t"] = features_copy.pop("Daytime/evening attendance")

    # Check for unexpected keys (ignore optional student_id metadata)
    allowed_keys = set(FEATURE_ORDER) | {"student_id"}
    unexpected_keys = [k for k in features_copy.keys() if k not in allowed_keys]
    if unexpected_keys:
        raise ValueError(
            f"Unexpected feature(s) detected: {unexpected_keys}. "
            f"Only real UCI features defined in the frozen schema are accepted."
        )

    # Check for missing required features
    missing_keys = [k for k in FEATURE_ORDER if k not in features_copy]
    if missing_keys:
        raise ValueError(
            f"Missing {len(missing_keys)} required feature(s): {missing_keys}"
        )

    # Construct single-row DataFrame in exact frozen order
    row_data = {col: [features_copy[col]] for col in FEATURE_ORDER}
    return pd.DataFrame(row_data)[FEATURE_ORDER]


def predict_student(
    features: Dict[str, Any],
    student_id: Optional[str] = None,
    model_path: str = DEFAULT_MODEL_PATH,
    preprocessor_path: str = DEFAULT_PREPROCESSOR_PATH
) -> Dict[str, Any]:
    """
    Generates deterministic risk prediction for a single student.

    Parameters:
    - features: Dict containing exact 36 UCI features.
    - student_id: Optional identifier (or extracted from features if present).

    Returns:
    - Dict with student_id, risk_score, risk_level, dropout_probability, model_version.
    """
    # Resolve student identifier
    sid = student_id or features.get("student_id", "UNKNOWN_STUDENT")

    # Validate and structure features
    df_ordered = validate_inference_features(features)

    # Load artifacts (cached, zero retraining)
    model, preprocessor = get_artifacts(model_path, preprocessor_path)

    # Preprocess features
    X_trans = preprocessor.transform(df_ordered)

    # Predict class probabilities
    probabilities = model.predict_proba(X_trans)[0]

    # Verify and extract Dropout probability (Dropout class index is verified against model.classes_)
    dropout_class_code = TARGET_MAPPING['Dropout']  # 0
    if dropout_class_code in model.classes_:
        dropout_idx = int(np.where(model.classes_ == dropout_class_code)[0][0])
    else:
        dropout_idx = 0

    dropout_prob = float(probabilities[dropout_idx])
    dropout_prob_rounded = round(dropout_prob, 4)

    # Compute risk score (0 to 100) and risk level
    risk_score = int(round(dropout_prob * 100))
    risk_level = determine_risk_level(dropout_prob)

    return {
        "student_id": str(sid),
        "risk_score": risk_score,
        "risk_level": risk_level,
        "dropout_probability": dropout_prob_rounded,
        "model_version": MODEL_VERSION
    }


def predict_students_batch(
    students: List[Dict[str, Any]],
    model_path: str = DEFAULT_MODEL_PATH,
    preprocessor_path: str = DEFAULT_PREPROCESSOR_PATH
) -> List[Dict[str, Any]]:
    """Generates predictions for a list of student feature dictionaries."""
    results = []
    for s in students:
        sid = s.get("student_id")
        results.append(predict_student(s, student_id=sid, model_path=model_path, preprocessor_path=preprocessor_path))
    return results
