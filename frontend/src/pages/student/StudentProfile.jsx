import React, { useState } from 'react';
import { User, Mail, Phone, Building2, GraduationCap, Lock, CheckCircle2, Shield, Calendar, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';
import AchievementsSection from '../../components/AchievementsSection';

export default function StudentProfile() {
  const { user, updateProfile } = useAuth();
  const studentId = user?.id || 'S1001';
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passMsg, setPassMsg] = useState({ text: '', isError: false });
  const [savedMsg, setSavedMsg] = useState('');

  const handleUpdateContact = (e) => {
    e.preventDefault();
    updateProfile({ phone });
    setSavedMsg('Contact details updated successfully in university records.');
    setTimeout(() => setSavedMsg(''), 4000);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      setPassMsg({ text: 'Please fill in both password fields.', isError: true });
      return;
    }
    try {
      await authApi.changePassword(oldPassword, newPassword, studentId);
      setPassMsg({ text: 'Password successfully changed!', isError: false });
      setOldPassword('');
      setNewPassword('');
      setTimeout(() => setPassMsg({ text: '', isError: false }), 5000);
    } catch (err) {
      setPassMsg({ text: err.response?.data?.detail || 'Failed to update password', isError: true });
    }
  };

  return (
    <div className="max-w-5xl space-y-5">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-[#1A1A1A] tracking-tight">
          Student Profile & Institutional Records
        </h1>
        <p className="text-xs text-[#4A4A4A] mt-0.5">
          Official enrollment credentials, academic metadata, achievements portfolio, and account security
        </p>
      </div>

      {savedMsg && (
        <div className="p-3 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{savedMsg}</span>
        </div>
      )}

      {/* Profile Overview Card (Screenshot 2 Reference) */}
      <div className="bg-white border border-[#D0D0D0] rounded p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-5 border-b border-[#D0D0D0]">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt={user?.name || 'Student'}
            className="w-16 h-16 rounded object-cover border border-[#D0D0D0]"
          />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-[#1A1A1A]">{user?.name}</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00338D]/10 text-[#00338D] border border-[#00338D]/20">
                Enrolled Student
              </span>
            </div>
            <p className="text-xs text-[#4A4A4A] font-mono">{user?.email}</p>
            <p className="text-xs text-[#767676]">
              Student ID: <strong className="font-mono text-[#1A1A1A]">{studentId}</strong> • Roll Number: <strong className="font-mono text-[#1A1A1A]">{user?.roll_number || '2024-AMD-001'}</strong>
            </p>
          </div>
        </div>

        {/* Academic Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded bg-[#FAFAFA] border border-[#D0D0D0] space-y-0.5">
            <span className="text-[#767676] font-medium block">Program of Study</span>
            <p className="font-bold text-[#1A1A1A]">{user?.program || 'B.Des Animation & Multimedia'}</p>
          </div>
          <div className="p-3 rounded bg-[#FAFAFA] border border-[#D0D0D0] space-y-0.5">
            <span className="text-[#767676] font-medium block">Department</span>
            <p className="font-bold text-[#1A1A1A]">{user?.department || 'Animation & Multimedia Design'}</p>
          </div>
          <div className="p-3 rounded bg-[#FAFAFA] border border-[#D0D0D0] space-y-0.5">
            <span className="text-[#767676] font-medium block">Current Semester</span>
            <p className="font-bold text-[#1A1A1A]">Semester {user?.semester || 2}</p>
          </div>
          <div className="p-3 rounded bg-[#FAFAFA] border border-[#D0D0D0] space-y-0.5">
            <span className="text-[#767676] font-medium block">Academic Standing</span>
            <p className="font-bold text-emerald-700">Good Standing</p>
          </div>
        </div>

        {/* Update Contact Info Form */}
        <form onSubmit={handleUpdateContact} className="space-y-3 pt-4 border-t border-[#D0D0D0]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
            Contact Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[#4A4A4A] mb-1 font-semibold">Institutional Email</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full p-2 rounded border border-[#D0D0D0] bg-[#F5F5F5] text-[#767676] cursor-not-allowed text-xs"
              />
            </div>
            <div>
              <label className="block text-[#4A4A4A] mb-1 font-semibold">Mobile Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2 rounded border border-[#D0D0D0] bg-white text-[#1A1A1A] focus:border-[#00338D] focus:ring-1 focus:ring-[#00338D] outline-none text-xs"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-[#00338D] hover:bg-[#002266] text-white font-bold rounded text-xs transition-colors"
          >
            Save Contact Details
          </button>
        </form>

        {/* Change Password Form */}
        <form onSubmit={handleChangePassword} className="space-y-3 pt-4 border-t border-[#D0D0D0]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#00338D]" />
            Security & Password Change
          </h3>

          {passMsg.text && (
            <div
              className={`p-2.5 rounded text-xs font-semibold ${
                passMsg.isError
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {passMsg.text}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[#4A4A4A] mb-1 font-semibold">Current Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full p-2 rounded border border-[#D0D0D0] bg-white text-[#1A1A1A] focus:border-[#00338D] focus:ring-1 focus:ring-[#00338D] outline-none text-xs"
              />
            </div>
            <div>
              <label className="block text-[#4A4A4A] mb-1 font-semibold">New Password</label>
              <input
                type="password"
                placeholder="Enter new secure password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2 rounded border border-[#D0D0D0] bg-white text-[#1A1A1A] focus:border-[#00338D] focus:ring-1 focus:ring-[#00338D] outline-none text-xs"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-[#1A1A1A] hover:bg-black text-white font-bold rounded text-xs transition-colors"
          >
            Update Password
          </button>
        </form>
      </div>

      {/* Section 4: Achievements & Student Development Portfolio */}
      <AchievementsSection studentId={studentId} allowSubmit={true} />
    </div>
  );
}

