# Student360 — Official Demo Instructions & Integration Guide

**Platform:** Student360 Comprehensive Higher-Ed Risk Intelligence & Institutional Management  
**Architecture:** FastAPI (Python 3.13) + React / Vite (Tailwind CSS) + XGBoost ML Engine + TreeSHAP  
**Author:** Meghana (Integration Lead) & Team Student360  

---

## 1. System Requirements & Environment Setup

### Prerequisites
- **Python**: Version 3.10 or higher (Verified on Python 3.13.5)
- **Node.js**: Version 18 or higher (Verified on Node.js v20+)
- **OS**: Windows, macOS, or Linux

### Environment Configuration
The backend and frontend communicate locally via port `8000` (FastAPI) and port `5173` (Vite dev server). No external API keys or cloud tokens are required for the standard demo.

---

## 2. Server Startup Commands

### A. Start Backend Server (FastAPI)
Open a terminal in the project root (`Student360_Final`):
```powershell
# In project root: C:\Users\mohitkumar\Downloads\Student360_Final
python -m uvicorn backend.app.main:app --port 8000 --host 127.0.0.1
```
*Expected Console Output:*
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     [Startup] Student360 Preloading ML model and preprocessor artifacts...
INFO:     [Startup] ML artifacts preloaded successfully (Model Version: student360_xgb_v2_real_features).
INFO:     [Startup] 10 verified demo students cached in memory.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

### B. Start Frontend Development Server (React / Vite)
Open a second terminal in the `frontend/` directory:
```powershell
cd frontend
npm run dev
```
*Expected Console Output:*
```
  VITE v6.4.4  ready in 450 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## 3. Verified Cohort Dataset Reference & Benchmark Students

The Student360 platform loads all **4,424 valid student records** directly from `data/data.csv` (`semicolon`-delimited, 36 frozen UCI features).

### Primary Demonstration Benchmarks
| Student ID | Dataset Row | Academic Baseline Summary | Risk Score | Risk Level | Ground Truth |
| :---: | :---: | :--- | :---: | :---: | :---: |
| **S1001** *(Primary Demo)* | Row 0 | 0/0 units approved, Tuition up to date: Yes, Debtor: No | **74** | **High** | Dropout |
| **S1002** | Row 1 | 6/6 units approved, Tuition up to date: No, Debtor: No | **10** | **Low** | Graduate |
| **S1003** | Row 2 | 0/0 units approved, Tuition up to date: No, Debtor: No | **99** | **High** | Dropout |
| **S1010** | Row 100 | 2/2 units approved, Tuition up to date: Yes, Debtor: Yes | **47** | **Medium** | Dropout |
| **S1011 – S5424** | Rows 10+ | Complete 4,424 cohort dataset populated with live model inference | *Varies* | *Low / Med / High* | Real Ground Truth |

---

## 4. Click-by-Click Demo Walkthrough

### Step 1: Priority Queue & Server-Side Pagination
1. Navigate in your browser to: `http://localhost:5173/priority-queue`
2. **What to Observe**:
   - The triage queue ranks the **complete 4,424 cohort** descending by live XGBoost dropout risk.
   - Use the **Risk Filter** buttons (`All`, `High`, `Medium`, `Low`) or search by student ID / course name (e.g. `Animation` or `S1001`).
   - Server-side pagination seamlessly supports navigating large cohort tables.
   - Click the **"View 360"** button on student **S1001**.

### Step 2: Student 360 Profile & Holistic Scoring
1. URL opens: `http://localhost:5173/students/S1001`
2. **What to Observe**:
   - **Student Banner**: Displays demographics (`Age at Matriculation: 20`, `Tuition Status: Up to date`, `Debtor Status: Clear`, `Scholarship: Self-Funded`).
   - **Risk Metric Card**: Shows `Risk Score: 74/100`, `Risk Level: High`, `Dropout Probability: 74.5%`, `Trend: Stable`, and Model Version badge `student360_xgb_v2_real_features`.
   - **Student Success Score Card**: Displays holistic 0–100 score (`Developing` / `At Risk`), with component coverage and missing data policy.
   - **Placement Readiness Card**: Shows domain-specific readiness (`Needs Attention` / `Moderate` / `High`).

### Step 3: Real Sem 1 → Sem 2 Trajectory
1. Scroll to the **"Semester Academic Trajectory"** section.
2. **What to Observe**:
   - Points are strictly derived from real UCI curricular units (`Sem 1: 0 units approved, Grade: 0.0` → `Sem 2: 0 units approved, Grade: 0.0`).
   - Explicit institutional note confirms no synthetic weekly points are fabricated.

