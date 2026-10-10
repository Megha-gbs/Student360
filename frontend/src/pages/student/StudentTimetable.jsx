import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, Download, Sparkles } from 'lucide-react';
import TimetableWidget from '../../components/TimetableWidget';
import CalendarWidget from '../../components/CalendarWidget';
import { timetableApi } from '../../services/api';

export default function StudentTimetable() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    timetableApi
      .getTimetable()
      .then((data) => setSchedule(data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Class Timetable & Schedule
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Official semester class schedule, room allocations, and faculty office slots
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-surface-darkborder hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          Export Schedule
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <TimetableWidget schedule={schedule} title="Academic Weekly Timetable" />
        </div>
        <div className="lg:col-span-4 space-y-4">
          <CalendarWidget />
          <div className="card-panel p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Lecture Guidelines
            </h4>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
              <li>• Attendance is taken within the first 10 minutes of each lecture.</li>
              <li>• Practical lab sessions require approved safety attire in Computing Lab 2.</li>
              <li>• Studio sessions in Media Center 104 require digital keycard checkout.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
