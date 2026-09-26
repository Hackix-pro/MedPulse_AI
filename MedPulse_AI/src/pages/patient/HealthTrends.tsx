import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Upload, 
  GitCompare, 
  Info,
  Calendar,
  Activity
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { Report } from '../../types';
import { HealthChart } from '../../components/charts/HealthChart';

export const HealthTrends: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    setReports(storageService.getReports());
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Biomarker Health Trends</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Longitudinal trajectories plotted directly from your verified diagnostic test results
          </p>
        </div>

        <button
          onClick={() => navigate('/patient/compare')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium self-start sm:self-auto transition-colors"
        >
          <GitCompare className="w-3.5 h-3.5" />
          <span>Side-by-Side Report Comparison</span>
        </button>
      </div>

      {/* Main Interactive Recharts Chart Component */}
      <HealthChart reports={reports} initialMetric="glucose" />

      {/* Secondary Chart: Hemoglobin & Blood Indices */}
      <div className="pt-2">
        <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-600" />
          Hematology Trajectory (Hemoglobin)
        </h2>
        <HealthChart reports={reports} initialMetric="hemoglobin" />
      </div>

      {/* Clinical Guidance Box */}
      <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 text-xs text-slate-700 flex items-start gap-3">
        <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-teal-900">Understanding Longitudinal Lab Variations</span>
          <p className="text-2xs text-slate-600 leading-relaxed">
            Laboratory values normally fluctuate based on hydration, fasting duration, circadian rhythms, and recent physical exertion. If you observe consistent trajectory shifts outside target bands, share the chart with your connected doctor.
          </p>
        </div>
      </div>
    </div>
  );
};
