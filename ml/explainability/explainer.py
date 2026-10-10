"""ml/explainability/explainer.py

Production-ready SHAP explainability engine for Student360 academic dropout risk.
Integrates directly with Mohith's trained XGBoost model and scikit-learn ColumnTransformer.
Transforms raw UCI student features (36 columns) into the 233-feature transformed space,
runs TreeExplainer, and aggregates SHAP attributions back to the original real UCI feature names.
Provides per-student risk explanations and cohort-wide global SHAP insights.
"""

from __future__ import annotations

import logging
import os
import warnings
from typing import Any, Dict, List, Optional, Sequence, Union
import numpy as np
import pandas as pd

from ml.explainability.schemas import (
    GlobalSHAPItem,
    GlobalSHAPResponse,
    ImpactLevel,
    RiskDirection,
    SHAPReason,
    TopReasonsResponse,
)
from ml.explainability.uci_schema import (
    UCI_ALL_FEATURES,
    normalize_feature_name,
    validate_real_uci_features,
)

logger = logging.getLogger("student360.ml.explainability")

# Dynamic import handling for SHAP
try:
    import shap  # type: ignore
    SHAP_AVAILABLE = True
except ImportError:
    shap = None  # type: ignore
    SHAP_AVAILABLE = False
    logger.warning("SHAP is not installed. Explainer will operate in fallback mode.")

# Project paths
PROJECT_ROOT: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DEFAULT_MODEL_PATH: str = os.path.join(PROJECT_ROOT, "models", "xgboost_model_v1.joblib")
DEFAULT_PREPROCESSOR_PATH: str = os.path.join(PROJECT_ROOT, "models", "preprocessor.joblib")

# Feature order from training
try:
    from ml.training.preprocess import FEATURE_ORDER
except ImportError:
    FEATURE_ORDER = list(UCI_ALL_FEATURES)


def _clean_scalar(val: Any) -> Union[int, float, str, bool]:
    """Convert numpy scalars or pandas types to native JSON-serializable Python types.
    
    Checks bool before int because in Python, bool is a subclass of int.
    """
    if isinstance(val, (np.bool_, bool)):
        return bool(val)
    if isinstance(val, (np.integer, int)):
        return int(val)
    if isinstance(val, (np.floating, float)):
        val_f = float(val)
        if np.isnan(val_f):
            return 0.0
        if val_f.is_integer():
            return int(val_f)
        return round(val_f, 2)
    return str(val)


def _determine_impact(
    abs_shap: float,
    max_abs_shap: float,
    rank: int,
) -> ImpactLevel:
    """Categorize feature importance into 'high', 'medium', or 'low'.
    
    Combines normalized relative SHAP magnitude with rank context:
    - Rank 1 (top contributor) is always 'high'.
    - Relative magnitude >= 0.60 -> 'high'
    - Relative magnitude >= 0.25 -> 'medium'
    - Relative magnitude < 0.25 -> 'low'
    """
    if max_abs_shap <= 1e-9:
        return "low"

    if rank == 0:
        return "high"

    ratio = abs_shap / max_abs_shap
    if ratio >= 0.60:
        return "high"
    elif ratio >= 0.25:
        return "medium"
    return "low"


def _determine_direction(shap_value: float) -> RiskDirection:
    """Determine whether the SHAP value increases or decreases dropout risk.
    
    A positive SHAP value on the Dropout target (class 0) increases dropout risk.
    A negative SHAP value decreases dropout risk (protective factor).
    """
    return "increases_risk" if shap_value > 0 else "decreases_risk"


