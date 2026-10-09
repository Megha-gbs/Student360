# Student360 FastAPI Backend & API Orchestration Layer

Welcome to the backend service for **Student360**, the AI-powered student retention and dropout risk monitoring platform. This production-grade FastAPI service orchestrates model inference, explainability (SHAP), trajectory analysis, and cohort-level intelligence.

---

## 1. Project Structure

```text
student360/
├── ml/                                # ML Pipelines & Model Code (Mohit & Smruthi)
│   ├── explainability/                # SHAP Explainability Engine (Smruthi)
│   │   ├── explainer.py
│   │   ├── schemas.py
│   │   └── uci_schema.py
│   ├── prediction/                    # Inference & Feature Validation (Mohit)
│   │   ├── predict.py
│   │   └── __init__.py
│   ├── training/                      # Data preprocessing & Pipeline definitions
│   │   ├── preprocess.py
│   │   └── __init__.py
│   └── trajectory/                    # Real Sem1 -> Sem2 Trajectory (Smruthi)
│       ├── generator.py
│       └── schemas.py
│
├── models/                            # Trained Artifacts (Untouched, Source of Truth)
│   ├── xgboost_model_v1.joblib        # Pre-trained multiclass XGBoost model
│   └── preprocessor.joblib            # Pre-trained ColumnTransformer pipeline
│
├── docs/                              # Frozen Documentation & Verified Demo Data
│   ├── DEMO_STUDENTS.json             # 10 verified real student records with actual UCI features
│   ├── DEMO_STUDENTS.md
│   ├── ML_BACKEND_HANDOFF.md
│   ├── ML_FEATURE_SCHEMA.md
│   └── MODEL_EVALUATION.md
│
├── backend/                           # Complete FastAPI Backend (Sireesha)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # Application entrypoint & CORS middleware
│   │   ├── config.py                  # Dynamic path resolution & environment configs
│   │   ├── schemas.py                 # Pydantic request/response schemas
│   │   │
│   │   ├── routes/                    # API Endpoints
│   │   │   ├── __init__.py
│   │   │   ├── students.py            # GET /students, GET /students/{id}
│   │   │   ├── simulation.py          # POST /simulate
│   │   │   ├── intervention.py        # POST /intervene, POST /students/{id}/simulate-outcome
│   │   │   └── cohort.py              # GET /cohort/insights
│   │   │
│   │   └── services/                  # Clean Integration Adapters
│   │       ├── __init__.py
│   │       ├── model_service.py       # Adapter delegating to ml.prediction.predict
│   │       ├── student_service.py     # Loader & cache for docs/DEMO_STUDENTS.json
│   │       ├── shap_service.py        # Adapter for ml.explainability (Smruthi)
│   │       ├── trajectory_service.py  # Adapter for ml.trajectory (Smruthi)
│   │       ├── intervention_service.py# Adapter for Causal Intervention Engine
│   │       └── cohort_service.py      # Cohort metrics & Global SHAP aggregator
│   │
│   ├── tests/                         # Comprehensive Pytest Suite
│   │   ├── __init__.py
│   │   ├── test_health.py             # Verifies /health endpoint
│   │   ├── test_students.py           # Verifies student listings, individual profiles, 404s
│   │   ├── test_simulation.py         # Verifies What-If simulation & strict 36 UCI features
│   │   ├── test_intervention.py       # Verifies intervention contracts & student validation
│   │   ├── test_cohort.py             # Verifies dynamic cohort metrics & Global SHAP
│   │   └── test_model_integration.py  # Verifies zero-retraining & deterministic outputs
│   │
│   ├── requirements.txt               # Backend dependencies
│   ├── .env.example                   # Environment configuration template
│   └── README.md                      # Backend documentation
```

---

## 2. Environment Setup

Copy `.env.example` to `.env` in the project root:

```bash
cp backend/.env.example .env
```

Ensure Python 3.12+ is installed and accessible.

---

## 3. Installation

Install all required dependencies using `pip`:

```bash
pip install -r backend/requirements.txt
```

---

## 4. Running FastAPI

From the repository root:

```bash
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

Alternatively, from the `backend/` directory:

```bash
python -m uvicorn app.main:app --reload --port 8000
```

---

## 5. Running Automated Tests

Run the complete test suite with `pytest`:

```bash
pytest backend/tests -v
```

---

## 6. Swagger & Interactive Documentation

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **OpenAPI Schema**: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

---

## 7. API Endpoint Reference

| Method | Endpoint | Description | Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | System health check (`{"status": "ok"}`) | **Fully Implemented** |
| `GET` | `/students` | List all 10 demo students with live predictions & trends | **Fully Implemented** |
| `GET` | `/students/{student_id}` | Full student profile, live prediction, SHAP top reasons & trajectory | **Fully Implemented** |
| `POST` | `/simulate` | What-If simulation with modified 36 UCI features | **Fully Implemented** |
| `GET` | `/cohort/insights` | Cohort-wide metrics (risk counts) and Global SHAP drivers | **Fully Implemented** |
| `POST` | `/intervene` | Trigger causal intervention workflow | **Integration-Ready** (`not_integrated`) |
| `POST` | `/students/{student_id}/simulate-outcome` | Simulate post-intervention causal outcome | **Integration-Ready** (`not_integrated`) |

---

## 8. How the Backend Connects to Mohit's ML Pipeline

- **Zero Retraining Guarantee**: The backend treats Mohit's artifacts (`models/xgboost_model_v1.joblib` and `models/preprocessor.joblib`) as strictly read-only. Weights are cached once in memory.
- **Direct Delegation**: `backend/app/services/model_service.py` directly delegates to `ml.prediction.predict.predict_student()`. It does **not** duplicate feature transformations, recreate XGBoost models, or hardcode prediction outcomes.
- **Strict 36 UCI Features Validation**: Every prediction and simulation request is validated by `validate_inference_features()`. Inventions such as fictional columns (`attendance`, `study_time`) or data leakage (`Target` column) are strictly rejected with HTTP 400.

---

## 9. Smruthi's Explainability & Trajectory Integration

- **SHAP Drivers**: `backend/app/services/shap_service.py` connects directly to Smruthi's `ml.explainability.StudentSHAPExplainer`. Every student profile in `GET /students/{id}` returns the top 3–5 real UCI contributors (`top_reasons`) with normalized impact levels and direction.
- **Sem 1 -> Sem 2 Curricular Trajectory**: `backend/app/services/trajectory_service.py` connects to Smruthi's `ml.trajectory.Sem1Sem2TrajectoryGenerator`. Returns honest 2-milestone curricular progress without fictional weekly data points.
- **Global SHAP Drivers**: `GET /cohort/insights` dynamically ranks cohort-wide feature importance (`global_shap`) using mean absolute SHAP values.

---

## 10. Status of Teammate Modules

| Module | Owner | Status | Integration Details |
| :--- | :--- | :--- | :--- |
| **Risk Prediction Pipeline** | Mohit | **Active & Integrated** | Connected via `model_service.py` to `predict_student()` |
| **SHAP Explanations** | Smruthi | **Active & Integrated** | Connected via `shap_service.py` to `StudentSHAPExplainer` |
| **Sem1 -> Sem2 Trajectory** | Smruthi | **Active & Integrated** | Connected via `trajectory_service.py` to `Sem1Sem2TrajectoryGenerator` |
| **Causal Intervention Engine** | Causal Team | **Awaiting Integration** | Structured contract returns `{"status": "not_integrated"}` without fabricating effects |
