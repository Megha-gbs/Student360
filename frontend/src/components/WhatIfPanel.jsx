import React, { useState, useEffect } from 'react';
import { Sliders, RefreshCw, ArrowRight, AlertCircle, ArrowDown, Info, ShieldAlert } from 'lucide-react';
import { simulateStudent } from '../services/api';

export default function WhatIfPanel({ studentId, originalRisk = 74, studentData, onSimulationComplete }) {
  // Baseline real UCI features computed from current studentData
  const getBaseline = () => ({
    "Tuition fees up to date": studentData?.tuition_fees_up_to_date ?? 1,
    "Debtor": studentData?.debtor ?? 0,
    "Scholarship holder": studentData?.scholarship_holder ?? 0,
    "Curricular units 2nd sem (enrolled)": studentData?.trajectory?.sem2?.enrolled ?? 6,
    "Curricular units 2nd sem (approved)": studentData?.trajectory?.sem2?.approved ?? 0,
    "Curricular units 2nd sem (grade)": Number(studentData?.trajectory?.sem2?.grade ?? 0),
  });

  const [simulatedFeatures, setSimulatedFeatures] = useState(getBaseline());
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Synchronize when studentId or studentData changes to prevent stale data
  useEffect(() => {
    const updated = getBaseline();
    setSimulatedFeatures(updated);
    setSimulationResult(null);
    setError(null);
  }, [studentId, studentData]);

  const handleToggle = (field) => {
    setSimulatedFeatures(prev => ({
      ...prev,
      [field]: prev[field] === 1 ? 0 : 1
    }));
  };

  const handleNumberChange = (field, value) => {
    setSimulatedFeatures(prev => ({
      ...prev,
      [field]: Number(value)
    }));
  };

  const handleReset = () => {
    setSimulatedFeatures(getBaseline());
    setSimulationResult(null);
    setError(null);
  };

  const handleRunSimulation = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        student_id: studentId,
        original_risk: originalRisk,
        baseline_features: getBaseline(),
        features: simulatedFeatures
      };
      const res = await simulateStudent(payload);
      if (res.success && res.data) {
        setSimulationResult(res.data);
        if (onSimulationComplete) {
          onSimulationComplete(res.data);
        }
      } else {
        setError(res.error || "Simulation could not be calculated.");
      }
    } catch (err) {
      setError(err.message || "Failed to simulate outcome.");
    } finally {
      setLoading(false);
    }
  };

  const riskDiff = simulationResult ? simulationResult.simulated_risk - simulationResult.original_risk : 0;

  return (
    <div className="bg-white dark:bg-surface-darkcard p-6 rounded-2xl border border-slate-200 dark:border-surface-darkborder shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-surface-darkborder gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg text-indigo-600 dark:text-indigo-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">What-If Counterfactual Simulation</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Test hypothetical academic and financial scenarios against the frozen XGBoost model</p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center space-x-1 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset to Baseline</span>
        </button>
      </div>

      {/* Mandatory Scientific Disclaimer Banner */}
      <div className="p-3 bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-300">
        <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Model-based What-If simulation — not a causal guarantee.</span>
          <span className="text-[11px] text-amber-800 dark:text-amber-400/90 leading-relaxed block mt-0.5">
            Simulations evaluate model predictions under modified feature inputs. They do not constitute experimental proof or a guarantee that real-world intervention will produce this exact risk change.
          </span>
        </div>
      </div>

      {/* Feature Adjustment Form — Real UCI Features ONLY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Toggle 1: Tuition fees up to date */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-surface-darkborder flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-slate-900 dark:text-white block">Tuition fees up to date</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Is all tuition paid without financial holds?</span>
          </div>
          <button
            type="button"
            onClick={() => handleToggle("Tuition fees up to date")}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              simulatedFeatures["Tuition fees up to date"] === 1 ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                simulatedFeatures["Tuition fees up to date"] === 1 ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Toggle 2: Debtor */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-surface-darkborder flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-slate-900 dark:text-white block">Debtor Status</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Active university debt status</span>
          </div>
          <button
            type="button"
            onClick={() => handleToggle("Debtor")}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              simulatedFeatures["Debtor"] === 1 ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                simulatedFeatures["Debtor"] === 1 ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Toggle 3: Scholarship holder */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-surface-darkborder flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-slate-900 dark:text-white block">Scholarship Holder</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Awarded institutional merit grant</span>
          </div>
          <button
            type="button"
            onClick={() => handleToggle("Scholarship holder")}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              simulatedFeatures["Scholarship holder"] === 1 ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                simulatedFeatures["Scholarship holder"] === 1 ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Slider 1: Sem 2 Approved Units */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-surface-darkborder">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">Sem 2 Approved Units</span>
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 rounded">
              {simulatedFeatures["Curricular units 2nd sem (approved)"]} units
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={simulatedFeatures["Curricular units 2nd sem (approved)"]}
            onChange={(e) => handleNumberChange("Curricular units 2nd sem (approved)", e.target.value)}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>

        {/* Slider 2: Sem 2 Grade */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-surface-darkborder">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">Sem 2 Grade (/20 Scale)</span>
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 rounded">
              {Number(simulatedFeatures["Curricular units 2nd sem (grade)"]).toFixed(1)} / 20
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="20"
            step="0.5"
            value={simulatedFeatures["Curricular units 2nd sem (grade)"]}
            onChange={(e) => handleNumberChange("Curricular units 2nd sem (grade)", e.target.value)}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>

        {/* Slider 3: Sem 2 Enrolled Units */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-surface-darkborder">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">Sem 2 Enrolled Units</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
              {simulatedFeatures["Curricular units 2nd sem (enrolled)"]} units
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="12"
            step="1"
            value={simulatedFeatures["Curricular units 2nd sem (enrolled)"]}
            onChange={(e) => handleNumberChange("Curricular units 2nd sem (enrolled)", e.target.value)}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>
      </div>

      {/* Run Simulation Action Button */}
      <div className="pt-2 flex items-center justify-between">
        <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
          Model: student360_xgb_v2_real_features
        </span>
        <button
          onClick={handleRunSimulation}
          disabled={loading}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/25 transition-all flex items-center space-x-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Simulating...</span>
            </>
          ) : (
            <>
              <span>Run Counterfactual Simulation</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Simulation Result Comparison Box */}
      {simulationResult && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200 dark:border-indigo-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-4">
              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Baseline Risk</span>
                <span className="text-2xl font-bold text-slate-700 dark:text-slate-200">{simulationResult.original_risk}</span>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400" />
              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Simulated Risk</span>
                <span className={`text-2xl font-extrabold ${
                  simulationResult.simulated_risk < 35 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : simulationResult.simulated_risk < 65 
                    ? 'text-amber-600 dark:text-amber-400' 
                    : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {simulationResult.simulated_risk}
                </span>
              </div>
              <div className="pl-4 border-l border-indigo-200 dark:border-indigo-800">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Risk Reduction</span>
                <span className={`text-sm font-bold flex items-center ${riskDiff <= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                  {riskDiff <= 0 ? <ArrowDown className="w-4 h-4 mr-0.5" /> : '+'}{riskDiff} pts
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 bg-white/90 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-lg border border-indigo-200 dark:border-indigo-800 shadow-sm">
                {simulationResult.simulation_type || 'model_based_counterfactual'}
              </span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
