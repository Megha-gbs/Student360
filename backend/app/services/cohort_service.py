"""
Cohort Service.
Aggregates dynamic predictions across all verified demo students.
Calculates risk distributions and global SHAP drivers without hardcoding.
"""

from typing import Any, Dict, List

from backend.app.services.model_service import model_service
from backend.app.services.shap_service import shap_service
from backend.app.services.student_service import student_service


class CohortService:
    """Computes dynamic cohort-wide analytics and SHAP drivers."""

    def get_cohort_insights(self) -> Dict[str, Any]:
        """
        Loads all demo students, runs real ML inference for each,
        and computes aggregate statistics.
        """
        students = student_service.get_all_students()

        high_risk_count = 0
        medium_risk_count = 0
        low_risk_count = 0

        cohort_feature_list: List[Dict[str, Any]] = []

        for student in students:
            features = student.get("features", {})
            sid = str(student.get("demo_id") or student.get("student_id", "UNKNOWN"))

            # Predict dynamically using the loaded model
            pred = model_service.predict(features=features, student_id=sid)
            level = pred.get("risk_level", "Medium")

            if level == "High":
                high_risk_count += 1
            elif level == "Medium":
                medium_risk_count += 1
            elif level == "Low":
                low_risk_count += 1

            cohort_feature_list.append(features)

        total_students = len(students)

        # Compute Global SHAP feature importances using Smruthi's engine
        global_shap = shap_service.explain_cohort(cohort_feature_list, top_k=10)

        return {
            "total_students": total_students,
            "high_risk_count": high_risk_count,
            "medium_risk_count": medium_risk_count,
            "low_risk_count": low_risk_count,
            "risk_distribution": {
                "High": high_risk_count,
                "Medium": medium_risk_count,
                "Low": low_risk_count,
            },
            "global_shap": global_shap,
        }


# Global singleton instance
cohort_service = CohortService()
