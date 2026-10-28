// AquaSense AI - Frontend TypeScript Definitions

export interface TrendPoint {
  timestamp: string;
  actual_liters: number;
  predicted_liters?: number;
}

export interface LocationBreakdown {
  meter_id: string;
  location: string;
  total_liters: number;
  avg_daily_liters: number;
  percentage_of_total: number;
  anomaly_count: number;
}

export interface AlertItem {
  id: string;
  timestamp: string;
  meter_id: string;
  location: string;
  severity: 'high' | 'medium' | 'low';
  type: string;
  description: string;
  recommended_action: string;
  is_confirmed_leak: boolean;
}

export interface DashboardSummary {
  total_consumption_liters: number;
  avg_daily_consumption_liters: number;
  predicted_next_day_liters: number;
  detected_anomalies_count: number;
  estimated_potential_savings_liters: number;
  estimated_potential_savings_percent: number;
  daily_trend: TrendPoint[];
  weekly_trend: TrendPoint[];
  location_breakdown: LocationBreakdown[];
  recent_alerts: AlertItem[];
  dataset_freshness: string;
  cloud_pipeline_status: string;
  is_demo_mode: boolean;
}

export interface ForecastDataPoint {
  timestamp: string;
  hour_of_day: number;
  predicted_liters: number;
  actual_liters?: number;
  lower_bound_liters: number;
  upper_bound_liters: number;
}

export interface ForecastResponse {
  meter_id: string;
  location: string;
  model_used: string;
  horizon_hours: number;
  forecast_generated_at: string;
  predictions: ForecastDataPoint[];
  metrics: {
    name?: string;
    mae?: number;
    rmse?: number;
    r2?: number;
    [key: string]: any;
  };
}

export interface AnomalyItem {
  timestamp: string;
  meter_id: string;
  location: string;
  observed_liters: number;
  expected_liters: number;
  deviation_liters: number;
  severity: 'high' | 'medium' | 'low';
  anomaly_type: string;
  recommended_action: string;
  is_confirmed_leak: boolean;
}

export interface AnomalyListResponse {
  summary: {
    total_anomalies: number;
    by_severity: Record<string, number>;
    by_type: Record<string, number>;
    by_location: Record<string, number>;
  };
  anomalies: AnomalyItem[];
}

export interface ReductionScenario {
  scenario_percent: number;
  estimated_water_saved_liters: number;
  estimated_cost_saved_inr: number;
  target_daily_budget_liters: number;
}

export interface ConservationResponse {
  current_daily_consumption_liters: number;
  historical_baseline_daily_liters: number;
  percent_above_baseline: number;
  reduction_scenarios: ReductionScenario[];
  actionable_recommendations: {
    id: string;
    category: string;
    title: string;
    impact: string;
    description: string;
    is_measured: boolean;
  }[];
  disclaimer: string;
}

export interface ModelMetricsResponse {
  training_timestamp: string;
  test_split_ratio: number;
  train_record_count: number;
  test_record_count: number;
  best_forecaster: string;
  models: {
    linear_regression: any;
    random_forest: any;
    gradient_boosting: any;
  };
  anomaly_model: {
    algorithm: string;
    contamination_parameter: number;
    detected_anomalies_count: number;
    ground_truth_available: boolean;
    precision?: number;
    recall?: number;
    f1_score?: number;
    confusion_matrix?: {
      true_negatives: number;
      false_positives: number;
      false_negatives: number;
      true_positives: number;
    };
    note?: string;
  };
  actual_vs_predicted_samples?: any[];
}

export interface CloudServiceStatus {
  service_name: string;
  status: 'operational' | 'pending_configuration' | 'degraded' | 'not_configured';
  details: string;
  last_synced_at?: string;
}

export interface CloudOperationsStatus {
  is_live_cloud_connected: boolean;
  demo_mode: boolean;
  gcp_project_id: string;
  gcp_region: string;
  services: CloudServiceStatus[];
  required_configuration_guide: string;
}
