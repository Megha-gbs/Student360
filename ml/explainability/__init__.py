"""ml/explainability/

SHAP Explainability Package for Student360.
Strictly adheres to the Student360 Winning-Ready Blueprint (Smruthi's Scope).
"""

from ml.explainability.explainer import (
    StudentSHAPExplainer,
    compute_cohort_global_shap,
    explain_student_risk,
)
from ml.explainability.schemas import (
    GlobalSHAPItem,
    GlobalSHAPResponse,
    ImpactLevel,
    RiskDirection,
    SHAPReason,
    TopReasonsResponse,
)
from ml.explainability.uci_schema import (
    FICTIONAL_COLUMNS,
    UCI_ALL_FEATURES,
    UCI_CANONICAL_SET,
    UCI_SEM1_CURRICULAR_FEATURES,
    UCI_SEM1_ONLY_FEATURES,
    UCI_SEM2_CURRICULAR_FEATURES,
    normalize_feature_name,
    validate_real_uci_features,
)

__all__ = [
    "StudentSHAPExplainer",
    "explain_student_risk",
    "compute_cohort_global_shap",
    "SHAPReason",
    "TopReasonsResponse",
    "GlobalSHAPItem",
    "GlobalSHAPResponse",
    "ImpactLevel",
    "RiskDirection",
    "UCI_ALL_FEATURES",
    "UCI_SEM1_CURRICULAR_FEATURES",
    "UCI_SEM2_CURRICULAR_FEATURES",
    "UCI_SEM1_ONLY_FEATURES",
    "UCI_CANONICAL_SET",
    "FICTIONAL_COLUMNS",
    "normalize_feature_name",
    "validate_real_uci_features",
]
