-- AquaSense AI: BigQuery Analytical View - Daily Aggregated Consumption
-- Connects directly to Looker Studio BI Dashboard

CREATE OR REPLACE VIEW `aquasense-ai-prod.aquasense_dw.vw_daily_consumption` AS
SELECT
  DATE(timestamp) AS consumption_date,
  location,
  meter_id,
  ROUND(SUM(water_consumption_liters), 2) AS total_daily_liters,
  ROUND(AVG(water_consumption_liters), 2) AS avg_hourly_liters,
  ROUND(MAX(water_consumption_liters), 2) AS peak_hourly_liters,
  ROUND(AVG(temperature_c), 1) AS avg_temperature_c,
  MAX(is_weekend) AS is_weekend
FROM
  `aquasense-ai-prod.aquasense_dw.water_consumption_hourly`
GROUP BY
  consumption_date, location, meter_id;
