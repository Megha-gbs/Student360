"""
Unit tests for Saved XGBoost Model Artifact
"""

import os
import sys

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import unittest
import joblib
import numpy as np
import pandas as pd
from ml.training.preprocess import (
    FEATURE_ORDER,
    TARGET_COLUMN,
    load_preprocessor,
    validate_and_reorder_features
)


class TestModelArtifact(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.model_path = os.path.join('models', 'xgboost_model_v1.joblib')
        cls.preprocessor_path = os.path.join('models', 'preprocessor.joblib')
        cls.data_path = os.path.join('data', 'data.csv')

        # Verify artifacts exist
        if not os.path.exists(cls.model_path):
            from ml.training.train import train_model
            train_model()

        cls.model = joblib.load(cls.model_path)
        cls.preprocessor = load_preprocessor(cls.preprocessor_path)
        cls.df = pd.read_csv(cls.data_path, sep=';')

    def test_model_loads_successfully(self):
        """Ensure saved XGBoost model is loaded without error."""
        self.assertIsNotNone(self.model)

    def test_model_classes_and_structure(self):
        """Ensure model has exactly 3 output classes."""
        self.assertEqual(len(self.model.classes_), 3)
        np.testing.assert_array_equal(self.model.classes_, np.array([0, 1, 2]))

    def test_model_predict_proba_validity(self):
        """Ensure prediction probabilities are within [0, 1] and sum to 1."""
        sample = self.df.iloc[:5].drop(columns=[TARGET_COLUMN])
        sample_ordered = validate_and_reorder_features(sample)
        sample_trans = self.preprocessor.transform(sample_ordered)

        probs = self.model.predict_proba(sample_trans)
        self.assertEqual(probs.shape, (5, 3))
        self.assertTrue(np.all(probs >= 0.0))
        self.assertTrue(np.all(probs <= 1.0))
        np.testing.assert_allclose(probs.sum(axis=1), np.ones(5), rtol=1e-5, atol=1e-5)

    def test_dropout_probability_extraction(self):
        """Ensure Dropout probability (index 0) is correctly accessible."""
        sample = self.df.iloc[:3].drop(columns=[TARGET_COLUMN])
        sample_ordered = validate_and_reorder_features(sample)
        sample_trans = self.preprocessor.transform(sample_ordered)

        probs = self.model.predict_proba(sample_trans)
        dropout_probs = probs[:, 0]
        self.assertEqual(len(dropout_probs), 3)
        for p in dropout_probs:
            self.assertGreaterEqual(p, 0.0)
            self.assertLessEqual(p, 1.0)

    def test_inference_does_not_retrain_model(self):
        """Ensure running predictions does not change model weights/estimators."""
        initial_n_features = self.model.n_features_in_
        sample = self.df.iloc[:2].drop(columns=[TARGET_COLUMN])
        sample_ordered = validate_and_reorder_features(sample)
        sample_trans = self.preprocessor.transform(sample_ordered)

        _ = self.model.predict(sample_trans)
        self.assertEqual(self.model.n_features_in_, initial_n_features)


if __name__ == '__main__':
    unittest.main()
