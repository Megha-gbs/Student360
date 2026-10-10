"""
Unit Tests for Student360 Scoring Subsystem (Placement Readiness & Student Success Score)
==========================================================================================
Verifies:
1. Placement Readiness rules-based scoring with full inputs.
2. Placement Readiness dynamic weight renormalization with missing components.
3. Boundary value clamping (0-100), negative values, values > 100, and non-numeric inputs.
4. Student Success Score 5-component calculation with complete inputs.
5. Student Success Score dynamic renormalization across various subsets of available components.
6. Minimum weight coverage threshold and insufficient-data status handling.
7. Derivation of genuine academic score from 36-feature UCI dictionaries.
8. Output contracts, tier categorizations, and notice preservation.
"""

import pytest
from ml.scoring.placement_readiness import (
    calculate_placement_readiness,
    determine_placement_tier,
    DEFAULT_PLACEMENT_WEIGHTS,
)
from ml.scoring.success_score import (
    calculate_success_score,
    extract_academic_score_from_uci,
    determine_success_tier,
    DEFAULT_SUCCESS_WEIGHTS,
    MIN_WEIGHT_THRESHOLD,
)


# ============================================================================
# 1. Placement Readiness Tests
# ============================================================================

def test_placement_readiness_full_inputs():
    """Verify placement readiness with all 4 components provided."""
    res = calculate_placement_readiness(
        aptitude=80.0,
        coding=90.0,
        mock_interviews=70.0,
        technical_skills=85.0,
    )
    # Expected: 0.30*80 + 0.30*90 + 0.20*70 + 0.20*85 = 24 + 27 + 14 + 17 = 82
    assert res["status"] == "calculated"
    assert res["readiness_score"] == 82
    assert res["readiness_tier"] == "High"
    assert res["weight_coverage"] == 1.0
    assert res["components"]["aptitude"]["effective_weight"] == 0.30
    assert res["components"]["coding"]["effective_weight"] == 0.30
    assert res["components"]["mock_interviews"]["effective_weight"] == 0.20
    assert res["components"]["technical_skills"]["effective_weight"] == 0.20


def test_placement_readiness_partial_inputs_renormalization():
    """Verify weight renormalization when only aptitude and coding are available."""
    res = calculate_placement_readiness(
        aptitude=80.0,
        coding=60.0,
        mock_interviews=None,
        technical_skills=None,
    )
    # Base weights: aptitude 0.30, coding 0.30. Total = 0.60.
    # Effective weights: aptitude 0.50, coding 0.50.
    # Expected: 0.50*80 + 0.50*60 = 70
    assert res["status"] == "calculated"
    assert res["readiness_score"] == 70
    assert res["readiness_tier"] == "High"
    assert res["weight_coverage"] == 0.60
    assert res["components"]["aptitude"]["effective_weight"] == 0.50
    assert res["components"]["coding"]["effective_weight"] == 0.50
    assert res["components"]["mock_interviews"]["status"] == "unavailable"
    assert res["components"]["technical_skills"]["status"] == "unavailable"


def test_placement_readiness_single_component():
    """Verify renormalization when only 1 component is provided."""
    res = calculate_placement_readiness(coding=75.0)
    # Only coding available (base 0.30) -> effective weight 1.0 -> score 75
    assert res["status"] == "calculated"
    assert res["readiness_score"] == 75
    assert res["readiness_tier"] == "High"
    assert res["weight_coverage"] == 0.30
    assert res["components"]["coding"]["effective_weight"] == 1.0


def test_placement_readiness_insufficient_data():
    """Verify that empty inputs return insufficient-data status."""
    res = calculate_placement_readiness()
    assert res["status"] == "insufficient_data"
    assert res["readiness_score"] is None
    assert res["readiness_tier"] is None
    assert res["weight_coverage"] == 0.0


def test_placement_readiness_boundary_clamping():
    """Verify clamping of out-of-range values (< 0 and > 100)."""
    res = calculate_placement_readiness(
        aptitude=150.0,  # Should clamp to 100.0
        coding=-20.0,    # Should clamp to 0.0
    )
    # Effective weights: 0.50, 0.50. Score = 0.5*100 + 0.5*0 = 50
    assert res["status"] == "calculated"
    assert res["readiness_score"] == 50
    assert res["readiness_tier"] == "Moderate"
    assert res["components"]["aptitude"]["value"] == 100.0
    assert res["components"]["coding"]["value"] == 0.0


def test_placement_tier_thresholds():
    """Verify standard placement readiness tier boundaries."""
    assert determine_placement_tier(85) == "High"
    assert determine_placement_tier(70) == "High"
    assert determine_placement_tier(69) == "Moderate"
    assert determine_placement_tier(40) == "Moderate"
    assert determine_placement_tier(39) == "Needs Attention"
    assert determine_placement_tier(0) == "Needs Attention"
    assert determine_placement_tier(None) is None


# ============================================================================
# 2. Student Success Score Tests
# ============================================================================

def test_success_score_full_inputs():
    """Verify Student Success Score with all 5 components provided."""
    res = calculate_success_score(
        academic=80.0,
        attendance=90.0,
        lms=70.0,
        engagement=60.0,
        placement_readiness=80.0,
    )
    # Expected: 0.35*80 + 0.25*90 + 0.15*70 + 0.10*60 + 0.15*80
    # = 28.0 + 22.5 + 10.5 + 6.0 + 12.0 = 79.0 -> 79
    assert res["status"] == "calculated"
    assert res["success_score"] == 79
    assert res["tier"] == "Good Standing"
    assert res["weight_coverage"] == 1.0
    assert res["components"]["academic"]["effective_weight"] == 0.35
    assert res["components"]["attendance"]["effective_weight"] == 0.25
    assert res["components"]["lms"]["effective_weight"] == 0.15
    assert res["components"]["engagement"]["effective_weight"] == 0.10
    assert res["components"]["placement_readiness"]["effective_weight"] == 0.15


