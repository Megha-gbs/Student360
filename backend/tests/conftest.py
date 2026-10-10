"""backend/tests/conftest.py

Configures test environment and ensures repository root is in sys.path
regardless of current working directory.
"""

import sys
from pathlib import Path

# Ensure project root is at index 0 of sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
