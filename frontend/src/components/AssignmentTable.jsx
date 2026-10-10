import React, { useState } from 'react';
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  Upload,
  AlertCircle,
  X,
  FileCheck,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import { assignmentsApi } from '../services/api';

export default function AssignmentTable({ assignments = [], studentId, onAssignmentUpdated }) {
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'submitted', 'graded'
  const [submittingAssignment, setSubmittingAssignment] = useState(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const filtered = assignments.filter((a) => {
    const mySub = a.my_submission;
    if (filter === 'pending') return !mySub;
    if (filter === 'submitted') return mySub && mySub.status === 'Submitted';
    if (filter === 'graded') return mySub && mySub.status === 'Graded';
    return true;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!submissionNotes.trim() && !fileName) {
      setErrorMsg('Please enter submission details or attach a file.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await assignmentsApi.submitAssignment(submittingAssignment.id, {
        student_id: studentId || 'S1001',
        content: submissionNotes || 'Student assignment package submitted.',
        file_name: fileName || 'project_submission.pdf',
      });
      setSubmittingAssignment(null);
      setSubmissionNotes('');
      setFileName('');
      if (onAssignmentUpdated) onAssignmentUpdated();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to submit assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card-panel p-5 space-y-4">
      {/* Header and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-surface-darkborder">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Course Assignments & Deliverables
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Submit coursework and review faculty assessment scores
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              filter === 'all'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            All ({assignments.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              filter === 'pending'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('submitted')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              filter === 'submitted'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Submitted
          </button>
        </div>
      </div>

      {/* Assignment Cards List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <FileCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold">No assignments found in this view</p>
          </div>
        ) : (
          filtered.map((item) => {
            const mySub = item.my_submission;
            const isSubmitted = !!mySub;
            const isGraded = mySub?.status === 'Graded';

            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-surface-darkborder hover:border-indigo-300 dark:hover:border-indigo-600 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                      {item.subject_code}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </h4>
                    <StatusBadge
                      status={isGraded ? 'Graded' : isSubmitted ? 'Submitted' : 'Pending'}
                    />
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Instructor: {item.faculty_name}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      Due: {item.due_date} {item.due_time}
                    </span>
                    <span>•</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      Max: {item.max_marks} pts
                    </span>
                  </div>

                  {/* Feedback if Graded */}
                  {isGraded && mySub.feedback && (
                    <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200">
                      <span className="font-bold">Faculty Feedback:</span> {mySub.feedback}
                    </div>
                  )}
                </div>

                {/* Action button */}
                <div className="flex items-center gap-3 self-end md:self-auto flex-shrink-0">
                  {isGraded ? (
                    <div className="text-right">
                      <span className="text-xs text-slate-400">Grade Earned:</span>
                      <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                        {mySub.grade} / {item.max_marks}
                      </p>
                    </div>
                  ) : isSubmitted ? (
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="w-4 h-4" />
                        Submitted ({mySub.submitted_at?.slice(0, 10)})
                      </span>
                      <button
                        onClick={() => setSubmittingAssignment(item)}
                        className="block mt-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Resubmit Work
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSubmittingAssignment(item)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Submit Work
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Submission Modal Dialog */}
      {submittingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-darkpanel w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-surface-darkborder p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-surface-darkborder pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Submit Deliverable
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {submittingAssignment.subject_code} — {submittingAssignment.title}
                </p>
              </div>
              <button
                onClick={() => setSubmittingAssignment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Submission Notes or Online Repository Link
                </label>
                <textarea
                  rows={3}
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Enter project link, execution summary, or methodology comments..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Attachment Filename (Simulated Upload)
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g. data_structures_final_assignment.zip"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  {errorMsg}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSubmittingAssignment(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-60 flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Uploading...' : 'Confirm Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
