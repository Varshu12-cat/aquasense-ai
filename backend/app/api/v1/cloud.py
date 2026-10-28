"""
AquaSense AI - Cloud Operations API Endpoints
"""

from fastapi import APIRouter, HTTPException
from backend.app.models.schemas import CloudOperationsStatus
from backend.app.services.cloud_service import cloud_service
from backend.app.services.data_service import data_service

router = APIRouter(prefix="/cloud", tags=["Cloud Operations"])


@router.get("/status", response_model=CloudOperationsStatus)
def get_cloud_status():
    """
    Displays the true configuration status of:
    - Google Cloud Storage (raw ingestion bucket)
    - BigQuery Data Warehouse
    - Cloud Run Functions (serverless ETL)
    - Vertex AI Model Registry / Training
    - Looker Studio Analytics Dashboard
    Clearly indicates Local Demo Mode when GCP credentials are not active.
    """
    try:
        return cloud_service.get_cloud_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check cloud operations status: {str(e)}")


@router.post("/sync")
def sync_telemetry_to_cloud():
    """
    Triggers ingestion sync to BigQuery and GCS.
    """
    try:
        df = data_service.get_raw_dataframe()
        bq_res = cloud_service.sync_to_bigquery(df)
        return {
            "status": "completed",
            "bigquery_sync": bq_res,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cloud sync failed: {str(e)}")
