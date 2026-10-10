import React, { useState, useEffect } from 'react';
import { BellRing, Plus, Calendar, User, CheckCircle2, X } from 'lucide-react';
import { announcementsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';

export default function FacultyAnnouncements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('Important');
  const [category, setCategory] = useState('Academic');
  const [targetAudience, setTargetAudience] = useState('students');
  const [successMsg, setSuccessMsg] = useState('');

  const loadAnnouncements = async () => {
    try {
      const data = await announcementsApi.listAnnouncements();
      setAnnouncements(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await announcementsApi.createAnnouncement({
        title,
        content,
        category,
        target_audience: targetAudience,
        priority,
        publisher: user?.name || 'Dr. Alan Turing',
        publisher_role: user?.designation || 'Faculty',
      });
      setShowModal(false);
      setTitle('');
      setContent('');
      setSuccessMsg('Announcement published successfully.');
      loadAnnouncements();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Class & Department Announcements
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Publish notices, laboratory schedule revisions, and hackathon registrations
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Publish Notice
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="space-y-3">
        {announcements.map((a) => (
          <div key={a.id} className="card-panel p-5 space-y-2">
            <div className="flex items-center gap-2">
              <StatusBadge status={a.priority} />
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {a.category}
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-mono">
                Audience: {a.target_audience}
              </span>
            </div>

            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{a.title}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{a.content}</p>

            <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-surface-darkborder">
              <span>Published by {a.publisher}</span>
              <span>•</span>
              <span>{a.created_at}</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-darkpanel w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-surface-darkborder p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-surface-darkborder pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Publish Department Notice
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Notice Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Midterm Project Code Review Schedule"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Message Content</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Details of the announcement..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="Important">Important</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Examination">Examination</option>
                    <option value="Campus">Campus</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Target</label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="students">Students</option>
                    <option value="faculty">Faculty</option>
                    <option value="all">All Campus</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-surface-darkborder">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20"
                >
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
