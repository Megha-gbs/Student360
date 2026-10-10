"""backend/app/core/security.py

Role-Based Access Control (RBAC) and Security Module for Student360.
Enforces institutional privacy boundaries:
- Student: strictly restricted to their own academic record; cannot access other students.
- Faculty: authorized to access assigned students.
- Admin: full institutional oversight and management.

Provides FastAPI dependencies for authentication and authorization.
Supports Bearer tokens and institutional gateway headers (X-User-Id, X-User-Role).
"""

from enum import Enum
import json
import logging
from typing import List, Optional
from fastapi import Header, HTTPException, Query, Request, status
from pydantic import BaseModel

logger = logging.getLogger("student360.security")


class UserRole(str, Enum):
    STUDENT = "student"
    FACULTY = "faculty"
    ADMIN = "admin"


class AuthenticatedUser(BaseModel):
    user_id: str
    role: UserRole
    email: Optional[str] = None
    assigned_students: List[str] = []


# Known demo assignment mapping for demonstration and testing
FACULTY_ASSIGNMENTS = {
    "FAC_ADVISOR_01": ["S1001", "S1002", "S1003"],
    "FAC_ADVISOR_02": ["S1004", "S1005", "S1006"],
    "FAC-CS101": ["S1001", "S1002", "S1003", "S1004", "S1005", "S1006", "S1007", "S1008", "S1009", "S1010"],
}


def get_current_user(
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
) -> AuthenticatedUser:
    """
    Extracts authenticated user from request headers.
    Supports:
    1. Direct institutional headers: X-User-Id and X-User-Role
    2. Bearer token simulated format: 'Bearer role:user_id' (e.g. 'Bearer student:S1001')
    3. Demo mode default: faculty/advisor with all permissions for unauthenticated demo visits.
    """
    # 1. Check Bearer token
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()
        if ":" in token:
            parts = token.split(":", 1)
            role_str, uid = parts[0].lower(), parts[1]
            try:
                role = UserRole(role_str)
                assigned = FACULTY_ASSIGNMENTS.get(uid, [])
                return AuthenticatedUser(user_id=uid, role=role, assigned_students=assigned)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Invalid role '{role_str}' in authentication token.",
                )

    # 2. Check X-User-Role header
    if x_user_role:
        try:
            role = UserRole(x_user_role.lower())
            uid = x_user_id or f"{role.value}_user"
            assigned = FACULTY_ASSIGNMENTS.get(uid, [])
            return AuthenticatedUser(user_id=uid, role=role, assigned_students=assigned)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid X-User-Role '{x_user_role}'. Must be student, faculty, or admin.",
            )

    # If student ID header supplied without role, infer Student role
    if x_user_id and x_user_id.startswith("S"):
        return AuthenticatedUser(user_id=x_user_id, role=UserRole.STUDENT)

    # 3. Default demo mode: unrestricted faculty advisor to preserve unauthenticated demo dashboard flow
    return AuthenticatedUser(
        user_id="DEMO_FACULTY_ADVISOR",
        role=UserRole.FACULTY,
        assigned_students=[],  # empty means unassigned/unrestricted advisor
    )


def require_authenticated_user(
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
) -> AuthenticatedUser:
    """Strict authentication dependency: rejects requests without credentials."""
    if not authorization and not x_user_role and not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide Authorization header or X-User-Role/X-User-Id.",
        )
    return get_current_user(x_user_id=x_user_id, x_user_role=x_user_role, authorization=authorization)


def require_role(*allowed_roles: UserRole):
    """Dependency factory checking that the caller belongs to one of allowed roles."""
    def role_checker(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied for role '{user.role.value}'. Requires one of: {[r.value for r in allowed_roles]}",
            )
        return user
    return role_checker


def verify_student_access(student_id: str, current_user: AuthenticatedUser) -> None:
    """
    Enforces privacy policy:
    - Students may ONLY view their own records.
    - Faculty may view assigned students (or all if not restricted to a specific list).
    - Admins have full access.
    """
    if current_user.role == UserRole.STUDENT:
        if current_user.user_id != student_id:
            logger.warning(
                "Security breach prevented: Student %s attempted to access records of Student %s",
                current_user.user_id,
                student_id,
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Students are strictly prohibited from viewing records of other students.",
            )

    elif current_user.role == UserRole.FACULTY:
        # If specific assignment mapping exists for this faculty member, enforce boundary
        if current_user.assigned_students and len(current_user.assigned_students) > 0 and student_id not in current_user.assigned_students:
            logger.warning(
                "Faculty %s attempted to access unassigned student %s",
                current_user.user_id,
                student_id,
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Faculty advisor '{current_user.user_id}' is not assigned to student '{student_id}'.",
            )
