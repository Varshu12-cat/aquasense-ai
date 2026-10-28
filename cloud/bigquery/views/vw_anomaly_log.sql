-- AquaSense AI: BigQuery View - Consumption Spikes and Potential Leak Candidates
-- Distinguishes statistical candidates requiring physical inspection from verified leaks

CREATE OR REPLACE VIEW `aquasense-ai-prod.aquasense_dw.vw_anomaly_log` AS
WITH meter_hourly_profile AS (
  SELECT
    meter_id,
    hour_of_day,
    AVG(water_consumption_liters) AS expected_mean_liters,
    STDDEV(water_consumption_liters) AS expected_std_liters
  FROM
    `aquasense-ai-prod.aquasense_dw.water_consumption_hourly`
  GROUP BY
    meter_id, hour_of_day
)
SELECT
  w.timestamp,
  w.meter_id,
  w.location,
  w.water_consumption_liters AS observed_liters,
  ROUND(p.expected_mean_liters, 2) AS expected_liters,
  ROUND(w.water_consumption_liters - p.expected_mean_liters, 2) AS deviation_liters,
  CASE
    WHEN w.hour_of_day BETWEEN 1 AND 4 AND w.water_consumption_liters > (p.expected_mean_liters * 3.5) AND w.water_consumption_liters > 20
      THEN 'overnight_leak_candidate'
    WHEN (w.water_consumption_liters - p.expected_mean_liters) > (3.0 * COALESCE(p.expected_std_liters, 5.0))
      THEN 'sudden_spike'
    WHEN w.water_consumption_liters > (p.expected_mean_liters * 2.2)
      THEN 'high_baseline'
    ELSE 'unusual_pattern'
  END AS anomaly_classification,
  CASE
    WHEN (w.water_consumption_liters - p.expected_mean_liters) > 50 OR (w.hour_of_day BETWEEN 1 AND 4 AND w.water_consumption_liters > 30)
      THEN 'HIGH'
    ELSE 'MEDIUM'
  END AS severity,
  FALSE AS is_confirmed_leak -- Unconfirmed until on-site plumbing audit
FROM
  `aquasense-ai-prod.aquasense_dw.water_consumption_hourly` w
JOIN
  meter_hourly_profile p
ON
  w.meter_id = p.meter_id AND w.hour_of_day = p.hour_of_day
WHERE
  w.water_consumption_liters > (p.expected_mean_liters + (2.5 * COALESCE(p.expected_std_liters, 4.0)))
ORDER BY
  deviation_liters DESC;
