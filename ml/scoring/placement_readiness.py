"""
Student360 Placement Readiness Scoring Module
=============================================
Transparent rules-based scoring engine for student placement readiness.
Evaluates aptitude, coding proficiency, mock interviews, and technical skills.
Supports dynamic weight renormalization for missing indicators and boundary clamping.
"""

from typing import Any, Dict, Optional, Union


# Provisional weights for placement readiness indicators
DEFAULT_PLACEMENT_WEIGHTS: Dict[str, float] = {
    "aptitude": 0.30,
    "coding": 0.30,
    "mock_interviews": 0.20,
    "technical_skills": 0.20,
}

PLACEMENT_NOTE: str = (
    "Rules-based provisional readiness assessment based on available assessment indicators; "
    "does not predict guaranteed employment or company-specific hiring outcomes."
)


def _clamp_score(value: Optional[Union[int, float]]) -> Optional[float]:
    """Clamps assessment scores to a strict 0.0 - 100.0 scale."""
    if value is None:
        return None
    try:
        val_float = float(value)
        return max(0.0, min(100.0, val_float))
    except (ValueError, TypeError):
        return None


def determine_placement_tier(readiness_score: Optional[int]) -> Optional[str]:
    """
    Categorizes placement readiness score into standard operational tiers.
    - High: >= 70
    - Moderate: 40 - 69
    - Needs Attention: < 40
    """
    if readiness_score is None:
        return None
    if readiness_score >= 70:
        return "High"
    elif readiness_score >= 40:
        return "Moderate"
    else:
        return "Needs Attention"


def calculate_placement_readiness(
    indicators: Optional[Dict[str, Any]] = None,
    aptitude: Optional[Union[int, float]] = None,
    coding: Optional[Union[int, float]] = None,
    mock_interviews: Optional[Union[int, float]] = None,
    technical_skills: Optional[Union[int, float]] = None,
    weights: Optional[Dict[str, float]] = None,
) -> Dict[str, Any]:
    """
    Calculates the rules-based Placement Readiness Score (0 to 100).

    Parameters:
    - indicators: Optional dictionary containing indicator keys ('aptitude', 'coding', etc.)
    - aptitude, coding, mock_interviews, technical_skills: Individual component values (0-100)
    - weights: Optional custom weight mapping (defaults to 0.30/0.30/0.20/0.20)

    Returns:
    - Dict with readiness_score, readiness_tier, status, weight_coverage, components, and note.
    """
    input_dict = dict(indicators or {})

    # Direct arguments take precedence over dict entries
    if aptitude is not None or "aptitude" not in input_dict:
        input_dict["aptitude"] = aptitude if aptitude is not None else input_dict.get("aptitude")
    if coding is not None or "coding" not in input_dict:
        input_dict["coding"] = coding if coding is not None else input_dict.get("coding")
    if mock_interviews is not None or "mock_interviews" not in input_dict:
        input_dict["mock_interviews"] = mock_interviews if mock_interviews is not None else input_dict.get("mock_interviews")
    if technical_skills is not None or "technical_skills" not in input_dict:
        input_dict["technical_skills"] = technical_skills if technical_skills is not None else input_dict.get("technical_skills")

    active_weights = dict(weights or DEFAULT_PLACEMENT_WEIGHTS)

    # Process each indicator
    components: Dict[str, Dict[str, Any]] = {}
    available_weight_sum = 0.0

    for key, base_w in active_weights.items():
        raw_val = input_dict.get(key)
        clamped_val = _clamp_score(raw_val)

        if clamped_val is not None:
            available_weight_sum += base_w
            components[key] = {
                "value": round(clamped_val, 2),
                "weight": base_w,
                "effective_weight": 0.0,  # Updated below after renormalization
                "status": "available",
            }
        else:
            components[key] = {
                "value": None,
                "weight": base_w,
                "effective_weight": 0.0,
                "status": "unavailable",
            }

    # Handle insufficient data (zero indicators available)
    if available_weight_sum <= 0.0:
        return {
            "readiness_score": None,
            "readiness_tier": None,
            "status": "insufficient_data",
            "weight_coverage": 0.0,
            "components": components,
            "note": PLACEMENT_NOTE,
        }

    # Renormalize weights across available indicators
    weighted_sum = 0.0
    for key, comp in components.items():
        if comp["status"] == "available":
            effective_w = comp["weight"] / available_weight_sum
            comp["effective_weight"] = round(effective_w, 4)
            weighted_sum += comp["value"] * effective_w

    readiness_score = int(round(weighted_sum))
    readiness_score = max(0, min(100, readiness_score))
    readiness_tier = determine_placement_tier(readiness_score)

    return {
        "readiness_score": readiness_score,
        "readiness_tier": readiness_tier,
        "status": "calculated",
        "weight_coverage": round(available_weight_sum, 4),
        "components": components,
        "note": PLACEMENT_NOTE,
    }


if __name__ == "__main__":
    import json

    print("=" * 65)
    print("  STUDENT360 — PLACEMENT READINESS SCORE DEMONSTRATION")
    print("=" * 65)

    # Example 1: Full inputs
    demo_full = calculate_placement_readiness(
        aptitude=85.0,
        coding=90.0,
        mock_interviews=75.0,
        technical_skills=80.0,
    )
    print("\n[1] Full Assessment Profile (All 4 indicators available):")
    print(json.dumps(demo_full, indent=2))

    # Example 2: Partial inputs (renormalized weights)
    demo_partial = calculate_placement_readiness(
        aptitude=80.0,
        coding=70.0,
        mock_interviews=None,
        technical_skills=None,
    )
    print("\n[2] Partial Profile (Aptitude + Coding only, dynamically renormalized):")
    print(json.dumps(demo_partial, indent=2))

    # Example 3: Empty profile (insufficient data)
    demo_empty = calculate_placement_readiness()
    print("\n[3] Empty Profile (Insufficient Data State):")
    print(json.dumps(demo_empty, indent=2))
    print("\n" + "=" * 65)

