import React, { useState } from 'react';
import { User, Mail, Phone, Building2, Briefcase, Lock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';

export default function FacultyProfile() {
  const { user, updateProfile } = useAuth();
  const [phone, setPhone] = useState(user?.phone || '+1 (555) 019-2831');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passMsg, setPassMsg] = useState({ text: '', isError: false });
  const [savedMsg, setSavedMsg] = useState('');

  const handleUpdate = (e) => {
    e.preventDefault();
    updateProfile({ phone });
    setSavedMsg('Faculty contact details saved successfully.');
    setTimeout(() => setSavedMsg(''), 4000);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      setPassMsg({ text: 'Please fill in both password fields.', isError: true });
      return;
    }
    try {
      await authApi.changePassword(oldPassword, newPassword, user?.id || 'FAC-CS101');
      setPassMsg({ text: 'Password successfully changed!', isError: false });
      setOldPassword('');
      setNewPassword('');
      setTimeout(() => setPassMsg({ text: '', isError: false }), 5000);
    } catch (err) {
      setPassMsg({ text: err.response?.data?.detail || 'Failed to update password', isError: true });
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          Faculty Profile & Academic Credentials
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Faculty appointment details, departmental appointments, and security settings
        </p>
      </div>

      {savedMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{savedMsg}</span>
        </div>
      )}

      <div className="card-panel p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-slate-100 dark:border-surface-darkborder">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
            alt={user?.name || 'Faculty'}
            className="w-20 h-20 rounded-2xl object-cover ring-4 ring-indigo-500/20 shadow-md"
          />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{user?.name}</h3>
            <p className="text-xs text-slate-500 font-mono">{user?.email}</p>
            <div className="flex items-center gap-2 pt-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {user?.designation || 'Professor & Head of Department'}
              </span>
              <span className="text-xs font-mono text-slate-400">ID: {user?.id}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-surface-darkborder space-y-1">
            <span className="text-slate-400 font-medium">Department</span>
            <p className="font-bold text-slate-900 dark:text-white">{user?.department || 'Computer Science & Engineering'}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-surface-darkborder space-y-1">
            <span className="text-slate-400 font-medium">Designation</span>
            <p className="font-bold text-slate-900 dark:text-white">{user?.designation || 'Professor & HOD'}</p>
          </div>
        </div>

        {/* Update Contact Form */}
        <form onSubmit={handleUpdate} className="space-y-4 pt-4 border-t border-slate-100 dark:border-surface-darkborder">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Contact Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Institutional Email</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Office Contact / Extension</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
          >
            Save Faculty Contact Details
          </button>
        </form>

        {/* Change Password Form */}
        <form onSubmit={handleChangePassword} className="space-y-4 pt-6 border-t border-slate-100 dark:border-surface-darkborder">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            Security & Password Change
          </h4>

          {passMsg.text && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold ${
                passMsg.isError
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
              }`}
            >
              {passMsg.text}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Current Password</label>
              <input
                type="password"
                placeholder="password123"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">New Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-surface-darkborder bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
          >
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}
