import React, { useState, useEffect } from 'react';
import { Target, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { simulateOutcome } from '../services/api';

export default function OutcomePanel({ studentId, currentRisk = 74, interventionType = 'Academic Tutoring' }) {
  const [loading, setLoading] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const [error, setError] = useState(null);

  // Clear previous projection when student changes
  useEffect(() => {
    setOutcome(null);
    setError(null);
  }, [studentId]);

  const handleSimulateOutcome = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await simulateOutcome(studentId, {
        current_risk: currentRisk,
        intervention_type: interventionType,
      });
      if (res.success && res.data) {
        setOutcome(res.data);
      } else {
        setError(res.error || "Failed to simulate outcome.");
      }
    } catch (err) {
      setError(err.message || "Failed to simulate outcome.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-[4px] border border-[#D0D0D0] space-y-3">
      {/* Header with Mandatory Strict Label */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-[#D0D0D0] gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-1 bg-[#483698]/10 rounded-[3px] text-[#483698]">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-[#1A1A1A]">Simulated Outcome Projection</h3>
            <p className="text-[11px] text-[#767676]">
              Simulated demonstration outcome post-intervention; not real student improvement or causal guarantee.
            </p>
          </div>
        </div>
        <span className="px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider rounded-[2px] bg-[#483698]/10 text-[#483698] border border-[#483698]/30 self-start sm:self-auto">
          Simulated demonstration outcome
        </span>
      </div>

      {!outcome ? (
        <div className="py-4 text-center space-y-2">
          <p className="text-[12px] text-[#4A4A4A] max-w-md mx-auto">
            Simulate the expected risk trajectory reduction if the approved academic and financial interventions are completed.
          </p>
          <button
            onClick={handleSimulateOutcome}
            disabled={loading}
            className="px-4 py-1.5 bg-[#00338D] hover:bg-[#002B7A] text-white rounded-[3px] text-[12px] font-semibold transition-colors inline-flex items-center space-x-1.5 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Forecasting...</span>
              </>
            ) : (
              <>
                <Target className="w-3.5 h-3.5" />
                <span>Calculate Projected Outcome</span>
              </>
            )}
          </button>
          {error && (
            <div className="mt-2 p-2 bg-[#B91C1C]/10 text-[#B91C1C] border border-[#B91C1C]/30 rounded-[3px] text-[11.5px] flex items-center justify-center space-x-1.5 max-w-md mx-auto">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-[#F5F5F5] rounded-[3px] border border-[#D0D0D0]">
              <span className="text-[11.5px] font-semibold text-[#4A4A4A] block mb-0.5">Projected Dropout Risk</span>
              <span className="text-[20px] font-bold text-[#1A1A1A]">
                {outcome.projected_dropout_risk}
                <span className="text-[12px] font-normal text-[#767676]"> / 100</span>
              </span>
              <span className="text-[11px] text-[#1A7F37] font-bold block mt-0.5">
                &darr; Risk reduced by {currentRisk - outcome.projected_dropout_risk} pts
              </span>
            </div>

            <div className="p-3 bg-[#F5F5F5] rounded-[3px] border border-[#D0D0D0]">
              <span className="text-[11.5px] font-semibold text-[#4A4A4A] block mb-0.5">Projected Retention Rate</span>
              <span className="text-[20px] font-bold text-[#1A7F37]">
                {(outcome.projected_retention_probability * 100).toFixed(0)}%
              </span>
              <span className="text-[11px] text-[#4A4A4A] block mt-0.5">
                Degree continuity likelihood
              </span>
            </div>

            <div className="p-3 bg-[#F5F5F5] rounded-[3px] border border-[#D0D0D0]">
              <span className="text-[11.5px] font-semibold text-[#4A4A4A] block mb-0.5">Graduation Timeline</span>
              <span className="text-[12.5px] font-bold text-[#1A1A1A] block mt-0.5">
                {outcome.projected_graduation_timeline}
              </span>
              <span className="text-[11px] text-[#767676] block mt-0.5">
                Confidence: <strong className="text-[#1A1A1A]">{outcome.confidence || 'High'}</strong>
              </span>
            </div>
          </div>

          <div className="p-2.5 bg-[#F9F9F9] border border-[#D0D0D0] rounded-[3px] flex items-center justify-between text-[11.5px] text-[#767676]">
            <span>Badge: <code className="font-mono text-[#1A1A1A]">{outcome.projection_type || 'SIMULATED DEMONSTRATION OUTCOME'}</code></span>
            <button
              onClick={handleSimulateOutcome}
              disabled={loading}
              className="text-[11.5px] font-semibold text-[#00338D] hover:underline flex items-center gap-1 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Recalculating...' : 'Re-calculate Projection'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
