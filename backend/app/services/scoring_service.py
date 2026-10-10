"""backend/app/services/scoring_service.py

Scoring Service Adapter.
Integrates rules-based scoring engines from ml.scoring:
- Placement Readiness Score
- Multi-dimensional Student Success Score
Integrates seamlessly with student_service to derive genuine academic performance from UCI features.
"""

import logging
from typing import Any, Dict, Optional, Union

from backend.app.services.student_service import student_service
from ml.scoring.placement_readiness import (
    calculate_placement_readiness as _calc_placement,
    determine_placement_tier,
    DEFAULT_PLACEMENT_WEIGHTS,
    PLACEMENT_NOTE,
)
from ml.scoring.success_score import (
    calculate_success_score as _calc_success,
    extract_academic_score_from_uci,
    determine_success_tier,
    DEFAULT_SUCCESS_WEIGHTS,
    MIN_WEIGHT_THRESHOLD,
    SUCCESS_NOTICE,
)

logger = logging.getLogger("student360.scoring_service")


class ScoringService:
    """Service adapter managing student success and placement readiness calculations."""

    def calculate_placement(
        self,
        student_id: Optional[str] = None,
        indicators: Optional[Dict[str, Any]] = None,
        aptitude: Optional[Union[int, float]] = None,
        coding: Optional[Union[int, float]] = None,
        mock_interviews: Optional[Union[int, float]] = None,
        technical_skills: Optional[Union[int, float]] = None,
        weights: Optional[Dict[str, float]] = None,
    ) -> Dict[str, Any]:
        """Calculates rules-based placement readiness score."""
        res = _calc_placement(
            indicators=indicators,
            aptitude=aptitude,
            coding=coding,
            mock_interviews=mock_interviews,
            technical_skills=technical_skills,
            weights=weights,
        )
        res["student_id"] = student_id
        return res

    def calculate_success(
        self,
        student_id: Optional[str] = None,
        components: Optional[Dict[str, Any]] = None,
        academic: Optional[Union[int, float]] = None,
        attendance: Optional[Union[int, float]] = None,
        lms: Optional[Union[int, float]] = None,
        engagement: Optional[Union[int, float]] = None,
        placement_readiness: Optional[Union[int, float]] = None,
        weights: Optional[Dict[str, float]] = None,
    ) -> Dict[str, Any]:
        """Calculates multi-dimensional Student Success Score."""
        res = _calc_success(
            components=components,
            academic=academic,
            attendance=attendance,
            lms=lms,
            engagement=engagement,
            placement_readiness=placement_readiness,
            weights=weights,
        )
        res["student_id"] = student_id
        res["standing_tier"] = res.get("tier")
        return res

    def get_student_success_score(
        self,
        student_id: str,
        attendance: Optional[float] = None,
        lms: Optional[float] = None,
        engagement: Optional[float] = None,
        placement_readiness: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Derives success score for an existing student:
        - Extracts academic score from genuine 36 UCI features.
        - Blends with provided or contextual indicators.
        """
        student = student_service.get_student_by_id(student_id)
        if not student:
            return {
                "student_id": student_id,
                "status": "insufficient_data",
                "success_score": None,
                "standing_tier": None,
                "weight_coverage": 0.0,
                "components": {},
                "notice": SUCCESS_NOTICE,
            }

        features = student.get("features", {})
        academic_score = extract_academic_score_from_uci(features)

        # Contextual defaults if not explicitly provided
        # Attendance: derive proxy from curricular units evaluations / enrolled ratio if available
        derived_attendance = attendance
        if derived_attendance is None:
            enrolled_2 = float(features.get("Curricular units 2nd sem (enrolled)", 0))
            evals_2 = float(features.get("Curricular units 2nd sem (evaluations)", 0))
            if enrolled_2 > 0:
                eval_ratio = min(1.0, evals_2 / enrolled_2)
                derived_attendance = round(eval_ratio * 90.0, 1)  # Proxy between 0-90%
            else:
                derived_attendance = 80.0

        derived_lms = lms if lms is not None else 75.0
        derived_engagement = engagement if engagement is not None else 70.0

        return self.calculate_success(
            student_id=student_id,
            academic=academic_score,
            attendance=derived_attendance,
            lms=derived_lms,
            engagement=derived_engagement,
            placement_readiness=placement_readiness,
        )

    def get_student_placement_readiness(
        self,
        student_id: str,
        aptitude: Optional[float] = None,
        coding: Optional[float] = None,
        mock_interviews: Optional[float] = None,
        technical_skills: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Calculates placement readiness for an existing student with defaults/proxies."""
        student = student_service.get_student_by_id(student_id)
        if not student:
            return {
                "student_id": student_id,
                "status": "insufficient_data",
                "readiness_score": None,
                "readiness_tier": None,
                "weight_coverage": 0.0,
                "components": {},
                "note": PLACEMENT_NOTE,
            }

        # If indicators not provided, use reasonable course-level proxies
        features = student.get("features", {})
        academic_score = extract_academic_score_from_uci(features) or 60.0

        apt = aptitude if aptitude is not None else round(min(100.0, academic_score * 0.9 + 10), 1)
        cod = coding if coding is not None else round(min(100.0, academic_score * 0.85 + 5), 1)
        mock = mock_interviews if mock_interviews is not None else 70.0
        tech = technical_skills if technical_skills is not None else round(min(100.0, academic_score * 0.95), 1)

        return self.calculate_placement(
            student_id=student_id,
            aptitude=apt,
            coding=cod,
            mock_interviews=mock,
            technical_skills=tech,
        )


scoring_service = ScoringService()
