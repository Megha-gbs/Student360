"""ml/explainability/test_explainability.py

Comprehensive test suite for the Explainability package (Smruthi's Scope).
Verifies:
1. UCI schema enforcement & rejection of fictional features (attendance, study_time).
2. Per-student SHAP explanation with 3-5 contributors and frozen JSON contract.
3. Cohort-wide Global SHAP calculation for Cohort Insights.
4. Correct typing, boolean preservation, and convenience wrapper APIs.
"""

from __future__ import annotations

import json
import unittest
from typing import Any, List
import numpy as np

from ml.explainability import (
    FICTIONAL_COLUMNS,
    GlobalSHAPItem,
    GlobalSHAPResponse,
    SHAPReason,
    StudentSHAPExplainer,
    TopReasonsResponse,
    UCI_ALL_FEATURES,
    compute_cohort_global_shap,
    explain_student_risk,
    normalize_feature_name,
    validate_real_uci_features,
)


class MockXGBClassifier:
    """Mock XGBoost classifier mimicking predict_proba and tree structure."""

    def __init__(self, classes: List[str] | None = None) -> None:
        self.classes_ = np.array(classes if classes is not None else ["Dropout", "Enrolled", "Graduate"])
        self.feature_names_in_ = np.array(list(UCI_ALL_FEATURES))
        self.feature_importances_ = np.linspace(0.01, 0.5, len(UCI_ALL_FEATURES))

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        n = X.shape[0]
        # Return mock probabilities: [prob_dropout, prob_enrolled, prob_graduate]
        probs = np.zeros((n, 3), dtype=np.float32)
        probs[:, 0] = 0.78  # 78% dropout probability
        probs[:, 1] = 0.12
        probs[:, 2] = 0.10
        return probs


class TestExplainability(unittest.TestCase):
    """Test suite for SHAP explainability and real UCI schema constraints."""

    def setUp(self) -> None:
        self.sample_student = {
            "student_id": "S1023",
            "Admission grade": 145.5,
            "Age at enrollment": 20,
            "Tuition fees up to date": 1,
            "Scholarship holder": 0,
            "Debtor": 1,
            "Curricular units 1st sem (approved)": 5,
            "Curricular units 1st sem (grade)": 12.3,
            "Curricular units 2nd sem (approved)": 3,
            "Curricular units 2nd sem (grade)": 9.1,
        }

    def test_01_uci_real_features_validation_pass(self) -> None:
        """Valid real UCI columns must pass validation."""
        valid_subset = [
            "Admission grade",
            "Curricular units 1st sem (approved)",
            "Tuition fees up to date",
            "Debtor",
        ]
        res = validate_real_uci_features(valid_subset)
        self.assertEqual(res, valid_subset)

    def test_02_rejection_of_fictional_columns(self) -> None:
        """Strictly disallow fictional columns (attendance, study_time)."""
        for fic in ["attendance", "study_time", "studytime", "absences", "weekly_study_hours"]:
            with self.assertRaises(ValueError) as ctx:
                validate_real_uci_features([fic, "Admission grade"])
            self.assertIn("Prohibited fictional features detected", str(ctx.exception))

    def test_03_per_student_shap_contract(self) -> None:
        """Per-student explanation must strictly match the frozen JSON contract."""
        explainer = StudentSHAPExplainer(model=None)
        resp: TopReasonsResponse = explainer.explain_student(self.sample_student, top_k=5)
        data = resp.to_dict()

        # Contract checks:
        self.assertIn("top_reasons", data)
        self.assertIsInstance(data["top_reasons"], list)
        self.assertTrue(3 <= len(data["top_reasons"]) <= 5)

        for reason in data["top_reasons"]:
            self.assertIn("feature", reason)
            self.assertIn("value", reason)
            self.assertIn("impact", reason)
            self.assertIn("direction", reason)
            self.assertIn(reason["impact"], ["high", "medium", "low"])
            self.assertIn(reason["direction"], ["increases_risk", "decreases_risk"])
            # Feature must be a real UCI column
            self.assertIn(reason["feature"], UCI_ALL_FEATURES)

    def test_04_convenience_explain_student_risk(self) -> None:
        """Test explain_student_risk wrapper used by FastAPI."""
        raw_dict = explain_student_risk(
            model=None,
            student_data=self.sample_student,
            top_k=4,
        )
        self.assertIn("top_reasons", raw_dict)
        self.assertEqual(len(raw_dict["top_reasons"]), 4)

    def test_05_cohort_global_shap_contract(self) -> None:
        """Cohort global SHAP must match frozen schema for Cohort Insights."""
        cohort = [
            self.sample_student,
            {
                "student_id": "S1024",
                "Admission grade": 115.0,
                "Curricular units 1st sem (approved)": 2,
                "Curricular units 1st sem (grade)": 8.0,
                "Curricular units 2nd sem (approved)": 1,
                "Curricular units 2nd sem (grade)": 7.0,
                "Debtor": 1,
                "Tuition fees up to date": 0,
            },
        ]
        explainer = StudentSHAPExplainer(model=None)
        resp: GlobalSHAPResponse = explainer.explain_cohort(cohort, top_k=5)
        data = resp.to_dict()

        self.assertIn("global_shap", data)
        self.assertIsInstance(data["global_shap"], list)
        self.assertTrue(len(data["global_shap"]) <= 5)

        for item in data["global_shap"]:
            self.assertIn("feature", item)
            self.assertIn("mean_abs_shap", item)
            self.assertIsInstance(item["mean_abs_shap"], float)
            self.assertIn(item["feature"], UCI_ALL_FEATURES)

        # Verify sorted descending
        scores = [item["mean_abs_shap"] for item in data["global_shap"]]
        self.assertEqual(scores, sorted(scores, reverse=True))

        # Test list helper
        items_list = explainer.get_global_shap_list(cohort, top_k=3)
        self.assertEqual(len(items_list), 3)

    def test_06_mock_model_integration(self) -> None:
        """Test explainer with a simulated model containing classes and importances."""
        mock_model = MockXGBClassifier()
        explainer = StudentSHAPExplainer(model=mock_model)
        self.assertEqual(explainer.dropout_class_idx, 0)

        resp = explainer.explain_student(self.sample_student, top_k=3)
        self.assertEqual(len(resp.top_reasons), 3)

    def test_07_boolean_scalar_preservation(self) -> None:
        """Verify bool values are preserved as bools and not converted to 1/0."""
        from ml.explainability.explainer import _clean_scalar
        self.assertIs(_clean_scalar(True), True)
        self.assertIs(_clean_scalar(False), False)
        self.assertEqual(_clean_scalar(10), 10)
        self.assertEqual(_clean_scalar(12.345), 12.35)


if __name__ == "__main__":
    unittest.main()
