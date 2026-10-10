# Student Success Score & Placement Readiness Methodology

**Platform:** Student360 — KPMG India Smart Campus Analytics  
**Version:** 2.0 (Institutional Enterprise Edition)  
**Author:** Student360 Data & ML Engineering Team  

---

## 1. Executive Summary & Purpose

The **Student Success Score** and **Placement Readiness Index** are explainable, rules-governed composite indicators designed to support institutional decision-making. 

In enterprise higher education, relying solely on a single dropout prediction model is inadequate because:
1. Supervised dropout models predict historical attrition risk based on frozen baseline features (e.g. 36 UCI features), but do not directly assess holistic ongoing student development.
2. Career progression and placement readiness have distinct drivers (aptitude, coding, mock interviews, skills) from academic non-completion.
3. Different institutional stakeholders require distinct indicators:
   - **Administrators**: Cohort health, financial standing, and resource allocation.
   - **Faculty / Academic Advisors**: Coursework completion, attendance risk, and academic momentum.
   - **Placement Cell**: Practical skill competencies, assessment benchmarks, and interview readiness.
   - **Students**: Clear transparency into their progress without opaque algorithmic scoring.

---

## 2. Core Tripartite Metric Separation

Student360 strictly distinguishes **three separate, complementary metrics**:

| Metric | Type | Scale | Mathematical / Algorithmic Engine | Purpose & Output |
| :--- | :---: | :---: | :--- | :--- |
| **XGBoost Dropout Risk** | Supervised Machine Learning | 0% – 100% (or 0–100 scale) | XGBoost Classifier (`models/xgboost_model_v1.joblib`) over 36 frozen UCI features | Predicts probability of student non-completion (Dropout vs. Enrolled/Graduate). Explained via TreeSHAP feature attributions. |
| **Student Success Score** | Composite Multi-Factor Index | 0 – 100 | Weighted aggregation with dynamic missing-data renormalization | Evaluates holistic student momentum across Academic, Attendance, LMS, Engagement, and Career domains. |
| **Placement Readiness** | Domain-Specific Assessment Index | 0 – 100 | Multi-criteria competency aggregation (Aptitude, Coding, Soft Skills, Interviews) | Measures preparedness for industry recruitment drives and professional placement. |

*Critical Governance Policy: The Student Success Score is NOT a machine learning probability. Dropout risk is NOT an evaluation of career placement. Each metric operates independently with separate APIs, transparent formulas, and documented limitations.*

---

## 3. Student Success Score: Formula, Weights & Normalization

### A. Dimensions and Default Prototype Weights

When all institutional data streams are integrated, the Student Success Score synthesizes five core dimensions:

$$\text{Student Success Score} = \sum_{i=1}^{5} w_i \cdot S_i$$

| Dimension ($i$) | Indicator Component | Weight ($w_i$) | Component Scale ($S_i$) | Calculation / Provenance Basis |
| :--- | :--- | :---: | :---: | :--- |
| 1. **Academic Performance** | `academic_score` | 35% ($0.35$) | $0 - 100$ | Normalized evaluation of curricular units approved ratio and academic grades (e.g., Portuguese 0–20 scale normalized to 0–100: $\text{Grade} \times 5$, combined with approval rate). |
| 2. **Attendance Record** | `attendance_score` | 20% ($0.20$) | $0 - 100$ | Overall session attendance percentage compared to institutional 75% examination threshold. |
| 3. **LMS Engagement** | `lms_score` | 15% ($0.15$) | $0 - 100$ | Login frequency, coursework deliverable submission timeliness, and LMS activity logs. |
| 4. **Student Engagement** | `engagement_score` | 15% ($0.15$) | $0 - 100$ | Verified participation in hackathons, university clubs, extracurriculars, research projects, and certifications. |
| 5. **Placement Readiness** | `placement_score` | 15% ($0.15$) | $0 - 100$ | Composite placement assessment rating (aptitude, coding, technical skills, and mock interviews). |

$$\sum_{i=1}^{5} w_i = 0.35 + 0.20 + 0.15 + 0.15 + 0.15 = 1.00$$

---

### B. Missing-Data Policy & Dynamic Weight Renormalization

In practical university operations, external data streams (LMS feeds, attendance logs, placement tests) may be partially available or awaiting scheduled imports.

#### 1. Coverage Calculation
Let $A \subseteq \{1, \dots, 5\}$ represent the set of dimensions with valid, non-null data.
$$\text{Weight Coverage} = \sum_{i \in A} w_i$$

