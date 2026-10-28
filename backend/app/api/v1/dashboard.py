"""
AquaSense AI - Dashboard Summary API Endpoint
"""

from fastapi import APIRouter, HTTPException
from backend.app.models.schemas import DashboardSummaryResponse
from backend.app.services.data_service import data_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary():
    """
    Returns real-time KPIs: total consumption, average daily consumption,
    predicted next-day demand, anomaly counts, estimated conservation potential,
    trends, location breakdown, and recent alerts.
    """
    try:
        return data_service.get_dashboard_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate dashboard summary: {str(e)}")