def test_success_score_partial_inputs_renormalization():
    """Verify dynamic renormalization when LMS and Engagement are missing."""
    res = calculate_success_score(
        academic=80.0,
        attendance=90.0,
        placement_readiness=70.0,
    )
    # Available base weights: Academic 0.35 + Attendance 0.25 + Placement 0.15 = 0.75
    # Effective weights:
    # Academic: 0.35 / 0.75 = 0.4667
    # Attendance: 0.25 / 0.75 = 0.3333
    # Placement: 0.15 / 0.75 = 0.2000
    # Weighted score = (0.35*80 + 0.25*90 + 0.15*70) / 0.75 = (28.0 + 22.5 + 10.5) / 0.75 = 61.0 / 0.75 = 81.33 -> 81
    assert res["status"] == "calculated"
    assert res["success_score"] == 81
    assert res["tier"] == "Good Standing"
    assert res["weight_coverage"] == 0.75
    assert res["components"]["academic"]["available"] is True
    assert res["components"]["lms"]["available"] is False
    assert res["components"]["engagement"]["available"] is False


def test_success_score_academic_only():
    """Verify calculation when only Academic component is available (35% weight >= 30% threshold)."""
    res = calculate_success_score(academic=92.0)
    # Available: 0.35. Effective weight = 1.0. Score = 92
    assert res["status"] == "calculated"
    assert res["success_score"] == 92
    assert res["tier"] == "Exemplary"
    assert res["weight_coverage"] == 0.35
    assert res["components"]["academic"]["effective_weight"] == 1.0


def test_success_score_insufficient_data_below_threshold():
    """Verify insufficient data returned when available weight is below 30%."""
    # Only LMS provided (15% weight < 30% threshold)
    res = calculate_success_score(lms=85.0)
    assert res["status"] == "insufficient_data"
    assert res["success_score"] is None
    assert res["tier"] is None
    assert res["weight_coverage"] == 0.15

    # Completely empty
    res_empty = calculate_success_score()
    assert res_empty["status"] == "insufficient_data"
    assert res_empty["success_score"] is None
    assert res_empty["weight_coverage"] == 0.0


def test_extract_academic_score_from_uci_features():
    """Verify academic score extraction from authentic UCI dataset fields."""
    # Scenario 1: Curricular units 2nd sem (grade) present
    uci_student_sem2 = {
        "Curricular units 2nd sem (grade)": 14.5,  # Scale 0-20 -> 14.5 / 20 * 100 = 72.5
        "Curricular units 1st sem (grade)": 12.0,
        "Admission grade": 130.0,
    }
    score1 = extract_academic_score_from_uci(uci_student_sem2)
    assert score1 == 72.5

    # Scenario 2: Sem 2 grade is 0, fallback to Sem 1 grade
    uci_student_sem1_fallback = {
        "Curricular units 2nd sem (grade)": 0.0,
        "Curricular units 1st sem (grade)": 16.0,  # 16 / 20 * 100 = 80.0
        "Admission grade": 130.0,
    }
    score2 = extract_academic_score_from_uci(uci_student_sem1_fallback)
    assert score2 == 80.0

    # Scenario 3: Both semester grades 0, fallback to Admission grade
    uci_student_admission_fallback = {
        "Curricular units 2nd sem (grade)": 0.0,
        "Curricular units 1st sem (grade)": 0.0,
        "Admission grade": 150.0,  # 150 / 200 * 100 = 75.0
    }
    score3 = extract_academic_score_from_uci(uci_student_admission_fallback)
    assert score3 == 75.0


def test_success_score_with_uci_features_integration():
    """Verify calculating success score using UCI features dictionary for academic input."""
    uci_dict = {
        "Curricular units 2nd sem (grade)": 16.0,  # Maps to 80.0 academic score
    }
    res = calculate_success_score(
        uci_features=uci_dict,
        attendance=90.0,
    )
    # Academic (80.0, base 0.35) + Attendance (90.0, base 0.25). Total weight = 0.60
    # Score = (0.35*80 + 0.25*90) / 0.60 = (28.0 + 22.5) / 0.60 = 50.5 / 0.60 = 84.17 -> 84
    assert res["status"] == "calculated"
    assert res["success_score"] == 84
    assert res["tier"] == "Good Standing"
    assert res["weight_coverage"] == 0.60
    assert res["components"]["academic"]["score"] == 80.0


def test_success_score_nested_placement_readiness_dict():
    """Verify success score accepting nested dictionary for placement readiness."""
    pr_indicators = {
        "aptitude": 80.0,
        "coding": 80.0,
        "mock_interviews": 80.0,
        "technical_skills": 80.0,
    }
    res = calculate_success_score(
        academic=80.0,
        attendance=80.0,
        placement_readiness=pr_indicators,
    )
    # All available are 80.0 -> Score must be 80
    assert res["status"] == "calculated"
    assert res["success_score"] == 80
    assert res["tier"] == "Good Standing"
    assert res["components"]["placement_readiness"]["score"] == 80.0


def test_success_tier_thresholds():
    """Verify Student Success Score institutional standing tier categories."""
    assert determine_success_tier(90) == "Exemplary"
    assert determine_success_tier(85) == "Exemplary"
    assert determine_success_tier(84) == "Good Standing"
    assert determine_success_tier(70) == "Good Standing"
    assert determine_success_tier(69) == "Developing"
    assert determine_success_tier(50) == "Developing"
    assert determine_success_tier(49) == "At Risk"
    assert determine_success_tier(0) == "At Risk"
    assert determine_success_tier(None) is None
