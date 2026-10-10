import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Key,
  Clock,
  Shield,
  Search,
  UserPlus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  RefreshCw,
} from 'lucide-react';
import { adminApi } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';

export default function AdminUsersAudit() {
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [assignStudentInput, setAssignStudentInput] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  // Create User Form state
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('student');
  const [newDepartment, setNewDepartment] = useState('Computer Science & Engineering');
  const [newPassword, setNewPassword] = useState('Student@360');
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [userData, logsData] = await Promise.all([
        adminApi.getUsers().catch(() => []),
        adminApi.getAuditLogs().catch(() => []),
      ]);
      setUsers(userData || []);
      setAuditLogs(logsData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'Active' ? 'Deactivated' : 'Active';
    try {
      await adminApi.updateUserStatus(user.id, newStatus);
      setActionMessage(`Account ${user.username} (${user.id}) status updated to ${newStatus}.`);
      await loadData();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update account status');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await adminApi.createUser({
        username: newUsername.trim(),
        email: newEmail.trim(),
        name: newName.trim(),
        role: newRole,
        department: newDepartment,
        password: newPassword,
      });
      setShowCreateModal(false);
      setNewUsername('');
      setNewEmail('');
      setNewName('');
      setActionMessage(`Account ${newUsername} created successfully!`);
      await loadData();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to create account');
    }
  };

  const handleAssignStudents = async (e) => {
    e.preventDefault();
    if (!selectedFaculty) return;
    const studentList = assignStudentInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    try {
      await adminApi.assignStudentsToFaculty(selectedFaculty.id, studentList);
      setShowAssignModal(false);
      setSelectedFaculty(null);
      setAssignStudentInput('');
      setActionMessage(`Assigned students [${studentList.join(', ')}] to faculty ${selectedFaculty.name}`);
      await loadData();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to assign students');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            User Access Control & Security Audit Trail
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Role-based privilege management, user account state, and immutable administrative audit logs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-surface-darkborder text-xs font-bold flex items-center gap-1.5"
            title="Refresh user data"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-indigo-600/30"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Account</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* User Accounts Management */}
      <div className="card-panel p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Active Institutional Accounts ({filteredUsers.length})
          </h3>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user, ID, email..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-surface-darkborder focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="py-1.5 px-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-surface-darkborder focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">All Roles</option>
              <option value="admin">Administrators</option>
              <option value="faculty">Faculty</option>
              <option value="student">Students</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-surface-darkborder text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4 font-bold">User ID</th>
                <th className="py-3 px-4 font-bold">Username / Name</th>
                <th className="py-3 px-4 font-bold">Role Assignment</th>
                <th className="py-3 px-4 font-bold">Department / Details</th>
                <th className="py-3 px-4 font-bold text-center">Status</th>
                <th className="py-3 px-4 font-bold text-center">Access Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredUsers.map((acc) => (
                <tr key={acc.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {acc.id}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 dark:text-white">{acc.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{acc.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        acc.role === 'admin'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                          : acc.role === 'faculty'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}
                    >
                      {acc.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    <div>{acc.department || 'Academic'}</div>
                    {acc.assigned_student_ids && (
                      <div className="text-[10px] text-indigo-500 font-mono mt-0.5">
                        Assigned: {acc.assigned_student_ids.join(', ') || 'None'}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        acc.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}
                    >
                      {acc.status || 'Active'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {acc.role === 'faculty' && (
                        <button
                          onClick={() => {
                            setSelectedFaculty(acc);
                            setAssignStudentInput((acc.assigned_student_ids || []).join(', '));
                            setShowAssignModal(true);
                          }}
                          className="px-2 py-1 text-[10px] font-bold rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 hover:bg-indigo-100 transition-colors"
                        >
                          Assign Students
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleStatus(acc)}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-colors ${
                          acc.status === 'Active'
                            ? 'border-rose-200 text-rose-600 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                            : 'border-emerald-200 text-emerald-600 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        }`}
                      >
                        {acc.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs Trail */}
      <div className="card-panel p-5 overflow-x-auto space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Administrative Activity Audit Log Trail ({auditLogs.length})
        </h3>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-surface-darkborder text-slate-500 dark:text-slate-400">
              <th className="py-3 px-4 font-bold">Log ID</th>
              <th className="py-3 px-4 font-bold">Timestamp</th>
              <th className="py-3 px-4 font-bold">Actor</th>
              <th className="py-3 px-4 font-bold">Action Event</th>
              <th className="py-3 px-4 font-bold">Target</th>
              <th className="py-3 px-4 font-bold">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {auditLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {log.id}
                </td>
                <td className="py-3 px-4 font-mono text-slate-500">{log.timestamp}</td>
                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                  {log.actor} ({log.actor_role})
                </td>
                <td className="py-3 px-4">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {log.action}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                  {log.target}
                </td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-darkpanel rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-surface-darkborder shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                Create Institutional Account
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Username / ID</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. jdoe or S1010"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Institutional Email</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. jdoe@student360.edu"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Role Assignment</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Initial Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Department</label>
                <input
                  type="text"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Students Modal */}
      {showAssignModal && selectedFaculty && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-darkpanel rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-surface-darkborder shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Assign Students to Faculty
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Assign students to <span className="font-bold text-slate-900 dark:text-white">{selectedFaculty.name}</span> ({selectedFaculty.id}). Comma-separated Student IDs:
            </p>

            <form onSubmit={handleAssignStudents} className="space-y-3 text-xs">
              <div>
                <input
                  type="text"
                  value={assignStudentInput}
                  onChange={(e) => setAssignStudentInput(e.target.value)}
                  placeholder="e.g. S1001, S1002, S1003, S1004"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                >
                  Save Assignments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

