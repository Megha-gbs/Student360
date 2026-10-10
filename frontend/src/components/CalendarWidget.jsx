import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export default function CalendarWidget({ onSelectDate, selectedDate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const totalDays = daysInMonth(currentMonth);
  const startDay = firstDayOfMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const daysArr = Array.from({ length: totalDays }, (_, i) => i + 1);
  const blanks = Array.from({ length: startDay }, (_, i) => i);

  return (
    <div className="card-panel p-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-surface-darkborder">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <CalendarIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          {monthName}
        </h4>
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mt-3 text-center text-[10px] font-bold text-slate-400 uppercase">
        <span>Su</span>
        <span>Mo</span>
        <span>Tu</span>
        <span>We</span>
        <span>Th</span>
        <span>Fr</span>
        <span>Sa</span>
      </div>

      <div className="grid grid-cols-7 gap-1 mt-1 text-xs">
        {blanks.map((b) => (
          <div key={`blank-${b}`} className="p-1.5" />
        ))}
        {daysArr.map((d) => {
          const isToday =
            d === new Date().getDate() &&
            currentMonth.getMonth() === new Date().getMonth() &&
            currentMonth.getFullYear() === new Date().getFullYear();

          return (
            <button
              key={d}
              onClick={() => onSelectDate && onSelectDate(d)}
              className={`p-1.5 rounded-xl font-medium transition-all ${
                isToday
                  ? 'bg-indigo-600 text-white font-bold shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600'
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}
