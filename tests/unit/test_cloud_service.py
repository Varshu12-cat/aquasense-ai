"""
AquaSense AI - Unit Tests for Cloud Service & Truthful Status Reporting
"""

from backend.app.services.cloud_service import GoogleCloudService


def test_truthful_unconfigured_cloud_status():
    """Verifies that absence of live GCP credentials reports demo mode, NOT fake success."""
    service = GoogleCloudService()
    status = service.get_cloud_status()

    # If no service account key was injected into env, must report demo mode
    assert status.demo_mode is True
    # Must report pending configuration for GCS and BigQuery
    service_statuses = {s.service_name: s.status for s in status.services}
    assert any("pending_configuration" in st for st in service_statuses.values())

    # Guide must contain explicit setup instructions
    assert "gcloud auth" in status.required_configuration_guide


def test_simulated_gcs_upload_in_demo_mode():
    service = GoogleCloudService()
    res = service.upload_to_gcs("non_existent_file.csv", "test_dest.csv")
    
    # In demo mode, gracefully informs caller without crashing
    assert res["mode"] == "demo_mode"
    assert "gs://" in res["destination_uri"]
