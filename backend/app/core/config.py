"""
AquaSense AI - Backend Configuration & Settings
"""

import os
from typing import List
from pydantic import BaseModel


class Settings(BaseModel):
    PROJECT_NAME: str = "AquaSense AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # App environment: "demo" or "production"
    APP_ENV: str = os.getenv("APP_ENV", "demo")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://localhost:8000"
        ).split(",")
    ]
    
    # Paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    DATA_PATH: str = os.getenv(
        "DATA_PATH",
        os.path.join(BASE_DIR, "..", "data", "raw", "campus_water_consumption_90days.csv")
    )
    MODEL_DIR: str = os.getenv(
        "MODEL_STORAGE_PATH",
        os.path.join(BASE_DIR, "..", "ml", "models")
    )
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "..", "data", "uploads")
    
    # GCP Config
    GCP_PROJECT_ID: str = os.getenv("GCP_PROJECT_ID", "aquasense-ai-prod")
    GCP_REGION: str = os.getenv("GCP_REGION", "us-central1")
    GCS_BUCKET_NAME: str = os.getenv("GCS_BUCKET_NAME", "aquasense-ai-raw-telemetry")
    BIGQUERY_DATASET: str = os.getenv("BIGQUERY_DATASET", "aquasense_dw")
    BIGQUERY_TABLE: str = os.getenv("BIGQUERY_TABLE", "water_consumption_hourly")
    GOOGLE_APPLICATION_CREDENTIALS: str = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")
    
    # Model defaults
    ISOLATION_FOREST_CONTAMINATION: float = float(os.getenv("ISOLATION_FOREST_CONTAMINATION", "0.015"))
    DEFAULT_FORECAST_HORIZON_HOURS: int = int(os.getenv("DEFAULT_FORECAST_HORIZON_HOURS", "24"))


settings = Settings()
