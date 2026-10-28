import React, { useState } from 'react';
import {
  Droplets,
  Calendar,
  AlertTriangle,
  TrendingDown,
  Building2,
  Clock,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { DashboardSummary } from '../types';
import { KPICard } from '../components/KPICard';
import { StatusBadge } from '../components/StatusBadge';

interface OverviewDashboardProps {
  summary: DashboardSummary | null;
  loading: boolean;
  onNavigate: (page: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  summary,
  loading,
  onNavigate,
}) => {
  const [trendView, setTrendView] = useState<'daily' | 'weekly'>('daily');

  if (loading || !summary) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-900/60 rounded-xl border border-slate-800" />
          ))}
        </div>
        <div className="h-96 bg-slate-900/60 rounded-xl border border-slate-800" />
      </div>
    );
  }

  const chartData = trendView === 'daily' ? summary.daily_trend : summary.weekly_trend;

  return (
    <div className="space-y-6">
      {/* Top Banner / Pipeline Notice */}
      <div className="bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-900 border border-teal-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">AquaSense AI Intelligence Pipeline</h2>
            <p className="text-xs text-slate-400">{summary.dataset_freshness} • {summary.cloud_pipeline_status}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate('forecasting')}
            className="text-xs bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1"
          >
            <span>Explore 7-Day Forecast</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Total Monitored"
          value={summary.total_consumption_liters.toLocaleString()}
          unit="Liters"
          subtitle="90-day recorded telemetry"
          icon={<Droplets className="w-4 h-4" />}
          accentColor="teal"
        />
        <KPICard
          title="Daily Average"
          value={Math.round(summary.avg_daily_consumption_liters).toLocaleString()}
          unit="L/day"
          subtitle="6 campus facilities"
          icon={<Calendar className="w-4 h-4" />}
          accentColor="cyan"
        />
        <KPICard
          title="Next-Day Demand"
          value={Math.round(summary.predicted_next_day_liters).toLocaleString()}
          unit="Liters"
          subtitle="Time-series ensemble ML"
          icon={<ArrowUpRight className="w-4 h-4" />}
          accentColor="indigo"
          trend={{ value: 'Forecasted', isPositive: true }}
        />
        <KPICard
          title="Detected Anomalies"
          value={summary.detected_anomalies_count}
          unit="Events"
          subtitle="Requiring physical audit"
          icon={<AlertTriangle className="w-4 h-4" />}
          accentColor="rose"
          trend={{ value: 'Unverified', isPositive: false }}
        />
        <KPICard
          title="Est. Conservation"
          value={Math.round(summary.estimated_potential_savings_liters).toLocaleString()}
          unit="Liters"
          subtitle={`~${summary.estimated_potential_savings_percent}% reduction potential`}
          icon={<TrendingDown className="w-4 h-4" />}
          accentColor="amber"
          trend={{ value: `${summary.estimated_potential_savings_percent}%`, isPositive: true }}
        />
      </div>

      {/* Main Trends & Actual vs Predicted Demand Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center space-x-2">
              <span>Campus Water Consumption Telemetry & Forecast Baseline</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparative view of actual recorded meter consumption versus model predicted baseline
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Resolution:</span>
            <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex space-x-1">
              <button
                onClick={() => setTrendView('daily')}
                className={`px-2.5 py-1 text-xs rounded font-medium transition ${
                  trendView === 'daily'
                    ? 'bg-teal-500 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Daily (30d)
              </button>
              <button
                onClick={() => setTrendView('weekly')}
                className={`px-2.5 py-1 text-xs rounded font-medium transition ${
                  trendView === 'weekly'
                    ? 'bg-teal-500 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Weekly (12w)
              </button>
            </div>
          </div>
        </div>

        <div className="h-72 mt-4 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="predGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(val) => `${(val / 1000).toFixed(1)}k L`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8', fontSize: '11px' }}
                formatter={(val: any) => [`${Number(val).toLocaleString()} Liters`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Area
                type="monotone"
                dataKey="actual_liters"
                name="Actual Water Consumption"
                stroke="#14b8a6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#actualGradient)"
              />
              <Area
                type="monotone"
                dataKey="predicted_liters"
                name="Model Predicted Baseline"
                stroke="#38bdf8"
                strokeWidth={2}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#predGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Grid: Location Breakdown & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breakdown by Campus Location */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-teal-400" />
              <span>Campus Facility Water Consumption Breakdown</span>
            </h3>
            <span className="text-xs text-slate-400">6 Facilities</span>
          </div>
          <div className="mt-4 space-y-3">
            {summary.location_breakdown.map((loc) => (
              <div key={loc.meter_id} className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white">{loc.location}</span>
                    <span className="text-slate-400 font-mono text-[10px]">({loc.meter_id})</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-slate-200">{loc.total_liters.toLocaleString()} L</span>
                    <span className="font-bold text-teal-400">{loc.percentage_of_total}%</span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-teal-500 to-cyan-400 h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, loc.percentage_of_total * 2)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1.5">
                  <span>Avg Daily: {loc.avg_daily_liters.toLocaleString()} L/day</span>
                  {loc.anomaly_count > 0 && (
                    <span className="text-rose-400 font-medium">{loc.anomaly_count} anomaly event(s)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Alerts & Potential Leak Candidates */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Recent Anomaly Alerts (Requires Verification)</span>
            </h3>
            <button
              onClick={() => onNavigate('anomalies')}
              className="text-xs text-teal-400 hover:text-teal-300 font-medium"
            >
              View All →
            </button>
          </div>

          <div className="mt-4 space-y-2.5">
            {summary.recent_alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <StatusBadge status={alert.severity} type="severity" />
                      <span className="text-xs font-semibold text-white">{alert.location}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{alert.description}</p>
                    <p className="text-[11px] text-teal-400 font-medium">
                      Action: {alert.recommended_action}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      Unconfirmed Leak
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
