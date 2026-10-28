import React from 'react';
import { Droplets, Cloud, CloudOff, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  isDemoMode: boolean;
  cloudStatus: string;
  onRefresh: () => void;
  loading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ isDemoMode, cloudStatus, onRefresh, loading }) => {
  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
          <Droplets className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg tracking-tight text-white">AquaSense</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">AI CLOUD</span>
          </div>
          <p className="text-xs text-slate-400">Smart Water Demand Forecasting & Conservation Platform</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Cloud Status Pill */}
        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
          isDemoMode 
            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' 
            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
        }`}>
          {isDemoMode ? <CloudOff className="w-3.5 h-3.5 text-amber-400" /> : <Cloud className="w-3.5 h-3.5 text-emerald-400" />}
          <span>{isDemoMode ? 'Local Demo Mode (Cloud Ready)' : 'GCP Connected'}</span>
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center space-x-1.5 text-xs bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition"
          title="Refresh Telemetry"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-400' : ''}`} />
          <span>Sync</span>
        </button>

        {/* Security / Verification Badge */}
        <div className="hidden md:flex items-center space-x-1 text-xs text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
          <span>Time-Aware ML Splitting (Zero Leakage)</span>
        </div>
      </div>
    </header>
  );
};
