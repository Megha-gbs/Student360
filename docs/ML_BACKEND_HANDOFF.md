# Student360 ML Backend Integration & Handoff Guide

This guide documents the frozen interface, artifacts, error handling, and invocation contracts for the backend team to integrate the Student360 ML Risk Prediction pipeline.

---

## 1. Model & Artifact Specifications

- **Model Artifact Path**: `models/xgboost_model_v1.joblib`
- **Preprocessor Artifact Path**: `models/preprocessor.joblib`
- **Model Version Identifier**: `student360_xgb_v2_real_features`
- **XGBoost Library Version**: `3.4.1`
- **Target Classes**:
  - `0`: `Dropout` (**Primary Risk Target**)
  - `1`: `Enrolled`
  - `2`: `Graduate`
- **Class Ordering**: Verified multiclass mapping: `[0, 1, 2]`. The primary risk probability is strictly extracted from class index `0` (`Dropout`).
- **Inference Guarantee**: Zero model retraining occurs during prediction. Pre-trained weights and transformers are loaded and cached in memory.

---

## 2. Prediction Function & Python Interface

### Import Path
```python
from ml.prediction import predict_student, predict_students_batch
```
*(Or directly from `ml.prediction.predict`)*

### Function Signature
```python
def predict_student(
    features: dict[str, Any],
    student_id: str | None = None
) -> dict[str, Any]:
```

### Backend Usage Example
```python
from ml.prediction import predict_student

# Input payload: Dictionary containing the exact 36 UCI features
student_features = {
    "Marital status": 1,
    "Application mode": 17,
    "Application order": 5,
    "Course": 171,
    "Daytime/evening attendance\t": 1,
    "Previous qualification": 1,
    "Previous qualification (grade)": 122.0,
    "Nacionality": 1,
    "Mother's qualification": 19,
    "Father's qualification": 12,
    "Mother's occupation": 5,
    "Father's occupation": 9,
    "Admission grade": 127.3,
    "Displaced": 1,
    "Educational special needs": 0,
    "Debtor": 0,
    "Tuition fees up to date": 1,
    "Gender": 1,
    "Scholarship holder": 0,
    "Age at enrollment": 20,
    "International": 0,
    "Curricular units 1st sem (credited)": 0,
    "Curricular units 1st sem (enrolled)": 0,
    "Curricular units 1st sem (evaluations)": 0,
    "Curricular units 1st sem (approved)": 0,
    "Curricular units 1st sem (grade)": 0.0,
    "Curricular units 1st sem (without evaluations)": 0,
    "Curricular units 2nd sem (credited)": 0,
    "Curricular units 2nd sem (enrolled)": 0,
    "Curricular units 2nd sem (evaluations)": 0,
    "Curricular units 2nd sem (approved)": 0,
    "Curricular units 2nd sem (grade)": 0.0,
    "Curricular units 2nd sem (without evaluations)": 0,
    "Unemployment rate": 10.8,
    "Inflation rate": 1.4,
    "GDP": 1.74
}

# Generate prediction (S1001)
prediction = predict_student(student_features, student_id="S1001")
print(prediction)
```

---

## 3. Input Feature Schema

The backend must provide all **36 real UCI features** with exact column names and expected types:

