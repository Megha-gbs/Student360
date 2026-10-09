"""
Pydantic Schemas for Student360 API.
Ensures strict validation and consistent API contract responses.
"""

from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Health Schema
# ---------------------------------------------------------------------------
class HealthResponse(BaseModel):
    status: str = Field(..., json_schema_extra={"example": "ok"})


# ---------------------------------------------------------------------------
# Prediction & Student Schemas
# ---------------------------------------------------------------------------
class PredictionResult(BaseModel):
    student_id: str = Field(..., description="Unique student identifier")
    risk_score: int = Field(..., ge=0, le=100, description="Risk score between 0 and 100")
    risk_level: Literal["Low", "Medium", "High"] = Field(..., description="Categorical risk tier")
    dropout_probability: float = Field(..., ge=0.0, le=1.0, description="Probability of dropout (0.0 to 1.0)")
    model_version: str = Field(..., description="ML model identifier version")


class SHAPReason(BaseModel):
    feature: str = Field(..., description="Real UCI feature name")
    value: Union[int, float, str, bool] = Field(..., description="Recorded feature value for the student")
    impact: Literal["high", "medium", "low"] = Field(..., description="Relative magnitude of feature contribution")
    direction: Literal["increases_risk", "decreases_risk"] = Field(
        ..., description="Direction of contribution towards dropout risk"
    )


class TrajectoryPoint(BaseModel):
    semester: Literal["Sem 1", "Sem 2"] = Field(..., description="Academic semester milestone")
    risk_score: int = Field(..., ge=0, le=100, description="Risk score at milestone")
    approved_units: Union[int, float] = Field(..., description="Curricular units approved in that semester")
    grade: float = Field(..., description="Curricular units grade average (0 to 20 scale)")
    enrolled_units: Optional[Union[int, float]] = Field(None, description="Curricular units enrolled")


class TrajectoryData(BaseModel):
    trajectory_type: Literal["real_sem1_to_sem2"] = Field(
        "real_sem1_to_sem2", description="Identifies 2-semester historical trajectory"
    )
    points: List[TrajectoryPoint] = Field(..., min_length=2, max_length=2, description="Sem 1 and Sem 2 data points")
    note: str = Field(
        "Based on actual 1st vs 2nd semester curricular units from the dataset",
        description="Mandatory data provenance note",
    )


class StudentResponse(BaseModel):
    student_id: str = Field(..., description="Unique student identifier")
    dataset_row_index: Optional[int] = Field(None, description="Original index in UCI dataset if known")
    features: Dict[str, Any] = Field(..., description="The 36 real UCI feature values")
    prediction: PredictionResult = Field(..., description="Current ML model risk prediction")
    actual_outcome_reference: Optional[str] = Field(None, description="Ground truth outcome for demo verification")
    trend: Optional[Literal["Deteriorating", "Improving", "Stable"]] = Field(
        None, description="Trajectory trend from Sem 1 to Sem 2"
    )
    top_reasons: Optional[List[SHAPReason]] = Field(None, description="Top SHAP feature explanations")
    trajectory_data: Optional[TrajectoryData] = Field(None, description="Sem1 to Sem2 trajectory")


class StudentListItem(BaseModel):
    student_id: str
    risk_score: int
    risk_level: Literal["Low", "Medium", "High"]
    dropout_probability: float
    model_version: str
    trend: Optional[Literal["Deteriorating", "Improving", "Stable"]] = None
    priority: Optional[str] = None


class StudentListResponse(BaseModel):
    total: int
    students: List[StudentListItem]


# ---------------------------------------------------------------------------
# Simulation Schemas (What-If Analysis)
# ---------------------------------------------------------------------------
class SimulationRequest(BaseModel):
    features: Dict[str, Any] = Field(..., description="Modified 36 real UCI features")
    student_id: Optional[str] = Field(None, description="Optional student reference ID")


class SimulationResponse(BaseModel):
    simulation: bool = Field(True, description="Explicit marker indicating this is a simulation")
    student_id: str
    risk_score: int
    risk_level: Literal["Low", "Medium", "High"]
    dropout_probability: float
    model_version: str
    note: str = Field(
        "Model-based simulation using modified feature inputs; does not represent a causal intervention or guaranteed outcome.",
        description="Scientific simulation disclaimer",
    )


# ---------------------------------------------------------------------------
# Intervention Schemas (Unintegrated Engine Placeholder)
# ---------------------------------------------------------------------------
class InterventionRequest(BaseModel):
    student_id: Optional[str] = None
    intervention_type: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None


class InterventionResponse(BaseModel):
    status: Literal["not_integrated"] = "not_integrated"
    message: str = "Intervention engine is not yet connected."


class SimulatedOutcomeResponse(BaseModel):
    status: Literal["not_integrated"] = "not_integrated"
    message: str = "Intervention engine is not yet connected."
    student_id: Optional[str] = None


# ---------------------------------------------------------------------------
# Cohort Insights Schemas
# ---------------------------------------------------------------------------
class GlobalSHAPItem(BaseModel):
    feature: str
    mean_abs_shap: float


class RiskDistribution(BaseModel):
    High: int
    Medium: int
    Low: int


class CohortInsightsResponse(BaseModel):
    total_students: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    risk_distribution: RiskDistribution
    global_shap: Optional[List[GlobalSHAPItem]] = None
