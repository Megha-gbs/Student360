import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Upload,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
  Edit,
  Trash2,
  ExternalLink,
  History,
  FileCheck,
} from 'lucide-react';
import { adminApi } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { useNavigate } from 'react-router-dom';

export default function AdminStudents() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'history'
  const [students, setStudents] = useState([]);
  const [importHistory, setImportHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [csvResult, setCsvResult] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  // Add form state
  const [formSid, setFormSid] = useState('');
  const [formRoll, setFormRoll] = useState('');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDept, setFormDept] = useState('Computer Science & Engineering');
  const [formProgram, setFormProgram] = useState('B.Tech Computer Science');
  const [formSemester, setFormSemester] = useState(1);

  const loadStudents = async () => {
    try {
      const [stuData, histData] = await Promise.all([
        adminApi.getStudents(),
        adminApi.getImportHistory().catch(() => []),
      ]);
      setStudents(stuData || []);
      setImportHistory(histData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createStudent({
        student_id: formSid,
        roll_number: formRoll || `2024-${formSid}`,
        name: formName,
        email: formEmail || `${formSid.toLowerCase()}@student360.edu`,
        phone: formPhone || '+1 (555) 000-0000',
        department: formDept,
        program: formProgram,
        semester: parseInt(formSemester),
        admission_year: 2024,
      });
      setShowAddModal(false);
      setStatusMsg(`Successfully enrolled ${formName} (${formSid}) into the institutional registrar.`);
      loadStudents();
      setTimeout(() => setStatusMsg(''), 5000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create student');
    }
  };

  const handleToggleStatus = async (studentId, currentStatus) => {
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      await adminApi.updateStudent(studentId, { status: nextStatus });
      setStudents((prev) =>
        prev.map((s) => (s.student_id === studentId ? { ...s, status: nextStatus } : s))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleCsvImport = async (e) => {
    e.preventDefault();
    if (!csvContent.trim()) return;

    try {
      // Parse CSV rows
      const lines = csvContent.trim().split('\n');
      const rows = [];
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const vals = lines[i].split(',').map((v) => v.trim());
        const rowObj = {};
        headers.forEach((h, idx) => {
          rowObj[h] = vals[idx] || '';
        });
        rows.push(rowObj);
      }

      const res = await adminApi.importCsv(rows);
      setCsvResult(res);
      loadStudents();
    } catch (err) {
      alert('CSV Parsing or upload error: ' + (err.response?.data?.detail || err.message));
    }
  };

  const filtered = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.student_id.toLowerCase().includes(search.toLowerCase()) ||
      s.roll_number.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'ALL' || s.department === deptFilter;
    return matchSearch && matchDept;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Student Lifecycle & Registrar Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Admissions, enrolled rosters, status management, and batch CSV data onboarding
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'directory'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white dark:bg-surface-darkcard text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-surface-darkborder hover:bg-slate-50'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Student Roster ({students.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white dark:bg-surface-darkcard text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-surface-darkborder hover:bg-slate-50'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Import History ({importHistory.length})</span>
          </button>
          <button
            onClick={() => setShowCsvModal(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-surface-darkborder hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            Batch CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Enroll Student
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* View 1: Student Directory */}
      {activeTab === 'directory' && (
        <>
          {/* Filter and Search Bar */}
          <div className="card-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search student, roll, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-surface-darkborder focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
              <span className="text-slate-400 font-medium">Department:</span>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-semibold"
              >
                <option value="ALL">All Departments</option>
                <option value="Animation & Multimedia Design">Animation & Multimedia</option>
                <option value="Agronomy & Bio-Systems">Agronomy</option>
                <option value="Computer Science & Engineering">Computer Science</option>
                <option value="Management & Business Analytics">Management</option>
              </select>
            </div>
          </div>

      {/* Students Data Table */}
      <div className="card-panel p-5 overflow-x-auto space-y-4">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-surface-darkborder text-slate-500 dark:text-slate-400">
              <th className="py-3 px-4 font-bold">Student ID</th>
              <th className="py-3 px-4 font-bold">Roll Number</th>
              <th className="py-3 px-4 font-bold">Student Name</th>
              <th className="py-3 px-4 font-bold">Department & Degree</th>
              <th className="py-3 px-4 font-bold text-center">Sem</th>
              <th className="py-3 px-4 font-bold text-center">CGPA</th>
              <th className="py-3 px-4 font-bold text-center">Attendance</th>
              <th className="py-3 px-4 font-bold text-center">Account Status</th>
              <th className="py-3 px-4 font-bold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filtered.map((s) => (
              <tr key={s.student_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {s.student_id}
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-500">
                  {s.roll_number}
                </td>
                <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                  {s.name}
                </td>
                <td className="py-3.5 px-4">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{s.program}</p>
                  <p className="text-[11px] text-slate-400">{s.department}</p>
                </td>
                <td className="py-3.5 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                  {s.semester}
                </td>
                <td className="py-3.5 px-4 text-center font-bold font-mono text-slate-800 dark:text-slate-200">
                  {s.cgpa?.toFixed(2)}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span
                    className={`font-mono font-bold ${
                      s.attendance_rate < 75 ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  >
                    {s.attendance_rate}%
                  </span>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <button
                    onClick={() => handleToggleStatus(s.student_id, s.status)}
                    className="focus:outline-none"
                    title="Click to toggle account status"
                  >
                    <StatusBadge status={s.status} />
                  </button>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <button
                    onClick={() => navigate(`/students/${s.student_id}`)}
                    className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                    title="Inspect Student360 ML Profile"
                  >
                    <ExternalLink className="w-4 h-4 mx-auto" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )}

  {/* View 2: Batch CSV Import History */}
  {activeTab === 'history' && (
    <div className="card-panel p-5 overflow-x-auto space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-surface-darkborder">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            Institutional CSV Ingestion & Import Audit Log
          </h3>
          <p className="text-xs text-slate-500">
            Immutable log of student record batch uploads, validation results, and ingestion counts
          </p>
        </div>
      </div>

      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-surface-darkborder text-slate-500 dark:text-slate-400">
            <th className="py-3 px-4 font-bold">Import ID</th>
            <th className="py-3 px-4 font-bold">Timestamp</th>
            <th className="py-3 px-4 font-bold">Import Source / File</th>
            <th className="py-3 px-4 font-bold">Uploaded By</th>
            <th className="py-3 px-4 font-bold text-center">Total Rows</th>
            <th className="py-3 px-4 font-bold text-center">Accepted</th>
            <th className="py-3 px-4 font-bold text-center">Rejected</th>
            <th className="py-3 px-4 font-bold text-center">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {importHistory.map((h) => (
            <tr key={h.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
              <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {h.id}
              </td>
              <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                {new Date(h.timestamp).toLocaleString()}
              </td>
              <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500" />
                <span>{h.filename}</span>
              </td>
              <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                {h.imported_by_name} ({h.imported_by})
              </td>
              <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                {h.total_rows}
              </td>
              <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-600">
                {h.accepted_rows}
              </td>
              <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-600">
                {h.rejected_rows}
              </td>
              <td className="py-3.5 px-4 text-center">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    h.status === 'Completed'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {h.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}

      {/* Enroll Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-darkpanel w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-surface-darkborder p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-surface-darkborder pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Enroll New Student Record
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Student ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. S1011"
                    value={formSid}
                    onChange={(e) => setFormSid(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Roll Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 2024-CSE-011"
                    value={formRoll}
                    onChange={(e) => setFormRoll(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Matrix"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                  <select
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-semibold"
                  >
                    <option value="Computer Science & Engineering">Computer Science</option>
                    <option value="Animation & Multimedia Design">Animation & Design</option>
                    <option value="Agronomy & Bio-Systems">Agronomy</option>
                    <option value="Management & Business Analytics">Management</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Semester</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={formSemester}
                    onChange={(e) => setFormSemester(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-surface-darkborder">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20"
                >
                  Enroll Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Batch Import Modal with Row-Level Error Reporting */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-darkpanel w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-surface-darkborder p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-surface-darkborder pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                  Batch Student Import from CSV
                </h3>
                <p className="text-xs text-slate-500">
                  Upload CSV records with row-level validation and conflict checks
                </p>
              </div>
              <button onClick={() => setShowCsvModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCsvImport} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Paste CSV Content (Headers: student_id, name, department, semester)
                </label>
                <textarea
                  rows={6}
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  placeholder={`student_id,name,department,semester\nS1020,Lucas Scott,Computer Science & Engineering,1\nS1021,Peyton Sawyer,Animation & Multimedia Design,1`}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {csvResult && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-surface-darkborder space-y-2">
                  <div className="flex items-center gap-4 text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">Total Rows: {csvResult.total_rows}</span>
                    <span className="text-emerald-600">Accepted: {csvResult.accepted_rows}</span>
                    <span className="text-rose-600">Rejected: {csvResult.rejected_rows}</span>
                  </div>

                  {csvResult.errors && csvResult.errors.length > 0 && (
                    <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-surface-darkborder">
                      <p className="text-[11px] font-bold text-rose-600">Row-Level Rejection Errors:</p>
                      <ul className="text-[11px] text-rose-500 space-y-1">
                        {csvResult.errors.map((err, i) => (
                          <li key={i}>
                            • Row {err.row} ({err.student_id}): {err.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-surface-darkborder">
                <button
                  type="button"
                  onClick={() => setShowCsvModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20"
                >
                  Validate & Import Records
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
