import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { BookOpen, HelpCircle, Info } from 'lucide-react';

export default function RiskTrajectory({ trajectory }) {
  if (!trajectory || !trajectory.has_data || !trajectory.sem1 || !trajectory.sem2) {
    return (
      <div className="bg-white dark:bg-surface-darkcard p-6 rounded-2xl border border-slate-200 dark:border-surface-darkborder shadow-sm text-center py-10">
        <HelpCircle className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Trajectory Data Unavailable</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
          Curricular units for this student have not been recorded or are incomplete for semester comparison.
        </p>
      </div>
    );
  }

  const { sem1, sem2 } = trajectory;

  const chartData = [
    {
      metric: 'Enrolled Units',
      'Semester 1': sem1.enrolled ?? 0,
      'Semester 2': sem2.enrolled ?? 0,
    },
    {
      metric: 'Approved Units',
      'Semester 1': sem1.approved ?? 0,
      'Semester 2': sem2.approved ?? 0,
    },
    {
      metric: 'Evaluations',
      'Semester 1': sem1.evaluations ?? 0,
      'Semester 2': sem2.evaluations ?? 0,
    },
    {
      metric: 'Grade Average (/20)',
      'Semester 1': Number(sem1.grade ?? 0).toFixed(1),
      'Semester 2': Number(sem2.grade ?? 0).toFixed(1),
    },
  ];

  // Calculate approval rate change
  const sem1PassRate = sem1.enrolled > 0 ? (sem1.approved / sem1.enrolled) * 100 : 0;
  const sem2PassRate = sem2.enrolled > 0 ? (sem2.approved / sem2.enrolled) * 100 : 0;
  const passRateDiff = sem2PassRate - sem1PassRate;

  return (
    <div className="bg-white dark:bg-surface-darkcard p-6 rounded-2xl border border-slate-200 dark:border-surface-darkborder shadow-sm">
      {/* Header with Mandatory Strict Label */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-surface-darkborder gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Academic Progression Trajectory</h3>
          </div>
          {/* Mandatory Specific Label */}
          <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 mt-0.5">
            Real Sem 1 → Sem 2 trajectory derived from curricular units
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-400" />
            Measures empirical academic momentum across 1st and 2nd semesters using recorded curricular unit enrollments, completions, evaluations, and grade averages.
          </p>
        </div>

        {/* Quick summary badges */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium">
            Sem 1: {sem1.approved}/{sem1.enrolled} passed ({sem1PassRate.toFixed(0)}%)
          </span>
          <span className={`px-2.5 py-1 rounded-lg font-medium ${
            passRateDiff < 0 
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60' 
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60'
          }`}>
            Sem 2: {sem2.approved}/{sem2.enrolled} passed ({sem2PassRate.toFixed(0)}%)
          </span>
        </div>
      </div>

      {/* Trajectory Bar Chart */}
      <div className="mt-6 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b833" />
            <XAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Bar dataKey="Semester 1" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={28} />
            <Bar dataKey="Semester 2" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Trajectory Insights Footer */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-surface-darkborder grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-400">
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-surface-darkborder">
          <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Sem 1 Grade Avg</span>
          <span className="text-sm font-bold text-slate-800 dark:text-white">{Number(sem1.grade ?? 0).toFixed(2)} / 20</span>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-surface-darkborder">
          <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Sem 2 Grade Avg</span>
          <span className="text-sm font-bold text-slate-800 dark:text-white">{Number(sem2.grade ?? 0).toFixed(2)} / 20</span>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-surface-darkborder">
          <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Approved Unit Delta</span>
          <span className={`text-sm font-bold ${
            (sem2.approved - sem1.approved) < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {(sem2.approved - sem1.approved) >= 0 ? `+${sem2.approved - sem1.approved}` : sem2.approved - sem1.approved} units
          </span>
        </div>
      </div>
    </div>
  );
}
