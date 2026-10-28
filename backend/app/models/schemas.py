"""
AquaSense AI - Pydantic Request & Response Schemas
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


# Health Check
class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
    cloud_status: str


# Dashboard Schemas
class TrendPoint(BaseModel):
    timestamp: str
    actual_liters: float
    predicted_liters: Optional[float] = None


class LocationBreakdown(BaseModel):
    meter_id: str
    location: str
    total_liters: float
    avg_daily_liters: float
    percentage_of_total: float
    anomaly_count: int


class AlertItem(BaseModel):
    id: str
    timestamp: str
    meter_id: str
    location: str
    severity: str  # "high", "medium", "low"
    type: str  # "sudden_spike", "overnight_leak", "high_baseline", "unusual_pattern"
    description: str
    recommended_action: str
    is_confirmed_leak: bool = False  # Clearly distinguishing predicted vs confirmed


class DashboardSummaryResponse(BaseModel):
    total_consumption_liters: float
    avg_daily_consumption_liters: float
    predicted_next_day_liters: float
    detected_anomalies_count: int
    estimated_potential_savings_liters: float
    estimated_potential_savings_percent: float
    daily_trend: List[TrendPoint]
    weekly_trend: List[TrendPoint]
    location_breakdown: List[LocationBreakdown]
    recent_alerts: List[AlertItem]
    dataset_freshness: str
    cloud_pipeline_status: str
    is_demo_mode: bool


# Forecasting Schemas
class ForecastRequest(BaseModel):
    meter_id: Optional[str] = None  # None means all meters combined
    horizon_hours: int = Field(default=24, ge=1, le=168)
    model_name: str = Field(default="random_forest")  # "random_forest", "linear_regression", "gradient_boosting"


class ForecastDataPoint(BaseModel):
    timestamp: str
    hour_of_day: int
    predicted_liters: float
    actual_liters: Optional[float] = None
    lower_bound_liters: float
    upper_bound_liters: float


class ForecastResponse(BaseModel):
    meter_id: str
    location: str
    model_used: str
    horizon_hours: int
    forecast_generated_at: str
    predictions: List[ForecastDataPoint]
    metrics: Dict[str, Any]


# Anomaly Schemas
class AnomalyItem(BaseModel):
    timestamp: str
    meter_id: str
    location: str
    observed_liters: float
    expected_liters: float
    deviation_liters: float
    severity: str
    anomaly_type: str
    recommended_action: str
    is_confirmed_leak: bool = False


class AnomalySummary(BaseModel):
    total_anomalies: int
    by_severity: Dict[str, int]
    by_type: Dict[str, int]
    by_location: Dict[str, int]


class AnomalyListResponse(BaseModel):
    summary: AnomalySummary
    anomalies: List[AnomalyItem]


# Conservation Schemas
class ReductionScenario(BaseModel):
    scenario_percent: float  # e.g. 5, 10, 15
    estimated_water_saved_liters: float
    estimated_cost_saved_inr: float
    target_daily_budget_liters: float


class ConservationResponse(BaseModel):
    current_daily_consumption_liters: float
    historical_baseline_daily_liters: float
    percent_above_baseline: float
    reduction_scenarios: List[ReductionScenario]
    actionable_recommendations: List[Dict[str, Any]]
    disclaimer: str


# Model Metrics Schemas
class ModelEvaluationResponse(BaseModel):
    training_timestamp: str
    test_split_ratio: float
    train_record_count: int
    test_record_count: int
    models: Dict[str, Any]
    anomaly_model: Dict[str, Any]
    best_forecaster: str
    actual_vs_predicted_samples: List[Dict[str, Any]]


class RetrainRequest(BaseModel):
    test_ratio: float = Field(default=0.20, ge=0.05, le=0.50)


class RetrainResponse(BaseModel):
    status: str
    message: str
    metrics: Dict[str, Any]


# Data Management Schemas
class DatasetInfo(BaseModel):
    dataset_id: str
    filename: str
    file_size_bytes: int
    total_records: int
    min_date: Optional[str]
    max_date: Optional[str]
    uploaded_at: str
    status: str


class DatasetPreviewResponse(BaseModel):
    info: DatasetInfo
    columns: List[str]
    preview_rows: List[Dict[str, Any]]
    missing_values: Dict[str, int]
    duplicates_found: int


# Cloud Status Schemas
class CloudServiceStatus(BaseModel):
    service_name: str
    status: str  # "operational", "pending_configuration", "degraded", "not_configured"
    details: str
    last_synced_at: Optional[str] = None


class CloudOperationsStatus(BaseModel):
    is_live_cloud_connected: bool
    demo_mode: bool
    gcp_project_id: str
    gcp_region: str
    services: List[CloudServiceStatus]
    required_configuration_guide: str