class StudentSHAPExplainer:
    """Production SHAP Explainer for Student360 XGBoost risk prediction model.
    
    Strictly uses real UCI dataset features and produces exact frozen JSON contracts.
    Seamlessly transforms 36 UCI features through Mohith's ColumnTransformer into
    the 233-feature space, runs TreeExplainer, and aggregates SHAP scores back
    to the human-readable original UCI features.
    """

    def __init__(
        self,
        model: Optional[Any] = None,
        preprocessor: Optional[Any] = None,
        model_path: Optional[str] = None,
        preprocessor_path: Optional[str] = None,
        feature_names: Optional[Sequence[str]] = None,
        dropout_class_idx: int = 0,
        validate_features: bool = True,
    ) -> None:
        """Initialize the SHAP explainer with XGBoost model and preprocessor artifacts."""
        self.dropout_class_idx = dropout_class_idx

        # 1. Load Model
        self.model = self._load_artifact(
            artifact=model,
            explicit_path=model_path,
            default_path=DEFAULT_MODEL_PATH,
            artifact_name="Model",
        )

        # 2. Load Preprocessor
        self.preprocessor = self._load_artifact(
            artifact=preprocessor,
            explicit_path=preprocessor_path,
            default_path=DEFAULT_PREPROCESSOR_PATH,
            artifact_name="Preprocessor",
        )

        # 3. Canonical original feature names
        extracted_features: List[str] = []
        if feature_names is not None:
            extracted_features = [normalize_feature_name(f) for f in feature_names]
        else:
            extracted_features = [normalize_feature_name(f) for f in UCI_ALL_FEATURES]

        if validate_features:
            self.feature_names = validate_real_uci_features(extracted_features)
        else:
            self.feature_names = extracted_features

        # 4. Map transformed features (233) back to original features (36)
        self.transformed_feature_names: List[str] = []
        self.tf_to_orig_map: List[str] = []
        self._build_transformed_feature_mapping()

        # 5. Initialize TreeExplainer
        self._explainer = None
        self._init_explainer()

    @staticmethod
    def _load_artifact(
        artifact: Any,
        explicit_path: Optional[str],
        default_path: str,
        artifact_name: str,
    ) -> Any:
        """Helper to resolve and load joblib/pickle serialized artifacts."""
        if artifact is not None and not isinstance(artifact, str):
            return artifact

        target_path = explicit_path or (artifact if isinstance(artifact, str) else None)
        if target_path is None and os.path.exists(default_path):
            target_path = default_path

        if target_path and os.path.exists(target_path):
            try:
                import joblib  # type: ignore
                with warnings.catch_warnings():
                    warnings.filterwarnings("ignore")
                    loaded = joblib.load(target_path)
                logger.info("Loaded %s from: %s", artifact_name, target_path)
                return loaded
            except Exception as exc:
                try:
                    import pickle
                    with open(target_path, "rb") as f:
                        loaded = pickle.load(f)
                    return loaded
                except Exception as p_exc:
                    logger.warning("Failed to load %s from %s: %s", artifact_name, target_path, p_exc)
        return None

    def _build_transformed_feature_mapping(self) -> None:
        """Map each transformed feature (from ColumnTransformer) back to parent UCI feature."""
        if self.preprocessor is None or not hasattr(self.preprocessor, "get_feature_names_out"):
            return

        try:
            names_out = list(self.preprocessor.get_feature_names_out())
            self.transformed_feature_names = names_out
            self.tf_to_orig_map = []

            canonical_set = {normalize_feature_name(f): f for f in UCI_ALL_FEATURES}

            for tf in names_out:
                clean = tf.split("__", 1)[1] if "__" in tf else tf
                norm_clean = normalize_feature_name(clean)
                matched: Optional[str] = None

                # Direct match
                if norm_clean in canonical_set:
                    matched = norm_clean
                else:
                    # One-hot prefix match (e.g. 'Course_171' -> 'Course')
                    for orig_norm in canonical_set:
                        if (
                            clean == orig_norm
                            or clean.startswith(orig_norm + "_")
                            or norm_clean.startswith(orig_norm + "_")
                        ):
                            matched = orig_norm
                            break

                self.tf_to_orig_map.append(matched or norm_clean)
        except Exception as exc:
            logger.warning("Could not map preprocessor feature names: %s", exc)

    def _init_explainer(self) -> None:
        """Initialize and cache the SHAP TreeExplainer on the underlying XGBoost model."""
        if not SHAP_AVAILABLE or shap is None or self.model is None:
            logger.info("Operating in fallback SHAP mode (shap or model unavailable).")
            return

        try:
            underlying_model = self.model
            if hasattr(self.model, "named_steps") and "classifier" in self.model.named_steps:
                underlying_model = self.model.named_steps["classifier"]

            with warnings.catch_warnings():
                warnings.filterwarnings("ignore")
                self._explainer = shap.TreeExplainer(underlying_model)
            logger.info("Initialized shap.TreeExplainer successfully.")
        except Exception as exc:
            logger.warning("Could not initialize shap.TreeExplainer (%s). Using fallback.", exc)
            self._explainer = None

    @staticmethod
    def _extract_feature_from_record(record: Dict[str, Any], feat: str) -> float:
        """Extract numeric value for a feature name supporting multiple naming conventions."""
        norm_feat = normalize_feature_name(feat)
        if feat in record:
            try:
                return float(record[feat])
            except (ValueError, TypeError):
                pass
        if norm_feat in record:
            try:
                return float(record[norm_feat])
            except (ValueError, TypeError):
                pass

        # Case-insensitive and snake_case tolerance
        norm_lower = norm_feat.lower()
        norm_snake = norm_lower.replace(" ", "_")
        for k, v in record.items():
            k_norm = normalize_feature_name(str(k)).lower()
            if k_norm == norm_lower or k_norm.replace(" ", "_") == norm_snake:
                try:
                    return float(v)
                except (ValueError, TypeError):
                    pass
        return 0.0

    @staticmethod
    def _extract_raw_value_from_record(record: Dict[str, Any], feat: str) -> Any:
        """Retrieve original raw scalar value preserving int/float/str."""
        norm_feat = normalize_feature_name(feat)
        if feat in record:
            return record[feat]
        if norm_feat in record:
            return record[norm_feat]
        if norm_feat + "\t" in record:
            return record[norm_feat + "\t"]

        norm_lower = norm_feat.lower()
        norm_snake = norm_lower.replace(" ", "_")
        for k, v in record.items():
            k_norm = normalize_feature_name(str(k)).lower()
            if k_norm == norm_lower or k_norm.replace(" ", "_") == norm_snake:
                return v
        return 0

    def _build_dataframe_from_records(
        self,
        records: List[Dict[str, Any]],
    ) -> pd.DataFrame:
        """Construct pandas DataFrame matching FEATURE_ORDER expected by preprocessor."""
        rows: List[Dict[str, Any]] = []
        for rec in records:
            row_dict: Dict[str, Any] = {}
            for col in FEATURE_ORDER:
                row_dict[col] = self._extract_feature_from_record(rec, col)
            rows.append(row_dict)
        return pd.DataFrame(rows)[FEATURE_ORDER]

    def _extract_dropout_shap_values(
        self,
        raw_shap_output: Any,
    ) -> np.ndarray:
        """Safely extract 2D SHAP array corresponding to the Dropout class (class 0)."""
        if hasattr(raw_shap_output, "values"):
            values = raw_shap_output.values
            if values.ndim == 3:
                idx = min(self.dropout_class_idx, values.shape[2] - 1)
                return values[:, :, idx]
            elif values.ndim == 2:
                return values
            elif values.ndim == 1:
                return values.reshape(1, -1)

        if isinstance(raw_shap_output, list):
            idx = min(self.dropout_class_idx, len(raw_shap_output) - 1)
            arr = np.asarray(raw_shap_output[idx])
            return arr.reshape(1, -1) if arr.ndim == 1 else arr

        arr = np.asarray(raw_shap_output)
        if arr.ndim == 3:
            idx = min(self.dropout_class_idx, arr.shape[2] - 1)
            return arr[:, :, idx]
        elif arr.ndim == 2:
            return arr
        elif arr.ndim == 1:
            return arr.reshape(1, -1)

        raise ValueError(f"Unexpected SHAP values shape: {arr.shape}")

    def _approximate_shap_values(
        self,
        student_rec: Dict[str, Any],
    ) -> Dict[str, float]:
        """Heuristic fallback when SHAP or model artifacts are unavailable."""
        medians = {
            "Curricular units 1st sem (approved)": 5.0,
            "Curricular units 2nd sem (approved)": 5.0,
            "Curricular units 1st sem (grade)": 12.0,
            "Curricular units 2nd sem (grade)": 12.0,
            "Tuition fees up to date": 1.0,
            "Scholarship holder": 0.0,
            "Debtor": 0.0,
            "Admission grade": 125.0,
            "Age at enrollment": 20.0,
        }
        risk_increasing_if_low = {
            "Curricular units 1st sem (approved)",
            "Curricular units 2nd sem (approved)",
            "Curricular units 1st sem (grade)",
            "Curricular units 2nd sem (grade)",
            "Tuition fees up to date",
            "Scholarship holder",
            "Admission grade",
        }
        risk_increasing_if_high = {
            "Debtor",
            "Age at enrollment",
        }

        shaps: Dict[str, float] = {}
        for feat in self.feature_names:
            val = float(self._extract_feature_from_record(student_rec, feat))
            base_val = medians.get(feat, 0.0)
            diff = val - base_val

            if feat in risk_increasing_if_low:
                shaps[feat] = -diff * 0.1
            elif feat in risk_increasing_if_high:
                shaps[feat] = diff * 0.1
            else:
                shaps[feat] = diff * 0.02
        return shaps

    def explain_student(
        self,
        student_data: Union[Dict[str, Any], Any],
        top_k: int = 5,
    ) -> TopReasonsResponse:
        """Compute top 3-5 risk contributor features for a single student.
        
        Transforms features through preprocessor (233 features), evaluates
        TreeExplainer on XGBoost model, groups SHAP contributions back to original
        UCI features, and returns exact frozen JSON contract.
        """
        k = max(3, min(5, top_k))
        student_rec = student_data if isinstance(student_data, dict) else (
            student_data.to_dict(orient="records")[0] if hasattr(student_data, "to_dict") else dict(student_data)
        )

        orig_shaps: Dict[str, float] = {}

        # 1. Primary path: Preprocessor + Model + TreeExplainer
        if (
            self.preprocessor is not None
            and self.model is not None
            and self._explainer is not None
            and len(self.tf_to_orig_map) > 0
        ):
            try:
                df = self._build_dataframe_from_records([student_rec])
                X_trans = self.preprocessor.transform(df)
                raw_shap = self._explainer(X_trans)
                dropout_shap_233 = self._extract_dropout_shap_values(raw_shap)[0]

                orig_shaps = {normalize_feature_name(f): 0.0 for f in UCI_ALL_FEATURES}
                for j, parent_name in enumerate(self.tf_to_orig_map):
                    if parent_name in orig_shaps:
                        orig_shaps[parent_name] += float(dropout_shap_233[j])
            except Exception as exc:
                logger.warning("Pipeline SHAP explanation encountered error (%s); using fallback.", exc)
                orig_shaps = self._approximate_shap_values(student_rec)
        else:
            orig_shaps = self._approximate_shap_values(student_rec)

        # 2. Sort features descending by absolute impact
        sorted_feats = sorted(orig_shaps.items(), key=lambda x: abs(x[1]), reverse=True)
        selected = sorted_feats[:k]
        max_abs = abs(selected[0][1]) if len(selected) > 0 else 0.0

        # 3. Construct exact frozen contract
        top_reasons: List[SHAPReason] = []
        for rank, (feat_name, net_shap) in enumerate(selected):
            raw_val = self._extract_raw_value_from_record(student_rec, feat_name)
            impact = _determine_impact(abs(net_shap), max_abs, rank)
            direction = _determine_direction(net_shap)

            top_reasons.append(
                SHAPReason(
                    feature=feat_name,
                    value=_clean_scalar(raw_val),
                    impact=impact,
                    direction=direction,
                )
            )

        return TopReasonsResponse(top_reasons=top_reasons)

    def explain_cohort(
        self,
        cohort_data: Union[Sequence[Dict[str, Any]], Any],
        top_k: Optional[int] = None,
    ) -> GlobalSHAPResponse:
        """Compute cohort-wide global SHAP summary (mean absolute SHAP values).
        
        Evaluates the batch through preprocessor + TreeExplainer, aggregates
        to original 36 features, and sorts descending by mean absolute SHAP.
        """
        records: List[Dict[str, Any]] = []
        if hasattr(cohort_data, "to_dict") and hasattr(cohort_data, "columns"):
            records = cohort_data.to_dict(orient="records")
        elif isinstance(cohort_data, list):
            records = cohort_data
        elif isinstance(cohort_data, dict):
            records = [cohort_data]

        if not records:
            return GlobalSHAPResponse(global_shap=[])

        orig_list = [normalize_feature_name(f) for f in UCI_ALL_FEATURES]
        n_samples = len(records)

        # 1. Primary path: Preprocessor + TreeExplainer
        if (
            self.preprocessor is not None
            and self.model is not None
            and self._explainer is not None
            and len(self.tf_to_orig_map) > 0
        ):
            try:
                df = self._build_dataframe_from_records(records)
                X_trans = self.preprocessor.transform(df)
                raw_shap = self._explainer(X_trans)
                dropout_shap_matrix = self._extract_dropout_shap_values(raw_shap)

                cohort_orig_shap = np.zeros((n_samples, len(orig_list)), dtype=np.float32)
                for j, parent_name in enumerate(self.tf_to_orig_map):
                    if parent_name in orig_list:
                        idx = orig_list.index(parent_name)
                        cohort_orig_shap[:, idx] += dropout_shap_matrix[:, j]

                mean_abs_shap = np.mean(np.abs(cohort_orig_shap), axis=0)
            except Exception as exc:
                logger.warning("Pipeline cohort SHAP failed (%s); using fallback.", exc)
                mean_abs_shap = np.zeros(len(orig_list), dtype=np.float32)
        else:
            # Fallback
            cohort_orig_shap = np.zeros((n_samples, len(orig_list)), dtype=np.float32)
            for i, rec in enumerate(records):
                approx = self._approximate_shap_values(rec)
                for j, feat in enumerate(orig_list):
                    cohort_orig_shap[i, j] = approx.get(feat, 0.0)
            mean_abs_shap = np.mean(np.abs(cohort_orig_shap), axis=0)

        # 2. Sort descending
        sorted_indices = np.argsort(-mean_abs_shap)
        if top_k is not None:
            sorted_indices = sorted_indices[: max(1, top_k)]

        global_items: List[GlobalSHAPItem] = []
        for idx in sorted_indices:
            feat_name = orig_list[idx]
            score = float(mean_abs_shap[idx])
            global_items.append(
                GlobalSHAPItem(
                    feature=feat_name,
                    mean_abs_shap=round(score, 4),
                )
            )

        return GlobalSHAPResponse(global_shap=global_items)

    def get_global_shap_list(
        self,
        cohort_data: Union[Sequence[Dict[str, Any]], Any],
        top_k: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """Convenience method returning raw list of feature importances for Cohort Insights."""
        res = self.explain_cohort(cohort_data, top_k=top_k)
        return [item.to_dict() for item in res.global_shap]


def explain_student_risk(
    model: Optional[Any] = None,
    student_data: Dict[str, Any] = None,
    preprocessor: Optional[Any] = None,
    top_k: int = 5,
    dropout_class_idx: int = 0,
) -> Dict[str, Any]:
    """Convenience function for FastAPI backend to get student SHAP reasons directly."""
    explainer = StudentSHAPExplainer(
        model=model,
        preprocessor=preprocessor,
        dropout_class_idx=dropout_class_idx,
    )
    return explainer.explain_student(student_data, top_k=top_k).to_dict()


def compute_cohort_global_shap(
    model: Optional[Any] = None,
    cohort_data: Union[Sequence[Dict[str, Any]], Any] = None,
    preprocessor: Optional[Any] = None,
    top_k: Optional[int] = 10,
    dropout_class_idx: int = 0,
) -> Dict[str, Any]:
    """Convenience function for FastAPI backend to get cohort global SHAP directly."""
    explainer = StudentSHAPExplainer(
        model=model,
        preprocessor=preprocessor,
        dropout_class_idx=dropout_class_idx,
    )
    return explainer.explain_cohort(cohort_data, top_k=top_k).to_dict()
