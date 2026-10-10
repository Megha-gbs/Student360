"""backend/app/services/csv_service.py

CSV Import Validation Service.
Validates academic CSV datasets strictly against the frozen 36 UCI features schema.
Features:
- File format and file size enforcement (max 5 MB).
- Required column schema checks.
- Row-level value and type checking.
- Duplicate and missing student ID detection.
- Preview / validation-only mode.
- Atomic validation preventing partial corruption.
"""

import csv
import io
import logging
from typing import Any, Dict, List, Optional, Set, Tuple

from ml.explainability.uci_schema import UCI_ALL_FEATURES
from backend.app.schemas import CSVRowError, CSVValidationResponse

logger = logging.getLogger("student360.csv_service")

MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


class CSVValidationService:
    """Service validating academic CSV uploads for the Student360 platform."""

    def validate_csv(
        self,
        file_content: bytes,
        filename: str,
        preview_only: bool = True,
    ) -> Dict[str, Any]:
        """
        Validates an uploaded CSV file against institutional data rules and the 36 UCI features.
        """
        # 1. File size check
        if len(file_content) > MAX_FILE_SIZE_BYTES:
            return {
                "filename": filename,
                "total_rows": 0,
                "accepted_rows": 0,
                "rejected_rows": 0,
                "is_valid": False,
                "preview_only": preview_only,
                "duplicate_ids": [],
                "missing_columns": [],
                "errors": [
                    CSVRowError(row=0, error=f"File exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024*1024)}MB.")
                ],
                "preview_sample": None,
                "message": "File exceeds maximum size limit.",
            }

        # 2. File extension check
        if not filename.lower().endswith(".csv"):
            return {
                "filename": filename,
                "total_rows": 0,
                "accepted_rows": 0,
                "rejected_rows": 0,
                "is_valid": False,
                "preview_only": preview_only,
                "duplicate_ids": [],
                "missing_columns": [],
                "errors": [CSVRowError(row=0, error="Invalid file format. Only .csv files are supported.")],
                "preview_sample": None,
                "message": "Invalid file format.",
            }

        # 3. Parse CSV content
        try:
            text_stream = io.StringIO(file_content.decode("utf-8-sig"))
            reader = csv.DictReader(text_stream)
        except Exception as exc:
            return {
                "filename": filename,
                "total_rows": 0,
                "accepted_rows": 0,
                "rejected_rows": 0,
                "is_valid": False,
                "preview_only": preview_only,
                "duplicate_ids": [],
                "missing_columns": [],
                "errors": [CSVRowError(row=0, error=f"Failed to parse CSV: {exc}")],
                "preview_sample": None,
                "message": "CSV parsing failed.",
            }

        headers = [h.strip() for h in (reader.fieldnames or [])]
        if not headers:
            return {
                "filename": filename,
                "total_rows": 0,
                "accepted_rows": 0,
                "rejected_rows": 0,
                "is_valid": False,
                "preview_only": preview_only,
                "duplicate_ids": [],
                "missing_columns": [],
                "errors": [CSVRowError(row=0, error="CSV file is empty or missing headers.")],
                "preview_sample": None,
                "message": "Empty CSV file.",
            }

        # 4. Check required columns
        header_set = set(headers)
        # Check student ID header
        id_col = None
        for candidate in ["student_id", "demo_id", "StudentID", "id", "ID"]:
            if candidate in header_set:
                id_col = candidate
                break

        missing_cols: List[str] = []
        for req_feat in UCI_ALL_FEATURES:
            if req_feat not in header_set:
                missing_cols.append(req_feat)

        errors: List[CSVRowError] = []
        if id_col is None:
            errors.append(CSVRowError(row=0, field="student_id", error="Missing required student identifier column ('student_id')."))

        if missing_cols:
            errors.append(CSVRowError(
                row=0,
                error=f"Missing {len(missing_cols)} required UCI features: {missing_cols[:5]}..."
            ))

        # 5. Row-level validation
        seen_ids: Set[str] = set()
        duplicate_ids: List[str] = []
        total_rows = 0
        accepted_rows = 0
        rejected_rows = 0
        preview_samples: List[Dict[str, Any]] = []
        parsed_records: List[Dict[str, Any]] = []

        for row_idx, row in enumerate(reader, start=1):
            total_rows += 1
            row_has_error = False
            parsed_features: Dict[str, Any] = {}

            # Check student ID
            sid = (row.get(id_col) or "").strip() if id_col else f"ROW_{row_idx}"
            if not sid:
                errors.append(CSVRowError(row=row_idx, field=id_col or "student_id", error="Empty student ID."))
                row_has_error = True
            elif sid in seen_ids:
                duplicate_ids.append(sid)
                errors.append(CSVRowError(row=row_idx, student_id=sid, error=f"Duplicate student ID '{sid}'."))
                row_has_error = True
            else:
                seen_ids.add(sid)

            # Check numeric feature validity
            for feat in UCI_ALL_FEATURES:
                if feat in row:
                    val_str = (row[feat] or "").strip()
                    if not val_str:
                        errors.append(CSVRowError(row=row_idx, student_id=sid, field=feat, error=f"Missing value for feature '{feat}'."))
                        row_has_error = True
                        break
                    try:
                        val_num = float(val_str)
                        # Basic sanity ranges
                        if "grade" in feat.lower() and (val_num < 0 or val_num > 200):
                            errors.append(CSVRowError(row=row_idx, student_id=sid, field=feat, error=f"Out of range grade value: {val_num}"))
                            row_has_error = True
                            break
                        if "age" in feat.lower() and (val_num < 14 or val_num > 100):
                            errors.append(CSVRowError(row=row_idx, student_id=sid, field=feat, error=f"Out of range age value: {val_num}"))
                            row_has_error = True
                            break
                        parsed_features[feat] = int(val_num) if val_num.is_integer() else val_num
                    except ValueError:
                        errors.append(CSVRowError(row=row_idx, student_id=sid, field=feat, error=f"Non-numeric value '{val_str}' for feature '{feat}'."))
                        row_has_error = True
                        break

            if row_has_error:
                rejected_rows += 1
            else:
                accepted_rows += 1
                parsed_records.append({
                    "demo_id": sid,
                    "student_id": sid,
                    "features": parsed_features,
                })
                if len(preview_samples) < 5:
                    preview_samples.append({id_col or "student_id": sid, **{k: row[k] for k in list(row.keys())[:8]}})

        is_valid = (len(errors) == 0 and total_rows > 0)
        message = (
            f"Validation successful: {accepted_rows} valid records verified."
            if is_valid
            else f"Validation failed with {len(errors)} error(s). {rejected_rows} rejected rows."
        )

        return {
            "filename": filename,
            "total_rows": total_rows,
            "accepted_rows": accepted_rows,
            "rejected_rows": rejected_rows,
            "is_valid": is_valid,
            "preview_only": preview_only,
            "duplicate_ids": duplicate_ids,
            "missing_columns": missing_cols,
            "errors": errors[:50],  # cap at 50 to prevent huge payloads
            "preview_sample": preview_samples if preview_samples else None,
            "parsed_records": parsed_records if is_valid else [],
            "message": message,
        }


csv_service = CSVValidationService()
