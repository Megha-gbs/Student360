import React from 'react';
import PriorityQueue from '../PriorityQueue';
import { BrainCircuit, Info, Sparkles } from 'lucide-react';

export default function FacultyRetentionQueue() {
  return (
    <div className="space-y-6">
      {/* Faculty Retention Context Banner */}
      <div className="card-panel p-5 bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/30 text-purple-200 border border-purple-400/30 flex items-center gap-1">
              <BrainCircuit className="w-3.5 h-3.5" />
              Faculty Retention Command
            </span>
            <span className="text-xs font-mono text-indigo-200">
              Model: XGBoost v2 • Real UCI Features
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight mt-1">
            Student Early Warning & Academic Retention Priority Queue
          </h2>
          <p className="text-xs text-indigo-200 mt-0.5">
            Ranked by multi-factor dropout risk probability. Click any student profile to inspect SHAP drivers, Sem 1 to Sem 2 trajectories, and initiate tutoring interventions.
          </p>
        </div>
      </div>

      {/* Render the full Priority Queue component */}
      <PriorityQueue />
    </div>
  );
}
