import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Award, TrendingUp, BarChart3 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function AcademicPerformanceChart({ marksData }) {
  const { isDark } = useTheme();
  const [chartType, setChartType] = useState('gpa'); // 'gpa' or 'subjects'

  if (!marksData) return null;

  const { current_gpa = 3.0, cgpa = 3.1, subjects = [], semester_history = [] } = marksData;

  const gpaData = semester_history.map((s) => ({
    semester: `Sem ${s.semester}`,
    GPA: s.gpa,
    target: 3.5,
  }));

  const subjectData = subjects.map((sub) => ({
    name: sub.subject_code,
    fullName: sub.subject_name,
    Internal: sub.internal_assessment || 0,
    Midterm: sub.midterm_exam || 0,
    Final: sub.final_exam || 0,
    Total: sub.total_marks || 0,
    Grade: sub.grade,
  }));

  const gridColor = isDark ? '#232d45' : '#e2e8f0';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="card-panel p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-surface-darkborder">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Academic Performance Analytics
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cumulative Grade Point Average (CGPA) and Subject Score Distributions
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setChartType('gpa')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              chartType === 'gpa'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            GPA Trajectory
          </button>
          <button
            onClick={() => setChartType('subjects')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              chartType === 'subjects'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Subject Breakdown
          </button>
        </div>
      </div>

      {chartType === 'gpa' ? (
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={gpaData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="semester" stroke={textColor} fontSize={12} tickLine={false} />
              <YAxis domain={[0, 4.0]} stroke={textColor} fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#151b2b' : '#ffffff',
                  borderColor: isDark ? '#232d45' : '#e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  color: isDark ? '#ffffff' : '#000000',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line
                type="monotone"
                dataKey="GPA"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ fill: '#6366f1', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7 }}
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={subjectData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="name" stroke={textColor} fontSize={12} tickLine={false} />
              <YAxis domain={[0, 50]} stroke={textColor} fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#151b2b' : '#ffffff',
                  borderColor: isDark ? '#232d45' : '#e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  color: isDark ? '#ffffff' : '#000000',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="Internal" fill="#818cf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Midterm" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Final" fill="#4338ca" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
