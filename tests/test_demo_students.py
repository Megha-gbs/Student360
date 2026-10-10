"""
Unit tests for Demo Students Verification
"""

import os
import sys
import json

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import unittest
from ml.prediction.predict import predict_student, MODEL_VERSION


class TestDemoStudents(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.demo_json_path = os.path.join('docs', 'DEMO_STUDENTS.json')
        if not os.path.exists(cls.demo_json_path):
            from ml.prediction.generate_demo_students import generate_demo_students
            generate_demo_students()

        with open(cls.demo_json_path, 'r', encoding='utf-8') as f:
            cls.demo_data = json.load(f)

    def test_demo_students_count(self):
        """Verify exactly 10 demo students are present."""
        self.assertEqual(len(self.demo_data), 10)

    def test_demo_predictions_live_verification(self):
        """Re-predict live from features and verify determinism and schema compliance."""
        for item in self.demo_data:
            sid = item["demo_id"]
            features = item["features"]
            stored_pred = item["prediction"]

            # Live prediction
            live_pred = predict_student(features, student_id=sid)

            self.assertEqual(live_pred["student_id"], sid)
            self.assertEqual(live_pred["model_version"], MODEL_VERSION)
            self.assertAlmostEqual(live_pred["dropout_probability"], stored_pred["dropout_probability"], places=4)
            self.assertEqual(live_pred["risk_score"], stored_pred["risk_score"])
            self.assertEqual(live_pred["risk_level"], stored_pred["risk_level"])
            self.assertIn(live_pred["risk_level"], ["Low", "Medium", "High"])


if __name__ == '__main__':
    unittest.main()
