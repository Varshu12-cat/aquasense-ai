"""
AquaSense AI - Cloud-Based Smart Water Demand Forecasting & Conservation Platform
Main FastAPI Application Entrypoint
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.models.schemas import HealthResponse
from backend.app.services.data_service import data_service
from backend.app.services.cloud_service import cloud_service

# Import API Routers
from backend.app.api.v1.dashboard import router as dashboard_router
from backend.app.api.v1.forecast import router as forecast_router
from backend.app.api.v1.anomalies import router as anomalies_router
from backend.app.api.v1.models import router as models_router
from backend.app.api.v1.datasets import router as datasets_router
from backend.app.api.v1.cloud import router as cloud_router
from backend.app.api.v1.conservation import router as conservation_router


api = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Cloud-based smart water demand forecasting, anomaly detection, "
        "and conservation platform with GCP integration and ML pipelines."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# Include Routers
api.include_router(dashboard_router, prefix=settings.API_V1_STR)
api.include_router(forecast_router, prefix=settings.API_V1_STR)
api.include_router(anomalies_router, prefix=settings.API_V1_STR)
api.include_router(models_router, prefix=settings.API_V1_STR)
api.include_router(datasets_router, prefix=settings.API_V1_STR)
api.include_router(cloud_router, prefix=settings.API_V1_STR)
api.include_router(conservation_router, prefix=settings.API_V1_STR)


@api.on_event("startup")
def startup_event():
    """Initializes in-memory telemetry dataset on startup."""
    try:
        data_service._ensure_loaded()
        print(f"[AquaSense AI] Backend successfully booted. Telemetry data cached.")
    except Exception as e:
        print(f"[AquaSense AI] Warning during initial data loading: {e}")


@api.get("/", tags=["Root"])
def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "mode": settings.APP_ENV,
        "docs": "/docs",
        "health": "/health",
    }


@api.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    has_creds, _ = cloud_service._check_credentials()
    return HealthResponse(
        status="healthy",
        version=settings.VERSION,
        environment=settings.APP_ENV,
        cloud_status="live_gcp" if has_creds else "local_demo_mode",
    )


# Wrap the complete application so CORS headers are also added to error responses.
app = CORSMiddleware(
    app=api,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)
