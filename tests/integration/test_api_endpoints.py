"""
AquaSense AI - Integration Tests for REST API Endpoints
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "cloud_status" in data


def test_dashboard_summary_endpoint():
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_consumption_liters"] > 0
    assert data["avg_daily_consumption_liters"] > 0
    assert data["detected_anomalies_count"] >= 0
    assert len(data["daily_trend"]) > 0
    assert len(data["location_breakdown"]) > 0


def test_forecasting_endpoint():
    payload = {
        "meter_id": "MTR-HOSTEL-A",
        "horizon_hours": 24,
        "model_name": "random_forest",
    }
    response = client.post("/api/forecast", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["meter_id"] == "MTR-HOSTEL-A"
    assert len(data["predictions"]) == 24
    for p in data["predictions"]:
        assert p["predicted_liters"] >= 0
        assert p["lower_bound_liters"] <= p["predicted_liters"]
        assert p["upper_bound_liters"] >= p["predicted_liters"]


def test_anomalies_endpoint():
    response = client.get("/api/anomalies")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "anomalies" in data
    assert data["summary"]["total_anomalies"] >= 0


def test_models_metrics_endpoint():
    response = client.get("/api/models/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "models" in data
    assert "linear_regression" in data["models"]
    assert "random_forest" in data["models"]
    assert "mae" in data["models"]["random_forest"]
    assert "r2" in data["models"]["random_forest"]


def test_cloud_status_endpoint():
    response = client.get("/api/cloud/status")
    assert response.status_code == 200
    data = response.json()
    assert "services" in data
    assert len(data["services"]) >= 4


def test_conservation_insights_endpoint():
    response = client.get("/api/conservation/insights")
    assert response.status_code == 200
    data = response.json()
    assert len(data["reduction_scenarios"]) == 3
    assert len(data["actionable_recommendations"]) > 0


def test_datasets_preview_endpoint():
    response = client.get("/api/datasets/default-campus-90days/preview")
    assert response.status_code == 200
    data = response.json()
    assert "columns" in data
    assert "water_consumption_liters" in data["columns"]
    assert len(data["preview_rows"]) > 0


def test_invalid_upload_handling():
    files = {"file": ("malicious.exe", b"invalid-binary-content", "application/octet-stream")}
    response = client.post("/api/datasets/upload", files=files)
    assert response.status_code == 400
    assert "Only CSV files" in response.json()["detail"]
