import React, { useState, useEffect } from 'react';
import { CheckSquare, Download, Filter, Building2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { attendanceApi } from '../../services/api';

export default function AdminAttendanceReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attendanceApi
      .getReports()
      .then((data) => setReports(data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleExportCSV = () => {
    let csv = 'Department,Semester,Total Students,Average Attendance %,Below Threshold Count\n';
    reports.forEach((r) => {
      csv += `"${r.department}",${r.semester},${r.total_students},${r.avg_attendance},${r.below_threshold_count}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance_institutional_report.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Institutional Attendance Reports
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Audit division-level compliance with examination eligibility standards (75% threshold)
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          Export Report (CSV)
        </button>
      </div>

      <div className="card-panel p-5 overflow-x-auto space-y-4">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-surface-darkborder text-slate-500 dark:text-slate-400">
              <th className="py-3 px-4 font-bold">Academic Department</th>
              <th className="py-3 px-4 font-bold text-center">Semester</th>
              <th className="py-3 px-4 font-bold text-center">Enrolled Students</th>
              <th className="py-3 px-4 font-bold text-center">Average Attendance</th>
              <th className="py-3 px-4 font-bold text-center">Students Below 75%</th>
              <th className="py-3 px-4 font-bold text-center">Division Standing</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {reports.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                  {r.department}
                </td>
                <td className="py-3.5 px-4 text-center font-medium text-slate-600 dark:text-slate-300">
                  Sem {r.semester}
                </td>
                <td className="py-3.5 px-4 text-center font-bold font-mono text-slate-800 dark:text-slate-200">
                  {r.total_students}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span
                    className={`font-mono font-bold text-xs ${
                      r.avg_attendance >= 85
                        ? 'text-emerald-600'
                        : r.avg_attendance >= 75
                        ? 'text-indigo-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {r.avg_attendance}%
                  </span>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      r.below_threshold_count > 5
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {r.below_threshold_count} students
                  </span>
                </td>
                <td className="py-3.5 px-4 text-center">
                  {r.avg_attendance >= 80 ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> High Compliance
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-600 font-bold text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5" /> Remediation Alert
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
