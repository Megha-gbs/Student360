import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Award,
  FileText,
  Clock,
  CreditCard,
  User,
  Users,
  GraduationCap,
  Building2,
  BellRing,
  ShieldCheck,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AppSidebar({ isOpenMobile, onCloseMobile }) {
  const { user, role, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation Items per Role
  const studentNav = [
    { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { label: 'Daily Timetable', path: '/student/timetable', icon: Calendar },
    { label: 'Attendance', path: '/student/attendance', icon: CheckSquare, dot: 'amber' },
    { label: 'Marks & Results', path: '/student/marks', icon: Award },
    { label: 'Assignments', path: '/student/assignments', icon: FileText },
    { label: 'Examinations', path: '/student/exams', icon: Clock },
    { label: 'Career & Timeline', path: '/student/timeline', icon: Sparkles },
    { label: 'Fees & Dues', path: '/student/fees', icon: CreditCard },
    { label: 'ML Retention Analytics', path: '/student/ml-retention', icon: BrainCircuit },
    { label: 'My Profile', path: '/student/profile', icon: User },
  ];

  const facultyNav = [
    { label: 'Dashboard', path: '/faculty/dashboard', icon: LayoutDashboard },
    { label: 'Teaching Schedule', path: '/faculty/timetable', icon: Calendar },
    { label: 'Class & Students', path: '/faculty/students', icon: Users },
    { label: 'Mark Attendance', path: '/faculty/attendance', icon: CheckSquare, dot: 'amber' },
    { label: 'Internal Marks', path: '/faculty/marks', icon: Award },
    { label: 'Assignments', path: '/faculty/assignments', icon: FileText },
    { label: 'Announcements', path: '/faculty/announcements', icon: BellRing },
    { label: 'Priority Retention Queue', path: '/faculty/retention', icon: BrainCircuit },
    { label: 'My Profile', path: '/faculty/profile', icon: User },
  ];

  const adminNav = [
    { label: 'Institution Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Student Directory', path: '/admin/students', icon: GraduationCap },
    { label: 'Faculty Roster', path: '/admin/faculty', icon: Users },
    { label: 'Departments & Degrees', path: '/admin/departments', icon: Building2 },
    { label: 'Master Timetable', path: '/admin/timetable', icon: Calendar },
    { label: 'Attendance Reports', path: '/admin/attendance-reports', icon: CheckSquare },
    { label: 'Examinations', path: '/admin/exams', icon: Clock },
    { label: 'Fee Management', path: '/admin/fees', icon: CreditCard },
    { label: 'Official Notices', path: '/admin/announcements', icon: BellRing },
    { label: 'Users & Audit Logs', path: '/admin/users-audit', icon: ShieldCheck },
    { label: 'ML Cohort Intelligence', path: '/admin/cohort-intelligence', icon: BrainCircuit },
    { label: 'Profile Settings', path: '/admin/profile', icon: User },
  ];

  const navItems = role === 'admin' ? adminNav : role === 'faculty' ? facultyNav : studentNav;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-[#00338D] text-white border-r border-[#00225D] transition-all duration-200 ease-in-out ${
          collapsed ? 'w-16' : 'w-[240px]'
        } ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ width: collapsed ? '64px' : '240px' }}
      >
        {/* Brand Header */}
        <div className="h-14 flex items-center justify-between px-3.5 border-b border-[#00225D] bg-[#002B7A]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-[3px] bg-white/20 flex items-center justify-center text-white flex-shrink-0 font-bold text-xs">
              360
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-[14px] tracking-tight text-white leading-none">
                  Student360
                </span>
                <span className="text-[10px] text-white/70 tracking-wider mt-0.5 font-normal">
                  Smart Campus Analytics
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1 rounded-[3px] text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Current Active Persona Strip */}
        {!collapsed && user && (
          <div className="px-3 py-2 border-b border-[#00225D] bg-[#00276D]/70 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[3px] bg-white/20 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
              {(user.name || 'U')[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold text-white truncate leading-tight">
                {user.name || 'Staff User'}
              </p>
              <p className="text-[10.5px] text-white/70 uppercase tracking-wider">
                {role} portal
              </p>
            </div>
          </div>
        )}

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto py-1.5 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-2.5 px-3 py-2 text-[12.5px] transition-colors relative ${
                  isActive
                    ? 'bg-white/15 text-white font-bold border-l-[3px] border-white pl-[9px]'
                    : 'text-white/85 hover:bg-white/10 hover:text-white border-l-[3px] border-transparent pl-[9px]'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0 text-white" />
                {!collapsed && (
                  <span className="truncate flex-1">{item.label}</span>
                )}
                {!collapsed && item.dot && (
                  <span
                    className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0"
                    title="Action needed"
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-2 border-t border-[#00225D] bg-[#002B7A]">
          <button
            onClick={handleLogout}
            title={collapsed ? 'Sign Out' : undefined}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[12px] text-white/80 hover:text-white hover:bg-white/10 rounded-[3px] transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
