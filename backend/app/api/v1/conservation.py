"""
AquaSense AI - Conservation Opportunities & Insights API Endpoint
"""

from fastapi import APIRouter, HTTPException
from backend.app.models.schemas import ConservationResponse
from backend.app.services.data_service import data_service

router = APIRouter(prefix="/conservation", tags=["Conservation"])


@router.get("/insights", response_model=ConservationResponse)
def get_conservation_insights():
    """
    Returns data-driven conservation recommendations:
    - Baseline vs current consumption comparison
    - Configurable 5%, 10%, 15% reduction scenarios with water and cost savings
    - Specific facility-level preventative actions
    Clearly distinguishes estimated projections from physically confirmed savings.
    """
    try:
        return data_service.get_conservation_insights()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate conservation insights: {str(e)}")
