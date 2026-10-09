# Student360 Model Evaluation & Validation Report

This document records the exact, verified evaluation metrics and artifact validation for the Student360 XGBoost risk prediction model trained on the UCI Student Dropout dataset (`data/data.csv`).

## 1. Overview & Dataset Split
- **Algorithm**: XGBoost Classifier (`xgboost 3.4.1`)
- **Model Version**: `student360_xgb_v2_real_features`
- **Model Formulation**: 3-class classification (`Dropout`, `Enrolled`, `Graduate`)
- **Primary Risk Target**: Probability of the `Dropout` class (Index `0`)
- **Dataset Partitioning (Stratified Split, Seed 42)**:
  - **Train Set**: 3,096 samples (70.0%)
  - **Validation Set**: 664 samples (15.0%)
  - **Held-out Test Set**: 664 samples (15.0%)
- **Preprocessing Pipeline**: Fitted strictly on the 3,096 training samples and serialized to `models/preprocessor.joblib`.

---

## 2. XGBoost Hyperparameters
```python
{
    "objective": "multi:softprob",
    "num_class": 3,
    "eval_metric": "mlogloss",
    "n_estimators": 300,
    "learning_rate": 0.05,
    "max_depth": 4,
    "subsample": 0.8,
    "colsample_bytree": 0.8,
    "reg_alpha": 0.1,
    "reg_lambda": 1.0,
    "random_state": 42,
    "early_stopping_rounds": 30,
    "n_jobs": -1
}
```
*Early stopping triggered at best iteration: **263**.*

---

## 3. Verified Performance Across Partitions

| Metric | Training Split (`N=3096`) | Validation Split (`N=664`) | Held-out Test Split (`N=664`) |
| :--- | :---: | :---: | :---: |
| **Accuracy** | 89.18% | 75.75% | **80.27%** |
| **F1-Score (Macro)** | 86.23% | 68.96% | **74.05%** |
| **F1-Score (Weighted)** | 88.94% | 75.14% | **79.62%** |
| **Precision (Macro)** | 89.37% | 71.93% | **76.07%** |
| **Precision (Weighted)** | 89.12% | 75.25% | **79.62%** |
| **Recall (Macro)** | 84.14% | 67.75% | **73.08%** |
| **Recall (Weighted)** | 89.18% | 75.75% | **80.27%** |
| **ROC-AUC (OvR Macro)** | 97.23% | 88.37% | **91.46%** |
| **ROC-AUC (OvR Weighted)** | 97.47% | 88.80% | **92.20%** |

---

## 4. Per-Class Performance on Held-out Test Set (`N=664`)

| Target Class | Class Code / Index | Precision | Recall | F1-Score | Support |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Dropout** *(Primary Risk)* | `0` | **85.20%** | **78.04%** | **81.46%** | 214 |
| **Enrolled** | `1` | **58.16%** | **47.90%** | **52.53%** | 119 |
| **Graduate** | `2` | **83.51%** | **93.35%** | **88.16%** | 331 |

### Dropout-Specific Risk Analysis
- **Dropout Precision (85.20%)**: When the model flags a student as at-risk of dropping out, it is correct in over 85% of cases.
- **Dropout Recall (78.04%)**: The model successfully identifies 167 out of 214 actual dropout cases in the held-out test cohort.
- **Enrolled Ambiguity**: As typical in academic success modeling, the `Enrolled` minority class represents transient states (students who may later graduate or drop out), leading to moderate recall (47.90%).

---

## 5. Held-out Test Confusion Matrix

```text
                        Predicted Class
                  Dropout    Enrolled    Graduate    Total (True)
True Dropout        167         26          21           214
True Enrolled        22         57          40           119
True Graduate         7         15         309           331
Total (Pred)        196         98         370           664
```

---

## 6. Overfitting Assessment
- **Train Accuracy**: 89.18%
- **Validation Accuracy**: 75.75%
- **Test Accuracy**: 80.27%
- **Assessment**: The gap between training accuracy (89.18%) and test accuracy (80.27%) is approximately 8.9 percentage points. L1 (`reg_alpha=0.1`) and L2 (`reg_lambda=1.0`) regularization, subsampling (`0.8`), and early stopping (`iteration 263`) effectively protected against catastrophic memorization while achieving 91.46% ROC-AUC on unseen data.

---

## 7. Artifact Manifest & Verification
1. **Fitted Preprocessor**: `models/preprocessor.joblib` (Type: `sklearn.compose.ColumnTransformer`, Input: 36 features, Transformed Output: 233 features).
2. **Trained XGBoost Classifier**: `models/xgboost_model_v1.joblib` (Type: `xgboost.sklearn.XGBClassifier`, Output Classes: `[0, 1, 2]`).
3. **Class Index Mapping**:
   - Index `0` $\rightarrow$ `Dropout`
   - Index `1` $\rightarrow$ `Enrolled`
   - Index `2` $\rightarrow$ `Graduate`
4. **Independent Loading**: Verified that an isolated Python process loads both artifacts and executes inference without retraining.
