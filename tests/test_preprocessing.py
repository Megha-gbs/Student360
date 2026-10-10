"""
Unit tests for Preprocessing Pipeline & Feature Validation
"""

import os
import sys

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import unittest
import pandas as pd
import numpy as np
from ml.training.preprocess import (
    FEATURE_ORDER,
    TARGET_COLUMN,
    build_preprocessor,
    validate_and_reorder_features,
    save_preprocessor,
    load_preprocessor
)


class TestPreprocessingPipeline(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.data_path = os.path.join('data', 'data.csv')
        cls.df = pd.read_csv(cls.data_path, sep=';')
        cls.sample_student = cls.df.iloc[0].drop(TARGET_COLUMN).to_dict()

    def test_feature_order_count(self):
        """Ensure exact 36 features are specified in schema."""
        self.assertEqual(len(FEATURE_ORDER), 36)
        self.assertIn("Daytime/evening attendance\t", FEATURE_ORDER)

    def test_validate_and_reorder_valid_input(self):
        """Ensure valid student record is accepted and ordered correctly."""
        validated_df = validate_and_reorder_features(self.sample_student)
        self.assertEqual(list(validated_df.columns), FEATURE_ORDER)
        self.assertEqual(len(validated_df), 1)

    def test_missing_feature_raises_error(self):
        """Ensure missing features raise a clear ValueError."""
        incomplete_features = self.sample_student.copy()
        del incomplete_features['Admission grade']
        with self.assertRaises(ValueError) as ctx:
            validate_and_reorder_features(incomplete_features)
        self.assertIn("Missing 1 required feature", str(ctx.exception))
        self.assertIn("Admission grade", str(ctx.exception))

    def test_target_leakage_prevention(self):
        """Ensure Target column raises a ValueError if included in feature inputs."""
        record_with_target = self.sample_student.copy()
        record_with_target['Target'] = 'Dropout'
        with self.assertRaises(ValueError) as ctx:
            validate_and_reorder_features(record_with_target)
        self.assertIn("Input features must not contain the target column 'Target'", str(ctx.exception))

    def test_preprocessor_serialization_and_consistency(self):
        """Ensure fitted preprocessor serializes, loads, and produces identical transformations."""
        X_raw = self.df.drop(columns=[TARGET_COLUMN])
        X = validate_and_reorder_features(X_raw)

        # Fit preprocessor on a subset
        train_subset = X.iloc[:100]
        preprocessor = build_preprocessor()
        preprocessor.fit(train_subset)

        # Save to temporary test artifact
        test_artifact_path = os.path.join('models', 'test_preprocessor.joblib')
        save_preprocessor(preprocessor, test_artifact_path)
        self.assertTrue(os.path.exists(test_artifact_path))

        # Load preprocessor
        loaded_preprocessor = load_preprocessor(test_artifact_path)

        # Compare transformations
        test_sample = X.iloc[100:110]
        orig_trans = preprocessor.transform(test_sample)
        loaded_trans = loaded_preprocessor.transform(test_sample)

        np.testing.assert_allclose(orig_trans, loaded_trans, rtol=1e-5, atol=1e-5)

        # Clean up test artifact
        if os.path.exists(test_artifact_path):
            os.remove(test_artifact_path)


if __name__ == '__main__':
    unittest.main()
