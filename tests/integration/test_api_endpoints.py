"""
AquaSense AI - Integration Tests for REST API Endpoints
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import api, app

client = TestClient(app)


def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "cloud_status" in data


def test_frontend_cors_preflight():
    origin = "https://aquasense-ai-qkg3.onrender.com"
    response = client.options(
        "/api/dashboard/summary",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin
    assert "GET" in response.headers["access-control-allow-methods"]
    assert "content-type" in response.headers["access-control-allow-headers"].lower()

    post_response = client.options(
        "/api/forecast",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert post_response.status_code == 200
    assert post_response.headers["access-control-allow-origin"] == origin

    upload_response = client.options(
        "/api/datasets/upload",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert upload_response.status_code == 200
    assert upload_response.headers["access-control-allow-origin"] == origin


@pytest.mark.parametrize(
    "path",
    [
        "/api/dashboard/summary",
        "/api/conservation/insights",
        "/api/models/metrics",
        "/api/datasets",
        "/api/datasets/default-campus-90days/preview",
        "/api/cloud/status",
    ],
)
def test_frontend_cors_on_affected_get_routes(path):
    origin = "https://aquasense-ai-qkg3.onrender.com"
    response = client.get(path, headers={"Origin": origin})

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin


def test_cors_rejects_unconfigured_origin():
    response = client.options(
        "/api/dashboard/summary",
        headers={
            "Origin": "https://untrusted.example",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers


def test_cors_headers_are_added_to_error_responses():
    origin = "https://aquasense-ai-qkg3.onrender.com"
    response = client.get(
        "/api/nonexistent-route",
        headers={"Origin": origin},
    )

    assert response.status_code == 404
    assert response.headers["access-control-allow-origin"] == origin


def test_cors_headers_are_added_to_unhandled_server_errors():
    origin = "https://aquasense-ai-qkg3.onrender.com"

    def raise_server_error():
        raise RuntimeError("Test server error")

    api.add_api_route(
        "/_test/unhandled-error",
        raise_server_error,
        methods=["GET"],
    )
    test_client = TestClient(app, raise_server_exceptions=False)
    response = test_client.get(
        "/_test/unhandled-error",
        headers={"Origin": origin},
    )

    assert response.status_code == 500
    assert response.headers["access-control-allow-origin"] == origin


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
