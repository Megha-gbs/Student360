import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendType = 'neutral', // 'positive', 'negative', 'neutral'
  badge,
  badgeColor = 'indigo',
  colorScheme = 'indigo', // 'indigo', 'emerald', 'amber', 'rose', 'purple'
  onClick,
}) {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      icon: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-100 dark:border-indigo-900/30',
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      icon: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-100 dark:border-emerald-900/30',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      icon: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-100 dark:border-amber-900/30',
    },
    rose: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      icon: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-100 dark:border-rose-900/30',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      icon: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-100 dark:border-purple-900/30',
    },
  };

  const currentTheme = colorMap[colorScheme] || colorMap.indigo;

  return (
    <div
      onClick={onClick}
      className={`card-panel p-5 relative overflow-hidden group ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
            {title}
          </p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
            {value}
          </h3>
        </div>

        {Icon && (
          <div
            className={`p-3 rounded-2xl ${currentTheme.bg} ${currentTheme.icon} transition-transform group-hover:scale-110 flex-shrink-0`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 font-bold ${
                trendType === 'positive'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : trendType === 'negative'
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {trendType === 'positive' ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : trendType === 'negative' ? (
                <ArrowDownRight className="w-3.5 h-3.5" />
              ) : (
                <Minus className="w-3.5 h-3.5" />
              )}
              {trend}
            </span>
          )}
          {subtitle && (
            <span className="text-slate-500 dark:text-slate-400 truncate">
              {subtitle}
            </span>
          )}
        </div>

        {badge && (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              badgeColor === 'rose'
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                : badgeColor === 'amber'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                : badgeColor === 'emerald'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
            }`}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
