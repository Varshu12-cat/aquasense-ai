"""
AquaSense AI - Anomaly Detection API Endpoints
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from backend.app.models.schemas import AnomalyListResponse
from backend.app.services.data_service import data_service

router = APIRouter(prefix="/anomalies", tags=["Anomalies"])


@router.get("", response_model=AnomalyListResponse)
def get_anomalies(
    meter_id: Optional[str] = Query(None, description="Filter by meter ID"),
    severity: Optional[str] = Query(None, description="Filter by severity: high, medium, low"),
    min_deviation: float = Query(10.0, description="Minimum deviation in liters/hr"),
):
    """
    Returns detected water consumption anomalies:
    - Sudden consumption spikes
    - Unusually high baseline consumption
    - Abnormal overnight usage (01:00 - 05:00 AM)
    Clearly marks candidates requiring physical inspection rather than claiming confirmed leaks.
    """
    try:
        return data_service.get_anomalies(
            meter_id=meter_id,
            severity=severity,
            min_deviation=min_deviation,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch anomalies: {str(e)}")
