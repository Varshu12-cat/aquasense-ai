# AquaSense AI - REST API Documentation

The AquaSense AI backend is implemented using **FastAPI** with strict **Pydantic** schema validation and automatic OpenAPI Swagger / ReDoc generation.

- **Base URL**: `http://localhost:8000` (Local) or Cloud Run Service URL (Production)
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`

---

## 1. System Health & Core

### `GET /health`
Returns system operational status, application version, environment, and cloud connectivity mode.

**Response `200 OK`**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "demo",
  "cloud_status": "local_demo_mode"
}
```

---

## 2. Executive Dashboard

### `GET /api/dashboard/summary`
Calculates and returns real-time high-level KPIs, 30-day daily trends, 12-week monthly trends, facility breakdown, and recent anomaly alerts.

**Response `200 OK`**:
```json
{
  "total_consumption_liters": 1755241.9,
  "avg_daily_consumption_liters": 19502.69,
  "predicted_next_day_liters": 19412.35,
  "detected_anomalies_count": 195,
  "estimated_potential_savings_liters": 152840.5,
  "estimated_potential_savings_percent": 8.7,
  "daily_trend": [
    { "timestamp": "2026-03-01", "actual_liters": 19230.5, "predicted_liters": 19100.2 }
  ],
  "location_breakdown": [
    {
      "meter_id": "MTR-HOSTEL-A",
      "location": "Hostel Block A",
      "total_liters": 384500.2,
      "avg_daily_liters": 4272.22,
      "percentage_of_total": 21.9,
      "anomaly_count": 38
    }
  ],
  "recent_alerts": [
    {
      "id": "alert-1",
      "timestamp": "2026-03-31T03:00:00",
      "meter_id": "MTR-HOSTEL-B",
      "location": "Hostel Block B",
      "severity": "high",
      "type": "overnight_leak",
      "description": "Hostel Block B: 98.4 L/hr observed (normal baseline: 18.2 L/hr)",
      "recommended_action": "Verify unoccupied building status; inspect main inlet for unstopped overnight flows.",
      "is_confirmed_leak": false
    }
  ],
  "dataset_freshness": "Telemetry current through 2026-03-31 23:00:00 UTC",
  "cloud_pipeline_status": "Local Demo Mode (Cloud Run & BigQuery Ready)",
  "is_demo_mode": true
}
```

---

## 3. Water Demand Forecasting

### `POST /api/forecast`
Generates time-aware multi-horizon demand predictions (12h, 24h, 48h, 168h / 7-day) for a specific meter or campus aggregate.

**Request Body**:
```json
{
  "meter_id": "MTR-HOSTEL-A",
  "horizon_hours": 24,
  "model_name": "random_forest"
}
```

**Response `200 OK`**:
```json
{
  "meter_id": "MTR-HOSTEL-A",
  "location": "Hostel Block A",
  "model_used": "Random Forest Regressor",
  "horizon_hours": 24,
  "forecast_generated_at": "2026-10-27T21:30:00Z",
  "predictions": [
    {
      "timestamp": "2026-04-01T00:00:00",
      "hour_of_day": 0,
      "predicted_liters": 21.4,
      "actual_liters": null,
      "lower_bound_liters": 17.4,
      "upper_bound_liters": 25.4
    }
  ],
  "metrics": {
    "name": "Random Forest Regressor",
    "mae": 22.61,
    "rmse": 39.19,
    "r2": 0.929
  }
}
```

### `GET /api/forecast/history`
Retrieves historical observations paired with actual vs predicted demand trends.
- Query Parameters: `meter_id` (string, optional), `days` (integer, default 14).

---

## 4. Anomaly Detection

### `GET /api/anomalies`
Returns detected anomalies filtered by severity or meter.
- Query Parameters: `meter_id` (string, optional), `severity` (string, optional: `high`, `medium`, `low`), `min_deviation` (float, default 10.0).

**Response `200 OK`**:
```json
{
  "summary": {
    "total_anomalies": 195,
    "by_severity": { "high": 42, "medium": 88, "low": 65 },
    "by_type": { "overnight_leak": 28, "sudden_spike": 94, "high_baseline": 73 },
    "by_location": { "Hostel Block A": 38, "Hostel Block B": 44, "Cafeteria": 51 }
  },
  "anomalies": [
    {
      "timestamp": "2026-03-31T02:00:00",
      "meter_id": "MTR-HOSTEL-B",
      "location": "Hostel Block B",
      "observed_liters": 112.5,
      "expected_liters": 19.1,
      "deviation_liters": 93.4,
      "severity": "high",
      "anomaly_type": "overnight_leak",
      "recommended_action": "Dispatch maintenance technician to inspect pipe joints and shut-off valves.",
      "is_confirmed_leak": false
    }
  ]
}
```

---

## 5. Machine Learning & Model Management

### `GET /api/models/metrics`
Returns empirical comparison across all trained forecasting models (Baseline Linear Regression vs. Random Forest vs. Gradient Boosting) and Isolation Forest anomaly metrics.

### `POST /api/models/retrain`
Triggers chronological pipeline retraining with updated test split ratio.

**Request Body**:
```json
{
  "test_ratio": 0.25
}
```

---

## 6. Conservation Insights

### `GET /api/conservation/insights`
Returns baseline comparisons, 5%, 10%, 15% reduction targets, projected financial savings in INR, and facility recommendations.

---

## 7. Dataset Management

### `GET /api/datasets`
Lists loaded datasets in registry.

### `GET /api/datasets/{dataset_id}/preview`
Returns first 15 records, schema validation summary, missing-value counts, and duplicate counts.

### `POST /api/datasets/upload`
Uploads and validates new CSV meter telemetry batch.
- Form Data: `file` (multipart/form-data, `.csv` only).

---

## 8. Cloud Operations

### `GET /api/cloud/status`
Returns configuration and live connectivity status for GCS, BigQuery, Cloud Run Functions, Vertex AI, and Looker Studio.
