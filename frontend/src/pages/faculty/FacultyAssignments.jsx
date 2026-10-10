import React, { useState, useEffect } from 'react';
import {
  Plus,
  Calendar,
  Check,
  Award,
  X,
  AlertCircle,
  FileText,
  Clock,
  User,
} from 'lucide-react';
import { assignmentsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function FacultyAssignments() {
  const { user } = useAuth();
  const facultyId = user?.id || 'FAC-CS101';

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [gradingSub, setGradingSub] = useState(null);
  const [gradeVal, setGradeVal] = useState('');
  const [feedbackVal, setFeedbackVal] = useState('');

  // Create form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSubCode, setNewSubCode] = useState('CS301');
  const [newSubName, setNewSubName] = useState('Data Structures & Algorithms');
  const [newClassId, setNewClassId] = useState('CS-Sem2');
  const [newDueDate, setNewDueDate] = useState('2026-10-30');
  const [newDueTime, setNewDueTime] = useState('23:59');
  const [newMaxMarks, setNewMaxMarks] = useState(50);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const data = await assignmentsApi.listAssignments({ faculty_id: facultyId });
      setAssignments(data || []);
    } catch (e) {
      console.error('Failed to load assignments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [facultyId]);

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) {
      setStatusMsg({ text: 'Please fill in all required fields.', type: 'error' });
      return;
    }

    setSubmitting(true);
    setStatusMsg({ text: '', type: '' });

    try {
      await assignmentsApi.createAssignment({
        title: newTitle.trim(),
        description: newDesc.trim(),
        subject_code: newSubCode,
        subject_name: newSubName,
        faculty_id: facultyId,
        faculty_name: user?.name || 'Dr. Alan Turing',
        class_id: newClassId,
        due_date: newDueDate,
        due_time: newDueTime,
        max_marks: parseFloat(newMaxMarks),
      });

      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      setStatusMsg({
        text: 'Assignment created and published successfully.',
        type: 'success',
      });
      await loadAssignments();
      setTimeout(() => setStatusMsg({ text: '', type: '' }), 5000);
    } catch (err) {
      setStatusMsg({
        text: err.response?.data?.detail || 'Failed to create assignment.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    if (!gradingSub) return;
    try {
      await assignmentsApi.gradeAssignment(gradingSub.assignmentId, gradingSub.studentId, {
        grade: parseFloat(gradeVal),
        feedback: feedbackVal,
      });
      setGradingSub(null);
      setGradeVal('');
      setFeedbackVal('');
      setStatusMsg({ text: 'Grade and feedback recorded.', type: 'success' });
      await loadAssignments();
      setTimeout(() => setStatusMsg({ text: '', type: '' }), 4000);
    } catch (err) {
      setStatusMsg({ text: 'Failed to submit grade.', type: 'error' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#D0D0D0]">
        <div>
          <h2 className="text-[16px] font-bold text-[#1A1A1A] tracking-tight">
            Assignment Management & Grading Studio
          </h2>
          <p className="text-[11.5px] text-[#767676]">
            Create course assignments, monitor student submissions, and record evaluation grades
          </p>
        </div>

        <div className="flex items-center gap-3">
          {statusMsg.text && (
            <span
              className={`inline-flex items-center gap-1 text-[12px] font-medium px-2 py-1 rounded-[3px] ${
                statusMsg.type === 'success'
                  ? 'bg-[#1A7F37]/10 text-[#1A7F37] border border-[#1A7F37]/30'
                  : 'bg-[#B91C1C]/10 text-[#B91C1C] border border-[#B91C1C]/30'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <Check className="w-3.5 h-3.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              )}
              {statusMsg.text}
            </span>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-1.5 bg-[#00338D] hover:bg-[#002B7A] text-white font-semibold rounded-[3px] text-[12.5px] transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Create New Assignment
          </button>
        </div>
      </div>

      {/* Assignment List */}
      {loading ? (
        <div className="p-8 text-center text-[#767676] bg-white border border-[#D0D0D0] rounded-[4px]">
          Loading assignments...
        </div>
      ) : assignments.length === 0 ? (
        <div className="p-8 text-center bg-white border border-[#D0D0D0] rounded-[4px] space-y-2">
          <p className="text-[13px] font-bold text-[#1A1A1A]">No Assignments Created Yet</p>
          <p className="text-[12px] text-[#767676]">
            Click "Create New Assignment" above to publish coursework to your student sections.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-white border border-[#D0D0D0] rounded-[4px] space-y-3"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 pb-2.5 border-b border-[#E5E5E5]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-[2px] bg-[#00338D]/10 text-[#00338D]">
                      {item.subject_code}
                    </span>
                    <h3 className="text-[14px] font-bold text-[#1A1A1A]">
                      {item.title}
                    </h3>
                    <span className="text-[11px] px-1.5 py-0.5 rounded-[2px] bg-[#1A7F37]/10 text-[#1A7F37] font-bold">
                      {item.status || 'Active'}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#4A4A4A]">
                    {item.description}
                  </p>
                  <p className="text-[11px] text-[#767676]">
                    Section: <strong className="text-[#1A1A1A]">{item.class_id}</strong> &bull; Subject: {item.subject_name}
                  </p>
                </div>

                <div className="text-[11.5px] text-right text-[#4A4A4A] flex-shrink-0">
                  <p className="font-mono font-bold text-[#1A1A1A]">
                    Due: {item.due_date} at {item.due_time}
                  </p>
                  <p className="text-[#767676]">
                    Max Points: {item.max_marks}
                  </p>
                </div>
              </div>

              {/* Submissions Section */}
              <div className="text-[12px]">
                <div className="flex items-center justify-between font-bold text-[#1A1A1A] mb-1.5">
                  <span>Student Deliverables ({item.submissions_count || (item.submissions?.length || 0)})</span>
                  <span className="text-[#767676] font-normal">Enrolled in section: {item.total_students || 10}</span>
                </div>

                {!item.submissions || item.submissions.length === 0 ? (
                  <p className="text-[12px] text-[#767676] italic py-1">
                    No submissions received yet for this assignment.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {item.submissions.map((sub) => (
                      <div
                        key={sub.submission_id || sub.student_id}
                        className="p-2.5 bg-[#F9F9F9] border border-[#D0D0D0] rounded-[3px] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <User className="w-4 h-4 text-[#767676]" />
                          <div>
                            <p className="font-bold text-[#1A1A1A]">
                              {sub.student_name || 'Student'} ({sub.student_id})
                            </p>
                            <p className="text-[11px] text-[#767676]">
                              Submitted: {sub.submitted_at} &bull; File: {sub.file_name || 'project.zip'}
                            </p>
                            {sub.grade !== null && sub.grade !== undefined && (
                              <p className="text-[11px] text-[#1A7F37] font-semibold">
                                Graded: {sub.grade} / {item.max_marks} pts &bull; Feedback: "{sub.feedback || 'Good work'}"
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setGradingSub({
                              assignmentId: item.id,
                              studentId: sub.student_id,
                              studentName: sub.student_name,
                              maxMarks: item.max_marks,
                            });
                            setGradeVal(sub.grade !== null && sub.grade !== undefined ? String(sub.grade) : '45');
                            setFeedbackVal(sub.feedback || 'Well-structured deliverable.');
                          }}
                          className="px-2.5 py-1 bg-[#00338D] hover:bg-[#002B7A] text-white rounded-[3px] text-[11.5px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Award className="w-3.5 h-3.5" />
                          {sub.grade !== null && sub.grade !== undefined ? 'Update Grade' : 'Grade & Feedback'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white w-full max-w-lg rounded-[4px] border border-[#D0D0D0] p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#D0D0D0] pb-2">
              <h3 className="text-[14.5px] font-bold text-[#1A1A1A]">
                Create New Assignment
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#767676] hover:text-[#1A1A1A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-3 text-[12.5px]">
              <div>
                <label className="block font-bold text-[#1A1A1A] mb-1 text-[11.5px]">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dynamic Programming & Memoization Lab"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2 border border-[#D0D0D0] rounded-[3px] text-[#1A1A1A] outline-none focus:border-[#00338D]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1A1A1A] mb-1 text-[11.5px]">
                  Description & Submission Requirements *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detailed instructions, formatting requirements, and rubric criteria..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-2 border border-[#D0D0D0] rounded-[3px] text-[#1A1A1A] outline-none focus:border-[#00338D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-[#1A1A1A] mb-1 text-[11.5px]">
                    Subject Course
                  </label>
                  <select
                    value={newSubCode}
                    onChange={(e) => {
                      setNewSubCode(e.target.value);
                      if (e.target.value === 'CS301') setNewSubName('Data Structures & Algorithms');
                      if (e.target.value === 'CS305') setNewSubName('Software Engineering');
                      if (e.target.value === 'CS402') setNewSubName('Machine Learning Fundamentals');
                    }}
                    className="w-full p-2 border border-[#D0D0D0] rounded-[3px] text-[#1A1A1A] outline-none focus:border-[#00338D]"
                  >
                    <option value="CS301">CS301 — Data Structures</option>
                    <option value="CS305">CS305 — Software Engineering</option>
                    <option value="CS402">CS402 — Machine Learning</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#1A1A1A] mb-1 text-[11.5px]">
                    Class Section
                  </label>
                  <select
                    value={newClassId}
                    onChange={(e) => setNewClassId(e.target.value)}
                    className="w-full p-2 border border-[#D0D0D0] rounded-[3px] text-[#1A1A1A] outline-none focus:border-[#00338D]"
                  >
                    <option value="CS-Sem2">CS-Sem2</option>
                    <option value="CS-Sem3-A">CS-Sem3-A</option>
                    <option value="CS-Sem3-B">CS-Sem3-B</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-bold text-[#1A1A1A] mb-1 text-[11.5px]">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full p-2 border border-[#D0D0D0] rounded-[3px] text-[#1A1A1A] font-mono text-[12px] outline-none focus:border-[#00338D]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1A1A1A] mb-1 text-[11.5px]">
                    Due Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={newDueTime}
                    onChange={(e) => setNewDueTime(e.target.value)}
                    className="w-full p-2 border border-[#D0D0D0] rounded-[3px] text-[#1A1A1A] font-mono text-[12px] outline-none focus:border-[#00338D]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1A1A1A] mb-1 text-[11.5px]">
                    Max Marks *
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    required
                    value={newMaxMarks}
                    onChange={(e) => setNewMaxMarks(e.target.value)}
                    className="w-full p-2 border border-[#D0D0D0] rounded-[3px] text-[#1A1A1A] font-mono font-bold text-[12px] outline-none focus:border-[#00338D]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#D0D0D0]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-[3px] text-[#4A4A4A] hover:bg-[#F5F5F5] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-[#00338D] hover:bg-[#002B7A] text-white font-semibold rounded-[3px] disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Publish Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grade Submission Modal */}
      {gradingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white w-full max-w-md rounded-[4px] border border-[#D0D0D0] p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#D0D0D0] pb-2">
              <h3 className="text-[14.5px] font-bold text-[#1A1A1A]">
                Grade Submission: {gradingSub.studentName}
              </h3>
              <button onClick={() => setGradingSub(null)} className="text-[#767676] hover:text-[#1A1A1A]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGradeSubmit} className="space-y-3 text-[12.5px]">
              <div>
                <label className="block font-bold text-[#1A1A1A] mb-1 text-[11.5px]">
                  Grade Score (Max {gradingSub.maxMarks} points) *
                </label>
                <input
                  type="number"
                  min="0"
                  max={gradingSub.maxMarks}
                  required
                  value={gradeVal}
                  onChange={(e) => setGradeVal(e.target.value)}
                  className="w-full p-2 border border-[#D0D0D0] rounded-[3px] text-[#1A1A1A] font-mono font-bold outline-none focus:border-[#00338D]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1A1A1A] mb-1 text-[11.5px]">
                  Instructor Feedback & Comments
                </label>
                <textarea
                  rows={3}
                  value={feedbackVal}
                  onChange={(e) => setFeedbackVal(e.target.value)}
                  placeholder="Provide qualitative feedback or rubric notes..."
                  className="w-full p-2 border border-[#D0D0D0] rounded-[3px] text-[#1A1A1A] outline-none focus:border-[#00338D]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#D0D0D0]">
                <button
                  type="button"
                  onClick={() => setGradingSub(null)}
                  className="px-3 py-1.5 rounded-[3px] text-[#4A4A4A] hover:bg-[#F5F5F5] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#00338D] hover:bg-[#002B7A] text-white font-semibold rounded-[3px]"
                >
                  Save Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
