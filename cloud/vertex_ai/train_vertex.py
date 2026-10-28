"""
AquaSense AI - Vertex AI Custom Training Job Definition
Launches a managed training pipeline on Google Cloud Vertex AI using custom container images or prebuilt containers.
"""

import os
import argparse
import logging
from google.cloud import aiplatform

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("aquasense-vertex-ai")

PROJECT_ID = os.getenv("GCP_PROJECT_ID", "aquasense-ai-prod")
REGION = os.getenv("GCP_REGION", "us-central1")
STAGING_BUCKET = os.getenv("GCS_BUCKET_NAME", "aquasense-ai-raw-telemetry")


def submit_vertex_training_job(
    display_name: str = "aquasense-demand-forecaster-training",
    dataset_gcs_uri: str = "gs://aquasense-ai-raw-telemetry/campus_water_consumption_90days.csv",
    container_image_uri: str = "us-central1-docker.pkg.dev/aquasense-ai-prod/aquasense-registry/forecaster-trainer:latest",
    machine_type: str = "e2-standard-4",
):
    """
    Initializes Vertex AI SDK and submits a CustomContainerTrainingJob.
    """
    logger.info(f"Initializing Vertex AI with project={PROJECT_ID}, location={REGION}")
    aiplatform.init(
        project=PROJECT_ID,
        location=REGION,
        staging_bucket=f"gs://{STAGING_BUCKET}",
    )

    job = aiplatform.CustomContainerTrainingJob(
        display_name=display_name,
        container_uri=container_image_uri,
        command=["python", "ml/pipelines/train.py"],
        model_serving_container_image_uri="us-docker.pkg.dev/vertex-ai/prediction/sklearn-cpu.1-4:latest",
    )

    logger.info("Submitting custom job to Vertex AI Managed Compute...")
    model = job.run(
        dataset=None,
        args=[f"--data_path={dataset_gcs_uri}"],
        replica_count=1,
        machine_type=machine_type,
        model_display_name="aquasense-demand-forecaster-v1",
    )

    logger.info(f"Vertex AI Training completed. Registered Model Resource Name: {model.resource_name}")
    return model


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Submit AquaSense AI training job to Vertex AI")
    parser.add_argument("--gcs_uri", type=str, default=f"gs://{STAGING_BUCKET}/campus_water_consumption_90days.csv")
    args = parser.parse_args()

    # Note: Requires valid GCP credentials
    submit_vertex_training_job(dataset_gcs_uri=args.gcs_uri)
