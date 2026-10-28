"""
AquaSense AI - Unit Tests for Anomaly Detection
"""

import pytest
import pandas as pd
from backend.app.services.data_service import DataService


@pytest.fixture
def anomaly_test_service(tmp_path):
    csv_file = tmp_path / "mock_anomalies.csv"
    data = []
    
    # 72 hours of normal usage (mean ~ 20L/hr)
    dates = pd.date_range("2026-01-01 00:00:00", periods=72, freq="h")
    for i, dt in enumerate(dates):
        hr = dt.hour
        val = 20.0
        # Inject an overnight leak candidate between 02:00 and 03:00 on Day 2
        if i == 26:  # 02:00 AM
            val = 95.0
        # Inject a daytime spike
        elif i == 40:
            val = 140.0

        data.append({
            "timestamp": dt.strftime("%Y-%m-%d %H:%M:%S"),
            "meter_id": "MTR-HOSTEL-X",
            "location": "Hostel Test Wing",
            "water_consumption_liters": val,
            "hour_of_day": hr,
            "day_of_week": dt.weekday(),
            "is_weekend": 0,
            "temperature_c": 22.0,
        })
    
    pd.DataFrame(data).to_csv(csv_file, index=False)
    service = DataService(data_path=str(csv_file))
    return service


def test_anomaly_identification_and_distinction(anomaly_test_service):
    res = anomaly_test_service.get_anomalies()

    assert res.summary.total_anomalies >= 1
    # Check that is_confirmed_leak is FALSE (never claim verified leaks without physical audits)
    for a in res.anomalies:
        assert a.is_confirmed_leak is False
        assert a.observed_liters > a.expected_liters
        assert a.severity in ["high", "medium", "low"]


def test_conservation_opportunity_scenarios(anomaly_test_service):
    cons = anomaly_test_service.get_conservation_insights()

    assert len(cons.reduction_scenarios) == 3
    # Check 5%, 10%, 15% scenarios
    percentages = [s.scenario_percent for s in cons.reduction_scenarios]
    assert percentages == [5.0, 10.0, 15.0]

    # Verify that higher percentage delivers greater water savings
    assert cons.reduction_scenarios[2].estimated_water_saved_liters > cons.reduction_scenarios[0].estimated_water_saved_liters
    # Verify disclaimer is present
    assert "AquaSense AI does not physically alter plumbing" in cons.disclaimer
