"""backend/app/schemas.py

Pydantic Schemas for Student360 API.
Ensures strict validation, consistent API contracts, and seamless
alignment with the frozen Student360 Blueprint.
Includes models for Student Success Score, Placement Readiness, CSV Import Validation, and RBAC.
"""

from enum import Enum
from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Health Schema
# ---------------------------------------------------------------------------
class HealthResponse(BaseModel):
    status: str = Field(..., json_schema_extra={"example": "ok"})


# ---------------------------------------------------------------------------
# RBAC Schemas
# ---------------------------------------------------------------------------
class UserRole(str, Enum):
    STUDENT = "student"
    FACULTY = "faculty"
    ADMIN = "admin"


class UserProfile(BaseModel):
    user_id: str
    role: UserRole
    email: Optional[str] = None
    assigned_students: List[str] = Field(default_factory=list)


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
    """Full Student 360 payload conforming to frozen contract."""
    student_id: str = Field(..., description="Unique student identifier")
    risk_score: int = Field(..., ge=0, le=100, description="Dropout risk percentage score")
    risk_level: Literal["Low", "Medium", "High"] = Field(..., description="Categorical risk tier")
    dropout_probability: float = Field(..., ge=0.0, le=1.0, description="Model dropout probability")
    model_version: str = Field(..., description="ML model identifier version")
    trend: Optional[Literal["Deteriorating", "Improving", "Stable"]] = Field(
        None, description="Trajectory trend from Sem 1 to Sem 2"
    )
    top_reasons: Optional[List[SHAPReason]] = Field(None, description="Top SHAP feature explanations (3-5 items)")
    trajectory_data: Optional[TrajectoryData] = Field(None, description="Real Sem1 to Sem2 trajectory")
    dataset_row_index: Optional[int] = Field(None, description="Original index in UCI dataset if known")
    features: Optional[Dict[str, Any]] = Field(None, description="The 36 real UCI feature values")
    prediction: Optional[PredictionResult] = Field(None, description="Current ML model risk prediction")
    actual_outcome_reference: Optional[str] = Field(None, description="Ground truth outcome for demo verification")
    course_name: Optional[str] = Field(None, description="Degree course name")
    success_score: Optional[int] = Field(None, ge=0, le=100, description="Holistic Student Success Score")
    success_tier: Optional[str] = Field(None, description="Standing tier (Exemplary, Good Standing, Developing, At Risk)")
    placement_readiness: Optional[int] = Field(None, ge=0, le=100, description="Placement Readiness Score")
    placement_tier: Optional[str] = Field(None, description="Placement tier (High, Moderate, Needs Attention)")


class StudentListItem(BaseModel):
    student_id: str
    risk_score: int
    risk_level: Literal["Low", "Medium", "High"]
    dropout_probability: float
    model_version: str
    trend: Optional[Literal["Deteriorating", "Improving", "Stable"]] = None
    priority: Optional[str] = None
    course_name: Optional[str] = None
    success_score: Optional[int] = None
    placement_readiness: Optional[int] = None


class StudentListResponse(BaseModel):
    total: int
    students: List[StudentListItem]
    page: Optional[int] = None
    page_size: Optional[int] = None
    total_pages: Optional[int] = None


# ---------------------------------------------------------------------------
# Simulation Schemas (What-If Analysis)
# ---------------------------------------------------------------------------
class SimulationRequest(BaseModel):
    features: Optional[Dict[str, Any]] = Field(None, description="Full modified 36 real UCI features")
    changes: Optional[Dict[str, Any]] = Field(None, description="Partial feature delta for what-if simulation")
    student_id: Optional[str] = Field(None, description="Optional student reference ID")


class SimulationResponse(BaseModel):
    student_id: str
    original_risk: Optional[int] = Field(None, description="Original risk score before changes")
    simulated_risk: Optional[int] = Field(None, description="Simulated risk score after changes")
    risk_score: int = Field(..., description="Current simulated risk score")
    risk_level: Literal["Low", "Medium", "High"] = Field(..., description="Categorical risk tier")
    dropout_probability: float = Field(..., description="Dropout probability after simulation")
    model_version: str = Field(..., description="Model version")
    simulation: bool = Field(True, description="Explicit marker indicating this is a simulation")
    simulation_type: str = Field("model_based_counterfactual", description="Simulation methodology")
    note: str = Field(
        "Model-based simulation using modified feature inputs; does not represent a causal intervention or guaranteed outcome.",
        description="Scientific simulation disclaimer",
    )


