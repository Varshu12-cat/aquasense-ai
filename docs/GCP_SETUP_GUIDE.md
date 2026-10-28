# Google Cloud Platform (GCP) Configuration & Deployment Guide

This guide provides the exact commands required to deploy AquaSense AI to Google Cloud Platform.

---

## 1. Prerequisites
- Google Cloud Project with Billing Enabled.
- Google Cloud SDK (`gcloud` CLI) installed.
- Docker installed locally.

```bash
# Authenticate CLI
gcloud auth login
gcloud auth application-default login

# Configure Project
export GCP_PROJECT_ID="aquasense-ai-prod"
export GCP_REGION="us-central1"
gcloud config set project $GCP_PROJECT_ID
```

---

## 2. Enable Required Cloud APIs

```bash
gcloud services enable \
    run.googleapis.com \
    cloudfunctions.googleapis.com \
    cloudbuild.googleapis.com \
    artifactregistry.googleapis.com \
    storage.googleapis.com \
    bigquery.googleapis.com \
    aiplatform.googleapis.com
```

---

## 3. Create Google Cloud Storage Ingestion Bucket

```bash
gsutil mb -p $GCP_PROJECT_ID -c STANDARD -l $GCP_REGION -b on gs://aquasense-ai-raw-telemetry
```

---

## 4. Provision BigQuery Data Warehouse

```bash
# Create dataset
bq --location=$GCP_REGION mk --dataset $GCP_PROJECT_ID:aquasense_dw

# Create partitioned table with strict schema
bq mk --table \
    --schema=./cloud/bigquery/schemas/water_consumption_hourly.json \
    --time_partitioning_field=timestamp \
    --time_partitioning_type=DAY \
    $GCP_PROJECT_ID:aquasense_dw.water_consumption_hourly

# Create analytical views for Looker Studio
bq query --use_legacy_sql=false < ./cloud/bigquery/views/vw_daily_consumption.sql
bq query --use_legacy_sql=false < ./cloud/bigquery/views/vw_location_performance.sql
bq query --use_legacy_sql=false < ./cloud/bigquery/views/vw_anomaly_log.sql
```

---

## 5. Deploy Event-Driven Cloud Run Function (Serverless ETL)

```bash
gcloud functions deploy aquasense-etl \
    --gen2 \
    --runtime=python311 \
    --region=$GCP_REGION \
    --source=./cloud/functions/etl_ingestion \
    --entry-point=gcs_to_bigquery_etl \
    --trigger-bucket=aquasense-ai-raw-telemetry \
    --set-env-vars="GCP_PROJECT_ID=$GCP_PROJECT_ID,BIGQUERY_DATASET=aquasense_dw,BIGQUERY_TABLE=water_consumption_hourly" \
    --allow-unauthenticated
```

---

## 6. Build & Deploy Web Application to Cloud Run

```bash
# Create Artifact Registry Docker repository
gcloud artifacts repositories create aquasense-registry \
    --repository-format=docker \
    --location=$GCP_REGION \
    --description="AquaSense AI Docker Repository"

# Build & Push Docker image
IMAGE_URI="$GCP_REGION-docker.pkg.dev/$GCP_PROJECT_ID/aquasense-registry/backend:latest"
gcloud builds submit --tag "$IMAGE_URI" -f Dockerfile .

# Deploy container to Cloud Run
gcloud run deploy aquasense-backend \
    --image="$IMAGE_URI" \
    --region=$GCP_REGION \
    --platform=managed \
    --allow-unauthenticated \
    --set-env-vars="APP_ENV=production,GCP_PROJECT_ID=$GCP_PROJECT_ID,BIGQUERY_DATASET=aquasense_dw,GCS_BUCKET_NAME=aquasense-ai-raw-telemetry"
```

---

## 7. Connect Google Looker Studio
1. Open [https://lookerstudio.google.com/](https://lookerstudio.google.com/).
2. Select **BigQuery** connector.
3. Link to `aquasense-ai-prod.aquasense_dw.vw_daily_consumption`.
4. Follow the step-by-step layout guide in `dashboards/looker_studio/LOOKER_STUDIO_GUIDE.md`.
