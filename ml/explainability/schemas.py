"""ml/explainability/schemas.py

Pydantic schemas and typed data contracts for SHAP explainability.
Adheres strictly to the Student360 Winning-Ready Blueprint contract.
"""

from __future__ import annotations

from typing import Any, List, Literal, Union
from pydantic import BaseModel, Field

ImpactLevel = Literal["high", "medium", "low"]
RiskDirection = Literal["increases_risk", "decreases_risk"]


class SHAPReason(BaseModel):
    """Represents a single risk-contributing feature identified via SHAP."""

    feature: str = Field(
        ...,
        description="Real UCI feature name explaining dropout risk",
        examples=["Curricular units 2nd sem (approved)", "Tuition fees up to date"],
    )
    value: Union[int, float, str, bool] = Field(
        ...,
        description="Observed feature value for this student",
        examples=[3, 0, 145.5],
    )
    impact: ImpactLevel = Field(
        ...,
        description="Relative magnitude of feature contribution to dropout risk",
        examples=["high", "medium", "low"],
    )
    direction: RiskDirection = Field(
        ...,
        description="Direction of impact on dropout risk (increases_risk or decreases_risk)",
        examples=["increases_risk", "decreases_risk"],
    )

    def to_dict(self) -> dict[str, Any]:
        """Serialize to a standard JSON-compatible Python dictionary."""
        if hasattr(self, "model_dump"):
            return self.model_dump()
        return self.dict()


class TopReasonsResponse(BaseModel):
    """Top 3-5 risk reasons returned for per-student Student 360 view."""

    top_reasons: List[SHAPReason] = Field(
        ...,
        description="Top 3 to 5 contributing features ranked by absolute SHAP impact",
    )

    def to_dict(self) -> dict[str, Any]:
        """Serialize to a standard JSON-compatible Python dictionary."""
        if hasattr(self, "model_dump"):
            return self.model_dump()
        return self.dict()


class GlobalSHAPItem(BaseModel):
    """Cohort-wide global importance item for a single feature."""

    feature: str = Field(
        ...,
        description="Real UCI feature name",
        examples=["Curricular units 2nd sem (approved)"],
    )
    mean_abs_shap: float = Field(
        ...,
        description="Mean absolute SHAP value across the entire cohort (mean |SHAP|)",
        examples=[0.18, 0.3842],
    )

    def to_dict(self) -> dict[str, Any]:
        """Serialize to a standard JSON-compatible Python dictionary."""
        if hasattr(self, "model_dump"):
            return self.model_dump()
        return self.dict()


class GlobalSHAPResponse(BaseModel):
    """Global SHAP summary for Cohort Insights screen."""

    global_shap: List[GlobalSHAPItem] = Field(
        ...,
        description="List of cohort feature importances sorted descending by mean_abs_shap",
    )

    def to_dict(self) -> dict[str, Any]:
        """Serialize to a standard JSON-compatible Python dictionary."""
        if hasattr(self, "model_dump"):
            return self.model_dump()
        return self.dict()
