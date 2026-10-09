"""
Student360 Configuration Module.
Resolves paths dynamically across development and production environments.
"""

import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

# Search for project root containing models/, docs/, and ml/
def find_project_root() -> Path:
    current = Path(__file__).resolve().parent
    # Check current and ancestors up to 4 levels
    for candidate in [current, current.parent, current.parent.parent, current.parent.parent.parent]:
        if (candidate / "models").exists() and (candidate / "docs").exists():
            return candidate
    # Fallback to parent of backend
    return current.parent.parent

PROJECT_ROOT: Path = find_project_root()

# Load .env if present
ENV_FILE = PROJECT_ROOT / ".env"
if ENV_FILE.exists():
    load_dotenv(ENV_FILE)
else:
    load_dotenv()

# Key artifact and data paths
MODELS_DIR: Path = PROJECT_ROOT / "models"
DOCS_DIR: Path = PROJECT_ROOT / "docs"
ML_DIR: Path = PROJECT_ROOT / "ml"

MODEL_PATH: Path = MODELS_DIR / "xgboost_model_v1.joblib"
PREPROCESSOR_PATH: Path = MODELS_DIR / "preprocessor.joblib"
DEMO_STUDENTS_PATH: Path = DOCS_DIR / "DEMO_STUDENTS.json"

# API & Security Settings
PROJECT_NAME: str = os.getenv("PROJECT_NAME", "Student360 API")
API_V1_STR: str = ""
ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

# CORS settings: parse comma-separated origins
CORS_ORIGIN_ENV: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173")
ALLOWED_ORIGINS: List[str] = [origin.strip() for origin in CORS_ORIGIN_ENV.split(",") if origin.strip()]
if "*" not in ALLOWED_ORIGINS and "http://localhost:3000" not in ALLOWED_ORIGINS:
    ALLOWED_ORIGINS.append("http://localhost:3000")
