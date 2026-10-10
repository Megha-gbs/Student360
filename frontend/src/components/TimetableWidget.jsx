import React, { useState } from 'react';
import { Clock, MapPin, User, Calendar as CalendarIcon, CheckCircle2, AlertCircle } from 'lucide-react';

export default function TimetableWidget({ schedule = [], title = "Today's Class Schedule" }) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const [selectedDay, setSelectedDay] = useState(
    days.includes(todayName) ? todayName : 'Monday'
  );
  const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'weekly'

  const filteredClasses = schedule.filter(
    (c) => c.day?.toLowerCase() === selectedDay.toLowerCase()
  );

  filteredClasses.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

  return (
    <div className="card-panel p-5">
      {/* Header with Day Tabs & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-surface-darkborder">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Synchronized with institutional master schedule
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('daily')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'daily'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Daily View
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'weekly'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Full Week Grid
          </button>
        </div>
      </div>

      {viewMode === 'daily' ? (
        <>
          {/* Day Selector Pills */}
          <div className="flex items-center gap-2 my-4 overflow-x-auto pb-1">
            {days.map((day) => {
              const count = schedule.filter((c) => c.day?.toLowerCase() === day.toLowerCase()).length;
              const isSelected = selectedDay.toLowerCase() === day.toLowerCase();

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{day.slice(0, 3)}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isSelected
                        ? 'bg-white/25 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Classes Chronological List */}
          {filteredClasses.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No classes scheduled for {selectedDay}
              </p>
              <p className="text-xs mt-1">Free study day or scheduled campus project time.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredClasses.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-surface-darkborder hover:border-indigo-300 dark:hover:border-indigo-600 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-mono font-bold text-xs flex flex-col items-center justify-center min-w-[70px] flex-shrink-0">
                      <span>{item.start_time}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">to</span>
                      <span>{item.end_time}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
                          {item.subject_code}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {item.subject_name}
                        </h4>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.faculty_name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {item.room}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Confirmed Room
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Full Week Grid View */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-4">
          {days.map((day) => {
            const dayClasses = schedule.filter(
              (c) => c.day?.toLowerCase() === day.toLowerCase()
            );
            dayClasses.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

            return (
              <div
                key={day}
                className="rounded-2xl p-3 bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200/70 dark:border-surface-darkborder flex flex-col"
              >
                <div className="pb-2 border-b border-slate-200 dark:border-surface-darkborder flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {day}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {dayClasses.length}
                  </span>
                </div>

                <div className="mt-2 space-y-2 flex-1">
                  {dayClasses.length === 0 ? (
                    <p className="text-[11px] text-slate-400 py-4 text-center">No lectures</p>
                  ) : (
                    dayClasses.map((c, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-surface-darkborder text-xs shadow-subtle"
                      >
                        <p className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                          {c.start_time} - {c.end_time}
                        </p>
                        <p className="font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                          {c.subject_name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {c.room}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
