import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'cloud' | 'severity' | 'leak';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'severity' }) => {
  const s = status.toLowerCase();

  let style = 'bg-slate-800 text-slate-300 border-slate-700';

  if (type === 'severity') {
    if (s === 'high') {
      style = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    } else if (s === 'medium') {
      style = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    } else {
      style = 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    }
  } else if (type === 'cloud') {
    if (s === 'operational') {
      style = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    } else if (s === 'pending_configuration' || s === 'pending') {
      style = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    } else {
      style = 'bg-slate-800 text-slate-400 border-slate-700';
    }
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${style}`}>
      {status.replace(/_/g, ' ').toUpperCase()}
    </span>
  );
};
