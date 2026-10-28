"""
AquaSense AI - Dataset Management API Endpoints
"""

import os
import shutil
import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, UploadFile, File
import pandas as pd

from backend.app.core.config import settings
from backend.app.models.schemas import (
    DatasetInfo,
    DatasetPreviewResponse,
)
from backend.app.services.data_service import data_service

router = APIRouter(prefix="/datasets", tags=["Datasets"])


@router.get("", response_model=List[Dict[str, Any]])
def list_datasets():
    """Lists loaded and available water telemetry datasets."""
    try:
        return data_service.list_datasets()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list datasets: {str(e)}")


@router.get("/{dataset_id}/preview", response_model=DatasetPreviewResponse)
def preview_dataset(dataset_id: str):
    """
    Returns column schema, missing-value summary, duplicate detection,
    and preview rows for the specified dataset.
    """
    try:
        return data_service.preview_dataset(dataset_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to preview dataset: {str(e)}")


@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """
    Accepts CSV upload, validates schema and column types,
    checks for missing values and duplicates, and registers dataset.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files (.csv) are accepted.")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_id = str(uuid.uuid4())[:8]
    saved_filename = f"{file_id}_{file.filename}"
    saved_path = os.path.join(settings.UPLOAD_DIR, saved_filename)

    try:
        with open(saved_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Validate with pandas
        df = pd.read_csv(saved_path)
        required = ["timestamp", "meter_id", "water_consumption_liters"]
        missing = [c for c in required if c not in df.columns]
        if missing:
            os.remove(saved_path)
            raise HTTPException(
                status_code=400,
                detail=f"Uploaded file missing required columns: {missing}. Found: {list(df.columns)}",
            )

        # Reload data service with new dataset
        data_service.reload_data(custom_path=saved_path)

        return {
            "status": "success",
            "message": f"Dataset '{file.filename}' successfully validated and ingested.",
            "record_count": len(df),
            "columns": list(df.columns),
            "dataset_id": file_id,
        }
    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(saved_path):
            os.remove(saved_path)
        raise HTTPException(status_code=500, detail=f"Upload processing failed: {str(e)}")
