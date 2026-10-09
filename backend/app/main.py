"""
Student360 FastAPI Backend Application.
Entry point for ML inference, explainability, trajectory, and cohort insights APIs.
"""

from contextlib import asynccontextmanager
import logging
import sys
from pathlib import Path

# Ensure project root is in sys.path so ml.* modules are resolvable
_project_root = Path(__file__).resolve().parent.parent.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.config import (
    ALLOWED_ORIGINS,
    PROJECT_NAME,
)
from backend.app.routes import (
    cohort_router,
    intervention_router,
    simulation_router,
    students_router,
)
from backend.app.schemas import HealthResponse
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
    """Warm up cached artifacts and demo students during startup."""
    logger.info("Initializing Student360 ML backend...")
    try:
        model_service.load_artifacts()
        student_service._ensure_loaded()
        logger.info("Artifacts and demo students successfully preloaded.")
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
        "and cohort-wide analytics."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handler for unhandled errors
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


# Register Routers
app.include_router(students_router)
app.include_router(simulation_router)
app.include_router(intervention_router)
app.include_router(cohort_router)
