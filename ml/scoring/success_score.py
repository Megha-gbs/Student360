"""
Student360 Student Success Score Module
========================================
Holistic scoring engine calculating the multi-dimensional Student Success Score (0-100).
Combines Academic performance, Attendance, LMS interaction, Engagement, and Placement Readiness.
Supports dynamic weight renormalization for missing institutional data and boundary checks.
"""

from typing import Any, Dict, Optional, Union
from ml.scoring.placement_readiness import (
    calculate_placement_readiness,
    _clamp_score
)


# Default provisional component weights
DEFAULT_SUCCESS_WEIGHTS: Dict[str, float] = {
    "academic": 0.35,
    "attendance": 0.25,
    "lms": 0.15,
    "engagement": 0.10,
    "placement_readiness": 0.15,
}

# Minimum available weight coverage required to produce a valid score (30%)
MIN_WEIGHT_THRESHOLD: float = 0.30

SUCCESS_NOTICE: str = (
    "Provisional institutional weights for hackathon demonstration; "
    "evaluates multi-dimensional holistic student standing and is strictly distinct from the "
    "XGBoost machine learning dropout risk probability."
)


def extract_academic_score_from_uci(features: Dict[str, Any]) -> Optional[float]:
    """
    Derives an academic performance score (0-100) from genuine UCI features:
    - Prefers 2nd semester grade (scale 0-20 -> mapped to 0-100)
    - Fallback to 1st semester grade (scale 0-20 -> mapped to 0-100)
    - Fallback to Admission grade (scale 0-200 -> mapped to 0-100)
    """
    if not isinstance(features, dict):
        return None

    sem2_grade = features.get("Curricular units 2nd sem (grade)")
    if sem2_grade is not None:
        try:
            g = float(sem2_grade)
            if g > 0.0:
                return _clamp_score((g / 20.0) * 100.0)
        except (ValueError, TypeError):
            pass

    sem1_grade = features.get("Curricular units 1st sem (grade)")
    if sem1_grade is not None:
        try:
            g = float(sem1_grade)
            if g > 0.0:
                return _clamp_score((g / 20.0) * 100.0)
        except (ValueError, TypeError):
            pass

    admission_grade = features.get("Admission grade")
    if admission_grade is not None:
        try:
            ag = float(admission_grade)
            if ag > 0.0:
                return _clamp_score((ag / 200.0) * 100.0)
        except (ValueError, TypeError):
            pass

    return None


def determine_success_tier(success_score: Optional[int]) -> Optional[str]:
    """
    Categorizes the student success score into standard institutional standing tiers.
    - Exemplary: >= 85
    - Good Standing: 70 - 84
    - Developing: 50 - 69
    - At Risk: < 50
    """
    if success_score is None:
        return None
    if success_score >= 85:
        return "Exemplary"
    elif success_score >= 70:
        return "Good Standing"
    elif success_score >= 50:
        return "Developing"
    else:
        return "At Risk"


def calculate_success_score(
    components: Optional[Dict[str, Any]] = None,
    academic: Optional[Union[int, float]] = None,
    attendance: Optional[Union[int, float]] = None,
    lms: Optional[Union[int, float]] = None,
    engagement: Optional[Union[int, float]] = None,
    placement_readiness: Optional[Union[int, float, Dict[str, Any]]] = None,
    uci_features: Optional[Dict[str, Any]] = None,
    weights: Optional[Dict[str, float]] = None,
    min_weight_coverage: float = MIN_WEIGHT_THRESHOLD,
) -> Dict[str, Any]:
    """
    Calculates the multi-dimensional Student Success Score (0 to 100).

    Dynamic Behavior:
    - Normalizes scores to 0-100.
    - If institutional fields are absent, recalculates effective weights across available components.
    - If available weight coverage < min_weight_coverage, returns status='insufficient_data'.

    Parameters:
    - components: Optional dictionary of raw component values.
    - academic, attendance, lms, engagement, placement_readiness: Specific component scores (0-100).
    - uci_features: Optional 36-feature UCI dict to extract genuine academic grade if academic not provided.
    - weights: Optional custom component weight mapping.
    - min_weight_coverage: Minimum required fraction of available weights (default 0.30).

    Returns:
    - Dict with success_score, tier, status, weight_coverage, components, and notice.
    """
    raw_inputs = dict(components or {})

    # Direct arguments override dictionary values
    if academic is not None:
        raw_inputs["academic"] = academic
    elif "academic" not in raw_inputs and uci_features:
        raw_inputs["academic"] = extract_academic_score_from_uci(uci_features)

    if attendance is not None:
        raw_inputs["attendance"] = attendance
    if lms is not None:
        raw_inputs["lms"] = lms
    if engagement is not None:
        raw_inputs["engagement"] = engagement

    if placement_readiness is not None:
        if isinstance(placement_readiness, dict):
            # Evaluate placement readiness dict if structured
            pr_res = calculate_placement_readiness(indicators=placement_readiness)
            raw_inputs["placement_readiness"] = pr_res["readiness_score"]
        else:
            raw_inputs["placement_readiness"] = placement_readiness

    active_weights = dict(weights or DEFAULT_SUCCESS_WEIGHTS)

    # Process and clamp each component
    processed_components: Dict[str, Dict[str, Any]] = {}
    available_weight_sum = 0.0

    for key, base_w in active_weights.items():
        val = raw_inputs.get(key)
        clamped = _clamp_score(val)

        if clamped is not None:
            available_weight_sum += base_w
            processed_components[key] = {
                "score": round(clamped, 2),
                "base_weight": base_w,
                "effective_weight": 0.0,
                "available": True,
            }
        else:
            processed_components[key] = {
                "score": None,
                "base_weight": base_w,
                "effective_weight": 0.0,
                "available": False,
            }

    # Insufficient data check
    if available_weight_sum < min_weight_coverage:
        return {
            "success_score": None,
            "tier": None,
            "status": "insufficient_data",
            "weight_coverage": round(available_weight_sum, 4),
            "components": processed_components,
            "notice": SUCCESS_NOTICE,
        }

    # Renormalize weights across available components
    weighted_sum = 0.0
    for key, comp in processed_components.items():
        if comp["available"]:
            effective_w = comp["base_weight"] / available_weight_sum
            comp["effective_weight"] = round(effective_w, 4)
            weighted_sum += comp["score"] * effective_w

    success_score = int(round(weighted_sum))
    success_score = max(0, min(100, success_score))
    tier = determine_success_tier(success_score)

    return {
        "success_score": success_score,
        "tier": tier,
        "status": "calculated",
        "weight_coverage": round(available_weight_sum, 4),
        "components": processed_components,
        "notice": SUCCESS_NOTICE,
    }
