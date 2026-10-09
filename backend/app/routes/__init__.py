"""
API Route Handlers for Student360.
"""

from backend.app.routes.students import router as students_router
from backend.app.routes.simulation import router as simulation_router
from backend.app.routes.intervention import router as intervention_router
from backend.app.routes.cohort import router as cohort_router

__all__ = [
    "students_router",
    "simulation_router",
    "intervention_router",
    "cohort_router",
]
