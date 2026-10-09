"""
Student360 XGBoost Training Pipeline
====================================
Trains 3-class XGBoost classifier on the UCI Student Dropout dataset
with stratified train/validation/test splits, leakage-safe preprocessing,
and evaluation metrics.
"""

import os
import sys
import json

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score
)
from sklearn.model_selection import train_test_split
import xgboost as xgb

from ml.training.preprocess import (
    FEATURE_ORDER,
    TARGET_COLUMN,
    TARGET_MAPPING,
    REVERSE_TARGET_MAPPING,
    build_preprocessor,
    save_preprocessor,
    validate_and_reorder_features
)


def train_model(
    data_path: str = 'data/data.csv',
    model_output_path: str = 'models/xgboost_model_v1.joblib',
    preprocessor_output_path: str = 'models/preprocessor.joblib',
    random_state: int = 42
) -> dict:
    # 1. Load Dataset
    df = pd.read_csv(data_path, sep=';')
    print(f"Loaded {len(df)} records from {data_path}")

    # 2. Extract and Map Target
    y_raw = df[TARGET_COLUMN]
    y = y_raw.map(TARGET_MAPPING)

    # 3. Extract and Validate Features
    X_raw = df.drop(columns=[TARGET_COLUMN])
    X = validate_and_reorder_features(X_raw)

    # 4. Stratified Split (70% Train, 15% Validation, 15% Test)
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.30, random_state=random_state, stratify=y
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.50, random_state=random_state, stratify=y_temp
    )

    print(f"Train samples: {len(X_train)} (70%)")
    print(f"Val samples:   {len(X_val)} (15%)")
    print(f"Test samples:  {len(X_test)} (15%)")

    # 5. Preprocessing (Fit on X_train ONLY)
    preprocessor = build_preprocessor()
    preprocessor.fit(X_train)

    os.makedirs(os.path.dirname(preprocessor_output_path), exist_ok=True)
    save_preprocessor(preprocessor, preprocessor_output_path)
    print(f"Saved fitted preprocessor to: {preprocessor_output_path}")

    X_train_trans = preprocessor.transform(X_train)
    X_val_trans = preprocessor.transform(X_val)
    X_test_trans = preprocessor.transform(X_test)

    # 6. Initialize and Train XGBoost Classifier
    params = {
        'objective': 'multi:softprob',
        'num_class': 3,
        'eval_metric': 'mlogloss',
        'n_estimators': 300,
        'learning_rate': 0.05,
        'max_depth': 4,
        'subsample': 0.8,
        'colsample_bytree': 0.8,
        'reg_alpha': 0.1,
        'reg_lambda': 1.0,
        'random_state': random_state,
        'early_stopping_rounds': 30,
        'n_jobs': -1
    }

    model = xgb.XGBClassifier(**params)
    model.fit(
        X_train_trans,
        y_train,
        eval_set=[(X_train_trans, y_train), (X_val_trans, y_val)],
        verbose=False
    )
    print(f"Best iteration: {model.best_iteration}")

    # 7. Save Model Artifact
    os.makedirs(os.path.dirname(model_output_path), exist_ok=True)
    joblib.dump(model, model_output_path)
    print(f"Saved trained XGBoost model to: {model_output_path}")

    # 8. Evaluation Across Splits
    splits = {
        'train': (X_train_trans, y_train),
        'val': (X_val_trans, y_val),
        'test': (X_test_trans, y_test)
    }

    metrics = {}
    for split_name, (X_sp, y_sp) in splits.items():
        y_pred = model.predict(X_sp)
        y_prob = model.predict_proba(X_sp)

        acc = accuracy_score(y_sp, y_pred)
        prec_macro = precision_score(y_sp, y_pred, average='macro', zero_division=0)
        prec_weighted = precision_score(y_sp, y_pred, average='weighted', zero_division=0)
        rec_macro = recall_score(y_sp, y_pred, average='macro', zero_division=0)
        rec_weighted = recall_score(y_sp, y_pred, average='weighted', zero_division=0)
        f1_mac = f1_score(y_sp, y_pred, average='macro', zero_division=0)
        f1_wt = f1_score(y_sp, y_pred, average='weighted', zero_division=0)
        roc_auc_ovr_macro = roc_auc_score(y_sp, y_prob, multi_class='ovr', average='macro')
        roc_auc_ovr_weighted = roc_auc_score(y_sp, y_prob, multi_class='ovr', average='weighted')

        metrics[split_name] = {
            'accuracy': float(acc),
            'precision_macro': float(prec_macro),
            'precision_weighted': float(prec_weighted),
            'recall_macro': float(rec_macro),
            'recall_weighted': float(rec_weighted),
            'f1_macro': float(f1_mac),
            'f1_weighted': float(f1_wt),
            'roc_auc_ovr_macro': float(roc_auc_ovr_macro),
            'roc_auc_ovr_weighted': float(roc_auc_ovr_weighted),
        }

    # Test detailed report
    y_test_pred = model.predict(X_test_trans)
    target_names = [REVERSE_TARGET_MAPPING[i] for i in range(3)]
    cm = confusion_matrix(y_test, y_test_pred)
    cls_report = classification_report(y_test, y_test_pred, target_names=target_names, output_dict=True)

    results = {
        'xgboost_version': xgb.__version__,
        'hyperparameters': params,
        'split_sizes': {
            'train': len(X_train),
            'val': len(X_val),
            'test': len(X_test)
        },
        'metrics': metrics,
        'test_confusion_matrix': cm.tolist(),
        'test_classification_report': cls_report,
        'classes': target_names,
        'model_path': model_output_path,
        'preprocessor_path': preprocessor_output_path
    }

    return results


if __name__ == '__main__':
    results = train_model()
    print("\n" + "="*50)
    print("TRAINING & EVALUATION SUMMARY")
    print("="*50)
    print(f"XGBoost Version: {results['xgboost_version']}")
    print(f"Train Acc: {results['metrics']['train']['accuracy']:.4f} | Val Acc: {results['metrics']['val']['accuracy']:.4f} | Test Acc: {results['metrics']['test']['accuracy']:.4f}")
    print(f"Test F1 (Macro): {results['metrics']['test']['f1_macro']:.4f} | Test F1 (Weighted): {results['metrics']['test']['f1_weighted']:.4f}")
    print(f"Test ROC-AUC (OvR Macro): {results['metrics']['test']['roc_auc_ovr_macro']:.4f}")
    print("\nTest Confusion Matrix (Rows=True, Cols=Pred: Dropout, Enrolled, Graduate):")
    print(np.array(results['test_confusion_matrix']))
