"""backend/app/services/student_service.py

Student Service.
Loads and caches verified full cohort students from data/data.csv (4,424 records)
and merges verified demo students from docs/DEMO_STUDENTS.json.
Provides query methods, fast feature extractors, and server-side filtering/pagination.
"""

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd

from backend.app.config import DATA_PATH, DEMO_STUDENTS_PATH
from ml.training.preprocess import FEATURE_ORDER

logger = logging.getLogger("student360.student_service")

# Mapping of the 10 verified demo rows in docs/DEMO_STUDENTS.json to canonical IDs
DEMO_ROW_INDEX_MAP = {
    0: "S1001",
    1: "S1002",
    2: "S1003",
    4: "S1004",
    7: "S1005",
    8: "S1006",
    14: "S1007",
    25: "S1008",
    45: "S1009",
    100: "S1010",
}


class StudentService:
    """Manages student records from official dataset and verified demo benchmarks."""

    def __init__(
        self,
        json_path: Optional[Path] = None,
        data_path: Optional[Path] = None,
    ):
        self.json_path = json_path or DEMO_STUDENTS_PATH
        self.data_path = data_path or DATA_PATH
        self._students_cache: Optional[List[Dict[str, Any]]] = None
        self._students_by_id: Optional[Dict[str, Dict[str, Any]]] = None
        self._total_dataset_rows: int = 0
        self._loaded_dataset_rows: int = 0
        self._rejected_rows_count: int = 0

    def _ensure_loaded(self) -> None:
        """Loads dataset and demo students into memory cache if not already loaded."""
        if self._students_cache is not None:
            return

        demo_students_dict: Dict[str, Dict[str, Any]] = {}
        if self.json_path.exists():
            try:
                with open(self.json_path, "r", encoding="utf-8") as f:
                    demo_data = json.load(f)
                if isinstance(demo_data, list):
                    for item in demo_data:
                        sid = str(item.get("demo_id") or item.get("student_id"))
                        demo_students_dict[sid] = item
            except Exception as exc:
                logger.warning("Error reading demo students JSON: %s", exc)

        records_list: List[Dict[str, Any]] = []
        records_by_id: Dict[str, Dict[str, Any]] = {}

        # 1. Load data/data.csv if available
        if self.data_path.exists():
            try:
                df = pd.read_csv(self.data_path, sep=";", encoding="utf-8-sig")
                self._total_dataset_rows = len(df)

                non_demo_counter = 0
                for idx, row in df.iterrows():
                    idx_int = int(idx)
                    if idx_int in DEMO_ROW_INDEX_MAP:
                        sid = DEMO_ROW_INDEX_MAP[idx_int]
                    else:
                        non_demo_counter += 1
                        sid = f"S{1010 + non_demo_counter}"

                    uci_alias = f"UCI_{idx_int + 1:04d}"

                    # Extract the 36 UCI features with correct scalar types
                    features: Dict[str, Any] = {}
                    for col in FEATURE_ORDER:
                        val = row[col]
                        try:
                            val_num = float(val)
                            features[col] = int(val_num) if val_num.is_integer() else val_num
                        except (ValueError, TypeError):
                            features[col] = val

                    target_val = str(row.get("Target", "Unknown"))

                    student_record = {
                        "student_id": sid,
                        "demo_id": sid,
                        "dataset_row_index": int(idx),
                        "features": features,
                        "actual_outcome_reference": target_val,
                        "record_type": "dataset_uci",
                        "provenance": {
                            "source": "data/data.csv",
                            "row": int(idx),
                            "verified": True,
                        },
                    }

                    # If this is one of the 10 verified demo students, overlay rich demo metadata
                    if sid in demo_students_dict:
                        rich_meta = demo_students_dict[sid]
                        if "prediction" in rich_meta:
                            student_record["prediction"] = rich_meta["prediction"]
                        if "trajectory" in rich_meta:
                            student_record["trajectory"] = rich_meta["trajectory"]
                        if "top_reasons" in rich_meta:
                            student_record["top_reasons"] = rich_meta["top_reasons"]
                        if "recommended_intervention" in rich_meta:
                            student_record["recommended_intervention"] = rich_meta["recommended_intervention"]

                    records_list.append(student_record)
                    records_by_id[sid] = student_record
                    # Also register alias lookup for UCI_xxxx
                    if uci_alias != sid:
                        records_by_id[uci_alias] = student_record

                self._loaded_dataset_rows = len(records_list)
                self._rejected_rows_count = 0
                logger.info("Loaded complete cohort dataset: %d records.", len(records_list))
            except Exception as exc:
                logger.error("Failed to parse %s: %s. Falling back to demo dataset.", self.data_path, exc)
                records_list = list(demo_students_dict.values())
                records_by_id = {str(s.get("demo_id") or s.get("student_id")): s for s in records_list}
                self._total_dataset_rows = len(records_list)
                self._loaded_dataset_rows = len(records_list)
        else:
            # Fallback to demo students JSON if data.csv not found
            records_list = list(demo_students_dict.values())
            records_by_id = {str(s.get("demo_id") or s.get("student_id")): s for s in records_list}
            self._total_dataset_rows = len(records_list)
            self._loaded_dataset_rows = len(records_list)

        self._students_cache = records_list
        self._students_by_id = records_by_id

    def get_all_students(self) -> List[Dict[str, Any]]:
        """Returns all loaded student records."""
        self._ensure_loaded()
        assert self._students_cache is not None
        return self._students_cache

    def get_total_count(self) -> int:
        """Returns total loaded student count."""
        self._ensure_loaded()
        assert self._students_cache is not None
        return len(self._students_cache)

    def get_ingestion_stats(self) -> Dict[str, Any]:
        """Returns dataset loading statistics for audit and admin dashboards."""
        self._ensure_loaded()
        return {
            "total_dataset_rows": self._total_dataset_rows,
            "loaded_rows": self._loaded_dataset_rows,
            "rejected_rows": self._rejected_rows_count,
            "active_registry_count": len(self._students_cache or []),
            "source": str(self.data_path) if self.data_path.exists() else str(self.json_path),
        }

    def get_student_by_id(self, student_id: str) -> Optional[Dict[str, Any]]:
        """Look up student by student_id or alias (e.g. 'S1001', 'UCI_0001')."""
        self._ensure_loaded()
        assert self._students_by_id is not None
        return self._students_by_id.get(str(student_id))

    def get_student_features(self, student_id: str) -> Optional[Dict[str, Any]]:
        """Extract the 36 raw features for a given student."""
        student = self.get_student_by_id(student_id)
        if student is None:
            return None
        return student.get("features")

    def add_students(self, new_students: List[Dict[str, Any]]) -> int:
        """Adds or updates student records in live storage."""
        self._ensure_loaded()
        assert self._students_cache is not None
        assert self._students_by_id is not None
        added = 0
        for student in new_students:
            sid = str(student.get("demo_id") or student.get("student_id"))
            if sid not in self._students_by_id:
                self._students_cache.append(student)
                self._students_by_id[sid] = student
                added += 1
            else:
                self._students_by_id[sid].update(student)
        return added

    def reset(self) -> None:
        """Resets cached student registry back to clean dataset."""
        self._students_cache = None
        self._students_by_id = None
        self._ensure_loaded()


# Global singleton instance
student_service = StudentService()
