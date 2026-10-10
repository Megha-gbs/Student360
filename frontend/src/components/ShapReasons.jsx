import React from 'react';
import { ArrowUpRight, ArrowDownRight, Sparkles, HelpCircle } from 'lucide-react';

export default function ShapReasons({ reasons = [] }) {
  if (!reasons || reasons.length === 0) {
    return (
      <div className="bg-white dark:bg-surface-darkcard p-6 rounded-2xl border border-slate-200 dark:border-surface-darkborder shadow-sm text-center py-8">
        <HelpCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">SHAP Explanations Unavailable</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">No feature impact factors provided for this student record.</p>
      </div>
    );
  }

  // Display top 3-5 reasons
  const displayReasons = reasons.slice(0, 5);

  const getImpactBadge = (impact) => {
    switch (impact?.toLowerCase()) {
      case 'high':
        return 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'medium':
        return 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="bg-white dark:bg-surface-darkcard p-6 rounded-2xl border border-slate-200 dark:border-surface-darkborder shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-surface-darkborder">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Why? — Key Risk Drivers (SHAP)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Local model feature attribution explaining this student's risk profile</p>
          </div>
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
          Top {displayReasons.length} Drivers
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {displayReasons.map((item, index) => {
          const isIncrease = item.direction === 'increases_risk';
          return (
            <div
              key={index}
              className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isIncrease
                  ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40 hover:border-rose-200'
                  : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40 hover:border-emerald-200'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`mt-0.5 p-1.5 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isIncrease 
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400' 
                      : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {isIncrease ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{item.feature}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Observed Value: <span className="font-medium text-slate-700 dark:text-slate-200">{item.value}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-auto">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${getImpactBadge(item.impact)}`}>
                  {item.impact?.toUpperCase()} IMPACT
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    isIncrease 
                      ? 'text-rose-700 dark:text-rose-300 bg-rose-100/60 dark:bg-rose-950/60' 
                      : 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/60'
                  }`}
                >
                  {isIncrease ? '+ Increases Risk' : '- Decreases Risk'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
