# Looker Studio Cloud Analytics Integration Guide

## 1. Overview
AquaSense AI integrates with **Google Looker Studio** (formerly Google Data Studio) using **Google BigQuery** as a live enterprise data source. This provides high-level executive reporting, facility manager drill-downs, and automated stakeholder dashboards.

## 2. Step-by-Step Connection Instructions

1. **Open Looker Studio**:
   - Navigate to [https://lookerstudio.google.com/](https://lookerstudio.google.com/) and sign in with your authorized Google account.

2. **Create New Data Source**:
   - Click **Create** > **Data Source**.
   - Select the **BigQuery** connector.
   - Choose:
     - **Project**: `aquasense-ai-prod` (or your GCP Project ID)
     - **Dataset**: `aquasense_dw`
     - **Table / View**: `vw_daily_consumption` (for daily trends) or Custom Query using `dashboards/looker_studio/queries.sql`.

3. **Configure Required Charts & KPIs**:
   - **Scorecard KPI 1**: Total Consumption (SUM of `total_daily_liters`).
   - **Scorecard KPI 2**: Average Daily Consumption (AVG of `total_daily_liters`).
   - **Time Series Line Chart**:
     - Dimension: `consumption_date`
     - Metric: `total_daily_liters`, `peak_hourly_liters`
   - **Pie / Donut Chart**:
     - Dimension: `location`
     - Metric: `lifetime_liters`
   - **Table with Heatmap (Anomalies & Leak Candidates)**:
     - Connected to `vw_anomaly_log`
     - Dimensions: `timestamp`, `location`, `meter_id`, `anomaly_classification`, `severity`
     - Metric: `deviation_liters`

4. **Estimated Conservation Opportunities**:
   - Add a calculated field:
     `Potential Savings (Liters) = daily_average_liters * 0.10`
   - Add calculated field:
     `Projected Cost Savings (INR) = Potential Savings (Liters) * 0.05 * 30`

## 3. Truthful Deployment Notice
> [!NOTE]
> Looker Studio requires direct interactive browser authorization via Google OAuth. To connect live reports, follow the steps above with your GCP project permissions. Do not claim a live external dashboard exists until you have created and linked it via the Looker Studio UI.
