import React, { useState, useEffect } from 'react';
import { Users, Plus, Mail, Phone, Building2, CheckCircle2, X } from 'lucide-react';
import { adminApi } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';

export default function AdminFaculty() {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [dept, setDept] = useState('Computer Science & Engineering');
  const [designation, setDesignation] = useState('Associate Professor');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const loadFaculty = async () => {
    try {
      const data = await adminApi.getFaculty();
      setFaculty(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaculty();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const fid = `FAC-${dept.slice(0, 3).toUpperCase()}${faculty.length + 101}`;
      await adminApi.createFaculty({
        id: fid,
        name,
        department: dept,
        designation,
        email: email || `${name.toLowerCase().replace(' ', '.')}@student360.edu`,
        phone: phone || '+1 (555) 019-0000',
      });
      setShowAddModal(false);
      setName('');
      setEmail('');
      setStatusMsg(`Appointed ${name} (${fid}) to faculty roster.`);
      loadFaculty();
      setTimeout(() => setStatusMsg(''), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Faculty Directory & Academic Appointments
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Professorial appointments, department assignments, and teaching responsibilities
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Appoint Faculty Member
        </button>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{statusMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {faculty.map((f) => (
          <div key={f.id} className="card-panel p-5 space-y-4 hover:border-indigo-300 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow-md">
                {f.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{f.name}</h3>
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">{f.designation}</p>
                <span className="font-mono text-[10px] text-slate-400 block">{f.id}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-surface-darkborder">
              <p className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{f.department}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono text-[11px]">{f.email}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{f.phone}</span>
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-surface-darkborder flex items-center justify-between text-xs">
              <span className="text-slate-400">Status</span>
              <StatusBadge status={f.status || 'Active'} />
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-darkpanel w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-surface-darkborder p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-surface-darkborder pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Appoint New Faculty Member
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Claude Shannon"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                  <select
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-semibold"
                  >
                    <option value="Computer Science & Engineering">Computer Science</option>
                    <option value="Animation & Multimedia Design">Animation & Design</option>
                    <option value="Agronomy & Bio-Systems">Agronomy</option>
                    <option value="Management & Business Analytics">Management</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Designation</label>
                  <select
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-semibold"
                  >
                    <option value="Professor & Head of Department">Professor & HOD</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Senior Lecturer">Senior Lecturer</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="faculty@student360.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-surface-darkborder">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20"
                >
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
