"""ml/trajectory/test_trajectory.py

Comprehensive test suite for the Real Sem1 -> Sem2 Trajectory package (Smruthi's Scope).
Verifies:
1. Two-point real trajectory generation from actual curricular units (Sem 1 and Sem 2).
2. Frozen JSON structure matching blueprint contract:
   - "trajectory_type": "real_sem1_to_sem2"
   - "points": exactly 2 points with "semester", "risk_score", "approved_units", "grade"
   - "note": exact frozen disclaimer string
3. No weekly synthetic points.
4. Calibrated risk scoring matching blueprint ground-truth example (Sem 1 risk 41, Sem 2 risk 78).
5. Trend calculation: Deteriorating, Improving, Stable.
6. Dual-model risk evaluation support.
7. Feature name case and snake_case tolerance.
"""

from __future__ import annotations

import json
import unittest
from typing import Any, Dict
import numpy as np

from ml.trajectory import (
    FROZEN_NOTE,
    Sem1Sem2TrajectoryGenerator,
    SemesterName,
    TrajectoryPoint,
    TrajectoryResponse,
    calculate_student_trend,
    generate_student_trajectory,
)


class MockRiskModel:
    """Mock risk model predicting specific probabilities for testing."""

    def __init__(self, risk_proba: float) -> None:
        self.risk_proba = risk_proba
        self.classes_ = np.array(["Dropout", "Graduate"])

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        n = X.shape[0]
        probs = np.zeros((n, 2), dtype=np.float32)
        probs[:, 0] = self.risk_proba
        probs[:, 1] = 1.0 - self.risk_proba
        return probs


class TestTrajectory(unittest.TestCase):
    """Unit tests for Sem1 -> Sem2 trajectory generation."""

    def setUp(self) -> None:
        # Standard student record from blueprint
        self.sample_student: Dict[str, Any] = {
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

    def test_01_frozen_contract_shape(self) -> None:
        """Trajectory output must strictly match the blueprint frozen JSON shape."""
        generator = Sem1Sem2TrajectoryGenerator()
        res = generator.generate_trajectory(
            self.sample_student,
            risk_score_sem2=78,
            risk_score_sem1=41,
        )
        data = res.to_dict()

        # Contract keys
        self.assertEqual(data["trajectory_type"], "real_sem1_to_sem2")
        self.assertEqual(data["note"], FROZEN_NOTE)
        self.assertEqual(len(data["points"]), 2)

        # Milestone 1: Sem 1
        pt1 = data["points"][0]
        self.assertEqual(pt1["semester"], "Sem 1")
        self.assertEqual(pt1["risk_score"], 41)
        self.assertEqual(pt1["approved_units"], 5)
        self.assertEqual(pt1["grade"], 12.3)

        # Milestone 2: Sem 2
        pt2 = data["points"][1]
        self.assertEqual(pt2["semester"], "Sem 2")
        self.assertEqual(pt2["risk_score"], 78)
        self.assertEqual(pt2["approved_units"], 3)
        self.assertEqual(pt2["grade"], 9.1)

    def test_02_calibrated_academic_risk_proxy(self) -> None:
        """When ML model is not yet loaded, proxy reproduces blueprint baseline."""
        generator = Sem1Sem2TrajectoryGenerator()
        # Given Sem 2 risk score of 78 from Mohith, Sem 1 risk proxy should calculate 41
        res = generator.generate_trajectory(
            self.sample_student,
            risk_score_sem2=78,
        )
        data = res.to_dict()
        self.assertEqual(data["points"][0]["risk_score"], 41)
        self.assertEqual(data["points"][1]["risk_score"], 78)

    def test_03_never_invent_weekly_points(self) -> None:
        """Verify points array strictly contains 2 semester milestones, never weekly points."""
        generator = Sem1Sem2TrajectoryGenerator()
        res = generator.generate_trajectory(self.sample_student)
        self.assertEqual(len(res.points), 2)
        semesters = [p.semester for p in res.points]
        self.assertEqual(semesters, ["Sem 1", "Sem 2"])

    def test_04_dual_model_support(self) -> None:
        """Test optional dual-model execution when separate Sem 1 model is provided."""
        mock_sem1_model = MockRiskModel(risk_proba=0.35)  # 35% risk
        mock_full_model = MockRiskModel(risk_proba=0.82)  # 82% risk

        generator = Sem1Sem2TrajectoryGenerator(
            model_full=mock_full_model,
            model_sem1=mock_sem1_model,
        )
        res = generator.generate_trajectory(self.sample_student)
        data = res.to_dict()

        self.assertEqual(data["points"][0]["risk_score"], 35)
        self.assertEqual(data["points"][1]["risk_score"], 82)

    def test_05_trend_calculation(self) -> None:
        """Verify trend extraction: Deteriorating, Improving, and Stable."""
        generator = Sem1Sem2TrajectoryGenerator()

        # Case 1: Deteriorating (41 -> 78, delta = +37 >= 5)
        pts_det = [
            TrajectoryPoint(semester="Sem 1", risk_score=41, approved_units=5, grade=12.0),
            TrajectoryPoint(semester="Sem 2", risk_score=78, approved_units=3, grade=9.0),
        ]
        self.assertEqual(generator.calculate_trend(pts_det), "Deteriorating")
        self.assertEqual(calculate_student_trend(pts_det), "Deteriorating")

        # Case 2: Improving (75 -> 40, delta = -35 <= -5)
        pts_imp = [
            TrajectoryPoint(semester="Sem 1", risk_score=75, approved_units=2, grade=8.5),
            TrajectoryPoint(semester="Sem 2", risk_score=40, approved_units=5, grade=13.0),
        ]
        self.assertEqual(generator.calculate_trend(pts_imp), "Improving")
        self.assertEqual(calculate_student_trend(pts_imp), "Improving")

        # Case 3: Stable (50 -> 52, delta = +2 < 5)
        pts_stb = [
            TrajectoryPoint(semester="Sem 1", risk_score=50, approved_units=4, grade=11.0),
            TrajectoryPoint(semester="Sem 2", risk_score=52, approved_units=4, grade=11.2),
        ]
        self.assertEqual(generator.calculate_trend(pts_stb), "Stable")
        self.assertEqual(calculate_student_trend(pts_stb), "Stable")

    def test_06_convenience_function_for_backend(self) -> None:
        """Test generate_student_trajectory convenience wrapper for FastAPI."""
        raw_dict = generate_student_trajectory(
            student_data=self.sample_student,
            risk_score_sem2=78,
            risk_score_sem1=41,
        )
        self.assertIn("trajectory_type", raw_dict)
        self.assertIn("points", raw_dict)
        self.assertEqual(len(raw_dict["points"]), 2)

    def test_07_flexible_key_naming(self) -> None:
        """Verify snake_case and whitespace tolerant key resolution."""
        snake_student = {
            "student_id": "S1099",
            "curricular_units_1st_sem_approved": 6,
            "curricular_units_1st_sem_grade": 14.5,
            "curricular_units_2nd_sem_approved": 6,
            "curricular_units_2nd_sem_grade": 15.0,
        }
        res = generate_student_trajectory(snake_student, risk_score_sem1=20, risk_score_sem2=15)
        self.assertEqual(res["points"][0]["approved_units"], 6)
        self.assertEqual(res["points"][0]["grade"], 14.5)
        self.assertEqual(res["points"][1]["approved_units"], 6)
        self.assertEqual(res["points"][1]["grade"], 15.0)


if __name__ == "__main__":
    unittest.main()
