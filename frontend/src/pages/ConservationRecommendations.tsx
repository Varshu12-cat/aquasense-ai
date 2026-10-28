import React, { useState, useEffect } from 'react';
import {
  Leaf,
  Target,
  IndianRupee,
  AlertCircle,
  TrendingDown,
  CheckCircle,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../services/api';
import { ConservationResponse } from '../types';

export const ConservationRecommendations: React.FC = () => {
  const [data, setData] = useState<ConservationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeScenario, setActiveScenario] = useState<number>(10);

  useEffect(() => {
    loadConservation();
  }, []);

  const loadConservation = async () => {
    setLoading(true);
    try {
      const res = await api.getConservationInsights();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedScenario = data?.reduction_scenarios.find(
    (s) => s.scenario_percent === activeScenario
  ) || data?.reduction_scenarios[1];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Leaf className="w-5 h-5 text-emerald-400" />
            <span>Water Conservation & Efficiency Opportunities</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Data-driven reduction targets, potential savings projections, and actionable plumbing audits
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
          <Target className="w-4 h-4 text-emerald-400" />
          <span>Configurable Reduction Modeling</span>
        </div>
      </div>

      {/* Mandatory Academic Disclaimer Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start space-x-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200 leading-relaxed">
          <span className="font-bold text-amber-300">ESTIMATED VS. MEASURED SAVINGS NOTICE: </span>
          {data?.disclaimer || (
            "Savings projections are analytical models derived from comparative baseline regressions. AquaSense AI does not physically alter valves or guarantee utility savings without verified utility billing."
          )}
        </div>
      </div>

      {/* Baseline Comparison KPIs */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-400">Current Daily Demand (14d Avg)</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {Math.round(data.current_daily_consumption_liters).toLocaleString()} L/day
            </div>
            <span className="text-[11px] text-slate-500">Active campus consumption</span>
          </div>

          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-400">Historical Benchmark Baseline</span>
            <div className="text-2xl font-bold font-mono text-slate-300 mt-1">
              {Math.round(data.historical_baseline_daily_liters).toLocaleString()} L/day
            </div>
            <span className="text-[11px] text-slate-500">90-day overall facility mean</span>
          </div>

          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-400">Baseline Variance</span>
            <div
              className={`text-2xl font-bold font-mono mt-1 ${
                data.percent_above_baseline > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {data.percent_above_baseline > 0 ? `+${data.percent_above_baseline}%` : `${data.percent_above_baseline}%`}
            </div>
            <span className="text-[11px] text-slate-500">
              {data.percent_above_baseline > 0 ? 'Above target benchmark' : 'Operating within benchmark'}
            </span>
          </div>
        </div>
      )}

      {/* Interactive Reduction Scenario Simulator */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center space-x-2">
              <span>Interactive Conservation Scenario Modeling</span>
            </h3>
            <p className="text-xs text-slate-400">
              Evaluate campus-wide water savings and utility cost reduction at configurable efficiency targets
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Scenario Target:</span>
            <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex space-x-1">
              {[5, 10, 15].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setActiveScenario(pct)}
                  className={`px-3 py-1 text-xs rounded font-bold transition ${
                    activeScenario === pct
                      ? 'bg-emerald-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {pct}% Cut
                </button>
              ))}
            </div>
          </div>
        </div>

        {selectedScenario && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-slate-950/70 border border-emerald-500/20 rounded-xl">
              <span className="text-xs text-slate-400">Projected Daily Water Savings</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
                {Math.round(selectedScenario.estimated_water_saved_liters).toLocaleString()} Liters/day
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Annualized: ~{Math.round((selectedScenario.estimated_water_saved_liters * 365) / 1000).toLocaleString()} kL
              </p>
            </div>

            <div className="p-4 bg-slate-950/70 border border-cyan-500/20 rounded-xl">
              <span className="text-xs text-slate-400">Est. Daily Financial Savings</span>
              <div className="text-2xl font-bold font-mono text-cyan-400 mt-2">
                ₹{Math.round(selectedScenario.estimated_cost_saved_inr).toLocaleString()} /day
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Monthly Utility Benefit: ~₹{Math.round(selectedScenario.estimated_cost_saved_inr * 30).toLocaleString()}
              </p>
            </div>

            <div className="p-4 bg-slate-950/70 border border-indigo-500/20 rounded-xl">
              <span className="text-xs text-slate-400">Target Daily Campus Budget</span>
              <div className="text-2xl font-bold font-mono text-indigo-400 mt-2">
                {Math.round(selectedScenario.target_daily_budget_liters).toLocaleString()} Liters
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Maximum allowable baseline to hit {selectedScenario.scenario_percent}% efficiency
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actionable Facility Audits */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-base font-semibold text-white pb-3 border-b border-slate-800">
          Prioritized Facility Action Items
        </h3>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.actionable_recommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 hover:border-slate-700 transition space-y-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">
                    {rec.category}
                  </span>
                  <h4 className="text-sm font-semibold text-white mt-0.5">{rec.title}</h4>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {rec.impact}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{rec.description}</p>
              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60">
                <span>Verification State: Theoretical Recommendation</span>
                <span className="text-slate-500">Ref: {rec.id}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
