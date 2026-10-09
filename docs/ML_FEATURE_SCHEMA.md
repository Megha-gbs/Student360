# Student360 ML Feature Schema & Frozen Specification

This document defines the frozen feature schema for the Student360 ML Risk Prediction pipeline using the real UCI Student Dropout and Academic Success dataset (`data/data.csv`).

## 1. Schema Summary
- **Total Features in Schema**: 36
- **Target Column**: `Target` (Classes: `Dropout`, `Enrolled`, `Graduate`)
- **Primary Risk Target**: Probability of the `Dropout` class
- **Dataset Source**: UCI Machine Learning Repository (`data/data.csv`)

---

## 2. Feature Selection & Exclusion Rationale

### Selected Features (36 Total)
All 36 original UCI feature columns from `data/data.csv` are selected:
- **Academic Performance (1st & 2nd Semester)**: 12 features capturing enrolled, credited, evaluated, approved curricular units, and semester grade averages.
- **Prior Academic Background**: 3 features (`Previous qualification`, `Previous qualification (grade)`, `Admission grade`).
- **Demographic & Socioeconomic Factors**: 10 features (`Age at enrollment`, `Gender`, `Marital status`, `Displaced`, `Scholarship holder`, `Debtor`, `Tuition fees up to date`, `Mother's qualification`, `Father's qualification`, `Mother's occupation`, `Father's occupation`).
- **Institutional Context**: 5 features (`Course`, `Application mode`, `Application order`, `Daytime/evening attendance\t`, `Educational special needs`).
- **Nationality & Origin**: 2 features (`Nacionality`, `International`).
- **Macroeconomic Indicators**: 3 features (`Unemployment rate`, `Inflation rate`, `GDP`).

### Excluded Features
- **None**. All 36 columns present in `data/data.csv` are included.
- **Exclusion Evaluation Details**:
  - *Near-Constant Features (`Educational special needs` at 98.85%, `Nacionality` at 97.51%, `International` at 97.51%)*: Retained because they capture rare but high-stakes student sub-populations. Tree-based models (XGBoost) naturally handle sparse/imbalanced splits without degrading global performance or causing matrix inversion errors.
  - *Leakage Audit*: No post-graduation or post-dropout outcome variables exist in the dataset; 1st and 2nd semester curricular metrics represent 1st-year progress, which is the intended prediction baseline for early intervention.
  - *Zero Synthetic Columns*: Invented features (such as `attendance`, `study_time`) are strictly forbidden and excluded.

---

## 3. Exact Frozen Feature Order & Column Names

The table below lists the exact frozen feature order (1 to 36). Column names match the raw UCI dataset header verbatim, including the exact tab in column 5 (`Daytime/evening attendance\t`).

| Index | Exact Column Name | Type | Value Range / Categories | Description |
| :---: | :--- | :---: | :--- | :--- |
| 1 | `Marital status` | Categorical | 1: Single, 2: Married, 3: Widower, 4: Divorced, 5: Facto union, 6: Legally separated | Student marital status |
| 2 | `Application mode` | Categorical | 1 to 57 | Application phase / entry modality |
| 3 | `Application order` | Numerical / Ordinal | 0 to 9 | Order of student course preference |
| 4 | `Course` | Categorical | 33 to 9991 | Degree program code |
| 5 | `Daytime/evening attendance\t` (raw tab `\t`) | Binary / Categorical | 1: Daytime, 0: Evening | Attendance shift schedule |
| 6 | `Previous qualification` | Categorical | 1 to 43 | Highest prior educational credential |
| 7 | `Previous qualification (grade)` | Numerical | 95.0 – 190.0 (Scale: 0-200) | Grade of previous qualification |
| 8 | `Nacionality` | Categorical | 1 to 109 (1: Portuguese) | Student nationality |
| 9 | `Mother's qualification` | Categorical | 1 to 44 | Mother's education level |
| 10 | `Father's qualification` | Categorical | 1 to 44 | Father's education level |
| 11 | `Mother's occupation` | Categorical | 0 to 194 | Mother's professional occupation |
| 12 | `Father's occupation` | Categorical | 0 to 195 | Father's professional occupation |
| 13 | `Admission grade` | Numerical | 95.0 – 190.0 (Scale: 0-200) | Higher education entrance exam grade |
| 14 | `Displaced` | Binary / Categorical | 1: Yes, 0: No | Displaced student (living away from home) |
| 15 | `Educational special needs` | Binary / Categorical | 1: Yes, 0: No | Student special needs status |
| 16 | `Debtor` | Binary / Categorical | 1: Yes, 0: No | Student has outstanding debt to university |
| 17 | `Tuition fees up to date` | Binary / Categorical | 1: Yes, 0: No | Student tuition payments up to date |
| 18 | `Gender` | Binary / Categorical | 1: Male, 0: Female | Student biological sex |
| 19 | `Scholarship holder` | Binary / Categorical | 1: Yes, 0: No | Scholarship recipient |
| 20 | `Age at enrollment` | Numerical | 17 – 70 | Student age at matriculation |
| 21 | `International` | Binary / Categorical | 1: Yes, 0: No | International student indicator |
| 22 | `Curricular units 1st sem (credited)` | Numerical | 0 – 20 | Number of credited units in 1st semester |
| 23 | `Curricular units 1st sem (enrolled)` | Numerical | 0 – 26 | Number of enrolled units in 1st semester |
| 24 | `Curricular units 1st sem (evaluations)` | Numerical | 0 – 45 | Number of evaluations in 1st semester |
| 25 | `Curricular units 1st sem (approved)` | Numerical | 0 – 26 | Number of approved units in 1st semester |
| 26 | `Curricular units 1st sem (grade)` | Numerical | 0.0 – 20.0 | Grade average in 1st semester (0-20 scale) |
| 27 | `Curricular units 1st sem (without evaluations)` | Numerical | 0 – 12 | Number of units without evaluations (1st sem) |
| 28 | `Curricular units 2nd sem (credited)` | Numerical | 0 – 19 | Number of credited units in 2nd semester |
| 29 | `Curricular units 2nd sem (enrolled)` | Numerical | 0 – 23 | Number of enrolled units in 2nd semester |
| 30 | `Curricular units 2nd sem (evaluations)` | Numerical | 0 – 33 | Number of evaluations in 2nd semester |
| 31 | `Curricular units 2nd sem (approved)` | Numerical | 0 – 20 | Number of approved units in 2nd semester |
| 32 | `Curricular units 2nd sem (grade)` | Numerical | 0.0 – 20.0 | Grade average in 2nd semester (0-20 scale) |
| 33 | `Curricular units 2nd sem (without evaluations)` | Numerical | 0 – 12 | Number of units without evaluations (2nd sem) |
| 34 | `Unemployment rate` | Numerical | 7.6 – 16.2 (%) | Regional unemployment rate at enrollment |
| 35 | `Inflation rate` | Numerical | -0.8 – 3.7 (%) | Inflation rate at enrollment |
| 36 | `GDP` | Numerical | -4.06 – 3.51 (%) | GDP growth rate at enrollment |

---

## 4. Target Variable Specification
- **Column Name**: `Target`
- **Class Labels**:
  - `Dropout` (Primary risk class)
  - `Enrolled`
  - `Graduate`
- **Encoding for Multiclass Modeling**:
  - `Dropout` -> `0`
  - `Enrolled` -> `1`
  - `Graduate` -> `2`
- **Risk Score Formula**:
  $$\text{Risk Score} = \text{round}(\text{Probability}(\text{Dropout}) \times 100)$$
