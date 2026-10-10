import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Mail,
  Phone,
  ExternalLink,
  Award,
  CheckSquare,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  FileCheck,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { adminApi, verificationApi } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function FacultyStudents() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'verifications'
  const [students, setStudents] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [reviewRemark, setReviewRemark] = useState({});
  const [actionMsg, setActionMsg] = useState('');
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    try {
      const [stuData, verData] = await Promise.all([
        adminApi.getStudents({ faculty_id: user?.id || 'FAC-CS101' }),
        verificationApi.getPendingVerifications(),
      ]);
      setStudents(stuData || []);
      setVerifications(verData || []);
    } catch (err) {
      console.error('Error loading faculty cohort records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleVerify = async (entryId, status) => {
    try {
      const remarks = reviewRemark[entryId] || (status === 'Institution-Verified' ? 'Approved by faculty reviewer' : 'Missing sufficient verification evidence');
      await verificationApi.verifyAchievement(entryId, {
        status,
        remarks,
      });
      setActionMsg(`Milestone has been marked as ${status}.`);
      loadData();
      setTimeout(() => setActionMsg(''), 4000);
    } catch (err) {
      alert('Verification action failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.roll_number?.toLowerCase().includes(search.toLowerCase()) ||
      s.student_id?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredVerifications = verifications.filter(
    (v) =>
      v.student_id?.toLowerCase().includes(search.toLowerCase()) ||
      v.title?.toLowerCase().includes(search.toLowerCase()) ||
      v.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#1A1A1A] tracking-tight flex items-center gap-2">
            <span>Faculty Cohort & Mentoring Portal</span>
          </h2>
          <p className="text-xs text-[#767676]">
            Authorized roster of students enrolled in your course sections, mentoring cohorts, and achievement review queue
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-3.5 py-2 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'roster'
                ? 'bg-[#00338D] text-white shadow-sm'
                : 'bg-white text-[#1A1A1A] border border-[#D0D0D0] hover:bg-slate-50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Assigned Students ({students.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('verifications')}
            className={`px-3.5 py-2 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'verifications'
                ? 'bg-[#00338D] text-white shadow-sm'
                : 'bg-white text-[#1A1A1A] border border-[#D0D0D0] hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pending Verifications</span>
            {verifications.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[10px] rounded-full font-black">
                {verifications.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Tab 1: Assigned Students Roster */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          <div className="card-panel p-4 flex items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search assigned student or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-surface-darkborder focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
              />
            </div>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Showing {filteredStudents.length} of {students.length} assigned records
            </span>
          </div>

          <div className="card-panel p-5 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-surface-darkborder text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4 font-bold">Student ID</th>
                  <th className="py-3 px-4 font-bold">Roll Number</th>
                  <th className="py-3 px-4 font-bold">Full Name</th>
                  <th className="py-3 px-4 font-bold">Program</th>
                  <th className="py-3 px-4 font-bold text-center">CGPA</th>
                  <th className="py-3 px-4 font-bold text-center">Attendance</th>
                  <th className="py-3 px-4 font-bold text-center">Retention & 360</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredStudents.map((s) => (
                  <tr key={s.student_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {s.student_id}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {s.roll_number}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {s.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {s.program}
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
                        onClick={() => navigate(`/students/${s.student_id}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-all"
                      >
                        <span>View ML 360</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Pending Achievement Verifications */}
      {activeTab === 'verifications' && (
        <div className="space-y-4">
          <div className="card-panel p-4 flex items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search submission or student..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-surface-darkborder focus:ring-2 focus:ring-purple-500 outline-none text-slate-900 dark:text-white"
              />
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Verify student certifications, internships, awards, and milestones
            </p>
          </div>

          {filteredVerifications.length === 0 ? (
            <div className="card-panel p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                All Achievement Verifications Up To Date
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                There are no pending self-reported achievements waiting for faculty review at this time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredVerifications.map((v) => (
                <div
                  key={v.id}
                  className="card-panel p-5 border border-slate-200 dark:border-surface-darkborder space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                          {v.category}
                        </span>
                        <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          Student ID: {v.student_id}
                        </span>
                        <span className="text-slate-400 text-xs">• {v.date}</span>
                        {v.academic_year && (
                          <span className="text-slate-400 text-xs">({v.academic_year})</span>
                        )}
                      </div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        {v.title}
                      </h4>
                      {v.organization && (
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          Organization / Issuer: {v.organization}
                        </p>
                      )}
                      {v.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                          {v.description}
                        </p>
                      )}
                      {v.skills && v.skills.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {v.skills.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {v.evidence_url && (
                      <a
                        href={v.evidence_url}
                        target="_blank"
                        rel="noreferrer"
                        className="self-start inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold"
                      >
                        <span>Inspect Evidence Document</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {/* Review Action Controls */}
                  <div className="pt-3 border-t border-slate-100 dark:border-surface-darkborder flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Reviewer remarks / feedback note (optional for approval)..."
                        value={reviewRemark[v.id] || ''}
                        onChange={(e) =>
                          setReviewRemark({ ...reviewRemark, [v.id]: e.target.value })
                        }
                        className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-surface-darkborder text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => handleVerify(v.id, 'Rejected')}
                        className="px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => handleVerify(v.id, 'Institution-Verified')}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve & Verify</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
