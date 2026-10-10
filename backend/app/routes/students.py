"""backend/app/routes/students.py

Student routes for querying student cohort list, priority queue, and detailed profiles.
Enforces Role-Based Access Control:
- Students may only view their own profile/records.
- Faculty members can access assigned students.
- Administrators have complete institutional access.
"""

from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status

from backend.app.core.security import (
    AuthenticatedUser,
    UserRole,
    get_current_user,
    verify_student_access,
)
from backend.app.schemas import (
    PredictionResult,
    SHAPReason,
    StudentListItem,
    StudentListResponse,
    StudentResponse,
    TrajectoryData,
)
from backend.app.services.model_service import model_service
from backend.app.services.scoring_service import scoring_service
from backend.app.services.shap_service import shap_service
from backend.app.services.student_service import student_service
from backend.app.services.trajectory_service import trajectory_service

COURSE_NAMES = {
    171: "Animation and Multimedia Design (171)",
    9254: "Agronomy (9254)",
    9070: "Communication Design (9070)",
    9773: "Veterinary Nursing (9773)",
    9238: "Basic Education (9238)",
    9147: "Management (9147)",
    9003: "Social Service (9003)",
    9119: "Informatics Engineering (9119)",
    9500: "Nursing (9500)",
    9085: "Journalism and Communication (9085)",
    9239: "Tourism (9239)",
}


def get_course_name(course_id: Any) -> str:
    try:
        cid = int(course_id)
        return COURSE_NAMES.get(cid, f"Degree Program ({cid})")
    except (ValueError, TypeError):
        return str(course_id) if course_id else "Degree Program"


router = APIRouter(tags=["Students"])