# ---------------------------------------------------------------------------
# Intervention Schemas
# ---------------------------------------------------------------------------
class InterventionRequest(BaseModel):
    student_id: Optional[str] = None
    intervention_type: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    approved: Optional[bool] = None
    notes: Optional[str] = None
    current_risk: Optional[float] = None


class InterventionResponse(BaseModel):
    student_id: str
    intervention_type: str
    category: str
    draft: str
    status: Literal["drafted", "approved", "rejected", "not_integrated"] = "drafted"
    requires_human_approval: bool = True
    human_approved: bool = False
    recommended_actions: List[str] = Field(default_factory=list)
    message: Optional[str] = None


class SimulatedOutcomeResponse(BaseModel):
    student_id: str
    simulated_risk_score: int
    simulated_risk_level: str
    status: str = "simulated"
    badge: str = "SIMULATED DEMONSTRATION OUTCOME"
    note: str = "Simulated demonstration outcome post-intervention; not real intervention evidence."


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


class CohortSegment(BaseModel):
    name: str
    count: int


class CourseRiskItem(BaseModel):
    course: str
    count: int
    high_risk_pct: float


class CohortInsightsResponse(BaseModel):
    total_students: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    risk_distribution: RiskDistribution
    global_shap: Optional[List[GlobalSHAPItem]] = None
    segments: Optional[List[CohortSegment]] = None
    by_course: Optional[List[CourseRiskItem]] = None


# ---------------------------------------------------------------------------
# Student Success Score & Placement Readiness Schemas
# ---------------------------------------------------------------------------
class PlacementReadinessRequest(BaseModel):
    student_id: Optional[str] = Field(None, description="Optional student reference ID")
    aptitude: Optional[float] = Field(None, ge=0.0, le=100.0, description="Aptitude score (0-100)")
    coding: Optional[float] = Field(None, ge=0.0, le=100.0, description="Coding assessment score (0-100)")
    mock_interviews: Optional[float] = Field(None, ge=0.0, le=100.0, description="Mock interview score (0-100)")
    technical_skills: Optional[float] = Field(None, ge=0.0, le=100.0, description="Technical skills score (0-100)")
    weights: Optional[Dict[str, float]] = Field(None, description="Optional custom component weights")


class PlacementReadinessResponse(BaseModel):
    student_id: Optional[str] = None
    status: Literal["calculated", "insufficient_data"]
    readiness_score: Optional[int] = Field(None, ge=0, le=100)
    readiness_tier: Optional[Literal["High", "Moderate", "Needs Attention"]] = None
    weight_coverage: float = Field(..., ge=0.0, le=1.0)
    components: Dict[str, Any]
    note: str


class SuccessScoreRequest(BaseModel):
    student_id: Optional[str] = Field(None, description="Optional student reference ID")
    academic: Optional[float] = Field(None, ge=0.0, le=100.0, description="Academic performance score (0-100)")
    attendance: Optional[float] = Field(None, ge=0.0, le=100.0, description="Attendance rate (0-100)")
    lms: Optional[float] = Field(None, ge=0.0, le=100.0, description="LMS platform engagement (0-100)")
    engagement: Optional[float] = Field(None, ge=0.0, le=100.0, description="Extracurricular / campus engagement (0-100)")
    placement_readiness: Optional[float] = Field(None, ge=0.0, le=100.0, description="Placement readiness index (0-100)")
    weights: Optional[Dict[str, float]] = Field(None, description="Optional custom weights")


class SuccessScoreResponse(BaseModel):
    student_id: Optional[str] = None
    status: Literal["calculated", "insufficient_data"]
    success_score: Optional[int] = Field(None, ge=0, le=100)
    standing_tier: Optional[Literal["Exemplary", "Good Standing", "Developing", "At Risk"]] = None
    weight_coverage: float = Field(..., ge=0.0, le=1.0)
    components: Dict[str, Any]
    notice: str


# ---------------------------------------------------------------------------
# CSV Import Validation Schemas
# ---------------------------------------------------------------------------
class CSVRowError(BaseModel):
    row: int
    student_id: Optional[str] = None
    field: Optional[str] = None
    error: str


class CSVValidationResponse(BaseModel):
    filename: str
    total_rows: int
    accepted_rows: int
    rejected_rows: int
    is_valid: bool
    preview_only: bool
    duplicate_ids: List[str] = Field(default_factory=list)
    missing_columns: List[str] = Field(default_factory=list)
    errors: List[CSVRowError] = Field(default_factory=list)
    preview_sample: Optional[List[Dict[str, Any]]] = None
    message: str
