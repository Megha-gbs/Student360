import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Plus, MapPin, CheckCircle2, X } from 'lucide-react';
import { examinationsApi } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';

export default function AdminExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [subCode, setSubCode] = useState('CS301');
  const [subName, setSubName] = useState('Data Structures & Algorithms');
  const [examType, setExamType] = useState('Midterm');
  const [date, setDate] = useState('2026-11-10');
  const [start, setStart] = useState('10:00');
  const [end, setEnd] = useState('12:00');
  const [venue, setVenue] = useState('Exam Hall 1 — Desks 1 to 40');
  const [semester, setSemester] = useState(2);
  const [statusMsg, setStatusMsg] = useState('');

  const loadExams = async () => {
    try {
      const data = await examinationsApi.listExaminations();
      setExams(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await examinationsApi.createExamination({
        title,
        subject_code: subCode,
        subject_name: subName,
        exam_type: examType,
        date,
        start_time: start,
        end_time: end,
        venue,
        semester: parseInt(semester),
        department: 'Animation & Multimedia Design',
      });
      setShowModal(false);
      setTitle('');
      setStatusMsg(`Scheduled examination '${title}' on ${date}.`);
      loadExams();
      setTimeout(() => setStatusMsg(''), 5000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePublish = async (examId, current) => {
    try {
      await examinationsApi.updateExamination(examId, { results_published: !current });
      loadExams();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Central Examination Board Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure examination schedules, testing venues, and manage grade publishing status
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Schedule Examination
        </button>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{statusMsg}</span>
        </div>
      )}

      <div className="card-panel p-5 overflow-x-auto space-y-4">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-surface-darkborder text-slate-500 dark:text-slate-400">
              <th className="py-3 px-4 font-bold">Exam ID</th>
              <th className="py-3 px-4 font-bold">Course & Subject</th>
              <th className="py-3 px-4 font-bold">Type</th>
              <th className="py-3 px-4 font-bold">Date & Time</th>
              <th className="py-3 px-4 font-bold">Testing Venue</th>
              <th className="py-3 px-4 font-bold text-center">Results Published</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {exams.map((ex) => (
              <tr key={ex.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {ex.id}
                </td>
                <td className="py-3.5 px-4">
                  <p className="font-bold text-slate-900 dark:text-white">{ex.title}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{ex.subject_code} — {ex.subject_name}</p>
                </td>
                <td className="py-3.5 px-4">
                  <StatusBadge status={ex.exam_type} />
                </td>
                <td className="py-3.5 px-4">
                  <p className="font-bold text-slate-800 dark:text-slate-200">{ex.date}</p>
                  <p className="text-[11px] text-slate-500 font-mono">{ex.start_time} - {ex.end_time}</p>
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                  {ex.venue}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <button
                    onClick={() => handleTogglePublish(ex.id, ex.results_published)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
                      ex.results_published
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200'
                    }`}
                  >
                    {ex.results_published ? 'Published' : 'Draft / Unpublished'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-darkpanel w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-surface-darkborder p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-surface-darkborder pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Schedule Examination Session
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Exam Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operating Systems Final Theory Exam"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Subject Code</label>
                  <input
                    type="text"
                    required
                    value={subCode}
                    onChange={(e) => setSubCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Examination Type</label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-semibold"
                  >
                    <option value="Midterm">Midterm Examination</option>
                    <option value="Final Semester">Final Semester</option>
                    <option value="Practical Lab">Practical Studio / Lab</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Testing Venue</label>
                <input
                  type="text"
                  required
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="e.g. Exam Hall 1 — Desks 1 to 40"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-surface-darkborder">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20"
                >
                  Schedule Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
