import React from 'react';
import CohortInsights from '../CohortInsights';
import { BrainCircuit } from 'lucide-react';

export default function AdminCohortIntelligence() {
  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="card-panel p-5 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/30 text-purple-200 border border-purple-400/30 flex items-center gap-1">
              <BrainCircuit className="w-3.5 h-3.5" />
              Machine Learning Subsystem
            </span>
            <span className="text-xs font-mono text-purple-200">
              Global SHAP Aggregator • UCI Features
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight mt-1">
            Institutional Cohort Risk Analytics & Global SHAP Intelligence
          </h2>
          <p className="text-xs text-purple-200 mt-0.5">
            Aggregated institutional dropout probabilities, course-level risk concentrations, and global feature importance.
          </p>
        </div>
      </div>

      <CohortInsights />
    </div>
  );
}
