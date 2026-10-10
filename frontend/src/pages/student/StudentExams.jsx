import React, { useState, useEffect } from 'react';
import { Clock, Calendar, MapPin, AlertCircle, Download, FileCheck, CheckCircle2 } from 'lucide-react';
import { examinationsApi } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';

export default function StudentExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    examinationsApi
      .listExaminations()
      .then((data) => setExams(data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Examination Schedule & Hall Tickets
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Fall Semester Midterm and Practical Studio venues and reporting timings
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          Download Hall Ticket (PDF)
        </button>
      </div>

      {/* Exam Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {exams.map((ex) => (
          <div
            key={ex.id}
            className="card-panel p-5 space-y-4 hover:border-indigo-400 transition-all flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  {ex.subject_code}
                </span>
                <StatusBadge status={ex.exam_type} />
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                {ex.title}
              </h3>

              <div className="space-y-1.5 pt-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span className="font-bold">{ex.date}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span>{ex.start_time} — {ex.end_time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-500" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{ex.venue}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-surface-darkborder flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Semester {ex.semester}</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Seat Confirmed
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Guidelines Box */}
      <div className="card-panel p-5 bg-slate-50/80 dark:bg-slate-800/40 space-y-2">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          Examination Hall Regulations
        </h4>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Students must carry physical College ID cards and printed Hall Tickets to all testing venues. Entry is barred 15 minutes post commencement. Electronic devices including smart watches must be stowed in hall lockers.
        </p>
      </div>
    </div>
  );
}
