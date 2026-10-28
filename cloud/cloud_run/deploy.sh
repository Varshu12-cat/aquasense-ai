#!/usr/bin/env bash
# ==============================================================================
# AquaSense AI - GCP Infrastructure Provisioning & Deployment Script (Bash)
# ==============================================================================

set -euo pipefail

PROJECT_ID=${GCP_PROJECT_ID:-"aquasense-ai-prod"}
REGION=${GCP_REGION:-"us-central1"}
BUCKET_NAME=${GCS_BUCKET_NAME:-"aquasense-ai-raw-telemetry"}
DATASET_NAME=${BIGQUERY_DATASET:-"aquasense_dw"}
TABLE_NAME=${BIGQUERY_TABLE:-"water_consumption_hourly"}
SERVICE_NAME="aquasense-backend"
REGISTRY_NAME="aquasense-registry"

echo "=== 1. Setting active GCP project ==="
gcloud config set project "$PROJECT_ID"

echo "=== 2. Enabling GCP Services ==="
gcloud services enable \
    run.googleapis.com \
    cloudfunctions.googleapis.com \
    cloudbuild.googleapis.com \
    artifactregistry.googleapis.com \
    storage.googleapis.com \
    bigquery.googleapis.com \
    aiplatform.googleapis.com

echo "=== 3. Creating Cloud Storage Raw Ingestion Bucket ==="
if ! gsutil ls -b "gs://$BUCKET_NAME" 2>/dev/null; then
    gsutil mb -p "$PROJECT_ID" -c STANDARD -l "$REGION" -b on "gs://$BUCKET_NAME"
    echo "Created bucket gs://$BUCKET_NAME"
else
    echo "Bucket gs://$BUCKET_NAME already exists."
fi

echo "=== 4. Creating BigQuery Dataset & Tables ==="
if ! bq show "$PROJECT_ID:$DATASET_NAME" 2>/dev/null; then
    bq --location="$REGION" mk --dataset "$PROJECT_ID:$DATASET_NAME"
    echo "Created BigQuery dataset $DATASET_NAME"
fi

# Create target hourly telemetry table with schema
bq mk --table \
    --schema=./cloud/bigquery/schemas/water_consumption_hourly.json \
    --time_partitioning_field=timestamp \
    --time_partitioning_type=DAY \
    "$PROJECT_ID:$DATASET_NAME.$TABLE_NAME" || true

# Create analytical views
bq query --use_legacy_sql=false < ./cloud/bigquery/views/vw_daily_consumption.sql
bq query --use_legacy_sql=false < ./cloud/bigquery/views/vw_location_performance.sql
bq query --use_legacy_sql=false < ./cloud/bigquery/views/vw_anomaly_log.sql

echo "=== 5. Creating Artifact Registry Repository ==="
gcloud artifacts repositories create "$REGISTRY_NAME" \
    --repository-format=docker \
    --location="$REGION" \
    --description="AquaSense AI Docker Repository" || true

echo "=== 6. Deploying Event-Driven Cloud Run Function ==="
gcloud functions deploy aquasense-etl \
    --gen2 \
    --runtime=python311 \
    --region="$REGION" \
    --source=./cloud/functions/etl_ingestion \
    --entry-point=gcs_to_bigquery_etl \
    --trigger-bucket="$BUCKET_NAME" \
    --set-env-vars="GCP_PROJECT_ID=$PROJECT_ID,BIGQUERY_DATASET=$DATASET_NAME,BIGQUERY_TABLE=$TABLE_NAME" \
    --allow-unauthenticated

echo "=== 7. Building & Deploying Backend to Cloud Run ==="
IMAGE_TAG="$REGION-docker.pkg.dev/$PROJECT_ID/$REGISTRY_NAME/backend:latest"
gcloud builds submit --tag "$IMAGE_TAG" -f Dockerfile .
gcloud run deploy "$SERVICE_NAME" \
    --image="$IMAGE_TAG" \
    --region="$REGION" \
    --platform=managed \
    --allow-unauthenticated \
    --set-env-vars="APP_ENV=production,GCP_PROJECT_ID=$PROJECT_ID,BIGQUERY_DATASET=$DATASET_NAME,GCS_BUCKET_NAME=$BUCKET_NAME"

echo "=== Deployment Completed Successfully! ==="
