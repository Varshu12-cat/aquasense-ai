"""
AquaSense AI - ML Evaluation & Residual Analysis
Generates comprehensive performance metrics, residual distributions,
and actual-vs-predicted data points for the web dashboard.
"""

import os
import json
from typing import Dict, Any, List
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score

from ml.pipelines.data_pipeline import DataPipeline, FEATURE_COLUMNS, TARGET_COLUMN


MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")


class ModelEvaluator:
    """Evaluates stored models, computes residuals, and prepares telemetry plots."""

    def __init__(self, model_dir: str = MODEL_DIR):
        self.model_dir = model_dir
        self.pipeline = DataPipeline()

    def get_evaluation_metrics(self, data_path: str) -> Dict[str, Any]:
        """Loads models, runs inference on test split, and returns rich evaluation telemetry."""
        metadata_file = os.path.join(self.model_dir, "model_metadata.json")
        if not os.path.exists(metadata_file):
            return {"error": "Models have not been trained yet. Please trigger training first."}

        with open(metadata_file, "r", encoding="utf-8") as f:
            metadata = json.load(f)

        df, _ = self.pipeline.load_and_validate(data_path)
        df = self.pipeline.engineer_features(df)
        _, test_df = self.pipeline.time_aware_split(df, test_ratio=metadata.get("test_split_ratio", 0.20))

        X_test = test_df[FEATURE_COLUMNS]
        y_test = test_df[TARGET_COLUMN].values

        rf_path = os.path.join(self.model_dir, "random_forest.joblib")
        lr_path = os.path.join(self.model_dir, "linear_regression.joblib")

        comparison = []
        sample_chart_points: List[Dict[str, Any]] = []

        if os.path.exists(rf_path) and os.path.exists(lr_path):
            rf_model = joblib.load(rf_path)
            lr_model = joblib.load(lr_path)

            rf_preds = rf_model.predict(X_test)
            lr_preds = lr_model.predict(X_test)

            # Residuals
            rf_residuals = (y_test - rf_preds).tolist()
            lr_residuals = (y_test - lr_preds).tolist()

            metadata["models"]["random_forest"]["residuals"] = {
                "mean": round(float(np.mean(rf_residuals)), 4),
                "std": round(float(np.std(rf_residuals)), 4),
                "min": round(float(np.min(rf_residuals)), 4),
                "max": round(float(np.max(rf_residuals)), 4),
            }

            metadata["models"]["linear_regression"]["residuals"] = {
                "mean": round(float(np.mean(lr_residuals)), 4),
                "std": round(float(np.std(lr_residuals)), 4),
                "min": round(float(np.min(lr_residuals)), 4),
                "max": round(float(np.max(lr_residuals)), 4),
            }

            # Sample 60 chronological test points for dashboard Actual vs Predicted comparison
            step = max(1, len(test_df) // 60)
            sample_indices = list(range(0, len(test_df), step))[:60]
            for idx in sample_indices:
                row = test_df.iloc[idx]
                sample_chart_points.append({
                    "timestamp": row["timestamp"].isoformat(),
                    "meter_id": str(row["meter_id"]),
                    "location": str(row.get("location", row["meter_id"])),
                    "actual_liters": round(float(y_test[idx]), 2),
                    "rf_predicted_liters": round(float(rf_preds[idx]), 2),
                    "lr_predicted_liters": round(float(lr_preds[idx]), 2),
                    "residual_liters": round(float(y_test[idx] - rf_preds[idx]), 2),
                })

        metadata["actual_vs_predicted_samples"] = sample_chart_points
        return metadata
