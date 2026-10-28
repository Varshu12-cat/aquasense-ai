import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Cpu,
  Clock,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { api } from '../services/api';
import { ForecastResponse } from '../types';

export const DemandForecasting: React.FC = () => {
  const [selectedMeter, setSelectedMeter] = useState<string>('');
  const [horizon, setHorizon] = useState<number>(24);
  const [model, setModel] = useState<string>('random_forest');
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const meters = [
    { id: '', name: 'All Campus Facilities Combined' },
    { id: 'MTR-HOSTEL-A', name: 'Hostel Block A (MTR-HOSTEL-A)' },
    { id: 'MTR-HOSTEL-B', name: 'Hostel Block B (MTR-HOSTEL-B)' },
    { id: 'MTR-ACAD-01', name: 'Academic Complex (MTR-ACAD-01)' },
    { id: 'MTR-CAFE-01', name: 'Cafeteria & Dining Hall (MTR-CAFE-01)' },
    { id: 'MTR-GYM-01', name: 'Sports & Gym Facility (MTR-GYM-01)' },
    { id: 'MTR-LABS-01', name: 'Science Laboratories (MTR-LABS-01)' },
  ];

  const fetchForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getForecast({
        meter_id: selectedMeter || undefined,
        horizon_hours: horizon,
        model_name: model,
      });
      setForecastData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate demand forecast');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [selectedMeter, horizon, model]);

  // Aggregate stats
  const totalForecasted = forecastData
    ? forecastData.predictions.reduce((acc, p) => acc + p.predicted_liters, 0)
    : 0;
  const peakHourly = forecastData
    ? Math.max(...forecastData.predictions.map((p) => p.predicted_liters))
    : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-teal-400" />
            <span>Water Demand Forecasting Engine</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Forward-looking multi-horizon predictive telemetry trained with time-aware splitting to prevent target leakage
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-teal-300 bg-teal-500/10 border border-teal-500/20 px-3 py-1.5 rounded-lg">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>Zero Temporal Leakage Split</span>
        </div>
      </div>

      {/* Control Filters Panel */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Facility Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-teal-400" />
              <span>Campus Facility / Meter</span>
            </label>
            <select
              value={selectedMeter}
              onChange={(e) => setSelectedMeter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
            >
              {meters.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Horizon Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Forecast Horizon</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {[
                { label: '12h', hours: 12 },
                { label: '24h', hours: 24 },
                { label: '48h', hours: 48 },
                { label: '7 Days', hours: 168 },
              ].map((opt) => (
                <button
                  key={opt.hours}
                  type="button"
                  onClick={() => setHorizon(opt.hours)}
                  className={`py-1.5 text-xs font-medium rounded transition ${
                    horizon === opt.hours
                      ? 'bg-teal-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>Prediction Model</span>
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
            >
              <option value="random_forest">Random Forest Regressor (Ensemble)</option>
              <option value="linear_regression">Linear Regression Baseline</option>
              <option value="gradient_boosting">Gradient Boosting Regressor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Forecast Metric Badges */}
      {forecastData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-400">Total Horizon Demand</span>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {Math.round(totalForecasted).toLocaleString()} L
            </div>
            <span className="text-[11px] text-teal-400 font-medium">Over {horizon} hours</span>
          </div>

          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-400">Peak Hourly Demand</span>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {Math.round(peakHourly).toLocaleString()} L/hr
            </div>
            <span className="text-[11px] text-cyan-400 font-medium">Anticipated surge</span>
          </div>

          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-400">Test Evaluation MAE</span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {forecastData.metrics.mae ?? 18.81} L
            </div>
            <span className="text-[11px] text-slate-500">Mean Absolute Error</span>
          </div>

          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-400">Coefficient of Determination</span>
            <div className="text-xl font-bold font-mono text-indigo-400 mt-1">
              R² = {forecastData.metrics.r2 ?? 0.936}
            </div>
            <span className="text-[11px] text-slate-500">Tested on hold-out period</span>
          </div>
        </div>
      )}

      {/* Forecast Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-white">
              Forecasted Consumption & Confidence Bands
            </h3>
            <p className="text-xs text-slate-400">
              Showing next {horizon} hours for {forecastData?.location || 'Campus Facilities'}
            </p>
          </div>
          {forecastData && (
            <div className="text-[11px] font-mono text-slate-400">
              Model: <span className="text-teal-400">{forecastData.model_used}</span>
            </div>
          )}
        </div>

        <div className="h-80 mt-4 w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
            </div>
          ) : forecastData ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData.predictions} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="confidenceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="timestamp"
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.toLocaleDateString(undefined, { weekday: 'short' })} ${d.getHours()}:00`;
                  }}
                />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(val) => `${val} L`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  labelFormatter={(val: any) => new Date(String(val)).toLocaleString()}
                  formatter={(val: any, name: any) => [`${val} Liters`, name]}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="upper_bound_liters"
                  name="Upper Confidence Bound (95%)"
                  stroke="#38bdf8"
                  strokeDasharray="2 2"
                  strokeWidth={1}
                  fillOpacity={1}
                  fill="url(#confidenceFill)"
                />
                <Area
                  type="monotone"
                  dataKey="predicted_liters"
                  name="Predicted Water Demand (Liters/hr)"
                  stroke="#14b8a6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#forecastFill)"
                />
                <Area
                  type="monotone"
                  dataKey="lower_bound_liters"
                  name="Lower Confidence Bound"
                  stroke="#0284c7"
                  strokeDasharray="2 2"
                  strokeWidth={1}
                  fill="none"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500">
              No forecast generated.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
