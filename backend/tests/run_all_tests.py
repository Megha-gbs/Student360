"""
backend/tests/run_all_tests.py

Runs all backend and ML test suites with real-time unbuffered reporting.
"""

import sys
import unittest
from pathlib import Path

# Force unbuffered stdout
sys.stdout.reconfigure(line_buffering=True)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import pytest

print("=" * 75, flush=True)
print("STUDENT360 SMART CAMPUS UPGRADE: EXECUTING FULL PYTEST TEST SUITE", flush=True)
print("=" * 75, flush=True)

exit_code = pytest.main(["backend/tests", "ml/", "-v", "--tb=short"])

print("=" * 75, flush=True)
print(f"PYTEST SUITE EXIT CODE: {exit_code}", flush=True)
print("=" * 75, flush=True)

sys.exit(exit_code)

