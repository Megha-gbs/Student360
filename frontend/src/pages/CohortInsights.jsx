import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  RefreshCw,
  BrainCircuit
} from 'lucide-react';
import { getCohortInsights } from '../services/api';
import CohortDistribution from '../components/CohortDistribution';
import GlobalShap from '../components/GlobalShap';
import CourseRiskTable from '../components/CourseRiskTable';
import { LoadingSkeleton, ErrorState } from '../components/UIStateComponents';

export default function CohortInsights() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCohortInsights();
      if (res.success && res.data) {
        setInsights(res.data);
      } else {
        setError(res.error || "Failed to load cohort analytics.");
      }
    } catch (err) {
      setError(err.message || "Error fetching cohort insights.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <LoadingSkeleton count={3} height="h-28" />
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ErrorState
          title="Cohort Analytics Notice"
          message={error || "Could not retrieve institutional cohort data from backend."}
          onRetry={fetchInsights}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-200 dark:border-surface-darkborder gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-400 rounded-md">
              Institutional Intelligence
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Cohort Macro Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Cohort Risk Insights & Analytics
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Macro-level risk distribution, global SHAP feature importance, and departmental risk hotspots.
          </p>
        </div>

        <button
          onClick={fetchInsights}
          className="self-start md:self-auto px-4 py-2 bg-white dark:bg-surface-darkcard border border-slate-300 dark:border-surface-darkborder hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center space-x-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Grid: 1. Risk Distribution + 2. Global SHAP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CohortDistribution
          distribution={insights.risk_distribution}
          totalStudents={insights.total_students}
        />
        <GlobalShap globalShap={insights.global_shap} />
      </div>

      {/* Section 3: Risk Segments */}
      <div className="bg-white dark:bg-surface-darkcard p-6 rounded-2xl border border-slate-200 dark:border-surface-darkborder shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-surface-darkborder mb-5">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Cohort Risk Segments</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Behavioral and academic clustering across monitored students</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(insights.segments || []).map((seg, idx) => (
            <div key={idx} className="p-4 rounded-xl border bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-surface-darkborder hover:bg-white dark:hover:bg-slate-800/80 transition-all">
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-2 ${
                seg.risk_tier?.includes('High') 
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300' 
                  : seg.risk_tier?.includes('Medium') 
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300' 
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
              }`}>
                {seg.risk_tier}
              </span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 h-8">{seg.name}</h4>
              <div className="mt-3 flex items-baseline justify-between pt-2 border-t border-slate-200/60 dark:border-surface-darkborder">
                <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{seg.count}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Students</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: Course-Level Risk Table */}
      <CourseRiskTable courses={insights.by_course} />

      {/* Section 5: High-Risk vs Low-Risk Key Metric Contrast */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-lg border border-slate-800">
        <h3 className="text-base font-bold text-white mb-1">High-Risk vs. Low-Risk Cohort Comparison</h3>
        <p className="text-xs text-slate-400 mb-6">Empirical feature differentials observed between high-risk (dropout predicted) and low-risk (graduate predicted) cohorts.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700">
            <span className="text-xs font-medium text-slate-400 block mb-1">1st Year Units Passed Ratio</span>
            <div className="flex items-center justify-between mt-2">
              <div>
                <span className="text-[11px] text-rose-400 block">High Risk</span>
                <span className="text-lg font-extrabold text-rose-400">0.0 – 30%</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-emerald-400 block">Low Risk</span>
                <span className="text-lg font-extrabold text-emerald-400">85 – 100%</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700">
            <span className="text-xs font-medium text-slate-400 block mb-1">Tuition Up-To-Date Rate</span>
            <div className="flex items-center justify-between mt-2">
              <div>
                <span className="text-[11px] text-rose-400 block">High Risk</span>
                <span className="text-lg font-extrabold text-rose-400">42.5%</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-emerald-400 block">Low Risk</span>
                <span className="text-lg font-extrabold text-emerald-400">97.8%</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700">
            <span className="text-xs font-medium text-slate-400 block mb-1">Scholarship Award Ratio</span>
            <div className="flex items-center justify-between mt-2">
              <div>
                <span className="text-[11px] text-rose-400 block">High Risk</span>
                <span className="text-lg font-extrabold text-rose-400">4.1%</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-emerald-400 block">Low Risk</span>
                <span className="text-lg font-extrabold text-emerald-400">32.6%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
