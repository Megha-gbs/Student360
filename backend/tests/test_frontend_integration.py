"""
Test for Frontend-Backend ML Integration.
Student360 (KPMG Challenge 04)

Asserts:
- GET /health
- GET /students/priority-queue
- GET /students/{id}
- POST /students/{id}/what-if
- POST /intervention
- GET /cohort/insights
- React Data Contract normalization & integrity
"""

from backend.tests.verify_frontend_integration import test_verify_frontend_backend_integration

def test_frontend_backend_integration_flow():
    """Pytest test case for frontend-backend integration."""
    test_verify_frontend_backend_integration()
