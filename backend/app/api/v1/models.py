"""
AquaSense AI - Machine Learning Model Metrics & Retraining API Endpoints
"""

from fastapi import APIRouter, HTTPException
from backend.app.models.schemas import (
    ModelEvaluationResponse,
    RetrainRequest,
    RetrainResponse,
)
from backend.app.services.ml_service import ml_service

router = APIRouter(prefix="/models", tags=["Machine Learning"])


@router.get("/metrics")
def get_model_metrics():
    """
    Returns actual calculated metrics (MAE, RMSE, R²) for:
    - Linear Regression Baseline
    - Random Forest Regressor
    - Gradient Boosting Regressor
    And anomaly detection metrics (Precision, Recall, F1, Confusion Matrix)
    computed from real predictions without fabricated accuracy.
    """
    try:
        return ml_service.get_evaluation_metrics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch model metrics: {str(e)}")


@router.post("/retrain", response_model=RetrainResponse)
def trigger_retraining(payload: RetrainRequest):
    """
    Triggers chronological retraining across all models with the specified test split ratio.
    """
    try:
        return ml_service.retrain(test_ratio=payload.test_ratio)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model retraining failed: {str(e)}")