#### 2. Minimum Data Threshold ($\ge 0.30$)
- If $\text{Weight Coverage} \ge 0.30$: The system dynamically renormalizes the weights across the available components so they sum to $1.00$:
$$\tilde{w}_i = \frac{w_i}{\text{Weight Coverage}} \quad \forall i \in A$$
$$\text{Student Success Score} = \text{round}\left( \sum_{i \in A} \tilde{w}_i \cdot S_i \right)$$

- If $\text{Weight Coverage} < 0.30$: The available evidence is mathematically inadequate. The platform returns `status: "insufficient_data"` and does not output an arbitrary or hallucinated score.

#### 3. Institutional Missing-Data Disclosure
Every calculation response explicitly returns:
- `score`: The computed integer score or `null` if insufficient data.
- `tier`: The standing tier (`Exemplary`, `Good Standing`, `Developing`, `At Risk`).
- `weight_coverage`: Exact proportion of weights available (e.g., `0.35` if only academic data is present).
- `missing_components`: Explicit array listing missing inputs (e.g., `["attendance_score", "lms_score", "engagement_score", "placement_score"]`).
- `renormalized`: Boolean flag (`true` / `false`) indicating if dynamic renormalization occurred.

---

### C. Success Score Standing Tiers

| Tier | Score Range | Institutional Meaning & Recommended Action |
| :--- | :---: | :--- |
| **Exemplary** | 85 – 100 | Outstanding academic and co-curricular momentum. Eligible for honors, peer tutoring leadership, and merit recognitions. |
| **Good Standing** | 70 – 84 | Consistent on-track performance across all monitored categories. Regular advising check-ins. |
| **Developing** | 50 – 69 | Moderate progress with room for improvement in one or more areas (e.g. attendance dips or pending deliverables). Targeted advisor nudges. |
| **At Risk** | 0 – 49 | Significant concerns in academic clearance or engagement. Queued for faculty intervention review and academic recovery plans. |

---

## 4. Placement Readiness Index: Methodology & Inputs

Placement readiness is independently computed using four focused industry competence streams:

$$\text{Placement Readiness} = \sum_{j=1}^{4} v_j \cdot P_j$$

| Input Component ($j$) | Default Weight ($v_j$) | Scale | Description / Basis |
| :--- | :---: | :---: | :--- |
| **Aptitude Assessments** | 30% ($0.30$) | $0 - 100$ | Quantitative, logical reasoning, and verbal comprehension exam scores. |
| **Coding Proficiency** | 30% ($0.30$) | $0 - 100$ | Data structures, algorithms, and hands-on coding assessment platforms. |
| **Mock Interview Ratings** | 20% ($0.20$) | $0 - 100$ | Faculty and industry expert evaluations from structured behavioral/technical mock interviews. |
| **Technical & Soft Skills** | 20% ($0.20$) | $0 - 100$ | Verified skill badges, project portfolios, and domain-specific certifications. |

- **Missing Data Handling**: Follows the same dynamic renormalization policy with a minimum coverage threshold of $0.20$.
- **Readiness Tiers**:
  - **High Readiness** ($75 - 100$): Prepared for top-tier campus recruitment.
  - **Moderate Readiness** ($50 - 74$): Needs targeted refinement in specific areas (e.g. mock interviews or coding practice).
  - **Needs Attention** ($0 - 49$): Requires placement cell bootcamps, resume review, and skill remediation.

---

## 5. Model Limitations & Responsible AI Guidelines

1. **Correlation vs. Causation**:
   - Supervised models (XGBoost) and SHAP attribution values reflect statistical correlations within historical datasets (e.g., UCI student records). They **do not prove causal relationships**.
   - What-If simulations are **counterfactual model projections**, demonstrating how the trained model responds to altered feature inputs. They are **not guarantees of real-world outcome**.

2. **Human-in-the-Loop Governance**:
   - AI and rules engines provide decision intelligence; they do not automatically execute sanctions, dismissals, or unreviewed actions.
   - All student interventions require explicit authorization by a named faculty advisor or administrator.

3. **Data Integrity & Provenance**:
   - Real institutional metrics are strictly separated from simulated outcome projections.
   - Unavailable data categories are clearly labeled `"Not available"` or `"Awaiting import"` — never fabricated as dummy zeroes or synthetic placeholders.

---

## 6. Endpoints & API Reference

- `POST /scoring/success-score`: Computes dynamic Student Success Score with custom or default weights and returns missing component breakdowns.
- `GET /scoring/students/{id}/success-score`: Fetches holistic success score for a specific student using all available database records.
- `POST /scoring/placement-readiness`: Computes placement readiness rating with input verification.
- `GET /scoring/students/{id}/placement-readiness`: Fetches student-specific placement readiness metrics.
- `POST /students/{id}/simulate-outcome`: Computes simulated post-intervention risk projections with transparent parameter deltas and demonstration disclaimers.
