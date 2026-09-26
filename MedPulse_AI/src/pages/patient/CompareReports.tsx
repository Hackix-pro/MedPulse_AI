import React, { useState, useEffect, useMemo } from 'react';
import { 
  GitCompare, 
  ArrowRight, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus, 
  AlertTriangle, 
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { aiService, ComparisonResult } from '../../services/aiService';
import { Report } from '../../types';

export const CompareReports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [reportAId, setReportAId] = useState<string>('');
  const [reportBId, setReportBId] = useState<string>('');

  useEffect(() => {
    const list = storageService.getReports();
    setReports(list);

    if (list.length >= 2) {
      // Default to older report as A, newer as B
      const sorted = [...list].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setReportAId(sorted[0].id);
      setReportBId(sorted[sorted.length - 1].id);
    } else if (list.length === 1) {
      setReportAId(list[0].id);
      setReportBId(list[0].id);
    }
  }, []);

  const reportA = reports.find(r => r.id === reportAId);
  const reportB = reports.find(r => r.id === reportBId);

  const comparison: ComparisonResult | null = useMemo(() => {
    if (!reportA || !reportB || reportA.id === reportB.id) return null;
    // ensure chronological older to newer
    const isAOlder = new Date(reportA.date).getTime() <= new Date(reportB.date).getTime();
    const older = isAOlder ? reportA : reportB;
    const newer = isAOlder ? reportB : reportA;
    return aiService.compareReports(older, newer);
  }, [reportA, reportB]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Compare Medical Reports</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Select any two diagnostic test documents to perform automated biomarker diff analysis and AI synthesis
        </p>
      </div>

      {/* Selectors Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <label className="block text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Baseline Report (A)
          </label>
          <select
            value={reportAId}
            onChange={e => setReportAId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-teal-500"
          >
            {reports.map(r => (
              <option key={r.id} value={r.id}>
                {r.title} ({r.date}) · {r.category}
              </option>
            ))}
          </select>
          {reportA && (
            <p className="text-3xs text-slate-400 font-mono mt-1">
              {reportA.hospitalOrLab} · {reportA.extractedValues.length} biomarkers
            </p>
          )}
        </div>

        <div>
          <label className="block text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Follow-up Report (B)
          </label>
          <select
            value={reportBId}
            onChange={e => setReportBId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-teal-500"
          >
            {reports.map(r => (
              <option key={r.id} value={r.id}>
                {r.title} ({r.date}) · {r.category}
              </option>
            ))}
          </select>
          {reportB && (
            <p className="text-3xs text-slate-400 font-mono mt-1">
              {reportB.hospitalOrLab} · {reportB.extractedValues.length} biomarkers
            </p>
          )}
        </div>
      </div>

      {/* Comparison Body */}
      {reportAId === reportBId ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
          <GitCompare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="font-semibold text-slate-800">Select two distinct reports</p>
          <p className="text-2xs text-slate-400 mt-1">Choose a different document for Report B to generate differential analytics.</p>
        </div>
      ) : !comparison ? null : (
        <div className="space-y-6">
          {/* AI Clinical Comparison Synthesis Banner */}
          <div className="p-5 bg-teal-50/50 rounded-2xl border border-teal-100 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900">
                    AI Clinical Comparison Summary
                  </h3>
                  <span className="text-3xs font-mono text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                    Span: {comparison.daysBetween} Days
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {comparison.overallSummary}
                </p>

                {/* Scorecards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-2xs">
                  <div className="p-2 rounded-lg bg-white border border-teal-200/60">
                    <span className="text-slate-400 block">Total Matched Tests</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {comparison.items.length}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-white border border-teal-200/60">
                    <span className="text-slate-400 block">Improved / Normalized</span>
                    <span className="font-mono font-bold text-emerald-600 text-sm">
                      {comparison.improvedCount}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-white border border-teal-200/60">
                    <span className="text-slate-400 block">Increased / Elevated</span>
                    <span className="font-mono font-bold text-rose-600 text-sm">
                      {comparison.worsenedCount}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-white border border-teal-200/60">
                    <span className="text-slate-400 block">Stable / Unchanged</span>
                    <span className="font-mono font-bold text-slate-700 text-sm">
                      {comparison.stableCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Side-by-Side Comparison Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                Biomarker Differential Matrix
              </span>
              <span className="text-2xs text-slate-500 font-mono">
                {comparison.reportA.date} → {comparison.reportB.date}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 text-2xs uppercase">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Test Parameter</th>
                    <th className="py-2.5 px-4 font-semibold text-right">
                      {comparison.reportA.title.slice(0, 18)} ({comparison.reportA.date})
                    </th>
                    <th className="py-2.5 px-4 font-semibold text-right">
                      {comparison.reportB.title.slice(0, 18)} ({comparison.reportB.date})
                    </th>
                    <th className="py-2.5 px-4 font-semibold text-right">Difference (Delta)</th>
                    <th className="py-2.5 px-4 font-semibold">Trend</th>
                    <th className="py-2.5 px-4 font-semibold">Clinical Status Shift</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comparison.items.map(item => {
                    return (
                      <tr key={item.testName} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {item.testName}
                          <span className="text-3xs text-slate-400 block font-mono">
                            Ref: {item.referenceRange} {item.unit}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700 tabular-nums">
                          {item.previousValue !== 0 ? item.previousValue : '—'} {item.unit}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {item.currentValue} {item.unit}
                        </td>

                        <td className="py-3 px-4 text-right font-mono tabular-nums">
                          <span className={`font-semibold ${item.diff > 0 ? 'text-rose-600' : item.diff < 0 ? 'text-teal-600' : 'text-slate-600'}`}>
                            {item.diff > 0 ? `+${item.diff}` : item.diff} {item.unit}
                          </span>
                          {item.diffPercentage !== 0 && (
                            <span className="text-3xs text-slate-400 block">
                              ({item.diffPercentage > 0 ? `+${item.diffPercentage}` : item.diffPercentage}%)
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-2xs font-semibold capitalize">
                            {item.trend === 'increased' && (
                              <>
                                <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
                                <span className="text-rose-700">Increased</span>
                              </>
                            )}
                            {item.trend === 'decreased' && (
                              <>
                                <ArrowDownRight className="w-3.5 h-3.5 text-teal-600" />
                                <span className="text-teal-700">Decreased</span>
                              </>
                            )}
                            {item.trend === 'improved' && (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Normalized</span>
                              </>
                            )}
                            {item.trend === 'stable' && (
                              <>
                                <Minus className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-slate-600">Stable</span>
                              </>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`text-2xs font-semibold px-2 py-0.5 rounded ${
                            item.isAbnormal
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {item.statusChange}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
