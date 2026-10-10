"""backend/app/services/cohort_service.py

Cohort Service.
Aggregates dynamic predictions across all verified demo students.
Calculates risk distributions, global SHAP drivers, segments, and course breakdown
without hardcoding or synthetic assumptions.
"""

from collections import defaultdict
from typing import Any, Dict, List

from backend.app.services.model_service import model_service
from backend.app.services.shap_service import shap_service
from backend.app.services.student_service import student_service


class CohortService:
    """Computes dynamic cohort-wide analytics and SHAP drivers."""

    def __init__(self):
        self._cached_insights: Optional[Dict[str, Any]] = None
        self._last_count: int = 0

    def get_cohort_insights(self) -> Dict[str, Any]:
        """
        Loads all cohort students, runs real ML inference for each,
        and computes aggregate statistics, global SHAP, segments, and by-course metrics.
        """
        students = student_service.get_all_students()

        if self._cached_insights is not None and self._last_count == len(students):
            return self._cached_insights

        high_risk_count = 0
        medium_risk_count = 0
        low_risk_count = 0

        cohort_feature_list: List[Dict[str, Any]] = []
        course_counts: Dict[str, Dict[str, int]] = defaultdict(lambda: {"total": 0, "high": 0})
        
        segments = {
            "High academic risk (Approved units <= 2)": 0,
            "Financial risk (Debtor or Tuition overdue)": 0,
            "Retention transition risk (Age > 25)": 0,
            "High risk with declining trajectory": 0,
            "Strong academic standing (Approved units >= 10)": 0,
            "Placement preparation needed": 0,
        }

        for student in students:
            features = student.get("features", {})
            sid = str(student.get("demo_id") or student.get("student_id", "UNKNOWN"))

            # Predict dynamically using the loaded model
            pred = model_service.predict(features=features, student_id=sid)
            level = pred.get("risk_level", "Medium")
            is_high = (level == "High")

            if is_high:
                high_risk_count += 1
            elif level == "Medium":
                medium_risk_count += 1
            elif level == "Low":
                low_risk_count += 1

            # Course tracking
            course_id = str(features.get("Course", "Unknown"))
            course_counts[course_id]["total"] += 1
            if is_high:
                course_counts[course_id]["high"] += 1

            # Segments calculation from real UCI features & scores
            sem1_app = float(features.get("Curricular units 1st sem (approved)", 0))
            sem2_app = float(features.get("Curricular units 2nd sem (approved)", 0))
            debtor = float(features.get("Debtor", 0))
            tuition_ok = float(features.get("Tuition fees up to date", 1))
            age = float(features.get("Age at enrollment", 0))

            if sem2_app <= 2:
                segments["High academic risk (Approved units <= 2)"] += 1
            if debtor == 1 or tuition_ok == 0:
                segments["Financial risk (Debtor or Tuition overdue)"] += 1
            if age > 25:
                segments["Retention transition risk (Age > 25)"] += 1
            if is_high and sem2_app < sem1_app:
                segments["High risk with declining trajectory"] += 1
            if (sem1_app + sem2_app) >= 10:
                segments["Strong academic standing (Approved units >= 10)"] += 1
            if sem2_app <= 4:
                segments["Placement preparation needed"] += 1

            cohort_feature_list.append(features)

        total_students = len(students)

        # Compute Global SHAP feature importances using Smruthi's engine
        global_shap = shap_service.explain_cohort(cohort_feature_list, top_k=10)

        # Build segments list
        segment_list = [{"name": name, "count": cnt} for name, cnt in segments.items()]

        # Build by_course list
        COURSE_NAMES = {
            "171": "Animation and Multimedia Design (171)",
            "9254": "Agronomy (9254)",
            "9070": "Communication Design (9070)",
            "9773": "Veterinary Nursing (9773)",
            "9238": "Basic Education (9238)",
            "9147": "Management (9147)",
            "9003": "Social Service (9003)",
            "9119": "Informatics Engineering (9119)",
            "9500": "Nursing (9500)",
            "9085": "Journalism and Communication (9085)",
            "9239": "Tourism (9239)",
        }

        by_course_list = [
            {
                "course": COURSE_NAMES.get(str(c), f"Degree Program ({c})"),
                "count": data["total"],
                "total": data["total"],
                "high_risk_count": data["high"],
                "high_risk_pct": round(data["high"] / max(1, data["total"]), 2),
            }
            for c, data in sorted(course_counts.items(), key=lambda x: x[1]["total"], reverse=True)
        ]

        res = {
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
            "segments": segment_list,
            "by_course": by_course_list,
        }
        self._cached_insights = res
        self._last_count = total_students
        return res


# Global singleton instance
cohort_service = CohortService()
