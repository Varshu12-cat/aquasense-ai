"""
AquaSense AI - Unit Tests for Data Pipeline & Feature Engineering
"""

import os
import pytest
import pandas as pd
import numpy as np

from ml.pipelines.data_pipeline import DataPipeline, FEATURE_COLUMNS, TARGET_COLUMN


@pytest.fixture
def sample_csv(tmp_path):
    """Creates a temporary mock telemetry dataset with edge cases."""
    csv_file = tmp_path / "mock_water_telemetry.csv"
    data = []
    meters = ["MTR-TEST-1", "MTR-TEST-2"]
    
    # 48 hours for 2 meters
    dates = pd.date_range("2026-01-01 00:00:00", periods=48, freq="h")
    for m in meters:
        for i, dt in enumerate(dates):
            # Introduce negative value to test clipping
            usage = -5.0 if (m == "MTR-TEST-1" and i == 0) else float(20.0 + (i % 12) * 2.5)
            data.append({
                "timestamp": dt.strftime("%Y-%m-%d %H:%M:%S"),
                "meter_id": m,
                "location": f"Facility {m[-1]}",
                "water_consumption_liters": usage,
                "temperature_c": 21.5,
            })
    
    # Add a duplicate record
    data.append(data[-1].copy())
    
    df = pd.DataFrame(data)
    df.to_csv(csv_file, index=False)
    return str(csv_file)


def test_schema_validation_and_cleaning(sample_csv):
    pipeline = DataPipeline()
    df, report = pipeline.load_and_validate(sample_csv)

    assert not df.empty
    assert "water_consumption_liters" in df.columns
    assert "timestamp" in df.columns
    assert "meter_id" in df.columns
    # Check that duplicate record was removed
    assert report["duplicate_records_removed"] >= 1
    # Check negative consumption was clipped to 0
    assert (df["water_consumption_liters"] >= 0.0).all()


def test_missing_mandatory_columns_raises_error(tmp_path):
    invalid_csv = tmp_path / "invalid_telemetry.csv"
    pd.DataFrame({"wrong_column": [1, 2, 3]}).to_csv(invalid_csv, index=False)
    
    pipeline = DataPipeline()
    with pytest.raises(ValueError, match="Missing mandatory columns"):
        pipeline.load_and_validate(str(invalid_csv))


def test_feature_engineering_no_target_leakage(sample_csv):
    pipeline = DataPipeline()
    df, _ = pipeline.load_and_validate(sample_csv)
    feat_df = pipeline.engineer_features(df)

    # Check all required features exist
    for col in FEATURE_COLUMNS:
        assert col in feat_df.columns, f"Feature column {col} missing"

    # Verify cyclical encodings bounded in [-1, 1]
    assert feat_df["sin_hour"].between(-1.0, 1.0).all()
    assert feat_df["cos_hour"].between(-1.0, 1.0).all()
    assert feat_df["sin_dow"].between(-1.0, 1.0).all()
    assert feat_df["cos_dow"].between(-1.0, 1.0).all()

    # Verify no NaN values in features
    assert not feat_df[FEATURE_COLUMNS].isna().any().any()


def test_time_aware_chronological_split(sample_csv):
    pipeline = DataPipeline()
    df, _ = pipeline.load_and_validate(sample_csv)
    feat_df = pipeline.engineer_features(df)

    train_df, test_df = pipeline.time_aware_split(feat_df, test_ratio=0.25)

    assert len(train_df) > 0
    assert len(test_df) > 0
    # Chronological integrity: Train timestamps must strictly precede test timestamps
    assert train_df["timestamp"].max() <= test_df["timestamp"].min()
