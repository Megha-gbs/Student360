import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
  TrendingDown,
  Info,
} from 'lucide-react';
import { getStudent } from '../../services/api';
import RiskCard from '../../components/RiskCard';
import RiskTrajectory from '../../components/RiskTrajectory';
import ShapReasons from '../../components/ShapReasons';
import WhatIfPanel from '../../components/WhatIfPanel';
import { useAuth } from '../../context/AuthContext';

export default function StudentMLRetention() {
  const { user } = useAuth();
  const studentId = user?.id || 'S1001';
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStudent(studentId);
      if (res.success && res.data) {
        setStudent(res.data);
      } else {
        setError(`Unable to retrieve ML model profile for ${studentId}.`);
      }
    } catch (err) {
      setError(err.message || 'Error loading model insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [studentId]);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
        <h3 className="text-base font-bold text-slate-800 dark:text-white">
          Evaluating XGBoost Risk Engine & SHAP Drivers...
        </h3>
        <p className="text-xs text-slate-500">
          Calculating Sem 1 to Sem 2 curricular trajectory and explainability factors
        </p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="card-panel p-8 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">
          Model Insights Unavailable
        </h3>
        <p className="text-xs text-slate-500">{error || 'Could not load student data.'}</p>
        <button
          onClick={fetchProfile}
          className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
        >
          Retry Evaluation
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
              <BrainCircuit className="w-3 h-3" />
              Machine Learning Subsystem
            </span>
            <span className="text-xs font-mono text-slate-400">
              Model: XGBoost v2 (UCI Curricular Benchmark)
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Academic Retention & Trajectory Intelligence
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Explainable AI insights diagnosing curricular momentum and dropout risk factors
          </p>
        </div>

        <button
          onClick={fetchProfile}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-surface-darkborder hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Re-evaluate Model
        </button>
      </div>

      {/* Ethical AI Disclaimer */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
          <span className="font-bold">Transparent Explainable Retention Model:</span> This diagnostic index is computed from official curricular units (Sem 1 vs Sem 2 approved units, evaluations, and admission indicators). Risk probability represents early warning priority for faculty mentoring, not an evaluation of student ability or success score.
        </div>
      </div>

      {/* Section A: Live Risk & Trajectory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <RiskCard
            riskScore={student.risk_score}
            riskLevel={student.risk_level}
            dropoutProbability={student.dropout_probability}
            trend={student.trend}
            modelVersion={student.model_version || 'student360_xgb_v2_real_features'}
          />
        </div>
        <div className="lg:col-span-8">
          <RiskTrajectory
            trajectory={student.trajectory}
          />
        </div>
      </div>

      {/* Section B: Top SHAP Reasons */}
      <div className="bg-white border border-[#D0D0D0] rounded p-6 shadow-sm">
        <ShapReasons reasons={student.top_reasons} />
      </div>

      {/* Section C: What-If Simulation Engine */}
      <div className="bg-white border border-[#D0D0D0] rounded p-6 shadow-sm">
        <WhatIfPanel
          studentId={student.student_id}
          originalRisk={student.risk_score}
          studentData={student}
        />
      </div>
    </div>
  );
}
