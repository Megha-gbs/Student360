# Handoff: Explainability & SHAP Engine (Smruthi's Scope)

**Owner**: Smruthi  
**Target Consumers**: Sireesha (FastAPI Backend), Yashwanth (React Frontend)  
**Blueprint Compliance**: Upgrade 1 (Real UCI Features Only) & Upgrade 3 (Global Cohort Drivers)

---

## 1. Frozen API Contracts

### A. Per-Student SHAP Explanation (`top_reasons`)
Embedded inside the `GET /students/{id}` response payload:

```json
{
  "top_reasons": [
    {
      "feature": "Curricular units 2nd sem (approved)",
      "value": 3,
      "impact": "high",
      "direction": "increases_risk"
    },
    {
      "feature": "Tuition fees up to date",
      "value": 0,
      "impact": "medium",
      "direction": "increases_risk"
    },
    {
      "feature": "Admission grade",
      "value": 145.5,
      "impact": "high",
      "direction": "decreases_risk"
    }
  ]
}
```

#### Field Specifications:
- `feature` (`string`): Real UCI feature name from the official 36-column dataset. Prohibited fictional columns (`attendance`, `study_time`, etc.) are actively rejected.
- `value` (`number | string | boolean`): The student's recorded value for that feature.
- `impact` (`"high" | "medium" | "low"`): Normalized relative SHAP magnitude. The primary driver (rank 1) is always marked `"high"`.
- `direction` (`"increases_risk" | "decreases_risk"`): Whether the feature pushes the student toward dropout (`increases_risk`) or graduation (`decreases_risk`).

---

### B. Cohort Insights Global SHAP (`global_shap`)
Embedded inside the `GET /cohort/insights` response payload:

```json
{
  "global_shap": [
    {
      "feature": "Curricular units 2nd sem (approved)",
      "mean_abs_shap": 0.3842
    },
    {
      "feature": "Tuition fees up to date",
      "mean_abs_shap": 0.2915
    },
    {
      "feature": "Curricular units 1st sem (approved)",
      "mean_abs_shap": 0.2451
    },
    {
      "feature": "Admission grade",
      "mean_abs_shap": 0.1802
    }
  ]
}
```

#### Field Specifications:
- `feature` (`string`): Real UCI feature name.
- `mean_abs_shap` (`float`): Mean absolute SHAP value across the entire cohort (mean $|SHAP|$), sorted in descending order.

---

## 2. FastAPI Backend Integration (For Sireesha)

```python
from ml.explainability import (
    StudentSHAPExplainer,
    explain_student_risk,
    compute_cohort_global_shap,
)

# Option 1: One-liner convenience functions
student_explanation = explain_student_risk(
    model=loaded_xgboost_model,
    student_data=student_dict,
    top_k=5,
)
# Returns: {"top_reasons": [...]}

cohort_global = compute_cohort_global_shap(
    model=loaded_xgboost_model,
    cohort_data=cohort_list_or_df,
    top_k=10,
)
# Returns: {"global_shap": [...]}

# Option 2: Pre-initialized cached Explainer instance (Startup)
explainer = StudentSHAPExplainer(model=loaded_xgboost_model)

# In GET /students/{id}:
top_reasons = explainer.explain_student(student_dict, top_k=5).to_dict()["top_reasons"]

# In GET /cohort/insights:
global_shap_list = explainer.get_global_shap_list(cohort_records, top_k=10)
```

---

## 3. Strict Real-Feature Enforcement (Upgrade 1)

The module guarantees no hallucinated or fictional features enter the ML pipeline:
- Validates against `UCI_ALL_FEATURES` (36 official columns).
- Automatically rejects prohibited columns (`attendance`, `study_time`, `absences`, `weekly_study_hours`, etc.) with informative `ValueError` exceptions.
