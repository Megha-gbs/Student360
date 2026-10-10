"""
Student360 Scoring Subsystem
============================
Provides standalone rules-based scoring modules:
- calculate_placement_readiness: Evaluates aptitude, coding, mock interviews, skills.
- calculate_success_score: Holistic multi-dimensional student standing index.
"""

from ml.scoring.placement_readiness import (
    calculate_placement_readiness,
    determine_placement_tier,
    DEFAULT_PLACEMENT_WEIGHTS,
    PLACEMENT_NOTE,
)
from ml.scoring.success_score import (
    calculate_success_score,
    extract_academic_score_from_uci,
    determine_success_tier,
    DEFAULT_SUCCESS_WEIGHTS,
    MIN_WEIGHT_THRESHOLD,
    SUCCESS_NOTICE,
)

__all__ = [
    "calculate_placement_readiness",
    "determine_placement_tier",
    "DEFAULT_PLACEMENT_WEIGHTS",
    "PLACEMENT_NOTE",
    "calculate_success_score",
    "extract_academic_score_from_uci",
    "determine_success_tier",
    "DEFAULT_SUCCESS_WEIGHTS",
    "MIN_WEIGHT_THRESHOLD",
    "SUCCESS_NOTICE",
]
