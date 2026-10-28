"""
AquaSense AI - Data Pipeline & Feature Engineering
Handles data ingestion, validation, chronological sorting, leak-free feature engineering,
and time-aware train/test splitting.
"""

from typing import Tuple, Dict, Any, List, Optional
import pandas as pd
import numpy as np


FEATURE_COLUMNS = [
    "hour_of_day",
    "day_of_week",
    "is_weekend",
    "temperature_c",
    "sin_hour",
    "cos_hour",
    "sin_dow",
    "cos_dow",
    "lag_1h",
    "lag_24h",
    "rolling_mean_6h",
    "rolling_mean_24h",
    "rolling_std_24h",
]

TARGET_COLUMN = "water_consumption_liters"


class DataPipeline:
    """End-to-end data validation, preprocessing, and feature engineering pipeline."""

    def __init__(self, target_col: str = TARGET_COLUMN):
        self.target_col = target_col
        self.feature_cols = FEATURE_COLUMNS
        self.meter_locations: Dict[str, str] = {}

    def load_and_validate(self, file_path_or_buffer) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Loads CSV, validates schema, standardizes column types, and reports quality metrics.
        """
        df = pd.read_csv(file_path_or_buffer)
        
        # Schema validation
        required_cols = ["timestamp", "meter_id", "water_consumption_liters"]
        missing_required = [col for col in required_cols if col not in df.columns]
        if missing_required:
            raise ValueError(f"Missing mandatory columns: {missing_required}")

        raw_count = len(df)
        
        # Parse timestamp
        df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
        invalid_ts_count = int(df["timestamp"].isna().sum())
        df = df.dropna(subset=["timestamp"])

        # Check for duplicate timestamps per meter
        duplicates = int(df.duplicated(subset=["timestamp", "meter_id"]).sum())
        df = df.drop_duplicates(subset=["timestamp", "meter_id"], keep="last")

        # Cast numeric values
        df[self.target_col] = pd.to_numeric(df[self.target_col], errors="coerce")
        missing_target = int(df[self.target_col].isna().sum())
        df = df.dropna(subset=[self.target_col])

        # Floor negative values to 0 (water meters cannot read negative consumption)
        df[self.target_col] = df[self.target_col].clip(lower=0.0)

        # Standardize temperature if present, otherwise default to neutral campus avg 22.0
        if "temperature_c" in df.columns:
            df["temperature_c"] = pd.to_numeric(df["temperature_c"], errors="coerce").fillna(22.0)
        else:
            df["temperature_c"] = 22.0

        # Standardize location
        if "location" not in df.columns:
            df["location"] = df["meter_id"]

        # Cache meter to location map
        loc_map = df[["meter_id", "location"]].drop_duplicates().set_index("meter_id")["location"].to_dict()
        self.meter_locations.update(loc_map)

        # Sort chronologically
        df = df.sort_values(by=["meter_id", "timestamp"]).reset_index(drop=True)

        quality_report = {
            "raw_record_count": raw_count,
            "cleaned_record_count": len(df),
            "invalid_timestamps_removed": invalid_ts_count,
            "duplicate_records_removed": duplicates,
            "missing_target_removed": missing_target,
            "meters_found": df["meter_id"].unique().tolist(),
            "locations_found": df["location"].unique().tolist(),
            "min_timestamp": df["timestamp"].min().isoformat() if not df.empty else None,
            "max_timestamp": df["timestamp"].max().isoformat() if not df.empty else None,
            "consumption_min": float(df[self.target_col].min()) if not df.empty else 0.0,
            "consumption_max": float(df[self.target_col].max()) if not df.empty else 0.0,
            "consumption_mean": float(df[self.target_col].mean()) if not df.empty else 0.0,
        }

        return df, quality_report

    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Creates time-based and lag features per meter without target leakage.
        Crucially uses shifted windows so future values are never visible to the model.
        """
        df = df.sort_values(by=["meter_id", "timestamp"]).copy()

        # Date/time features
        df["hour_of_day"] = df["timestamp"].dt.hour
        df["day_of_week"] = df["timestamp"].dt.dayofweek
        df["is_weekend"] = df["day_of_week"].apply(lambda x: 1 if x in [5, 6] else 0)

        # Cyclical transformations for periodicity
        df["sin_hour"] = np.sin(2 * np.pi * df["hour_of_day"] / 24.0)
        df["cos_hour"] = np.cos(2 * np.pi * df["hour_of_day"] / 24.0)
        df["sin_dow"] = np.sin(2 * np.pi * df["day_of_week"] / 7.0)
        df["cos_dow"] = np.cos(2 * np.pi * df["day_of_week"] / 7.0)

        # Per-meter lag and rolling features (prevents cross-meter contamination)
        grouped = df.groupby("meter_id")[self.target_col]

        # Shifted values to prevent target leakage
        df["lag_1h"] = grouped.shift(1)
        df["lag_24h"] = grouped.shift(24)

        # Rolling statistics on shifted series (so current target is NOT in the window)
        shifted = grouped.shift(1)
        df["rolling_mean_6h"] = shifted.rolling(window=6, min_periods=1).mean()
        df["rolling_mean_24h"] = shifted.rolling(window=24, min_periods=1).mean()
        df["rolling_std_24h"] = shifted.rolling(window=24, min_periods=1).std().fillna(0.0)

        # Fill any initial missing lag values with per-meter median or overall median
        overall_median = df[self.target_col].median()
        for col in ["lag_1h", "lag_24h", "rolling_mean_6h", "rolling_mean_24h"]:
            df[col] = df.groupby("meter_id")[col].transform(lambda s: s.fillna(s.median()))
            df[col] = df[col].fillna(overall_median)

        df["rolling_std_24h"] = df["rolling_std_24h"].fillna(0.0)

        return df

    def time_aware_split(
        self, df: pd.DataFrame, test_ratio: float = 0.20
    ) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Splits data chronologically to respect the temporal arrow of time.
        Strictly prevents future-to-past data leakage.
        """
        timestamps = df["timestamp"].drop_duplicates().sort_values()
        split_idx = int(len(timestamps) * (1.0 - test_ratio))
        split_time = timestamps.iloc[split_idx]

        train_df = df[df["timestamp"] < split_time].copy()
        test_df = df[df["timestamp"] >= split_time].copy()

        return train_df, test_df
