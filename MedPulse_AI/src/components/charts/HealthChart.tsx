import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine
} from 'recharts';
import { Report } from '../../types';
import { ArrowUpRight, ArrowDownRight, Minus, AlertCircle } from 'lucide-react';

interface HealthChartProps {
  reports: Report[];
  initialMetric?: string;
}

interface MetricConfig {
  key: string;
  name: string;
  unit: string;
  minNormal: number;
  maxNormal: number;
  color: string;
  yDomain: [number, number];
}

const METRICS_CONFIG: MetricConfig[] = [
  { key: 'hemoglobin', name: 'Hemoglobin', unit: 'g/dL', minNormal: 13.0, maxNormal: 17.0, color: '#0d9488', yDomain: [10, 18] },
  { key: 'glucose', name: 'Fasting Blood Glucose', unit: 'mg/dL', minNormal: 70, maxNormal: 99, color: '#e11d48', yDomain: [60, 180] },
  { key: 'bp_systolic', name: 'Blood Pressure (Systolic)', unit: 'mmHg', minNormal: 90, maxNormal: 120, color: '#2563eb', yDomain: [80, 160] },
  { key: 'cholesterol', name: 'Total Cholesterol', unit: 'mg/dL', minNormal: 120, maxNormal: 200, color: '#d97706', yDomain: [100, 260] },
  { key: 'vitamin_d', name: 'Vitamin D (25-OH)', unit: 'ng/mL', minNormal: 30, maxNormal: 100, color: '#8b5cf6', yDomain: [10, 70] },
  { key: 'tsh', name: 'TSH (Thyroid)', unit: 'uIU/mL', minNormal: 0.4, maxNormal: 4.5, color: '#059669', yDomain: [0, 6] }
];

