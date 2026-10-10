"""ml/trajectory/schemas.py

Pydantic schemas and typed data contracts for Sem1 -> Sem2 real trajectory.
Adheres strictly to the Student360 Winning-Ready Blueprint contract.
"""

from __future__ import annotations

from typing import Any, List, Literal, Optional, Union
from pydantic import BaseModel, Field

SemesterName = Literal["Sem 1", "Sem 2"]


class TrajectoryPoint(BaseModel):
    """Represents a single academic semester milestone in the real student journey."""

    semester: SemesterName = Field(
        ...,
        description="Academic semester identifier ('Sem 1' or 'Sem 2')",
        examples=["Sem 1", "Sem 2"],
    )
    risk_score: int = Field(
        ...,
        ge=0,
        le=100,
        description="Predicted academic dropout risk percentage score (0-100)",
        examples=[41, 78],
    )
    approved_units: Union[int, float] = Field(
        ...,
        ge=0,
        description="Curricular units approved in this semester",
        examples=[5, 3],
    )
    grade: float = Field(
        ...,
        ge=0.0,
        le=20.0,
        description="Grade average achieved in this semester (0-20 scale in Portuguese higher ed)",
        examples=[12.3, 9.1],
    )
    enrolled_units: Optional[Union[int, float]] = Field(
        default=None,
        description="Optional: Curricular units enrolled in this semester",
        examples=[6, 6],
    )

    def to_dict(self, include_enrolled: bool = False) -> dict[str, Any]:
        """Serialize to a standard JSON-compatible Python dictionary.
        
        By default (include_enrolled=False), outputs the exact 4-field contract:
        {"semester": "...", "risk_score": ..., "approved_units": ..., "grade": ...}
        """
        data: dict[str, Any] = {
            "semester": self.semester,
            "risk_score": int(self.risk_score),
            "approved_units": int(self.approved_units) if float(self.approved_units).is_integer() else round(float(self.approved_units), 1),
            "grade": round(float(self.grade), 1),
        }
        if include_enrolled and self.enrolled_units is not None:
            data["enrolled_units"] = int(self.enrolled_units) if float(self.enrolled_units).is_integer() else round(float(self.enrolled_units), 1)
        return data


class TrajectoryResponse(BaseModel):
    """Real Sem1 -> Sem2 trajectory response matching frozen API contract."""

    trajectory_type: Literal["real_sem1_to_sem2"] = Field(
        default="real_sem1_to_sem2",
        description="Frozen trajectory type identifier",
    )
    points: List[TrajectoryPoint] = Field(
        ...,
        min_length=2,
        max_length=2,
        description="Exactly two milestone points: Sem 1 and Sem 2 (never weekly points)",
    )
    note: str = Field(
        default="Based on actual 1st vs 2nd semester curricular units from the dataset",
        description="Standard transparency disclaimer identifying real curricular units",
    )

    def to_dict(self, include_enrolled: bool = False) -> dict[str, Any]:
        """Serialize to exact JSON contract dictionary."""
        return {
            "trajectory_type": self.trajectory_type,
            "points": [p.to_dict(include_enrolled=include_enrolled) for p in self.points],
            "note": self.note,
        }