@router.get(
    "/students",
    response_model=StudentListResponse,
    summary="List all students with dynamic risk predictions",
    description="Loads verified cohort students, runs real inference through XGBoost model, and calculates trend and priority.",
)
@router.get(
    "/students/priority-queue",
    response_model=StudentListResponse,
    summary="Priority Queue: List students ranked by risk and urgency",
    description="Ranks students descending by risk score for early warning intervention triage.",
)
def list_students(
    page: Optional[int] = None,
    limit: Optional[int] = None,
    page_size: Optional[int] = None,
    search: Optional[str] = None,
    risk_level: Optional[str] = None,
    course: Optional[str] = None,
    sort_by: Optional[str] = None,
    order: Optional[str] = "desc",
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> StudentListResponse:
    """Fetch students with dynamic model predictions, ranked by risk score with pagination & filters."""
    raw_students = student_service.get_all_students()
    items = []

    search_term = search.strip().lower() if search else None
    target_risk = risk_level.strip().lower() if risk_level else None
    target_course = course.strip().lower() if course else None

    # Determine faculty assigned student boundary
    assigned_set = set(current_user.assigned_students) if current_user.role == UserRole.FACULTY and current_user.assigned_students else None

    for s in raw_students:
        sid = str(s.get("demo_id") or s.get("student_id"))

        # Role filtering: If logged in as student, only show own record
        if current_user.role == UserRole.STUDENT and sid != current_user.user_id:
            continue

        # Role filtering: If logged in as faculty with explicit assigned students, filter
        if assigned_set is not None and sid not in assigned_set:
            continue

        features = s.get("features", {})
        course_name = get_course_name(features.get("Course"))

        # Search filter
        if search_term and (search_term not in sid.lower() and search_term not in course_name.lower()):
            continue

        # Live prediction (instant via warm cache)
        pred = model_service.predict(features=features, student_id=sid)
        r_score = pred["risk_score"]
        r_level = pred["risk_level"]
        dropout_probability = pred["dropout_probability"]
        model_version = pred["model_version"]

        # Risk level filter
        if target_risk and r_level.lower() != target_risk:
            continue

        # Course filter
        if target_course and target_course not in course_name.lower() and target_course not in str(features.get("Course", "")).lower():
            continue

        # Trajectory trend
        trend = trajectory_service.get_trend(features, risk_score_sem2=r_score)

        # Operational priority: High risk -> High, Medium -> Medium, Low -> Low
        priority = r_level

        # Scoring indicators
        success_info = scoring_service.get_student_success_score(sid)
        placement_info = scoring_service.get_student_placement_readiness(sid)

        items.append(
            StudentListItem(
                student_id=sid,
                risk_score=r_score,
                risk_level=r_level,
                dropout_probability=dropout_probability,
                model_version=model_version,
                trend=trend,
                priority=priority,
                course_name=course_name,
                success_score=success_info.get("success_score"),
                placement_readiness=placement_info.get("readiness_score"),
            )
        )

    # Sorting
    is_reverse = (order or "desc").lower() == "desc"
    if sort_by == "student_id":
        items.sort(key=lambda s: s.student_id, reverse=is_reverse)
    elif sort_by == "dropout_probability":
        items.sort(key=lambda s: s.dropout_probability, reverse=is_reverse)
    elif sort_by == "success_score":
        items.sort(key=lambda s: s.success_score or 0, reverse=is_reverse)
    elif sort_by == "placement_readiness":
        items.sort(key=lambda s: s.placement_readiness or 0, reverse=is_reverse)
    else:
        # Default: Sort by risk_score descending
        items.sort(key=lambda s: s.risk_score, reverse=is_reverse)

    total_count = len(items)

    # Pagination logic
    eff_limit = limit or page_size
    if page is not None or eff_limit is not None:
        p_size = eff_limit if eff_limit and eff_limit > 0 else 50
        p_num = max(1, page or 1)
        start_idx = (p_num - 1) * p_size
        end_idx = start_idx + p_size
        paginated_items = items[start_idx:end_idx]
        import math
        total_pages = math.ceil(total_count / p_size) if p_size > 0 else 1
        return StudentListResponse(
            total=total_count,
            students=paginated_items,
            page=p_num,
            page_size=p_size,
            total_pages=total_pages,
        )

    return StudentListResponse(total=total_count, students=items)


@router.get(
    "/students/{student_id}",
    response_model=StudentResponse,
    summary="Get individual student risk details, SHAP reasons, trajectory, and holistic scores",
    description="Retrieves a verified student by ID, evaluates live ML model risk, attaches explainability, trajectory, and holistic scores.",
    responses={
        403: {
            "description": "Unauthorized access to student record",
            "content": {"application/json": {"example": {"detail": "Access denied."}}},
        },
        404: {
            "description": "Student not found",
            "content": {"application/json": {"example": {"detail": "Student S9999 not found"}}},
        },
    },
)
def get_student(
    student_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> StudentResponse:
    """Fetch individual student profile with dynamic predictions, SHAP, and trajectory."""
    raw = student_service.get_student_by_id(student_id)
    if raw is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student {student_id} not found",
        )

    # Enforce access boundaries on existing student record
    verify_student_access(student_id=student_id, current_user=current_user)

    sid = str(raw.get("demo_id") or raw.get("student_id", student_id))
    features = raw.get("features", {})
    row_index = raw.get("dataset_row_index")
    actual_outcome = raw.get("actual_outcome_reference")

    # Live model prediction
    pred_data = model_service.predict(features=features, student_id=sid)
    risk_score = pred_data["risk_score"]
    risk_level = pred_data["risk_level"]
    dropout_prob = pred_data["dropout_probability"]
    model_version = pred_data["model_version"]

    prediction = PredictionResult(
        student_id=pred_data["student_id"],
        risk_score=risk_score,
        risk_level=risk_level,
        dropout_probability=dropout_prob,
        model_version=model_version,
    )

    # Explainability: Top SHAP reasons from Smruthi's engine (grouped to original UCI features)
    top_reasons = shap_service.explain_student(student_features=features, top_k=5)

    # Trajectory: Real Sem1 -> Sem2 journey from Smruthi's engine
    trajectory_raw = trajectory_service.get_trajectory(
        student_features=features,
        risk_score_sem2=risk_score,
    )
    trajectory_data: Optional[TrajectoryData] = None
    if trajectory_raw is not None:
        trajectory_data = TrajectoryData(**trajectory_raw)

    # Trend calculation
    trend = trajectory_service.get_trend(trajectory_raw or features, risk_score_sem2=risk_score)

    # Holistic scoring calculation
    success_info = scoring_service.get_student_success_score(sid)
    placement_info = scoring_service.get_student_placement_readiness(sid)

    return StudentResponse(
        student_id=sid,
        risk_score=risk_score,
        risk_level=risk_level,
        dropout_probability=dropout_prob,
        model_version=model_version,
        trend=trend,
        top_reasons=top_reasons,
        trajectory_data=trajectory_data,
        dataset_row_index=row_index,
        features=features,
        prediction=prediction,
        actual_outcome_reference=actual_outcome,
        course_name=get_course_name(features.get("Course")),
        success_score=success_info.get("success_score"),
        success_tier=success_info.get("standing_tier"),
        placement_readiness=placement_info.get("readiness_score"),
        placement_tier=placement_info.get("readiness_tier"),
    )
