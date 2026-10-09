"""
Trajectory Service Adapter.
Connects FastAPI to Smruthi's Real Sem1 -> Sem2 Trajectory Engine (ml.trajectory).
Strictly uses actual UCI curricular units and preserves frozen contracts.
"""

import logging
from typing import Any, Dict, Optional

from backend.app.services.model_service import model_service

logger = logging.getLogger("student360.backend.trajectory_service")

# Attempt dynamic import of Smruthi's trajectory module
try:
    from ml.trajectory import (
        Sem1Sem2TrajectoryGenerator,
        calculate_student_trend,
        generate_student_trajectory,
    )
    SMRUTHI_TRAJECTORY_AVAILABLE = True
except ImportError as exc:
    logger.warning("Smruthi's trajectory package not available: %s", exc)
    SMRUTHI_TRAJECTORY_AVAILABLE = False


class TrajectoryService:
    """Service adapter delegating to Smruthi's Sem1Sem2TrajectoryGenerator."""

    def __init__(self):
        self._generator: Optional[Any] = None

    def _get_generator(self) -> Optional[Any]:
        """Lazy initialization and caching of Trajectory Generator."""
        if not SMRUTHI_TRAJECTORY_AVAILABLE:
            return None

        if self._generator is None:
            try:
                # Sem1Sem2TrajectoryGenerator uses the pre-computed Sem 2 risk score
                # from Mohit's pipeline and computes calibrated Sem 1 risk
                self._generator = Sem1Sem2TrajectoryGenerator()
            except Exception as e:
                logger.error("Failed to initialize Sem1Sem2TrajectoryGenerator: %s", e)
                return None
        return self._generator

    def get_trajectory(
        self,
        student_features: Dict[str, Any],
        risk_score_sem2: Optional[int] = None,
        risk_score_sem1: Optional[int] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Generates 2-milestone trajectory dictionary (Sem 1 and Sem 2).
        Returns None if trajectory engine is not integrated.
        """
        if not SMRUTHI_TRAJECTORY_AVAILABLE:
            return None

        try:
            generator = self._get_generator()
            if generator is not None:
                resp = generator.generate_trajectory(
                    student_data=student_features,
                    risk_score_sem2=risk_score_sem2,
                    risk_score_sem1=risk_score_sem1,
                )
                return resp.to_dict()
            else:
                model = model_service.get_model()
                return generate_student_trajectory(
                    student_data=student_features,
                    model_full=model,
                    risk_score_sem2=risk_score_sem2,
                    risk_score_sem1=risk_score_sem1,
                )
        except Exception as exc:
            logger.error("Error generating student trajectory: %s", exc)
            return None

    def get_trend(
        self,
        trajectory_data_or_features: Any,
        risk_score_sem2: Optional[int] = None,
    ) -> Optional[str]:
        """
        Calculates trend: 'Deteriorating', 'Improving', or 'Stable'.
        """
        if not SMRUTHI_TRAJECTORY_AVAILABLE:
            return None

        try:
            if isinstance(trajectory_data_or_features, dict) and "points" in trajectory_data_or_features:
                return calculate_student_trend(trajectory_data_or_features)

            # Generate trajectory first
            traj = self.get_trajectory(trajectory_data_or_features, risk_score_sem2=risk_score_sem2)
            if traj is not None:
                return calculate_student_trend(traj)
            return None
        except Exception as exc:
            logger.error("Error calculating student trend: %s", exc)
            return None


# Global singleton instance
trajectory_service = TrajectoryService()
