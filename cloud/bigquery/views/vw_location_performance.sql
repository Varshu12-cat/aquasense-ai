-- AquaSense AI: BigQuery Analytical View - Facility Location Performance & Benchmarking

CREATE OR REPLACE VIEW `aquasense-ai-prod.aquasense_dw.vw_location_performance` AS
WITH loc_stats AS (
  SELECT
    location,
    ROUND(SUM(water_consumption_liters), 2) AS lifetime_liters,
    ROUND(AVG(water_consumption_liters) * 24, 2) AS daily_average_liters,
    ROUND(STDDEV(water_consumption_liters), 2) AS hourly_volatility_std,
    COUNT(DISTINCT DATE(timestamp)) AS monitored_days
  FROM
    `aquasense-ai-prod.aquasense_dw.water_consumption_hourly`
  GROUP BY
    location
),
tot AS (
  SELECT SUM(lifetime_liters) AS total_campus_liters FROM loc_stats
)
SELECT
  l.location,
  l.lifetime_liters,
  l.daily_average_liters,
  l.hourly_volatility_std,
  l.monitored_days,
  ROUND((l.lifetime_liters / t.total_campus_liters) * 100, 2) AS percentage_of_campus_total,
  -- 10% realistic conservation target
  ROUND(l.daily_average_liters * 0.10, 2) AS potential_daily_savings_liters,
  ROUND(l.daily_average_liters * 0.10 * 0.05 * 30, 2) AS est_monthly_cost_savings_inr
FROM
  loc_stats l
CROSS JOIN
  tot t
ORDER BY
  l.lifetime_liters DESC;
