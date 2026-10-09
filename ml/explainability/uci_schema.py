"""ml/explainability/uci_schema.py

Official schema definition for the UCI "Predict students' dropout and academic success" dataset.
Enforces Upgrade 1 of the Student360 Blueprint: Only real UCI columns are allowed.
Strictly disallows fictional columns (e.g. attendance, study_time).
"""

from __future__ import annotations

from typing import FrozenSet, List, Sequence, Set

# All 36 real feature columns from the official UCI Academic Success dataset:
UCI_ALL_FEATURES: Sequence[str] = (
    "Marital status",
    "Application mode",
    "Application order",
    "Course",
    "Daytime/evening attendance",
    "Previous qualification",
    "Previous qualification (grade)",
    "Nacionality",
    "Mother's qualification",
    "Father's qualification",
    "Mother's occupation",
    "Father's occupation",
    "Admission grade",
    "Displaced",
    "Educational special needs",
    "Debtor",
    "Tuition fees up to date",
    "Gender",
    "Scholarship holder",
    "Age at enrollment",
    "International",
    "Curricular units 1st sem (credited)",
    "Curricular units 1st sem (enrolled)",
    "Curricular units 1st sem (evaluations)",
    "Curricular units 1st sem (approved)",
    "Curricular units 1st sem (grade)",
    "Curricular units 1st sem (without evaluations)",
    "Curricular units 2nd sem (credited)",
    "Curricular units 2nd sem (enrolled)",
    "Curricular units 2nd sem (evaluations)",
    "Curricular units 2nd sem (approved)",
    "Curricular units 2nd sem (grade)",
    "Curricular units 2nd sem (without evaluations)",
    "Unemployment rate",
    "Inflation rate",
    "GDP",
)

# 1st Semester Curricular Unit columns:
UCI_SEM1_CURRICULAR_FEATURES: Sequence[str] = (
    "Curricular units 1st sem (credited)",
    "Curricular units 1st sem (enrolled)",
    "Curricular units 1st sem (evaluations)",
    "Curricular units 1st sem (approved)",
    "Curricular units 1st sem (grade)",
    "Curricular units 1st sem (without evaluations)",
)

# 2nd Semester Curricular Unit columns:
UCI_SEM2_CURRICULAR_FEATURES: Sequence[str] = (
    "Curricular units 2nd sem (credited)",
    "Curricular units 2nd sem (enrolled)",
    "Curricular units 2nd sem (evaluations)",
    "Curricular units 2nd sem (approved)",
    "Curricular units 2nd sem (grade)",
    "Curricular units 2nd sem (without evaluations)",
)

# Features available at the end of Semester 1 (Demographics + Socioeconomics + Sem 1 Curricular):
UCI_SEM1_ONLY_FEATURES: Sequence[str] = tuple(
    f for f in UCI_ALL_FEATURES if f not in UCI_SEM2_CURRICULAR_FEATURES
)

# Set of canonical UCI feature names (normalized to strip trailing whitespace/tabs):
UCI_CANONICAL_SET: FrozenSet[str] = frozenset(
    feat.strip() for feat in UCI_ALL_FEATURES
)

# Known prohibited/fictional columns that must never be allowed:
FICTIONAL_COLUMNS: FrozenSet[str] = frozenset([
    "attendance",
    "study_time",
    "studytime",
    "absences",
    "weekly_study_hours",
    "homework_completion",
    "lms_clicks",
    "quiz_score",
])


def normalize_feature_name(name: str) -> str:
    """Normalize a column name by stripping trailing whitespace and tabs.
    
    The raw UCI CSV sometimes contains 'Daytime/evening attendance\\t'.
    This normalizes it to 'Daytime/evening attendance'.
    """
    clean = name.strip()
    return clean


def validate_real_uci_features(
    feature_names: Sequence[str],
    raise_on_fictional: bool = True,
) -> List[str]:
    """Validate that features contain only real UCI column names.
    
    Args:
        feature_names: List or sequence of feature names to validate.
        raise_on_fictional: If True, raises ValueError when a fictional column is found.
        
    Returns:
        List of normalized valid UCI feature names.
        
    Raises:
        ValueError: If prohibited fictional features or unrecognized columns are detected.
    """
    normalized: List[str] = []
    invalid_detected: List[str] = []
    fictional_detected: List[str] = []

    for raw_name in feature_names:
        norm = normalize_feature_name(raw_name)
        norm_lower = norm.lower()

        # Check for explicitly prohibited fictional names
        if norm_lower in FICTIONAL_COLUMNS or any(
            fic in norm_lower for fic in ["study_time", "studytime", "lms_click"]
        ):
            fictional_detected.append(raw_name)
        elif norm not in UCI_CANONICAL_SET:
            invalid_detected.append(raw_name)
        else:
            normalized.append(norm)

    if fictional_detected and raise_on_fictional:
        raise ValueError(
            f"Prohibited fictional features detected: {fictional_detected}. "
            "Per Student360 Blueprint Upgrade 1, only real UCI features are permitted "
            "(never attendance, study_time, or fabricated columns)."
        )

    if invalid_detected and raise_on_fictional:
        raise ValueError(
            f"Unrecognized non-UCI features detected: {invalid_detected}. "
            f"Allowed real features must be a subset of official UCI columns."
        )

    return normalized
