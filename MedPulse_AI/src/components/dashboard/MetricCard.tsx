import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, CheckCircle, AlertTriangle } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'high' | 'low' | 'critical';
  lastUpdated: string;
  trend?: 'up' | 'down' | 'stable';
  trendDelta?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  referenceRange,
  status,
  lastUpdated,
  trend = 'stable',
  trendDelta,
  onClick
}) => {
  const isNormal = status === 'normal';
  const isHigh = status === 'high' || status === 'critical';
  const isLow = status === 'low';

  const statusLabel = isNormal ? 'Normal' : isHigh ? 'Above Range' : 'Below Range';
  const statusColor = isNormal
    ? 'text-emerald-700'
    : isHigh
    ? 'text-rose-700'
    : 'text-amber-700';

  return (
    <div
      onClick={onClick}
      className={`bg-white border rounded-xl p-4 transition-all duration-150 ${
        onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-xs' : ''
      } ${
        !isNormal ? 'border-amber-200/80 bg-amber-50/10' : 'border-slate-200'
      }`}
    >
      {/* Title & Status */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-slate-600 truncate">{title}</span>
        <div className="flex items-center gap-1.5 text-2xs font-medium">
          {isNormal ? (
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          )}
          <span className={statusColor}>{statusLabel}</span>
        </div>
      </div>

      {/* Primary Value & Unit */}
      <div className="flex items-baseline gap-1.5 mb-3">
        <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
          {value}
        </span>
        <span className="text-xs text-slate-500 font-normal">{unit}</span>

        {trendDelta && (
          <div className="ml-auto flex items-center text-2xs font-mono font-medium text-slate-600">
            {trend === 'up' && <ArrowUpRight className="w-3 h-3 text-rose-500" />}
            {trend === 'down' && <ArrowDownRight className="w-3 h-3 text-teal-600" />}
            {trend === 'stable' && <Minus className="w-3 h-3 text-slate-400" />}
            <span>{trendDelta}</span>
          </div>
        )}
      </div>

      {/* Reference & Date metadata with dot separator */}
      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-500">
        <span className="font-mono">Ref: {referenceRange}</span>
        <span>{lastUpdated}</span>
      </div>
    </div>
  );
};
