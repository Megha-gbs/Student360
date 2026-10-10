"""
SHAP Explainability Service Adapter.
Connects FastAPI to Smruthi's ML explainability engine (ml.explainability).
Strictly uses real UCI features and respects the frozen JSON contracts.
"""

import logging
from typing import Any, Dict, List, Optional

from backend.app.services.model_service import model_service

logger = logging.getLogger("student360.backend.shap_service")

# Attempt dynamic import of Smruthi's explainability module
try:
    from ml.explainability import (
        StudentSHAPExplainer,
        explain_student_risk,
        compute_cohort_global_shap,
    )
    SMRUTHI_SHAP_AVAILABLE = True
except ImportError as exc:
    logger.warning("Smruthi's explainability package not available: %s", exc)
    SMRUTHI_SHAP_AVAILABLE = False


class SHAPService:
    """Service adapter delegating to Smruthi's StudentSHAPExplainer."""

    def __init__(self):
        self._explainer: Optional[Any] = None

    def _get_explainer(self) -> Optional[Any]:
        """Lazy initialization and caching of Smruthi's Explainer instance."""
        if not SMRUTHI_SHAP_AVAILABLE:
            return None

        if self._explainer is None:
            try:
                model, preprocessor = model_service.load_artifacts()
                self._explainer = StudentSHAPExplainer(
                    model=model,
                    preprocessor=preprocessor,
                )
            except Exception as e:
                logger.error("Failed to initialize StudentSHAPExplainer: %s", e)
                return None
        return self._explainer

    def explain_student(
        self,
        student_features: Dict[str, Any],
        top_k: int = 5,
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Computes top 3-5 SHAP risk reasons for an individual student.
        Returns None or empty if explainability engine is not integrated.
        """
        if not SMRUTHI_SHAP_AVAILABLE:
            return None

        try:
            explainer = self._get_explainer()
            if explainer is not None:
                resp = explainer.explain_student(student_features, top_k=top_k)
                data = resp.to_dict()
                return data.get("top_reasons", [])
            else:
                model = model_service.get_model()
                res = explain_student_risk(model=model, student_data=student_features, top_k=top_k)
                return res.get("top_reasons", [])
        except Exception as exc:
            logger.error("Error computing student SHAP explanations: %s", exc)
            return None

    def explain_cohort(
        self,
        cohort_features: List[Dict[str, Any]],
        top_k: int = 10,
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Computes cohort-wide global SHAP importance (mean absolute SHAP).
        Returns None if not integrated.
        """
        if not SMRUTHI_SHAP_AVAILABLE or not cohort_features:
            return None

        # Sample representative records for large cohort to ensure sub-100ms response time
        eval_features = cohort_features
        if len(cohort_features) > 200:
            step = max(1, len(cohort_features) // 200)
            eval_features = cohort_features[::step][:200]

        try:
            explainer = self._get_explainer()
            if explainer is not None:
                return explainer.get_global_shap_list(eval_features, top_k=top_k)
            else:
                model = model_service.get_model()
                res = compute_cohort_global_shap(model=model, cohort_data=eval_features, top_k=top_k)
                return res.get("global_shap", [])
        except Exception as exc:
            logger.error("Error computing cohort global SHAP: %s", exc)
            return None


# Global singleton instance
shap_service = SHAPService()
