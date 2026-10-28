# AquaSense AI - GCP Deployment Script (PowerShell for Windows)
param(
    [string]$ProjectId = $env:GCP_PROJECT_ID,
    [string]$Region = "us-central1",
    [string]$BucketName = "aquasense-ai-raw-telemetry",
    [string]$DatasetName = "aquasense_dw",
    [string]$TableName = "water_consumption_hourly"
)

if (-not $ProjectId) {
    $ProjectId = "aquasense-ai-prod"
}

Write-Host "=== 1. Setting active project: $ProjectId ===" -ForegroundColor Cyan
gcloud config set project $ProjectId

Write-Host "=== 2. Enabling required APIs ===" -ForegroundColor Cyan
gcloud services enable run.googleapis.com cloudfunctions.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com storage.googleapis.com bigquery.googleapis.com aiplatform.googleapis.com

Write-Host "=== 3. Creating GCS Storage Bucket ===" -ForegroundColor Cyan
gsutil mb -p $ProjectId -c STANDARD -l $Region -b on "gs://$BucketName"

Write-Host "=== 4. Creating BigQuery Dataset ===" -ForegroundColor Cyan
bq --location=$Region mk --dataset "$($ProjectId):$($DatasetName)"

Write-Host "=== 5. Deploying Cloud Run Function (ETL) ===" -ForegroundColor Cyan
gcloud functions deploy aquasense-etl `
    --gen2 `
    --runtime=python311 `
    --region=$Region `
    --source=./cloud/functions/etl_ingestion `
    --entry-point=gcs_to_bigquery_etl `
    --trigger-bucket=$BucketName `
    --set-env-vars="GCP_PROJECT_ID=$ProjectId,BIGQUERY_DATASET=$DatasetName,BIGQUERY_TABLE=$TableName" `
    --allow-unauthenticated

Write-Host "=== GCP deployment workflow complete ===" -ForegroundColor Green