| Index | Exact Key Name | Type | Notes |
| :---: | :--- | :---: | :--- |
| 1 | `Marital status` | `int` | Integer code 1–6 |
| 2 | `Application mode` | `int` | Integer code 1–57 |
| 3 | `Application order` | `int` | Application priority (0–9) |
| 4 | `Course` | `int` | Degree program code |
| 5 | `Daytime/evening attendance\t` | `int` | Binary (1: Daytime, 0: Evening). Exact key has `\t` |
| 6 | `Previous qualification` | `int` | Qualification code (1–43) |
| 7 | `Previous qualification (grade)` | `float` | Scale 0–200 |
| 8 | `Nacionality` | `int` | Nationality code (1–109) |
| 9 | `Mother's qualification` | `int` | Code 1–44 |
| 10 | `Father's qualification` | `int` | Code 1–44 |
| 11 | `Mother's occupation` | `int` | Code 0–194 |
| 12 | `Father's occupation` | `int` | Code 0–195 |
| 13 | `Admission grade` | `float` | Scale 0–200 |
| 14 | `Displaced` | `int` | Binary (0 / 1) |
| 15 | `Educational special needs` | `int` | Binary (0 / 1) |
| 16 | `Debtor` | `int` | Binary (0 / 1) |
| 17 | `Tuition fees up to date` | `int` | Binary (0 / 1) |
| 18 | `Gender` | `int` | Binary (1: Male, 0: Female) |
| 19 | `Scholarship holder` | `int` | Binary (0 / 1) |
| 20 | `Age at enrollment` | `int` | Matriculation age (17–70) |
| 21 | `International` | `int` | Binary (0 / 1) |
| 22 | `Curricular units 1st sem (credited)` | `int` | Count |
| 23 | `Curricular units 1st sem (enrolled)` | `int` | Count |
| 24 | `Curricular units 1st sem (evaluations)` | `int` | Count |
| 25 | `Curricular units 1st sem (approved)` | `int` | Count |
| 26 | `Curricular units 1st sem (grade)` | `float` | Scale 0–20 |
| 27 | `Curricular units 1st sem (without evaluations)` | `int` | Count |
| 28 | `Curricular units 2nd sem (credited)` | `int` | Count |
| 29 | `Curricular units 2nd sem (enrolled)` | `int` | Count |
| 30 | `Curricular units 2nd sem (evaluations)` | `int` | Count |
| 31 | `Curricular units 2nd sem (approved)` | `int` | Count |
| 32 | `Curricular units 2nd sem (grade)` | `float` | Scale 0–20 |
| 33 | `Curricular units 2nd sem (without evaluations)` | `int` | Count |
| 34 | `Unemployment rate` | `float` | Macroeconomic indicator % |
| 35 | `Inflation rate` | `float` | Macroeconomic indicator % |
| 36 | `GDP` | `float` | Macroeconomic indicator % |

### Input Validation Constraints:
1. **Target Column Forbidden**: `Target` must **NOT** be present. Passing `Target` raises `ValueError`.
2. **Missing Features Rejected**: Omission of any of the 36 features raises `ValueError`.
3. **Unexpected Features Rejected**: Unrecognized keys (e.g. `attendance`, `study_time`) raise `ValueError`. Optional key `student_id` is permitted as metadata.

---

## 4. Output Schema

The prediction returns a standardized dictionary:
```json
{
  "student_id": "S1001",
  "risk_score": 74,
  "risk_level": "High",
  "dropout_probability": 0.7449,
  "model_version": "student360_xgb_v2_real_features"
}
```

### Fields:
- `student_id` (`str`): Resolved student identifier.
- `risk_score` (`int`): Integer on scale `0` to `100`, calculated as $\text{round}(\text{dropout\_probability} \times 100)$.
- `risk_level` (`str`): Risk category (`"Low"`, `"Medium"`, or `"High"`).
- `dropout_probability` (`float`): Model's estimated probability for the `Dropout` class (rounded to 4 decimal places).
- `model_version` (`str`): `"student360_xgb_v2_real_features"`.

---

## 5. Risk Level Policy & Thresholds

The currently implemented risk tier boundaries (implementation decision):

| Risk Level | Dropout Probability Range | Risk Score Range | Recommended Operational Action |
| :---: | :---: | :---: | :--- |
| **Low** | $p < 0.35$ | `0` – `34` | Standard academic tracking |
| **Medium** | $0.35 \le p < 0.65$ | `35` – `64` | Academic advisor check-in |
| **High** | $p \ge 0.65$ | `65` – `100` | Immediate proactive intervention |

---

## 6. Verified Real Student Prediction Example

From `docs/DEMO_STUDENTS.json` (Record: `S1001`, Row index `0` in `data/data.csv`):
```json
{
  "student_id": "S1001",
  "risk_score": 74,
  "risk_level": "High",
  "dropout_probability": 0.7449,
  "model_version": "student360_xgb_v2_real_features"
}
```

---

## 7. Integration & Dependency Requirements

The backend service needs the following files and dependencies from the workspace:

### Required Code & Artifacts:
- `ml/prediction/predict.py` (and `ml/prediction/__init__.py`)
- `ml/training/preprocess.py` (and `ml/training/__init__.py`)
- `models/xgboost_model_v1.joblib`
- `models/preprocessor.joblib`

