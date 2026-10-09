"""
Intervention Service Adapter.
Placeholder interface for the upcoming causal intervention engine.
Complies strictly with the No Hallucination Rule: does not fabricate causal effects,
intervention effectiveness, or outcome probabilities.
"""

from typing import Any, Dict, Optional


class InterventionService:
    """Manages intervention recommendations and causal outcome simulations."""

    def __init__(self):
        # When teammate provides the real intervention engine, connect here.
        self.is_connected: bool = False

    def process_intervention(
        self,
        student_id: Optional[str] = None,
        intervention_type: Optional[str] = None,
        parameters: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Executes an intervention strategy.
        Returns explicit 'not_integrated' status until actual module is connected.
        """
        return {
            "status": "not_integrated",
            "message": "Intervention engine is not yet connected.",
        }

    def simulate_outcome(
        self,
        student_id: str,
        student_features: Dict[str, Any],
        intervention_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Simulates causal outcome post-intervention.
        Returns explicit 'not_integrated' status without fabricating numbers.
        """
        return {
            "status": "not_integrated",
            "message": "Intervention engine is not yet connected.",
            "student_id": student_id,
        }


# Global singleton instance
intervention_service = InterventionService()
