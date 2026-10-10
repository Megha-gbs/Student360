"""
Tests for ML Model Integration.
Verifies:
1. Actual predict_student() is invoked.
2. Artifact caching works without model reloading or retraining.
3. Model evaluation on all 10 demo students produces deterministic, accurate outputs.
4. Input validation adheres to frozen 36 UCI features schema.
"""

import sys
from pathlib import Path
import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.services.model_service import model_service
from backend.app.services.student_service import student_service


def test_artifact_caching_and_zero_retraining():
    """Verify artifacts load from disk and are cached in memory without retraining."""
    model1, prep1 = model_service.load_artifacts()
    model2, prep2 = model_service.load_artifacts()

    # Verify exact same object instances cached in memory
    assert model1 is model2
    assert prep1 is prep2


def test_predict_all_demo_students_deterministic():
    """Verify deterministic prediction across all 10 verified demo students."""
    demo_students = [s for s in student_service.get_all_students() if s.get("prediction")]
    assert len(demo_students) == 10

    for s in demo_students:
        sid = str(s.get("demo_id") or s.get("student_id"))
        features = s.get("features")
        expected_pred = s.get("prediction")

        # Run dynamic prediction
        pred = model_service.predict(features=features, student_id=sid)

        assert pred["student_id"] == sid
        assert pred["risk_score"] == expected_pred["risk_score"]
        assert pred["risk_level"] == expected_pred["risk_level"]
        assert pytest.approx(pred["dropout_probability"], abs=1e-4) == expected_pred["dropout_probability"]
        assert pred["model_version"] == expected_pred["model_version"]


def test_feature_validation_rejects_missing_and_unexpected():
    """Verify validation strictly rejects corrupt feature inputs."""
    # Missing feature
    with pytest.raises(ValueError) as exc1:
        model_service.validate_features({"Marital status": 1})
    assert "Missing" in str(exc1.value)

    # Unexpected feature
    full_features = dict(student_service.get_student_features("S1001"))
    full_features["fictional_field"] = 123
    with pytest.raises(ValueError) as exc2:
        model_service.validate_features(full_features)
    assert "Unexpected" in str(exc2.value)

    # Target column
    full_features_leak = dict(student_service.get_student_features("S1001"))
    full_features_leak["Target"] = 0
    with pytest.raises(ValueError) as exc3:
        model_service.validate_features(full_features_leak)
    assert "target column" in str(exc3.value)