### Required Python Environment Packages:
```text
xgboost==3.4.1
scikit-learn==1.9.0
pandas==3.0.5
numpy==2.5.1
joblib==1.5.3
```

---

## 8. Error Handling Specification

| Error Condition | Exception Raised | Message Pattern |
| :--- | :--- | :--- |
| Missing required features | `ValueError` | `Missing {N} required feature(s): [...]` |
| Unexpected / invented features | `ValueError` | `Unexpected feature(s) detected: [...]. Only real UCI features defined in the frozen schema are accepted.` |
| `Target` supplied in input | `ValueError` | `Input features must not contain the target column 'Target'.` |
| Non-dict input | `TypeError` | `Expected features to be a dict, got {type}` |
| Missing artifact file | `FileNotFoundError` | `Model/Preprocessor artifact not found at {path}` |

---

## 9. Model Performance & Operational Limitations

### Held-out Test Performance Summary (`N=664`):
- **Accuracy**: $80.27\%$
- **Macro F1-Score**: $74.05\%$
- **Weighted F1-Score**: $79.62\%$
- **Macro ROC-AUC (OvR)**: $91.46\%$
- **Dropout Class Precision**: $85.20\%$
- **Dropout Class Recall**: $78.04\%$
- **Dropout Class F1-Score**: $81.46\%$

### Operational Boundaries:
- The model is trained on 1st-year academic metrics and socioeconomic indicators from the UCI benchmark.
- It provides early risk scoring; it does not replace human advisory evaluation.
- `Enrolled` minority class recall is $47.90\%$ due to transitional enrollment states in the underlying dataset.

---

## 10. Holistic Scoring Subsystem (Success Score & Placement Readiness)

Mohith has provided modular, standalone scoring engines in `ml/scoring/` for holistic student evaluation. These modules are completely independent of the frozen 36-feature XGBoost dropout risk pipeline.

### A. Placement Readiness Score
- **Module**: `ml.scoring.placement_readiness`
- **Import**: `from ml.scoring import calculate_placement_readiness`
- **Provisional Weights**: Aptitude (30%), Coding (30%), Mock Interviews (20%), Technical Skills (20%).
- **Features**:
  - Scores clamped to 0–100.
  - Dynamic weight renormalization when one or more assessment indicators are absent.
  - Returns `status: "insufficient_data"` and `readiness_score: None` when zero assessment indicators exist.
  - Tiers: `High` (≥70), `Moderate` (40–69), `Needs Attention` (<40).

```python
from ml.scoring import calculate_placement_readiness

result = calculate_placement_readiness(
    aptitude=80.0,
    coding=90.0,
    mock_interviews=70.0,
    technical_skills=85.0
)
# Returns:
# {
#   "readiness_score": 82,
#   "readiness_tier": "High",
#   "status": "calculated",
#   "weight_coverage": 1.0,
#   "components": { ... },
#   "note": "Rules-based provisional readiness assessment..."
# }
```

### B. Student Success Score
- **Module**: `ml.scoring.success_score`
- **Import**: `from ml.scoring import calculate_success_score, extract_academic_score_from_uci`
- **Provisional Formula**:
  $$\text{Success Score} = 0.35 \times \text{Academic} + 0.25 \times \text{Attendance} + 0.15 \times \text{LMS} + 0.10 \times \text{Engagement} + 0.15 \times \text{Placement Readiness}$$
- **Features**:
  - Dynamic weight renormalization across available components.
  - Derives genuine `Academic` score directly from real UCI dataset records when `uci_features` dictionary is supplied.
  - Requires at least 30% available weight coverage; otherwise returns `status: "insufficient_data"`.
  - Institutional standing tiers: `Exemplary` (≥85), `Good Standing` (70–84), `Developing` (50–69), `At Risk` (<50).
  - Clear provenance disclaimer distinguishing holistic success standing from XGBoost dropout risk probability.

```python
from ml.scoring import calculate_success_score

# Example with academic derived from real UCI student features
success_result = calculate_success_score(
    uci_features=student_uci_dict,
    attendance=90.0,
    placement_readiness=80.0
)
```

