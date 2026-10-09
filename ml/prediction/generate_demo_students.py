"""
Generates 8 realistic demo students sampled from actual data.csv rows,
runs them through predict_student(), and saves results to docs/DEMO_STUDENTS.json.
"""

import os
import sys
import json

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import pandas as pd
from ml.prediction.predict import predict_student
from ml.training.preprocess import FEATURE_ORDER, TARGET_COLUMN


def generate_demo_students():
    data_path = os.path.join('data', 'data.csv')
    df = pd.read_csv(data_path, sep=';')

    # Select 10 distinct real student rows representing natural variation across risk tiers
    candidate_indices = [0, 1, 2, 4, 7, 8, 14, 25, 45, 100]

    demo_data = []
    demo_predictions = []

    for i, idx in enumerate(candidate_indices):
        student_id = f"S{1001 + i}"
        row = df.iloc[idx].to_dict()
        true_target = row[TARGET_COLUMN]  # For internal verification only; NOT passed to model

        # Extract features without Target
        features = {col: row[col] for col in FEATURE_ORDER}

        # Run actual prediction through trained model
        pred = predict_student(features, student_id=student_id)

        demo_record = {
            "demo_id": student_id,
            "dataset_row_index": idx,
            "features": features,
            "prediction": pred,
            "actual_outcome_reference": true_target
        }
        demo_data.append(demo_record)
        demo_predictions.append(pred)

    os.makedirs('docs', exist_ok=True)
    json_path = os.path.join('docs', 'DEMO_STUDENTS.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(demo_data, f, indent=2)

    print(f"Saved {len(demo_data)} demo students to: {json_path}")
    print("\nDEMO PREDICTION RESULTS:")
    for d in demo_data:
        p = d["prediction"]
        print(f"ID: {p['student_id']} | Risk Score: {p['risk_score']:3d} | Risk Level: {p['risk_level']:6s} | Dropout Prob: {p['dropout_probability']:.4f} | True Target: {d['actual_outcome_reference']}")


if __name__ == '__main__':
    generate_demo_students()
