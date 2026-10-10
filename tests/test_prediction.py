"""
Unit tests for predict_student() and Prediction Pipeline
"""

import os
import sys

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import unittest
import pandas as pd
from ml.prediction.predict import (
    MODEL_VERSION,
    LOW_RISK_THRESHOLD,
    HIGH_RISK_THRESHOLD,
    predict_student,
    predict_students_batch,
    determine_risk_level
)
from ml.training.preprocess import FEATURE_ORDER, TARGET_COLUMN


class TestPredictionFunction(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.data_path = os.path.join('data', 'data.csv')
        cls.df = pd.read_csv(cls.data_path, sep=';')
        # Extract a clean sample student record
        cls.sample_record = cls.df.iloc[0].drop(TARGET_COLUMN).to_dict()

    def test_predict_student_valid_input(self):
        """Ensure valid feature dictionary generates a complete prediction object."""
        result = predict_student(self.sample_record, student_id="S1001")

        self.assertIsInstance(result, dict)
        self.assertEqual(result["student_id"], "S1001")
        self.assertIn("risk_score", result)
        self.assertIn("risk_level", result)
        self.assertIn("dropout_probability", result)
        self.assertEqual(result["model_version"], MODEL_VERSION)

        # Type checks
        self.assertIsInstance(result["risk_score"], int)
        self.assertIsInstance(result["risk_level"], str)
        self.assertIsInstance(result["dropout_probability"], float)

    def test_probability_and_risk_score_consistency(self):
        """Ensure dropout probability is bounded and risk score is strictly round(prob * 100)."""
        result = predict_student(self.sample_record, student_id="S1002")

        prob = result["dropout_probability"]
        score = result["risk_score"]

        self.assertGreaterEqual(prob, 0.0)
        self.assertLessEqual(prob, 1.0)
        self.assertEqual(score, int(round(prob * 100)))

    def test_risk_level_threshold_logic(self):
        """Ensure risk levels adhere strictly to documented thresholds."""
        self.assertEqual(determine_risk_level(0.10), "Low")
        self.assertEqual(determine_risk_level(0.34), "Low")
        self.assertEqual(determine_risk_level(0.35), "Medium")
        self.assertEqual(determine_risk_level(0.50), "Medium")
        self.assertEqual(determine_risk_level(0.64), "Medium")
        self.assertEqual(determine_risk_level(0.65), "High")
        self.assertEqual(determine_risk_level(0.95), "High")

    def test_missing_feature_rejection(self):
        """Ensure missing feature raises a descriptive ValueError."""
        incomplete = self.sample_record.copy()
        del incomplete["Tuition fees up to date"]

        with self.assertRaises(ValueError) as ctx:
            predict_student(incomplete, student_id="S_FAIL_1")
        self.assertIn("Missing 1 required feature", str(ctx.exception))
        self.assertIn("Tuition fees up to date", str(ctx.exception))

    def test_unexpected_feature_rejection(self):
        """Ensure invented or unexpected features raise a descriptive ValueError."""
        invented = self.sample_record.copy()
        invented["attendance"] = 95.0

        with self.assertRaises(ValueError) as ctx:
            predict_student(invented, student_id="S_FAIL_2")
        self.assertIn("Unexpected feature(s) detected", str(ctx.exception))
        self.assertIn("attendance", str(ctx.exception))

    def test_target_column_rejection(self):
        """Ensure supplying Target in prediction input raises a ValueError."""
        leaky_input = self.sample_record.copy()
        leaky_input["Target"] = "Dropout"

        with self.assertRaises(ValueError) as ctx:
            predict_student(leaky_input, student_id="S_FAIL_3")
        self.assertIn("Input features must not contain the target column 'Target'", str(ctx.exception))

    def test_predict_students_batch(self):
        """Ensure batch predictions process multiple students correctly."""
        batch_input = [
            {**self.df.iloc[i].drop(TARGET_COLUMN).to_dict(), "student_id": f"S100{i}"}
            for i in range(5)
        ]
        results = predict_students_batch(batch_input)

        self.assertEqual(len(results), 5)
        for i, res in enumerate(results):
            self.assertEqual(res["student_id"], f"S100{i}")
            self.assertIn(res["risk_level"], ["Low", "Medium", "High"])
            self.assertGreaterEqual(res["risk_score"], 0)
            self.assertLessEqual(res["risk_score"], 100)


if __name__ == '__main__':
    unittest.main()