export const HealthChart: React.FC<HealthChartProps> = ({ reports, initialMetric = 'hemoglobin' }) => {
  const [selectedMetricKey, setSelectedMetricKey] = useState(initialMetric);
  const [dateRange, setDateRange] = useState<'3M' | '6M' | '1Y' | 'ALL'>('ALL');

  const activeMetric = useMemo(() => {
    return METRICS_CONFIG.find(m => m.key === selectedMetricKey) || METRICS_CONFIG[0];
  }, [selectedMetricKey]);

  // Extract data points from stored reports
  const chartData = useMemo(() => {
    const sorted = [...reports].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const points: Array<{ date: string; displayDate: string; value: number; title: string; isAbnormal: boolean }> = [];

    sorted.forEach(r => {
      r.extractedValues.forEach(v => {
        let matches = false;
        const name = v.testName.toLowerCase();

        if (activeMetric.key === 'hemoglobin' && name === 'hemoglobin') matches = true;
        if (activeMetric.key === 'glucose' && name.includes('glucose')) matches = true;
        if (activeMetric.key === 'bp_systolic' && name.includes('systolic')) matches = true;
        if (activeMetric.key === 'cholesterol' && name === 'total cholesterol') matches = true;
        if (activeMetric.key === 'vitamin_d' && name.includes('vitamin d')) matches = true;
        if (activeMetric.key === 'tsh' && name.includes('tsh')) matches = true;

        if (matches) {
          const displayDate = new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const isAbnormal = v.value < activeMetric.minNormal || v.value > activeMetric.maxNormal;
          points.push({
            date: r.date,
            displayDate,
            value: v.value,
            title: r.title,
            isAbnormal
          });
        }
      });
    });

    // Filter by date range if needed
    if (dateRange === 'ALL') return points;
    const now = new Date();
    const months = dateRange === '3M' ? 3 : dateRange === '6M' ? 6 : 12;
    const cutoff = new Date(now.setMonth(now.getMonth() - months));

    return points.filter(p => new Date(p.date) >= cutoff);
  }, [reports, activeMetric, dateRange]);

  // Calculate statistics (Current, Previous, Delta)
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;
    const current = chartData[chartData.length - 1];
    const previous = chartData.length > 1 ? chartData[chartData.length - 2] : null;

    let delta = 0;
    let deltaPercentage = 0;
    if (previous) {
      delta = Number((current.value - previous.value).toFixed(2));
      deltaPercentage = previous.value !== 0 ? Number(((delta / previous.value) * 100).toFixed(1)) : 0;
    }

    const isCurrentAbnormal = current.value < activeMetric.minNormal || current.value > activeMetric.maxNormal;

    return {
      currentValue: current.value,
      currentDate: current.date,
      previousValue: previous?.value,
      previousDate: previous?.date,
      delta,
      deltaPercentage,
      isCurrentAbnormal
    };
  }, [chartData, activeMetric]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
      {/* Top Controls: Metric Selector & Date Range Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <select
            value={selectedMetricKey}
            onChange={e => setSelectedMetricKey(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-teal-500"
          >
            {METRICS_CONFIG.map(m => (
              <option key={m.key} value={m.key}>
                {m.name} ({m.unit})
              </option>
            ))}
          </select>
          <span className="text-2xs text-slate-400 font-mono hidden md:inline">
            Normal: {activeMetric.minNormal} - {activeMetric.maxNormal} {activeMetric.unit}
          </span>
        </div>

        {/* Date Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg self-start sm:self-auto">
          {(['3M', '6M', '1Y', 'ALL'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setDateRange(tab)}
              className={`px-2.5 py-1 text-2xs font-semibold rounded-md transition-colors ${
                dateRange === tab
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Delta Stat Header */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 mb-5 text-xs">
          <div>
            <span className="text-2xs text-slate-500 block">Latest Reading</span>
            <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">
              {stats.currentValue} <span className="text-2xs font-normal text-slate-500">{activeMetric.unit}</span>
            </span>
            <span className="text-3xs text-slate-400 block font-mono">{stats.currentDate}</span>
          </div>

          <div>
            <span className="text-2xs text-slate-500 block">Previous Reading</span>
            <span className="text-lg font-bold text-slate-700 font-mono tabular-nums">
              {stats.previousValue !== undefined ? stats.previousValue : '—'}{' '}
              <span className="text-2xs font-normal text-slate-500">{activeMetric.unit}</span>
            </span>
            <span className="text-3xs text-slate-400 block font-mono">
              {stats.previousDate || 'No prior test'}
            </span>
          </div>

          <div>
            <span className="text-2xs text-slate-500 block">Change / Trend</span>
            <div className="flex items-center gap-1 mt-0.5">
              {stats.delta > 0 && <ArrowUpRight className="w-4 h-4 text-rose-500" />}
              {stats.delta < 0 && <ArrowDownRight className="w-4 h-4 text-teal-600" />}
              {stats.delta === 0 && <Minus className="w-4 h-4 text-slate-400" />}
              <span className="text-xs font-mono font-semibold">
                {stats.delta > 0 ? `+${stats.delta}` : stats.delta} {activeMetric.unit}
              </span>
              <span className="text-2xs text-slate-400">
                ({stats.deltaPercentage > 0 ? `+${stats.deltaPercentage}` : stats.deltaPercentage}%)
              </span>
            </div>
          </div>

          <div>
            <span className="text-2xs text-slate-500 block">Target Range</span>
            <span className="text-xs font-mono font-semibold text-slate-700 block mt-1">
              {activeMetric.minNormal} – {activeMetric.maxNormal} {activeMetric.unit}
            </span>
            <span className={`text-2xs font-medium ${stats.isCurrentAbnormal ? 'text-rose-600' : 'text-emerald-600'}`}>
              {stats.isCurrentAbnormal ? 'Out of Range' : 'In Normal Range'}
            </span>
          </div>
        </div>
      )}

      {/* Chart Canvas */}
      <div className="h-64 sm:h-72 w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
            <AlertCircle className="w-6 h-6 mb-2 text-slate-300" />
            <span>No data points recorded for {activeMetric.name} yet.</span>
            <span className="text-2xs text-slate-400 mt-1">
              Upload a test report containing this parameter to plot historical trends.
            </span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                domain={activeMetric.yDomain}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                fontFamily="monospace"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-lg font-sans">
                        <p className="font-semibold text-teal-300">{data.title}</p>
                        <p className="text-2xs text-slate-400 font-mono mt-0.5">{data.date}</p>
                        <div className="flex items-baseline gap-1 mt-1.5 font-mono">
                          <span className="text-sm font-bold">{data.value}</span>
                          <span className="text-2xs text-slate-300">{activeMetric.unit}</span>
                        </div>
                        <p className="text-2xs mt-1 text-slate-300">
                          Range: {activeMetric.minNormal} - {activeMetric.maxNormal} {activeMetric.unit}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Shaded normal reference area */}
              <ReferenceArea
                y1={activeMetric.minNormal}
                y2={activeMetric.maxNormal}
                fill="#10b981"
                fillOpacity={0.06}
              />
              <ReferenceLine
                y={activeMetric.minNormal}
                stroke="#10b981"
                strokeDasharray="3 3"
                strokeWidth={1}
                label={{ value: 'Min', position: 'insideTopLeft', fontSize: 9, fill: '#10b981' }}
              />
              <ReferenceLine
                y={activeMetric.maxNormal}
                stroke="#10b981"
                strokeDasharray="3 3"
                strokeWidth={1}
                label={{ value: 'Max', position: 'insideTopLeft', fontSize: 9, fill: '#10b981' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={activeMetric.color}
                strokeWidth={2.5}
                dot={{ r: 4, fill: activeMetric.color, strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6, stroke: activeMetric.color, strokeWidth: 2, fill: '#ffffff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex items-center justify-between text-2xs text-slate-400 pt-3 border-t border-slate-100 mt-2">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500 inline-block" />
          Shaded band indicates target reference range
        </span>
        <span>Data dynamically aggregated from {reports.length} uploaded records</span>
      </div>
    </div>
  );
};
