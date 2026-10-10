import React from 'react';

export default function StatusBadge({ status, type = 'default' }) {
  const getBadgeStyle = (val) => {
    const s = String(val || '').toLowerCase();

    if (s.includes('high') || s.includes('urgent') || s.includes('overdue') || s.includes('absent') || s.includes('fail') || s.includes('immediate')) {
      return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    }
    if (s.includes('medium') || s.includes('important') || s.includes('pending') || s.includes('partial') || s.includes('late') || s.includes('progress') || s.includes('needs improvement')) {
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    }
    if (s.includes('low') || s.includes('active') || s.includes('paid') || s.includes('present') || s.includes('passed') || s.includes('graded') || s.includes('submitted') || s.includes('standard') || s.includes('success')) {
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
    return 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getBadgeStyle(
        status
      )}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {status}
    </span>
  );
}
