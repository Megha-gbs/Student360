import React from 'react';
import { BookMarked } from 'lucide-react';

export default function CourseRiskTable({ courses = [] }) {
  if (!courses || courses.length === 0) {
    return (
      <div className="bg-white dark:bg-surface-darkcard p-6 rounded-2xl border border-slate-200 dark:border-surface-darkborder shadow-sm text-center py-8">
        <p className="text-xs text-slate-500 dark:text-slate-400">No course-level risk aggregations available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-surface-darkcard p-6 rounded-2xl border border-slate-200 dark:border-surface-darkborder shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-surface-darkborder">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg text-indigo-600 dark:text-indigo-400">
            <BookMarked className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Course-Level Risk Analysis</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Degree program risk concentration and high-risk student density</p>
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-surface-darkborder text-slate-400 uppercase font-semibold">
              <th className="pb-3 pl-2">Degree Program</th>
              <th className="pb-3 text-center">Monitored Cohort</th>
              <th className="pb-3 text-center">High Risk Count</th>
              <th className="pb-3 text-center">High Risk %</th>
              <th className="pb-3 text-right pr-2">Avg Risk Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {courses.map((item, index) => {
              const highPct = item.high_risk_pct || 0;
              const isHigh = highPct >= 40;
              return (
                <tr key={index} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 pl-2 font-semibold text-slate-900 dark:text-white">
                    {item.course}
                  </td>
                  <td className="py-3.5 text-center text-slate-600 dark:text-slate-300 font-medium">
                    {item.total}
                  </td>
                  <td className="py-3.5 text-center">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      item.high_risk_count > 0 
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {item.high_risk_count}
                    </span>
                  </td>
                  <td className="py-3.5 text-center">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                      isHigh 
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60' 
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60'
                    }`}>
                      {highPct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3.5 text-right pr-2 font-bold text-slate-900 dark:text-white">
                    {item.avg_risk || Math.round(highPct)} / 100
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
