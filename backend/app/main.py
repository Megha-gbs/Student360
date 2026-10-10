"""backend/app/main.py

Student360 FastAPI Backend Application.
Entry point for ML inference, explainability, trajectory, holistic scoring,
cohort insights, RBAC security, and CSV validation APIs.
"""

from contextlib import asynccontextmanager
import logging
from pathlib import Path
import sys

# Ensure project root is in sys.path so ml.* modules are resolvable
_project_root = Path(__file__).resolve().parent.parent.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

from fastapi import Depends, FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.config import (
    ALLOWED_ORIGINS,
    PROJECT_NAME,
)
from backend.app.core.security import (
    AuthenticatedUser,
    get_current_user,
)
from backend.app.routes import (
    assignments_router,
    assistant_router,
    attendance_router,
    cohort_router,
    college_router,
    data_import_router,
    intervention_router,
    scoring_router,
    simulation_router,
    students_router,
)
from backend.app.schemas import HealthResponse, UserProfile
from backend.app.services.model_service import model_service
from backend.app.services.student_service import student_service

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("student360.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Warm up cached artifacts and cohort students during startup."""
    logger.info("Initializing Student360 ML backend...")
    try:
        model_service.load_artifacts()
        all_students = student_service.get_all_students()
        model_service.warm_cache_for_cohort(all_students)
        logger.info("Artifacts and %d cohort students successfully preloaded and warm cached.", len(all_students))
    except Exception as exc:
        logger.error("Error preloading artifacts on startup: %s", exc)
    yield
    logger.info("Shutting down Student360 ML backend.")


app = FastAPI(
    title=PROJECT_NAME,
    version="1.0.0",
    description=(
        "Production-ready FastAPI backend and API orchestration layer for the Student360 platform. "
        "Provides real XGBoost risk inference, SHAP explanations, Sem1->Sem2 trajectories, "
        "rules-based holistic Student Success Scores & Placement Readiness, RBAC access control, "
        "and cohort-wide analytics."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS Configuration - allow configured origins and local/Vercel regex
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS else ["*"],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$|^https://[a-zA-Z0-9_-]+\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Centralized exception handler for unhandled errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled server exception at %s: %s", request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"An internal server error occurred: {str(exc)}"},
    )


# Root Health Endpoint
@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["System"],
    summary="Service Health Check",
    description="Returns the operational status of the Student360 API service.",
)
def health_check() -> HealthResponse:
    """Check service health."""
    return HealthResponse(status="ok")


# Current user profile endpoint (RBAC identity verification)
@app.get(
    "/auth/me",
    response_model=UserProfile,
    tags=["Authentication"],
    summary="Get current authenticated user and permissions",
    description="Inspects caller role (Student, Faculty, Admin) and assigned student boundaries.",
)
def get_current_user_profile(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> UserProfile:
    """Returns caller profile and authorization context."""
    return UserProfile(
        user_id=current_user.user_id,
        role=current_user.role,
        email=current_user.email or f"{current_user.user_id.lower()}@campus.edu",
        assigned_students=current_user.assigned_students,
    )


# Register All Routers
app.include_router(students_router)
app.include_router(simulation_router)
app.include_router(intervention_router)
app.include_router(cohort_router)
app.include_router(scoring_router)
app.include_router(data_import_router)
app.include_router(assignments_router)
app.include_router(attendance_router)
app.include_router(college_router)
app.include_router(assistant_router)
