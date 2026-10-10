import React, { useState, useEffect } from 'react';
import AttendanceOverview from '../../components/AttendanceOverview';
import { attendanceApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { CheckSquare, AlertTriangle, Download, Calendar } from 'lucide-react';

export default function StudentAttendance() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attendanceApi
      .getStudentAttendance(user?.id || 'S1001')
      .then((data) => setAttendance(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Attendance Record & Eligibility
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Subject-wise attendance tracking against the 75% examination eligibility requirement
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-surface-darkborder hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          Download Attendance Report
        </button>
      </div>

      <AttendanceOverview attendanceData={attendance} />
    </div>
  );
}
