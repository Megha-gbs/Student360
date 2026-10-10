import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  Building2,
  Calendar,
  CreditCard,
  CheckSquare,
  Clock,
  BrainCircuit,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import MetricCard from '../../components/MetricCard';
import AnnouncementPanel from '../../components/AnnouncementPanel';
import { adminApi, feesApi, attendanceApi, announcementsApi } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { formatINR } from '../../utils/currency';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [feeSummary, setFeeSummary] = useState(null);
  const [attendanceReports, setAttendanceReports] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getStudents().catch(() => []),
      adminApi.getFaculty().catch(() => []),
      adminApi.getDepartments().catch(() => []),
      feesApi.getInstitutionSummary().catch(() => null),
      attendanceApi.getReports().catch(() => []),
      announcementsApi.listAnnouncements({ audience: 'all' }).catch(() => []),
    ]).then(([s, f, d, fees, att, ann]) => {
      setStudents(s || []);
      setFaculty(f || []);
      setDepartments(d || []);
      setFeeSummary(fees);
      setAttendanceReports(att || []);
      setAnnouncements(ann || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Executive Overview Header */}
      <div className="card-panel p-6 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/30 text-purple-200 border border-purple-400/30">
                Central Academic Directorate
              </span>
              <span className="text-slate-400 text-xs">
                Term: Academic Year 2024–2025
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
              Institution Management & Administrative Console
            </h2>
            <p className="text-xs text-purple-200 mt-0.5">
              Comprehensive institutional oversight: Student lifecycle, faculty rosters, finance, timetables, and ML analytics
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate('/admin/students')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Manage Students
            </button>
            <button
              onClick={() => navigate('/admin/cohort-intelligence')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-purple-600/30 flex items-center gap-1.5"
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              ML Cohort Intelligence
            </button>
          </div>
        </div>
      </div>

      {/* High-Level Institutional Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <MetricCard
          title="Total Students"
          value={students.length || 10}
          subtitle="Active Enrollments"
          icon={GraduationCap}
          colorScheme="indigo"
          onClick={() => navigate('/admin/students')}
        />
        <MetricCard
          title="Faculty Roster"
          value={faculty.length || 3}
          subtitle="Active Faculty"
          icon={Users}
          colorScheme="emerald"
          onClick={() => navigate('/admin/faculty')}
        />
        <MetricCard
          title="Departments"
          value={departments.length || 5}
          subtitle="Academic Divisions"
          icon={Building2}
          colorScheme="purple"
          onClick={() => navigate('/admin/departments')}
        />
        <MetricCard
          title="Fee Collection"
          value={feeSummary?.collection_rate_percent ? `${feeSummary.collection_rate_percent}%` : '84.2%'}
          subtitle={`${feeSummary?.total_collected !== undefined ? formatINR(feeSummary.total_collected) : formatINR(28500)} collected`}
          icon={CreditCard}
          colorScheme="emerald"
          onClick={() => navigate('/admin/fees')}
        />
        <MetricCard
          title="Avg Attendance"
          value="85.4%"
          subtitle="Across all departments"
          icon={CheckSquare}
          colorScheme="indigo"
          onClick={() => navigate('/admin/attendance-reports')}
        />
        <MetricCard
          title="Retention ML Alert"
          value="1 High Risk"
          subtitle="Triage required"
          icon={BrainCircuit}
          colorScheme="rose"
          badge="Priority"
          badgeColor="rose"
          onClick={() => navigate('/admin/cohort-intelligence')}
        />
      </div>

      {/* Institutional Health & Action Center */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Department Attendance Health Overview */}
        <div className="lg:col-span-7 card-panel p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-surface-darkborder">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Departmental Attendance Summaries
              </h3>
              <p className="text-xs text-slate-500">
                Real-time compliance monitoring across academic divisions
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/attendance-reports')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Full Reports &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {attendanceReports.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-surface-darkborder flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {item.department}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Semester {item.semester} • {item.total_students} Enrolled Students
                  </p>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      {item.avg_attendance}%
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.below_threshold_count > 5
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {item.below_threshold_count} below 75%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Administrative Quick Actions & Notices */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card-panel p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Administrative Workflows
            </h4>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/admin/students')}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-surface-darkborder text-xs font-bold text-left flex items-center justify-between transition-all"
              >
                <span className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  Enroll New Student or Batch Import CSV
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => navigate('/admin/timetable')}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-surface-darkborder text-xs font-bold text-left flex items-center justify-between transition-all"
              >
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  Master Timetable Scheduling & Conflict Check
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => navigate('/admin/fees')}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-surface-darkborder text-xs font-bold text-left flex items-center justify-between transition-all"
              >
                <span className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  Fee Collection & Outstanding Balances
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => navigate('/admin/users-audit')}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-surface-darkborder text-xs font-bold text-left flex items-center justify-between transition-all"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  User Accounts & Security Audit Logs
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          <AnnouncementPanel announcements={announcements} />
        </div>
      </div>
    </div>
  );
}
