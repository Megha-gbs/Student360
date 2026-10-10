import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, Search, ShieldAlert, Award } from 'lucide-react';

export default function AttendanceOverview({ attendanceData, onFilterSubject }) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'low', 'good'

  if (!attendanceData) {
    return <div className="p-8 text-center text-slate-400">Loading attendance data...</div>;
  }

  const { overall_percentage = 0, total_attended = 0, total_classes = 0, subjects = [], low_attendance_warning = false } = attendanceData;

  const filteredSubjects = subjects.filter((s) => {
    const matchesSearch = s.subject_name.toLowerCase().includes(search.toLowerCase()) ||
                          s.subject_code.toLowerCase().includes(search.toLowerCase());
    if (filterType === 'low') return matchesSearch && s.is_low_attendance;
    if (filterType === 'good') return matchesSearch && !s.is_low_attendance;
    return matchesSearch;
  });

  return (
    <div className="card-panel p-5 space-y-5">
      {/* Warning banner if low attendance */}
      {low_attendance_warning && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 rounded-xl flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
              Low Attendance Warning (Institutional Threshold: 75%)
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
              Your attendance in one or more subjects is currently below the mandatory 75% requirement. Failure to remediate before final semester evaluations may disqualify examination eligibility.
            </p>
          </div>
        </div>
      )}

      {/* Top summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-surface-darkborder">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Overall Attendance</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-black ${overall_percentage < 75 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {overall_percentage}%
            </span>
            <span className="text-xs text-slate-400">Target: 75%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${overall_percentage < 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(overall_percentage, 100)}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-surface-darkborder">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Total Sessions Attended</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {total_attended}
            </span>
            <span className="text-xs text-slate-400">out of {total_classes} total</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5">
            {total_classes - total_attended} absent sessions recorded
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-surface-darkborder">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Courses at Risk</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-black ${subjects.filter(s => s.is_low_attendance).length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {subjects.filter(s => s.is_low_attendance).length}
            </span>
            <span className="text-xs text-slate-400">courses &lt; 75%</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5">
            {subjects.length - subjects.filter(s => s.is_low_attendance).length} courses in good standing
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search subjects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-surface-darkborder focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              filterType === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            All Subjects ({subjects.length})
          </button>
          <button
            onClick={() => setFilterType('low')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              filterType === 'low'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Below 75% ({subjects.filter((s) => s.is_low_attendance).length})
          </button>
        </div>
      </div>

      {/* Subject-Wise Attendance Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-surface-darkborder">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-surface-darkborder text-slate-500 dark:text-slate-400">
              <th className="py-3 px-4 font-bold">Subject Code</th>
              <th className="py-3 px-4 font-bold">Course Title</th>
              <th className="py-3 px-4 font-bold text-center">Attended / Total</th>
              <th className="py-3 px-4 font-bold">Percentage</th>
              <th className="py-3 px-4 font-bold text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredSubjects.map((sub) => {
              const pct = sub.percentage;
              const isLow = sub.is_low_attendance;

              return (
                <tr
                  key={sub.subject_code}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {sub.subject_code}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                    {sub.subject_name}
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-700 dark:text-slate-300 font-medium">
                    {sub.attended} / {sub.total}
                  </td>
                  <td className="py-3.5 px-4 min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            pct >= 75 ? 'bg-emerald-500' : pct >= 65 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <span className="font-bold font-mono text-[11px] min-w-[36px] text-right">
                        {pct}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {isLow ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        <AlertTriangle className="w-3 h-3" />
                        Low Attendance
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle className="w-3 h-3" />
                        Eligible
                      </span>
                    )}
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