### Step 4: SHAP Explainability Engine (Feature Drivers)
1. Scroll to the **"Why is this student at risk? (SHAP Feature Attribution)"** section.
2. **What to Observe**:
   - Displays top drivers calculated by TreeSHAP:
     - `Curricular units 2nd sem (approved) = 0` (High Impact, Increases Risk)
     - `Curricular units 1st sem (approved) = 0` (High Impact, Increases Risk)
     - `Age at enrollment = 20` (Medium Impact, Increases Risk)
     - `Tuition fees up to date = 1` (Medium Impact, Decreases Risk)

### Step 5: What-If Counterfactual Simulation
1. Scroll to the **"What-If Counterfactual Simulation"** panel.
2. **Notice the Disclaimer**: *"Model-based What-If simulation — not a causal guarantee."*
3. **Interactive Adjustment**:
   - Move **Sem 2 Approved Units** slider from `0` to `6` units.
   - Move **Sem 2 Grade** slider from `0.0` to `14.5` / 20.
   - Click **"Run Counterfactual Simulation"**.
4. **Result Box Appears**:
   - Baseline Risk: `74` → Simulated Risk: `~12` (Emerald Badge).
   - Risk Reduction: `-62 pts`.

### Step 6: Recommended Intervention & Human-in-the-Loop Approval
1. Scroll to the **"Recommended Intervention & Human Approval"** panel.
2. **What to Observe**:
   - AI drafts recommendation: `Subject Tutoring & Academic Recovery Plan` (Priority: Immediate).
   - Assigned Human Advisor field pre-fills with `Dr. Elena Rostova (Senior Academic Advisor)`.
   - Advisor notes can be reviewed and edited.
   - Status badge initially displays `Pending Human Approval` (Amber).
3. **Action**: Click **"Authorize & Launch Intervention"**.
4. **Confirmation**:
   - Badge changes to `Authorized by Advisor` (Emerald).
   - Confirmation banner shows human approval registered with timestamp.

### Step 7: Simulated Post-Intervention Outcome Projection
1. Scroll to the **"Simulated Outcome Projection"** panel.
2. **Notice the Label**: *"Simulated demonstration outcome post-intervention; not real student improvement."*
3. **Action**: Click **"Calculate Projected Outcome"**.
4. **Results Display**:
   - Projected Dropout Risk: `~33 / 100` (Reduced by 41 pts).
   - Projected Retention Rate: `67%`.
   - Graduation Timeline: `On-Track with 1 Retake Term`.

### Step 8: Cohort Intelligence & Global SHAP
1. Navigate via top navigation to: `http://localhost:5173/cohort-insights` (or `/cohort`).
2. **What to Observe**:
   - Total Monitored Students: **4,424**.
   - Cohort Risk Distribution doughnut chart (High, Medium, Low).
   - **Global Top Risk Drivers (Mean |SHAP|)**: Ranks most impactful institutional features across the entire student population (`Curricular units 2nd sem (approved)` #1, `Curricular units 1st sem (approved)` #2, `Tuition fees up to date` #3).
   - **Student Segments**: Real segmentation derived from academic units, financial flags, and age.
   - **Program Risk Table**: Shows degree program breakdown with true cohort enrollment counts.

### Step 9: Financial Operations & Indian Rupee (INR) Formatting
1. Navigate to `http://localhost:5173/admin/fees` (or `/student/fees`).
2. **What to Observe**:
   - All revenue cards, fee breakdowns, student balances, and payment receipts format consistently in Indian Rupees (`₹` / `en-IN`, e.g., `₹40,000.00`, `₹38,500.00`).

### Step 10: Permanent Light Mode & Accessibility
- Note that the application operates in permanent, crisp light theme with zero dark mode toggle controls or style flickering.

---

## 5. Automated Verification Test Suite

To verify the complete system programmatically at any time, execute:

```powershell
# Run all Python ML, Backend, RBAC, Scoring, and Integration tests
python -m pytest backend/tests ml/ -v

# Run Frontend Currency Formatting unit tests
cd frontend
node --test src/utils/currency.test.js

# Verify Frontend Production Build
npm run build
```

---

## 6. Troubleshooting & FAQs

- **Port 8000 already in use:**
  ```powershell
  # Check and kill running python process on Windows:
  netstat -ano | findstr :8000
  taskkill /PID <PID> /F
  ```
- **Blank page or CORS error:**
  Verify that the backend is running at `http://127.0.0.1:8000` and `VITE_API_BASE_URL` is set to `http://localhost:8000` (or defaults to it).
- **Resetting Ingestion Cache:**
  If test CSV uploads were staged during demonstration, restart the uvicorn process to reload the clean verified `data/data.csv` dataset.
