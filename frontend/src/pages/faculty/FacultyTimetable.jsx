import React, { useState, useEffect } from 'react';
import { Calendar, Download } from 'lucide-react';
import TimetableWidget from '../../components/TimetableWidget';
import CalendarWidget from '../../components/CalendarWidget';
import { timetableApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function FacultyTimetable() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    timetableApi
      .getTimetable({ faculty_id: user?.id || 'FAC-CS101' })
      .then((data) => setSchedule(data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Faculty Teaching Schedule
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Assigned lecture halls, laboratory periods, and designated office hours
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-surface-darkborder hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          Export Teaching Schedule
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <TimetableWidget schedule={schedule} title="My Course Lectures & Labs" />
        </div>
        <div className="lg:col-span-4 space-y-4">
          <CalendarWidget />
        </div>
      </div>
    </div>
  );
}
