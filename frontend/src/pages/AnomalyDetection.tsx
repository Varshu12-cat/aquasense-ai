import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Search,
  Filter,
  Info,
  CheckCircle2,
  Moon,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { api } from '../services/api';
import { AnomalyListResponse, AnomalyItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const AnomalyDetection: React.FC = () => {
  const [data, setData] = useState<AnomalyListResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadAnomalies();
  }, [selectedSeverity]);

  const loadAnomalies = async () => {
    setLoading(true);
    try {
      const res = await api.getAnomalies({
        severity: selectedSeverity || undefined,
      });
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredList = data?.anomalies.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.location.toLowerCase().includes(q) ||
      a.meter_id.toLowerCase().includes(q) ||
      a.anomaly_type.toLowerCase().includes(q)
    );
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <AlertOctagon className="w-5 h-5 text-rose-400" />
            <span>Water Anomaly & Potential Leak Candidate Detection</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Statistical & unsupervised ML identification of abnormal consumption patterns, spikes, and nocturnal leak candidates
          </p>
        </div>

        {/* Verification distinction callout */}
        <div className="flex items-center space-x-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Notice: Anomalies represent potential issues requiring physical verification, not confirmed leaks.</span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-400">Total Flagged Events</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {data.summary.total_anomalies}
            </div>
            <span className="text-[11px] text-slate-400">Across 90-day dataset</span>
          </div>

          <div className="p-4 bg-slate-900/90 border border-rose-500/20 rounded-xl">
            <span className="text-xs text-rose-400 font-semibold">High Severity Events</span>
            <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
              {data.summary.by_severity.high || 0}
            </div>
            <span className="text-[11px] text-slate-400">Immediate inspection recommended</span>
          </div>

          <div className="p-4 bg-slate-900/90 border border-amber-500/20 rounded-xl">
            <span className="text-xs text-amber-400 font-semibold">Overnight Leak Candidates</span>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
              {data.summary.by_type.overnight_leak || 0}
            </div>
            <span className="text-[11px] text-slate-400">01:00 - 05:00 AM flow surge</span>
          </div>

          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
            <span className="text-xs text-cyan-400 font-semibold">Sudden Spikes</span>
            <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
              {data.summary.by_type.sudden_spike || 0}
            </div>
            <span className="text-[11px] text-slate-400">&gt; 2.5σ standard deviation</span>
          </div>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <span className="text-xs text-slate-400 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Severity:</span>
          </span>
          <div className="flex space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {['', 'high', 'medium', 'low'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-3 py-1 text-xs rounded font-medium transition ${
                  selectedSeverity === sev
                    ? 'bg-teal-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {sev ? sev.toUpperCase() : 'ALL'}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search location, meter ID, type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500 placeholder-slate-500"
          />
        </div>
      </div>

      {/* Anomalies Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Facility & Meter</th>
                <th className="py-3 px-4">Anomaly Classification</th>
                <th className="py-3 px-4 text-right">Observed</th>
                <th className="py-3 px-4 text-right">Expected</th>
                <th className="py-3 px-4 text-right">Deviation</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Recommended Action</th>
                <th className="py-3 px-4">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-teal-400"></div>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No anomalies matching current criteria.
                  </td>
                </tr>
              ) : (
                filteredList.map((a, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                      {new Date(a.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{a.location}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{a.meter_id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5">
                        {a.anomaly_type.includes('leak') ? (
                          <Moon className="w-3.5 h-3.5 text-indigo-400" />
                        ) : a.anomaly_type.includes('spike') ? (
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                        <span className="font-medium text-slate-200 capitalize">
                          {a.anomaly_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-400 whitespace-nowrap">
                      {a.observed_liters.toFixed(1)} L/h
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400 whitespace-nowrap">
                      {a.expected_liters.toFixed(1)} L/h
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-amber-400 font-semibold whitespace-nowrap">
                      +{a.deviation_liters.toFixed(1)} L/h
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={a.severity} type="severity" />
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate" title={a.recommended_action}>
                      {a.recommended_action}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        Pending Audit
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
