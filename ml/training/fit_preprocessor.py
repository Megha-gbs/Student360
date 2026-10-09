"""
Fits the preprocessing pipeline on training data split ONLY, saves artifact to models/preprocessor.joblib.
"""

import os
import sys

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import pandas as pd
from sklearn.model_selection import train_test_split
from ml.training.preprocess import (
    FEATURE_ORDER,
    TARGET_COLUMN,
    build_preprocessor,
    save_preprocessor,
    validate_and_reorder_features
)


def main():
    data_path = os.path.join('data', 'data.csv')
    df = pd.read_csv(data_path, sep=';')
    print(f"Loaded {len(df)} records from {data_path}")

    # Separate target
    y = df[TARGET_COLUMN]
    X_raw = df.drop(columns=[TARGET_COLUMN])

    # Validate and reorder features strictly according to schema
    X = validate_and_reorder_features(X_raw)

    # Leakage-safe Stratified Train / Validation / Test split (70% Train, 15% Val, 15% Test)
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.30, random_state=42, stratify=y
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.50, random_state=42, stratify=y_temp
    )

    print(f"Train split size: {len(X_train)} ({len(X_train)/len(df)*100:.1f}%)")
    print(f"Val split size:   {len(X_val)} ({len(X_val)/len(df)*100:.1f}%)")
    print(f"Test split size:  {len(X_test)} ({len(X_test)/len(df)*100:.1f}%)")

    # Fit preprocessor ONLY on X_train
    preprocessor = build_preprocessor()
    preprocessor.fit(X_train)

    os.makedirs('models', exist_ok=True)
    artifact_path = os.path.join('models', 'preprocessor.joblib')
    save_preprocessor(preprocessor, artifact_path)
    print(f"Saved fitted preprocessor artifact to: {artifact_path}")

    # Quick sanity transform
    X_train_trans = preprocessor.transform(X_train)
    X_test_trans = preprocessor.transform(X_test)
    print(f"Transformed train shape: {X_train_trans.shape}")
    print(f"Transformed test shape:  {X_test_trans.shape}")


if __name__ == '__main__':
    main()
