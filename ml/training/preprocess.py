"""
Student360 ML Preprocessing Pipeline
====================================
Frozen feature schema, feature order, and leakage-safe scikit-learn
preprocessing pipeline for the UCI Student Dropout dataset.
"""

from typing import Dict, List, Tuple, Union, Any
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
import joblib

# Exact frozen feature order (36 features)
FEATURE_ORDER: List[str] = [
    'Marital status',
    'Application mode',
    'Application order',
    'Course',
    'Daytime/evening attendance\t',
    'Previous qualification',
    'Previous qualification (grade)',
    'Nacionality',
    "Mother's qualification",
    "Father's qualification",
    "Mother's occupation",
    "Father's occupation",
    'Admission grade',
    'Displaced',
    'Educational special needs',
    'Debtor',
    'Tuition fees up to date',
    'Gender',
    'Scholarship holder',
    'Age at enrollment',
    'International',
    'Curricular units 1st sem (credited)',
    'Curricular units 1st sem (enrolled)',
    'Curricular units 1st sem (evaluations)',
    'Curricular units 1st sem (approved)',
    'Curricular units 1st sem (grade)',
    'Curricular units 1st sem (without evaluations)',
    'Curricular units 2nd sem (credited)',
    'Curricular units 2nd sem (enrolled)',
    'Curricular units 2nd sem (evaluations)',
    'Curricular units 2nd sem (approved)',
    'Curricular units 2nd sem (grade)',
    'Curricular units 2nd sem (without evaluations)',
    'Unemployment rate',
    'Inflation rate',
    'GDP'
]

# Nominal categorical features (integer coded in UCI, non-ordered)
NOMINAL_CATEGORICAL_FEATURES: List[str] = [
    'Marital status',
    'Application mode',
    'Course',
    'Previous qualification',
    'Nacionality',
    "Mother's qualification",
    "Father's qualification",
    "Mother's occupation",
    "Father's occupation"
]

# Binary features (0 / 1 encoded)
BINARY_FEATURES: List[str] = [
    'Daytime/evening attendance\t',
    'Displaced',
    'Educational special needs',
    'Debtor',
    'Tuition fees up to date',
    'Gender',
    'Scholarship holder',
    'International'
]

# Numerical, continuous, count, and ordinal features
NUMERICAL_FEATURES: List[str] = [
    'Application order',
    'Previous qualification (grade)',
    'Admission grade',
    'Age at enrollment',
    'Curricular units 1st sem (credited)',
    'Curricular units 1st sem (enrolled)',
    'Curricular units 1st sem (evaluations)',
    'Curricular units 1st sem (approved)',
    'Curricular units 1st sem (grade)',
    'Curricular units 1st sem (without evaluations)',
    'Curricular units 2nd sem (credited)',
    'Curricular units 2nd sem (enrolled)',
    'Curricular units 2nd sem (evaluations)',
    'Curricular units 2nd sem (approved)',
    'Curricular units 2nd sem (grade)',
    'Curricular units 2nd sem (without evaluations)',
    'Unemployment rate',
    'Inflation rate',
    'GDP'
]

TARGET_COLUMN: str = 'Target'

TARGET_MAPPING: Dict[str, int] = {
    'Dropout': 0,
    'Enrolled': 1,
    'Graduate': 2
}

REVERSE_TARGET_MAPPING: Dict[int, str] = {v: k for k, v in TARGET_MAPPING.items()}


def build_preprocessor() -> ColumnTransformer:
    """
    Constructs an unfitted sklearn ColumnTransformer for the 36 features.
    - Nominal categorical: Imputation + OneHotEncoder(handle_unknown='ignore')
    - Binary: Imputation + passthrough
    - Numerical: Imputation + StandardScaler
    """
    cat_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('ohe', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])

    binary_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent'))
    ])

    num_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', cat_transformer, NOMINAL_CATEGORICAL_FEATURES),
            ('bin', binary_transformer, BINARY_FEATURES),
            ('num', num_transformer, NUMERICAL_FEATURES)
        ],
        remainder='drop',
        verbose_feature_names_out=True
    )
    return preprocessor


def validate_and_reorder_features(data: Union[pd.DataFrame, Dict[str, Any], List[Dict[str, Any]]]) -> pd.DataFrame:
    """
    Validates input features:
    - Verifies all 36 expected features are present.
    - Rejects input with a ValueError if the Target column is included.
    - Enforces exact frozen feature ordering.
    """
    if isinstance(data, dict):
        df = pd.DataFrame([data])
    elif isinstance(data, list):
        df = pd.DataFrame(data)
    elif isinstance(data, pd.DataFrame):
        df = data.copy()
    else:
        raise TypeError(f"Expected dict, list of dicts, or pd.DataFrame; got {type(data)}")

    # Reject Target column if supplied in feature inputs to prevent hidden integration bugs
    if TARGET_COLUMN in df.columns:
        raise ValueError(
            f"Input features must not contain the target column '{TARGET_COLUMN}'."
        )

    missing_cols = [col for col in FEATURE_ORDER if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing {len(missing_cols)} required feature(s): {missing_cols}")

    # Reorder columns to exact frozen order
    return df[FEATURE_ORDER]


def save_preprocessor(preprocessor: ColumnTransformer, filepath: str) -> None:
    """Serializes fitted preprocessor to disk."""
    joblib.dump(preprocessor, filepath)


def load_preprocessor(filepath: str) -> ColumnTransformer:
    """Loads fitted preprocessor from disk."""
    return joblib.load(filepath)
