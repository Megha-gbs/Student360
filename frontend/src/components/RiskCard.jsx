import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, TrendingUp, TrendingDown, Minus, Cpu } from 'lucide-react';

export default function RiskCard({ riskScore = 0, riskLevel = 'Low', dropoutProbability = 0, trend = 'Stable', modelVersion = 'student360_xgb_v2_real_features' }) {
  // Determine color theme based on risk level
  const getTheme = () => {
    switch (riskLevel?.toLowerCase()) {
      case 'high':
        return {
          bg: 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60',
          text: 'text-rose-700 dark:text-rose-400',
          badge: 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800',
          bar: 'bg-rose-500',
          icon: AlertTriangle,
          iconColor: 'text-rose-600 dark:text-rose-400',
          desc: 'High dropout risk. Urgent multi-tier academic and advisor intervention needed.'
        };
      case 'medium':
        return {
          bg: 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60',
          text: 'text-amber-700 dark:text-amber-400',
          badge: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
          bar: 'bg-amber-500',
          icon: AlertCircle,
          iconColor: 'text-amber-600 dark:text-amber-400',
          desc: 'Moderate risk. Academic progress or financial holds require monitoring.'
        };
      default:
        return {
          bg: 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60',
          text: 'text-emerald-700 dark:text-emerald-400',
          badge: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
          bar: 'bg-emerald-500',
          icon: CheckCircle2,
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          desc: 'Low risk. Student is making consistent academic progress toward graduation.'
        };
    }
  };

  const theme = getTheme();
  const Icon = theme.icon;

  const getTrendIcon = () => {
    if (trend?.toLowerCase().includes('deteriorat')) {
      return <span className="inline-flex items-center text-rose-600 dark:text-rose-400 font-medium text-xs"><TrendingUp className="w-3.5 h-3.5 mr-1" /> Deteriorating</span>;
    }
    if (trend?.toLowerCase().includes('improv')) {
      return <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-medium text-xs"><TrendingDown className="w-3.5 h-3.5 mr-1" /> Improving</span>;
    }
    return <span className="inline-flex items-center text-slate-600 dark:text-slate-400 font-medium text-xs"><Minus className="w-3.5 h-3.5 mr-1" /> Stable</span>;
  };

  return (
    <div className={`p-6 rounded-2xl border shadow-sm ${theme.bg} transition-all`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Dropout Risk Assessment</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${theme.badge} flex items-center space-x-1`}>
              <Icon className="w-3.5 h-3.5 mr-1" />
              <span>{riskLevel} Risk</span>
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-3">
            <span className={`text-4xl font-extrabold tracking-tight ${theme.text}`}>
              {riskScore}
              <span className="text-xl font-normal text-slate-400">/100</span>
            </span>
            <div className="text-xs text-slate-600 dark:text-slate-300">
              <div>Dropout Probability: <span className="font-semibold text-slate-900 dark:text-white">{(dropoutProbability * 100).toFixed(1)}%</span></div>
              <div className="mt-0.5">Momentum Trend: {getTrendIcon()}</div>
            </div>
          </div>
        </div>

        {/* Circular indicator or Icon Badge */}
        <div className={`w-12 h-12 rounded-xl bg-white dark:bg-surface-darkcard shadow-sm border border-slate-200/60 dark:border-surface-darkborder flex items-center justify-center ${theme.iconColor}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="w-full bg-slate-200/70 dark:bg-slate-700/60 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full ${theme.bar} transition-all duration-700`}
            style={{ width: `${Math.min(100, Math.max(0, riskScore))}%` }}
          />
        </div>
      </div>

      {/* Description & Model Tag */}
      <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-surface-darkborder flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
        <span>{theme.desc}</span>
        <span className="inline-flex items-center text-[11px] text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-surface-darkborder">
          <Cpu className="w-3 h-3 mr-1 text-slate-400" />
          {modelVersion}
        </span>
      </div>
    </div>
  );
}
