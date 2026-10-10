import React, { useState, useEffect } from 'react';
import { Award, TrendingUp, CheckCircle, AlertCircle, Download, FileText } from 'lucide-react';
import AcademicPerformanceChart from '../../components/AcademicPerformanceChart';
import StatusBadge from '../../components/StatusBadge';
import { marksApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function StudentMarks() {
  const { user } = useAuth();
  const [marksData, setMarksData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    marksApi
      .getStudentMarks(user?.id || 'S1001')
      .then((data) => setMarksData(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user]);

  const subjects = marksData?.subjects || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Marks, Grades & CGPA History
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Internal assessments, midterm examinations, and cumulative academic progression
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-surface-darkborder hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          Download Transcript (Unofficial)
        </button>
      </div>

      {/* Analytics Chart */}
      <AcademicPerformanceChart marksData={marksData} />

      {/* Detailed Subject Marks Table */}
      <div className="card-panel p-5 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Course Marks & Grade Breakdown
        </h3>

        <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-surface-darkborder">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-surface-darkborder text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4 font-bold">Subject Code</th>
                <th className="py-3 px-4 font-bold">Course Title</th>
                <th className="py-3 px-4 font-bold text-center">Credits</th>
                <th className="py-3 px-4 font-bold text-center">Internal (40)</th>
                <th className="py-3 px-4 font-bold text-center">Midterm (40)</th>
                <th className="py-3 px-4 font-bold text-center">Final (20)</th>
                <th className="py-3 px-4 font-bold text-center">Total (100)</th>
                <th className="py-3 px-4 font-bold text-center">Grade</th>
                <th className="py-3 px-4 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {subjects.map((s) => (
                <tr
                  key={s.subject_code}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {s.subject_code}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                    {s.subject_name}
                  </td>
                  <td className="py-3.5 px-4 text-center font-medium text-slate-600 dark:text-slate-300">
                    {s.credits}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                    {s.internal_assessment}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                    {s.midterm_exam}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                    {s.final_exam !== null ? s.final_exam : 'Pending'}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-black text-indigo-600 dark:text-indigo-400">
                    {s.total_marks}
                  </td>
                  <td className="py-3.5 px-4 text-center font-black text-sm">
                    {s.grade}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <StatusBadge status={s.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
