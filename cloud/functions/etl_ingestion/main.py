"""
AquaSense AI - Cloud Run Function: Event-Driven Telemetry ETL
Trigger: Cloud Storage (google.storage.object.finalize)
Transforms raw CSV meter readings and idempotently streams validated records to BigQuery.
"""

import os
import io
import json
import logging
from datetime import datetime
import pandas as pd
from google.cloud import storage, bigquery

# Configure structured Cloud Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("aquasense-etl")

PROJECT_ID = os.getenv("GCP_PROJECT_ID", "aquasense-ai-prod")
DATASET_ID = os.getenv("BIGQUERY_DATASET", "aquasense_dw")
TABLE_ID = os.getenv("BIGQUERY_TABLE", "water_consumption_hourly")
INGESTION_LOG_TABLE = os.getenv("INGESTION_LOG_TABLE", "etl_ingestion_audit")


def validate_and_transform(df: pd.DataFrame, source_file: str) -> pd.DataFrame:
    """Standardizes types, cleans telemetry, and injects audit metadata."""
    # Enforce mandatory schema
    required = ["timestamp", "meter_id", "water_consumption_liters"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Payload schema validation failed. Missing: {missing}")

    # Standardize timestamps
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    df = df.dropna(subset=["timestamp"])

    # Cast metrics
    df["water_consumption_liters"] = pd.to_numeric(df["water_consumption_liters"], errors="coerce").fillna(0.0)
    df["water_consumption_liters"] = df["water_consumption_liters"].clip(lower=0.0)

    if "temperature_c" in df.columns:
        df["temperature_c"] = pd.to_numeric(df["temperature_c"], errors="coerce").fillna(22.0)
    else:
        df["temperature_c"] = 22.0

    if "location" not in df.columns:
        df["location"] = df["meter_id"]

    # Deduplicate within batch
    df = df.drop_duplicates(subset=["timestamp", "meter_id"], keep="last")

    # Time attributes
    df["hour_of_day"] = df["timestamp"].dt.hour
    df["day_of_week"] = df["timestamp"].dt.dayofweek
    df["is_weekend"] = df["day_of_week"].apply(lambda d: 1 if d in [5, 6] else 0)

    # Ingestion audit lineage metadata
    df["source_file"] = source_file
    df["ingested_at"] = datetime.utcnow().isoformat()
    # Unique record hash for idempotent merging
    df["record_id"] = df["meter_id"] + "_" + df["timestamp"].dt.strftime("%Y%m%d%H%M%S")

    return df


def gcs_to_bigquery_etl(event: dict, context) -> str:
    """
    Cloud Event Entrypoint for Google Cloud Storage finalize events.
    Compatible with Cloud Functions Gen2 / Cloud Run Functions.
    """
    bucket_name = event.get("bucket")
    file_name = event.get("name")

    if not bucket_name or not file_name:
        logger.warning("Empty event bucket or file name received.")
        return "Ignored: Missing metadata"

    # Only process CSV files, ignore subfolder markers
    if not file_name.endswith(".csv"):
        logger.info(f"Skipping non-CSV object: {file_name}")
        return f"Skipped non-CSV: {file_name}"

    logger.info(f"Initiating ETL for gs://{bucket_name}/{file_name}")

    storage_client = storage.Client(project=PROJECT_ID)
    bq_client = bigquery.Client(project=PROJECT_ID)

    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(file_name)

    # Read CSV stream into memory
    content = blob.download_as_bytes()
    df_raw = pd.read_csv(io.BytesIO(content))
    logger.info(f"Loaded {len(df_raw)} raw rows from GCS.")

    # Transform & Validate
    df_clean = validate_and_transform(df_raw, source_file=f"gs://{bucket_name}/{file_name}")

    # Idempotent load using BigQuery Staging + MERGE
    staging_table_id = f"{PROJECT_ID}.{DATASET_ID}.stg_{TABLE_ID}_{int(datetime.utcnow().timestamp())}"
    target_table_id = f"{PROJECT_ID}.{DATASET_ID}.{TABLE_ID}"

    try:
        # 1. Load to staging table
        job_config = bigquery.LoadJobConfig(write_disposition="WRITE_TRUNCATE")
        load_job = bq_client.load_table_from_dataframe(df_clean, staging_table_id, job_config=job_config)
        load_job.result()
        logger.info(f"Loaded staging table {staging_table_id}")

        # 2. Idempotent MERGE statement into target table
        merge_query = f"""
        MERGE `{target_table_id}` T
        USING `{staging_table_id}` S
        ON T.record_id = S.record_id
        WHEN MATCHED THEN
          UPDATE SET
            T.water_consumption_liters = S.water_consumption_liters,
            T.temperature_c = S.temperature_c,
            T.location = S.location,
            T.ingested_at = S.ingested_at,
            T.source_file = S.source_file
        WHEN NOT MATCHED THEN
          INSERT (record_id, timestamp, meter_id, location, water_consumption_liters, temperature_c, hour_of_day, day_of_week, is_weekend, source_file, ingested_at)
          VALUES (S.record_id, S.timestamp, S.meter_id, S.location, S.water_consumption_liters, S.temperature_c, S.hour_of_day, S.day_of_week, S.is_weekend, S.source_file, S.ingested_at);
        """
        query_job = bq_client.query(merge_query)
        query_job.result()
        logger.info(f"Successfully merged {len(df_clean)} records into {target_table_id}")

        # 3. Clean up staging table
        bq_client.delete_table(staging_table_id, not_found_ok=True)

        return f"Success: {len(df_clean)} records processed idempotently."

    except Exception as e:
        logger.error(f"ETL pipeline failure for {file_name}: {str(e)}", exc_info=True)
        bq_client.delete_table(staging_table_id, not_found_ok=True)
        raise e
