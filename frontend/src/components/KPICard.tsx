import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  accentColor?: 'teal' | 'cyan' | 'amber' | 'rose' | 'indigo';
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  unit,
  subtitle,
  icon,
  trend,
  accentColor = 'teal',
}) => {
  const colorMap = {
    teal: 'border-teal-500/30 text-teal-400 bg-teal-500/10',
    cyan: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
    amber: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
    rose: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
    indigo: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10',
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition">
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        <div className={`p-2 rounded-lg border ${colorMap[accentColor]}`}>
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-baseline space-x-2">
        <span className="text-2xl font-bold tracking-tight text-white font-mono">{value}</span>
        {unit && <span className="text-xs text-slate-400 font-medium">{unit}</span>}
      </div>
      {(subtitle || trend) && (
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span>{subtitle}</span>
          {trend && (
            <span
              className={`font-semibold ${
                trend.isPositive ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {trend.value} {trend.label && <span className="font-normal text-slate-500">{trend.label}</span>}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
