// AquaSense AI - API Service Client

import {
  DashboardSummary,
  ForecastResponse,
  AnomalyListResponse,
  ConservationResponse,
  ModelMetricsResponse,
  CloudOperationsStatus,
} from '../types';

const API_ORIGIN = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? '' : 'https://aquasense-ai-backend-o7yk.onrender.com')
).replace(/\/+$/, '');
const API_BASE = `${API_ORIGIN}/api`;

export const api = {
  async getDashboardSummary(): Promise<DashboardSummary> {
    const res = await fetch(`${API_BASE}/dashboard/summary`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load summary`);
    return res.json();
  },

  async getForecast(params: {
    meter_id?: string;
    horizon_hours?: number;
    model_name?: string;
  }): Promise<ForecastResponse> {
    const res = await fetch(`${API_BASE}/forecast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meter_id: params.meter_id || null,
        horizon_hours: params.horizon_hours || 24,
        model_name: params.model_name || 'random_forest',
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Forecast request failed`);
    return res.json();
  },

  async getAnomalies(params?: {
    meter_id?: string;
    severity?: string;
  }): Promise<AnomalyListResponse> {
    const search = new URLSearchParams();
    if (params?.meter_id) search.append('meter_id', params.meter_id);
    if (params?.severity) search.append('severity', params.severity);
    const res = await fetch(`${API_BASE}/anomalies?${search.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load anomalies`);
    return res.json();
  },

  async getConservationInsights(): Promise<ConservationResponse> {
    const res = await fetch(`${API_BASE}/conservation/insights`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load conservation insights`);
    return res.json();
  },

  async getModelMetrics(): Promise<ModelMetricsResponse> {
    const res = await fetch(`${API_BASE}/models/metrics`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load model metrics`);
    return res.json();
  },

  async triggerRetraining(test_ratio: number = 0.2): Promise<any> {
    const res = await fetch(`${API_BASE}/models/retrain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test_ratio }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Retraining failed`);
    return res.json();
  },

  async getCloudStatus(): Promise<CloudOperationsStatus> {
    const res = await fetch(`${API_BASE}/cloud/status`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load cloud operations status`);
    return res.json();
  },

  async listDatasets(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/datasets`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to list datasets`);
    return res.json();
  },

  async previewDataset(dataset_id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/datasets/${dataset_id}/preview`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to preview dataset`);
    return res.json();
  },

  async uploadDataset(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/datasets/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload error' }));
      throw new Error(err.detail || `Upload failed with status ${res.status}`);
    }
    return res.json();
  },

  async checkHealth(): Promise<{ status: string; environment: string; cloud_status: string }> {
    const res = await fetch(`${API_ORIGIN}/health`);
    if (!res.ok) throw new Error('Backend health check unreachable');
    return res.json();
  },
};
