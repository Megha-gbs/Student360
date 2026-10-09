"""
Student Service.
Loads and caches verified demo students from docs/DEMO_STUDENTS.json.
Provides query methods and feature extractors using project-relative paths.
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional

from backend.app.config import DEMO_STUDENTS_PATH


class StudentService:
    """Manages student records from official demo dataset."""

    def __init__(self, json_path: Optional[Path] = None):
        self.json_path = json_path or DEMO_STUDENTS_PATH
        self._students_cache: Optional[List[Dict[str, Any]]] = None
        self._students_by_id: Optional[Dict[str, Dict[str, Any]]] = None

    def _ensure_loaded(self) -> None:
        """Loads demo students JSON into memory cache if not already loaded."""
        if self._students_cache is not None:
            return

        if not self.json_path.exists():
            raise FileNotFoundError(f"Demo students file not found at: {self.json_path}")

        with open(self.json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        if not isinstance(data, list):
            raise ValueError("Expected DEMO_STUDENTS.json to contain a list of student records.")

        self._students_cache = data
        self._students_by_id = {}
        for student in data:
            sid = str(student.get("demo_id") or student.get("student_id"))
            self._students_by_id[sid] = student

    def get_all_students(self) -> List[Dict[str, Any]]:
        """Returns all verified demo students."""
        self._ensure_loaded()
        assert self._students_cache is not None
        return self._students_cache

    def get_student_by_id(self, student_id: str) -> Optional[Dict[str, Any]]:
        """Look up student by student_id or demo_id (e.g. 'S1001')."""
        self._ensure_loaded()
        assert self._students_by_id is not None
        return self._students_by_id.get(str(student_id))

    def get_student_features(self, student_id: str) -> Optional[Dict[str, Any]]:
        """Extract the 36 raw features for a given student."""
        student = self.get_student_by_id(student_id)
        if student is None:
            return None
        return student.get("features")


# Global singleton instance
student_service = StudentService()
