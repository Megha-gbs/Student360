import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { BarChart3, Info } from 'lucide-react';

export default function GlobalShap({ globalShap = [] }) {
  if (!globalShap || globalShap.length === 0) {
    return (
      <div className="bg-white dark:bg-surface-darkcard p-6 rounded-2xl border border-slate-200 dark:border-surface-darkborder shadow-sm text-center py-8">
        <Info className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Global Feature Importance Unavailable</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Global SHAP metrics could not be loaded from the backend.</p>
      </div>
    );
  }

  // Format data for horizontal bar chart
  const chartData = [...globalShap]
    .sort((a, b) => b.mean_abs_shap - a.mean_abs_shap)
    .slice(0, 8)
    .map(item => ({
      feature: item.feature.length > 28 ? item.feature.substring(0, 26) + '...' : item.feature,
      fullFeature: item.feature,
      importance: Number(item.mean_abs_shap).toFixed(3),
      value: Number(item.mean_abs_shap)
    }));

  return (
    <div className="bg-white dark:bg-surface-darkcard p-6 rounded-2xl border border-slate-200 dark:border-surface-darkborder shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-surface-darkborder">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg text-indigo-600 dark:text-indigo-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Global Feature Importance (SHAP)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Cohort-level mean absolute SHAP values (|SHAP|)</p>
          </div>
        </div>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
          Top 8 Drivers
        </span>
      </div>

      <div className="mt-5 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#94a3b833" />
            <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="feature"
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
              width={160}
            />
            <Tooltip
              formatter={(value, name, props) => [`${value} |SHAP|`, props.payload.fullFeature]}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 text-right">
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          Source: Mean |SHAP| computed across validated UCI training partition
        </span>
      </div>
    </div>
  );
}
