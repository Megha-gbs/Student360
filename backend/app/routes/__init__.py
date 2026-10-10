"""backend/app/routes/__init__.py

API Route Handlers for Student360.
"""

from backend.app.routes.assignments import router as assignments_router
from backend.app.routes.assistant import router as assistant_router
from backend.app.routes.attendance import router as attendance_router
from backend.app.routes.cohort import router as cohort_router
from backend.app.routes.college import router as college_router
from backend.app.routes.data_import import router as data_import_router
from backend.app.routes.intervention import router as intervention_router
from backend.app.routes.scoring import router as scoring_router
from backend.app.routes.simulation import router as simulation_router
from backend.app.routes.students import router as students_router

__all__ = [
    "assistant_router",
    "students_router",
    "simulation_router",
    "intervention_router",
    "cohort_router",
    "scoring_router",
    "data_import_router",
    "assignments_router",
    "attendance_router",
    "college_router",
]
