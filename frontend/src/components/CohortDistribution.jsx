import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';

const COLORS = {
  High: '#f43f5e',
  Medium: '#f59e0b',
  Low: '#10b981'
};

export default function CohortDistribution({ distribution = { High: 0, Medium: 0, Low: 0 }, totalStudents = 0 }) {
  const chartData = [
    { name: 'High Risk (≥65%)', value: distribution.High || 0, color: COLORS.High },
    { name: 'Medium Risk (35-64%)', value: distribution.Medium || 0, color: COLORS.Medium },
    { name: 'Low Risk (<35%)', value: distribution.Low || 0, color: COLORS.Low },
  ];

  const total = (distribution.High || 0) + (distribution.Medium || 0) + (distribution.Low || 0) || totalStudents || 1;

  return (
    <div className="bg-white dark:bg-surface-darkcard p-6 rounded-2xl border border-slate-200 dark:border-surface-darkborder shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-surface-darkborder">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg text-indigo-600 dark:text-indigo-400">
            <PieIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Cohort Risk Distribution</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Breakdown of students across model-defined risk tiers</p>
          </div>
        </div>
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
          Total: {total} Students
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 items-center gap-4">
        {/* Pie / Donut Chart */}
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                itemStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend / Metrics Cards */}
        <div className="space-y-2.5">
          <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/60 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-xs font-bold text-rose-900 dark:text-rose-300">High Risk (≥65%)</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-extrabold text-rose-700 dark:text-rose-400">{distribution.High || 0}</span>
              <span className="text-xs text-rose-600 dark:text-rose-400 ml-1">({(((distribution.High || 0) / total) * 100).toFixed(0)}%)</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/60 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-xs font-bold text-amber-900 dark:text-amber-300">Medium Risk (35-64%)</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-extrabold text-amber-700 dark:text-amber-400">{distribution.Medium || 0}</span>
              <span className="text-xs text-amber-600 dark:text-amber-400 ml-1">({(((distribution.Medium || 0) / total) * 100).toFixed(0)}%)</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">Low Risk (&lt;35%)</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">{distribution.Low || 0}</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 ml-1">({(((distribution.Low || 0) / total) * 100).toFixed(0)}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
