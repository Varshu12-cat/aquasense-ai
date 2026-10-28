import React, { useState, useEffect } from 'react';
import {
  Cpu,
  BarChart2,
  RefreshCw,
  Clock,
  Zap,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { api } from '../services/api';
import { ModelMetricsResponse } from '../types';

export const ModelEvaluation: React.FC = () => {
  const [metrics, setMetrics] = useState<ModelMetricsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [retraining, setRetraining] = useState<boolean>(false);
  const [testRatio, setTestRatio] = useState<number>(0.2);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const res = await api.getModelMetrics();
      setMetrics(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    setMessage(null);
    try {
      const res = await api.triggerRetraining(testRatio);
      setMessage(res.message || 'Models successfully retrained!');
      await loadMetrics();
    } catch (err: any) {
      setMessage(`Error during retraining: ${err.message}`);
    } finally {
      setRetraining(false);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
      </div>
    );
  }

  const lr = metrics.models.linear_regression;
  const rf = metrics.models.random_forest;
  const gbr = metrics.models.gradient_boosting;
  const anomaly = metrics.anomaly_model;

  // Comparison table data
  const comparisonData = [
    {
      metric: 'Mean Absolute Error (MAE)',
      lr: `${lr.mae} L`,
      rf: `${rf.mae} L`,
      gbr: `${gbr.mae} L`,
      better: 'Lower is better',
    },
    {
      metric: 'Root Mean Squared Error (RMSE)',
      lr: `${lr.rmse} L`,
      rf: `${rf.rmse} L`,
      gbr: `${gbr.rmse} L`,
      better: 'Lower is better',
    },
    {
      metric: 'R² Score (Goodness of Fit)',
      lr: `${lr.r2}`,
      rf: `${rf.r2}`,
      gbr: `${gbr.r2}`,
      better: 'Higher is better (Max 1.0)',
    },
    {
      metric: 'Training Wall-Clock Time',
      lr: `${lr.train_time_sec}s`,
      rf: `${rf.train_time_sec}s`,
      gbr: `${gbr.train_time_sec}s`,
      better: 'Lower is faster',
    },
    {
      metric: 'Per-Record Inference Latency',
      lr: `${(lr.inference_latency_sec_per_record * 1000).toFixed(4)}ms`,
      rf: `${(rf.inference_latency_sec_per_record * 1000).toFixed(4)}ms`,
      gbr: `${(gbr.inference_latency_sec_per_record * 1000).toFixed(4)}ms`,
      better: 'Real-time efficiency',
    },
  ];

  // Feature Importance Data for Bar Chart
  const featureImportances = rf.feature_importance
    ? Object.entries(rf.feature_importance).map(([key, val]) => ({
        feature: key,
        importance: Number(val),
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <span>Machine Learning Model Evaluation & Benchmark Analysis</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Empirical validation comparing Baseline Linear Regression against Random Forest & Gradient Boosting
          </p>
        </div>

        <div className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg font-mono">
          Evaluated: {metrics.train_record_count.toLocaleString()} Train / {metrics.test_record_count.toLocaleString()} Test Records
        </div>
      </div>

      {/* Retraining Action Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <Sliders className="w-4 h-4 text-teal-400" />
          <span className="text-xs font-semibold text-white">Chronological Hold-Out Test Ratio:</span>
          <input
            type="range"
            min="0.10"
            max="0.40"
            step="0.05"
            value={testRatio}
            onChange={(e) => setTestRatio(parseFloat(e.target.value))}
            className="w-32 accent-teal-500 cursor-pointer"
          />
          <span className="text-xs font-mono font-bold text-teal-400">{(testRatio * 100).toFixed(0)}%</span>
        </div>

        <div className="flex items-center space-x-3">
          {message && (
            <span className="text-xs text-emerald-400 font-medium">{message}</span>
          )}
          <button
            onClick={handleRetrain}
            disabled={retraining}
            className="bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5 transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${retraining ? 'animate-spin' : ''}`} />
            <span>{retraining ? 'Retraining Pipelines...' : 'Trigger Pipeline Retrain'}</span>
          </button>
        </div>
      </div>

      {/* Model Benchmark Comparison Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Forecasting Model Benchmark Comparison
            </h3>
            <p className="text-xs text-slate-400">
              Evaluated strictly on chronological unseen test split ({metrics.test_split_ratio * 100}% of time horizon)
            </p>
          </div>
          <span className="text-xs font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded">
            Selected Best: {metrics.best_forecaster.toUpperCase().replace('_', ' ')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Evaluation Metric</th>
                <th className="py-3 px-4">Linear Regression (Baseline)</th>
                <th className="py-3 px-4 text-teal-400">Random Forest Regressor</th>
                <th className="py-3 px-4 text-cyan-400">Gradient Boosting Regressor</th>
                <th className="py-3 px-4 text-slate-500">Interpretation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {comparisonData.map((row, i) => (
                <tr key={i} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-semibold text-white">{row.metric}</td>
                  <td className="py-3 px-4 font-mono text-slate-300">{row.lr}</td>
                  <td className="py-3 px-4 font-mono font-bold text-teal-300 bg-teal-500/5">{row.rf}</td>
                  <td className="py-3 px-4 font-mono text-cyan-300">{row.gbr}</td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">{row.better}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Grid: Feature Importance & Anomaly Detection Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Importance Bar Chart */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-white pb-3 border-b border-slate-800 flex items-center space-x-2">
            <BarChart2 className="w-4 h-4 text-teal-400" />
            <span>Random Forest Predictive Feature Importances (Gini)</span>
          </h3>
          <div className="h-64 mt-4 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureImportances} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis dataKey="feature" type="category" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  formatter={(val: any) => [`${(Number(val) * 100).toFixed(1)}%`, 'Contribution']}
                />
                <Bar dataKey="importance" fill="#14b8a6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Anomaly Detection Evaluation & Confusion Matrix */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Anomaly Detection Model Evaluation (Isolation Forest)</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              Param: contamination={anomaly.contamination_parameter}
            </span>
          </div>

          {anomaly.ground_truth_available ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-center">
                  <span className="text-[10px] text-slate-400 uppercase">Precision</span>
                  <div className="text-lg font-bold font-mono text-white mt-0.5">
                    {(anomaly.precision! * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-center">
                  <span className="text-[10px] text-slate-400 uppercase">Recall</span>
                  <div className="text-lg font-bold font-mono text-teal-400 mt-0.5">
                    {(anomaly.recall! * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-center">
                  <span className="text-[10px] text-slate-400 uppercase">F1-Score</span>
                  <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
                    {(anomaly.f1_score! * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Confusion Matrix Table */}
              {anomaly.confusion_matrix && (
                <div>
                  <span className="text-xs text-slate-400 font-semibold mb-2 block">
                    Empirical Confusion Matrix
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                      <span className="text-slate-400 block text-[10px]">True Negatives (Normal)</span>
                      <span className="text-base font-bold text-white">
                        {anomaly.confusion_matrix.true_negatives.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-950 border border-rose-500/20 rounded-lg">
                      <span className="text-rose-400 block text-[10px]">False Positives (Type I)</span>
                      <span className="text-base font-bold text-rose-300">
                        {anomaly.confusion_matrix.false_positives.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-950 border border-amber-500/20 rounded-lg">
                      <span className="text-amber-400 block text-[10px]">False Negatives (Type II)</span>
                      <span className="text-base font-bold text-amber-300">
                        {anomaly.confusion_matrix.false_negatives.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-950 border border-emerald-500/20 rounded-lg">
                      <span className="text-emerald-400 block text-[10px]">True Positives (Detected)</span>
                      <span className="text-base font-bold text-emerald-400">
                        {anomaly.confusion_matrix.true_positives.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-slate-950 rounded-lg text-xs text-slate-400">
              {anomaly.note}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
