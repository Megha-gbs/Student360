import React, { useState, useEffect } from 'react';
import { UserCheck, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { intervene } from '../services/api';

export default function InterventionPanel({ studentId, recommendedIntervention, onInterventionApproved }) {
  const [advisorName, setAdvisorName] = useState('Dr. Elena Rostova (Senior Academic Advisor)');
  const [notes, setNotes] = useState('Reviewed Sem 1 & Sem 2 credit progression and financial holds. Recommended tailored tutoring and financial aid meeting.');
  const [submitting, setSubmitting] = useState(false);
  const [approvedState, setApprovedState] = useState(null);

  // Reset approved state when viewing a different student
  useEffect(() => {
    setApprovedState(null);
    if (recommendedIntervention?.description) {
      setNotes(`Reviewed Sem 1 & Sem 2 performance for ${studentId}. ${recommendedIntervention.description}`);
    }
  }, [studentId, recommendedIntervention]);

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      const payload = {
        student_id: studentId,
        action_type: recommendedIntervention?.action_type || 'Academic Retention Plan',
        advisor: advisorName,
        notes: notes,
        timestamp: new Date().toISOString()
      };
      const res = await intervene(payload);
      if (res.success) {
        setApprovedState(res.data);
        if (onInterventionApproved) {
          onInterventionApproved(res.data);
        }
      }
    } catch (err) {
      console.error("Intervention submission failed", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-surface-darkcard p-6 rounded-2xl border border-slate-200 dark:border-surface-darkborder shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-surface-darkborder">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg text-emerald-600 dark:text-emerald-400">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recommended Intervention & Human Approval</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">AI proposes tailored actions; human advisor authorization is required</p>
          </div>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
          approvedState 
            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' 
            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
        }`}>
          {approvedState ? 'Authorized by Advisor' : 'Pending Human Approval'}
        </span>
      </div>

      {/* AI Recommendation Draft */}
      <div className="mt-5 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-surface-darkborder">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block mb-1">
              AI-Proposed Intervention Draft
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {recommendedIntervention?.action_type || 'Academic Progression Support & Financial Consultation'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              {recommendedIntervention?.description || 'Coordinate academic tutoring for unapproved units and schedule bursar review.'}
            </p>
          </div>
          <span className="px-2 py-0.5 text-[11px] font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 rounded border border-rose-200 dark:border-rose-900/60 self-start">
            Priority: {recommendedIntervention?.priority || 'Immediate'}
          </span>
        </div>
      </div>

      {/* Human In The Loop Approval Form */}
      <div className="mt-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Assigned Human Advisor
          </label>
          <input
            type="text"
            value={advisorName}
            onChange={(e) => setAdvisorName(e.target.value)}
            disabled={approvedState !== null}
            className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-surface-darkborder rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-70 text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Advisor Clinical Notes & Custom Directives
          </label>
          <textarea
            rows="3"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={approvedState !== null}
            className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-surface-darkborder rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-70 text-slate-900 dark:text-white"
            placeholder="Add specific instructions or personalized accommodations..."
          />
        </div>

        {/* Action Button / Approval Confirmation */}
        {!approvedState ? (
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleApprove}
              disabled={submitting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{submitting ? 'Authorizing...' : 'Authorize & Launch Intervention'}</span>
            </button>
          </div>
        ) : (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>
              Intervention authorized by <strong>{approvedState.advisor}</strong> on {new Date(approvedState.timestamp).toLocaleDateString()}. Human approval registered.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
