-- ==============================================================================
-- AquaSense AI - Looker Studio Analytical SQL Queries
-- Data Source: Google BigQuery (aquasense_dw)
-- ==============================================================================

-- 1. Daily Total Consumption & Baseline Trend (Time Series Chart)
SELECT
  consumption_date,
  total_daily_liters,
  avg_hourly_liters,
  peak_hourly_liters,
  avg_temperature_c,
  is_weekend
FROM
  `aquasense-ai-prod.aquasense_dw.vw_daily_consumption`
ORDER BY
  consumption_date ASC;

-- 2. Water Consumption Breakdown by Campus Location (Donut / Bar Chart)
SELECT
  location,
  lifetime_liters,
  daily_average_liters,
  percentage_of_campus_total,
  potential_daily_savings_liters,
  est_monthly_cost_savings_inr
FROM
  `aquasense-ai-prod.aquasense_dw.vw_location_performance`
ORDER BY
  lifetime_liters DESC;

-- 3. Anomaly and Potential Leak Candidate Audit Table (Table with Heatmap)
SELECT
  timestamp,
  location,
  meter_id,
  observed_liters,
  expected_liters,
  deviation_liters,
  anomaly_classification,
  severity,
  is_confirmed_leak
FROM
  `aquasense-ai-prod.aquasense_dw.vw_anomaly_log`
ORDER BY
  timestamp DESC;

-- 4. Hourly Demand Heatmap (Day of Week vs Hour of Day)
SELECT
  day_of_week,
  hour_of_day,
  ROUND(AVG(water_consumption_liters), 2) AS avg_consumption_liters
FROM
  `aquasense-ai-prod.aquasense_dw.water_consumption_hourly`
GROUP BY
  day_of_week, hour_of_day
ORDER BY
  day_of_week, hour_of_day;
